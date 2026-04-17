# ParrotSoundReVue

ParrotSoundReVue 是一个面向配音创作、声音克隆、教学课件和社区声音分发的 AI 语音应用。当前仓库采用 MIT 开源协议，前后端同仓维护，重点体现了 AI 大模型在真实业务流程中的接入、切换、失败态处理和落地闭环。

![AI Workflow](./docs/demo/ai-workflow.svg)

## 项目亮点

- AI 大模型能力显性落地
  - 智能配音页支持模型选择、AI 文稿生成、试听与导出入库。
  - 声音克隆页支持 AI 生成模型描述与标签，再进入样本上传和模型创建。
  - 教育教学页支持 AI 讲解稿生成，并保存为教学任务。
- 模型扩展设计可部署
  - 后端采用 OpenAI-Compatible Adapter，支持通过环境变量切换 provider、base URL、API key 和模型列表。
  - 前端不写死供应商，直接读取可用模型列表并在 UI 中暴露选择器。
  - 当 API key 未配置时，接口会明确返回配置错误，不伪造 AI 成功结果。
- 核心业务闭环
  - 登录注册、验证码、重置密码、用户资料维护。
  - 声音模型创建、公开/私有切换、社区使用、点赞收藏、历史作品与通知联动。
  - 音频记录、教学任务、帮助反馈均已接入真实接口。

## 技术架构

- 前端
  - Vue 3
  - Vite
  - TypeScript
  - Element Plus
  - Pinia
- 后端
  - Express
  - MySQL connector
  - Redis connector
  - JWT Auth
  - Multer 文件上传
- AI 接入
  - OpenAI-Compatible Chat Completions Adapter
  - 通过 `.env` 配置模型列表和默认模型

## 仓库结构

```text
ParrotSoundReVue/
├─ docs/
│  └─ demo/
│     └─ ai-workflow.svg
├─ parrot-backend/
│  ├─ src/
│  │  ├─ config/
│  │  ├─ middleware/
│  │  ├─ routes/
│  │  ├─ services/
│  │  └─ utils/
│  ├─ .env.example
│  └─ server.js
├─ parrot-frontend/
│  ├─ src/
│  │  ├─ api/
│  │  ├─ components/
│  │  ├─ composables/
│  │  ├─ router/
│  │  ├─ stores/
│  │  ├─ types/
│  │  └─ views/
│  └─ .env.example
├─ LICENSE
└─ README.md
```

## 已完成功能

### 1. 认证与用户系统

- 邮箱验证码发送
- 注册 / 登录 / 重置密码
- JWT 登录态恢复
- 用户资料更新与头像上传
- 密保校验后修改密码
- 历史作品、互动信息、通知中心

### 2. 智能配音

- 模型选择
- AI 文稿生成
- 声音选择、情感参数调整
- 试听任务创建
- 导出音频并写入音频记录

### 3. 声音克隆

- 封面上传
- 音频样本上传
- AI 自动生成模型描述与标签
- 创建个人声音模型
- 公开 / 私有切换
- 删除声音模型

### 4. 社区与反馈

- 社区声音检索
- 排序、语言筛选
- 点赞、收藏、使用声音
- 榜单展示
- 帮助教程
- 用户反馈提交

### 5. 教育教学 MVP

- 教学项目保存
- AI 生成讲解稿
- 模型选择
- 生成教学任务并进入历史

## AI 大模型应用设计

### 前端设计

- 智能配音页顶部提供模型下拉选择器。
- 教学页顶部提供模型选择与 AI 帮写入口。
- 声音克隆页提供 AI 描述生成按钮。
- 所有 AI 入口都和业务实体绑定，不是独立演示按钮。

### 后端设计

- 统一适配器位于 `parrot-backend/src/services/ai-service.js`
- 当前兼容 OpenAI `chat/completions` 风格接口
- 环境变量控制：
  - `AI_PROVIDER`
  - `AI_BASE_URL`
  - `AI_API_KEY`
  - `AI_DEFAULT_MODEL`
  - `AI_MODELS`

### 当前落地场景

- 配音文案生成
- 声音模型标签/描述生成
- 教学讲解稿生成

## 本地运行

### 1. 安装依赖

```bash
cd parrot-backend
npm install

cd ../parrot-frontend
npm install
```

### 2. 配置环境变量

后端：

```bash
cd parrot-backend
cp .env.example .env
```

前端：

```bash
cd parrot-frontend
cp .env.example .env
```

### 3. 启动后端

```bash
cd parrot-backend
npm start
```

### 4. 启动前端

```bash
cd parrot-frontend
npm run dev
```

默认地址：

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

## 环境变量说明

### 前端

| 变量 | 说明 |
| --- | --- |
| `VITE_API_BASE_URL` | 后端 API 基础地址 |

### 后端

| 变量 | 说明 |
| --- | --- |
| `PORT` | 后端端口 |
| `FRONTEND_ORIGIN` | 前端地址，用于 CORS |
| `JWT_SECRET` | JWT 密钥 |
| `DATA_DIR` | 本地数据目录 |
| `UPLOAD_DIR` | 上传目录 |
| `SMTP_*` | 邮箱验证码服务 |
| `REDIS_URL` | Redis 连接地址 |
| `MYSQL_*` | MySQL 连接配置 |
| `AI_PROVIDER` | AI 供应商标识 |
| `AI_BASE_URL` | OpenAI-Compatible API 地址 |
| `AI_API_KEY` | AI 接口密钥 |
| `AI_DEFAULT_MODEL` | 默认模型 |
| `AI_MODELS` | 前端可选模型列表 |

## 数据与部署说明

- 当前默认本地开发模式使用文件持久化，零配置即可跑通主要功能。
- Redis 已接入缓存抽象，配置 `REDIS_URL` 后会自动切换为 Redis。
- MySQL 连接已预留，配置完整后会进入数据库连接模式；当前示例数据与业务流在本地文件库中可直接运行。

## 数据库初始化

当前版本的开箱即用初始化采用文件数据种子。首次启动后端时，会自动创建：

- 用户数据
- 社区声音数据
- 音频记录
- 通知中心数据
- 教学项目示例

如果你要接入 MySQL，建议先按以下实体建表再迁移：

- `users`
- `voices`
- `jobs`
- `interactions`
- `notifications`
- `feedbacks`
- `teaching_projects`

## 页面预览

### AI 大模型落地流程动图

- 智能配音：模型选择 -> AI 文稿生成 -> 试听/导出
- 声音克隆：提示词 -> AI 标签/描述 -> 创建模型
- 教学页：模型选择 -> 讲解稿生成 -> 生成教学任务

README 顶部展示的动画 SVG 已覆盖这三条主流程。

## 构建与验证

已完成本地验证：

- 前端 `npm run build`
- 后端健康检查 `/api/ping`

## 开源协议

本项目采用 [MIT License](./LICENSE)。

## 常见问题

### 1. 为什么 AI 生成失败？

通常是因为没有配置 `AI_API_KEY`，后端会直接返回明确错误，不会伪造成功结果。

### 2. 为什么验证码接口会直接返回验证码？

如果没有配置 SMTP，系统会进入开发模式，便于本地联调。

### 3. 为什么默认没有强制要求 MySQL 和 Redis？

为了保证开箱即用。当前仓库仍然保留了 MySQL / Redis 接入层，部署时可以直接接入真实基础设施。
