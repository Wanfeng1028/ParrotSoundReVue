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
        voice: 6,
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
        name: "晨光讲述者",
        description: "适合资讯播报和教育讲解。",
        tag: "沉稳",
        language: "cn",
        visibility: "public",
        coverUrl: "",
        sampleAudioUrl: "/api/media/demo-audio",
        createdAt,
        stats: { play: 123, like: 27, favorite: 12, use: 18 },
      },
      {
        id: 2,
        userId: 1,
        name: "灵动旁白",
        description: "轻快且富有亲和力。",
        tag: "活泼",
        language: "cn",
        visibility: "private",
        coverUrl: "",
        sampleAudioUrl: "/api/media/demo-audio",
        createdAt,
        stats: { play: 52, like: 8, favorite: 4, use: 5 },
      },
      {
        id: 3,
        userId: 2,
        name: "新闻男声",
        description: "适合社区热门稿件。",
        tag: "新闻",
        language: "cn",
        visibility: "public",
        coverUrl: "",
        sampleAudioUrl: "/api/media/demo-audio",
        createdAt,
        stats: { play: 512, like: 66, favorite: 28, use: 73 },
      },
      {
        id: 4,
        userId: 2,
        name: "温柔女声",
        description: "柔和适配课程解说。",
        tag: "温柔",
        language: "cn",
        visibility: "public",
        coverUrl: "",
        sampleAudioUrl: "/api/media/demo-audio",
        createdAt,
        stats: { play: 431, like: 55, favorite: 22, use: 49 },
      },
      {
        id: 5,
        userId: 3,
        name: "English Tutor",
        description: "For simple bilingual demos.",
        tag: "en",
        language: "en",
        visibility: "public",
        coverUrl: "",
        sampleAudioUrl: "/api/media/demo-audio",
        createdAt,
        stats: { play: 210, like: 31, favorite: 11, use: 17 },
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
        status: "completed",
        audioUrl: "/api/media/demo-audio",
        createdAt,
        updatedAt: createdAt,
        settings: { volume: 80, pitch: 55, speed: 1.0, emotion: "默认" },
      },
      {
        id: 2,
        userId: 1,
        type: "audio",
        title: "开场白试听",
        text: "欢迎来到 Parrot Sound ReVue。",
        voiceId: 2,
        status: "completed",
        audioUrl: "/api/media/demo-audio",
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
        status: "completed",
        audioUrl: "/api/media/demo-audio",
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
        title: "欢迎使用 ParrotSoundReVue",
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

const writeState = (state) => {
  fs.writeFileSync(dataFile, JSON.stringify(state, null, 2), "utf-8");
  return state;
};

const loadState = () => {
  if (!fs.existsSync(dataFile)) {
    return writeState(seedState());
  }
  return JSON.parse(fs.readFileSync(dataFile, "utf-8"));
};

const saveState = (updater) => {
  const current = loadState();
  const next = updater(current);
  return writeState(next);
};

module.exports = { loadState, saveState, ensureDir };
