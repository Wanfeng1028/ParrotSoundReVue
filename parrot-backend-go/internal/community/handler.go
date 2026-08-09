package community

import (
	"context"
	"sort"
	"strconv"
	"strings"

	"parrot-backend-go/kitex_gen/user"
	"parrot-backend-go/kitex_gen/user/userservice"
	"parrot-backend-go/kitex_gen/voice"
	"parrot-backend-go/kitex_gen/voice/voiceservice"
	"parrot-backend-go/pkg/response"

	"github.com/cloudwego/hertz/pkg/app"
)

type Handler struct {
	voiceClient voiceservice.Client
	userClient  userservice.Client
}

func NewHandler(vc voiceservice.Client, uc userservice.Client) *Handler {
	return &Handler{voiceClient: vc, userClient: uc}
}

// ListVoices GET /api/community/voices（公开）
func (h *Handler) ListVoices(ctx context.Context, c *app.RequestContext) {
	search := c.Query("search")
	sortParam := c.DefaultQuery("sort", "recommend")
	language := c.DefaultQuery("language", "all")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "12"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 12
	}

	// voice-service 拉取所有公开声音，网关侧再做过滤/排序/分页
	allVoices, err := h.voiceClient.ListPublic(ctx, &voice.ListPublicReq{Search: search, Filter: "all"})
	if err != nil {
		response.Fail(c, 500, 500, "获取声音列表失败")
		return
	}

	// 客户端过滤：语言 + 搜索（大小写不敏感，兼容原 ILIKE 行为）
	q := strings.ToLower(search)
	filtered := make([]*voice.Voice, 0, len(allVoices))
	for _, v := range allVoices {
		if v == nil {
			continue
		}
		if language != "all" && v.Language != language {
			continue
		}
		if search != "" {
			name := strings.ToLower(v.Name)
			desc := strings.ToLower(v.Description)
			if !strings.Contains(name, q) && !strings.Contains(desc, q) {
				continue
			}
		}
		filtered = append(filtered, v)
	}

	// 排序：recommend=likeCount DESC, newest=createdAt DESC, hot=playCount DESC
	switch sortParam {
	case "newest":
		sort.Slice(filtered, func(i, j int) bool { return filtered[i].CreatedAt > filtered[j].CreatedAt })
	case "hot":
		sort.Slice(filtered, func(i, j int) bool { return filtered[i].PlayCount > filtered[j].PlayCount })
	default:
		sort.Slice(filtered, func(i, j int) bool { return filtered[i].LikeCount > filtered[j].LikeCount })
	}

	total := int64(len(filtered))

	// 手动分页
	start := (page - 1) * pageSize
	if start > len(filtered) {
		start = len(filtered)
	}
	end := start + pageSize
	if end > len(filtered) {
		end = len(filtered)
	}
	paged := filtered[start:end]

	// 批量获取作者信息
	userMap := h.userMap(ctx, c, collectUserIDs(paged))

	items := make([]map[string]interface{}, len(paged))
	for i, v := range paged {
		username := "未知用户"
		userAvatar := ""
		if u := userMap[v.UserId]; u != nil {
			username = u.Username
			userAvatar = u.AvatarUrl
		}
		items[i] = map[string]interface{}{
			"id":             v.Id,
			"name":           v.Name,
			"username":       username,
			"userAvatar":     userAvatar,
			"date":           v.CreatedAt,
			"tag":            v.Tag,
			"desc":           v.Description,
			"avatar":         v.CoverUrl,
			"sampleAudioUrl": v.SampleAudioUrl,
			"stats": map[string]interface{}{
				"play":     v.PlayCount,
				"like":     v.LikeCount,
				"favorite": v.FavoriteCount,
				"use":      v.UseCount,
			},
		}
	}

	response.Paginated(c, items, total, page, pageSize)
}

