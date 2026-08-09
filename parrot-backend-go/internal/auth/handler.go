package auth

import (
	"strings"

	"parrot-backend-go/pkg/response"

	"github.com/gin-gonic/gin"
)

// Handler 认证接口处理器
type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// SendCode POST /api/auth/send-code
func (h *Handler) SendCode(c *gin.Context) {
	var req struct {
		Email string `json:"email"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail400(c, "请求参数错误")
		return
	}

	email := strings.TrimSpace(strings.ToLower(req.Email))
	if email == "" {
		response.Fail400(c, "邮箱不能为空")
		return
	}

	code, expiresAt, devMode, err := h.svc.SendCode(c.Request.Context(), email)
	if err != nil {
		response.Fail400(c, "验证码发送失败")
		return
	}

	data := gin.H{
		"email":     email,
		"expiresAt": expiresAt,
		"delivery":  "development",
	}
	if devMode {
		data["code"] = code
	}

	msg := "验证码已生成，当前为开发模式"
	if !devMode {
		msg = "验证码已发送"
	}
	response.OK(c, data, msg)
}

// Register POST /api/auth/register
func (h *Handler) Register(c *gin.Context) {
	var req struct {
		Email    string `json:"email"`
		Username string `json:"username"`
		Password string `json:"password"`
		Code     string `json:"code"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail400(c, "请求参数错误")
		return
	}

	email := strings.TrimSpace(strings.ToLower(req.Email))
	username := strings.TrimSpace(req.Username)
	if email == "" || username == "" || req.Password == "" || req.Code == "" {
		response.Fail400(c, "请填写完整注册信息")
		return
	}

	user, token, err := h.svc.Register(c.Request.Context(), email, username, req.Password, req.Code)
	if err != nil {
		msg := err.Error()
		switch msg {
		case "该邮箱已注册":
			response.Fail409(c, msg)
		case "验证码错误或已失效":
			response.Fail400(c, msg)
		default:
			response.Fail400(c, msg)
		}
		return
	}

	response.OK(c, gin.H{
		"token": token,
		"user": gin.H{
			"id":        user.ID,
			"email":     user.Email,
			"username":  user.Username,
			"avatarUrl": user.AvatarURL,
		},
	}, "注册成功")
}

// Login POST /api/auth/login
func (h *Handler) Login(c *gin.Context) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail400(c, "请求参数错误")
		return
	}

	email := strings.TrimSpace(strings.ToLower(req.Email))
	user, token, err := h.svc.Login(c.Request.Context(), email, req.Password)
	if err != nil {
		msg := err.Error()
		switch msg {
		case "用户不存在":
			response.Fail404(c, msg)
		case "密码错误":
			response.Fail400(c, msg)
		default:
			response.Fail400(c, msg)
		}
		return
	}

	response.OK(c, gin.H{
		"token": token,
		"user": gin.H{
			"id":        user.ID,
			"email":     user.Email,
			"username":  user.Username,
			"phone":     user.Phone,
			"age":       user.Age,
			"gender":    user.Gender,
			"avatarUrl": user.AvatarURL,
		},
	}, "登录成功")
}

// SocialLogin POST /api/auth/social-login
func (h *Handler) SocialLogin(c *gin.Context) {
	var req struct {
		Provider string `json:"provider"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail400(c, "请求参数错误")
		return
	}

	provider := strings.TrimSpace(strings.ToLower(req.Provider))
	user, token, err := h.svc.SocialLogin(c.Request.Context(), provider)
	if err != nil {
		response.Fail400(c, err.Error())
		return
	}

	response.OK(c, gin.H{
		"token": token,
		"user": gin.H{
			"id":        user.ID,
			"email":     user.Email,
			"username":  user.Username,
			"phone":     user.Phone,
			"age":       user.Age,
			"gender":    user.Gender,
			"avatarUrl": user.AvatarURL,
		},
	}, user.Username+"登录成功")
}

// ResetPassword POST /api/auth/reset-password
func (h *Handler) ResetPassword(c *gin.Context) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Code     string `json:"code"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail400(c, "请求参数错误")
		return
	}

	email := strings.TrimSpace(strings.ToLower(req.Email))
	err := h.svc.ResetPassword(c.Request.Context(), email, req.Password, req.Code)
	if err != nil {
		msg := err.Error()
		switch msg {
		case "用户不存在":
			response.Fail404(c, msg)
		case "验证码错误或已失效":
			response.Fail400(c, msg)
		default:
			response.Fail400(c, msg)
		}
		return
	}

	response.OK(c, nil, "密码已重置")
}

// Me GET /api/auth/me（需要 JWT 认证）
func (h *Handler) Me(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	fullUser, err := h.svc.repo.GetByID(userID)
	if err != nil {
		response.Fail404(c, "用户不存在")
		return
	}

	response.OK(c, gin.H{
		"id":        fullUser.ID,
		"email":     fullUser.Email,
		"username":  fullUser.Username,
		"phone":     fullUser.Phone,
		"age":       fullUser.Age,
		"gender":    fullUser.Gender,
		"avatarUrl": fullUser.AvatarURL,
	})
}
