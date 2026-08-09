package dubbing

import (
	"context"
	"encoding/json"
	"strconv"
	"strings"

	"parrot-backend-go/kitex_gen/dubbing"
	"parrot-backend-go/kitex_gen/dubbing/dubbingservice"
	"parrot-backend-go/pkg/response"

	"github.com/cloudwego/hertz/pkg/app"
)

// Handler 网关侧配音 HTTP 处理器
// 阶段 2：不再直接调用本地 Service，而是通过 Kitex RPC 调用 dubbing-service
type Handler struct {
	client dubbingservice.Client
}

// NewHandler 创建配音处理器，传入 Kitex 客户端
func NewHandler(client dubbingservice.Client) *Handler {
	return &Handler{client: client}
}

// GetOptions GET /api/dubbing/options
func (h *Handler) GetOptions(ctx context.Context, c *app.RequestContext) {
	userID := c.MustGet("userID").(uint)
	resp, err := h.client.GetOptions(ctx, &dubbing.GetOptionsReq{
		UserID: int64(userID),
	})
	if err != nil {
		response.Fail(c, 500, 500, "配音服务暂时不可用")
		return
	}
	response.OK(c, resp)
}

// AIGenerate POST /api/dubbing/ai-generate
func (h *Handler) AIGenerate(ctx context.Context, c *app.RequestContext) {
	var req struct {
		Prompt string `json:"prompt"`
		Model  string `json:"model"`
	}
	if err := c.BindAndValidate(&req); err != nil {
		response.Fail400(c, "请求参数错误")
		return
	}

	prompt := strings.TrimSpace(req.Prompt)
	if prompt == "" {
		response.Fail400(c, "请输入 AI 生成需求")
		return
	}

	userID := c.MustGet("userID").(uint)
	resp, err := h.client.GenerateDraft(ctx, &dubbing.GenerateDraftReq{
		UserID: int64(userID),
		Prompt: prompt,
		Model:  req.Model,
	})
	if err != nil {
		response.Fail(c, 500, 500, "配音服务暂时不可用")
		return
	}
	response.TaskCreated(c, resp.TaskId)
}

// Preview POST /api/dubbing/preview
func (h *Handler) Preview(ctx context.Context, c *app.RequestContext) {
	var req struct {
		Text     string          `json:"text"`
		VoiceID  uint            `json:"voiceId"`
		Title    string          `json:"title"`
		Settings json.RawMessage `json:"settings"`
	}
	if err := c.BindAndValidate(&req); err != nil {
		response.Fail400(c, "请求参数错误")
		return
	}

	text := strings.TrimSpace(req.Text)
	if text == "" {
		response.Fail400(c, "请输入配音文案")
		return
	}

	userID := c.MustGet("userID").(uint)
	resp, err := h.client.CreatePreview(ctx, &dubbing.PreviewReq{
		UserID:   int64(userID),
		Text:     text,
		VoiceID:  int64(req.VoiceID),
		Title:    req.Title,
		Settings: []byte(req.Settings),
	})
	if err != nil {
		msg := err.Error()
		if strings.Contains(msg, "有效的音色") {
			response.Fail404(c, "请选择有效的音色")
			return
		}
		response.Fail(c, 500, 500, "配音服务暂时不可用")
		return
	}
	response.TaskCreated(c, resp.TaskId)
}

// Export POST /api/dubbing/export
func (h *Handler) Export(ctx context.Context, c *app.RequestContext) {
	var req struct {
		Text     string          `json:"text"`
		VoiceID  uint            `json:"voiceId"`
		Title    string          `json:"title"`
		Settings json.RawMessage `json:"settings"`
	}
	if err := c.BindAndValidate(&req); err != nil {
		response.Fail400(c, "请求参数错误")
		return
	}

	text := strings.TrimSpace(req.Text)
	if text == "" {
		response.Fail400(c, "请输入导出文案")
		return
	}

	userID := c.MustGet("userID").(uint)
	resp, err := h.client.CreateExport(ctx, &dubbing.ExportReq{
		UserID:   int64(userID),
		Text:     text,
		VoiceID:  int64(req.VoiceID),
		Title:    req.Title,
		Settings: []byte(req.Settings),
	})
	if err != nil {
		msg := err.Error()
		if strings.Contains(msg, "有效的音色") {
			response.Fail404(c, "请选择有效的音色")
			return
		}
		response.Fail(c, 500, 500, "配音服务暂时不可用")
		return
	}
	response.TaskCreated(c, resp.TaskId)
}

// GetRecords GET /api/dubbing/records
func (h *Handler) GetRecords(ctx context.Context, c *app.RequestContext) {
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

	resp, err := h.client.GetRecords(ctx, &dubbing.GetRecordsReq{
		UserID:   int64(userID),
		Search:   search,
		Page:     int32(page),
		PageSize: int32(pageSize),
	})
	if err != nil {
		response.Fail(c, 500, 500, "配音服务暂时不可用")
		return
	}

	response.Paginated(c, resp.Items, resp.Total, int(resp.Page), int(resp.PageSize))
}

// DeleteRecord DELETE /api/dubbing/records/:id
func (h *Handler) DeleteRecord(ctx context.Context, c *app.RequestContext) {
	userID := c.MustGet("userID").(uint)
	jobID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Fail400(c, "无效的记录 ID")
		return
	}

	ok, err := h.client.DeleteRecord(ctx, &dubbing.DeleteRecordReq{
		UserID: int64(userID),
		JobID:  int64(jobID),
	})
	if err != nil {
		response.Fail(c, 500, 500, "配音服务暂时不可用")
		return
	}
	if !ok {
		response.Fail400(c, "删除失败，记录不存在")
		return
	}

	response.OK(c, nil, "记录已删除")
}
