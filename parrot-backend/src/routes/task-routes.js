const express = require("express");
const { ok, fail } = require("../utils/api");
const { authRequired } = require("../middleware/auth");
const { getTask } = require("../services/task-queue");

const router = express.Router();

router.use(authRequired);

router.get("/:taskId", (req, res) => {
  const task = getTask(req.params.taskId);
  if (!task) {
    return fail(res, 404, "任务不存在", 404);
  }
  return res.json(ok(task));
});

module.exports = router;
