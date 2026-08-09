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
	"parrot-backend-go/internal/event"
	"parrot-backend-go/internal/help"
	"parrot-backend-go/internal/router"
	"parrot-backend-go/internal/system"
	"parrot-backend-go/internal/task"
	"parrot-backend-go/internal/teaching"
	"parrot-backend-go/internal/user"
	"parrot-backend-go/internal/voice"
	"parrot-backend-go/kitex_gen/dubbing/dubbingservice"
	"parrot-backend-go/kitex_gen/user/userservice"
	"parrot-backend-go/kitex_gen/voice/voiceservice"

	"github.com/cloudwego/kitex/client"
	registryetcd "github.com/kitex-contrib/registry-etcd"
)

func main() {
	cfg := config.Load()

	// 基础设施（网关仍需 DB 用于 teaching/help/admin/task 等本地模块）
	db := database.InitPostgres(cfg)
	redisCache := cache.New(cfg.RedisURL)
	aiClient := ai.New(cfg.AIBaseURL, cfg.AIAPIKey, cfg.AIDefaultModel)

	// 任务队列 + Worker + Reaper（教学模块仍需）
	taskQueue := task.NewQueue(db, cfg.RedisURL)
	defer taskQueue.Close()
	taskHandlers := task.NewHandlers(taskQueue, aiClient, db)
	task.StartWorker(cfg.RedisURL, cfg.QueueConcurrency, taskHandlers)
	reaper := task.NewReaper(db, task.DefaultTimeouts())
	reaper.Start()

	// 阶段 2.4：outbox 发布器（网关 Worker 可能执行配音导出写 outbox，需发布事件）
	eventBus := event.NewBus(cfg.RedisURL)
	defer eventBus.Close()
	outboxPublisher := event.NewOutboxPublisher(db, eventBus)
	outboxPublisher.Start()
	defer outboxPublisher.Stop()

	// 阶段 2：Kitex 微服务客户端
	dubbingClient := newKitexClient("parrot.dubbing", "DUBBING_SERVICE_ADDR", "127.0.0.1:8888", cfg).(dubbingservice.Client)
	voiceClient := newKitexClient("parrot.voice", "VOICE_SERVICE_ADDR", "127.0.0.1:8889", cfg).(voiceservice.Client)
	userClient := newKitexClient("parrot.user", "USER_SERVICE_ADDR", "127.0.0.1:8890", cfg).(userservice.Client)

	// 业务域 handler
	authHandler := auth.NewHandler(userClient)
	dubbingHandler := dubbing.NewHandler(dubbingClient)
	taskHandler := task.NewTaskHandler(taskQueue)
	voiceHandler := voice.NewHandler(voiceClient, userClient)
	teachingHandler := teaching.NewHandler(db, taskQueue, cfg)
	communityHandler := community.NewHandler(voiceClient, userClient)
	helpHandler := help.NewHandler(db, userClient)
	userHandler := user.NewHandler(db, userClient)
	adminHandler := admin.NewHandler(db, cfg, voiceClient, userClient)
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

// newKitexClient 通用 Kitex 客户端创建（etcd 发现 / 直连双模式）
func newKitexClient(serviceName, envKey, defaultAddr string, cfg *config.Config) interface{} {
	opts := []client.Option{
		client.WithRPCTimeout(10 * time.Second),
		client.WithConnectTimeout(3 * time.Second),
	}

	if cfg.EtcdAddr != "" {
		r, err := registryetcd.NewEtcdResolver([]string{cfg.EtcdAddr})
		if err != nil {
			log.Fatalf("etcd resolver 初始化失败: %v", err)
		}
		opts = append(opts, client.WithResolver(r))
		log.Printf("%s 客户端：etcd 服务发现 (%s)", serviceName, cfg.EtcdAddr)
	} else {
		addr := os.Getenv(envKey)
		if addr == "" {
			addr = defaultAddr
		}
		opts = append(opts, client.WithHostPorts(addr))
		log.Printf("%s 客户端：直连模式 (%s)", serviceName, addr)
	}

	switch serviceName {
	case "parrot.dubbing":
		cli, err := dubbingservice.NewClient(serviceName, opts...)
		if err != nil {
			log.Fatalf("%s 客户端创建失败: %v", serviceName, err)
		}
		return cli
	case "parrot.voice":
		cli, err := voiceservice.NewClient(serviceName, opts...)
		if err != nil {
			log.Fatalf("%s 客户端创建失败: %v", serviceName, err)
		}
		return cli
	case "parrot.user":
		cli, err := userservice.NewClient(serviceName, opts...)
		if err != nil {
			log.Fatalf("%s 客户端创建失败: %v", serviceName, err)
		}
		return cli
	}
	log.Fatalf("未知服务: %s", serviceName)
	return nil
}
