package router

import (
	"log"
	"time"

	"parrot-backend-go/internal/config"
	"parrot-backend-go/pkg/response"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
)

// Setup 初始化 Gin 引擎并注册路由
func Setup(cfg *config.Config) *gin.Engine {
	r := gin.New()

	// 全局中间件
	r.Use(gin.Recovery())
	r.Use(gzip.Gzip(gzip.DefaultCompression))
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.FrontendOrigin},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
	r.Use(requestLogger(cfg.RequestLogSlowMs))

	// 静态资源
	r.Static("/uploads", cfg.UploadDir)

	api := r.Group("/api")
	{
		// 健康检查
		api.GET("/health", func(c *gin.Context) {
			response.OK(c, gin.H{
				"status":    "ok",
				"timestamp": time.Now().Unix(),
			})
		})
	}

	return r
}

// requestLogger 请求日志中间件，慢请求打 Warn
func requestLogger(slowMs int) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		latency := time.Since(start)

		if latency > time.Duration(slowMs)*time.Millisecond {
			log.Printf("[WARN][SLOW] %s %s %d %v", c.Request.Method, c.Request.URL.Path, c.Writer.Status(), latency)
		}
	}
}
