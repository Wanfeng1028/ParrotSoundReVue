const express = require("express");
const { ok, fail } = require("../utils/api");
const repository = require("../services/repository");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.get("/tutorials", (req, res) => {
  return res.json(ok(repository.listTutorials(req.query.category)));
});

router.post("/feedback", authRequired, (req, res) => {
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
  return res.json(ok(feedback, "反馈提交成功"));
});

module.exports = router;
