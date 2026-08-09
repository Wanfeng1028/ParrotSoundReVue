package user_svc

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math/rand"
	"time"

	"parrot-backend-go/internal/cache"
	"parrot-backend-go/internal/model"
	"parrot-backend-go/kitex_gen/user"

	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// Impl UserService 的 Kitex 服务端实现
type Impl struct {
	db        *gorm.DB
	cache     *cache.Cache
	jwtSecret string
}

func NewImpl(db *gorm.DB, cache *cache.Cache, jwtSecret string) *Impl {
	return &Impl{db: db, cache: cache, jwtSecret: jwtSecret}
}

// ===== 认证 =====

// SendCode 发送验证码
func (s *Impl) SendCode(ctx context.Context, email string) (*user.SendCodeResp, error) {
	code := fmt.Sprintf("%06d", rand.Intn(900000)+100000)
	expiresAt := time.Now().Add(5 * time.Minute)

	if err := s.cache.Set(ctx, codeKey(email), code, 5*time.Minute); err != nil {
		return nil, err
	}

	return &user.SendCodeResp{
		Email:     email,
		ExpiresAt: expiresAt.Format(time.RFC3339),
		DevMode:   true,
		Code:      &code,
	}, nil
}

// Register 注册
func (s *Impl) Register(ctx context.Context, req *user.RegisterReq) (*user.AuthResp, error) {
	// 校验验证码
	if err := s.verifyCode(ctx, req.Email, req.Code); err != nil {
		return nil, err
	}

	// 检查邮箱
	var existing model.User
	if err := s.db.Where("email = ?", req.Email).First(&existing).Error; err == nil {
		return nil, errors.New("该邮箱已注册")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
	if err != nil {
		return nil, err
	}

	u := &model.User{
		Email:        req.Email,
		Username:     req.Username,
		PasswordHash: string(hash),
		Gender:       "未设置",
	}
	if err := s.db.Create(u).Error; err != nil {
		return nil, err
	}

	s.cache.Del(ctx, codeKey(req.Email))

	token, err := s.createToken(u)
	if err != nil {
		return nil, err
	}
	return &user.AuthResp{Token: token, User: modelToThrift(u)}, nil
}

// Login 登录
func (s *Impl) Login(ctx context.Context, req *user.LoginReq) (*user.AuthResp, error) {
	var u model.User
	if err := s.db.Where("email = ?", req.Email).First(&u).Error; err != nil {
		return nil, errors.New("用户不存在")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.New("密码错误")
	}

	token, err := s.createToken(&u)
	if err != nil {
		return nil, err
	}
	return &user.AuthResp{Token: token, User: modelToThrift(&u)}, nil
}

// SocialLogin 社交登录
func (s *Impl) SocialLogin(ctx context.Context, provider string) (*user.AuthResp, error) {
	socialProfiles := map[string]struct{ Email, Username string }{
		"google":    {"google.user@parrotsound.local", "Google 用户"},
		"facebook":  {"facebook.user@parrotsound.local", "Facebook 用户"},
		"microsoft": {"microsoft.user@parrotsound.local", "Microsoft 用户"},
		"x":         {"x.user@parrotsound.local", "X 用户"},
		"apple":     {"apple.user@parrotsound.local", "Apple 用户"},
	}

	profile, ok := socialProfiles[provider]
	if !ok {
		return nil, errors.New("暂不支持该登录方式")
	}

	var u model.User
	if err := s.db.Where("email = ?", profile.Email).First(&u).Error; err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
		hash, _ := bcrypt.GenerateFromPassword([]byte(fmt.Sprintf("social-%s-%d", provider, time.Now().Unix())), 10)
		u = model.User{
			Email:        profile.Email,
			Username:     profile.Username,
			PasswordHash: string(hash),
			Gender:       "未设置",
		}
		if err := s.db.Create(&u).Error; err != nil {
			return nil, err
		}
	}

	token, err := s.createToken(&u)
	if err != nil {
		return nil, err
	}
	return &user.AuthResp{Token: token, User: modelToThrift(&u)}, nil
}

