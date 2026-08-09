package main

import (
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	"parrot-backend-go/internal/ai"
	"parrot-backend-go/internal/config"
	"parrot-backend-go/internal/otel"
	"parrot-backend-go/internal/voice_svc"
	"parrot-backend-go/kitex_gen/voice/voiceservice"

	"github.com/cloudwego/kitex/pkg/rpcinfo"
	"github.com/cloudwego/kitex/server"
	"github.com/kitex-contrib/obs-opentelemetry/tracing"
	registryetcd "github.com/kitex-contrib/registry-etcd"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// voice-service 独立微服务入口
// 阶段 2.3：声音克隆服务，独占 voices 表
func main() {
	cfg := config.Load()

	// 阶段 3.2：初始化 OpenTelemetry TracerProvider（OTLP HTTP → Jaeger）
	tp, err := otel.InitTracer("parrot-voice", cfg.JaegerEndpoint)
	if err != nil {
		log.Printf("[otel] TracerProvider 初始化失败（链路追踪不可用）: %v", err)
	}
	defer otel.Shutdown(tp)

	db := initDB(cfg)
	aiClient := ai.New(cfg.AIBaseURL, cfg.AIAPIKey, cfg.AIDefaultModel)

	impl := voice_svc.NewImpl(db, aiClient)

	// etcd 服务注册
	registryAddr := cfg.EtcdAddr
	if registryAddr == "" {
		registryAddr = "127.0.0.1:2379"
	}

	r, err := registryetcd.NewEtcdRegistry([]string{registryAddr})
	if err != nil {
		log.Fatalf("etcd 注册中心初始化失败: %v", err)
	}

	addr := ":" + getEnv("VOICE_SERVICE_PORT", "8889")
	_, port, _ := net.SplitHostPort(addr)

	svr := voiceservice.NewServer(
		impl,
		server.WithServiceAddr(&net.TCPAddr{IP: net.ParseIP("0.0.0.0"), Port: parsePort(port)}),
		server.WithRegistry(r),
		server.WithSuite(tracing.NewServerSuite()),
		server.WithServerBasicInfo(&rpcinfo.EndpointBasicInfo{
			ServiceName: "parrot.voice",
		}),
	)

	go func() {
		log.Printf("[voice-service] 启动，监听 %s，已注册到 etcd (%s)", addr, registryAddr)
		if err := svr.Run(); err != nil {
			log.Fatalf("[voice-service] 启动失败: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("[voice-service] 服务关闭中...")
	svr.Stop()
}

func initDB(cfg *config.Config) *gorm.DB {
	db, err := gorm.Open(postgres.Open(cfg.PGDSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		log.Fatalf("[voice-service] PostgreSQL 连接失败: %v", err)
	}
	sqlDB, _ := db.DB()
	sqlDB.SetMaxOpenConns(15)
	sqlDB.SetMaxIdleConns(5)
	log.Println("[voice-service] PostgreSQL 连接成功")
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
		p = 8889
	}
	return p
}
