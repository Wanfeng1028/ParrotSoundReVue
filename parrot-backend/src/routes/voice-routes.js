const express = require("express");
const { ok, fail } = require("../utils/api");
const repository = require("../services/repository");
const { authRequired } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const { buildDraft } = require("../services/ai-service");

const router = express.Router();

router.get("/library", (req, res) => {
  const state = repository.publicBase();
  const search = String(req.query.search || "").trim().toLowerCase();
  const filter = String(req.query.filter || "all");
  const voices = state.voices
    .filter((item) => item.visibility === "public")
    .filter((item) => !search || item.name.toLowerCase().includes(search) || item.tag.toLowerCase().includes(search))
    .filter((item) => filter === "all" || item.tag === filter)
    .map((item) => {
      const author = state.users.find((user) => user.id === item.userId);
      return {
        ...item,
        authorName: author?.username || "未知用户",
        authorAvatar: author?.avatarUrl || "",
      };
    });
  return res.json(ok(voices));
});

router.use(authRequired);

router.get("/my", (req, res) => {
  const voices = repository.publicBase().voices.filter((item) => item.userId === req.user.id);
  return res.json(ok(voices));
});

router.post("/", upload.fields([{ name: "cover", maxCount: 1 }, { name: "sample", maxCount: 1 }]), (req, res) => {
  const files = req.files || {};
  const cover = files.cover?.[0];
  const sample = files.sample?.[0];
  const name = String(req.body.name || "").trim();
  if (!name) return fail(res, 400, "请输入模型名称");
  const voice = repository.createVoice({
    userId: req.user.id,
    name,
    description: String(req.body.description || ""),
    tag: String(req.body.tag || "未分类"),
    visibility: req.body.visibility || "private",
    language: req.body.language || "cn",
    coverUrl: cover ? `/uploads/${cover.filename}` : "",
    sampleAudioUrl: sample ? `/uploads/${sample.filename}` : "/api/media/demo-audio",
  });
  repository.createNotification({
    userId: req.user.id,
    type: "info",
    title: "声音模型创建成功",
    desc: `模型「${voice.name}」已加入你的声音库。`,
  });
  return res.json(ok(voice, "声音模型已创建"));
});

router.patch("/:id/visibility", (req, res) => {
  const voice = repository.updateVoice(req.params.id, (target) => {
    if (target.userId !== req.user.id) return;
    target.visibility = req.body.visibility === "public" ? "public" : "private";
  });
  if (!voice || voice.userId !== req.user.id) return fail(res, 404, "声音模型不存在", 404);
  return res.json(ok(voice, "可见性已更新"));
});

router.delete("/:id", (req, res) => {
  repository.deleteVoice(req.params.id, req.user.id);
  return res.json(ok(null, "声音模型已删除"));
});

router.post("/describe-ai", async (req, res, next) => {
  try {
    const content = await buildDraft({
      prompt: `请为以下声音模型生成一句描述和一个简短标签，使用 JSON 格式返回：{"description":"","tag":""}\n名称：${req.body.name || ""}\n风格：${req.body.prompt || ""}`,
      kind: "voice",
      model: req.body.model,
    });
    return res.json(ok({ raw: content }, "AI 描述生成成功"));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
