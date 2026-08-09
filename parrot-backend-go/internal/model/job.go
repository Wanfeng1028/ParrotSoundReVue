package model

import (
	"time"

	"gorm.io/datatypes"
)

// Job 配音记录/音频记录表
type Job struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	UserID    uint           `gorm:"not null;index" json:"userId"`
	Type      string         `gorm:"size:20;not null;default:audio" json:"type"` // audio/video
	Title     string         `gorm:"size:200" json:"title"`
	Text      string         `gorm:"type:text" json:"text"`
	VoiceID   *uint          `gorm:"index" json:"voiceId"`
	VoiceName string         `gorm:"size:100" json:"voiceName"`
	Status    string         `gorm:"size:20;default:completed" json:"status"`
	AudioURL  string         `gorm:"size:500" json:"audioUrl"`
	Settings  datatypes.JSON `gorm:"type:jsonb" json:"settings"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
}

func (Job) TableName() string { return "jobs" }

// Voice 音色表
type Voice struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	UserID         uint      `gorm:"index" json:"userId"`
	Name           string    `gorm:"size:100;not null" json:"name"`
	Description    string    `gorm:"type:text" json:"description"`
	Tag            string    `gorm:"size:50" json:"tag"`
	Language       string    `gorm:"size:10;default:cn" json:"language"`
	Visibility     string    `gorm:"size:20;default:private" json:"visibility"` // public/private
	CoverURL       string    `gorm:"size:500" json:"coverUrl"`
	SampleAudioURL string    `gorm:"size:500" json:"sampleAudioUrl"`
	PlayCount      int       `gorm:"default:0" json:"playCount"`
	LikeCount      int       `gorm:"default:0" json:"likeCount"`
	FavoriteCount  int       `gorm:"default:0" json:"favoriteCount"`
	UseCount       int       `gorm:"default:0" json:"useCount"`
	CreatedAt      time.Time `json:"createdAt"`
}

func (Voice) TableName() string { return "voices" }

// Notification 通知表
type Notification struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;index" json:"userId"`
	Type      string    `gorm:"size:20;default:info" json:"type"` // info/success/warning/error
	Title     string    `gorm:"size:200" json:"title"`
	Desc      string    `gorm:"type:text" json:"desc"`
	IsRead    bool      `gorm:"default:false;index:idx_user_read" json:"isRead"`
	EventID   string    `gorm:"uniqueIndex;size:36" json:"eventId"` // 幂等键
	CreatedAt time.Time `json:"createdAt"`
}

func (Notification) TableName() string { return "notifications" }
