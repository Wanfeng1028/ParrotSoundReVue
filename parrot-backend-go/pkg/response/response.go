package response

import "github.com/gin-gonic/gin"

// Paginated 分页响应，与 Node 版 {items, total, page, pageSize} 格式一致
type Paginated struct {
	Items    interface{} `json:"items"`
	Total    int64       `json:"total"`
	Page     int         `json:"page"`
	PageSize int         `json:"pageSize"`
}

// OK 成功响应，直接返回数据
func OK(c *gin.Context, data interface{}) {
	c.JSON(200, data)
}

// SendPaginated 分页响应
func SendPaginated(c *gin.Context, items interface{}, total int64, page, pageSize int) {
	c.JSON(200, Paginated{
		Items:    items,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	})
}

// TaskCreated 任务创建响应：{taskId, status: "queued"}
func TaskCreated(c *gin.Context, taskID string) {
	c.JSON(200, gin.H{"taskId": taskID, "status": "queued"})
}

// Error 错误响应
func Error(c *gin.Context, code int, msg string) {
	c.JSON(code, gin.H{"code": -1, "message": msg})
}
