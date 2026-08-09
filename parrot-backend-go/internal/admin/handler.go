package admin

import (
	"context"
	"encoding/json"
	"strconv"
	"strings"
	"time"

	"parrot-backend-go/internal/config"
	"parrot-backend-go/internal/model"
	"parrot-backend-go/kitex_gen/user"
	"parrot-backend-go/kitex_gen/user/userservice"
	"parrot-backend-go/kitex_gen/voice"
	"parrot-backend-go/kitex_gen/voice/voiceservice"
	"parrot-backend-go/pkg/response"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type Handler struct {
	db          *gorm.DB
	cfg         *config.Config
	voiceClient voiceservice.Client
	userClient  userservice.Client
}

func NewHandler(db *gorm.DB, cfg *config.Config, vc voiceservice.Client, uc userservice.Client) *Handler {
	return &Handler{db: db, cfg: cfg, voiceClient: vc, userClient: uc}
}

// AdminClaims 管理员 JWT 载荷
type AdminClaims struct {
	AdminID  uint   `json:"adminId"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// Login POST /api/admin/login（公开）
func (h *Handler) Login(ctx context.Context, c *app.RequestContext) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := c.BindAndValidate(&req); err != nil {
		response.Fail400(c, "请求参数错误")
		return
	}

	username := strings.TrimSpace(req.Username)
	if username == "" || req.Password == "" {
		response.Fail400(c, "请输入管理员账号和密码")
		return
	}

	var admin model.Admin
	if err := h.db.Where("username = ?", username).First(&admin).Error; err != nil {
		response.Fail404(c, "管理员账号不存在")
		return
	}

	if admin.Status == "disabled" {
		response.Fail(c, 403, 403, "管理员账户已停用")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(admin.PasswordHash), []byte(req.Password)); err != nil {
		response.Fail400(c, "管理员密码错误")
		return
	}

	token, err := h.createAdminToken(&admin)
	if err != nil {
		response.Fail400(c, "生成 token 失败")
		return
	}

	response.OK(c, map[string]interface{}{
		"token": token,
		"admin": safeAdmin(&admin),
	}, "管理员登录成功")
}

// Auth 中间件：验证 admin JWT
func (h *Handler) Auth() app.HandlerFunc {
	return func(ctx context.Context, c *app.RequestContext) {
		header := string(c.GetHeader("Authorization"))
		token := strings.TrimPrefix(header, "Bearer ")
		if token == "" || token == header {
			response.Fail401(c, "请先登录管理后台")
			c.Abort()
			return
		}

		claims := &AdminClaims{}
		parsed, err := jwt.ParseWithClaims(token, claims, func(t *jwt.Token) (interface{}, error) {
			return []byte(h.cfg.JWTSecret), nil
		})
		if err != nil || !parsed.Valid {
			response.Fail401(c, "登录状态已过期")
			c.Abort()
			return
		}

		var admin model.Admin
		if err := h.db.First(&admin, claims.AdminID).Error; err != nil {
			response.Fail401(c, "管理员账户不存在")
			c.Abort()
			return
		}

		c.Set("admin", &admin)
		c.Set("adminID", admin.ID)
		c.Next(ctx)
	}
}

// Profile GET /api/admin/profile
func (h *Handler) Profile(ctx context.Context, c *app.RequestContext) {
	admin := c.MustGet("admin").(*model.Admin)
	response.OK(c, safeAdmin(admin))
}

// UpdateProfile PUT /api/admin/profile
func (h *Handler) UpdateProfile(ctx context.Context, c *app.RequestContext) {
	admin := c.MustGet("admin").(*model.Admin)
	var req struct {
		Phone     string `json:"phone"`
		Age       string `json:"age"`
		Gender    string `json:"gender"`
		AvatarURL string `json:"avatarUrl"`
	}
	if err := c.BindAndValidate(&req); err != nil {
		response.Fail400(c, "请求参数错误")
		return
	}

	updates := map[string]interface{}{
		"phone":      req.Phone,
		"age":        req.Age,
		"gender":     req.Gender,
		"avatar_url": req.AvatarURL,
		"updated_at": time.Now(),
	}
	h.db.Model(&model.Admin{}).Where("id = ?", admin.ID).Updates(updates)
	h.db.First(admin, admin.ID)

	response.OK(c, safeAdmin(admin), "资料已更新")
}

// UpdatePassword PUT /api/admin/password
func (h *Handler) UpdatePassword(ctx context.Context, c *app.RequestContext) {
	admin := c.MustGet("admin").(*model.Admin)
	var req struct {
		OldPassword string `json:"oldPassword"`
		NewPassword string `json:"newPassword"`
	}
	if err := c.BindAndValidate(&req); err != nil {
		response.Fail400(c, "请求参数错误")
		return
	}

	if req.OldPassword == "" || req.NewPassword == "" {
		response.Fail400(c, "请输入当前密码与新密码")
		return
	}
	if len(req.NewPassword) < 6 {
		response.Fail400(c, "新密码至少 6 位")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(admin.PasswordHash), []byte(req.OldPassword)); err != nil {
		response.Fail400(c, "当前密码不正确")
		return
	}

	hash, _ := bcrypt.GenerateFromPassword([]byte(req.NewPassword), 10)
	h.db.Model(&model.Admin{}).Where("id = ?", admin.ID).Update("password_hash", string(hash))

	response.OK(c, nil, "管理员密码已修改")
}

// Stats GET /api/admin/stats
func (h *Handler) Stats(ctx context.Context, c *app.RequestContext) {
	userCount, _ := h.userClient.CountAll(ctx)
	voiceCount, _ := h.voiceClient.CountAll(ctx)
	publicVoices, _ := h.voiceClient.CountByVisibility(ctx, "public")
	privateVoices, _ := h.voiceClient.CountByVisibility(ctx, "private")

	var jobCount, feedbackCount int64
	h.db.Model(&model.Job{}).Count(&jobCount)
	h.db.Model(&model.Feedback{}).Count(&feedbackCount)

	response.OK(c, map[string]interface{}{
		"overview": map[string]interface{}{
			"users":         userCount,
			"voices":        voiceCount,
			"jobs":          jobCount,
			"feedbacks":     feedbackCount,
			"publicVoices":  publicVoices,
			"privateVoices": privateVoices,
		},
	})
}

// System GET /api/admin/system
func (h *Handler) System(ctx context.Context, c *app.RequestContext) {
	userCount, _ := h.userClient.CountAll(ctx)
	voiceCount, _ := h.voiceClient.CountAll(ctx)

	var jobCount int64
	h.db.Model(&model.Job{}).Count(&jobCount)

	response.OK(c, map[string]interface{}{
		"cacheMode":        "redis",
		"mysqlMode":        "postgresql",
		"aiConfigured":     h.cfg.AIAPIKey != "",
		"queueConcurrency": h.cfg.QueueConcurrency,
		"overview": map[string]interface{}{
			"users":  userCount,
			"voices": voiceCount,
			"jobs":   jobCount,
		},
		"serverTime": time.Now().Format(time.RFC3339),
	})
}

// ListUsers GET /api/admin/users
func (h *Handler) ListUsers(ctx context.Context, c *app.RequestContext) {
	search := c.Query("search")
	status := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "12"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 12
	}

	resp, err := h.userClient.AdminListUsers(ctx, &user.AdminListUsersReq{
		Search:   search,
		Status:   status,
		Page:     int32(page),
		PageSize: int32(pageSize),
	})
	if err != nil {
		response.Fail(c, 500, 500, "获取用户列表失败")
		return
	}

	var users []model.User
	if err := json.Unmarshal(resp.GetItems(), &users); err != nil {
		response.Fail(c, 500, 500, "解析用户列表失败")
		return
	}

	response.Paginated(c, users, resp.GetTotal(), page, pageSize)
}

// GetUser GET /api/admin/users/:id
func (h *Handler) GetUser(ctx context.Context, c *app.RequestContext) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	u, err := h.userClient.AdminGetUser(ctx, int64(id))
	if err != nil {
		response.Fail404(c, "用户不存在")
		return
	}
	response.OK(c, u)
}

// UpdateUser PUT /api/admin/users/:id
func (h *Handler) UpdateUser(ctx context.Context, c *app.RequestContext) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	var req struct {
		Username  *string `json:"username"`
		Phone     *string `json:"phone"`
		Age       *string `json:"age"`
		Gender    *string `json:"gender"`
		AvatarURL *string `json:"avatarUrl"`
		Status    *string `json:"status"`
		Role      *string `json:"role"`
	}
	if err := c.BindAndValidate(&req); err != nil {
		response.Fail400(c, "请求参数错误")
		return
	}

	updated, err := h.userClient.AdminUpdateUser(ctx, &user.AdminUpdateUserReq{
		Id:        int64(id),
		Username:  req.Username,
		Phone:     req.Phone,
		Age:       req.Age,
		Gender:    req.Gender,
		AvatarUrl: req.AvatarURL,
		Status:    req.Status,
		Role:      req.Role,
	})
	if err != nil {
		response.Fail404(c, "用户不存在")
		return
	}
	response.OK(c, updated, "用户已更新")
}

// DeleteUser DELETE /api/admin/users/:id
func (h *Handler) DeleteUser(ctx context.Context, c *app.RequestContext) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	h.userClient.AdminDeleteUser(ctx, int64(id))
	response.OK(c, nil, "用户及其关联数据已删除")
}

// ListVoices GET /api/admin/voices
func (h *Handler) ListVoices(ctx context.Context, c *app.RequestContext) {
	visibility := c.Query("visibility")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "12"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 12
	}

	resp, err := h.voiceClient.AdminList(ctx, &voice.AdminListVoicesReq{
		Visibility: visibility,
		Page:       int32(page),
		PageSize:   int32(pageSize),
	})
	if err != nil {
		response.Fail(c, 500, 500, "获取声音列表失败")
		return
	}

	response.Paginated(c, resp.GetItems(), resp.GetTotal(), page, pageSize)
}

// UpdateVoice PUT /api/admin/voices/:id
func (h *Handler) UpdateVoice(ctx context.Context, c *app.RequestContext) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	var req struct {
		Visibility *string `json:"visibility"`
		Name       *string `json:"name"`
		Tag        *string `json:"tag"`
	}
	if err := c.BindAndValidate(&req); err != nil {
		response.Fail400(c, "请求参数错误")
		return
	}

	updated, err := h.voiceClient.AdminUpdate(ctx, &voice.AdminUpdateVoiceReq{
		Id:         int64(id),
		Visibility: req.Visibility,
		Name:       req.Name,
		Tag:        req.Tag,
	})
	if err != nil {
		response.Fail404(c, "声音不存在")
		return
	}
	response.OK(c, updated, "声音已更新")
}

// DeleteVoice DELETE /api/admin/voices/:id
func (h *Handler) DeleteVoice(ctx context.Context, c *app.RequestContext) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	h.voiceClient.AdminDelete(ctx, int64(id))
	response.OK(c, nil, "声音已删除")
}

// ListJobs GET /api/admin/jobs
func (h *Handler) ListJobs(ctx context.Context, c *app.RequestContext) {
	jobType := c.Query("type")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "12"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 12
	}

	query := h.db.Model(&model.Job{})
	if jobType != "" {
		query = query.Where("type = ?", jobType)
	}

	var total int64
	query.Count(&total)

	var jobs []model.Job
	query.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&jobs)

	response.Paginated(c, jobs, total, page, pageSize)
}

// DeleteJob DELETE /api/admin/jobs/:id
func (h *Handler) DeleteJob(ctx context.Context, c *app.RequestContext) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	h.db.Delete(&model.Job{}, id)
	response.OK(c, nil, "任务已删除")
}

// ListFeedbacks GET /api/admin/feedbacks
func (h *Handler) ListFeedbacks(ctx context.Context, c *app.RequestContext) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "12"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 12
	}

	var total int64
	h.db.Model(&model.Feedback{}).Count(&total)

	var feedbacks []model.Feedback
	h.db.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&feedbacks)

	response.Paginated(c, feedbacks, total, page, pageSize)
}

// DeleteFeedback DELETE /api/admin/feedbacks/:id
func (h *Handler) DeleteFeedback(ctx context.Context, c *app.RequestContext) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	h.db.Delete(&model.Feedback{}, id)
	response.OK(c, nil, "反馈已删除")
}

// ListTeaching GET /api/admin/teaching
func (h *Handler) ListTeaching(ctx context.Context, c *app.RequestContext) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "12"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 12
	}

	var total int64
	h.db.Model(&model.TeachingProject{}).Count(&total)

	var projects []model.TeachingProject
	h.db.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&projects)

	response.Paginated(c, projects, total, page, pageSize)
}

// DeleteTeaching DELETE /api/admin/teaching/:id
func (h *Handler) DeleteTeaching(ctx context.Context, c *app.RequestContext) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	h.db.Delete(&model.TeachingProject{}, id)
	response.OK(c, nil, "教学项目已删除")
}

// Broadcast POST /api/admin/notifications/broadcast
func (h *Handler) Broadcast(ctx context.Context, c *app.RequestContext) {
	var req struct {
		Title string `json:"title"`
		Desc  string `json:"desc"`
		Type  string `json:"type"`
	}
	if err := c.BindAndValidate(&req); err != nil {
		response.Fail400(c, "请求参数错误")
		return
	}

	title := strings.TrimSpace(req.Title)
	desc := strings.TrimSpace(req.Desc)
	if title == "" || desc == "" {
		response.Fail400(c, "请填写公告标题与内容")
		return
	}

	notifType := req.Type
	if notifType == "" {
		notifType = "system"
	}

	count, err := h.userClient.AdminBroadcast(ctx, &user.BroadcastReq{
		Title: title,
		Desc:  desc,
		Type:  notifType,
	})
	if err != nil {
		response.Fail(c, 500, 500, "公告推送失败")
		return
	}

	response.OK(c, map[string]interface{}{"recipients": count}, "公告已推送给 "+strconv.Itoa(int(count))+" 位用户")
}

func (h *Handler) createAdminToken(admin *model.Admin) (string, error) {
	claims := AdminClaims{
		AdminID:  admin.ID,
		Username: admin.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(h.cfg.JWTSecret))
}

func safeAdmin(admin *model.Admin) map[string]interface{} {
	return map[string]interface{}{
		"id":              admin.ID,
		"username":        admin.Username,
		"phone":           admin.Phone,
		"age":             admin.Age,
		"gender":          admin.Gender,
		"avatarUrl":       admin.AvatarURL,
		"securityAnswers": admin.SecurityAnswers,
		"status":          admin.Status,
		"createdAt":       admin.CreatedAt,
		"updatedAt":       admin.UpdatedAt,
	}
}
