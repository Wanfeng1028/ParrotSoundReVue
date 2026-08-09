package database

import (
	"log"

	"parrot-backend-go/internal/config"
	"parrot-backend-go/internal/model"

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
	); err != nil {
		log.Fatalf("数据库迁移失败: %v", err)
	}

	seedVoices(db)

	log.Println("PostgreSQL 连接成功，表结构已迁移")
	return db
}

// seedVoices 插入测试音色数据（仅在 voices 表为空时）
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
