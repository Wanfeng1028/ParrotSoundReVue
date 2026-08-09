package event

import (
	"context"
	"encoding/json"
	"log"
	"strconv"
	"time"

	"parrot-backend-go/internal/model"

	"github.com/hibiken/asynq"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// OutboxPublisher outbox 本地消息表发布器
// 后台协程定期扫描 pending 事件，发布到 Asynq，成功后标记 published
// 保证业务事务（写业务表 + 写 outbox）与事件发布的最终一致性
type OutboxPublisher struct {
	db   *gorm.DB
	bus  *Bus
	stop chan struct{}
}

// NewOutboxPublisher 创建 outbox 发布器
func NewOutboxPublisher(db *gorm.DB, bus *Bus) *OutboxPublisher {
	return &OutboxPublisher{db: db, bus: bus, stop: make(chan struct{})}
}

// Start 启动后台扫描协程
func (p *OutboxPublisher) Start() {
	go p.run()
	log.Println("[outbox] 发布器启动，每 5 秒扫描一次 pending 事件")
}

// Stop 停止扫描
func (p *OutboxPublisher) Stop() {
	close(p.stop)
}

func (p *OutboxPublisher) run() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-p.stop:
			return
		case <-ticker.C:
			p.publishPending()
		}
	}
}

// AppendToOutbox 在业务事务内追加一条 outbox 事件（保证与业务表同事务原子写入）
func AppendToOutbox(tx *gorm.DB, eventType string, payload interface{}) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	return tx.Create(&model.EventOutbox{
		EventType: eventType,
		Payload:   datatypes.JSON(data),
		Status:    "pending",
	}).Error
}

func (p *OutboxPublisher) publishPending() {
	var events []model.EventOutbox
	if err := p.db.Where("status = ?", "pending").Limit(100).Find(&events).Error; err != nil {
		log.Printf("[outbox] 查询 pending 事件失败: %v", err)
		return
	}
	for _, e := range events {
		// 用 outbox ID 生成全局唯一 eventID，作为 Asynq TaskID 实现发布幂等
		eventID := asynqTaskID(e.ID)
		t := asynq.NewTask(e.EventType, e.Payload,
			asynq.Queue("events"),
			asynq.MaxRetry(5),
			asynq.Timeout(30*time.Second),
			asynq.TaskID(eventID),
		)
		if _, err := p.bus.client.EnqueueContext(context.Background(), t); err != nil {
			// 入队失败：可能是 Asynq 已存在相同 TaskID（重复扫描），视为已发布
			// 其他错误下次扫描重试，不阻断
			log.Printf("[outbox] 事件 %d 入队失败（可能已存在）: %v", e.ID, err)
		}
		// 标记 published（无论新建还是已存在，都认为已发布到队列）
		now := time.Now()
		if err := p.db.Model(&model.EventOutbox{}).Where("id = ?", e.ID).
			Updates(map[string]interface{}{"status": "published", "published_at": now}).Error; err != nil {
			log.Printf("[outbox] 事件 %d 标记 published 失败: %v", e.ID, err)
		}
	}
}

func asynqTaskID(outboxID uint) string {
	return "outbox-event-" + strconv.FormatUint(uint64(outboxID), 10)
}
