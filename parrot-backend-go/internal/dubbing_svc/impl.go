package dubbing_svc

import (
	"context"
	"encoding/json"
	"fmt"

	"parrot-backend-go/internal/ai"
	"parrot-backend-go/internal/config"
	"parrot-backend-go/internal/model"
	"parrot-backend-go/internal/task"
	"parrot-backend-go/kitex_gen/dubbing"

	"gorm.io/gorm"
)

// Impl DubbingService 的 Kitex 服务端实现
// 阶段 2：将配音业务逻辑从单体网关下沉到独立微服务
type Impl struct {
	db    *gorm.DB
	queue *task.Queue
	ai    *ai.Client
	cfg   *config.Config
}

// NewImpl 创建 dubbing-service 实现实例
func NewImpl(db *gorm.DB, queue *task.Queue, aiClient *ai.Client, cfg *config.Config) *Impl {
	return &Impl{db: db, queue: queue, ai: aiClient, cfg: cfg}
}

// GetOptions 获取配音选项（音色 + 情感 + 模型）
func (s *Impl) GetOptions(ctx context.Context, req *dubbing.GetOptionsReq) (*dubbing.OptionsResp, error) {
	var voices []model.Voice
	err := s.db.Where("visibility = ? OR user_id = ?", "public", req.UserID).
		Order("created_at DESC").Find(&voices).Error
	if err != nil {
		return nil, fmt.Errorf("查询音色失败: %w", err)
	}

	voiceList := make([]*dubbing.Voice, len(voices))
	for i, v := range voices {
		voiceList[i] = &dubbing.Voice{
			Id:             int64(v.ID),
			Name:           v.Name,
			Tag:            v.Tag,
			Avatar:         v.CoverURL,
			SampleAudioUrl: v.SampleAudioURL,
		}
	}

	models := s.listModels()
	var currentModel *dubbing.Model
	for _, m := range models {
		if m.IsDefault {
			currentModel = m
			break
		}
	}

	return &dubbing.OptionsResp{
		Voices:       voiceList,
		Emotions:     []string{"默认", "热情", "轻松", "友好", "严肃", "兴奋"},
		Models:       models,
		CurrentModel: currentModel,
	}, nil
}

// listModels 从配置生成 AI 模型列表
func (s *Impl) listModels() []*dubbing.Model {
	models := make([]*dubbing.Model, len(s.cfg.AIModels))
	for i, id := range s.cfg.AIModels {
		models[i] = &dubbing.Model{
			Id:        id,
			Provider:  "openai",
			Label:     id,
			IsDefault: id == s.cfg.AIDefaultModel,
		}
	}
	return models
}

// GenerateDraft AI 生成配音文案（异步任务）
func (s *Impl) GenerateDraft(ctx context.Context, req *dubbing.GenerateDraftReq) (*dubbing.TaskCreatedResp, error) {
	payload := task.DubbingDraftPayload{
		UserID: uint(req.UserID),
		Prompt: req.Prompt,
		Model:  req.Model,
	}
	taskID, err := s.enqueueTask(ctx, task.TypeDubbingDraft, uint(req.UserID), payload)
	if err != nil {
		return nil, err
	}
	return &dubbing.TaskCreatedResp{TaskId: taskID, Status: "queued"}, nil
}

// CreatePreview 试听配音（异步任务）
func (s *Impl) CreatePreview(ctx context.Context, req *dubbing.PreviewReq) (*dubbing.TaskCreatedResp, error) {
	// 校验音色
	var voice model.Voice
	if err := s.db.Where("id = ? AND (visibility = ? OR user_id = ?)", req.VoiceID, "public", req.UserID).
		First(&voice).Error; err != nil {
		return nil, fmt.Errorf("请选择有效的音色")
	}

	payload := task.DubbingAudioPayload{
		UserID:   uint(req.UserID),
		Text:     req.Text,
		VoiceID:  uint(req.VoiceID),
		Title:    req.Title,
		Settings: json.RawMessage(req.Settings),
	}
	taskID, err := s.enqueueTask(ctx, task.TypeDubbingPreview, uint(req.UserID), payload)
	if err != nil {
		return nil, err
	}
	return &dubbing.TaskCreatedResp{TaskId: taskID, Status: "queued"}, nil
}

