package config

import (
	"fmt"
	"log"

	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
)

// Config 全局配置，通过环境变量加载，启动时校验必填项
type Config struct {
	Port             string   `envconfig:"PORT" default:"3000"`
	FrontendOrigin   string   `envconfig:"FRONTEND_ORIGIN" default:"http://localhost:5173"`
	JWTSecret        string   `envconfig:"JWT_SECRET" required:"true"`
	UploadDir        string   `envconfig:"UPLOAD_DIR" default:"./uploads"`
	RequestLogSlowMs int      `envconfig:"REQUEST_LOG_SLOW_MS" default:"500"`
	CacheTTLSeconds  int      `envconfig:"CACHE_TTL_SECONDS" default:"300"`
	QueueConcurrency int      `envconfig:"QUEUE_CONCURRENCY" default:"10"`
	RedisURL         string   `envconfig:"REDIS_URL" required:"true"`

	// PostgreSQL
	PGHost     string `envconfig:"PG_HOST" required:"true"`
	PGPort     int    `envconfig:"PG_PORT" default:"5432"`
	PGUser     string `envconfig:"PG_USER" required:"true"`
	PGPassword string `envconfig:"PG_PASSWORD" required:"true"`
	PGDatabase string `envconfig:"PG_DATABASE" required:"true"`
	PGSSLMode  string `envconfig:"PG_SSLMODE" default:"disable"`

	// AI Provider
	AIBaseURL      string   `envconfig:"AI_BASE_URL" required:"true"`
	AIAPIKey       string   `envconfig:"AI_API_KEY" required:"true"`
	AIDefaultModel string   `envconfig:"AI_DEFAULT_MODEL" default:"gpt-4o-mini"`
	AIModels       []string `envconfig:"AI_MODELS" default:"gpt-4o-mini,gpt-4.1-mini"`

	// 阶段 2 新增
	EtcdAddr string `envconfig:"ETCD_ADDR"`
	// 阶段 3 新增
	JaegerEndpoint string `envconfig:"JAEGER_ENDPOINT"`
}

// PGDSN 返回 PostgreSQL 连接串
func (c *Config) PGDSN() string {
	return fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s TimeZone=Asia/Shanghai",
		c.PGHost, c.PGPort, c.PGUser, c.PGPassword, c.PGDatabase, c.PGSSLMode)
}

// Load 加载配置：先尝试 .env 文件，再从环境变量读取并校验
func Load() *Config {
	// .env 文件不存在则跳过，生产环境用真实环境变量
	_ = godotenv.Load()

	var cfg Config
	if err := envconfig.Process("", &cfg); err != nil {
		log.Fatalf("配置校验失败: %v", err)
	}
	return &cfg
}
