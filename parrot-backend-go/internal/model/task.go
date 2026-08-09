package model

import (
	"time"

	"gorm.io/datatypes"
)

// Task 异步任务表，状态机：queued → running → completed/failed
type Task struct {
	ID        string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"taskId"`
	Type      string         `gorm:"size:50;not null;index" json:"type"`
	UserID    uint           `gorm:"not null;index" json:"userId"`
	Status    string         `gorm:"size:20;not null;default:queued;index" json:"status"` // queued/running/completed/failed
	Progress  int            `gorm:"default:0" json:"progress"`
	Payload   datatypes.JSON `gorm:"type:jsonb" json:"payload"`
	Result    datatypes.JSON `gorm:"type:jsonb" json:"result"`
	Error     string         `gorm:"type:text" json:"error"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `gorm:"index" json:"updatedAt"`
}

func (Task) TableName() string { return "tasks" }
