package main

import (
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	"parrot-backend-go/internal/cache"
	"parrot-backend-go/internal/config"
	"parrot-backend-go/internal/event"
	"parrot-backend-go/internal/model"
	"parrot-backend-go/internal/otel"
	"parrot-backend-go/internal/user_svc"
	"parrot-backend-go/kitex_gen/user/userservice"

	"github.com/cloudwego/kitex/pkg/rpcinfo"
	"github.com/cloudwego/kitex/server"
	"github.com/kitex-contrib/obs-opentelemetry/tracing"
	registryetcd "github.com/kitex-contrib/registry-etcd"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// user-service 独立微服务入口
// 阶段 2.3：用户服务（含认证、通知、互动），独占 users/notifications/interactions 表
// 阶段 2.4：消费 events 队列，幂等写入 notifications 表（跨服务事件通信的消费端）
func main() {
	cfg := config.Load()

	// 阶段 3.2：初始化 OpenTelemetry TracerProvider（OTLP HTTP → Jaeger）
	tp, err := otel.InitTracer("parrot-user", cfg.JaegerEndpoint)
	if err != nil {
		log.Printf("[otel] TracerProvider 初始化失败（链路追踪不可用）: %v", err)
	}
	defer otel.Shutdown(tp)

	db := initDB(cfg)
	redisCache := cache.New(cfg.RedisURL)

	impl := user_svc.NewImpl(db, redisCache, cfg.JWTSecret)

	// 2.4 启动事件消费 Worker：监听 events 队列，消费其他服务发布的事件
	// 配音导出完成、声音克隆完成、反馈收到等事件 → 幂等写 notifications
	eventHandlers := event.NewEventHandlers(db)
	eventWorker := event.StartEventWorker(cfg.RedisURL, eventHandlers)

	// etcd 服务注册
	registryAddr := cfg.EtcdAddr
	if registryAddr == "" {
		registryAddr = "127.0.0.1:2379"
	}

	r, err := registryetcd.NewEtcdRegistry([]string{registryAddr})
	if err != nil {
		log.Fatalf("etcd 注册中心初始化失败: %v", err)
	}

	addr := ":" + getEnv("USER_SERVICE_PORT", "8890")
	_, port, _ := net.SplitHostPort(addr)

	svr := userservice.NewServer(
		impl,
		server.WithServiceAddr(&net.TCPAddr{IP: net.ParseIP("0.0.0.0"), Port: parsePort(port)}),
		server.WithRegistry(r),
		server.WithSuite(tracing.NewServerSuite()),
		server.WithServerBasicInfo(&rpcinfo.EndpointBasicInfo{
			ServiceName: "parrot.user",
		}),
	)

	go func() {
		log.Printf("[user-service] 启动，监听 %s，已注册到 etcd (%s)", addr, registryAddr)
		if err := svr.Run(); err != nil {
			log.Fatalf("[user-service] 启动失败: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("[user-service] 服务关闭中...")
	eventWorker.Shutdown()
	svr.Stop()
}

func initDB(cfg *config.Config) *gorm.DB {
	db, err := gorm.Open(postgres.Open(cfg.PGDSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		log.Fatalf("[user-service] PostgreSQL 连接失败: %v", err)
	}
	sqlDB, _ := db.DB()
	sqlDB.SetMaxOpenConns(15)
	sqlDB.SetMaxIdleConns(5)

	// 确保本服务独占的表存在（独立部署时网关可能未启动）
	if err := db.AutoMigrate(
		&model.User{},
		&model.Notification{},
		&model.Interaction{},
	); err != nil {
		log.Fatalf("[user-service] 表迁移失败: %v", err)
	}

	log.Println("[user-service] PostgreSQL 连接成功")
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
		p = 8890
	}
	return p
}
