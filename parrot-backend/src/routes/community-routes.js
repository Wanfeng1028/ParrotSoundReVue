const express = require("express");
const { ok, fail } = require("../utils/api");
const repository = require("../services/repository");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.get("/voices", (req, res) => {
  const search = String(req.query.search || "").trim().toLowerCase();
  const sort = String(req.query.sort || "recommend");
  const language = String(req.query.language || "all");
  const state = repository.publicBase();
  let voices = state.voices
    .filter((item) => item.visibility === "public")
    .filter((item) => !search || item.name.toLowerCase().includes(search) || item.description.toLowerCase().includes(search))
    .filter((item) => language === "all" || item.language === language)
    .map((item) => {
      const author = state.users.find((user) => user.id === item.userId);
      return {
        id: item.id,
        name: item.name,
        username: author?.username || "未知用户",
        userAvatar: author?.avatarUrl || "",
        date: item.createdAt,
        tag: item.tag,
        desc: item.description,
        avatar: item.coverUrl,
        sampleAudioUrl: item.sampleAudioUrl,
        stats: item.stats,
      };
    });

  if (sort === "newest") voices = voices.sort((a, b) => new Date(b.date) - new Date(a.date));
  if (sort === "hot") voices = voices.sort((a, b) => b.stats.play - a.stats.play);
  return res.json(ok(voices));
});

router.get("/rankings", (req, res) => {
  const state = repository.publicBase();
  const rankings = state.voices
    .filter((item) => item.visibility === "public")
    .sort((a, b) => b.stats.like - a.stats.like)
    .slice(0, 5)
    .map((item) => {
      const author = state.users.find((user) => user.id === item.userId);
      return {
        id: item.id,
        name: item.name,
        username: author?.username || "未知用户",
        likes: item.stats.like,
        userAvatar: author?.avatarUrl || "",
        avatar: item.coverUrl,
      };
    });
  return res.json(ok(rankings));
});

router.use(authRequired);

const mutateVoiceStat = (voiceId, field, amount = 1) =>
  repository.updateVoice(voiceId, (voice) => {
    voice.stats[field] += amount;
  });

router.post("/voices/:id/like", (req, res) => {
  const voice = mutateVoiceStat(req.params.id, "like");
  if (!voice) return fail(res, 404, "声音不存在", 404);
  repository.createInteraction({ userId: voice.userId, actorId: req.user.id, voiceId: voice.id, type: "like" });
  repository.createNotification({ userId: voice.userId, type: "info", title: "你的声音收到了新的点赞", desc: `作品「${voice.name}」被点赞。` });
  return res.json(ok(voice, "点赞成功"));
});

router.post("/voices/:id/favorite", (req, res) => {
  const voice = mutateVoiceStat(req.params.id, "favorite");
  if (!voice) return fail(res, 404, "声音不存在", 404);
  repository.createInteraction({ userId: voice.userId, actorId: req.user.id, voiceId: voice.id, type: "favorite" });
  return res.json(ok(voice, "收藏成功"));
});

router.post("/voices/:id/use", (req, res) => {
  const voice = mutateVoiceStat(req.params.id, "use");
  if (!voice) return fail(res, 404, "声音不存在", 404);
  repository.createInteraction({ userId: voice.userId, actorId: req.user.id, voiceId: voice.id, type: "use" });
  return res.json(ok({ voiceId: voice.id }, "已加入创作流程"));
});

module.exports = router;
