package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"parrot-backend-go/internal/ai"
	"parrot-backend-go/internal/auth"
	"parrot-backend-go/internal/cache"
	"parrot-backend-go/internal/config"
	"parrot-backend-go/internal/database"
	"parrot-backend-go/internal/dubbing"
	"parrot-backend-go/internal/router"
	"parrot-backend-go/internal/task"
)

func main() {
	// 加载配置
	cfg := config.Load()

	// 初始化 PostgreSQL
	db := database.InitPostgres(cfg)

	// 初始化 Redis
	redisCache := cache.New(cfg.RedisURL)

	// 初始化 AI 客户端
	aiClient := ai.New(cfg.AIBaseURL, cfg.AIAPIKey, cfg.AIDefaultModel)

	// 初始化任务队列
	taskQueue := task.NewQueue(db, cfg.RedisURL)
	defer taskQueue.Close()

	// 初始化任务处理器 + 启动 Worker
	taskHandlers := task.NewHandlers(taskQueue, aiClient, db)
	task.StartWorker(cfg.RedisURL, cfg.QueueConcurrency, taskHandlers)

	// 初始化认证域
	authRepo := auth.NewRepository(db)
	authService := auth.NewService(authRepo, redisCache, cfg.JWTSecret)
	authHandler := auth.NewHandler(authService)

	// 初始化配音域
	dubbingRepo := dubbing.NewRepository(db)
	dubbingService := dubbing.NewService(dubbingRepo, taskQueue, cfg)
	dubbingHandler := dubbing.NewHandler(dubbingService)

	// 任务状态查询 handler
	taskHandler := task.NewTaskHandler(taskQueue)

	// 初始化路由
	deps := &router.Dependencies{
		DB:      db,
		Cache:   redisCache,
		Cfg:     cfg,
		Auth:    authHandler,
		Dubbing: dubbingHandler,
		Task:    taskHandler,
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
