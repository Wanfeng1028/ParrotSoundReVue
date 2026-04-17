const bcrypt = require("bcrypt");
const express = require("express");
const { ok, fail } = require("../utils/api");
const repository = require("../services/repository");
const { authRequired } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const { remember, cacheDelByPrefix } = require("../services/cache");
const { paginateItems } = require("../utils/pagination");
const { env } = require("../config/env");

const router = express.Router();

router.use(authRequired);

router.put("/profile", upload.single("avatar"), (req, res) => {
  const profile = repository.updateUser(req.user.id, (user) => {
    user.username = req.body.username || user.username;
    user.phone = req.body.phone || "";
    user.age = req.body.age || "";
    user.gender = req.body.gender || user.gender || "未设置";
    if (req.file) user.avatarUrl = `/uploads/${req.file.filename}`;
  });
  cacheDelByPrefix(`users:${req.user.id}:`);
  return res.json(ok(profile, "资料已更新"));
});

router.put("/password", async (req, res, next) => {
  try {
    const { q1, q2, q3, password, confirmPassword } = req.body;
    if (!password || !confirmPassword) return fail(res, 400, "请输入完整密码信息");
    if (password !== confirmPassword) return fail(res, 400, "两次密码输入不一致");
    const current = repository.getUserById(req.user.id);
    const answers = current.securityAnswers || {};
    if ((answers.q1 || "") !== (q1 || "") || (answers.q2 || "") !== (q2 || "") || (answers.q3 || "") !== (q3 || "")) {
      return fail(res, 400, "密保答案不匹配");
    }
    const passwordHash = await bcrypt.hash(password, 10);
    repository.updateUser(req.user.id, (user) => {
      user.passwordHash = passwordHash;
    });
    cacheDelByPrefix(`users:${req.user.id}:`);
    return res.json(ok(null, "密码修改成功"));
  } catch (error) {
    next(error);
  }
});

router.get("/history", async (req, res, next) => {
  try {
    const type = req.query.type || "all";
    const cacheKey = `users:${req.user.id}:history:${type}:${req.query.page || 1}:${req.query.pageSize || 12}`;
    const { value, hit } = await remember(cacheKey, env.cacheTtlSeconds, async () => {
      const state = repository.publicBase();
      const voices = state.voices
        .filter((item) => item.userId === req.user.id)
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
      const jobs = state.jobs
        .filter((item) => item.userId === req.user.id)
        .map((item) => ({
          id: `${item.type}-${item.id}`,
          itemId: item.id,
          type: item.type === "teaching" ? "video" : "audio",
          title: item.title,
          date: item.createdAt,
          cover: "",
          status: item.status,
          audioUrl: item.audioUrl,
        }));
      const items = [...jobs, ...voices]
        .filter((item) => type === "all" || item.type === type)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      return paginateItems(items, req.query);
    });
    res.locals.cacheHit = hit;
    return res.json(ok(value));
  } catch (error) {
    next(error);
  }
});

router.get("/interactions", async (req, res, next) => {
  try {
    const tab = req.query.type || "all";
    const cacheKey = `users:${req.user.id}:interactions:${tab}:${req.query.page || 1}:${req.query.pageSize || 12}`;
    const { value, hit } = await remember(cacheKey, env.cacheTtlSeconds, async () => {
      const state = repository.publicBase();
      const items = state.interactions
        .filter((item) => item.userId === req.user.id && (tab === "all" || item.type === tab))
        .map((item) => {
          const actor = state.users.find((user) => user.id === item.actorId);
          const voice = state.voices.find((voiceItem) => voiceItem.id === item.voiceId);
          return {
            id: item.id,
            type: item.type,
            actorName: actor?.username || "匿名用户",
            actorAvatar: actor?.avatarUrl || "",
            voiceName: voice?.name || "声音已删除",
            voiceCover: voice?.coverUrl || "",
            createdAt: item.createdAt,
          };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return paginateItems(items, req.query);
    });
    res.locals.cacheHit = hit;
    return res.json(ok(value));
  } catch (error) {
    next(error);
  }
});

router.get("/notifications", async (req, res, next) => {
  try {
    const tab = req.query.type || "all";
    const cacheKey = `users:${req.user.id}:notifications:${tab}:${req.query.page || 1}:${req.query.pageSize || 12}`;
    const { value, hit } = await remember(cacheKey, env.cacheTtlSeconds, async () => {
      const items = repository
        .publicBase()
        .notifications.filter(
          (item) => item.userId === req.user.id && (tab === "all" || item.type === tab),
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return paginateItems(items, req.query);
    });
    res.locals.cacheHit = hit;
    return res.json(ok(value));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
