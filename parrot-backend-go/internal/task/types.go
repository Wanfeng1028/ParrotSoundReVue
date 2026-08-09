package task

import "encoding/json"

// 任务类型常量
const (
	TypeDubbingDraft   = "dubbing:draft"
	TypeDubbingPreview = "dubbing:preview"
	TypeDubbingExport  = "dubbing:export"
)

// DubbingDraftPayload AI 生成文案的 payload
type DubbingDraftPayload struct {
	UserID uint   `json:"userId"`
	Prompt string `json:"prompt"`
	Model  string `json:"model"`
}

// DubbingAudioPayload 试听/导出配音的 payload
type DubbingAudioPayload struct {
	UserID   uint            `json:"userId"`
	Text     string          `json:"text"`
	VoiceID  uint            `json:"voiceId"`
	Title    string          `json:"title"`
	Settings json.RawMessage `json:"settings"`
}
