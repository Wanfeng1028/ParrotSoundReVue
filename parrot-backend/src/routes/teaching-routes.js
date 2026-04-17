const express = require("express");
const { ok, fail } = require("../utils/api");
const repository = require("../services/repository");
const { authRequired } = require("../middleware/auth");
const { buildDraft, listModels } = require("../services/ai-service");
const { aiLimiter, exportLimiter } = require("../middleware/rate-limit");
const { remember, cacheDelByPrefix } = require("../services/cache");
const { paginateItems } = require("../utils/pagination");
const { env } = require("../config/env");
const { enqueueTask } = require("../services/task-queue");

const router = express.Router();

router.use(authRequired);

router.get("/projects", async (req, res, next) => {
  try {
    const cacheKey = `teaching:${req.user.id}:projects:${req.query.page || 1}:${req.query.pageSize || 12}`;
    const { value, hit } = await remember(cacheKey, env.cacheTtlSeconds, async () => {
      const projects = repository
        .publicBase()
        .teachingProjects.filter((item) => item.userId === req.user.id)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      return {
        items: paginateItems(projects, req.query),
        models: listModels(),
      };
    });
    res.locals.cacheHit = hit;
    return res.json(ok(value));
  } catch (error) {
    next(error);
  }
});

router.post("/projects", async (req, res) => {
  const title = String(req.body.title || "").trim();
  if (!title) return fail(res, 400, "请输入项目标题");
  const project = repository.saveTeachingProject({
    id: req.body.id,
    userId: req.user.id,
    title,
    script: req.body.script || "",
    ratio: req.body.ratio || "16:9",
    resolution: req.body.resolution || "1080P",
    bitrate: req.body.bitrate || "default",
    subtitleEnabled: req.body.subtitleEnabled !== false,
    voiceId: req.body.voiceId || null,
    status: req.body.status || "draft",
    mode: req.body.mode || "course",
    speakerId: req.body.speakerId || "",
    speakerName: req.body.speakerName || "",
    backgroundId: req.body.backgroundId || "",
    backgroundName: req.body.backgroundName || "",
    voiceName: req.body.voiceName || "",
    slides: Array.isArray(req.body.slides) ? req.body.slides : [],
  });
  await cacheDelByPrefix(`teaching:${req.user.id}:projects`);
  await cacheDelByPrefix(`users:${req.user.id}:history`);
  return res.json(ok(project, "教学项目已保存"));
});

router.post("/ai-script", aiLimiter, async (req, res, next) => {
  try {
    const prompt = String(req.body.prompt || "").trim();
    if (!prompt) return fail(res, 400, "请输入讲解需求");
    const task = enqueueTask({
      type: "teaching-script",
      userId: req.user.id,
      payload: { prompt, model: req.body.model, requestId: req.requestId },
      handler: async () => {
        const content = await buildDraft({
          prompt: `请为一节课程生成一段条理清晰、适合课堂讲解的中文讲稿：${prompt}`,
          kind: "teaching",
          model: req.body.model,
        });
        return { content };
      },
    });
    return res.json(ok(task, "讲解稿任务已创建"));
  } catch (error) {
    next(error);
  }
});

router.post("/generate", exportLimiter, async (req, res, next) => {
  try {
    const title = String(req.body.title || "").trim();
    const script = String(req.body.script || "").trim();
    if (!title || !script) return fail(res, 400, "请先保存项目并填写讲稿");
    const task = enqueueTask({
      type: "teaching-generate",
      userId: req.user.id,
      payload: { title, script, requestId: req.requestId },
      handler: async () => {
        const job = repository.createJob({
          userId: req.user.id,
          type: "teaching",
          title,
          text: script,
          voiceId: req.body.voiceId || null,
          status: "completed",
          audioUrl: "/api/media/demo-audio",
          settings: {
            ratio: req.body.ratio || "16:9",
            resolution: req.body.resolution || "1080P",
            bitrate: req.body.bitrate || "default",
          },
        });
        repository.createNotification({
          userId: req.user.id,
          type: "info",
          title: "教学任务已完成",
          desc: `项目「${title}」已生成并进入历史记录。`,
        });
        await cacheDelByPrefix(`teaching:${req.user.id}:projects`);
        await cacheDelByPrefix(`users:${req.user.id}:`);
        return job;
      },
    });
    return res.json(ok(task, "教学生成任务已创建"));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
