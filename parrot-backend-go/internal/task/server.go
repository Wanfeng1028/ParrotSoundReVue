package task

import (
	"log"

	"github.com/hibiken/asynq"
)

// StartWorker 启动 Asynq Worker（在后台 goroutine 中运行）
func StartWorker(redisURL string, concurrency int, handlers *Handlers) *asynq.Server {
	srv := asynq.NewServer(
		asynq.RedisClientOpt{Addr: redisURL},
		asynq.Config{
			Concurrency: concurrency,
			Queues: map[string]int{
				"default": 6,
				"low":     2,
			},
		},
	)

	mux := asynq.NewServeMux()
	handlers.Register(mux)

	go func() {
		log.Printf("[Worker] Asynq worker 启动，并发数: %d", concurrency)
		if err := srv.Run(mux); err != nil {
			log.Printf("[Worker] 启动失败: %v", err)
		}
	}()

	return srv
}
