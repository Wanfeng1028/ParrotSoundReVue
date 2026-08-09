package dubbing

import (
	"parrot-backend-go/internal/model"

	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

// GetVoices 获取用户可用的音色（public + 自己的）
func (r *Repository) GetVoices(userID uint) ([]model.Voice, error) {
	var voices []model.Voice
	err := r.db.Where("visibility = ? OR user_id = ?", "public", userID).
		Order("created_at DESC").Find(&voices).Error
	return voices, err
}

// GetVoiceByID 获取单个音色（public 或自己的）
func (r *Repository) GetVoiceByID(voiceID, userID uint) (*model.Voice, error) {
	var voice model.Voice
	err := r.db.Where("id = ? AND (visibility = ? OR user_id = ?)", voiceID, "public", userID).
		First(&voice).Error
	return &voice, err
}

// GetJobs 获取用户的配音记录（分页 + 搜索）
func (r *Repository) GetJobs(userID uint, search string, offset, limit int) ([]model.Job, int64, error) {
	var jobs []model.Job
	var total int64

	query := r.db.Model(&model.Job{}).Where("user_id = ? AND type = ?", userID, "audio")
	if search != "" {
		like := "%" + search + "%"
		query = query.Where("title ILIKE ? OR text ILIKE ?", like, like)
	}

	query.Count(&total)
	err := query.Order("updated_at DESC").Offset(offset).Limit(limit).Find(&jobs).Error
	return jobs, total, err
}

// DeleteJob 删除配音记录（确保属于该用户）
func (r *Repository) DeleteJob(jobID, userID uint) error {
	return r.db.Where("id = ? AND user_id = ?", jobID, userID).Delete(&model.Job{}).Error
}
