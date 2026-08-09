// voice.thrift - 声音克隆服务 IDL
// 阶段 2.3：将声音模块拆分为独立 Kitex 服务
// gateway 通过 Kitex RPC 调用 voice-service，dubbing-service 也通过 RPC 校验音色

namespace go voice

// ===== 数据结构 =====

// Voice 音色模型（对应 model.Voice）
struct Voice {
    1: i64 id
    2: i64 userId
    3: string name
    4: string description
    5: string tag
    6: string language
    7: string visibility
    8: string coverUrl
    9: string sampleAudioUrl
    10: i32 playCount
    11: i32 likeCount
    12: i32 favoriteCount
    13: i32 useCount
    14: string createdAt
}

// PaginatedVoices 分页音色响应
struct PaginatedVoices {
    1: list<Voice> items
    2: i64 total
    3: i32 page
    4: i32 pageSize
}

// ===== 请求类型 =====

struct ListPublicReq {
    1: string search
    2: string filter
}

struct CreateVoiceReq {
    1: i64 userId
    2: string name
    3: string description
    4: string tag
    5: string visibility
    6: string language
    7: string coverUrl
    8: string sampleAudioUrl
}

struct UpdateVisibilityReq {
    1: i64 id
    2: i64 userId
    3: string visibility
}

struct DeleteVoiceReq {
    1: i64 id
    2: i64 userId
}

struct DescribeReq {
    1: string name
    2: string prompt
    3: string model
}

struct IncrementStatReq {
    1: i64 id
    2: string field  // play_count / like_count / favorite_count / use_count
}

struct RankingsReq {
    1: i32 page
    2: i32 pageSize
}

struct AdminListVoicesReq {
    1: string visibility
    2: i32 page
    3: i32 pageSize
}

struct AdminUpdateVoiceReq {
    1: i64 id
    2: optional string visibility
    3: optional string name
    4: optional string tag
}

struct ValidateVoiceReq {
    1: i64 id
    2: i64 userId
}

// ===== 服务定义 =====
service VoiceService {
    // 用户端
    list<Voice> ListPublic(1: ListPublicReq req)
    list<Voice> ListByUser(1: i64 userId)
    Voice Create(1: CreateVoiceReq req)
    bool UpdateVisibility(1: UpdateVisibilityReq req)
    bool Delete(1: DeleteVoiceReq req)
    string DescribeAI(1: DescribeReq req)

    // 社区端（gateway community 模块调用）
    PaginatedVoices GetRankings(1: RankingsReq req)
    Voice IncrementStat(1: IncrementStatReq req)

    // 管理后台
    PaginatedVoices AdminList(1: AdminListVoicesReq req)
    Voice AdminUpdate(1: AdminUpdateVoiceReq req)
    bool AdminDelete(1: i64 id)

    // 统计
    i64 CountAll()
    i64 CountByVisibility(1: string visibility)

    // 跨服务校验（dubbing-service 调用）
    Voice ValidateForUser(1: ValidateVoiceReq req)
}
