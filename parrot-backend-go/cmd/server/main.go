package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"parrot-backend-go/internal/config"
	"parrot-backend-go/internal/router"
)

func main() {
	// 加载配置（启动时校验必填项）
	cfg := config.Load()

	// 初始化路由
	r := router.Setup(cfg)

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
