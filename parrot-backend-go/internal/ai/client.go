package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// Client OpenAI 兼容 API 客户端
type Client struct {
	baseURL     string
	apiKey      string
	defaultModel string
	httpClient   *http.Client
}

func New(baseURL, apiKey, defaultModel string) *Client {
	return &Client{
		baseURL:      strings.TrimRight(baseURL, "/"),
		apiKey:       apiKey,
		defaultModel: defaultModel,
		httpClient:   &http.Client{Timeout: 60 * time.Second},
	}
}

// ChatMessage OpenAI 消息格式
type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// chatRequest OpenAI 请求体
type chatRequest struct {
	Model       string        `json:"model"`
	Temperature float64       `json:"temperature"`
	Messages    []ChatMessage `json:"messages"`
}

// chatResponse OpenAI 响应体
type chatResponse struct {
	Choices []struct {
		Message ChatMessage `json:"message"`
	} `json:"choices"`
}

// APIError AI 服务返回的错误
type APIError struct {
	StatusCode int
	Body       string
}

func (e *APIError) Error() string {
	return fmt.Sprintf("AI request failed (%d): %s", e.StatusCode, e.Body)
}

// Chat 调用 OpenAI 兼容的 Chat Completions API
func (c *Client) Chat(ctx context.Context, model string, messages []ChatMessage) (string, error) {
	if c.apiKey == "" {
		return "", &APIError{StatusCode: 503, Body: "AI service is not configured"}
	}

	if model == "" {
		model = c.defaultModel
	}

	reqBody, _ := json.Marshal(chatRequest{
		Model:       model,
		Temperature: 0.7,
		Messages:    messages,
	})

	req, err := http.NewRequestWithContext(ctx, "POST", c.baseURL+"/chat/completions", bytes.NewReader(reqBody))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return "", &APIError{StatusCode: resp.StatusCode, Body: string(body)}
	}

	var result chatResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("parse AI response: %w", err)
	}

	if len(result.Choices) == 0 {
		return "", fmt.Errorf("AI response has no choices")
	}

	return strings.TrimSpace(result.Choices[0].Message.Content), nil
}

// BuildDraft 生成文案（配音/教学/音色描述），无 API key 时返回本地 mock
func (c *Client) BuildDraft(ctx context.Context, prompt, kind, model string) (string, error) {
	systemMap := map[string]string{
		"dubbing":  "You generate concise Chinese dubbing drafts. Return only the final script.",
		"teaching": "You generate structured teaching narration in Chinese. Return only the final script.",
		"voice":    "You create short voice model descriptions in Chinese. Return only the final description.",
	}

	if c.apiKey == "" {
		return c.localDraft(prompt, kind), nil
	}

	return c.Chat(ctx, model, []ChatMessage{
		{Role: "system", Content: systemMap[kind]},
		{Role: "user", Content: prompt},
	})
}

// localDraft 无 API key 时的本地 mock 文案
func (c *Client) localDraft(prompt, kind string) string {
	normalized := strings.ReplaceAll(strings.TrimSpace(prompt), "\n", " ")
	if normalized == "" {
		normalized = "本次主题"
	}

	switch kind {
	case "teaching":
		return fmt.Sprintf("同学们大家好，今天我们围绕「%s」展开学习。\n首先，我们会用一个清晰的生活化场景引入主题，帮助大家快速建立整体印象。\n接着，我们按「概念理解、关键步骤、实际应用」三个部分逐步拆解重点内容。\n最后，我会带大家完成一次简短总结，方便课后复习和再次回看。", normalized)
	case "voice":
		return fmt.Sprintf("这是一款适合「%s」场景的中文音色，整体听感清晰自然，节奏稳定，适合演示、讲解和旁白内容。", normalized)
	default:
		return fmt.Sprintf("大家好，欢迎收听今天的内容。接下来，我们将围绕「%s」展开讲解。\n这段文稿会保持自然、清晰、便于朗读的节奏，适合直接进入智能配音流程。\n你可以根据页面上的音色、情感和语速设置，快速调整成更符合业务场景的表达风格。\n如果需要导出音频，也可以在试听确认后直接完成。", normalized)
	}
}

// IsRetryable 判断 AI 错误是否可重试
func IsRetryable(err error) bool {
	var apiErr *APIError
	if errors.As(err, &apiErr) {
		// 4xx 类错误（参数错误、模型不存在、余额不足）不可重试
		if apiErr.StatusCode >= 400 && apiErr.StatusCode < 500 {
			return false
		}
	}
	// 其余（网络超时、5xx、连接重置）可重试
	return true
}
