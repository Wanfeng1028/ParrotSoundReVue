const express = require("express");
const { ok, fail } = require("../utils/api");
const repository = require("../services/repository");
const { authRequired } = require("../middleware/auth");
const { listModels, buildDraft } = require("../services/ai-service");
const { aiLimiter, exportLimiter } = require("../middleware/rate-limit");
const { remember, cacheDelByPrefix } = require("../services/cache");
const { paginateItems } = require("../utils/pagination");
const { env } = require("../config/env");
const { enqueueTask } = require("../services/task-queue");

const router = express.Router();

router.use(authRequired);

const getVoiceById = (voiceId, userId) =>
  repository
    .publicBase()
    .voices.find((item) => item.id === Number(voiceId) && (item.visibility === "public" || item.userId === userId));

router.get("/options", async (req, res, next) => {
  try {
    const cacheKey = `dubbing:${req.user.id}:options`;
    const { value, hit } = await remember(cacheKey, env.cacheTtlSeconds, async () => {
      const state = repository.publicBase();
      const voices = state.voices
        .filter((item) => item.visibility === "public" || item.userId === req.user.id)
        .map((item) => ({
          id: item.id,
          name: item.name,
          tag: item.tag,
          avatar: item.coverUrl,
          sampleAudioUrl: item.sampleAudioUrl,
        }));
      return {
        voices,
        emotions: ["默认", "热情", "轻松", "友好", "严肃", "兴奋"],
        models: listModels(),
        currentModel: listModels().find((item) => item.isDefault),
      };
    });
    res.locals.cacheHit = hit;
    return res.json(ok(value));
  } catch (error) {
    next(error);
  }
});

router.post("/ai-generate", aiLimiter, async (req, res, next) => {
  try {
    const prompt = String(req.body.prompt || "").trim();
    if (!prompt) return fail(res, 400, "请输入 AI 生成需求");
    const task = enqueueTask({
      type: "dubbing-draft",
      userId: req.user.id,
      payload: { prompt, model: req.body.model, requestId: req.requestId },
      handler: async () => {
        const content = await buildDraft({
          prompt: `根据以下需求生成一段适合语音配音的中文文稿，要求自然、可朗读：${prompt}`,
          kind: "dubbing",
          model: req.body.model,
        });
        return { content };
      },
    });
    return res.json(ok(task, "文稿生成任务已创建"));
  } catch (error) {
    next(error);
  }
});

router.post("/preview", exportLimiter, (req, res) => {
  const text = String(req.body.text || "").trim();
  if (!text) return fail(res, 400, "请输入配音文案");
  const voice = getVoiceById(req.body.voiceId, req.user.id);
  if (!voice) return fail(res, 404, "请选择有效的音色", 404);
  const task = enqueueTask({
    type: "dubbing-preview",
    userId: req.user.id,
    payload: { text, voiceId: req.body.voiceId, requestId: req.requestId },
    handler: async () => {
      const job = repository.createJob({
        userId: req.user.id,
        type: "audio",
        title: req.body.title || `${text.slice(0, 12)}${text.length > 12 ? "..." : ""}`,
        text,
        voiceId: voice.id,
        voiceName: voice.name,
        status: "completed",
        audioUrl: voice.sampleAudioUrl || "/api/media/demo-audio",
        settings: req.body.settings || {},
      });
      await cacheDelByPrefix(`users:${req.user.id}:history`);
      await cacheDelByPrefix(`dubbing:${req.user.id}:records`);
      return job;
    },
  });
  return res.json(ok(task, "试听任务已创建"));
});

router.post("/export", exportLimiter, (req, res) => {
  const text = String(req.body.text || "").trim();
  if (!text) return fail(res, 400, "请输入导出文案");
  const voice = getVoiceById(req.body.voiceId, req.user.id);
  if (!voice) return fail(res, 404, "请选择有效的音色", 404);
  const task = enqueueTask({
    type: "dubbing-export",
    userId: req.user.id,
    payload: { text, voiceId: req.body.voiceId, requestId: req.requestId },
    handler: async () => {
      const job = repository.createJob({
        userId: req.user.id,
        type: "audio",
        title: req.body.title || "导出音频",
        text,
        voiceId: voice.id,
        voiceName: voice.name,
        status: "completed",
        audioUrl: voice.sampleAudioUrl || "/api/media/demo-audio",
        settings: req.body.settings || {},
      });
      repository.createNotification({
        userId: req.user.id,
        type: "info",
        title: "音频导出完成",
        desc: `作品「${job.title}」已进入音频记录。`,
      });
      await cacheDelByPrefix(`users:${req.user.id}:`);
      await cacheDelByPrefix(`dubbing:${req.user.id}:records`);
      return job;
    },
  });
  return res.json(ok(task, "音频导出任务已创建"));
});

router.get("/records", async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim().toLowerCase();
    const cacheKey = `dubbing:${req.user.id}:records:${search}:${req.query.page || 1}:${req.query.pageSize || 12}`;
    const { value, hit } = await remember(cacheKey, env.cacheTtlSeconds, async () => {
      const records = repository
        .publicBase()
        .jobs.filter((item) => item.userId === req.user.id && item.type === "audio")
        .filter((item) => !search || item.title.toLowerCase().includes(search) || item.text.toLowerCase().includes(search))
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      return paginateItems(records, req.query);
    });
    res.locals.cacheHit = hit;
    return res.json(ok(value));
  } catch (error) {
    next(error);
  }
});

router.delete("/records/:id", async (req, res) => {
  repository.deleteJob(req.params.id, req.user.id);
  await cacheDelByPrefix(`users:${req.user.id}:history`);
  await cacheDelByPrefix(`dubbing:${req.user.id}:records`);
  return res.json(ok(null, "记录已删除"));
});

module.exports = router;
