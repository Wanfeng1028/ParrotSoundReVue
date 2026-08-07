const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const repository = require("../services/repository");

const createToken = (user) =>
  jwt.sign({ userId: user.id, email: user.email }, env.jwtSecret, { expiresIn: "7d" });

const authRequired = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return res.status(401).json({ code: 401, msg: "请先登录", data: null });
  }
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = repository.getUserById(payload.userId);
    if (!user) {
      return res.status(401).json({ code: 401, msg: "登录状态无效", data: null });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ code: 401, msg: "登录状态已过期", data: null });
  }
};

/* ===================== 管理后台鉴权（独立体系，不影响普通用户） ===================== */

const createAdminToken = (admin) =>
  jwt.sign(
    { scope: "admin", adminId: admin.id, username: admin.username },
    env.jwtSecret,
    { expiresIn: "7d" },
  );

const adminAuthRequired = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return res.status(401).json({ code: 401, msg: "管理员未登录", data: null });
  }
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    if (payload.scope !== "admin") {
      return res.status(403).json({ code: 403, msg: "无管理员权限", data: null });
    }
    const admin = repository.getAdminById(payload.adminId);
    if (!admin) {
      return res.status(401).json({ code: 401, msg: "管理员账户不存在", data: null });
    }
    if (admin.status === "disabled") {
      return res.status(403).json({ code: 403, msg: "管理员账户已停用", data: null });
    }
    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ code: 401, msg: "管理员登录状态已过期", data: null });
  }
};

module.exports = { createToken, authRequired, createAdminToken, adminAuthRequired };
