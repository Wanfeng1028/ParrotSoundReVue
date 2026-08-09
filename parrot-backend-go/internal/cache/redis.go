package cache

import (
	"context"
	"errors"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

var ErrNotFound = errors.New("cache: key not found")

// Cache Redis 缓存封装，Redis only，无内存降级
type Cache struct {
	client *redis.Client
}

// New 创建 Redis 缓存客户端
func New(redisURL string) *Cache {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		opts = &redis.Options{Addr: redisURL}
	}
	client := redis.NewClient(opts)

	// 启动时测试连接（不阻断，只打日志）
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	if err := client.Ping(ctx).Err(); err != nil {
		log.Printf("[WARN] Redis 连接失败: %v（缓存相关功能不可用）", err)
	} else {
		log.Println("Redis 连接成功")
	}

	return &Cache{client: client}
}

// Get 获取字符串值，key 不存在返回 ErrNotFound
func (c *Cache) Get(ctx context.Context, key string) (string, error) {
	val, err := c.client.Get(ctx, key).Result()
	if errors.Is(err, redis.Nil) {
		return "", ErrNotFound
	}
	return val, err
}

// Set 设置字符串值，带 TTL
func (c *Cache) Set(ctx context.Context, key, value string, ttl time.Duration) error {
	return c.client.Set(ctx, key, value, ttl).Err()
}

// Del 删除 key
func (c *Cache) Del(ctx context.Context, key string) error {
	return c.client.Del(ctx, key).Err()
}

// Client 暴露原始客户端（供高级用法使用）
func (c *Cache) Client() *redis.Client {
	return c.client
}
