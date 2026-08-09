package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

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
	"parrot-backend-go/kitex_gen/dubbing/dubbingservice"

	"github.com/cloudwego/kitex/client"
	registryetcd "github.com/kitex-contrib/registry-etcd"
)

func main() {
	cfg := config.Load()

	// 基础设施
	db := database.InitPostgres(cfg)
	redisCache := cache.New(cfg.RedisURL)
	aiClient := ai.New(cfg.AIBaseURL, cfg.AIAPIKey, cfg.AIDefaultModel)

	// 任务队列 + Worker + Reaper
	// 阶段 2：网关仍保留 Worker 处理教学模块发起的配音任务（复用 TypeDubbingExport）
	// dubbing-service 也有自己的 Worker，两者共享同一 Redis 队列，Asynq 自动负载均衡
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

	// 阶段 2：配音模块通过 Kitex RPC 调用 dubbing-service
	dubbingClient := newDubbingClient(cfg)
	dubbingHandler := dubbing.NewHandler(dubbingClient)

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
		log.Printf("网关启动，监听 :%s", cfg.Port)
		if err := r.Run(":" + cfg.Port); err != nil {
			log.Fatalf("服务启动失败: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("服务关闭中...")
}

// newDubbingClient 创建 dubbing-service 的 Kitex 客户端
// 优先使用 etcd 服务发现；未配置 etcd 时回退到直连模式（本地开发用）
func newDubbingClient(cfg *config.Config) dubbingservice.Client {
	opts := []client.Option{
		client.WithRPCTimeout(10 * time.Second),
		client.WithConnectTimeout(3 * time.Second),
	}

	if cfg.EtcdAddr != "" {
		// etcd 服务发现模式
		r, err := registryetcd.NewEtcdResolver([]string{cfg.EtcdAddr})
		if err != nil {
			log.Fatalf("etcd resolver 初始化失败: %v", err)
		}
		opts = append(opts, client.WithResolver(r))
		log.Printf("配音服务客户端：etcd 服务发现 (%s)", cfg.EtcdAddr)
	} else {
		// 直连模式（本地开发，未部署 etcd 时使用）
		addr := os.Getenv("DUBBING_SERVICE_ADDR")
		if addr == "" {
			addr = "127.0.0.1:8888"
		}
		opts = append(opts, client.WithHostPorts(addr))
		log.Printf("配音服务客户端：直连模式 (%s)", addr)
	}

	cli, err := dubbingservice.NewClient("parrot.dubbing", opts...)
	if err != nil {
		log.Fatalf("dubbing-service 客户端创建失败: %v", err)
	}
	return cli
}
