package task

import (
	"context"

	"parrot-backend-go/pkg/response"

	"github.com/cloudwego/hertz/pkg/app"
)

// TaskHandler 任务状态查询处理器
type TaskHandler struct {
	queue *Queue
}

func NewTaskHandler(queue *Queue) *TaskHandler {
	return &TaskHandler{queue: queue}
}

// GetTask GET /api/tasks/:taskId
func (h *TaskHandler) GetTask(ctx context.Context, c *app.RequestContext) {
	userID := c.MustGet("userID").(uint)
	taskID := c.Param("taskId")

	task, err := h.queue.GetTask(taskID, userID)
	if err != nil {
		response.Fail404(c, "任务不存在")
		return
	}

	response.OK(c, map[string]interface{}{
		"taskId":    task.ID,
		"status":    task.Status,
		"progress":  task.Progress,
		"result":    task.Result,
		"error":     task.Error,
		"type":      task.Type,
		"updatedAt": task.UpdatedAt,
	})
}