// ResetPassword 重置密码
func (s *Impl) ResetPassword(ctx context.Context, req *user.ResetPasswordReq) (bool, error) {
	var u model.User
	if err := s.db.Where("email = ?", req.Email).First(&u).Error; err != nil {
		return false, errors.New("用户不存在")
	}

	if err := s.verifyCode(ctx, req.Email, req.Code); err != nil {
		return false, err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
	if err != nil {
		return false, err
	}

	s.db.Model(&u).Update("password_hash", string(hash))
	s.cache.Del(ctx, codeKey(req.Email))
	return true, nil
}

// ===== 用户查询 =====

// GetUserByID 按 ID 查用户
func (s *Impl) GetUserByID(ctx context.Context, id int64) (*user.User, error) {
	var u model.User
	if err := s.db.First(&u, id).Error; err != nil {
		return nil, gorm.ErrRecordNotFound
	}
	return modelToThrift(&u), nil
}

// GetUsersByIDs 批量查用户
func (s *Impl) GetUsersByIDs(ctx context.Context, ids []int64) ([]*user.User, error) {
	if len(ids) == 0 {
		return []*user.User{}, nil
	}

	var users []model.User
	s.db.Where("id IN ?", ids).Find(&users)

	result := make([]*user.User, len(users))
	for i, u := range users {
		result[i] = modelToThrift(&u)
	}
	return result, nil
}

// ===== 用户资料 =====

// UpdateProfile 更新资料
func (s *Impl) UpdateProfile(ctx context.Context, req *user.UpdateProfileReq) (*user.User, error) {
	var u model.User
	if err := s.db.First(&u, req.UserId).Error; err != nil {
		return nil, gorm.ErrRecordNotFound
	}

	if req.Username != nil {
		u.Username = *req.Username
	}
	if req.Phone != nil {
		u.Phone = *req.Phone
	}
	if req.Age != nil {
		u.Age = *req.Age
	}
	if req.Gender != nil {
		u.Gender = *req.Gender
	}
	if req.AvatarUrl != nil {
		u.AvatarURL = *req.AvatarUrl
	}

	s.db.Save(&u)
	return modelToThrift(&u), nil
}

// UpdatePassword 更新密码
func (s *Impl) UpdatePassword(ctx context.Context, req *user.UpdatePasswordReq) (bool, error) {
	if req.Password == "" || req.ConfirmPassword == "" {
		return false, errors.New("请输入完整密码信息")
	}
	if req.Password != req.ConfirmPassword {
		return false, errors.New("两次密码输入不一致")
	}

	var u model.User
	if err := s.db.First(&u, req.UserId).Error; err != nil {
		return false, gorm.ErrRecordNotFound
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
	if err != nil {
		return false, err
	}
	s.db.Model(&u).Update("password_hash", string(hash))
	return true, nil
}

// ===== 通知 =====

// GetNotifications 获取通知列表
func (s *Impl) GetNotifications(ctx context.Context, req *user.GetListReq) (*user.PaginatedResp, error) {
	page := int(req.Page)
	if page < 1 {
		page = 1
	}
	pageSize := int(req.PageSize)
	if pageSize < 1 || pageSize > 100 {
		pageSize = 12
	}

	query := s.db.Model(&model.Notification{}).Where("user_id = ?", req.UserId)
	if req.Type != "all" && req.Type != "" {
		query = query.Where("type = ?", req.Type)
	}

	var total int64
	query.Count(&total)

	var notifs []model.Notification
	query.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&notifs)

	items, _ := json.Marshal(notifs)
	return &user.PaginatedResp{Items: items, Total: total, Page: int32(page), PageSize: int32(pageSize)}, nil
}

// ReadNotification 标记已读
func (s *Impl) ReadNotification(ctx context.Context, userID int64, notifID int64) (bool, error) {
	result := s.db.Model(&model.Notification{}).
		Where("id = ? AND user_id = ?", notifID, userID).
		Update("is_read", true)
	return result.RowsAffected > 0, nil
}

// CreateNotification 创建通知
func (s *Impl) CreateNotification(ctx context.Context, req *user.CreateNotificationReq) (bool, error) {
	notif := &model.Notification{
		UserID:  uint(req.UserId),
		Type:    req.Type,
		Title:   req.Title,
		Desc:    req.Desc,
		EventID: req.EventId,
	}
	result := s.db.Where("event_id = ?", notif.EventID).FirstOrCreate(notif)
	return result.RowsAffected > 0, nil
}

// ===== 互动 =====

// GetInteractions 获取互动列表
func (s *Impl) GetInteractions(ctx context.Context, req *user.GetListReq) (*user.PaginatedResp, error) {
	page := int(req.Page)
	if page < 1 {
		page = 1
	}
	pageSize := int(req.PageSize)
	if pageSize < 1 || pageSize > 100 {
		pageSize = 12
	}

	query := s.db.Model(&model.Interaction{}).Where("user_id = ?", req.UserId)
	if req.Type != "all" && req.Type != "" {
		query = query.Where("type = ?", req.Type)
	}

	var total int64
	query.Count(&total)

	var interactions []model.Interaction
	query.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&interactions)

	items, _ := json.Marshal(interactions)
	return &user.PaginatedResp{Items: items, Total: total, Page: int32(page), PageSize: int32(pageSize)}, nil
}

// CreateInteraction 创建互动
func (s *Impl) CreateInteraction(ctx context.Context, req *user.CreateInteractionReq) (bool, error) {
	interaction := &model.Interaction{
		UserID:  uint(req.UserId),
		ActorID: uint(req.ActorId),
		VoiceID: uint(req.VoiceId),
		Type:    req.Type,
	}
	result := s.db.Create(interaction)
	return result.RowsAffected > 0, result.Error
}

