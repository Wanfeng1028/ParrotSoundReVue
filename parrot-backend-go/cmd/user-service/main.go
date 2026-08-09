package main

import (
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	"parrot-backend-go/internal/cache"
	"parrot-backend-go/internal/config"
	"parrot-backend-go/internal/user_svc"
	"parrot-backend-go/kitex_gen/user/userservice"

	"github.com/cloudwego/kitex/pkg/rpcinfo"
	"github.com/cloudwego/kitex/server"
	registryetcd "github.com/kitex-contrib/registry-etcd"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// user-service 独立微服务入口
// 阶段 2.3：用户服务（含认证、通知、互动），独占 users/notifications/interactions 表
func main() {
	cfg := config.Load()

	db := initDB(cfg)
	redisCache := cache.New(cfg.RedisURL)

	impl := user_svc.NewImpl(db, redisCache, cfg.JWTSecret)

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