// CreateExport 导出配音（异步任务）
func (s *Impl) CreateExport(ctx context.Context, req *dubbing.ExportReq) (*dubbing.TaskCreatedResp, error) {
	var voice model.Voice
	if err := s.db.Where("id = ? AND (visibility = ? OR user_id = ?)", req.VoiceID, "public", req.UserID).
		First(&voice).Error; err != nil {
		return nil, fmt.Errorf("请选择有效的音色")
	}

	payload := task.DubbingAudioPayload{
		UserID:   uint(req.UserID),
		Text:     req.Text,
		VoiceID:  uint(req.VoiceID),
		Title:    req.Title,
		Settings: json.RawMessage(req.Settings),
	}
	taskID, err := s.enqueueTask(ctx, task.TypeDubbingExport, uint(req.UserID), payload)
	if err != nil {
		return nil, err
	}
	return &dubbing.TaskCreatedResp{TaskId: taskID, Status: "queued"}, nil
}

// GetRecords 获取配音记录（分页 + 搜索）
func (s *Impl) GetRecords(ctx context.Context, req *dubbing.GetRecordsReq) (*dubbing.RecordsResp, error) {
	page := int(req.Page)
	if page < 1 {
		page = 1
	}
	pageSize := int(req.PageSize)
	if pageSize < 1 || pageSize > 100 {
		pageSize = 12
	}
	offset := (page - 1) * pageSize

	query := s.db.Model(&model.Job{}).Where("user_id = ? AND type = ?", req.UserID, "audio")
	if req.Search != "" {
		like := "%" + req.Search + "%"
		query = query.Where("title ILIKE ? OR text ILIKE ?", like, like)
	}

	var total int64
	query.Count(&total)

	var jobs []model.Job
	err := query.Order("updated_at DESC").Offset(offset).Limit(pageSize).Find(&jobs).Error
	if err != nil {
		return nil, fmt.Errorf("查询记录失败: %w", err)
	}

	items := make([]*dubbing.Job, len(jobs))
	for i, j := range jobs {
		items[i] = jobToThrift(&j)
	}

	return &dubbing.RecordsResp{
		Items:    items,
		Total:    total,
		Page:     int32(page),
		PageSize: int32(pageSize),
	}, nil
}

// DeleteRecord 删除配音记录
func (s *Impl) DeleteRecord(ctx context.Context, req *dubbing.DeleteRecordReq) (bool, error) {
	result := s.db.Where("id = ? AND user_id = ?", req.JobID, req.UserID).Delete(&model.Job{})
	return result.RowsAffected > 0, result.Error
}

// enqueueTask 创建 DB 记录 + 入队 Asynq
func (s *Impl) enqueueTask(ctx context.Context, taskType string, userID uint, payload interface{}) (string, error) {
	taskID, err := s.queue.CreateTask(taskType, userID, payload)
	if err != nil {
		return "", err
	}

	payloadBytes, _ := json.Marshal(payload)
	if err := s.queue.EnqueueTask(ctx, taskType, payloadBytes, taskID); err != nil {
		s.queue.MarkFailed(taskID, "入队失败: "+err.Error())
		return "", err
	}

	return taskID, nil
}

// jobToThrift 将 model.Job 转换为 Thrift Job
func jobToThrift(j *model.Job) *dubbing.Job {
	job := &dubbing.Job{
		Id:        int64(j.ID),
		Title:     j.Title,
		Text:      j.Text,
		Status:    j.Status,
		AudioUrl:  &j.AudioURL,
		CreatedAt: j.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt: j.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
	if j.VoiceID != nil {
		vid := int64(*j.VoiceID)
		job.VoiceId = &vid
	}
	if j.VoiceName != "" {
		job.VoiceName = &j.VoiceName
	}
	return job
}


