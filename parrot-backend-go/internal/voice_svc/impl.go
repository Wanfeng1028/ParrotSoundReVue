package voice_svc

import (
	"context"
	"fmt"
	"strings"

	"parrot-backend-go/internal/ai"
	"parrot-backend-go/internal/model"
	"parrot-backend-go/kitex_gen/voice"

	"gorm.io/gorm"
)

// Impl VoiceService 的 Kitex 服务端实现
type Impl struct {
	db *gorm.DB
	ai *ai.Client
}

func NewImpl(db *gorm.DB, ai *ai.Client) *Impl {
	return &Impl{db: db, ai: ai}
}

// ListPublic 获取公开音色库
func (s *Impl) ListPublic(ctx context.Context, req *voice.ListPublicReq) ([]*voice.Voice, error) {
	query := s.db.Model(&model.Voice{}).Where("visibility = ?", "public")
	if req.Search != "" {
		like := "%" + req.Search + "%"
		query = query.Where("name ILIKE ? OR tag ILIKE ?", like, like)
	}
	if req.Filter != "all" && req.Filter != "" {
		query = query.Where("tag = ?", req.Filter)
	}

	var voices []model.Voice
	query.Order("created_at DESC").Find(&voices)

	result := make([]*voice.Voice, len(voices))
	for i, v := range voices {
		result[i] = modelToThrift(&v)
	}
	return result, nil
}

// ListByUser 获取用户的音色
func (s *Impl) ListByUser(ctx context.Context, userID int64) ([]*voice.Voice, error) {
	var voices []model.Voice
	s.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&voices)

	result := make([]*voice.Voice, len(voices))
	for i, v := range voices {
		result[i] = modelToThrift(&v)
	}
	return result, nil
}

// Create 创建音色
func (s *Impl) Create(ctx context.Context, req *voice.CreateVoiceReq) (*voice.Voice, error) {
	name := strings.TrimSpace(req.Name)
	if name == "" {
		return nil, fmt.Errorf("请输入模型名称")
	}

	v := &model.Voice{
		UserID:         uint(req.UserId),
		Name:           name,
		Description:    req.Description,
		Tag:            req.Tag,
		Visibility:     req.Visibility,
		Language:       req.Language,
		CoverURL:       req.CoverUrl,
		SampleAudioURL: req.SampleAudioUrl,
	}
	if v.Tag == "" {
		v.Tag = "未分类"
	}
	if v.Visibility == "" {
		v.Visibility = "private"
	}
	if v.Language == "" {
		v.Language = "cn"
	}
	if v.SampleAudioURL == "" {
		v.SampleAudioURL = "/api/media/demo-audio"
	}

	if err := s.db.Create(v).Error; err != nil {
		return nil, fmt.Errorf("创建失败")
	}
	return modelToThrift(v), nil
}

// UpdateVisibility 更新可见性
func (s *Impl) UpdateVisibility(ctx context.Context, req *voice.UpdateVisibilityReq) (bool, error) {
	visibility := "private"
	if req.Visibility == "public" {
		visibility = "public"
	}
	result := s.db.Model(&model.Voice{}).
		Where("id = ? AND user_id = ?", req.Id, req.UserId).
		Update("visibility", visibility)
	return result.RowsAffected > 0, nil
}

// Delete 删除音色
func (s *Impl) Delete(ctx context.Context, req *voice.DeleteVoiceReq) (bool, error) {
	result := s.db.Where("id = ? AND user_id = ?", req.Id, req.UserId).Delete(&model.Voice{})
	return result.RowsAffected > 0, nil
}

// DescribeAI AI 生成描述
func (s *Impl) DescribeAI(ctx context.Context, req *voice.DescribeReq) (string, error) {
	prompt := "请为以下声音模型生成一句描述和一个简短标签，使用 JSON 格式返回：{\"description\":\"\",\"tag\":\"\"}\n名称：" + req.Name + "\n风格：" + req.Prompt
	content, err := s.ai.BuildDraft(ctx, prompt, "voice", req.Model)
	if err != nil {
		return "", fmt.Errorf("AI 描述生成失败")
	}
	return content, nil
}

