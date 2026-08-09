package community

import (
	"strconv"

	"parrot-backend-go/internal/model"
	"parrot-backend-go/pkg/response"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Handler struct {
	db *gorm.DB
}

func NewHandler(db *gorm.DB) *Handler {
	return &Handler{db: db}
}

// ListVoices GET /api/community/voices（公开）
func (h *Handler) ListVoices(c *gin.Context) {
	search := c.Query("search")
	sort := c.DefaultQuery("sort", "recommend")
	language := c.DefaultQuery("language", "all")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "12"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 12
	}

	query := h.db.Model(&model.Voice{}).Where("visibility = ?", "public")
	if search != "" {
		like := "%" + search + "%"
		query = query.Where("name ILIKE ? OR description ILIKE ?", like, like)
	}
	if language != "all" {
		query = query.Where("language = ?", language)
	}

	switch sort {
	case "newest":
		query = query.Order("created_at DESC")
	case "hot":
		query = query.Order("play_count DESC")
	default:
		query = query.Order("like_count DESC")
	}

	var total int64
	query.Count(&total)

	var voices []model.Voice
	query.Offset((page - 1) * pageSize).Limit(pageSize).Find(&voices)

	// 附加作者信息
	items := make([]gin.H, len(voices))
	for i, v := range voices {
		var user model.User
		h.db.First(&user, v.UserID)
		username := "未知用户"
		userAvatar := ""
		if user.ID > 0 {
			username = user.Username
			userAvatar = user.AvatarURL
		}
		items[i] = gin.H{
			"id":             v.ID,
			"name":           v.Name,
			"username":       username,
			"userAvatar":     userAvatar,
			"date":           v.CreatedAt,
			"tag":            v.Tag,
			"desc":           v.Description,
			"avatar":         v.CoverURL,
			"sampleAudioUrl": v.SampleAudioURL,
			"stats": gin.H{
				"play":     v.PlayCount,
				"like":     v.LikeCount,
				"favorite": v.FavoriteCount,
				"use":      v.UseCount,
			},
		}
	}

	response.Paginated(c, items, total, page, pageSize)
}

// Rankings GET /api/community/rankings（公开）
func (h *Handler) Rankings(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "5"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 50 {
		pageSize = 5
	}

	var total int64
	h.db.Model(&model.Voice{}).Where("visibility = ?", "public").Count(&total)

	var voices []model.Voice
	h.db.Where("visibility = ?", "public").
		Order("like_count DESC").
		Offset((page - 1) * pageSize).Limit(pageSize).Find(&voices)

	items := make([]gin.H, len(voices))
	for i, v := range voices {
		var user model.User
		h.db.First(&user, v.UserID)
		username := "未知用户"
		userAvatar := ""
		if user.ID > 0 {
			username = user.Username
			userAvatar = user.AvatarURL
		}
		items[i] = gin.H{
			"id":         v.ID,
			"name":       v.Name,
			"username":   username,
			"likes":      v.LikeCount,
			"userAvatar": userAvatar,
			"avatar":     v.CoverURL,
		}
	}

	response.Paginated(c, items, total, page, pageSize)
}

// Like POST /api/community/voices/:id/like
func (h *Handler) Like(c *gin.Context) {
	h.mutateStat(c, "like_count", "like", "点赞成功")
}

// Play POST /api/community/voices/:id/play
func (h *Handler) Play(c *gin.Context) {
	h.mutateStat(c, "play_count", "play", "试听次数已更新")
}

// Favorite POST /api/community/voices/:id/favorite
func (h *Handler) Favorite(c *gin.Context) {
	h.mutateStat(c, "favorite_count", "favorite", "收藏成功")
}

// Use POST /api/community/voices/:id/use
func (h *Handler) Use(c *gin.Context) {
	h.mutateStat(c, "use_count", "use", "已加入创作流程")
}

func (h *Handler) mutateStat(c *gin.Context, field, interactionType, msg string) {
	userID := c.MustGet("userID").(uint)
	voiceID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	var voice model.Voice
	if err := h.db.First(&voice, voiceID).Error; err != nil {
		response.Fail404(c, "声音不存在")
		return
	}

	// 更新计数
	h.db.Model(&voice).Update(field, gorm.Expr(field+" + 1"))

	// 创建互动记录 + 通知（like/favorite/use 才创建）
	if interactionType != "play" {
		interaction := &model.Interaction{
			UserID:  voice.UserID,
			ActorID: userID,
			VoiceID: uint(voiceID),
			Type:    interactionType,
		}
		h.db.Create(interaction)

		notif := &model.Notification{
			UserID:  voice.UserID,
			Type:    "info",
			Title:   "你的声音收到了新的" + map[string]string{"like": "点赞", "favorite": "收藏", "use": "使用"}[interactionType],
			Desc:    "作品「" + voice.Name + "」被" + map[string]string{"like": "点赞", "favorite": "收藏", "use": "使用"}[interactionType] + "。",
			EventID: interactionType + "-" + strconv.Itoa(int(userID)) + "-" + strconv.Itoa(int(voiceID)),
		}
		h.db.Where("event_id = ?", notif.EventID).FirstOrCreate(notif)
	}

	// 重新查询返回最新数据
	h.db.First(&voice, voiceID)
	response.OK(c, voice, msg)
}
