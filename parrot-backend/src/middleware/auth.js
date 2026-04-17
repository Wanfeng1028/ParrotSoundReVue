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

module.exports = { createToken, authRequired };
