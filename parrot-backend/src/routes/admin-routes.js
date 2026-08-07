const express = require("express");
const bcrypt = require("bcrypt");
const { ok, fail } = require("../utils/api");
const repository = require("../services/repository");
const { createAdminToken, adminAuthRequired } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rate-limit");
const { getCacheMode } = require("../services/cache");
const { getMysqlMode } = require("../services/mysql");
const { env } = require("../config/env");
const { parsePagination } = require("../utils/pagination");

const router = express.Router();

const toInt = (value, fallback) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const buildListQuery = (req) => {
  const { page, pageSize } = parsePagination(req.query);
  return {
    search: String(req.query.search || "").trim(),
    page,
    pageSize,
  };
};

/* ===================== 管理员登录（公开） ===================== */

router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    if (!username || !password) return fail(res, 400, "请输入管理员账号和密码");
    const admin = repository.getAdminByUsername(username);
    if (!admin) return fail(res, 404, "管理员账号不存在", 404);
    if (admin.status === "disabled") return fail(res, 403, "管理员账户已停用", 403);
    const matched = await bcrypt.compare(password, admin.passwordHash);
    if (!matched) return fail(res, 400, "管理员密码错误");
    const token = createAdminToken(admin);
    return res.json(
      ok(
        {
          token,
          admin: repository.safeAdmin(admin),
        },
        "管理员登录成功",
      ),
    );
  } catch (error) {
    next(error);
  }
});

/* ===================== 以下接口均需管理员鉴权 ===================== */
router.use(adminAuthRequired);

/* ---------- 管理员自身资料 ---------- */

router.get("/profile", (req, res) => {
  return res.json(ok(repository.safeAdmin(req.admin)));
});

router.put("/profile", (req, res, next) => {
  try {
    const patch = {
      phone: String(req.body.phone || "").trim(),
      age: String(req.body.age || "").trim(),
      gender: req.body.gender || "未设置",
      avatarUrl: String(req.body.avatarUrl || "").trim(),
    };
    if (req.body.securityAnswers && typeof req.body.securityAnswers === "object") {
      patch.securityAnswers = {
        q1: String(req.body.securityAnswers.q1 || "").trim(),
        q2: String(req.body.securityAnswers.q2 || "").trim(),
        q3: String(req.body.securityAnswers.q3 || "").trim(),
      };
    }
    const updated = repository.updateAdmin(req.admin.id, (admin) => {
      Object.assign(admin, patch, { updatedAt: new Date().toISOString() });
    });
    if (!updated) return fail(res, 404, "管理员账户不存在", 404);
    return res.json(ok(repository.safeAdmin(updated), "资料已更新"));
  } catch (error) {
    next(error);
  }
});

