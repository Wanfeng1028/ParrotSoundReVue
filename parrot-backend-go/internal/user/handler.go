package user

import (
	"encoding/json"
	"strconv"

	"parrot-backend-go/internal/model"
	"parrot-backend-go/kitex_gen/user"
	"parrot-backend-go/kitex_gen/user/userservice"
	"parrot-backend-go/pkg/response"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Handler 用户接口处理器
// 通过 Kitex RPC 调用 user-service；GetHistory 仍直接查询本地 jobs/voices 表
type Handler struct {
	db     *gorm.DB
	client userservice.Client
}

func NewHandler(db *gorm.DB, client userservice.Client) *Handler {
	return &Handler{db: db, client: client}
}

// UpdateProfile PUT /api/user/profile（含头像上传）
func (h *Handler) UpdateProfile(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	req := &user.UpdateProfileReq{
		UserId: int64(userID),
	}

	if v := c.PostForm("username"); v != "" {
		req.Username = &v
	}
	phone := c.PostForm("phone")
	req.Phone = &phone
	age := c.PostForm("age")
	req.Age = &age
	if v := c.PostForm("gender"); v != "" {
		req.Gender = &v
	}

	// 头像上传
	if file, err := c.FormFile("avatar"); err == nil {
		filename := "avatar_" + strconv.Itoa(int(userID)) + "_" + file.Filename
		if err := c.SaveUploadedFile(file, "uploads/"+filename); err == nil {
			avatarURL := "/uploads/" + filename
			req.AvatarUrl = &avatarURL
		}
	}

	u, err := h.client.UpdateProfile(c.Request.Context(), req)
	if err != nil {
		response.Fail(c, 500, 500, "用户服务暂时不可用")
		return
	}

	response.OK(c, u, "资料已更新")
}

// UpdatePassword PUT /api/user/password
func (h *Handler) UpdatePassword(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	var req struct {
		Q1              string `json:"q1"`
		Q2              string `json:"q2"`
		Q3              string `json:"q3"`
		Password        string `json:"password"`
		ConfirmPassword string `json:"confirmPassword"`
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

	rpcReq := &user.UpdatePasswordReq{
		UserId:          int64(userID),
		Password:        req.Password,
		ConfirmPassword: req.ConfirmPassword,
	}
	if req.Q1 != "" {
		rpcReq.Q1 = &req.Q1
	}
	if req.Q2 != "" {
		rpcReq.Q2 = &req.Q2
	}
	if req.Q3 != "" {
		rpcReq.Q3 = &req.Q3
	}

	_, err := h.client.UpdatePassword(c.Request.Context(), rpcReq)
	if err != nil {
		response.Fail(c, 500, 500, "用户服务暂时不可用")
		return
	}

	response.OK(c, nil, "密码修改成功")
}

// GetHistory GET /api/user/history
// jobs/voices 表位于网关，仍直接查询本地 DB
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

	resp, err := h.client.GetInteractions(c.Request.Context(), &user.GetListReq{
		UserId:   int64(userID),
		Type:     tab,
		Page:     int32(page),
		PageSize: int32(pageSize),
	})
	if err != nil {
		response.Fail(c, 500, 500, "用户服务暂时不可用")
		return
	}

	var interactions []model.Interaction
	if err := json.Unmarshal(resp.Items, &interactions); err != nil {
		response.Fail(c, 500, 500, "互动数据解析失败")
		return
	}

	items := make([]gin.H, len(interactions))
	for i, item := range interactions {
		actorName := "匿名用户"
		actorAvatar := ""
		if item.ActorID > 0 {
			actor, err := h.client.GetUserByID(c.Request.Context(), int64(item.ActorID))
			if err == nil && actor != nil {
				actorName = actor.Username
				actorAvatar = actor.AvatarUrl
			}
		}

		items[i] = gin.H{
			"id":          item.ID,
			"type":        item.Type,
			"actorName":   actorName,
			"actorAvatar": actorAvatar,
			"voiceName":   "声音已删除",
			"voiceCover":  "",
			"createdAt":   item.CreatedAt,
		}
	}

	response.Paginated(c, items, resp.Total, int(resp.Page), int(resp.PageSize))
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

	resp, err := h.client.GetNotifications(c.Request.Context(), &user.GetListReq{
		UserId:   int64(userID),
		Type:     tab,
		Page:     int32(page),
		PageSize: int32(pageSize),
	})
	if err != nil {
		response.Fail(c, 500, 500, "用户服务暂时不可用")
		return
	}

	var notifications []model.Notification
	if err := json.Unmarshal(resp.Items, &notifications); err != nil {
		response.Fail(c, 500, 500, "通知数据解析失败")
		return
	}

	response.Paginated(c, notifications, resp.Total, int(resp.Page), int(resp.PageSize))
}

// ReadNotification POST /api/user/notifications/:id/read
func (h *Handler) ReadNotification(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	notifID, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	_, err := h.client.ReadNotification(c.Request.Context(), int64(userID), int64(notifID))
	if err != nil {
		response.Fail(c, 500, 500, "用户服务暂时不可用")
		return
	}

	response.OK(c, nil, "已标记为已读")
}
