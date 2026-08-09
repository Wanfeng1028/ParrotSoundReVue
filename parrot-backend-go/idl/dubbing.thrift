// dubbing.thrift - 配音服务 IDL
// 阶段 2：将配音模块从单体拆分为独立 Kitex 服务
// gateway 通过 Kitex RPC 调用 dubbing-service，前端接口零改动

namespace go dubbing

// ===== 数据结构 =====

// Voice 音色信息（网关侧透传给前端）
struct Voice {
    1: i64 id
    2: string name
    3: string tag
    4: string avatar
    5: string sampleAudioUrl
}

// Model AI 模型信息
struct Model {
    1: string id
    2: string provider
    3: string label
    4: bool isDefault
}

// OptionsResp 配音选项响应（GET /api/dubbing/options）
struct OptionsResp {
    1: list<Voice> voices
    2: list<string> emotions
    3: list<Model> models
    4: optional Model currentModel
}

// Job 配音记录（对应 model.Job 中 type=audio 的记录）
struct Job {
    1: i64 id
    2: string title
    3: string text
    4: optional i64 voiceId
    5: optional string voiceName
    6: string status
    7: optional string audioUrl
    8: string createdAt
    9: string updatedAt
}

// TaskCreatedResp 任务创建响应
struct TaskCreatedResp {
    1: string taskId
    2: string status
}

// RecordsResp 分页记录响应
struct RecordsResp {
    1: list<Job> items
    2: i64 total
    3: i32 page
    4: i32 pageSize
}

// ===== 请求类型 =====

struct GetOptionsReq {
    1: i64 userID
}

struct GenerateDraftReq {
    1: i64 userID
    2: string prompt
    3: string model
}

struct PreviewReq {
    1: i64 userID
    2: string text
    3: i64 voiceID
    4: string title
    5: binary settings  // JSON 序列化后的字节
}

struct ExportReq {
    1: i64 userID
    2: string text
    3: i64 voiceID
    4: string title
    5: binary settings
}

struct GetRecordsReq {
    1: i64 userID
    2: string search
    3: i32 page
    4: i32 pageSize
}

struct DeleteRecordReq {
    1: i64 userID
    2: i64 jobID
}

// ===== 服务定义 =====
// gateway 通过这些方法调用 dubbing-service
service DubbingService {
    // 获取配音选项（音色 + 情感 + 模型）
    OptionsResp GetOptions(1: GetOptionsReq req)

    // AI 生成配音文案（异步任务）
    TaskCreatedResp GenerateDraft(1: GenerateDraftReq req)

    // 试听配音（异步任务）
    TaskCreatedResp CreatePreview(1: PreviewReq req)

    // 导出配音（异步任务）
    TaskCreatedResp CreateExport(1: ExportReq req)

    // 获取配音记录（分页 + 搜索）
    RecordsResp GetRecords(1: GetRecordsReq req)

    // 删除配音记录
    bool DeleteRecord(1: DeleteRecordReq req)
}
