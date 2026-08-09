package response

import "github.com/gin-gonic/gin"

// Response 统一响应结构，与 Node 版 {code, msg, data} 格式一致
type Response struct {
	Code int         `json:"code"`
	Msg  string      `json:"msg"`
	Data interface{} `json:"data"`
}

// PaginatedData 分页数据，嵌套在 Response.Data 里
type PaginatedData struct {
	Items    interface{} `json:"items"`
	Total    int64       `json:"total"`
	Page     int         `json:"page"`
	PageSize int         `json:"pageSize"`
}

// OK 成功响应：{code: 200, msg, data}
func OK(c *gin.Context, data interface{}, msg ...string) {
	m := "ok"
	if len(msg) > 0 {
		m = msg[0]
	}
	c.JSON(200, Response{Code: 200, Msg: m, Data: data})
}

// Paginated 分页响应：{code: 200, msg: "ok", data: {items, total, page, pageSize}}
func Paginated(c *gin.Context, items interface{}, total int64, page, pageSize int, msg ...string) {
	m := "ok"
	if len(msg) > 0 {
		m = msg[0]
	}
	c.JSON(200, Response{
		Code: 200,
		Msg:  m,
		Data: PaginatedData{Items: items, Total: total, Page: page, PageSize: pageSize},
	})
}

// TaskCreated 任务创建响应：{code: 200, msg: "ok", data: {taskId, status}}
func TaskCreated(c *gin.Context, taskID string) {
	c.JSON(200, Response{
		Code: 200,
		Msg:  "ok",
		Data: map[string]interface{}{"taskId": taskID, "status": "queued"},
	})
}

// Fail 失败响应：HTTP status + {code, msg, data: null}
func Fail(c *gin.Context, httpStatus int, code int, msg string) {
	c.JSON(httpStatus, Response{Code: code, Msg: msg, Data: nil})
}

// Fail400 请求错误
func Fail400(c *gin.Context, msg string) {
	c.JSON(400, Response{Code: 400, Msg: msg, Data: nil})
}

// Fail404 未找到
func Fail404(c *gin.Context, msg string) {
	c.JSON(404, Response{Code: 404, Msg: msg, Data: nil})
}

// Fail409 冲突
func Fail409(c *gin.Context, msg string) {
	c.JSON(409, Response{Code: 409, Msg: msg, Data: nil})
}

// Fail401 未认证
func Fail401(c *gin.Context, msg string) {
	c.JSON(401, Response{Code: 401, Msg: msg, Data: nil})
}

// Fail429 限流
func Fail429(c *gin.Context, msg string) {
	c.JSON(429, Response{Code: 429, Msg: msg, Data: nil})
}
