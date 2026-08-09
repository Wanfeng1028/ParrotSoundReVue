package event

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"parrot-backend-go/internal/model"

	"github.com/hibiken/asynq"
	"gorm.io/gorm"
)

// EventHandlers 事件消费者集合
// 在 user-service 内运行，消费 events 队列，幂等写入 notifications 表
type EventHandlers struct {
	db *gorm.DB
}

// NewEventHandlers 创建事件处理器
func NewEventHandlers(db *gorm.DB) *EventHandlers {
	return &EventHandlers{db: db}
}

// Register 注册所有事件处理器到 mux
func (h *EventHandlers) Register(mux *asynq.ServeMux) {
	mux.HandleFunc(EventDubbingExportDone, h.handleDubbingExportDone)
	mux.HandleFunc(EventVoiceCloneCompleted, h.handleVoiceCloneCompleted)
	mux.HandleFunc(EventFeedbackReceived, h.handleFeedbackReceived)
}

// handleDubbingExportDone 配音导出完成 → 写通知
func (h *EventHandlers) handleDubbingExportDone(ctx context.Context, t *asynq.Task) error {
	var e DubbingExportDoneEvent
	if err := json.Unmarshal(t.Payload(), &e); err != nil {
		log.Printf("[event] %s payload 解析失败: %v", EventDubbingExportDone, err)
		return nil // payload 错误，不可重试
	}
	notif := &model.Notification{
		UserID:  e.UserID,
		Type:    "info",
		Title:   "音频导出完成",
		Desc:    fmt.Sprintf("作品「%s」已进入音频记录。", e.Title),
		EventID: t.ResultWriter().TaskID(),
	}
	return h.createNotification(notif)
}

// handleVoiceCloneCompleted 声音克隆完成 → 写通知
func (h *EventHandlers) handleVoiceCloneCompleted(ctx context.Context, t *asynq.Task) error {
	var e VoiceCloneCompletedEvent
	if err := json.Unmarshal(t.Payload(), &e); err != nil {
		log.Printf("[event] %s payload 解析失败: %v", EventVoiceCloneCompleted, err)
		return nil
	}
	notif := &model.Notification{
		UserID:  e.UserID,
		Type:    "info",
		Title:   "声音模型创建成功",
		Desc:    fmt.Sprintf("模型「%s」已加入你的声音库。", e.Name),
		EventID: t.ResultWriter().TaskID(),
	}
	return h.createNotification(notif)
}

// handleFeedbackReceived 反馈已收到 → 写通知
func (h *EventHandlers) handleFeedbackReceived(ctx context.Context, t *asynq.Task) error {
	var e FeedbackReceivedEvent
	if err := json.Unmarshal(t.Payload(), &e); err != nil {
		log.Printf("[event] %s payload 解析失败: %v", EventFeedbackReceived, err)
		return nil
	}
	notif := &model.Notification{
		UserID:  e.UserID,
		Type:    "system",
		Title:   "反馈已收到",
		Desc:    "感谢你的建议，我们会持续优化产品体验。",
		EventID: t.ResultWriter().TaskID(),
	}
	return h.createNotification(notif)
}

// createNotification 幂等写通知：用 event_id 唯一键 + FirstOrCreate 防重复消费
func (h *EventHandlers) createNotification(notif *model.Notification) error {
	return h.db.Where("event_id = ?", notif.EventID).FirstOrCreate(notif).Error
}

// StartEventWorker 启动事件消费 Worker（在 user-service 内运行）
// 独立消费 events 队列，与任务队列隔离
func StartEventWorker(redisURL string, handlers *EventHandlers) *asynq.Server {
	srv := asynq.NewServer(
		asynq.RedisClientOpt{Addr: redisURL},
		asynq.Config{
			Concurrency: 5,
			Queues: map[string]int{
				"events": 10,
			},
		},
	)

	mux := asynq.NewServeMux()
	handlers.Register(mux)

	go func() {
		log.Printf("[EventWorker] 事件消费者启动，监听 events 队列")
		if err := srv.Run(mux); err != nil {
			log.Printf("[EventWorker] 启动失败: %v", err)
		}
	}()

	return srv
}