router.put("/password", async (req, res, next) => {
  try {
    const oldPassword = String(req.body.oldPassword || "");
    const newPassword = String(req.body.newPassword || "");
    if (!oldPassword || !newPassword) return fail(res, 400, "请输入当前密码与新密码");
    if (newPassword.length < 6) return fail(res, 400, "新密码至少 6 位");

    const admin = repository.getAdminById(req.admin.id);
    if (!admin) return fail(res, 404, "管理员账户不存在", 404);

    const matchedOld = await bcrypt.compare(oldPassword, admin.passwordHash);
    if (!matchedOld) return fail(res, 400, "当前密码不正确");

    // 当管理员已设置密保问题时，需校验密保答案；未设置则跳过
    const storedAnswers = admin.securityAnswers || { q1: "", q2: "", q3: "" };
    const hasStoredAnswers = Object.values(storedAnswers).some((item) => String(item).trim() !== "");
    if (hasStoredAnswers && req.body.securityAnswers) {
      const provided = req.body.securityAnswers || {};
      const answersMatch =
        String(provided.q1 || "").trim() === String(storedAnswers.q1).trim() &&
        String(provided.q2 || "").trim() === String(storedAnswers.q2).trim() &&
        String(provided.q3 || "").trim() === String(storedAnswers.q3).trim();
      if (!answersMatch) return fail(res, 400, "密保答案不正确");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    repository.updateAdmin(admin.id, (target) => {
      target.passwordHash = passwordHash;
      target.updatedAt = new Date().toISOString();
    });
    return res.json(ok(null, "管理员密码已修改"));
  } catch (error) {
    next(error);
  }
});

/* ---------- 真实统计与系统状态 ---------- */

router.get("/stats", (req, res) => {
  return res.json(ok(repository.getAdminStats()));
});

router.get("/system", (req, res) => {
  const stats = repository.getAdminStats();
  return res.json(
    ok({
      cacheMode: getCacheMode(),
      mysqlMode: getMysqlMode(),
      aiConfigured: Boolean(env.ai.apiKey),
      queueConcurrency: env.queueConcurrency,
      overview: stats.overview,
      serverTime: new Date().toISOString(),
    }),
  );
});

/* ---------- 用户管理 ---------- */

router.get("/users", (req, res) => {
  const query = buildListQuery(req);
  const status = String(req.query.status || "").trim();
  const result = repository.listUsersForAdmin({ ...query, status });
  return res.json(ok(result));
});

router.get("/users/:id", (req, res) => {
  const user = repository.getAdminUserById(req.params.id);
  if (!user) return fail(res, 404, "用户不存在", 404);
  return res.json(ok(user));
});

router.put("/users/:id", (req, res) => {
  const patch = {
    username: req.body.username !== undefined ? String(req.body.username).trim() : undefined,
    phone: req.body.phone !== undefined ? String(req.body.phone).trim() : undefined,
    age: req.body.age !== undefined ? String(req.body.age).trim() : undefined,
    gender: req.body.gender !== undefined ? req.body.gender : undefined,
    avatarUrl: req.body.avatarUrl !== undefined ? String(req.body.avatarUrl).trim() : undefined,
    status: req.body.status !== undefined ? req.body.status : undefined,
    role: req.body.role !== undefined ? req.body.role : undefined,
  };
  const updated = repository.updateAdminUser(req.params.id, patch);
  if (!updated) return fail(res, 404, "用户不存在", 404);
  return res.json(ok(updated, "用户已更新"));
});

router.delete("/users/:id", (req, res) => {
  const userId = toInt(req.params.id, null);
  if (userId === null) return fail(res, 400, "用户 ID 无效");
  const existing = repository.getAdminUserById(userId);
  if (!existing) return fail(res, 404, "用户不存在", 404);
  repository.deleteAdminUser(userId);
  return res.json(ok(null, "用户及其关联数据已删除"));
});

/* ---------- 声音审核 ---------- */

router.get("/voices", (req, res) => {
  const query = buildListQuery(req);
  const visibility = String(req.query.visibility || "").trim();
  const result = repository.listVoicesForAdmin({ ...query, visibility });
  return res.json(ok(result));
});

router.put("/voices/:id", (req, res) => {
  const patch = {};
  if (req.body.visibility !== undefined) patch.visibility = req.body.visibility;
  if (req.body.name !== undefined) patch.name = String(req.body.name).trim();
  if (req.body.tag !== undefined) patch.tag = String(req.body.tag).trim();
  const updated = repository.updateAdminVoice(req.params.id, patch);
  if (!updated) return fail(res, 404, "声音不存在", 404);
  return res.json(ok(updated, "声音已更新"));
});

router.delete("/voices/:id", (req, res) => {
  const voiceId = toInt(req.params.id, null);
  if (voiceId === null) return fail(res, 400, "声音 ID 无效");
  repository.deleteAdminVoice(voiceId);
  return res.json(ok(null, "声音已删除"));
});

/* ---------- 作品/任务管理 ---------- */

router.get("/jobs", (req, res) => {
  const query = buildListQuery(req);
  const type = String(req.query.type || "").trim();
  const result = repository.listJobsForAdmin({ ...query, type });
  return res.json(ok(result));
});

router.delete("/jobs/:id", (req, res) => {
  const jobId = toInt(req.params.id, null);
  if (jobId === null) return fail(res, 400, "任务 ID 无效");
  repository.deleteAdminJob(jobId);
  return res.json(ok(null, "任务已删除"));
});

/* ---------- 反馈管理 ---------- */

router.get("/feedbacks", (req, res) => {
  const query = buildListQuery(req);
  const result = repository.listFeedbacksForAdmin(query);
  return res.json(ok(result));
});

router.delete("/feedbacks/:id", (req, res) => {
  const feedbackId = toInt(req.params.id, null);
  if (feedbackId === null) return fail(res, 400, "反馈 ID 无效");
  repository.deleteAdminFeedback(feedbackId);
  return res.json(ok(null, "反馈已删除"));
});

/* ---------- 教学项目管理 ---------- */

router.get("/teaching", (req, res) => {
  const query = buildListQuery(req);
  const result = repository.listTeachingForAdmin(query);
  return res.json(ok(result));
});

router.delete("/teaching/:id", (req, res) => {
  const projectId = toInt(req.params.id, null);
  if (projectId === null) return fail(res, 400, "项目 ID 无效");
  repository.deleteAdminTeaching(projectId);
  return res.json(ok(null, "教学项目已删除"));
});

/* ---------- 全局公告广播 ---------- */

router.post("/notifications/broadcast", (req, res) => {
  const title = String(req.body.title || "").trim();
  const desc = String(req.body.desc || "").trim();
  if (!title || !desc) return fail(res, 400, "请填写公告标题与内容");
  const type = String(req.body.type || "system").trim();
  const result = repository.broadcastNotification({ title, desc, type });
  return res.json(ok(result, `公告已推送给 ${result.recipients} 位用户`));
});

module.exports = router;
