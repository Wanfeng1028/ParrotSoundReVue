package model

import (
	"time"

	"gorm.io/datatypes"
)

// EventOutbox 事件本地消息表（跨服务最终一致性）
// 业务事务里同时写业务表 + outbox 表，后台协程扫描 pending 事件发布到 Asynq
type EventOutbox struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	EventType   string         `gorm:"size:50;not null;index" json:"eventType"`
	Payload     datatypes.JSON `gorm:"type:jsonb;not null" json:"payload"`
	Status      string         `gorm:"size:20;not null;default:pending;index" json:"status"` // pending | published
	CreatedAt   time.Time      `json:"createdAt"`
	PublishedAt *time.Time     `json:"publishedAt"`
}

func (EventOutbox) TableName() string { return "event_outbox" }
