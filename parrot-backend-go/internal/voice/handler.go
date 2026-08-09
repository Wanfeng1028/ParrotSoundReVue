package voice

import (
	"strconv"
	"strings"

	"parrot-backend-go/internal/ai"
	"parrot-backend-go/internal/cache"
	"parrot-backend-go/internal/model"
	"parrot-backend-go/pkg/response"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Handler struct {
	db    *gorm.DB
	cache *cache.Cache
	ai    *ai.Client
}

func NewHandler(db *gorm.DB, cache *cache.Cache, ai *ai.Client) *Handler {
	return &Handler{db: db, cache: cache, ai: ai}
}

// Library GET /api/voices/library（公开）
func (h *Handler) Library(c *gin.Context) {
	search := strings.ToLower(strings.TrimSpace(c.Query("search")))
	filter := c.DefaultQuery("filter", "all")

	query := h.db.Model(&model.Voice{}).Where("visibility = ?", "public")
	if search != "" {
		like := "%" + search + "%"
		query = query.Where("name ILIKE ? OR tag ILIKE ?", like, like)
	}
	if filter != "all" {
		query = query.Where("tag = ?", filter)
	}

	var voices []model.Voice
	query.Order("created_at DESC").Find(&voices)

	// 附加作者信息
	result := make([]gin.H, len(voices))
	for i, v := range voices {
		var user model.User
		h.db.First(&user, v.UserID)
		authorName := "未知用户"
		authorAvatar := ""
		if user.ID > 0 {
			authorName = user.Username
			authorAvatar = user.AvatarURL
		}
		result[i] = gin.H{
			"id":             v.ID,
			"userId":         v.UserID,
			"name":           v.Name,
			"description":    v.Description,
			"tag":            v.Tag,
			"language":       v.Language,
			"coverUrl":       v.CoverURL,
			"sampleAudioUrl": v.SampleAudioURL,
			"authorName":     authorName,
			"authorAvatar":   authorAvatar,
			"createdAt":      v.CreatedAt,
		}
	}
	response.OK(c, result)
}

// My GET /api/voices/my
func (h *Handler) My(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	var voices []model.Voice
	h.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&voices)
	response.OK(c, voices)
}

// Create POST /api/voices（multipart/form-data）
func (h *Handler) Create(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	name := strings.TrimSpace(c.PostForm("name"))
	if name == "" {
		response.Fail400(c, "请输入模型名称")
		return
	}

	voice := &model.Voice{
		UserID:        userID,
		Name:          name,
		Description:   c.PostForm("description"),
		Tag:           c.DefaultPostForm("tag", "未分类"),
		Visibility:    c.DefaultPostForm("visibility", "private"),
		Language:      c.DefaultPostForm("language", "cn"),
		SampleAudioURL: "/api/media/demo-audio",
	}

	// 文件上传
	if cover, err := c.FormFile("cover"); err == nil {
		filename := "voice_cover_" + strconv.Itoa(int(userID)) + "_" + cover.Filename
		if err := c.SaveUploadedFile(cover, "uploads/"+filename); err == nil {
			voice.CoverURL = "/uploads/" + filename
		}
	}
	if sample, err := c.FormFile("sample"); err == nil {
		filename := "voice_sample_" + strconv.Itoa(int(userID)) + "_" + sample.Filename
		if err := c.SaveUploadedFile(sample, "uploads/"+filename); err == nil {
			voice.SampleAudioURL = "/uploads/" + filename
		}
	}

	if err := h.db.Create(voice).Error; err != nil {
		response.Fail400(c, "创建失败")
		return
	}

	// 发通知
	notif := &model.Notification{
		UserID:  userID,
		Type:    "info",
		Title:   "声音模型创建成功",
		Desc:    "模型「" + name + "」已加入你的声音库。",
		EventID: "voice-create-" + strconv.Itoa(int(voice.ID)),
	}
	h.db.Where("event_id = ?", notif.EventID).FirstOrCreate(notif)

	response.OK(c, voice, "声音模型已创建")
}

// UpdateVisibility PATCH /api/voices/:id/visibility
func (h *Handler) UpdateVisibility(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	voiceID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	var req struct {
		Visibility string `json:"visibility"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail400(c, "请求参数错误")
		return
	}

	visibility := "private"
	if req.Visibility == "public" {
		visibility = "public"
	}

	result := h.db.Model(&model.Voice{}).
		Where("id = ? AND user_id = ?", voiceID, userID).
		Update("visibility", visibility)
	if result.RowsAffected == 0 {
		response.Fail404(c, "声音模型不存在")
		return
	}

	response.OK(c, nil, "可见性已更新")
}

// Delete DELETE /api/voices/:id
func (h *Handler) Delete(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	voiceID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	result := h.db.Where("id = ? AND user_id = ?", voiceID, userID).Delete(&model.Voice{})
	if result.RowsAffected == 0 {
		response.Fail404(c, "声音模型不存在")
		return
	}

	response.OK(c, nil, "声音模型已删除")
}

// DescribeAI POST /api/voices/describe-ai
func (h *Handler) DescribeAI(c *gin.Context) {
	var req struct {
		Name   string `json:"name"`
		Prompt string `json:"prompt"`
		Model  string `json:"model"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail400(c, "请求参数错误")
		return
	}

	prompt := "请为以下声音模型生成一句描述和一个简短标签，使用 JSON 格式返回：{\"description\":\"\",\"tag\":\"\"}\n名称：" + req.Name + "\n风格：" + req.Prompt
	content, err := h.ai.BuildDraft(c.Request.Context(), prompt, "voice", req.Model)
	if err != nil {
		response.Fail400(c, "AI 描述生成失败")
		return
	}

	response.OK(c, gin.H{"raw": content}, "AI 描述生成成功")
}
