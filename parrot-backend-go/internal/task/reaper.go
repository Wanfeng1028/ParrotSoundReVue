package task

import (
	"log"
	"time"

	"parrot-backend-go/internal/model"

	"gorm.io/gorm"
)

// Reaper 清理卡死的 running 任务，按任务类型配置不同超时阈值
type Reaper struct {
	db       *gorm.DB
	timeouts map[string]time.Duration
}

// NewReaper 创建 Reaper，传入按任务类型配置的超时映射
func NewReaper(db *gorm.DB, timeouts map[string]time.Duration) *Reaper {
	return &Reaper{db: db, timeouts: timeouts}
}

// Start 启动后台清理协程，每分钟扫描一次
func (r *Reaper) Start() {
	go func() {
		ticker := time.NewTicker(time.Minute)
		log.Println("[Reaper] 启动，每分钟扫描卡死的 running 任务")
		for range ticker.C {
			r.scan()
		}
	}()
}

func (r *Reaper) scan() {
	for taskType, timeout := range r.timeouts {
		cutoff := time.Now().Add(-timeout)
		result := r.db.Model(&model.Task{}).
			Where("type = ? AND status = ? AND updated_at < ?", taskType, "running", cutoff).
			Updates(map[string]interface{}{
				"status": "failed",
				"error":  "Worker 超时未响应（Reaper 清理）",
			})
		if result.RowsAffected > 0 {
			log.Printf("[Reaper] 清理 %d 个超时的 %s 任务", result.RowsAffected, taskType)
		}
	}
}

// DefaultTimeouts 返回默认的任务超时配置
func DefaultTimeouts() map[string]time.Duration {
	return map[string]time.Duration{
		TypeDubbingDraft:   5 * time.Minute,
		TypeDubbingPreview: 20 * time.Minute,
		TypeDubbingExport:  20 * time.Minute,
	}
}
