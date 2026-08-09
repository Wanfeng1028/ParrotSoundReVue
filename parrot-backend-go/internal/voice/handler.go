package voice

import (
	"strconv"
	"strings"

	"parrot-backend-go/kitex_gen/user"
	"parrot-backend-go/kitex_gen/user/userservice"
	"parrot-backend-go/kitex_gen/voice"
	"parrot-backend-go/kitex_gen/voice/voiceservice"
	"parrot-backend-go/pkg/response"

	"github.com/gin-gonic/gin"
)

// Handler 网关侧声音 HTTP 处理器
// 阶段 2.3：通过 Kitex RPC 调用 voice-service 和 user-service
type Handler struct {
	voiceClient voiceservice.Client
	userClient  userservice.Client
}

func NewHandler(vc voiceservice.Client, uc userservice.Client) *Handler {
	return &Handler{voiceClient: vc, userClient: uc}
}

// Library GET /api/voices/library（公开）
func (h *Handler) Library(c *gin.Context) {
	search := strings.ToLower(strings.TrimSpace(c.Query("search")))
	filter := c.DefaultQuery("filter", "all")

	voices, err := h.voiceClient.ListPublic(c.Request.Context(), &voice.ListPublicReq{
		Search: search,
		Filter: filter,
	})
	if err != nil {
		response.Fail(c, 500, 500, "声音服务暂时不可用")
		return
	}

	// 批量查作者信息
	userIDSet := map[int64]bool{}
	for _, v := range voices {
		userIDSet[v.UserId] = true
	}
	userIDs := make([]int64, 0, len(userIDSet))
	for id := range userIDSet {
		userIDs = append(userIDs, id)
	}

	userMap := map[int64]*user.User{}
	if len(userIDs) > 0 {
		users, _ := h.userClient.GetUsersByIDs(c.Request.Context(), userIDs)
		for _, u := range users {
			userMap[u.Id] = u
		}
	}

	result := make([]gin.H, len(voices))
	for i, v := range voices {
		authorName := "未知用户"
		authorAvatar := ""
		if u, ok := userMap[v.UserId]; ok && u != nil {
			authorName = u.Username
			authorAvatar = u.AvatarUrl
		}
		result[i] = gin.H{
			"id":             v.Id,
			"userId":         v.UserId,
			"name":           v.Name,
			"description":    v.Description,
			"tag":            v.Tag,
			"language":       v.Language,
			"coverUrl":       v.CoverUrl,
			"sampleAudioUrl": v.SampleAudioUrl,
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
	voices, err := h.voiceClient.ListByUser(c.Request.Context(), int64(userID))
	if err != nil {
		response.Fail(c, 500, 500, "声音服务暂时不可用")
		return
	}
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

	var coverURL, sampleAudioURL string
	if cover, err := c.FormFile("cover"); err == nil {
		filename := "voice_cover_" + strconv.Itoa(int(userID)) + "_" + cover.Filename
		if err := c.SaveUploadedFile(cover, "uploads/"+filename); err == nil {
			coverURL = "/uploads/" + filename
		}
	}
	if sample, err := c.FormFile("sample"); err == nil {
		filename := "voice_sample_" + strconv.Itoa(int(userID)) + "_" + sample.Filename
		if err := c.SaveUploadedFile(sample, "uploads/"+filename); err == nil {
			sampleAudioURL = "/uploads/" + filename
		}
	}

	v, err := h.voiceClient.Create(c.Request.Context(), &voice.CreateVoiceReq{
		UserId:         int64(userID),
		Name:           name,
		Description:    c.PostForm("description"),
		Tag:            c.DefaultPostForm("tag", "未分类"),
		Visibility:     c.DefaultPostForm("visibility", "private"),
		Language:       c.DefaultPostForm("language", "cn"),
		CoverUrl:       coverURL,
		SampleAudioUrl: sampleAudioURL,
	})
	if err != nil {
		response.Fail400(c, err.Error())
		return
	}

	// 发通知（通过 user-service RPC）
	eventID := "voice-create-" + strconv.Itoa(int(v.Id))
	h.userClient.CreateNotification(c.Request.Context(), &user.CreateNotificationReq{
		UserId:  int64(userID),
		Type:    "info",
		Title:   "声音模型创建成功",
		Desc:    "模型「" + name + "」已加入你的声音库。",
		EventId: eventID,
	})

	response.OK(c, v, "声音模型已创建")
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

	ok, err := h.voiceClient.UpdateVisibility(c.Request.Context(), &voice.UpdateVisibilityReq{
		Id:         int64(voiceID),
		UserId:     int64(userID),
		Visibility: req.Visibility,
	})
	if err != nil || !ok {
		response.Fail404(c, "声音模型不存在")
		return
	}
	response.OK(c, nil, "可见性已更新")
}

// Delete DELETE /api/voices/:id
func (h *Handler) Delete(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	voiceID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	ok, err := h.voiceClient.Delete(c.Request.Context(), &voice.DeleteVoiceReq{
		Id:     int64(voiceID),
		UserId: int64(userID),
	})
	if err != nil || !ok {
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

	content, err := h.voiceClient.DescribeAI(c.Request.Context(), &voice.DescribeReq{
		Name:   req.Name,
		Prompt: req.Prompt,
		Model:  req.Model,
	})
	if err != nil {
		response.Fail400(c, "AI 描述生成失败")
		return
	}
	response.OK(c, gin.H{"raw": content}, "AI 描述生成成功")
}
