package auth

import (
	"context"
	"strings"

	"parrot-backend-go/kitex_gen/user"
	"parrot-backend-go/kitex_gen/user/userservice"
	"parrot-backend-go/pkg/response"

	"github.com/cloudwego/hertz/pkg/app"
)

// Handler 认证接口处理器
// 通过 Kitex RPC 调用 user-service，不再直接访问本地数据库
type Handler struct {
	client userservice.Client
}

func NewHandler(client userservice.Client) *Handler {
	return &Handler{client: client}
}

// SendCode POST /api/auth/send-code
func (h *Handler) SendCode(ctx context.Context, c *app.RequestContext) {
	var req struct {
		Email string `json:"email"`
	}
	if err := c.BindAndValidate(&req); err != nil {
		response.Fail400(c, "请求参数错误")
		return
	}

	email := strings.TrimSpace(strings.ToLower(req.Email))
	if email == "" {
		response.Fail400(c, "邮箱不能为空")
		return
	}

	resp, err := h.client.SendCode(ctx, email)
	if err != nil {
		response.Fail(c, 500, 500, "用户服务暂时不可用")
		return
	}

	data := map[string]interface{}{
		"email":     resp.Email,
		"expiresAt": resp.ExpiresAt,
		"delivery":  "development",
	}
	if resp.DevMode {
		data["code"] = resp.GetCode()
	}

	msg := "验证码已生成，当前为开发模式"
	if !resp.DevMode {
		msg = "验证码已发送"
	}
	response.OK(c, data, msg)
}

// Register POST /api/auth/register
func (h *Handler) Register(ctx context.Context, c *app.RequestContext) {
	var req struct {
		Email    string `json:"email"`
		Username string `json:"username"`
		Password string `json:"password"`
		Code     string `json:"code"`
	}
	if err := c.BindAndValidate(&req); err != nil {
		response.Fail400(c, "请求参数错误")
		return
	}

	email := strings.TrimSpace(strings.ToLower(req.Email))
	username := strings.TrimSpace(req.Username)
	if email == "" || username == "" || req.Password == "" || req.Code == "" {
		response.Fail400(c, "请填写完整注册信息")
		return
	}

	resp, err := h.client.Register(ctx, &user.RegisterReq{
		Email:    email,
		Username: username,
		Password: req.Password,
		Code:     req.Code,
	})
	if err != nil {
		msg := err.Error()
		switch {
		case strings.Contains(msg, "该邮箱已注册"):
			response.Fail409(c, "该邮箱已注册")
		case strings.Contains(msg, "验证码错误或已失效"):
			response.Fail400(c, "验证码错误或已失效")
		default:
			response.Fail(c, 500, 500, "用户服务暂时不可用")
		}
		return
	}

	u := resp.GetUser()
	response.OK(c, map[string]interface{}{
		"token": resp.Token,
		"user": map[string]interface{}{
			"id":        u.Id,
			"email":     u.Email,
			"username":  u.Username,
			"avatarUrl": u.AvatarUrl,
		},
	}, "注册成功")
}

// Login POST /api/auth/login
func (h *Handler) Login(ctx context.Context, c *app.RequestContext) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.BindAndValidate(&req); err != nil {
		response.Fail400(c, "请求参数错误")
		return
	}

	email := strings.TrimSpace(strings.ToLower(req.Email))
	resp, err := h.client.Login(ctx, &user.LoginReq{
		Email:    email,
		Password: req.Password,
	})
	if err != nil {
		msg := err.Error()
		switch {
		case strings.Contains(msg, "用户不存在"):
			response.Fail404(c, "用户不存在")
		case strings.Contains(msg, "密码错误"):
			response.Fail400(c, "密码错误")
		default:
			response.Fail(c, 500, 500, "用户服务暂时不可用")
		}
		return
	}

	u := resp.GetUser()
	response.OK(c, map[string]interface{}{
		"token": resp.Token,
		"user": map[string]interface{}{
			"id":        u.Id,
			"email":     u.Email,
			"username":  u.Username,
			"phone":     u.Phone,
			"age":       u.Age,
			"gender":    u.Gender,
			"avatarUrl": u.AvatarUrl,
		},
	}, "登录成功")
}

// SocialLogin POST /api/auth/social-login
func (h *Handler) SocialLogin(ctx context.Context, c *app.RequestContext) {
	var req struct {
		Provider string `json:"provider"`
	}
	if err := c.BindAndValidate(&req); err != nil {
		response.Fail400(c, "请求参数错误")
		return
	}

	provider := strings.TrimSpace(strings.ToLower(req.Provider))
	resp, err := h.client.SocialLogin(ctx, provider)
	if err != nil {
		response.Fail(c, 500, 500, "用户服务暂时不可用")
		return
	}

	u := resp.GetUser()
	response.OK(c, map[string]interface{}{
		"token": resp.Token,
		"user": map[string]interface{}{
			"id":        u.Id,
			"email":     u.Email,
			"username":  u.Username,
			"phone":     u.Phone,
			"age":       u.Age,
			"gender":    u.Gender,
			"avatarUrl": u.AvatarUrl,
		},
	}, u.Username+"登录成功")
}

// ResetPassword POST /api/auth/reset-password
func (h *Handler) ResetPassword(ctx context.Context, c *app.RequestContext) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Code     string `json:"code"`
	}
	if err := c.BindAndValidate(&req); err != nil {
		response.Fail400(c, "请求参数错误")
		return
	}

	email := strings.TrimSpace(strings.ToLower(req.Email))
	_, err := h.client.ResetPassword(ctx, &user.ResetPasswordReq{
		Email:    email,
		Password: req.Password,
		Code:     req.Code,
	})
	if err != nil {
		msg := err.Error()
		switch {
		case strings.Contains(msg, "用户不存在"):
			response.Fail404(c, "用户不存在")
		case strings.Contains(msg, "验证码错误或已失效"):
			response.Fail400(c, "验证码错误或已失效")
		default:
			response.Fail(c, 500, 500, "用户服务暂时不可用")
		}
		return
	}

	response.OK(c, nil, "密码已重置")
}

// Me GET /api/auth/me（需要 JWT 认证）
func (h *Handler) Me(ctx context.Context, c *app.RequestContext) {
	userID := c.MustGet("userID").(uint)

	u, err := h.client.GetUserByID(ctx, int64(userID))
	if err != nil {
		msg := err.Error()
		if strings.Contains(msg, "用户不存在") {
			response.Fail404(c, "用户不存在")
			return
		}
		response.Fail(c, 500, 500, "用户服务暂时不可用")
		return
	}

	response.OK(c, map[string]interface{}{
		"id":        u.Id,
		"email":     u.Email,
		"username":  u.Username,
		"phone":     u.Phone,
		"age":       u.Age,
		"gender":    u.Gender,
		"avatarUrl": u.AvatarUrl,
	})
}
