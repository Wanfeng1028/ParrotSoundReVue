package task

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"parrot-backend-go/internal/ai"
	"parrot-backend-go/internal/event"
	"parrot-backend-go/internal/model"

	"github.com/hibiken/asynq"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// Handlers Asynq 任务处理器集合
type Handlers struct {
	queue *Queue
	ai    *ai.Client
	db    *gorm.DB
}

func NewHandlers(queue *Queue, aiClient *ai.Client, db *gorm.DB) *Handlers {
	return &Handlers{queue: queue, ai: aiClient, db: db}
}

// Register 注册所有任务处理器到 mux
func (h *Handlers) Register(mux *asynq.ServeMux) {
	mux.HandleFunc(TypeDubbingDraft, h.HandleDubbingDraft)
	mux.HandleFunc(TypeDubbingPreview, h.HandleDubbingPreview)
	mux.HandleFunc(TypeDubbingExport, h.HandleDubbingExport)
}

// HandleDubbingDraft AI 生成配音文案
func (h *Handlers) HandleDubbingDraft(ctx context.Context, t *asynq.Task) error {
	taskID := t.ResultWriter().TaskID()

	// 原子抢占，抢不到说明已被处理
	if !h.queue.claimTask(taskID) {
		return nil
	}

	var payload DubbingDraftPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		h.queue.MarkFailed(taskID, "payload 解析失败")
		return nil // 不可重试
	}

	h.queue.updateProgress(taskID, 30)

	// AI 调用（60秒超时）
	aiCtx, cancel := context.WithTimeout(ctx, 60*time.Second)
	defer cancel()

	prompt := fmt.Sprintf("根据以下需求生成一段适合语音配音的中文文稿，要求自然、可朗读：%s", payload.Prompt)
	content, err := h.ai.BuildDraft(aiCtx, prompt, "dubbing", payload.Model)
	if err != nil {
		if ai.IsRetryable(err) {
			h.queue.logTaskError(taskID, err)
			return err // 返回 err → Asynq 重试
		}
		h.queue.MarkFailed(taskID, err.Error())
		return nil // 不可重试，终结任务
	}

	h.queue.markCompleted(taskID, map[string]string{"content": content})
	return nil
}

// HandleDubbingPreview 试听配音：创建 job 记录
func (h *Handlers) HandleDubbingPreview(ctx context.Context, t *asynq.Task) error {
	taskID := t.ResultWriter().TaskID()

	if !h.queue.claimTask(taskID) {
		return nil
	}

	var payload DubbingAudioPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		h.queue.MarkFailed(taskID, "payload 解析失败")
		return nil
	}

	h.queue.updateProgress(taskID, 50)

	// 查 voice
	var voice model.Voice
	if err := h.db.First(&voice, payload.VoiceID).Error; err != nil {
		h.queue.MarkFailed(taskID, "音色不存在")
		return nil
	}

	// 创建 job 记录
	title := payload.Title
	if title == "" {
		if len(payload.Text) > 12 {
			title = payload.Text[:12] + "..."
		} else {
			title = payload.Text
		}
	}

	job := &model.Job{
		UserID:    payload.UserID,
		Type:      "audio",
		Title:     title,
		Text:      payload.Text,
		VoiceID:   &payload.VoiceID,
		VoiceName: voice.Name,
		Status:    "completed",
		AudioURL:  voice.SampleAudioURL,
		Settings:  datatypes.JSON(payload.Settings),
	}
	if err := h.db.Create(job).Error; err != nil {
		h.queue.logTaskError(taskID, err)
		return err
	}

	h.queue.markCompleted(taskID, job)
	return nil
}

// HandleDubbingExport 导出配音：创建 job + 发通知
func (h *Handlers) HandleDubbingExport(ctx context.Context, t *asynq.Task) error {
	taskID := t.ResultWriter().TaskID()

	if !h.queue.claimTask(taskID) {
		return nil
	}

	var payload DubbingAudioPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		h.queue.MarkFailed(taskID, "payload 解析失败")
		return nil
	}

	h.queue.updateProgress(taskID, 50)

	// 查 voice
	var voice model.Voice
	if err := h.db.First(&voice, payload.VoiceID).Error; err != nil {
		h.queue.MarkFailed(taskID, "音色不存在")
		return nil
	}

	// 创建 job 记录 + 写 outbox 事件（同一事务，保证业务与事件原子性）
	// 阶段 2.4：不再直接写 notifications 表（归 user-service），
	// 改为写 event_outbox，由后台协程发布事件，user-service 消费后写通知
	title := payload.Title
	if title == "" {
		title = "导出音频"
	}

	job := &model.Job{
		UserID:    payload.UserID,
		Type:      "audio",
		Title:     title,
		Text:      payload.Text,
		VoiceID:   &payload.VoiceID,
		VoiceName: voice.Name,
		Status:    "completed",
		AudioURL:  voice.SampleAudioURL,
		Settings:  datatypes.JSON(payload.Settings),
	}
	err := h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(job).Error; err != nil {
			return err
		}
		return event.AppendToOutbox(tx, event.EventDubbingExportDone,
			event.DubbingExportDoneEvent{
				UserID: payload.UserID,
				JobID:  job.ID,
				Title:  job.Title,
			})
	})
	if err != nil {
		h.queue.logTaskError(taskID, err)
		return err
	}

	h.queue.markCompleted(taskID, job)
	return nil
}
