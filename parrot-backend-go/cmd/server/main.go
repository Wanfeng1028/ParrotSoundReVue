package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"parrot-backend-go/internal/admin"
	"parrot-backend-go/internal/ai"
	"parrot-backend-go/internal/auth"
	"parrot-backend-go/internal/cache"
	"parrot-backend-go/internal/community"
	"parrot-backend-go/internal/config"
	"parrot-backend-go/internal/database"
	"parrot-backend-go/internal/dubbing"
	"parrot-backend-go/internal/help"
	"parrot-backend-go/internal/router"
	"parrot-backend-go/internal/system"
	"parrot-backend-go/internal/task"
	"parrot-backend-go/internal/teaching"
	"parrot-backend-go/internal/user"
	"parrot-backend-go/internal/voice"
)

func main() {
	cfg := config.Load()

	// 基础设施
	db := database.InitPostgres(cfg)
	redisCache := cache.New(cfg.RedisURL)
	aiClient := ai.New(cfg.AIBaseURL, cfg.AIAPIKey, cfg.AIDefaultModel)

	// 任务队列 + Worker + Reaper
	taskQueue := task.NewQueue(db, cfg.RedisURL)
	defer taskQueue.Close()
	taskHandlers := task.NewHandlers(taskQueue, aiClient, db)
	task.StartWorker(cfg.RedisURL, cfg.QueueConcurrency, taskHandlers)
	reaper := task.NewReaper(db, task.DefaultTimeouts())
	reaper.Start()

	// 业务域 handler
	authRepo := auth.NewRepository(db)
	authService := auth.NewService(authRepo, redisCache, cfg.JWTSecret)
	authHandler := auth.NewHandler(authService)

	dubbingRepo := dubbing.NewRepository(db)
	dubbingService := dubbing.NewService(dubbingRepo, taskQueue, cfg)
	dubbingHandler := dubbing.NewHandler(dubbingService)

	taskHandler := task.NewTaskHandler(taskQueue)

	voiceHandler := voice.NewHandler(db, redisCache, aiClient)
	teachingHandler := teaching.NewHandler(db, taskQueue, cfg)
	communityHandler := community.NewHandler(db)
	helpHandler := help.NewHandler(db)
	userHandler := user.NewHandler(db)
	adminHandler := admin.NewHandler(db, cfg)
	systemHandler := system.NewHandler(cfg)

	// 路由
	deps := &router.Dependencies{
		DB: db, Cache: redisCache, Cfg: cfg,
		Auth: authHandler, Dubbing: dubbingHandler, Task: taskHandler,
		Voice: voiceHandler, Teaching: teachingHandler,
		Community: communityHandler, Help: helpHandler,
		User: userHandler, Admin: adminHandler, System: systemHandler,
	}
	r := router.Setup(deps)

	// 优雅关闭
	go func() {
		log.Printf("服务启动，监听 :%s", cfg.Port)
		if err := r.Run(":" + cfg.Port); err != nil {
			log.Fatalf("服务启动失败: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("服务关闭中...")
}
