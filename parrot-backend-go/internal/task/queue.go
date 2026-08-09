package task

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"parrot-backend-go/internal/model"

	"github.com/google/uuid"
	"github.com/hibiken/asynq"
	"gorm.io/gorm"
)

// Queue 任务队列封装：DB 记录 + Asynq 入队
type Queue struct {
	db     *gorm.DB
	client *asynq.Client
}

func NewQueue(db *gorm.DB, redisURL string) *Queue {
	return &Queue{
		db:     db,
		client: asynq.NewClient(asynq.RedisClientOpt{Addr: redisURL}),
	}
}

// Close 关闭 Asynq 客户端连接
func (q *Queue) Close() error {
	return q.client.Close()
}

// EnqueueTask 入队 Asynq 任务
func (q *Queue) EnqueueTask(ctx context.Context, taskType string, payload []byte, taskID string) error {
	task := asynq.NewTask(taskType, payload, asynq.TaskID(taskID))
	_, err := q.client.EnqueueContext(ctx, task,
		asynq.MaxRetry(3),
		asynq.Timeout(120*time.Second),
	)
	return err
}

// CreateTask 在 DB 中创建任务记录（status=queued），返回 taskID
func (q *Queue) CreateTask(taskType string, userID uint, payload interface{}) (string, error) {
	taskID := uuid.NewString()
	payloadJSON, _ := json.Marshal(payload)

	task := &model.Task{
		ID:       taskID,
		Type:     taskType,
		UserID:   userID,
		Status:   "queued",
		Progress: 0,
		Payload:  payloadJSON,
	}
	if err := q.db.Create(task).Error; err != nil {
		return "", fmt.Errorf("create task record: %w", err)
	}
	return taskID, nil
}

// GetTask 查询任务状态（给前端轮询用）
func (q *Queue) GetTask(taskID string, userID uint) (*model.Task, error) {
	var task model.Task
	err := q.db.Where("id = ? AND user_id = ?", taskID, userID).First(&task).Error
	if err != nil {
		return nil, err
	}
	return &task, nil
}

// claimTask 原子抢占：只有 status=queued 的任务才能被处理
func (q *Queue) claimTask(taskID string) bool {
	result := q.db.Model(&model.Task{}).
		Where("id = ? AND status = ?", taskID, "queued").
		Updates(map[string]interface{}{
			"status":   "running",
			"progress": 15,
		})
	return result.RowsAffected > 0
}

// markCompleted 标记任务完成
func (q *Queue) markCompleted(taskID string, result interface{}) {
	resultJSON, _ := json.Marshal(result)
	q.db.Model(&model.Task{}).Where("id = ?", taskID).Updates(map[string]interface{}{
		"status":   "completed",
		"progress": 100,
		"result":   resultJSON,
	})
}

// MarkFailed 标记任务失败（不可重试时调用，返回 nil 终结任务）
func (q *Queue) MarkFailed(taskID, errMsg string) {
	q.db.Model(&model.Task{}).Where("id = ?", taskID).Updates(map[string]interface{}{
		"status": "failed",
		"error":  errMsg,
	})
}

// updateProgress 更新进度
func (q *Queue) updateProgress(taskID string, progress int) {
	q.db.Model(&model.Task{}).Where("id = ?", taskID).Update("progress", progress)
}

// logTaskError 记录任务错误日志（不标记 failed，让 Asynq 重试）
func (q *Queue) logTaskError(taskID string, err error) {
	log.Printf("[TASK] %s error: %v", taskID, err)
}