// Rankings GET /api/community/rankings（公开）
func (h *Handler) Rankings(ctx context.Context, c *app.RequestContext) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "5"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 50 {
		pageSize = 5
	}

	resp, err := h.voiceClient.GetRankings(ctx, &voice.RankingsReq{Page: int32(page), PageSize: int32(pageSize)})
	if err != nil {
		response.Fail(c, 500, 500, "获取排行榜失败")
		return
	}

	voices := resp.GetItems()
	total := resp.GetTotal()

	userMap := h.userMap(ctx, c, collectUserIDs(voices))

	items := make([]map[string]interface{}, len(voices))
	for i, v := range voices {
		username := "未知用户"
		userAvatar := ""
		if u := userMap[v.UserId]; u != nil {
			username = u.Username
			userAvatar = u.AvatarUrl
		}
		items[i] = map[string]interface{}{
			"id":         v.Id,
			"name":       v.Name,
			"username":   username,
			"likes":      v.LikeCount,
			"userAvatar": userAvatar,
			"avatar":     v.CoverUrl,
		}
	}

	response.Paginated(c, items, total, page, pageSize)
}

// Like POST /api/community/voices/:id/like
func (h *Handler) Like(ctx context.Context, c *app.RequestContext) {
	h.mutateStat(ctx, c, "like_count", "like", "点赞成功")
}

// Play POST /api/community/voices/:id/play
func (h *Handler) Play(ctx context.Context, c *app.RequestContext) {
	h.mutateStat(ctx, c, "play_count", "play", "试听次数已更新")
}

// Favorite POST /api/community/voices/:id/favorite
func (h *Handler) Favorite(ctx context.Context, c *app.RequestContext) {
	h.mutateStat(ctx, c, "favorite_count", "favorite", "收藏成功")
}

// Use POST /api/community/voices/:id/use
func (h *Handler) Use(ctx context.Context, c *app.RequestContext) {
	h.mutateStat(ctx, c, "use_count", "use", "已加入创作流程")
}

func (h *Handler) mutateStat(ctx context.Context, c *app.RequestContext, field, interactionType, msg string) {
	userID := c.MustGet("userID").(uint)
	voiceID, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	// voice-service 递增计数并返回最新声音
	v, err := h.voiceClient.IncrementStat(ctx, &voice.IncrementStatReq{Id: int64(voiceID), Field: field})
	if err != nil {
		response.Fail404(c, "声音不存在")
		return
	}

	// like/favorite/use 才创建互动记录 + 通知
	if interactionType != "play" {
		label := map[string]string{"like": "点赞", "favorite": "收藏", "use": "使用"}[interactionType]
		_, _ = h.userClient.CreateInteraction(ctx, &user.CreateInteractionReq{
			UserId:  v.UserId,
			ActorId: int64(userID),
			VoiceId: int64(voiceID),
			Type:    interactionType,
		})
		_, _ = h.userClient.CreateNotification(ctx, &user.CreateNotificationReq{
			UserId:  v.UserId,
			Type:    "info",
			Title:   "你的声音收到了新的" + label,
			Desc:    "作品「" + v.Name + "」被" + label + "。",
			EventId: interactionType + "-" + strconv.Itoa(int(userID)) + "-" + strconv.Itoa(int(voiceID)),
		})
	}

	response.OK(c, v, msg)
}

// collectUserIDs 从声音列表中收集去重的作者 ID
func collectUserIDs(voices []*voice.Voice) []int64 {
	seen := map[int64]bool{}
	ids := []int64{}
	for _, v := range voices {
		if v == nil || seen[v.UserId] {
			continue
		}
		seen[v.UserId] = true
		ids = append(ids, v.UserId)
	}
	return ids
}

// userMap 批量获取用户信息并构建 id -> User 映射
func (h *Handler) userMap(ctx context.Context, c *app.RequestContext, ids []int64) map[int64]*user.User {
	m := map[int64]*user.User{}
	if len(ids) == 0 {
		return m
	}
	users, err := h.userClient.GetUsersByIDs(ctx, ids)
	if err != nil {
		return m
	}
	for _, u := range users {
		m[u.Id] = u
	}
	return m
}
