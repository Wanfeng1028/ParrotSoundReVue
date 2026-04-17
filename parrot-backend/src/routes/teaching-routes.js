const express = require("express");
const { ok, fail } = require("../utils/api");
const repository = require("../services/repository");
const { authRequired } = require("../middleware/auth");
const { buildDraft, listModels } = require("../services/ai-service");

const router = express.Router();

router.use(authRequired);

router.get("/projects", (req, res) => {
  const projects = repository
    .publicBase()
    .teachingProjects.filter((item) => item.userId === req.user.id);
  return res.json(ok({ projects, models: listModels() }));
});

router.post("/projects", (req, res) => {
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
  if (req.body.status === "completed") {
    repository.createJob({
      userId: req.user.id,
      type: "teaching",
      title: project.title,
      text: project.script,
      voiceId: project.voiceId,
      status: "completed",
      audioUrl: "/api/media/demo-audio",
      settings: { ratio: project.ratio, resolution: project.resolution, bitrate: project.bitrate },
    });
  }
  return res.json(ok(project, "教学项目已保存"));
});

router.post("/ai-script", async (req, res, next) => {
  try {
    const prompt = String(req.body.prompt || "").trim();
    if (!prompt) return fail(res, 400, "请输入讲解需求");
    const content = await buildDraft({
      prompt: `请为一节课程生成一段条理清晰、适合课堂讲解的中文讲稿：${prompt}`,
      kind: "teaching",
      model: req.body.model,
    });
    return res.json(ok({ content }, "讲解稿生成成功"));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
