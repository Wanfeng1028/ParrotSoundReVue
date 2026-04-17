import type { AxiosRequestConfig } from "axios";
import type { ApiResponse } from "../utils/request";
import { createDemoUser, getDemoState, isFrontendDemoMode, saveDemoState } from "./demo-account";

const ok = <T>(data: T, msg = "ok"): ApiResponse<T> => ({ code: 200, msg, data });

const normalizeMethod = (method?: string) => (method || "GET").toUpperCase();
const getPath = (url?: string) => (url || "").replace(/^https?:\/\/[^/]+/, "");
const asRecord = (value: unknown) => (value && typeof value === "object" ? (value as Record<string, unknown>) : {});

const getSearch = (config: AxiosRequestConfig) => {
  const params = (config.params || {}) as Record<string, string>;
  return params;
};

export const canHandleDemoRequest = () => isFrontendDemoMode();

export const handleDemoRequest = async <T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> => {
  const method = normalizeMethod(config.method);
  const path = getPath(config.url);
  const params = getSearch(config);
  const data = asRecord(config.data);
  const state = getDemoState();

  if (path === "/api/auth/me" && method === "GET") {
    return ok(state.user as T);
  }

  if (path === "/api/users/profile" && method === "PUT") {
    if (config.data instanceof FormData) {
      state.user.username = String(config.data.get("username") || state.user.username);
      state.user.phone = String(config.data.get("phone") || "");
      state.user.age = String(config.data.get("age") || "");
      state.user.gender = String(config.data.get("gender") || "未设置");
    }
    saveDemoState(state);
    return ok(state.user as T, "资料已更新");
  }

  if (path === "/api/users/password" && method === "PUT") {
    return ok(null as T, "密码修改成功");
  }

  if (path === "/api/users/history" && method === "GET") {
    const type = params.type || "all";
    const voiceItems = state.voices
      .filter((item) => item.userId === state.user.id)
      .map((item) => ({
        id: `voice-${item.id}`,
        itemId: item.id,
        type: "voice",
        title: item.name,
        date: item.createdAt,
        cover: item.coverUrl,
        status: item.visibility,
        audioUrl: item.sampleAudioUrl,
      }));
    const jobItems = state.jobs
      .filter((item) => item.userId === state.user.id)
      .map((item) => ({
        id: `job-${item.id}`,
        itemId: item.id,
        type: item.type === "teaching" ? "video" : "audio",
        title: item.title,
        date: item.createdAt,
        cover: "",
        status: item.status,
        audioUrl: item.audioUrl,
      }));
    const items = [...jobItems, ...voiceItems].filter((item) => type === "all" || item.type === type);
    return ok(items as T);
  }

  if (path === "/api/users/interactions" && method === "GET") {
    const type = params.type || "all";
    const items = state.interactions.filter((item) => type === "all" || item.type === type);
    return ok(items as T);
  }

  if (path === "/api/users/notifications" && method === "GET") {
    const type = params.type || "all";
    const items = state.notifications.filter((item) => type === "all" || item.type === type);
    return ok(items as T);
  }

  if (path === "/api/voices/library" && method === "GET") {
    const search = String(params.search || "").toLowerCase();
    const filter = String(params.filter || "all");
    const items = state.voices
      .filter((item) => item.visibility === "public")
      .filter((item) => !search || `${item.name}${item.tag}${item.description}`.toLowerCase().includes(search))
      .filter((item) => filter === "all" || item.tag === filter);
    return ok(items as T);
  }

  if (path === "/api/voices/my" && method === "GET") {
    return ok(state.voices.filter((item) => item.userId === state.user.id) as T);
  }

  if (path === "/api/voices" && method === "POST") {
    const createdAt = new Date().toISOString();
    const voice = {
      id: state.nextIds.voice++,
      userId: state.user.id,
      name: config.data instanceof FormData ? String(config.data.get("name") || "未命名模型") : "未命名模型",
      description: config.data instanceof FormData ? String(config.data.get("description") || "") : "",
      tag: config.data instanceof FormData ? String(config.data.get("tag") || "演示") : "演示",
      language: "cn",
      visibility: (config.data instanceof FormData ? String(config.data.get("visibility") || "private") : "private") as "public" | "private",
      coverUrl: "",
      sampleAudioUrl: "/api/media/demo-audio",
      createdAt,
      authorName: state.user.username,
      authorAvatar: "",
      stats: { play: 0, like: 0, favorite: 0, use: 0 },
    };
    state.voices.unshift(voice);
    saveDemoState(state);
    return ok(voice as T, "声音模型已创建");
  }

  if (/^\/api\/voices\/\d+\/visibility$/.test(path) && method === "PATCH") {
    const voiceId = Number(path.split("/")[3]);
    const voice = state.voices.find((item) => item.id === voiceId);
    if (voice) {
      voice.visibility = String(data.visibility || "private") as "public" | "private";
      saveDemoState(state);
    }
    return ok((voice || null) as T, "可见性已更新");
  }

  if (/^\/api\/voices\/\d+$/.test(path) && method === "DELETE") {
    const voiceId = Number(path.split("/")[3]);
    state.voices = state.voices.filter((item) => item.id !== voiceId);
    saveDemoState(state);
    return ok(null as T, "声音模型已删除");
  }

  if (path === "/api/voices/describe-ai" && method === "POST") {
    const name = String(data.name || "演示声音");
    const prompt = String(data.prompt || "科技感");
    return ok({ raw: JSON.stringify({ description: `${name}：适合${prompt}场景的前端演示音色。`, tag: "AI演示" }) } as T, "AI 描述生成成功");
  }

  if (path === "/api/dubbing/options" && method === "GET") {
    const voices = state.voices
      .filter((item) => item.visibility === "public" || item.userId === state.user.id)
      .map((item) => ({
        id: item.id,
        name: item.name,
        tag: item.tag,
        avatar: item.coverUrl,
        sampleAudioUrl: item.sampleAudioUrl,
      }));
    return ok({
      voices,
      emotions: ["默认", "热情", "轻松", "友好", "严肃", "兴奋"],
      models: [
        { id: "gpt-4o-mini", label: "gpt-4o-mini", provider: "frontend-demo", isDefault: true },
        { id: "gpt-4.1-mini", label: "gpt-4.1-mini", provider: "frontend-demo", isDefault: false },
      ],
      currentModel: { id: "gpt-4o-mini", label: "gpt-4o-mini", provider: "frontend-demo", isDefault: true },
    } as T);
  }

  if (path === "/api/dubbing/ai-generate" && method === "POST") {
    const prompt = String(data.prompt || "默认需求");
    return ok({ content: `【前端演示模式】\n根据你的需求「${prompt}」，这是一段用于页面校验的 AI 生成配音文稿。它不会请求后端模型，但会完整走前端交互流程。` } as T, "文稿生成成功");
  }

  if ((path === "/api/dubbing/preview" || path === "/api/dubbing/export") && method === "POST") {
    const createdAt = new Date().toISOString();
    const job = {
      id: state.nextIds.job++,
      userId: state.user.id,
      type: "audio" as const,
      title: String(data.title || "前端演示音频"),
      text: String(data.text || ""),
      voiceId: Number(data.voiceId || 1),
      status: "completed" as const,
      audioUrl: "/api/media/demo-audio",
      createdAt,
      updatedAt: createdAt,
      settings: asRecord(data.settings),
    };
    state.jobs.unshift(job);
    state.notifications.unshift({
      id: state.nextIds.notification++,
      type: "info",
      title: path.endsWith("export") ? "演示音频已导出" : "演示试听已生成",
      desc: `${job.title} 已在前端演示模式下加入历史记录。`,
      createdAt,
    });
    saveDemoState(state);
    return ok(job as T, path.endsWith("export") ? "音频导出完成" : "试听任务已生成");
  }

  if (path === "/api/dubbing/records" && method === "GET") {
    const search = String(params.search || "").toLowerCase();
    const items = state.jobs
      .filter((item) => item.type === "audio")
      .filter((item) => !search || `${item.title}${item.text}`.toLowerCase().includes(search));
    return ok(items as T);
  }

  if (/^\/api\/dubbing\/records\/\d+$/.test(path) && method === "DELETE") {
    const jobId = Number(path.split("/")[4]);
    state.jobs = state.jobs.filter((item) => item.id !== jobId);
    saveDemoState(state);
    return ok(null as T, "记录已删除");
  }

  if (path === "/api/community/voices" && method === "GET") {
    const search = String(params.search || "").toLowerCase();
    const sort = String(params.sort || "recommend");
    const language = String(params.language || "all");
    let items = state.voices
      .filter((item) => item.visibility === "public")
      .filter((item) => !search || `${item.name}${item.description}${item.tag}`.toLowerCase().includes(search))
      .filter((item) => language === "all" || item.language === language)
      .map((item) => ({
        ...item,
        username: item.authorName || (item.userId === state.user.id ? state.user.username : "Demo User"),
        userAvatar: item.authorAvatar || "",
        date: item.createdAt,
        desc: item.description,
      }));
    if (sort === "newest") items = items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sort === "hot") items = items.sort((a, b) => b.stats.play - a.stats.play);
    return ok(items as T);
  }

  if (path === "/api/community/rankings" && method === "GET") {
    const items = state.voices
      .filter((item) => item.visibility === "public")
      .sort((a, b) => b.stats.like - a.stats.like)
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        name: item.name,
        username: item.authorName || "Demo User",
        likes: item.stats.like,
        userAvatar: item.authorAvatar || "",
        avatar: item.coverUrl,
      }));
    return ok(items as T);
  }

  if (/^\/api\/community\/voices\/\d+\/(play|like|favorite|use)$/.test(path) && method === "POST") {
    const voiceId = Number(path.split("/")[4]);
    const action = path.split("/")[5];
    const voice = state.voices.find((item) => item.id === voiceId);
    if (voice) {
      if (action === "play") voice.stats.play += 1;
      if (action === "like") voice.stats.like += 1;
      if (action === "favorite") voice.stats.favorite += 1;
      if (action === "use") voice.stats.use += 1;
      if (action !== "play") {
        state.interactions.unshift({
          id: state.nextIds.interaction++,
          type: action === "favorite" ? "favorite" : action === "like" ? "like" : "use",
          actorName: "Frontend Demo",
          actorAvatar: "",
          voiceName: voice.name,
          voiceCover: voice.coverUrl,
          createdAt: new Date().toISOString(),
        });
      }
      saveDemoState(state);
    }
    return ok((action === "use" ? { voiceId } : voice) as T, action === "use" ? "已加入创作流程" : action === "play" ? "试听次数已更新" : "操作成功");
  }

  if (path === "/api/help/tutorials" && method === "GET") {
    const category = String(params.category || "guide");
    return ok(state.tutorials.filter((item) => item.category === category) as T);
  }

  if (path === "/api/help/feedback" && method === "POST") {
    state.notifications.unshift({
      id: state.nextIds.notification++,
      type: "system",
      title: "前端演示反馈已记录",
      desc: String(data.content || "已提交反馈"),
      createdAt: new Date().toISOString(),
    });
    saveDemoState(state);
    return ok({ id: Date.now(), content: String(data.content || "") } as T, "反馈提交成功");
  }

  if (path === "/api/teaching/projects" && method === "GET") {
    return ok({
      projects: state.teachingProjects,
      models: [
        { id: "gpt-4o-mini", label: "gpt-4o-mini", provider: "frontend-demo", isDefault: true },
        { id: "gpt-4.1-mini", label: "gpt-4.1-mini", provider: "frontend-demo", isDefault: false },
      ],
    } as T);
  }

  if (path === "/api/teaching/projects" && method === "POST") {
    const createdAt = new Date().toISOString();
    const project = {
      id: Number(data.id || state.nextIds.teachingProject++),
      title: String(data.title || "前端演示教学项目"),
      script: String(data.script || ""),
      ratio: String(data.ratio || "16:9"),
      resolution: String(data.resolution || "1080P"),
      bitrate: String(data.bitrate || "default"),
      subtitleEnabled: data.subtitleEnabled !== false,
      voiceId: Number(data.voiceId || 1),
      status: String(data.status || "draft"),
      mode: (String(data.mode || "course") === "video" ? "video" : "course") as "course" | "video",
      speakerId: String(data.speakerId || "avatar-teacher"),
      speakerName: String(data.speakerName || "讲师数字人"),
      backgroundId: String(data.backgroundId || "bg-gradient"),
      backgroundName: String(data.backgroundName || "渐变演示背景"),
      voiceName: String(data.voiceName || "前端演示音色"),
      slides: Array.isArray(data.slides) ? data.slides : [],
      createdAt,
      updatedAt: createdAt,
    };
    state.teachingProjects = [project, ...state.teachingProjects.filter((item) => item.id !== project.id)];
    saveDemoState(state);
    return ok(project as T, "教学项目已保存");
  }

  if (path === "/api/teaching/ai-script" && method === "POST") {
    return ok({
      content: `【前端演示教学稿】\n课程主题：${String(data.prompt || "未指定")}\n\n这一段内容用于验证教学页的 AI 帮写交互、模型选择和保存流程，不依赖后端模型服务。`,
    } as T, "讲解稿生成成功");
  }

  return ok(createDemoUser() as T);
};
