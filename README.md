<div align="center">
  <img src="./parrot-frontend/src/assets/images/logo.png" alt="Parrot Sound ReVue Logo" width="180" />
  <h1>ParrotSoundReVue</h1>
  <p>Open-source AI voice platform for dubbing, voice cloning, and teaching content creation.</p>
  <p>开源 AI 语音平台，聚焦智能配音、声音克隆与教学内容生成。</p>
  <p>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-4f46e5.svg" alt="MIT License" /></a>
    <img src="https://img.shields.io/badge/frontend-Vue%203%20%2B%20Vite-22c55e.svg" alt="Vue 3 + Vite" />
    <img src="https://img.shields.io/badge/backend-Express%20%2B%20Redis%20%2B%20MySQL-2563eb.svg" alt="Express + Redis + MySQL" />
    <img src="https://img.shields.io/badge/AI-OpenAI%20Compatible-f97316.svg" alt="OpenAI Compatible" />
    <img src="https://img.shields.io/badge/status-Active%20Development-111827.svg" alt="Active Development" />
  </p>
  <p>
    <a href="#中文文档">中文</a> |
    <a href="#english">English</a>
  </p>
</div>

---

![ParrotSoundReVue Demo](./docs/demo/ai-workflow.svg)

## 中文文档

### 项目简介

ParrotSoundReVue 是一个全栈 AI 语音产品原型，核心目标不是做静态 UI 演示，而是把大模型能力真实接入到业务闭环中。项目覆盖智能配音、声音克隆、教育教学、社区声音复用、用户历史、通知与帮助反馈等完整流程。

### 核心能力

- 智能配音：支持模型选择、提示词生成文稿、文本处理、试听任务、导出任务和历史记录沉淀。
- 声音克隆：支持录音或上传样本，生成声音模型，并在配音、教学和社区场景复用。
- 教育教学：支持多页教学项目、讲解稿生成、数字人和声音配置、生成任务提交。
- 社区交流：支持社区声音检索、筛选、试听、点赞、收藏和一键带回配音工作流。
- 用户系统：支持注册、登录、密码重置、资料更新、历史作品、互动消息和通知分页查看。
- 帮助中心：支持教程列表、教程详情和反馈提交流程。

### AI 落地设计

- 后端通过 OpenAI-Compatible 适配层接入大模型，支持配置 provider、base URL 和模型列表。
- 智能配音页已接入 AI 文稿生成与任务轮询。
- 声音克隆页支持 AI 描述和标签建议。
- 教学页支持 AI 讲解稿生成和异步任务化处理。
- AI 重操作统一任务化，前端通过 `/api/tasks/:taskId` 轮询状态，避免阻塞 Web 请求。

### 技术栈

- 前端：`Vue 3`、`Vite`、`TypeScript`、`Element Plus`
- 后端：`Express`、`JWT`、`Redis adapter`、`MySQL adapter`
- AI：OpenAI-Compatible `chat/completions`

### 快速开始

#### 1. 安装依赖

```bash
cd parrot-backend
npm install

cd ../parrot-frontend
npm install
```

#### 2. 配置环境变量

```bash
cd parrot-backend
cp .env.example .env

cd ../parrot-frontend
cp .env.example .env
```

#### 3. 启动项目

```bash
cd parrot-backend
npm start
```

```bash
cd parrot-frontend
npm run dev
```

默认地址：

- 前端：`http://localhost:5173`
- 后端：`http://localhost:3000`

### 前端演示账号

用于纯前端验收的测试账号如下：

- 邮箱：`demo@frontend.local`
- 密码：`Demo123456`

这个账号使用前端本地 mock 数据，但接口结构与真实分页接口、任务接口保持一致。

### 性能与并发优化

当前版本已经完成第一轮全栈性能与高并发改造。

#### 前端优化

- 路由级懒加载
- Element Plus 自动按需引入
- Vite 手动拆包
- 首页和登录页大图 `webp` 优化
- 列表页搜索防抖
- 社区、音频记录、通知、互动、历史、教学项目改为分页渲染

#### 后端优化

- Gzip 压缩中间件
- 带耗时和缓存命中的请求日志
- Redis 优先、内存 TTL 降级的缓存抽象
- 高频列表接口统一分页
- `/uploads` 静态资源缓存头
- 文件存储降级模式下的内存缓存与延迟落盘

#### 高并发设计

