package main

import (
	"context"
	"log"
	"os"
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
	"parrot-backend-go/internal/otel"
	"parrot-backend-go/internal/router"
	"parrot-backend-go/internal/system"
	"parrot-backend-go/internal/task"
	"parrot-backend-go/internal/teaching"
	"parrot-backend-go/internal/user"
	"parrot-backend-go/internal/voice"
	"parrot-backend-go/kitex_gen/dubbing/dubbingservice"
	"parrot-backend-go/kitex_gen/user/userservice"
	"parrot-backend-go/kitex_gen/voice/voiceservice"

	"github.com/cloudwego/hertz/pkg/app/server"
	"github.com/cloudwego/kitex/client"
	"github.com/cloudwego/kitex/pkg/circuitbreak"
	"github.com/cloudwego/kitex/pkg/fallback"
	"github.com/cloudwego/kitex/pkg/utils"
	"github.com/kitex-contrib/obs-opentelemetry/tracing"
	registryetcd "github.com/kitex-contrib/registry-etcd"
)

func main() {
	cfg := config.Load()

	// 阶段 3.2：初始化 OpenTelemetry TracerProvider（OTLP HTTP → Jaeger）
	tp, err := otel.InitTracer("parrot-gateway", cfg.JaegerEndpoint)
	if err != nil {
		log.Printf("[otel] TracerProvider 初始化失败（链路追踪不可用）: %v", err)
	}
	defer otel.Shutdown(tp)

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

	// 阶段 2：Kitex 微服务客户端（阶段 3.2 加 OTel tracing，阶段 3.3 加熔断 + 降级）
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

	// 路由（阶段 3.1：Hertz 网关）
	deps := &router.Dependencies{
		DB: db, Cache: redisCache, Cfg: cfg,
		Auth: authHandler, Dubbing: dubbingHandler, Task: taskHandler,
		Voice: voiceHandler, Teaching: teachingHandler,
		Community: communityHandler, Help: helpHandler,
		User: userHandler, Admin: adminHandler, System: systemHandler,
	}
	h := server.Default(server.WithHostPorts(":" + cfg.Port))

	// 阶段 3.2：Hertz OpenTelemetry 中间件（最早注入，包裹所有后续中间件）
	h.Use(otel.HTTPMiddleware())

	router.Setup(deps, h)

	log.Printf("[gateway] Hertz 网关启动，监听 :%s", cfg.Port)
	h.Spin()
}

// newKitexClient 通用 Kitex 客户端创建（etcd 发现 / 直连双模式）
// 阶段 3.2：注入 OTel tracing suite（链路追踪跨服务传播）
// 阶段 3.3：注入熔断 + 降级 fallback（服务不可用时返回错误而非阻塞）
func newKitexClient(serviceName, envKey, defaultAddr string, cfg *config.Config) interface{} {
	opts := []client.Option{
		client.WithRPCTimeout(10 * time.Second),
		client.WithConnectTimeout(3 * time.Second),
		// 阶段 3.2：OTel tracing suite（TTHeader 传输 + 链路上下文注入）
		client.WithSuite(tracing.NewClientSuite()),
		// 阶段 3.3：熔断器（默认策略：错误率 >50% 自动熔断，半开试探恢复）
		client.WithCircuitBreaker(circuitbreak.NewCBSuite(circuitbreak.RPCInfo2Key)),
		// 阶段 3.3：熔断/超时降级：记录日志并返回错误，避免裸 panic
		client.WithFallback(fallback.TimeoutAndCBFallback(func(ctx context.Context, _ utils.KitexArgs, _ utils.KitexResult, err error) error {
			log.Printf("[rpc][fallback] %s 降级: %v", serviceName, err)
			return err
		})),
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
