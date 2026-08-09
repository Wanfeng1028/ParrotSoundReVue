package main

import (
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	"parrot-backend-go/internal/ai"
	"parrot-backend-go/internal/config"
	"parrot-backend-go/internal/dubbing_svc"
	"parrot-backend-go/internal/task"
	"parrot-backend-go/kitex_gen/dubbing/dubbingservice"

	"github.com/cloudwego/kitex/pkg/rpcinfo"
	"github.com/cloudwego/kitex/server"
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

	// 3. 创建 DubbingService 实现并注册 Kitex 服务
	impl := dubbing_svc.NewImpl(db, taskQueue, aiClient, cfg)

	// 4. etcd 服务注册
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
		server.WithServerBasicInfo(&rpcinfo.EndpointBasicInfo{
			ServiceName: "parrot.dubbing",
		}),
	)

	// 5. 启动 Kitex 服务（后台 goroutine）
	go func() {
		log.Printf("[dubbing-service] 启动，监听 %s，已注册到 etcd (%s)", addr, registryAddr)
		if err := svr.Run(); err != nil {
			log.Fatalf("[dubbing-service] 启动失败: %v", err)
		}
	}()

	// 6. 优雅关闭
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("[dubbing-service] 服务关闭中...")
	svr.Stop()
}

// initDB 初始化 PostgreSQL 连接（不执行迁移和种子，由网关负责）
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
