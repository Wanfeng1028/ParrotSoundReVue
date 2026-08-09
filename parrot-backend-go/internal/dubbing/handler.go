package dubbing

import (
	"strconv"
	"strings"

	"parrot-backend-go/pkg/response"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// GetOptions GET /api/dubbing/options
func (h *Handler) GetOptions(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	data, err := h.svc.GetOptions(userID)
	if err != nil {
		response.Fail400(c, "获取选项失败")
		return
	}
	response.OK(c, data)
}

// AIGenerate POST /api/dubbing/ai-generate
func (h *Handler) AIGenerate(c *gin.Context) {
	var req struct {
		Prompt string `json:"prompt"`
		Model  string `json:"model"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail400(c, "请求参数错误")
		return
	}

	prompt := strings.TrimSpace(req.Prompt)
	if prompt == "" {
		response.Fail400(c, "请输入 AI 生成需求")
		return
	}

	userID := c.MustGet("userID").(uint)
	taskID, err := h.svc.GenerateDraft(c.Request.Context(), userID, prompt, req.Model)
	if err != nil {
		response.Fail400(c, err.Error())
		return
	}

	response.TaskCreated(c, taskID)
}

// Preview POST /api/dubbing/preview
func (h *Handler) Preview(c *gin.Context) {
	var req struct {
		Text     string `json:"text"`
		VoiceID  uint   `json:"voiceId"`
		Title    string `json:"title"`
		Settings []byte `json:"settings"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail400(c, "请求参数错误")
		return
	}

	text := strings.TrimSpace(req.Text)
	if text == "" {
		response.Fail400(c, "请输入配音文案")
		return
	}

	userID := c.MustGet("userID").(uint)
	taskID, err := h.svc.Preview(c.Request.Context(), userID, text, req.VoiceID, req.Title, req.Settings)
	if err != nil {
		msg := err.Error()
		if msg == "请选择有效的音色" {
			response.Fail404(c, msg)
			return
		}
		response.Fail400(c, msg)
		return
	}

	response.TaskCreated(c, taskID)
}

// Export POST /api/dubbing/export
func (h *Handler) Export(c *gin.Context) {
	var req struct {
		Text     string `json:"text"`
		VoiceID  uint   `json:"voiceId"`
		Title    string `json:"title"`
		Settings []byte `json:"settings"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail400(c, "请求参数错误")
		return
	}

	text := strings.TrimSpace(req.Text)
	if text == "" {
		response.Fail400(c, "请输入导出文案")
		return
	}

	userID := c.MustGet("userID").(uint)
	taskID, err := h.svc.Export(c.Request.Context(), userID, text, req.VoiceID, req.Title, req.Settings)
	if err != nil {
		msg := err.Error()
		if msg == "请选择有效的音色" {
			response.Fail404(c, msg)
			return
		}
		response.Fail400(c, msg)
		return
	}

	response.TaskCreated(c, taskID)
}

// GetRecords GET /api/dubbing/records
func (h *Handler) GetRecords(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	search := strings.ToLower(strings.TrimSpace(c.Query("search")))

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "12"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 12
	}
	offset := (page - 1) * pageSize

	jobs, total, err := h.svc.repo.GetJobs(userID, search, offset, pageSize)
	if err != nil {
		response.Fail400(c, "获取记录失败")
		return
	}

	response.Paginated(c, jobs, total, page, pageSize)
}

// DeleteRecord DELETE /api/dubbing/records/:id
func (h *Handler) DeleteRecord(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	jobID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Fail400(c, "无效的记录 ID")
		return
	}

	if err := h.svc.repo.DeleteJob(uint(jobID), userID); err != nil {
		response.Fail400(c, "删除失败")
		return
	}

	response.OK(c, nil, "记录已删除")
}
