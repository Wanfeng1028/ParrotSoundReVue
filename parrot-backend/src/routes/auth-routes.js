const bcrypt = require("bcrypt");
const express = require("express");
const { ok, fail } = require("../utils/api");
const { createToken, authRequired } = require("../middleware/auth");
const repository = require("../services/repository");
const { getCache } = require("../services/cache");
const { authLimiter, codeLimiter } = require("../middleware/rate-limit");
const { addMinutes } = require("../utils/time");

const router = express.Router();

router.post("/send-code", codeLimiter, async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) return fail(res, 400, "邮箱不能为空");
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await getCache().set(`auth:code:${email}`, code, { EX: 300 });
    const devMode = !process.env.SMTP_HOST;
    return res.json(
      ok(
        {
          email,
          expiresAt: addMinutes(5),
          delivery: devMode ? "development" : "smtp",
          code: devMode ? code : undefined,
        },
        devMode ? "验证码已生成，当前为开发模式" : "验证码已发送",
      ),
    );
  } catch (error) {
    next(error);
  }
});

router.post("/register", authLimiter, async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    const code = String(req.body.code || "");
    if (!email || !username || !password || !code) return fail(res, 400, "请填写完整注册信息");
    if (repository.getUserByEmail(email)) return fail(res, 409, "该邮箱已注册", 409);
    const cachedCode = await getCache().get(`auth:code:${email}`);
    if (!cachedCode || cachedCode !== code) return fail(res, 400, "验证码错误或已失效");
    const passwordHash = await bcrypt.hash(password, 10);
    const user = repository.createUser({ email, username, passwordHash });
    await getCache().del(`auth:code:${email}`);
    const token = createToken(user);
    return res.json(
      ok(
        {
          token,
          user: { id: user.id, email: user.email, username: user.username, avatarUrl: user.avatarUrl },
        },
        "注册成功",
      ),
    );
  } catch (error) {
    next(error);
  }
});

router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = repository.getUserByEmail(email);
    if (!user) return fail(res, 404, "用户不存在", 404);
    const matched = await bcrypt.compare(password, user.passwordHash);
    if (!matched) return fail(res, 400, "密码错误");
    const token = createToken(user);
    return res.json(
      ok(
        {
          token,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            phone: user.phone,
            age: user.age,
            gender: user.gender,
            avatarUrl: user.avatarUrl,
          },
        },
        "登录成功",
      ),
    );
  } catch (error) {
    next(error);
  }
});

router.post("/reset-password", authLimiter, async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const code = String(req.body.code || "");
    const user = repository.getUserByEmail(email);
    if (!user) return fail(res, 404, "用户不存在", 404);
    const cachedCode = await getCache().get(`auth:code:${email}`);
    if (!cachedCode || cachedCode !== code) return fail(res, 400, "验证码错误或已失效");
    const passwordHash = await bcrypt.hash(password, 10);
    repository.updateUser(user.id, (target) => {
      target.passwordHash = passwordHash;
    });
    await getCache().del(`auth:code:${email}`);
    return res.json(ok(null, "密码已重置"));
  } catch (error) {
    next(error);
  }
});

router.get("/me", authRequired, (req, res) => {
  const { user } = req;
  return res.json(
    ok({
      id: user.id,
      email: user.email,
      username: user.username,
      phone: user.phone,
      age: user.age,
      gender: user.gender,
      avatarUrl: user.avatarUrl,
      securityAnswers: user.securityAnswers,
    }),
  );
});

module.exports = router;
