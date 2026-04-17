const express = require("express");
const { ok, fail } = require("../utils/api");
const repository = require("../services/repository");
const { authRequired } = require("../middleware/auth");
const { feedbackLimiter } = require("../middleware/rate-limit");
const { remember, cacheDelByPrefix } = require("../services/cache");
const { env } = require("../config/env");
const { paginateItems } = require("../utils/pagination");

const router = express.Router();

router.get("/tutorials", async (req, res, next) => {
  try {
    const category = String(req.query.category || "");
    const cacheKey = `help:tutorials:${category}:${req.query.page || 1}:${req.query.pageSize || 12}`;
    const { value, hit } = await remember(cacheKey, env.cacheTtlSeconds, async () => {
      const tutorials = repository.listTutorials(category).map((item) => ({
        id: item.id,
        category: item.category,
        title: item.title,
        duration: item.duration,
        cover: item.cover,
        summary: item.summary,
      }));
      return paginateItems(tutorials, req.query);
    });
    res.locals.cacheHit = hit;
    return res.json(ok(value));
  } catch (error) {
    next(error);
  }
});

router.get("/tutorials/:id", async (req, res, next) => {
  try {
    const cacheKey = `help:tutorial:${req.params.id}`;
    const { value, hit } = await remember(cacheKey, env.cacheTtlSeconds, async () => repository.getTutorialById(req.params.id));
    if (!value) return fail(res, 404, "教程不存在", 404);
    res.locals.cacheHit = hit;
    return res.json(ok(value));
  } catch (error) {
    next(error);
  }
});

router.post("/feedback", authRequired, feedbackLimiter, async (req, res) => {
  const content = String(req.body.content || "").trim();
  if (!content) return fail(res, 400, "请填写反馈内容");
  const feedback = repository.createFeedback({
    userId: req.user.id,
    usageTime: req.body.usageTime || "不到 1 个月",
    content,
  });
  repository.createNotification({
    userId: req.user.id,
    type: "system",
    title: "反馈已收到",
    desc: "感谢你的建议，我们会持续优化产品体验。",
  });
  await cacheDelByPrefix(`users:${req.user.id}:notifications`);
  return res.json(ok(feedback, "反馈提交成功"));
});

module.exports = router;
