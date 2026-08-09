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

	// 连接池配置
	sqlDB, _ := db.DB()
	sqlDB.SetMaxOpenConns(20)
	sqlDB.SetMaxIdleConns(10)

	// 自动迁移（阶段 1 用 AutoMigrate，生产环境用 migrations/ SQL 文件）
	if err := db.AutoMigrate(&model.User{}); err != nil {
		log.Fatalf("数据库迁移失败: %v", err)
	}

	log.Println("PostgreSQL 连接成功，表结构已迁移")
	return db
}

// TODO: InitSQLite 用于单元测试，阶段 1.6 补充
