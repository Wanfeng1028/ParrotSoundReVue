package router

import (
	"log"
	"time"

	"parrot-backend-go/internal/auth"
	"parrot-backend-go/internal/cache"
	"parrot-backend-go/internal/config"
	"parrot-backend-go/internal/dubbing"
	"parrot-backend-go/internal/middleware"
	"parrot-backend-go/internal/task"
	"parrot-backend-go/pkg/response"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
	"gorm.io/gorm"
)

// Dependencies 所有业务域的依赖集合
type Dependencies struct {
	DB      *gorm.DB
	Cache   *cache.Cache
	Cfg     *config.Config
	Auth    *auth.Handler
	Dubbing *dubbing.Handler
	Task    *task.TaskHandler
}

// Setup 初始化 Gin 引擎并注册路由
func Setup(deps *Dependencies) *gin.Engine {
	r := gin.New()

	// 全局中间件
	r.Use(gin.Recovery())
	r.Use(gzip.Gzip(gzip.DefaultCompression))
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{deps.Cfg.FrontendOrigin},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
	r.Use(requestLogger(deps.Cfg.RequestLogSlowMs))

	// 静态资源
	r.Static("/uploads", deps.Cfg.UploadDir)

	// 限流器
	authLimiter := middleware.NewRateLimiter(rate.Every(15*time.Second), 20)
	codeLimiter := middleware.NewRateLimiter(rate.Every(37*time.Second), 8)
	aiLimiter := middleware.NewRateLimiter(rate.Every(30*time.Second), 5)
	exportLimiter := middleware.NewRateLimiter(rate.Every(60*time.Second), 3)

	api := r.Group("/api")
	{
		// 健康检查
		api.GET("/health", func(c *gin.Context) {
			response.OK(c, gin.H{
				"status":    "ok",
				"timestamp": time.Now().Unix(),
			})
		})

		// ===== 认证模块（公开）=====
		authGroup := api.Group("/auth")
		{
			authGroup.POST("/send-code", codeLimiter.Middleware("auth-code"), deps.Auth.SendCode)
			authGroup.POST("/register", authLimiter.Middleware("auth"), deps.Auth.Register)
			authGroup.POST("/login", authLimiter.Middleware("auth"), deps.Auth.Login)
			authGroup.POST("/social-login", authLimiter.Middleware("auth"), deps.Auth.SocialLogin)
			authGroup.POST("/reset-password", authLimiter.Middleware("auth"), deps.Auth.ResetPassword)
		}

		// ===== 以下接口需要 JWT 认证 =====
		authed := api.Group("")
		authed.Use(middleware.JWTAuth(deps.Cfg.JWTSecret, deps.DB))
		{
			// 认证 - 获取当前用户
			authed.GET("/auth/me", deps.Auth.Me)

			// 配音模块
			dubbingGroup := authed.Group("/dubbing")
			{
				dubbingGroup.GET("/options", deps.Dubbing.GetOptions)
				dubbingGroup.POST("/ai-generate", aiLimiter.Middleware("ai"), deps.Dubbing.AIGenerate)
				dubbingGroup.POST("/preview", exportLimiter.Middleware("export"), deps.Dubbing.Preview)
				dubbingGroup.POST("/export", exportLimiter.Middleware("export"), deps.Dubbing.Export)
				dubbingGroup.GET("/records", deps.Dubbing.GetRecords)
				dubbingGroup.DELETE("/records/:id", deps.Dubbing.DeleteRecord)
			}

			// 任务状态查询
			authed.GET("/tasks/:taskId", deps.Task.GetTask)
		}
	}

	return r
}

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
