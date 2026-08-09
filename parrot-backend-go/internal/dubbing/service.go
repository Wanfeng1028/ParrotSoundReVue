package dubbing

import (
	"context"
	"encoding/json"
	"fmt"

	"parrot-backend-go/internal/config"
	"parrot-backend-go/internal/task"
)

// Service 配音业务逻辑层
type Service struct {
	repo *Repository
	queue *task.Queue
	cfg   *config.Config
}

func NewService(repo *Repository, queue *task.Queue, cfg *config.Config) *Service {
	return &Service{repo: repo, queue: queue, cfg: cfg}
}

// GetOptions 返回配音选项（音色 + 情感 + 模型）
func (s *Service) GetOptions(userID uint) (interface{}, error) {
	voices, err := s.repo.GetVoices(userID)
	if err != nil {
		return nil, err
	}

	voiceList := make([]map[string]interface{}, len(voices))
	for i, v := range voices {
		voiceList[i] = map[string]interface{}{
			"id":             v.ID,
			"name":           v.Name,
			"tag":            v.Tag,
			"avatar":         v.CoverURL,
			"sampleAudioUrl": v.SampleAudioURL,
		}
	}

	models := s.listModels()
	var currentModel interface{}
	for _, m := range models {
		if m["isDefault"].(bool) {
			currentModel = m
			break
		}
	}

	return map[string]interface{}{
		"voices":       voiceList,
		"emotions":     []string{"默认", "热情", "轻松", "友好", "严肃", "兴奋"},
		"models":       models,
		"currentModel": currentModel,
	}, nil
}

// listModels 从配置生成模型列表
func (s *Service) listModels() []map[string]interface{} {
	models := make([]map[string]interface{}, len(s.cfg.AIModels))
	for i, id := range s.cfg.AIModels {
		models[i] = map[string]interface{}{
			"id":        id,
			"provider":  "openai",
			"label":     id,
			"isDefault": id == s.cfg.AIDefaultModel,
		}
	}
	return models
}

// GenerateDraft 入队 AI 生成文案任务
func (s *Service) GenerateDraft(ctx context.Context, userID uint, prompt, model string) (string, error) {
	payload := task.DubbingDraftPayload{
		UserID: userID,
		Prompt: prompt,
		Model:  model,
	}
	return s.enqueueTask(ctx, task.TypeDubbingDraft, userID, payload)
}

// Preview 入队试听配音任务
func (s *Service) Preview(ctx context.Context, userID uint, text string, voiceID uint, title string, settings json.RawMessage) (string, error) {
	// 校验音色
	voice, err := s.repo.GetVoiceByID(voiceID, userID)
	if err != nil || voice == nil {
		return "", fmt.Errorf("请选择有效的音色")
	}

	payload := task.DubbingAudioPayload{
		UserID:   userID,
		Text:     text,
		VoiceID:  voiceID,
		Title:    title,
		Settings: settings,
	}
	return s.enqueueTask(ctx, task.TypeDubbingPreview, userID, payload)
}

// Export 入队导出配音任务
func (s *Service) Export(ctx context.Context, userID uint, text string, voiceID uint, title string, settings json.RawMessage) (string, error) {
	voice, err := s.repo.GetVoiceByID(voiceID, userID)
	if err != nil || voice == nil {
		return "", fmt.Errorf("请选择有效的音色")
	}

	payload := task.DubbingAudioPayload{
		UserID:   userID,
		Text:     text,
		VoiceID:  voiceID,
		Title:    title,
		Settings: settings,
	}
	return s.enqueueTask(ctx, task.TypeDubbingExport, userID, payload)
}

// enqueueTask 创建 DB 记录 + 入队 Asynq
func (s *Service) enqueueTask(ctx context.Context, taskType string, userID uint, payload interface{}) (string, error) {
	taskID, err := s.queue.CreateTask(taskType, userID, payload)
	if err != nil {
		return "", err
	}

	payloadBytes, _ := json.Marshal(payload)
	if err := s.queue.EnqueueTask(ctx, taskType, payloadBytes, taskID); err != nil {
		// 入队失败，标记任务失败
		s.queue.MarkFailed(taskID, "入队失败: "+err.Error())
		return "", err
	}

	return taskID, nil
}
