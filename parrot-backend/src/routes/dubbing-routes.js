const express = require("express");
const { ok, fail } = require("../utils/api");
const repository = require("../services/repository");
const { authRequired } = require("../middleware/auth");
const { listModels, buildDraft } = require("../services/ai-service");

const router = express.Router();

router.use(authRequired);

router.get("/options", (req, res) => {
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
  return res.json(
    ok({
      voices,
      emotions: ["默认", "热情", "轻松", "友好", "严肃", "兴奋"],
      models: listModels(),
      currentModel: listModels().find((item) => item.isDefault),
    }),
  );
});

router.post("/ai-generate", async (req, res, next) => {
  try {
    const prompt = String(req.body.prompt || "").trim();
    if (!prompt) return fail(res, 400, "请输入 AI 生成需求");
    const content = await buildDraft({
      prompt: `根据以下需求生成一段适合语音配音的中文文稿，要求自然、可朗读：${prompt}`,
      kind: "dubbing",
      model: req.body.model,
    });
    return res.json(ok({ content }, "文稿生成成功"));
  } catch (error) {
    next(error);
  }
});

router.post("/preview", (req, res) => {
  const text = String(req.body.text || "").trim();
  if (!text) return fail(res, 400, "请输入配音文案");
  const job = repository.createJob({
    userId: req.user.id,
    type: "audio",
    title: req.body.title || `${text.slice(0, 12)}${text.length > 12 ? "..." : ""}`,
    text,
    voiceId: req.body.voiceId,
    status: "completed",
    audioUrl: "/api/media/demo-audio",
    settings: req.body.settings || {},
  });
  return res.json(ok(job, "试听任务已生成"));
});

router.post("/export", (req, res) => {
  const text = String(req.body.text || "").trim();
  if (!text) return fail(res, 400, "请输入导出文案");
  const job = repository.createJob({
    userId: req.user.id,
    type: "audio",
    title: req.body.title || "导出音频",
    text,
    voiceId: req.body.voiceId,
    status: "completed",
    audioUrl: "/api/media/demo-audio",
    settings: req.body.settings || {},
  });
  repository.createNotification({
    userId: req.user.id,
    type: "info",
    title: "音频导出完成",
    desc: `作品「${job.title}」已进入音频记录。`,
  });
  return res.json(ok(job, "音频导出完成"));
});

router.get("/records", (req, res) => {
  const search = String(req.query.search || "").trim().toLowerCase();
  const records = repository
    .publicBase()
    .jobs.filter((item) => item.userId === req.user.id && item.type === "audio")
    .filter((item) => !search || item.title.toLowerCase().includes(search) || item.text.toLowerCase().includes(search));
  return res.json(ok(records));
});

router.delete("/records/:id", (req, res) => {
  repository.deleteJob(req.params.id, req.user.id);
  return res.json(ok(null, "记录已删除"));
});

module.exports = router;
