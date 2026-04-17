<div align="center">
  <img src="./parrot-frontend/src/assets/images/logo.png" alt="Parrot Sound ReVue Logo" width="180" />

  <h1>ParrotSoundReVue</h1>

  <p>
    An open-source AI voice application for dubbing, voice cloning, teaching content generation,
    and community voice workflows.
  </p>

  <p>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-4f46e5.svg" alt="MIT License" /></a>
    <img src="https://img.shields.io/badge/frontend-Vue%203%20%2B%20Vite-22c55e.svg" alt="Vue 3 + Vite" />
    <img src="https://img.shields.io/badge/backend-Express%20%2B%20Redis%20%2B%20MySQL-2563eb.svg" alt="Express + Redis + MySQL" />
    <img src="https://img.shields.io/badge/AI-OpenAI%20Compatible-f97316.svg" alt="OpenAI Compatible" />
    <img src="https://img.shields.io/badge/status-Active%20Development-111827.svg" alt="Active Development" />
  </p>

  <p>
    <a href="#key-features">Key Features</a> |
    <a href="#ai-workflow">AI Workflow</a> |
    <a href="#quick-start">Quick Start</a> |
    <a href="#project-structure">Project Structure</a> |
    <a href="#performance--concurrency">Performance</a> |
    <a href="#license">License</a>
  </p>
</div>

---

![ParrotSoundReVue Demo](./docs/demo/ai-workflow.svg)

## Overview

ParrotSoundReVue is a full-stack AI product prototype focused on real business integration of large models rather than isolated demo buttons. It connects AI draft generation, dubbing, voice cloning, teaching project generation, user history, notifications, and community voice distribution into one end-to-end workflow.

This repository is open source under the MIT license and keeps the frontend and backend in one monorepo:

- `parrot-frontend`: `Vue 3 + Vite + TypeScript + Element Plus`
- `parrot-backend`: `Express + Redis adapter + MySQL adapter + JWT`
- AI integration: OpenAI-compatible model adapter with configurable provider and model list

## Key Features

### 1. AI Dubbing

- Select models directly in the dubbing UI.
- Generate dubbing scripts from prompts with async task polling.
- Preview and export audio through task-based APIs.
- Automatically write completed outputs into audio history.

### 2. Voice Cloning

- Upload or record voice samples.
- Generate model description and tag suggestions with AI.
- Create private/public voice models.
- Reuse created voices in dubbing, teaching, and community flows.

### 3. Teaching Workflow

- Create teaching projects with slides, scripts, speaker, voice, and background.
- Generate teaching narration with AI.
- Submit video-generation-style tasks asynchronously.
- Sync completed teaching jobs into history records.

### 4. Community Voice Library

- Search, filter, and paginate public voices.
- Like, favorite, preview, and reuse community voices.
- Send selected voices back into the dubbing workflow.
- Maintain ranking boards with cached hot data.

### 5. User System

- Register, login, reset password, and restore JWT session.
- Update profile and avatar.
- View paginated history, interactions, and notifications.
- Support a frontend-only demo account for UI acceptance.

## AI Workflow

The AI capability in this project is visible in the product, not hidden behind backend placeholders.

### Implemented AI Entry Points

- Dubbing page: prompt -> model selection -> script generation -> preview/export task
- Voice clone page: prompt -> AI description/tag suggestion -> model creation
- Teaching page: prompt -> model selection -> teaching script generation -> generation task

### Model Adapter Design

- Backend adapter file: `parrot-backend/src/services/ai-service.js`
- Protocol: OpenAI-compatible `chat/completions`
- Runtime configuration:
  - `AI_PROVIDER`
  - `AI_BASE_URL`
  - `AI_API_KEY`
  - `AI_DEFAULT_MODEL`
  - `AI_MODELS`

### Failure Handling

- If no API key is configured, the backend returns explicit configuration errors.
- AI-heavy flows are now task-based, which prevents the web process from blocking on heavy operations.
- Frontend polls task status through `/api/tasks/:taskId`.

## Quick Start

### 1. Install Dependencies

```bash
cd parrot-backend
npm install

cd ../parrot-frontend
npm install
```

### 2. Configure Environment Variables

Backend:

```bash
cd parrot-backend
cp .env.example .env
```

Frontend:

```bash
cd parrot-frontend
cp .env.example .env
```

### 3. Start Backend

```bash
cd parrot-backend
npm start
```

### 4. Start Frontend

```bash
cd parrot-frontend
npm run dev
```

Default local addresses:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

## Frontend Demo Account

For pure frontend acceptance without backend dependency:

- Email: `demo@frontend.local`
- Password: `Demo123456`

This account uses browser-side mock data but follows the same paginated and task-based API structure as the real frontend.

## Project Structure

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

## Performance & Concurrency

This project now includes a first round of real optimization work.

### Frontend Optimization

- Route-level lazy loading
- Element Plus auto-import and component-level loading
- Vite manual chunk splitting
- `webp`-based large image optimization
- Debounced search for list-heavy pages
- Paginated rendering for community, history, notification, interaction, record, and teaching pages

### Backend Optimization

- Gzip compression middleware
- Request logging with timing and cache-hit markers
- Cache abstraction with Redis fallback to in-memory TTL cache
- Paginated list APIs
- Static file cache headers for `/uploads`
- In-memory state cache and delayed flush for file-store fallback

### High-Concurrency Design

- Stateless JWT-based auth path
- Async task queue for AI generation and export-heavy flows
- `/api/tasks/:taskId` polling interface
- Rate limiting for auth, AI, export, feedback, and interaction endpoints
- MySQL pool configuration prepared for higher concurrency deployment
- Redis-ready cache and counter design for multi-instance deployment

## Public API Conventions

### Paginated Responses

List interfaces now follow:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "pageSize": 12
}
```

### Task Responses

Async interfaces now follow:

```json
{
  "taskId": "xxx",
  "status": "queued"
}
```

Task status polling:

```json
{
  "taskId": "xxx",
  "status": "completed",
  "progress": 100,
  "result": {}
}
```

## Environment Variables

### Frontend

| Variable | Description |
| --- | --- |
| `VITE_API_BASE_URL` | Backend API base URL |

### Backend

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
| `SMTP_*` | Verification code email service |
| `REDIS_URL` | Redis connection string |
| `MYSQL_*` | MySQL connection config |
| `AI_PROVIDER` | AI provider name |
| `AI_BASE_URL` | OpenAI-compatible API base URL |
| `AI_API_KEY` | AI API key |
| `AI_DEFAULT_MODEL` | Default AI model |
| `AI_MODELS` | Comma-separated available models |

## Validation

Completed local validation for the current version:

- Frontend production build: `npm run build`
- Backend app load smoke test: `node -e "require('./src/app')"`

## License

This project is released under the [MIT License](./LICENSE).

## Credits

Designed and implemented around an AI-first product workflow, with emphasis on:

- visible large-model integration in the UI
- full frontend-backend feature closure
- deployable OpenAI-compatible model extension
- practical performance and concurrency improvements
