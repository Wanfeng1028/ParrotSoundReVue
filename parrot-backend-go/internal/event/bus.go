package event

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/hibiken/asynq"
)

// Bus 事件总线：封装 Asynq Client，把事件当任务入队 events 队列
// 复用 Asynq 做事件总线，不引入 Kafka/NATS，事件天然持久化、可重试
type Bus struct {
	client *asynq.Client
}

// NewBus 创建事件总线
func NewBus(redisURL string) *Bus {
	return &Bus{client: asynq.NewClient(asynq.RedisClientOpt{Addr: redisURL})}
}

// Close 关闭连接
func (b *Bus) Close() error {
	return b.client.Close()
}

// Publish 同步发布事件（供网关等不需要 outbox 的场景使用）
// eventID 作为 Asynq TaskID，天然幂等：相同 eventID 重复入队会报错，调用方需忽略
func (b *Bus) Publish(ctx context.Context, eventType string, payload interface{}, eventID string) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal event payload: %w", err)
	}
	t := asynq.NewTask(eventType, data,
		asynq.Queue("events"),
		asynq.MaxRetry(5),
		asynq.Timeout(30*time.Second),
		asynq.TaskID(eventID),
	)
	if _, err := b.client.EnqueueContext(ctx, t); err != nil {
		// Asynq 已存在相同 TaskID 时返回错误，属幂等正常情况
		return err
	}
	return nil
}
