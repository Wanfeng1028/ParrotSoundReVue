import type { AuthUser } from "../types";

export const FRONTEND_DEMO_EMAIL = "demo@frontend.local";
export const FRONTEND_DEMO_PASSWORD = "Demo123456";
export const FRONTEND_DEMO_TOKEN = "frontend-demo-token";
export const FRONTEND_DEMO_ENABLED = import.meta.env.VITE_ENABLE_FRONTEND_DEMO === "true";
const FRONTEND_DEMO_MODE_KEY = "frontendDemoMode";
const FRONTEND_DEMO_DATA_KEY = "frontendDemoData";

type DemoState = {
  user: AuthUser;
  voices: Array<{
    id: number;
    userId: number;
    name: string;
    description: string;
    tag: string;
    language: string;
    visibility: "public" | "private";
    coverUrl: string;
    sampleAudioUrl: string;
    createdAt: string;
    authorName?: string;
    authorAvatar?: string;
    stats: {
      play: number;
      like: number;
      favorite: number;
      use: number;
    };
  }>;
  jobs: Array<{
    id: number;
    userId: number;
    type: "audio" | "teaching";
    title: string;
    text: string;
    voiceId: number | null;
    status: "processing" | "completed";
    audioUrl: string;
    createdAt: string;
    updatedAt: string;
    settings: Record<string, unknown>;
  }>;
  interactions: Array<{
    id: number;
    type: "favorite" | "like" | "use";
    actorName: string;
    actorAvatar: string;
    voiceName: string;
    voiceCover: string;
    createdAt: string;
  }>;
  notifications: Array<{
    id: number;
    type: "system" | "info";
    title: string;
    desc: string;
    createdAt: string;
  }>;
  tutorials: Array<{
    id: number;
    category: string;
    title: string;
    duration: string;
    cover: string;
    summary: string;
    content?: string;
    steps?: string[];
    targetRoute?: string;
  }>;
  teachingProjects: Array<{
    id: number;
    title: string;
    script: string;
    ratio: string;
    resolution: string;
    bitrate: string;
    subtitleEnabled: boolean;
    voiceId: number | null;
    status: string;
    mode?: "course" | "video";
    speakerId?: string;
    speakerName?: string;
    backgroundId?: string;
    backgroundName?: string;
    voiceName?: string;
    slides?: Array<{
      id: string;
      title: string;
      script: string;
      speakerId?: string;
      speakerName?: string;
      backgroundId?: string;
      backgroundName?: string;
      voiceId?: number | null;
      voiceName?: string;
    }>;
    createdAt: string;
    updatedAt: string;
  }>;
  nextIds: {
    voice: number;
    job: number;
    interaction: number;
    notification: number;
    teachingProject: number;
  };
};

const now = () => new Date().toISOString();

export const createDemoUser = (): AuthUser => ({
  id: 999,
  email: FRONTEND_DEMO_EMAIL,
  username: "Frontend Demo",
  phone: "13900000000",
  age: "25",
  gender: "未设置",
  avatarUrl: "",
  securityAnswers: {
    q1: "2000-01-01",
    q2: "Demo",
    q3: "Frontend School",
  },
});

