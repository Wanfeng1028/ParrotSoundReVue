package teaching

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"parrot-backend-go/internal/config"
	"parrot-backend-go/internal/model"
	"parrot-backend-go/internal/task"
	"parrot-backend-go/pkg/response"

	"github.com/gin-gonic/gin"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type Handler struct {
	db    *gorm.DB
	queue *task.Queue
	cfg   *config.Config
}

func NewHandler(db *gorm.DB, queue *task.Queue, cfg *config.Config) *Handler {
	return &Handler{db: db, queue: queue, cfg: cfg}
}

// ListProjects GET /api/teaching/projects
func (h *Handler) ListProjects(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "12"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 12
	}

	var projects []model.TeachingProject
	var total int64
	h.db.Model(&model.TeachingProject{}).Where("user_id = ?", userID).Count(&total)
	h.db.Where("user_id = ?", userID).Order("updated_at DESC").
		Offset((page - 1) * pageSize).Limit(pageSize).Find(&projects)

	models := h.listModels()
	response.OK(c, gin.H{
		"items":  projects,
		"models": models,
	})
}

// SaveProject POST /api/teaching/projects
func (h *Handler) SaveProject(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	var req struct {
		ID              uint   `json:"id"`
		Title           string `json:"title"`
		Script          string `json:"script"`
		Ratio           string `json:"ratio"`
		Resolution      string `json:"resolution"`
		Bitrate         string `json:"bitrate"`
		SubtitleEnabled *bool  `json:"subtitleEnabled"`
		VoiceID         *uint  `json:"voiceId"`
		VoiceName       string `json:"voiceName"`
		SpeakerID       string `json:"speakerId"`
		SpeakerName     string `json:"speakerName"`
		BackgroundID    string `json:"backgroundId"`
		BackgroundName  string `json:"backgroundName"`
		Status          string `json:"status"`
		Mode            string `json:"mode"`
		Slides          []interface{} `json:"slides"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail400(c, "请求参数错误")
		return
	}

	title := strings.TrimSpace(req.Title)
	if title == "" {
		response.Fail400(c, "请输入项目标题")
		return
	}

	slidesJSON, _ := json.Marshal(req.Slides)
	if string(slidesJSON) == "null" {
		slidesJSON = []byte("[]")
	}

	subtitleEnabled := true
	if req.SubtitleEnabled != nil {
		subtitleEnabled = *req.SubtitleEnabled
	}

	project := &model.TeachingProject{
		UserID:          userID,
		Title:           title,
		Script:          req.Script,
		Ratio:           defaultIfEmpty(req.Ratio, "16:9"),
		Resolution:      defaultIfEmpty(req.Resolution, "1080P"),
		Bitrate:         defaultIfEmpty(req.Bitrate, "default"),
		SubtitleEnabled: subtitleEnabled,
		VoiceID:         req.VoiceID,
		VoiceName:       req.VoiceName,
		SpeakerID:       req.SpeakerID,
		SpeakerName:     req.SpeakerName,
		BackgroundID:    req.BackgroundID,
		BackgroundName:  req.BackgroundName,
		Status:          defaultIfEmpty(req.Status, "draft"),
		Mode:            defaultIfEmpty(req.Mode, "course"),
		Slides:          datatypes.JSON(slidesJSON),
	}

	if req.ID > 0 {
		// 更新
		h.db.Model(&model.TeachingProject{}).Where("id = ? AND user_id = ?", req.ID, userID).Updates(project)
		h.db.First(project, req.ID)
	} else {
		if err := h.db.Create(project).Error; err != nil {
			response.Fail400(c, "保存失败")
			return
		}
	}

	response.OK(c, project, "教学项目已保存")
}

// AIScript POST /api/teaching/ai-script（入队任务）
func (h *Handler) AIScript(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
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
		response.Fail400(c, "请输入讲解需求")
		return
	}

	payload := task.DubbingDraftPayload{
		UserID: userID,
		Prompt: fmt.Sprintf("请为一节课程生成一段条理清晰、适合课堂讲解的中文讲稿：%s", prompt),
		Model:  req.Model,
	}

	taskID, err := h.enqueueTask(c.Request.Context(), task.TypeDubbingDraft, userID, payload)
	if err != nil {
		response.Fail400(c, err.Error())
		return
	}
	response.TaskCreated(c, taskID)
}

// Generate POST /api/teaching/generate（入队任务）
func (h *Handler) Generate(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	var req struct {
		Title  string `json:"title"`
		Script string `json:"script"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail400(c, "请求参数错误")
		return
	}

	title := strings.TrimSpace(req.Title)
	script := strings.TrimSpace(req.Script)
	if title == "" || script == "" {
		response.Fail400(c, "请先保存项目并填写讲稿")
		return
	}

	payload := task.DubbingAudioPayload{
		UserID: userID,
		Text:   script,
		Title:  title,
	}

	taskID, err := h.enqueueTask(c.Request.Context(), task.TypeDubbingExport, userID, payload)
	if err != nil {
		response.Fail400(c, err.Error())
		return
	}
	response.TaskCreated(c, taskID)
}

func (h *Handler) enqueueTask(ctx context.Context, taskType string, userID uint, payload interface{}) (string, error) {
	taskID, err := h.queue.CreateTask(taskType, userID, payload)
	if err != nil {
		return "", err
	}
	payloadBytes, _ := json.Marshal(payload)
	if err := h.queue.EnqueueTask(ctx, taskType, payloadBytes, taskID); err != nil {
		h.queue.MarkFailed(taskID, "入队失败: "+err.Error())
		return "", err
	}
	return taskID, nil
}

func (h *Handler) listModels() []map[string]interface{} {
	models := make([]map[string]interface{}, len(h.cfg.AIModels))
	for i, id := range h.cfg.AIModels {
		models[i] = map[string]interface{}{
			"id":        id,
			"provider":  "openai",
			"label":     id,
			"isDefault": id == h.cfg.AIDefaultModel,
		}
	}
	return models
}

func defaultIfEmpty(s, fallback string) string {
	if s == "" {
		return fallback
	}
	return s
}