// ===== 管理后台 =====

// AdminListUsers 管理员用户列表
func (s *Impl) AdminListUsers(ctx context.Context, req *user.AdminListUsersReq) (*user.PaginatedResp, error) {
	page := int(req.Page)
	if page < 1 {
		page = 1
	}
	pageSize := int(req.PageSize)
	if pageSize < 1 || pageSize > 100 {
		pageSize = 12
	}

	query := s.db.Model(&model.User{})
	if req.Search != "" {
		like := "%" + req.Search + "%"
		query = query.Where("username ILIKE ? OR email ILIKE ?", like, like)
	}
	if req.Status != "" {
		query = query.Where("status = ?", req.Status)
	}

	var total int64
	query.Count(&total)

	var users []model.User
	query.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&users)

	items, _ := json.Marshal(users)
	return &user.PaginatedResp{Items: items, Total: total, Page: int32(page), PageSize: int32(pageSize)}, nil
}

// AdminGetUser 管理员获取用户
func (s *Impl) AdminGetUser(ctx context.Context, id int64) (*user.User, error) {
	var u model.User
	if err := s.db.First(&u, id).Error; err != nil {
		return nil, gorm.ErrRecordNotFound
	}
	return modelToThrift(&u), nil
}

// AdminUpdateUser 管理员更新用户
func (s *Impl) AdminUpdateUser(ctx context.Context, req *user.AdminUpdateUserReq) (*user.User, error) {
	updates := map[string]interface{}{}
	if req.Username != nil {
		updates["username"] = *req.Username
	}
	if req.Phone != nil {
		updates["phone"] = *req.Phone
	}
	if req.Age != nil {
		updates["age"] = *req.Age
	}
	if req.Gender != nil {
		updates["gender"] = *req.Gender
	}
	if req.AvatarUrl != nil {
		updates["avatar_url"] = *req.AvatarUrl
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.Role != nil {
		updates["role"] = *req.Role
	}

	result := s.db.Model(&model.User{}).Where("id = ?", req.Id).Updates(updates)
	if result.RowsAffected == 0 {
		return nil, gorm.ErrRecordNotFound
	}

	var u model.User
	s.db.First(&u, req.Id)
	return modelToThrift(&u), nil
}

// AdminDeleteUser 管理员删除用户
func (s *Impl) AdminDeleteUser(ctx context.Context, id int64) (bool, error) {
	result := s.db.Delete(&model.User{}, id)
	return result.RowsAffected > 0, nil
}

// AdminBroadcast 广播通知
func (s *Impl) AdminBroadcast(ctx context.Context, req *user.BroadcastReq) (int32, error) {
	var users []model.User
	s.db.Find(&users)

	notifType := req.Type
	if notifType == "" {
		notifType = "system"
	}

	for i, u := range users {
		notif := &model.Notification{
			UserID:  u.ID,
			Type:    notifType,
			Title:   req.Title,
			Desc:    req.Desc,
			EventID: fmt.Sprintf("broadcast-%d-%d", time.Now().UnixNano(), i),
		}
		s.db.Create(notif)
	}
	return int32(len(users)), nil
}

// CountAll 统计全部用户
func (s *Impl) CountAll(ctx context.Context) (int64, error) {
	var count int64
	s.db.Model(&model.User{}).Count(&count)
	return count, nil
}

// ===== 辅助方法 =====

func (s *Impl) verifyCode(ctx context.Context, email, code string) error {
	cached, err := s.cache.Get(ctx, codeKey(email))
	if err != nil {
		if errors.Is(err, redis.Nil) || errors.Is(err, cache.ErrNotFound) {
			return errors.New("验证码错误或已失效")
		}
		return err
	}
	if cached != code {
		return errors.New("验证码错误或已失效")
	}
	return nil
}

func (s *Impl) createToken(u *model.User) (string, error) {
	claims := jwt.MapClaims{
		"userId": u.ID,
		"email":  u.Email,
		"exp":    time.Now().Add(7 * 24 * time.Hour).Unix(),
		"iat":    time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}

func codeKey(email string) string {
	return "auth:code:" + email
}

// modelToThrift model.User → thrift User
func modelToThrift(u *model.User) *user.User {
	secAnswers, _ := json.Marshal(u.SecurityAnswers)
	return &user.User{
		Id:               int64(u.ID),
		Email:            u.Email,
		Username:         u.Username,
		Phone:            u.Phone,
		Age:              u.Age,
		Gender:           u.Gender,
		AvatarUrl:        u.AvatarURL,
		SecurityAnswers:  secAnswers,
		Role:             u.Role,
		Status:           u.Status,
		CreatedAt:        u.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}
}
