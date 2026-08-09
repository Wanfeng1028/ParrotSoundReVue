package auth

import (
	"parrot-backend-go/internal/model"

	"gorm.io/gorm"
)

// Repository 用户数据访问层
type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

// GetByEmail 按邮箱查用户
func (r *Repository) GetByEmail(email string) (*model.User, error) {
	var user model.User
	err := r.db.Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetByID 按ID查用户
func (r *Repository) GetByID(id uint) (*model.User, error) {
	var user model.User
	err := r.db.First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// Create 创建用户
func (r *Repository) Create(user *model.User) error {
	return r.db.Create(user).Error
}

// UpdatePassword 更新密码
func (r *Repository) UpdatePassword(userID uint, passwordHash string) error {
	return r.db.Model(&model.User{}).Where("id = ?", userID).
		Update("password_hash", passwordHash).Error
}