// GetRankings 获取排行榜
func (s *Impl) GetRankings(ctx context.Context, req *voice.RankingsReq) (*voice.PaginatedVoices, error) {
	page := int(req.Page)
	if page < 1 {
		page = 1
	}
	pageSize := int(req.PageSize)
	if pageSize < 1 || pageSize > 50 {
		pageSize = 5
	}

	var total int64
	s.db.Model(&model.Voice{}).Where("visibility = ?", "public").Count(&total)

	var voices []model.Voice
	s.db.Where("visibility = ?", "public").
		Order("like_count DESC").
		Offset((page - 1) * pageSize).Limit(pageSize).Find(&voices)

	items := make([]*voice.Voice, len(voices))
	for i, v := range voices {
		items[i] = modelToThrift(&v)
	}
	return &voice.PaginatedVoices{Items: items, Total: total, Page: int32(page), PageSize: int32(pageSize)}, nil
}

// IncrementStat 更新统计计数
func (s *Impl) IncrementStat(ctx context.Context, req *voice.IncrementStatReq) (*voice.Voice, error) {
	var v model.Voice
	if err := s.db.First(&v, req.Id).Error; err != nil {
		return nil, fmt.Errorf("声音不存在")
	}
	s.db.Model(&v).Update(req.Field, gorm.Expr(req.Field+" + 1"))
	s.db.First(&v, req.Id)
	return modelToThrift(&v), nil
}

// AdminList 管理后台列表
func (s *Impl) AdminList(ctx context.Context, req *voice.AdminListVoicesReq) (*voice.PaginatedVoices, error) {
	page := int(req.Page)
	if page < 1 {
		page = 1
	}
	pageSize := int(req.PageSize)
	if pageSize < 1 || pageSize > 100 {
		pageSize = 12
	}

	query := s.db.Model(&model.Voice{})
	if req.Visibility != "" {
		query = query.Where("visibility = ?", req.Visibility)
	}

	var total int64
	query.Count(&total)

	var voices []model.Voice
	query.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&voices)

	items := make([]*voice.Voice, len(voices))
	for i, v := range voices {
		items[i] = modelToThrift(&v)
	}
	return &voice.PaginatedVoices{Items: items, Total: total, Page: int32(page), PageSize: int32(pageSize)}, nil
}

// AdminUpdate 管理后台更新
func (s *Impl) AdminUpdate(ctx context.Context, req *voice.AdminUpdateVoiceReq) (*voice.Voice, error) {
	updates := map[string]interface{}{}
	if req.Visibility != nil {
		updates["visibility"] = *req.Visibility
	}
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Tag != nil {
		updates["tag"] = *req.Tag
	}

	result := s.db.Model(&model.Voice{}).Where("id = ?", req.Id).Updates(updates)
	if result.RowsAffected == 0 {
		return nil, fmt.Errorf("声音不存在")
	}

	var v model.Voice
	s.db.First(&v, req.Id)
	return modelToThrift(&v), nil
}

// AdminDelete 管理后台删除
func (s *Impl) AdminDelete(ctx context.Context, id int64) (bool, error) {
	result := s.db.Delete(&model.Voice{}, id)
	return result.RowsAffected > 0, nil
}

// CountAll 统计全部
func (s *Impl) CountAll(ctx context.Context) (int64, error) {
	var count int64
	s.db.Model(&model.Voice{}).Count(&count)
	return count, nil
}

// CountByVisibility 按可见性统计
func (s *Impl) CountByVisibility(ctx context.Context, visibility string) (int64, error) {
	var count int64
	s.db.Model(&model.Voice{}).Where("visibility = ?", visibility).Count(&count)
	return count, nil
}

// ValidateForUser 校验音色对用户可用（dubbing-service 调用）
func (s *Impl) ValidateForUser(ctx context.Context, req *voice.ValidateVoiceReq) (*voice.Voice, error) {
	var v model.Voice
	if err := s.db.Where("id = ? AND (visibility = ? OR user_id = ?)", req.Id, "public", req.UserId).
		First(&v).Error; err != nil {
		return nil, fmt.Errorf("请选择有效的音色")
	}
	return modelToThrift(&v), nil
}

// modelToThrift model.Voice → thrift Voice
func modelToThrift(v *model.Voice) *voice.Voice {
	return &voice.Voice{
		Id:             int64(v.ID),
		UserId:         int64(v.UserID),
		Name:           v.Name,
		Description:    v.Description,
		Tag:            v.Tag,
		Language:       v.Language,
		Visibility:     v.Visibility,
		CoverUrl:       v.CoverURL,
		SampleAudioUrl: v.SampleAudioURL,
		PlayCount:      int32(v.PlayCount),
		LikeCount:      int32(v.LikeCount),
		FavoriteCount:  int32(v.FavoriteCount),
		UseCount:       int32(v.UseCount),
		CreatedAt:      v.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}
}
