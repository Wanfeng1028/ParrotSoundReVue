package model

import (
	"time"

	"gorm.io/datatypes"
)

// TeachingProject 教学项目
type TeachingProject struct {
	ID              uint           `gorm:"primaryKey" json:"id"`
	UserID          uint           `gorm:"not null;index" json:"userId"`
	Title           string         `gorm:"size:200;not null" json:"title"`
	Script          string         `gorm:"type:text" json:"script"`
	Ratio           string         `gorm:"size:10;default:16:9" json:"ratio"`
	Resolution      string         `gorm:"size:10;default:1080P" json:"resolution"`
	Bitrate         string         `gorm:"size:20;default:default" json:"bitrate"`
	SubtitleEnabled bool           `gorm:"default:true" json:"subtitleEnabled"`
	VoiceID         *uint          `json:"voiceId"`
	VoiceName       string         `gorm:"size:100" json:"voiceName"`
	SpeakerID       string         `gorm:"size:100" json:"speakerId"`
	SpeakerName     string         `gorm:"size:100" json:"speakerName"`
	BackgroundID    string         `gorm:"size:100" json:"backgroundId"`
	BackgroundName  string         `gorm:"size:100" json:"backgroundName"`
	Status          string         `gorm:"size:20;default:draft" json:"status"` // draft/generating/completed
	Mode            string         `gorm:"size:20;default:course" json:"mode"`
	Slides          datatypes.JSON `gorm:"type:jsonb" json:"slides"`
	CreatedAt       time.Time      `json:"createdAt"`
	UpdatedAt       time.Time      `json:"updatedAt"`
}

func (TeachingProject) TableName() string { return "teaching_projects" }

// Interaction 互动记录（点赞/收藏/使用）
type Interaction struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;index" json:"userId"`    // 音色所有者
	ActorID   uint      `gorm:"not null;index" json:"actorId"`   // 操作者
	VoiceID   uint      `gorm:"not null;index" json:"voiceId"`
	Type      string    `gorm:"size:20;not null" json:"type"` // like/favorite/use
	CreatedAt time.Time `json:"createdAt"`
}

func (Interaction) TableName() string { return "interactions" }

// Feedback 用户反馈
type Feedback struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;index" json:"userId"`
	UsageTime string    `gorm:"size:50;default:不到 1 个月" json:"usageTime"`
	Content   string    `gorm:"type:text;not null" json:"content"`
	Status    string    `gorm:"size:20;default:pending" json:"status"` // pending/processed
	CreatedAt time.Time `json:"createdAt"`
}

func (Feedback) TableName() string { return "feedbacks" }

// Tutorial 教程
type Tutorial struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Category  string    `gorm:"size:50;index" json:"category"`
	Title     string    `gorm:"size:200;not null" json:"title"`
	Duration  string    `gorm:"size:20" json:"duration"`
	Cover     string    `gorm:"size:500" json:"cover"`
	Summary   string    `gorm:"type:text" json:"summary"`
	Content   string    `gorm:"type:text" json:"content"`
	CreatedAt time.Time `json:"createdAt"`
}

func (Tutorial) TableName() string { return "tutorials" }

// Admin 管理员
type Admin struct {
	ID              uint           `gorm:"primaryKey" json:"id"`
	Username        string         `gorm:"uniqueIndex;size:100;not null" json:"username"`
	PasswordHash    string         `gorm:"size:255;not null" json:"-"`
	Phone           string         `gorm:"size:50" json:"phone"`
	Age             string         `gorm:"size:20" json:"age"`
	Gender          string         `gorm:"size:20;default:未设置" json:"gender"`
	AvatarURL       string         `gorm:"size:500" json:"avatarUrl"`
	SecurityAnswers datatypes.JSON `gorm:"type:jsonb" json:"securityAnswers"`
	Status          string         `gorm:"size:20;default:active" json:"status"` // active/disabled
	CreatedAt       time.Time      `json:"createdAt"`
	UpdatedAt       time.Time      `json:"updatedAt"`
}

func (Admin) TableName() string { return "admins" }
