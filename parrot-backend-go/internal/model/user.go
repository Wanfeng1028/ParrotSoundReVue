package model

import (
	"time"

	"gorm.io/datatypes"
)

// User 用户表，与 Node 版字段对齐
type User struct {
	ID               uint           `gorm:"primaryKey" json:"id"`
	Email            string         `gorm:"uniqueIndex;size:255;not null" json:"email"`
	PasswordHash     string         `gorm:"size:255;not null" json:"-"`
	Username         string         `gorm:"size:100" json:"username"`
	Phone            string         `gorm:"size:50" json:"phone"`
	Age              string         `gorm:"size:20" json:"age"`
	Gender           string         `gorm:"size:20;default:'未设置'" json:"gender"`
	AvatarURL        string         `gorm:"size:500" json:"avatarUrl"`
	SecurityAnswers  datatypes.JSON `gorm:"type:jsonb" json:"securityAnswers"`
	Role             string         `gorm:"size:20;default:user" json:"role"`     // user | admin
	Status           string         `gorm:"size:20;default:active" json:"status"` // active | disabled
	CreatedAt        time.Time      `json:"createdAt"`
	UpdatedAt        time.Time      `json:"updatedAt"`
}

// TableName 指定表名
func (User) TableName() string {
	return "users"
}
