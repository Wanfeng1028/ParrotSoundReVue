package middleware

import (
	"fmt"
	"sync"
	"time"

	"parrot-backend-go/pkg/response"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

// limiterEntry 限流器条目，带最后访问时间用于 LRU 清理
type limiterEntry struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

// RateLimiter 令牌桶限流器，带定期清理避免内存泄漏
type RateLimiter struct {
	mu       sync.Mutex
	limiters map[string]*limiterEntry
	rate     rate.Limit
	burst    int
}

// NewRateLimiter 创建限流器，启动后台协程定期清理过期条目
func NewRateLimiter(r rate.Limit, burst int) *RateLimiter {
	rl := &RateLimiter{
		limiters: make(map[string]*limiterEntry),
		rate:     r,
		burst:    burst,
	}
	// 每 5 分钟清理一次超过 10 分钟没访问的 limiter
	go rl.cleanup(5*time.Minute, 10*time.Minute)
	return rl
}

func (rl *RateLimiter) cleanup(interval, maxAge time.Duration) {
	ticker := time.NewTicker(interval)
	for range ticker.C {
		rl.mu.Lock()
		now := time.Now()
		for key, entry := range rl.limiters {
			if now.Sub(entry.lastSeen) > maxAge {
				delete(rl.limiters, key)
			}
		}
		rl.mu.Unlock()
	}
}

func (rl *RateLimiter) getLimiter(key string) *rate.Limiter {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	if entry, ok := rl.limiters[key]; ok {
		entry.lastSeen = time.Now()
		return entry.limiter
	}
	entry := &limiterEntry{
		limiter:  rate.NewLimiter(rl.rate, rl.burst),
		lastSeen: time.Now(),
	}
	rl.limiters[key] = entry
	return entry.limiter
}

// Middleware 返回 Gin 中间件，key 按 scope + userID/IP 生成
func (rl *RateLimiter) Middleware(scope string) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := fmt.Sprintf("%s:%s", scope, c.ClientIP())
		if uid, ok := c.Get("userID"); ok {
			key = fmt.Sprintf("%s:user:%v", scope, uid)
		}
		if !rl.getLimiter(key).Allow() {
			response.Fail429(c, "请求过于频繁，请稍后再试")
			c.Abort()
			return
		}
		c.Next()
	}
}