const initialState = (): DemoState => {
  const createdAt = now();
  const user = createDemoUser();
  return {
    user,
    voices: [
      {
        id: 1,
        userId: user.id,
        name: "前端演示音色",
        description: "用于纯前端验收，不依赖后端服务。",
        tag: "演示",
        language: "cn",
        visibility: "public",
        coverUrl: "",
        sampleAudioUrl: "/api/media/demo-audio",
        createdAt,
        authorName: user.username,
        authorAvatar: "",
        stats: { play: 120, like: 24, favorite: 12, use: 8 },
      },
      {
        id: 2,
        userId: 1001,
        name: "社区样例女声",
        description: "用于社区、配音和历史链路展示。",
        tag: "温柔",
        language: "cn",
        visibility: "public",
        coverUrl: "",
        sampleAudioUrl: "/api/media/demo-audio",
        createdAt,
        authorName: "Community Demo",
        authorAvatar: "",
        stats: { play: 310, like: 78, favorite: 44, use: 19 },
      },
    ],
    jobs: [
      {
        id: 1,
        userId: user.id,
        type: "audio",
        title: "前端演示配音",
        text: "这是一个只进行前端校验的测试账号，用于演示完整页面交互。",
        voiceId: 1,
        status: "completed",
        audioUrl: "/api/media/demo-audio",
        createdAt,
        updatedAt: createdAt,
        settings: { volume: 80, pitch: 55, speed: 1 },
      },
      {
        id: 2,
        userId: user.id,
        type: "teaching",
        title: "前端演示教学任务",
        text: "本示例说明 AI 讲解稿如何在前端演示模式下生成和保存。",
        voiceId: 1,
        status: "completed",
        audioUrl: "/api/media/demo-audio",
        createdAt,
        updatedAt: createdAt,
        settings: { ratio: "16:9", resolution: "1080P", bitrate: "default" },
      },
    ],
    interactions: [
      {
        id: 1,
        type: "favorite",
        actorName: "Community Demo",
        actorAvatar: "",
        voiceName: "前端演示音色",
        voiceCover: "",
        createdAt,
      },
      {
        id: 2,
        type: "like",
        actorName: "Course Tester",
        actorAvatar: "",
        voiceName: "前端演示音色",
        voiceCover: "",
        createdAt,
      },
    ],
    notifications: [
      {
        id: 1,
        type: "system",
        title: "当前为前端演示模式",
        desc: "该账号不会请求后端，页面数据均来自浏览器本地 mock。",
        createdAt,
      },
      {
        id: 2,
        type: "info",
        title: "AI 模型入口已启用",
        desc: "你可以验证模型选择、AI 生成和历史联动等前端交互。",
        createdAt,
      },
    ],
    tutorials: [
      {
        id: 1,
        category: "guide",
        title: "前端演示模式说明",
        duration: "01:20",
        cover: "",
        summary: "说明该测试账号只做前端校验。",
        content: "该模式用于验证全站前端交互、状态联动和页面流程，不依赖真实后端账号。",
        steps: ["使用测试账号登录。", "选择要体验的功能页面。", "在对应页面完成 AI 生成、保存和历史回查。"],
        targetRoute: "/home",
      },
      {
        id: 2,
        category: "dubbing",
        title: "AI 配音流程",
        duration: "02:10",
        cover: "",
        summary: "模型选择、文稿生成、试听和导出。",
        content: "从需求描述到导出音频，完整体验模型选择、音色选择和配音记录入库。",
        steps: ["选择模型与音色。", "输入需求并生成配音稿。", "试听或导出后前往音频记录查看结果。"],
        targetRoute: "/dubbing",
      },
      {
        id: 3,
        category: "clone",
        title: "AI 声音建模提示",
        duration: "01:45",
        cover: "",
        summary: "描述与标签由前端模拟生成。",
        content: "上传或录制样本后，可以让 AI 自动生成声音描述与标签，再创建模型。",
        steps: ["输入模型名称。", "录制或上传音频样本。", "点击 AI 生成后提交声音模型。"],
        targetRoute: "/clone",
      },
      {
        id: 4,
        category: "education",
        title: "教学 AI 帮写",
        duration: "02:30",
        cover: "",
        summary: "教学稿件生成与保存演示。",
        content: "可导入课件、多页编辑讲解稿，并为当前页面选择数字人、声音和背景。",
        steps: ["导入课件或新建页面。", "配置资源并生成 AI 讲解稿。", "保存草稿或生成视频任务。"],
        targetRoute: "/teaching",
      },
    ],
    teachingProjects: [
      {
        id: 1,
        title: "前端演示教学项目",
        script: "这是一个前端演示教学项目，用于验证 AI 讲解稿和生成任务页面。",
        ratio: "16:9",
        resolution: "1080P",
        bitrate: "default",
        subtitleEnabled: true,
        voiceId: 1,
        status: "completed",
        mode: "course",
        speakerId: "avatar-teacher",
        speakerName: "讲师数字人",
        backgroundId: "bg-gradient",
        backgroundName: "渐变演示背景",
        voiceName: "前端演示音色",
        slides: [
          {
            id: "slide-demo-1",
            title: "前端演示教学项目",
            script: "这是一个前端演示教学项目，用于验证 AI 讲解稿和生成任务页面。",
            speakerId: "avatar-teacher",
            speakerName: "讲师数字人",
            backgroundId: "bg-gradient",
            backgroundName: "渐变演示背景",
            voiceId: 1,
            voiceName: "前端演示音色",
          },
        ],
        createdAt,
        updatedAt: createdAt,
      },
    ],
    nextIds: {
      voice: 3,
      job: 3,
      interaction: 3,
      notification: 3,
      teachingProject: 2,
    },
  };
};

export const isFrontendDemoMode = () => FRONTEND_DEMO_ENABLED && localStorage.getItem(FRONTEND_DEMO_MODE_KEY) === "1";

export const setFrontendDemoMode = (enabled: boolean) => {
  if (!FRONTEND_DEMO_ENABLED) {
    localStorage.removeItem(FRONTEND_DEMO_MODE_KEY);
    return;
  }
  if (enabled) {
    localStorage.setItem(FRONTEND_DEMO_MODE_KEY, "1");
  } else {
    localStorage.removeItem(FRONTEND_DEMO_MODE_KEY);
  }
};

export const getDemoState = (): DemoState => {
  const raw = localStorage.getItem(FRONTEND_DEMO_DATA_KEY);
  if (!raw) {
    const seeded = initialState();
    localStorage.setItem(FRONTEND_DEMO_DATA_KEY, JSON.stringify(seeded));
    return seeded;
  }
  return JSON.parse(raw) as DemoState;
};

export const saveDemoState = (state: DemoState) => {
  localStorage.setItem(FRONTEND_DEMO_DATA_KEY, JSON.stringify(state));
};

export const resetDemoState = () => {
  saveDemoState(initialState());
};
