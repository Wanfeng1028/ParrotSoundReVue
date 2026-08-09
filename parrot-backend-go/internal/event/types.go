package event

// 事件类型常量（作为 Asynq 任务类型 + outbox.event_type）
const (
	EventVoiceCloneCompleted = "event:voice_clone_completed"
	EventDubbingExportDone   = "event:dubbing_export_done"
	EventFeedbackReceived    = "event:feedback_received"
)

// VoiceCloneCompletedEvent 声音克隆完成事件
type VoiceCloneCompletedEvent struct {
	UserID  uint   `json:"userId"`
	VoiceID uint   `json:"voiceId"`
	Name    string `json:"name"`
}

// DubbingExportDoneEvent 配音导出完成事件
type DubbingExportDoneEvent struct {
	UserID uint   `json:"userId"`
	JobID  uint   `json:"jobId"`
	Title  string `json:"title"`
}

// FeedbackReceivedEvent 反馈已收到事件
type FeedbackReceivedEvent struct {
	UserID     uint `json:"userId"`
	FeedbackID uint `json:"feedbackId"`
}
