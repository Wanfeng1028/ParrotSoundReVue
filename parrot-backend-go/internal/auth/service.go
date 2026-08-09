package auth

import (
	"context"
	"errors"
	"fmt"
	"math/rand"
	"time"

	"parrot-backend-go/internal/cache"
	"parrot-backend-go/internal/middleware"
	"parrot-backend-go/internal/model"

	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// Service 认证业务逻辑层
type Service struct {
	repo      *Repository
	cache     *cache.Cache
	jwtSecret string
}

func NewService(repo *Repository, cache *cache.Cache, jwtSecret string) *Service {
	return &Service{repo: repo, cache: cache, jwtSecret: jwtSecret}
}

// SendCode 生成6位验证码，存 Redis（TTL 5分钟），开发模式直接返回验证码
func (s *Service) SendCode(ctx context.Context, email string) (code string, expiresAt time.Time, devMode bool, err error) {
	code = fmt.Sprintf("%06d", rand.Intn(900000)+100000)
	expiresAt = time.Now().Add(5 * time.Minute)

	if err := s.cache.Set(ctx, codeKey(email), code, 5*time.Minute); err != nil {
		return "", time.Time{}, false, err
	}

	// 开发模式：没有配置 SMTP 时直接返回验证码
	devMode = true // TODO: 根据 SMTP_HOST 配置判断
	return code, expiresAt, devMode, nil
}

// VerifyCode 校验验证码
func (s *Service) VerifyCode(ctx context.Context, email, code string) error {
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

// DeleteCode 删除验证码（注册/重置成功后调用）
func (s *Service) DeleteCode(ctx context.Context, email string) {
	_ = s.cache.Del(ctx, codeKey(email))
}

// Register 注册新用户
func (s *Service) Register(ctx context.Context, email, username, password, code string) (*model.User, string, error) {
	// 校验验证码
	if err := s.VerifyCode(ctx, email, code); err != nil {
		return nil, "", err
	}

	// 检查邮箱是否已注册
	if _, err := s.repo.GetByEmail(email); err == nil {
		return nil, "", errors.New("该邮箱已注册")
	}

	// 加密密码
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 10)
	if err != nil {
		return nil, "", err
	}

	// 创建用户
	user := &model.User{
		Email:        email,
		Username:     username,
		PasswordHash: string(hash),
		Gender:       "未设置",
	}
	if err := s.repo.Create(user); err != nil {
		return nil, "", err
	}

	// 删除验证码
	s.DeleteCode(ctx, email)

	// 生成 token
	token, err := middleware.CreateToken(user, s.jwtSecret)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

// Login 邮箱密码登录
func (s *Service) Login(ctx context.Context, email, password string) (*model.User, string, error) {
	user, err := s.repo.GetByEmail(email)
	if err != nil {
		return nil, "", errors.New("用户不存在")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, "", errors.New("密码错误")
	}

	token, err := middleware.CreateToken(user, s.jwtSecret)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

// ResetPassword 通过验证码重置密码
func (s *Service) ResetPassword(ctx context.Context, email, password, code string) error {
	user, err := s.repo.GetByEmail(email)
	if err != nil {
		return errors.New("用户不存在")
	}

	if err := s.VerifyCode(ctx, email, code); err != nil {
		return err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), 10)
	if err != nil {
		return err
	}

	if err := s.repo.UpdatePassword(user.ID, string(hash)); err != nil {
		return err
	}

	s.DeleteCode(ctx, email)
	return nil
}

// SocialLogin 社交登录（mock 实现，与 Node 版对齐）
func (s *Service) SocialLogin(ctx context.Context, provider string) (*model.User, string, error) {
	socialProfiles := map[string]struct {
		Email    string
		Username string
	}{
		"google":   {Email: "google.user@parrotsound.local", Username: "Google 用户"},
		"facebook": {Email: "facebook.user@parrotsound.local", Username: "Facebook 用户"},
		"microsoft": {Email: "microsoft.user@parrotsound.local", Username: "Microsoft 用户"},
		"x":        {Email: "x.user@parrotsound.local", Username: "X 用户"},
		"apple":    {Email: "apple.user@parrotsound.local", Username: "Apple 用户"},
	}

	profile, ok := socialProfiles[provider]
	if !ok {
		return nil, "", errors.New("暂不支持该登录方式")
	}

	// 查用户，不存在则创建
	user, err := s.repo.GetByEmail(profile.Email)
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", err
		}
		hash, _ := bcrypt.GenerateFromPassword([]byte(fmt.Sprintf("social-%s-%d", provider, time.Now().Unix())), 10)
		user = &model.User{
			Email:        profile.Email,
			Username:     profile.Username,
			PasswordHash: string(hash),
			Gender:       "未设置",
		}
		if err := s.repo.Create(user); err != nil {
			return nil, "", err
		}
	}

	token, err := middleware.CreateToken(user, s.jwtSecret)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

func codeKey(email string) string {
	return "auth:code:" + email
}
