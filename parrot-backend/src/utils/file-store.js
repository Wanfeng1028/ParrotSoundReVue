const fs = require("fs");
const path = require("path");
const { env } = require("../config/env");

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const dataFile = path.join(env.dataDir, "db.json");

const seedState = () => {
  const createdAt = new Date().toISOString();
  return {
    meta: {
      nextIds: {
        user: 4,
        voice: 3,
        job: 4,
        interaction: 4,
        feedback: 1,
        notification: 4,
        teachingProject: 2,
      },
    },
    users: [
      {
        id: 1,
        email: "demo@parrot.local",
        username: "Demo Creator",
        passwordHash:
          "$2b$10$TKh8H1.PnK1I4QTe2e4PQeH0E4VqlhK/SXxPxq8np5xpoE2mR7B2K",
        phone: "13800000000",
        age: "26",
        gender: "女",
        avatarUrl: "",
        securityAnswers: { q1: "1998-05-20", q2: "Lin", q3: "Parrot School" },
        createdAt,
      },
      {
        id: 2,
        email: "community@parrot.local",
        username: "Community Muse",
        passwordHash:
          "$2b$10$TKh8H1.PnK1I4QTe2e4PQeH0E4VqlhK/SXxPxq8np5xpoE2mR7B2K",
        phone: "",
        age: "29",
        gender: "男",
        avatarUrl: "",
        securityAnswers: { q1: "", q2: "", q3: "" },
        createdAt,
      },
      {
        id: 3,
        email: "teacher@parrot.local",
        username: "Course Builder",
        passwordHash:
          "$2b$10$TKh8H1.PnK1I4QTe2e4PQeH0E4VqlhK/SXxPxq8np5xpoE2mR7B2K",
        phone: "",
        age: "31",
        gender: "女",
        avatarUrl: "",
        securityAnswers: { q1: "", q2: "", q3: "" },
        createdAt,
      },
    ],
    emailCodes: [],
    voices: [
      {
        id: 1,
        userId: 1,
        name: "超文男声",
        description: "基于公开中文样音，适合演示讲解与信息播报。",
        tag: "男声 · 沉稳",
        language: "cn",
        visibility: "public",
        coverUrl: "",
        sampleAudioUrl: "/api/media/voice-chaowen",
        createdAt,
        stats: { play: 123, like: 27, favorite: 12, use: 18 },
      },
      {
        id: 2,
        userId: 1,
        name: "小雅女声",
        description: "基于公开中文样音，适合课程解说、品牌旁白与温和表达。",
        tag: "女声 · 温柔",
        language: "cn",
        visibility: "public",
        coverUrl: "",
        sampleAudioUrl: "/api/media/voice-xiaoya",
        createdAt,
        stats: { play: 431, like: 55, favorite: 22, use: 49 },
      },
    ],
    jobs: [
      {
        id: 1,
        userId: 1,
        type: "audio",
        title: "四级听力旁白",
        text: "下面进行英语四级听力考试。",
        voiceId: 1,
        voiceName: "超文男声",
        status: "completed",
        audioUrl: "/api/media/voice-chaowen",
        createdAt,
        updatedAt: createdAt,
        settings: { volume: 80, pitch: 55, speed: 1.0, emotion: "默认" },
      },
      {
        id: 2,
        userId: 1,
        type: "audio",
        title: "开场白试听",
        text: "欢迎来到 Parrot Sound。",
        voiceId: 2,
        voiceName: "小雅女声",
        status: "completed",
        audioUrl: "/api/media/voice-xiaoya",
        createdAt,
        updatedAt: createdAt,
        settings: { volume: 76, pitch: 60, speed: 1.1, emotion: "轻松" },
      },
      {
        id: 3,
        userId: 1,
        type: "teaching",
        title: "高中历史第一课",
        text: "本节课我们学习工业革命的起点。",
        voiceId: 1,
        voiceName: "超文男声",
        status: "completed",
        audioUrl: "/api/media/voice-chaowen",
        createdAt,
        updatedAt: createdAt,
        settings: { ratio: "16:9", resolution: "1080P", bitrate: "default" },
      },
    ],
    interactions: [
      { id: 1, userId: 1, actorId: 2, voiceId: 1, type: "favorite", createdAt },
      { id: 2, userId: 1, actorId: 3, voiceId: 1, type: "like", createdAt },
      { id: 3, userId: 1, actorId: 2, voiceId: 2, type: "use", createdAt },
    ],
    feedbacks: [],
    notifications: [
      {
        id: 1,
        userId: 1,
        type: "system",
        title: "欢迎使用 ParrotSound",
        desc: "登录后可体验智能配音、声音克隆与教学创作。",
        createdAt,
      },
      {
        id: 2,
        userId: 1,
        type: "info",
        title: "声音克隆功能已启用",
        desc: "上传样本后即可创建个人声音模型。",
        createdAt,
      },
      {
        id: 3,
        userId: 1,
        type: "system",
        title: "教学项目模板已准备就绪",
        desc: "可直接在教育教学页生成 AI 讲解稿。",
        createdAt,
      },
    ],
    tutorials: [
      { id: 1, category: "guide", title: "平台快速开始", duration: "02:18", cover: "", summary: "了解项目结构与核心流程。" },
      { id: 2, category: "dubbing", title: "智能配音工作流", duration: "03:12", cover: "", summary: "从 AI 文案生成到导出音频。" },
      { id: 3, category: "clone", title: "声音克隆最佳实践", duration: "02:50", cover: "", summary: "上传样本、建模与社区发布。" },
      { id: 4, category: "education", title: "教学项目创建", duration: "04:05", cover: "", summary: "生成讲解稿并创建教学任务。" },
    ],
    teachingProjects: [
      {
        id: 1,
        userId: 1,
        title: "工业革命导学",
        script: "工业革命的本质，是生产方式的巨大变革。",
        ratio: "16:9",
        resolution: "1080P",
        bitrate: "default",
        subtitleEnabled: true,
        voiceId: 1,
        status: "completed",
        createdAt,
        updatedAt: createdAt,
      },
    ],
  };
};

ensureDir(env.dataDir);
ensureDir(env.uploadDir);

let cachedState = null;
let flushTimer = null;
let flushPromise = null;

const writeState = (state) => {
  fs.writeFileSync(dataFile, JSON.stringify(state, null, 2), "utf-8");
  return state;
};

const loadState = () => {
  if (cachedState) {
    return cachedState;
  }
  if (!fs.existsSync(dataFile)) {
    cachedState = writeState(seedState());
    return cachedState;
  }
  cachedState = JSON.parse(fs.readFileSync(dataFile, "utf-8"));
  return cachedState;
};

const flushState = () => {
  if (!cachedState) return Promise.resolve();
  flushPromise = Promise.resolve().then(() => {
    writeState(cachedState);
  });
  return flushPromise.finally(() => {
    flushPromise = null;
  });
};

const scheduleFlush = () => {
  if (flushTimer) {
    clearTimeout(flushTimer);
  }
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushState();
  }, 50);
};

const saveState = (updater) => {
  const current = loadState();
  const next = updater(current);
  cachedState = next;
  scheduleFlush();
  return cachedState;
};

module.exports = { loadState, saveState, ensureDir, flushState };
