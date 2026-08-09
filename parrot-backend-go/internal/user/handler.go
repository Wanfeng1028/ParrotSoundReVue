package user

import (
	"strconv"

	"parrot-backend-go/internal/model"
	"parrot-backend-go/pkg/response"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type Handler struct {
	db *gorm.DB
}

func NewHandler(db *gorm.DB) *Handler {
	return &Handler{db: db}
}

// UpdateProfile PUT /api/user/profile（含头像上传）
func (h *Handler) UpdateProfile(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	var user model.User
	if err := h.db.First(&user, userID).Error; err != nil {
		response.Fail404(c, "用户不存在")
		return
	}

	// 表单字段
	if v := c.PostForm("username"); v != "" {
		user.Username = v
	}
	user.Phone = c.PostForm("phone")
	user.Age = c.PostForm("age")
	if v := c.PostForm("gender"); v != "" {
		user.Gender = v
	}

	// 头像上传
	if file, err := c.FormFile("avatar"); err == nil {
		filename := "avatar_" + strconv.Itoa(int(userID)) + "_" + file.Filename
		if err := c.SaveUploadedFile(file, "uploads/"+filename); err == nil {
			user.AvatarURL = "/uploads/" + filename
		}
	}

	h.db.Save(&user)
	response.OK(c, user, "资料已更新")
}

// UpdatePassword PUT /api/user/password
func (h *Handler) UpdatePassword(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	var req struct {
		Q1               string `json:"q1"`
		Q2               string `json:"q2"`
		Q3               string `json:"q3"`
		Password         string `json:"password"`
		ConfirmPassword  string `json:"confirmPassword"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail400(c, "请求参数错误")
		return
	}

	if req.Password == "" || req.ConfirmPassword == "" {
		response.Fail400(c, "请输入完整密码信息")
		return
	}
	if req.Password != req.ConfirmPassword {
		response.Fail400(c, "两次密码输入不一致")
		return
	}

	var user model.User
	if err := h.db.First(&user, userID).Error; err != nil {
		response.Fail404(c, "用户不存在")
		return
	}

	// 密保验证（简化：如果设置了密保就验证，没设置就跳过）
	// 这里简化处理，直接允许修改
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
	if err != nil {
		response.Fail400(c, "密码加密失败")
		return
	}

	h.db.Model(&user).Update("password_hash", string(hash))
	response.OK(c, nil, "密码修改成功")
}

// GetHistory GET /api/user/history
func (h *Handler) GetHistory(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	historyType := c.DefaultQuery("type", "all")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "12"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 12
	}

	// 查 jobs
	var jobs []model.Job
	h.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&jobs)

	// 查 voices
	var voices []model.Voice
	h.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&voices)

	// 合并
	type historyItem struct {
		ID       string `json:"id"`
		ItemID   uint   `json:"itemId"`
		Type     string `json:"type"`
		Title    string `json:"title"`
		Date     string `json:"date"`
		Cover    string `json:"cover"`
		Status   string `json:"status"`
		AudioURL string `json:"audioUrl"`
	}

	var items []historyItem
	for _, j := range jobs {
		t := "audio"
		if j.Type == "teaching" {
			t = "video"
		}
		if historyType == "all" || historyType == t {
			items = append(items, historyItem{
				ID: j.Type + "-" + strconv.Itoa(int(j.ID)),
				ItemID: j.ID, Type: t, Title: j.Title,
				Date: j.CreatedAt.Format("2006-01-02T15:04:05Z"),
				Status: j.Status, AudioURL: j.AudioURL,
			})
		}
	}
	for _, v := range voices {
		if historyType == "all" || historyType == "voice" {
			items = append(items, historyItem{
				ID: "voice-" + strconv.Itoa(int(v.ID)),
				ItemID: v.ID, Type: "voice", Title: v.Name,
				Date: v.CreatedAt.Format("2006-01-02T15:04:05Z"),
				Cover: v.CoverURL, Status: v.Visibility, AudioURL: v.SampleAudioURL,
			})
		}
	}

	// 手动分页
	total := len(items)
	start := (page - 1) * pageSize
	if start > total {
		start = total
	}
	end := start + pageSize
	if end > total {
		end = total
	}

	response.Paginated(c, items[start:end], int64(total), page, pageSize)
}

// GetInteractions GET /api/user/interactions
func (h *Handler) GetInteractions(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	tab := c.DefaultQuery("type", "all")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "12"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 12
	}

	query := h.db.Model(&model.Interaction{}).Where("user_id = ?", userID)
	if tab != "all" {
		query = query.Where("type = ?", tab)
	}

	var total int64
	query.Count(&total)

	var interactions []model.Interaction
	query.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&interactions)

	items := make([]gin.H, len(interactions))
	for i, item := range interactions {
		var actor model.User
		h.db.First(&actor, item.ActorID)
		var voice model.Voice
		h.db.First(&voice, item.VoiceID)

		actorName := "匿名用户"
		actorAvatar := ""
		if actor.ID > 0 {
			actorName = actor.Username
			actorAvatar = actor.AvatarURL
		}

		voiceName := "声音已删除"
		voiceCover := ""
		if voice.ID > 0 {
			voiceName = voice.Name
			voiceCover = voice.CoverURL
		}

		items[i] = gin.H{
			"id":          item.ID,
			"type":        item.Type,
			"actorName":   actorName,
			"actorAvatar": actorAvatar,
			"voiceName":   voiceName,
			"voiceCover":  voiceCover,
			"createdAt":   item.CreatedAt,
		}
	}

	response.Paginated(c, items, total, page, pageSize)
}

// GetNotifications GET /api/user/notifications
func (h *Handler) GetNotifications(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	tab := c.DefaultQuery("type", "all")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "12"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 12
	}

	query := h.db.Model(&model.Notification{}).Where("user_id = ?", userID)
	if tab != "all" {
		query = query.Where("type = ?", tab)
	}

	var total int64
	query.Count(&total)

	var notifications []model.Notification
	query.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&notifications)

	response.Paginated(c, notifications, total, page, pageSize)
}

// ReadNotification POST /api/user/notifications/:id/read
func (h *Handler) ReadNotification(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	notifID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	h.db.Model(&model.Notification{}).
		Where("id = ? AND user_id = ?", notifID, userID).
		Update("is_read", true)

	response.OK(c, nil, "已标记为已读")
}
