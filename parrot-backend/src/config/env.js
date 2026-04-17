const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
};

const parseList = (value, fallback) => {
  if (!value) return fallback;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const cwd = process.cwd();

const env = {
  port: Number(process.env.PORT || 3000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || "parrot-sound-revue-dev-secret",
  dataDir: path.resolve(cwd, process.env.DATA_DIR || "./data"),
  uploadDir: path.resolve(cwd, process.env.UPLOAD_DIR || "./uploads"),
  requestLogSlowMs: Number(process.env.REQUEST_LOG_SLOW_MS || 500),
  cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS || 60),
  queueConcurrency: Number(process.env.QUEUE_CONCURRENCY || 2),
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    secure: parseBoolean(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "Parrot Sound <noreply@example.com>",
  },
  redisUrl: process.env.REDIS_URL || "",
  mysql: {
    host: process.env.MYSQL_HOST || "",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "",
  },
  ai: {
    provider: process.env.AI_PROVIDER || "openai-compatible",
    baseUrl: process.env.AI_BASE_URL || "https://api.openai.com/v1",
    apiKey: process.env.AI_API_KEY || "",
    defaultModel: process.env.AI_DEFAULT_MODEL || "gpt-4o-mini",
    models: parseList(process.env.AI_MODELS, [
      "gpt-4o-mini",
      "gpt-4.1-mini",
      "claude-3-5-sonnet",
      "gemini-2.5-flash",
      "grok-2-latest",
      "deepseek-chat",
      "deepseek-reasoner",
      "qwen-plus",
      "qwen-max",
      "glm-4-plus",
    ]),
  },
};

module.exports = { env };