- 无状态 JWT 鉴权
- AI、导出、教学生成等重操作改为异步任务队列
- 登录、AI、导出、反馈和互动接口限流
- MySQL 连接池配置
- 面向多实例部署的 Redis 缓存与计数器设计

### 公共接口约定

#### 分页响应

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "pageSize": 12
}
```

#### 任务创建响应

```json
{
  "taskId": "xxx",
  "status": "queued"
}
```

#### 任务状态响应

```json
{
  "taskId": "xxx",
  "status": "completed",
  "progress": 100,
  "result": {}
}
```

### 环境变量

#### 前端

| 变量名 | 说明 |
| --- | --- |
| `VITE_API_BASE_URL` | 后端 API 基础地址 |

#### 后端

| 变量名 | 说明 |
| --- | --- |
| `PORT` | 后端端口 |
| `FRONTEND_ORIGIN` | 前端地址，用于 CORS |
| `JWT_SECRET` | JWT 密钥 |
| `DATA_DIR` | 本地数据目录 |
| `UPLOAD_DIR` | 上传目录 |
| `REQUEST_LOG_SLOW_MS` | 慢请求阈值 |
| `CACHE_TTL_SECONDS` | 默认缓存时间 |
| `QUEUE_CONCURRENCY` | 异步任务并发数 |
| `SMTP_*` | 验证码邮件服务 |
| `REDIS_URL` | Redis 连接地址 |
| `MYSQL_*` | MySQL 连接配置 |
| `AI_PROVIDER` | AI 提供方名称 |
| `AI_BASE_URL` | OpenAI-Compatible API 地址 |
| `AI_API_KEY` | AI 接口密钥 |
| `AI_DEFAULT_MODEL` | 默认模型 |
| `AI_MODELS` | 可选模型列表 |

### GitHub About 建议内容

右上角 `About` 区域建议填写：

- Description：`鹦音坊 - 基于 AI 语音大模型的智能声音处理软件`
- Website：`https://github.com/Wanfeng1028/ParrotSoundReVue#readme`
- Topics：`ai`, `voice-cloning`, `dubbing`, `text-to-speech`, `tts`, `audio`, `education`, `vue3`, `vite`, `express`, `openai-compatible`

### 项目结构

```text
ParrotSoundReVue/
|-- docs/
|   `-- demo/
|       `-- ai-workflow.svg
|-- parrot-backend/
|   |-- src/
|   |   |-- config/
|   |   |-- middleware/
|   |   |-- routes/
|   |   |-- services/
|   |   `-- utils/
|   `-- .env.example
|-- parrot-frontend/
|   |-- src/
|   |   |-- api/
|   |   |-- assets/
|   |   |-- composables/
|   |   |-- mocks/
|   |   |-- router/
|   |   |-- stores/
|   |   |-- types/
|   |   `-- views/
|   `-- .env.example
|-- LICENSE
`-- README.md
```

### 验证情况

当前版本已经完成以下本地验证：

- 前端生产构建：`npm run build`
- 后端启动冒烟测试：`node -e "require('./src/app')"`

### 开源协议

本项目基于 [MIT License](./LICENSE) 开源。

---

## English

### Overview

ParrotSoundReVue is a full-stack AI voice product prototype built around real product integration instead of isolated demo buttons. It connects AI script generation, dubbing, voice cloning, teaching project creation, community voice reuse, user history, notifications, and feedback into one end-to-end workflow.

### Core Features

- AI dubbing with model selection, prompt-driven script generation, preview tasks, export tasks, and persistent history.
- Voice cloning with audio upload or recording, reusable voice models, and AI-assisted descriptions.
- Teaching workflow with multi-slide projects, narration generation, speaker and background selection, and async generation tasks.
- Community voice library with search, filter, preview, like, favorite, and reuse flows.
- User system with registration, login, password reset, profile updates, paginated history, interactions, and notifications.
- Help center with tutorial list, tutorial detail, and feedback submission.

### AI Product Integration

- The backend uses an OpenAI-Compatible adapter for provider, base URL, and model switching.
- The dubbing page already supports AI script generation with task polling.
- The voice cloning page supports AI-generated descriptions and tags.
- The teaching page supports AI narration generation and async task submission.
- Long-running AI flows are task-based and exposed through `/api/tasks/:taskId`.

### Tech Stack

- Frontend: `Vue 3`, `Vite`, `TypeScript`, `Element Plus`
- Backend: `Express`, `JWT`, `Redis adapter`, `MySQL adapter`
- AI: OpenAI-Compatible `chat/completions`

### Quick Start

#### 1. Install dependencies

```bash
cd parrot-backend
npm install

