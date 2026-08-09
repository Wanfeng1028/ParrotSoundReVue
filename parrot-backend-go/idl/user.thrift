// user.thrift - 用户服务 IDL
// 阶段 2.3：将用户模块（含认证、通知、互动）拆分为独立 Kitex 服务
// gateway 和其他服务通过 Kitex RPC 调用 user-service

namespace go user

// ===== 数据结构 =====

// User 用户信息（不含密码哈希）
struct User {
    1: i64 id
    2: string email
    3: string username
    4: string phone
    5: string age
    6: string gender
    7: string avatarUrl
    8: binary securityAnswers  // JSON
    9: string role
    10: string status
    11: string createdAt
}

// AuthResp 认证响应（登录/注册/社交登录）
struct AuthResp {
    1: string token
    2: User user
}

// SendCodeResp 验证码响应
struct SendCodeResp {
    1: string email
    2: string expiresAt
    3: bool devMode
    4: optional string code  // devMode 时返回
}

// Notification 通知
struct Notification {
    1: i64 id
    2: i64 userId
    3: string type
    4: string title
    5: string desc
    6: bool isRead
    7: string eventId
    8: string createdAt
}

// Interaction 互动记录
struct Interaction {
    1: i64 id
    2: i64 userId
    3: i64 actorId
    4: i64 voiceId
    5: string type
    6: string createdAt
}

// PaginatedResp 通用分页响应
struct PaginatedResp {
    1: binary items  // JSON 序列化的列表
    2: i64 total
    3: i32 page
    4: i32 pageSize
}

// ===== 请求类型 =====

struct LoginReq {
    1: string email
    2: string password
}

struct RegisterReq {
    1: string email
    2: string username
    3: string password
    4: string code
}

struct ResetPasswordReq {
    1: string email
    2: string password
    3: string code
}

struct UpdateProfileReq {
    1: i64 userId
    2: optional string username
    3: optional string phone
    4: optional string age
    5: optional string gender
    6: optional string avatarUrl
}

struct UpdatePasswordReq {
    1: i64 userId
    2: optional string q1
    3: optional string q2
    4: optional string q3
    5: string password
    6: string confirmPassword
}

struct CreateNotificationReq {
    1: i64 userId
    2: string type
    3: string title
    4: string desc
    5: string eventId
}

struct CreateInteractionReq {
    1: i64 userId
    2: i64 actorId
    3: i64 voiceId
    4: string type
}

struct GetListReq {
    1: i64 userId
    2: string type
    3: i32 page
    4: i32 pageSize
}

struct AdminListUsersReq {
    1: string search
    2: string status
    3: i32 page
    4: i32 pageSize
}

struct AdminUpdateUserReq {
    1: i64 id
    2: optional string username
    3: optional string phone
    4: optional string age
    5: optional string gender
    6: optional string avatarUrl
    7: optional string status
    8: optional string role
}

struct BroadcastReq {
    1: string title
    2: string desc
    3: string type
}

// ===== 服务定义 =====
service UserService {
    // 认证
    SendCodeResp SendCode(1: string email)
    AuthResp Register(1: RegisterReq req)
    AuthResp Login(1: LoginReq req)
    AuthResp SocialLogin(1: string provider)
    bool ResetPassword(1: ResetPasswordReq req)

    // 用户查询
    User GetUserByID(1: i64 id)
    list<User> GetUsersByIDs(1: list<i64> ids)

    // 用户资料
    User UpdateProfile(1: UpdateProfileReq req)
    bool UpdatePassword(1: UpdatePasswordReq req)

    // 通知
    PaginatedResp GetNotifications(1: GetListReq req)
    bool ReadNotification(1: i64 userId, 2: i64 notifId)
    bool CreateNotification(1: CreateNotificationReq req)

    // 互动
    PaginatedResp GetInteractions(1: GetListReq req)
    bool CreateInteraction(1: CreateInteractionReq req)

    // 管理后台
    PaginatedResp AdminListUsers(1: AdminListUsersReq req)
    User AdminGetUser(1: i64 id)
    User AdminUpdateUser(1: AdminUpdateUserReq req)
    bool AdminDeleteUser(1: i64 id)
    i32 AdminBroadcast(1: BroadcastReq req)

    // 统计
    i64 CountAll()
}
