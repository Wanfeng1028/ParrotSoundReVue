# Parrot Frontend

ParrotSoundReVue 的前端子项目，负责产品官网、登录注册、智能配音、声音克隆、教学项目、社区交流、帮助中心和用户中心等页面交互。

## 技术栈

- `Vue 3`
- `Vite`
- `TypeScript`
- `Element Plus`
- `Pinia`
- `Vue Router`
- `Axios`

## 目录结构

```text
parrot-frontend/
|-- public/                静态资源
|-- src/
|   |-- api/               接口封装
|   |-- assets/            图片、图标、音频素材
|   |-- components/        通用组件
|   |-- composables/       页面逻辑复用
|   |-- layouts/           公共布局
|   |-- mocks/             前端演示模式数据与 mock 入口
|   |-- router/            路由配置
|   |-- stores/            Pinia 状态管理
|   |-- types/             类型定义
|   `-- views/             页面视图
|-- .env.example
|-- package.json
`-- vite.config.ts
```

## 本地运行

### 安装依赖

```bash
npm install
```

### 环境变量

复制 `.env.example` 为 `.env`，常用变量如下：

| 变量名 | 说明 |
| --- | --- |
| `VITE_API_BASE_URL` | 后端 API 地址，默认指向 `http://localhost:3000` |
| `VITE_ENABLE_FRONTEND_DEMO` | 是否启用前端演示模式，默认 `false` |

### 启动开发环境

```bash
npm run dev
```

默认访问地址为 [http://localhost:5173](http://localhost:5173)。

## `/api` 代理方式

`vite.config.ts` 已配置代理：

- `/api` -> `http://localhost:3000`
- `/uploads` -> `http://localhost:3000`

因此本地联调时可以直接请求相对路径 `/api/...`，无需在页面层拼接完整后端地址。

## 页面模块

- `/home`：产品首页与价值介绍
- `/login`、`/register`、`/re-password`：认证入口
- `/dubbing`：智能配音
- `/clone`：声音克隆
- `/teaching`：教育教学
- `/community`：社区交流
- `/help`：教程与反馈
- `/user/*`：用户中心、历史、互动、通知

## 前端演示模式

当前项目支持一个显式的前端演示模式，用于后端未就绪时验证页面交互：

1. 在 `.env` 中设置 `VITE_ENABLE_FRONTEND_DEMO=true`
2. 重新启动 `npm run dev`
3. 使用登录页显示的演示账号登录

注意：

- 生产构建默认不会启用演示模式
- 演示模式数据来自 `src/mocks/`
- 页面层不需要知道当前是 mock 还是真实接口

## 常见问题

### 1. 页面请求不到 `/api`

先确认后端已在 `http://localhost:3000` 启动，再检查 `.env` 中的 `VITE_API_BASE_URL` 是否被改错。

### 2. 为什么登录页没有显示测试账号

因为只有在 `VITE_ENABLE_FRONTEND_DEMO=true` 时，演示账号和本地 mock 才会启用。

### 3. 为什么访问旧地址 `/teching` 还能打开页面

项目已统一命名为 `/teaching`，但保留了旧链接兼容别名，避免历史书签失效。
