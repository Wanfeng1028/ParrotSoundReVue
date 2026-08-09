package help

import (
	"fmt"
	"strconv"
	"strings"

	"parrot-backend-go/internal/model"
	"parrot-backend-go/kitex_gen/user"
	"parrot-backend-go/kitex_gen/user/userservice"
	"parrot-backend-go/pkg/response"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Handler struct {
	db         *gorm.DB
	userClient userservice.Client
}

func NewHandler(db *gorm.DB, userClient userservice.Client) *Handler {
	return &Handler{db: db, userClient: userClient}
}

// ListTutorials GET /api/help/tutorials（公开）
func (h *Handler) ListTutorials(c *gin.Context) {
	category := c.Query("category")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "12"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 12
	}

	query := h.db.Model(&model.Tutorial{})
	if category != "" {
		query = query.Where("category = ?", category)
	}

	var total int64
	query.Count(&total)

	var tutorials []model.Tutorial
	query.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&tutorials)

	// 只返回摘要字段
	items := make([]gin.H, len(tutorials))
	for i, t := range tutorials {
		items[i] = gin.H{
			"id":       t.ID,
			"category": t.Category,
			"title":    t.Title,
			"duration": t.Duration,
			"cover":    t.Cover,
			"summary":  t.Summary,
		}
	}

	response.Paginated(c, items, total, page, pageSize)
}

// GetTutorial GET /api/help/tutorials/:id（公开）
func (h *Handler) GetTutorial(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	var tutorial model.Tutorial
	if err := h.db.First(&tutorial, id).Error; err != nil {
		response.Fail404(c, "教程不存在")
		return
	}
	response.OK(c, tutorial)
}

// SubmitFeedback POST /api/help/feedback（需要认证）
func (h *Handler) SubmitFeedback(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	var req struct {
		UsageTime string `json:"usageTime"`
		Content   string `json:"content"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail400(c, "请求参数错误")
		return
	}

	content := strings.TrimSpace(req.Content)
	if content == "" {
		response.Fail400(c, "请填写反馈内容")
		return
	}

	feedback := &model.Feedback{
		UserID:    userID,
		UsageTime: req.UsageTime,
		Content:   content,
	}
	if feedback.UsageTime == "" {
		feedback.UsageTime = "不到 1 个月"
	}

	if err := h.db.Create(feedback).Error; err != nil {
		response.Fail400(c, "提交失败")
		return
	}

	// 发通知（通过 user-service RPC，notifications 表归 user-service 独占）
	eventID := fmt.Sprintf("feedback-%d", feedback.ID)
	_, _ = h.userClient.CreateNotification(c.Request.Context(), &user.CreateNotificationReq{
		UserId:  int64(userID),
		Type:    "system",
		Title:   "反馈已收到",
		Desc:    "感谢你的建议，我们会持续优化产品体验。",
		EventId: eventID,
	})

	response.OK(c, feedback, "反馈提交成功")
}
