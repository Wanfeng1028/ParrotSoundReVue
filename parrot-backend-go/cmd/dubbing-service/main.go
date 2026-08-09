package main

import (
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"
	"time"

	"parrot-backend-go/internal/ai"
	"parrot-backend-go/internal/config"
	"parrot-backend-go/internal/dubbing_svc"
	"parrot-backend-go/internal/event"
	"parrot-backend-go/internal/model"
	"parrot-backend-go/internal/otel"
	"parrot-backend-go/internal/task"
	"parrot-backend-go/kitex_gen/dubbing/dubbingservice"
	"parrot-backend-go/kitex_gen/voice/voiceservice"

	"github.com/cloudwego/kitex/client"
	"github.com/cloudwego/kitex/pkg/rpcinfo"
	"github.com/cloudwego/kitex/server"
	"github.com/kitex-contrib/obs-opentelemetry/tracing"
	registryetcd "github.com/kitex-contrib/registry-etcd"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// dubbing-service 独立微服务入口
// 阶段 2：将配音业务从单体网关拆分为独立 Kitex 服务
// 网关通过 Kitex RPC 调用本服务，前端接口零改动
func main() {
	cfg := config.Load()

	// 阶段 3.2：初始化 OpenTelemetry TracerProvider（OTLP HTTP → Jaeger）
	tp, err := otel.InitTracer("parrot-dubbing", cfg.JaegerEndpoint)
	if err != nil {
		log.Printf("[otel] TracerProvider 初始化失败（链路追踪不可用）: %v", err)
	}
	defer otel.Shutdown(tp)

	// 1. 初始化基础设施
	db := initDB(cfg)
	aiClient := ai.New(cfg.AIBaseURL, cfg.AIAPIKey, cfg.AIDefaultModel)

	// 2. 任务队列 + Worker + Reaper（配音任务在本服务内处理）
	taskQueue := task.NewQueue(db, cfg.RedisURL)
	defer taskQueue.Close()

	taskHandlers := task.NewHandlers(taskQueue, aiClient, db)
	task.StartWorker(cfg.RedisURL, cfg.QueueConcurrency, taskHandlers)

	reaper := task.NewReaper(db, task.DefaultTimeouts())
	reaper.Start()

	// 2.4 事件总线 + outbox 发布器（跨服务最终一致性）
	// 配音导出完成后写 event_outbox，后台协程发布到 Asynq events 队列，
	// user-service 消费后写 notifications
	eventBus := event.NewBus(cfg.RedisURL)
	defer eventBus.Close()

	outboxPublisher := event.NewOutboxPublisher(db, eventBus)
	outboxPublisher.Start()
	defer outboxPublisher.Stop()

	// 3. 创建 voice-service 客户端（用于音色校验）
	voiceClient := newVoiceClient(cfg)

	// 4. 创建 DubbingService 实现并注册 Kitex 服务
	impl := dubbing_svc.NewImpl(db, taskQueue, aiClient, cfg, voiceClient)

	// 5. etcd 服务注册
	registryAddr := cfg.EtcdAddr
	if registryAddr == "" {
		registryAddr = "127.0.0.1:2379"
	}

	r, err := registryetcd.NewEtcdRegistry([]string{registryAddr})
	if err != nil {
		log.Fatalf("etcd 注册中心初始化失败: %v", err)
	}

	// 本服务监听地址
	addr := ":" + getEnv("DUBBING_SERVICE_PORT", "8888")
	_, port, _ := net.SplitHostPort(addr)

	svr := dubbingservice.NewServer(
		impl,
		server.WithServiceAddr(&net.TCPAddr{IP: net.ParseIP("0.0.0.0"), Port: parsePort(port)}),
		server.WithRegistry(r),
		server.WithSuite(tracing.NewServerSuite()),
		server.WithServerBasicInfo(&rpcinfo.EndpointBasicInfo{
			ServiceName: "parrot.dubbing",
		}),
	)

	// 6. 启动 Kitex 服务（后台 goroutine）
	go func() {
		log.Printf("[dubbing-service] 启动，监听 %s，已注册到 etcd (%s)", addr, registryAddr)
		if err := svr.Run(); err != nil {
			log.Fatalf("[dubbing-service] 启动失败: %v", err)
		}
	}()

	// 7. 优雅关闭
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("[dubbing-service] 服务关闭中...")
	svr.Stop()
}

// newVoiceClient 创建 voice-service 的 Kitex 客户端
func newVoiceClient(cfg *config.Config) voiceservice.Client {
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
	} else {
		addr := os.Getenv("VOICE_SERVICE_ADDR")
		if addr == "" {
			addr = "127.0.0.1:8889"
		}
		opts = append(opts, client.WithHostPorts(addr))
	}

	cli, err := voiceservice.NewClient("parrot.voice", opts...)
	if err != nil {
		log.Fatalf("voice-service 客户端创建失败: %v", err)
	}
	return cli
}

// initDB 初始化 PostgreSQL 连接（不执行迁移和种子，由网关负责）
// 仅确保本服务独占写入的 event_outbox 表存在
func initDB(cfg *config.Config) *gorm.DB {
	db, err := gorm.Open(postgres.Open(cfg.PGDSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		log.Fatalf("[dubbing-service] PostgreSQL 连接失败: %v", err)
	}

	sqlDB, _ := db.DB()
	sqlDB.SetMaxOpenConns(15)
	sqlDB.SetMaxIdleConns(5)

	// 确保本服务写入的 outbox 表存在（独立部署时网关可能未启动）
	if err := db.AutoMigrate(&model.EventOutbox{}); err != nil {
		log.Fatalf("[dubbing-service] event_outbox 迁移失败: %v", err)
	}

	log.Println("[dubbing-service] PostgreSQL 连接成功")
	return db
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func parsePort(s string) int {
	p := 0
	for _, c := range s {
		if c >= '0' && c <= '9' {
			p = p*10 + int(c-'0')
		}
	}
	if p == 0 {
		p = 8888
	}
	return p
}