cd ../parrot-frontend
npm install
```

#### 2. Configure environment variables

```bash
cd parrot-backend
cp .env.example .env

cd ../parrot-frontend
cp .env.example .env
```

#### 3. Start the project

```bash
cd parrot-backend
npm start
```

```bash
cd parrot-frontend
npm run dev
```

Default addresses:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

### Frontend Demo Account

Use the following frontend-only demo account for UI acceptance without backend dependency:

- Email: `demo@frontend.local`
- Password: `Demo123456`

This account uses browser-side mock data while keeping the same paginated and task-based response shapes as the real frontend.

### Performance and Concurrency

The current version already includes a first round of full-stack performance and high-concurrency improvements.

#### Frontend optimizations

- Route-level lazy loading
- Element Plus auto import
- Vite manual chunk splitting
- `webp` optimization for large landing images
- Debounced search on list-heavy pages
- Paginated rendering for community, records, notifications, interactions, history, and teaching projects

#### Backend optimizations

- Gzip compression middleware
- Request logging with timing and cache-hit markers
- Redis-first cache abstraction with in-memory TTL fallback
- Paginated high-frequency list APIs
- Cache headers for `/uploads`
- In-memory cache plus delayed flush for file-store fallback

#### High-concurrency design

- Stateless JWT authentication
- Async task queue for AI generation, export, and teaching jobs
- Rate limiting for auth, AI, export, feedback, and interaction endpoints
- MySQL pool configuration
- Redis-ready cache and counter design for multi-instance deployment

### API Conventions

#### Paginated response

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "pageSize": 12
}
```

#### Task creation response

```json
{
  "taskId": "xxx",
  "status": "queued"
}
```

#### Task status response

```json
{
  "taskId": "xxx",
  "status": "completed",
  "progress": 100,
  "result": {}
}
```

### Environment Variables

#### Frontend

| Variable | Description |
| --- | --- |
| `VITE_API_BASE_URL` | Backend API base URL |

#### Backend

| Variable | Description |
| --- | --- |
| `PORT` | Backend port |
| `FRONTEND_ORIGIN` | Frontend origin for CORS |
| `JWT_SECRET` | JWT secret |
| `DATA_DIR` | Local data directory |
| `UPLOAD_DIR` | Upload directory |
| `REQUEST_LOG_SLOW_MS` | Slow-request threshold |
| `CACHE_TTL_SECONDS` | Default cache TTL |
| `QUEUE_CONCURRENCY` | Async task concurrency |
| `SMTP_*` | Verification email service |
| `REDIS_URL` | Redis connection string |
| `MYSQL_*` | MySQL connection config |
| `AI_PROVIDER` | AI provider name |
| `AI_BASE_URL` | OpenAI-Compatible API base URL |
| `AI_API_KEY` | AI API key |
| `AI_DEFAULT_MODEL` | Default model |
| `AI_MODELS` | Available model list |

### Suggested GitHub About

Recommended values for the GitHub `About` panel:

- Description: `ParrotSoundReVue - An open-source AI voice platform for dubbing, voice cloning, and teaching content creation.`
- Website: `https://github.com/Wanfeng1028/ParrotSoundReVue#readme`
- Topics: `ai`, `voice-cloning`, `dubbing`, `text-to-speech`, `tts`, `audio`, `education`, `vue3`, `vite`, `express`, `openai-compatible`

### Project Structure

```text
ParrotSoundReVue/
|-- docs/
|   `-- demo/
|       `-- ai-workflow.svg
|-- parrot-backend/
|   |-- src/
|   |   |-- config/
|   |   |-- middleware/
|   |   |-- routes/
|   |   |-- services/
|   |   `-- utils/
|   `-- .env.example
|-- parrot-frontend/
|   |-- src/
|   |   |-- api/
|   |   |-- assets/
|   |   |-- composables/
|   |   |-- mocks/
|   |   |-- router/
|   |   |-- stores/
|   |   |-- types/
|   |   `-- views/
|   `-- .env.example
|-- LICENSE
`-- README.md
```

### Validation

Local validation completed for the current version:

- Frontend production build: `npm run build`
- Backend app smoke test: `node -e "require('./src/app')"`

### License

This project is released under the [MIT License](./LICENSE).
