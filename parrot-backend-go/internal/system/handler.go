package system

import (
	"os"
	"path/filepath"
	"time"

	"parrot-backend-go/internal/config"
	"parrot-backend-go/pkg/response"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	cfg *config.Config
}

func NewHandler(cfg *config.Config) *Handler {
	return &Handler{cfg: cfg}
}

// Ping GET /api/system/ping（公开）
func (h *Handler) Ping(c *gin.Context) {
	response.OK(c, gin.H{
		"time":          time.Now().Format(time.RFC3339),
		"cacheMode":     "redis",
		"mysqlMode":     "postgresql",
		"aiConfigured":  h.cfg.AIAPIKey != "",
	}, "服务器运行正常")
}

// AIModels GET /api/system/ai/models（公开）
func (h *Handler) AIModels(c *gin.Context) {
	models := make([]gin.H, len(h.cfg.AIModels))
	for i, id := range h.cfg.AIModels {
		models[i] = gin.H{
			"id":        id,
			"provider":  "openai",
			"label":     id,
			"isDefault": id == h.cfg.AIDefaultModel,
		}
	}
	response.OK(c, models)
}

// DemoAudio GET /api/media/demo-audio（公开）
func (h *Handler) DemoAudio(c *gin.Context) {
	h.serveMedia(c, []string{
		"../parrot-frontend/src/assets/audio/example.wav",
		"uploads/demo-audio.wav",
		"uploads/example.wav",
	}, "音频文件不存在")
}

// VoiceChaoWen GET /api/media/voice-chaowen（公开）
func (h *Handler) VoiceChaoWen(c *gin.Context) {
	h.serveMedia(c, []string{
		"../parrot-frontend/src/assets/audio/voice-chaowen.mp3",
		"uploads/voice-chaowen.mp3",
	}, "音频文件不存在")
}

// VoiceXiaoYa GET /api/media/voice-xiaoya（公开）
func (h *Handler) VoiceXiaoYa(c *gin.Context) {
	h.serveMedia(c, []string{
		"../parrot-frontend/src/assets/audio/voice-xiaoya.mp3",
		"uploads/voice-xiaoya.mp3",
	}, "音频文件不存在")
}

// serveMedia 按候选路径查找并返回静态媒体文件
func (h *Handler) serveMedia(c *gin.Context, candidates []string, notFoundMsg string) {
	for _, path := range candidates {
		if _, err := os.Stat(path); err == nil {
			abs, _ := filepath.Abs(path)
			c.File(abs)
			return
		}
	}
	response.Fail404(c, notFoundMsg)
}
