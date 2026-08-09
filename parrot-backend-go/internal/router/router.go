package router

import (
	"log"
	"time"

	"parrot-backend-go/internal/admin"
	"parrot-backend-go/internal/auth"
	"parrot-backend-go/internal/cache"
	"parrot-backend-go/internal/community"
	"parrot-backend-go/internal/config"
	"parrot-backend-go/internal/dubbing"
	"parrot-backend-go/internal/help"
	"parrot-backend-go/internal/middleware"
	"parrot-backend-go/internal/system"
	"parrot-backend-go/internal/task"
	"parrot-backend-go/internal/teaching"
	"parrot-backend-go/internal/user"
	"parrot-backend-go/internal/voice"
	"parrot-backend-go/pkg/response"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
	"gorm.io/gorm"
)

type Dependencies struct {
	DB        *gorm.DB
	Cache     *cache.Cache
	Cfg       *config.Config
	Auth      *auth.Handler
	Dubbing   *dubbing.Handler
	Task      *task.TaskHandler
	Voice     *voice.Handler
	Teaching  *teaching.Handler
	Community *community.Handler
	Help      *help.Handler
	User      *user.Handler
	Admin     *admin.Handler
	System    *system.Handler
}

func Setup(deps *Dependencies) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(gzip.Gzip(gzip.DefaultCompression))
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{deps.Cfg.FrontendOrigin},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
	r.Use(requestLogger(deps.Cfg.RequestLogSlowMs))
	r.Static("/uploads", deps.Cfg.UploadDir)

	// 限流器
	authLimiter := middleware.NewRateLimiter(rate.Every(15*time.Second), 20)
	codeLimiter := middleware.NewRateLimiter(rate.Every(37*time.Second), 8)
	aiLimiter := middleware.NewRateLimiter(rate.Every(30*time.Second), 5)
	exportLimiter := middleware.NewRateLimiter(rate.Every(60*time.Second), 3)
	interactionLimiter := middleware.NewRateLimiter(rate.Every(10*time.Second), 10)
	feedbackLimiter := middleware.NewRateLimiter(rate.Every(60*time.Second), 3)

	jwtAuth := middleware.JWTAuth(deps.Cfg.JWTSecret)

	api := r.Group("/api")
	{
		// ===== 公开接口 =====
		api.GET("/health", func(c *gin.Context) {
			response.OK(c, gin.H{"status": "ok", "timestamp": time.Now().Unix()})
		})

		// 系统（与 Node 版对齐：挂在 /api 下，不带 /system 前缀）
		api.GET("/ping", deps.System.Ping)
		api.GET("/ai/models", deps.System.AIModels)
		api.GET("/media/demo-audio", deps.System.DemoAudio)
		api.GET("/media/voice-chaowen", deps.System.VoiceChaoWen)
		api.GET("/media/voice-xiaoya", deps.System.VoiceXiaoYa)

		// 认证（公开）
		authGroup := api.Group("/auth")
		{
			authGroup.POST("/send-code", codeLimiter.Middleware("auth-code"), deps.Auth.SendCode)
			authGroup.POST("/register", authLimiter.Middleware("auth"), deps.Auth.Register)
			authGroup.POST("/login", authLimiter.Middleware("auth"), deps.Auth.Login)
			authGroup.POST("/social-login", authLimiter.Middleware("auth"), deps.Auth.SocialLogin)
			authGroup.POST("/reset-password", authLimiter.Middleware("auth"), deps.Auth.ResetPassword)
		}

		// 声音库（公开）
		api.GET("/voices/library", deps.Voice.Library)

		// 社区（公开）
		commPub := api.Group("/community")
		{
			commPub.GET("/voices", deps.Community.ListVoices)
			commPub.GET("/rankings", deps.Community.Rankings)
		}

		// 帮助（公开）
		helpPub := api.Group("/help")
		{
			helpPub.GET("/tutorials", deps.Help.ListTutorials)
			helpPub.GET("/tutorials/:id", deps.Help.GetTutorial)
		}

		// 管理员登录（公开）
		api.POST("/admin/login", authLimiter.Middleware("admin"), deps.Admin.Login)

		// ===== 用户认证接口 =====
		authed := api.Group("")
		authed.Use(jwtAuth)
		{
			authed.GET("/auth/me", deps.Auth.Me)

			// 配音
			dub := authed.Group("/dubbing")
			{
				dub.GET("/options", deps.Dubbing.GetOptions)
				dub.POST("/ai-generate", aiLimiter.Middleware("ai"), deps.Dubbing.AIGenerate)
				dub.POST("/preview", exportLimiter.Middleware("export"), deps.Dubbing.Preview)
				dub.POST("/export", exportLimiter.Middleware("export"), deps.Dubbing.Export)
				dub.GET("/records", deps.Dubbing.GetRecords)
				dub.DELETE("/records/:id", deps.Dubbing.DeleteRecord)
			}

			// 声音管理
			voiceGroup := authed.Group("/voices")
			{
				voiceGroup.GET("/my", deps.Voice.My)
				voiceGroup.POST("", deps.Voice.Create)
				voiceGroup.PATCH("/:id/visibility", deps.Voice.UpdateVisibility)
				voiceGroup.DELETE("/:id", deps.Voice.Delete)
				voiceGroup.POST("/describe-ai", aiLimiter.Middleware("ai"), deps.Voice.DescribeAI)
			}

			// 教学
			teachGroup := authed.Group("/teaching")
			{
				teachGroup.GET("/projects", deps.Teaching.ListProjects)
				teachGroup.POST("/projects", deps.Teaching.SaveProject)
				teachGroup.POST("/ai-script", aiLimiter.Middleware("ai"), deps.Teaching.AIScript)
				teachGroup.POST("/generate", exportLimiter.Middleware("export"), deps.Teaching.Generate)
			}

			// 社区互动
			commAuth := authed.Group("/community")
			{
				commAuth.POST("/voices/:id/like", interactionLimiter.Middleware("interaction"), deps.Community.Like)
				commAuth.POST("/voices/:id/play", interactionLimiter.Middleware("interaction"), deps.Community.Play)
				commAuth.POST("/voices/:id/favorite", interactionLimiter.Middleware("interaction"), deps.Community.Favorite)
				commAuth.POST("/voices/:id/use", interactionLimiter.Middleware("interaction"), deps.Community.Use)
			}

			// 帮助 - 反馈
			authed.POST("/help/feedback", feedbackLimiter.Middleware("feedback"), deps.Help.SubmitFeedback)

			// 用户中心
			userGroup := authed.Group("/users")
			{
				userGroup.PUT("/profile", deps.User.UpdateProfile)
				userGroup.PUT("/password", deps.User.UpdatePassword)
				userGroup.GET("/history", deps.User.GetHistory)
				userGroup.GET("/interactions", deps.User.GetInteractions)
				userGroup.GET("/notifications", deps.User.GetNotifications)
				userGroup.POST("/notifications/:id/read", deps.User.ReadNotification)
			}

			// 任务查询
			authed.GET("/tasks/:taskId", deps.Task.GetTask)
		}

		// ===== 管理员认证接口 =====
		adminGroup := api.Group("/admin")
		adminGroup.Use(deps.Admin.Auth())
		{
			adminGroup.GET("/profile", deps.Admin.Profile)
			adminGroup.PUT("/profile", deps.Admin.UpdateProfile)
			adminGroup.PUT("/password", deps.Admin.UpdatePassword)
			adminGroup.GET("/stats", deps.Admin.Stats)
			adminGroup.GET("/system", deps.Admin.System)

			// 用户管理
			adminGroup.GET("/users", deps.Admin.ListUsers)
			adminGroup.GET("/users/:id", deps.Admin.GetUser)
			adminGroup.PUT("/users/:id", deps.Admin.UpdateUser)
			adminGroup.DELETE("/users/:id", deps.Admin.DeleteUser)

			// 声音管理
			adminGroup.GET("/voices", deps.Admin.ListVoices)
			adminGroup.PUT("/voices/:id", deps.Admin.UpdateVoice)
			adminGroup.DELETE("/voices/:id", deps.Admin.DeleteVoice)

			// 作品管理
			adminGroup.GET("/jobs", deps.Admin.ListJobs)
			adminGroup.DELETE("/jobs/:id", deps.Admin.DeleteJob)

			// 反馈管理
			adminGroup.GET("/feedbacks", deps.Admin.ListFeedbacks)
			adminGroup.DELETE("/feedbacks/:id", deps.Admin.DeleteFeedback)

			// 教学管理
			adminGroup.GET("/teaching", deps.Admin.ListTeaching)
			adminGroup.DELETE("/teaching/:id", deps.Admin.DeleteTeaching)

			// 广播
			adminGroup.POST("/notifications/broadcast", deps.Admin.Broadcast)
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
