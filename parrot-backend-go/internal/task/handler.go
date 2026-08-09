package task

import (
	"parrot-backend-go/pkg/response"

	"github.com/gin-gonic/gin"
)

// TaskHandler 任务状态查询处理器
type TaskHandler struct {
	queue *Queue
}

func NewTaskHandler(queue *Queue) *TaskHandler {
	return &TaskHandler{queue: queue}
}

// GetTask GET /api/tasks/:taskId
func (h *TaskHandler) GetTask(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	taskID := c.Param("taskId")

	task, err := h.queue.GetTask(taskID, userID)
	if err != nil {
		response.Fail404(c, "任务不存在")
		return
	}

	response.OK(c, gin.H{
		"taskId":    task.ID,
		"status":    task.Status,
		"progress":  task.Progress,
		"result":    task.Result,
		"error":     task.Error,
		"type":      task.Type,
		"updatedAt": task.UpdatedAt,
	})
}
