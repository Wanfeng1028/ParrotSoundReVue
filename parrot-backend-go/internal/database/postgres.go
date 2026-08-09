package database

import (
	"log"

	"parrot-backend-go/internal/config"
	"parrot-backend-go/internal/model"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// InitPostgres 初始化 PostgreSQL 连接并自动迁移表结构
func InitPostgres(cfg *config.Config) *gorm.DB {
	db, err := gorm.Open(postgres.Open(cfg.PGDSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		log.Fatalf("PostgreSQL 连接失败: %v", err)
	}

	sqlDB, _ := db.DB()
	sqlDB.SetMaxOpenConns(20)
	sqlDB.SetMaxIdleConns(10)

	// 自动迁移
	if err := db.AutoMigrate(
		&model.User{},
		&model.Task{},
		&model.Job{},
		&model.Voice{},
		&model.Notification{},
		&model.TeachingProject{},
		&model.Interaction{},
		&model.Feedback{},
		&model.Tutorial{},
		&model.Admin{},
		&model.EventOutbox{},
	); err != nil {
		log.Fatalf("数据库迁移失败: %v", err)
	}

	seedVoices(db)
	seedAdmin(db)
	seedTutorials(db)

	log.Println("PostgreSQL 连接成功，表结构已迁移")
	return db
}

func seedVoices(db *gorm.DB) {
	var count int64
	db.Model(&model.Voice{}).Count(&count)
	if count > 0 {
		return
	}

	voices := []model.Voice{
		{Name: "温柔女声", Tag: "女声", Visibility: "public", Language: "cn", SampleAudioURL: "/api/media/demo-audio", Description: "温柔自然的女声，适合有声书和情感类内容"},
		{Name: "磁性男声", Tag: "男声", Visibility: "public", Language: "cn", SampleAudioURL: "/api/media/demo-audio", Description: "磁性沉稳的男声，适合纪录片和商务旁白"},
		{Name: "活泼少女", Tag: "女声", Visibility: "public", Language: "cn", SampleAudioURL: "/api/media/demo-audio", Description: "活泼可爱的少女音，适合游戏和动画配音"},
		{Name: "新闻主播", Tag: "中性", Visibility: "public", Language: "cn", SampleAudioURL: "/api/media/demo-audio", Description: "专业新闻播报音色，清晰权威"},
	}
	db.Create(&voices)
	log.Printf("已插入 %d 条测试音色数据", len(voices))
}

func seedAdmin(db *gorm.DB) {
	var count int64
	db.Model(&model.Admin{}).Count(&count)
	if count > 0 {
		return
	}

	hash, _ := bcrypt.GenerateFromPassword([]byte("admin123"), 10)
	admin := &model.Admin{
		Username:     "admin",
		PasswordHash: string(hash),
		Phone:        "",
		Gender:       "未设置",
		Status:       "active",
	}
	db.Create(admin)
	log.Println("已创建默认管理员: admin / admin123")
}

func seedTutorials(db *gorm.DB) {
	var count int64
	db.Model(&model.Tutorial{}).Count(&count)
	if count > 0 {
		return
	}

	tutorials := []model.Tutorial{
		{Category: "入门", Title: "如何创建你的第一个配音", Duration: "5分钟", Summary: "从零开始，快速上手配音创作流程。"},
		{Category: "入门", Title: "音色选择指南", Duration: "3分钟", Summary: "了解不同音色的特点，选择最适合你的声音。"},
		{Category: "进阶", Title: "AI 文案生成技巧", Duration: "8分钟", Summary: "掌握 AI 生成高质量配音文案的提示词技巧。"},
		{Category: "进阶", Title: "教学课件制作", Duration: "10分钟", Summary: "使用教学模块快速生成专业课件内容。"},
		{Category: "高级", Title: "声音克隆实战", Duration: "15分钟", Summary: "从音频样本到自定义音色的完整流程。"},
		{Category: "高级", Title: "社区分享与互动", Duration: "6分钟", Summary: "将你的作品分享到社区，获取更多反馈。"},
	}
	db.Create(&tutorials)
	log.Printf("已插入 %d 条教程数据", len(tutorials))
}
