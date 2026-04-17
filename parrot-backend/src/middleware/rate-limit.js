const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

const buildKeyGenerator = (scope) => (req) => {
  const userPart = req.user?.id ? `user:${req.user.id}` : "user:anonymous";
  return `${scope}:${ipKeyGenerator(req.ip || "")}:${userPart}`;
};

const onLimitReached = (req, res) => {
  res.locals.rateLimited = true;
  res.status(429).json({
    code: 429,
    msg: "请求过于频繁，请稍后再试",
    data: null,
  });
};

const createLimiter = (scope, windowMs, max) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: buildKeyGenerator(scope),
    handler: onLimitReached,
  });

const authLimiter = createLimiter("auth", 5 * 60 * 1000, 20);
const codeLimiter = createLimiter("auth-code", 5 * 60 * 1000, 8);
const aiLimiter = createLimiter("ai", 60 * 1000, 20);
const exportLimiter = createLimiter("export", 60 * 1000, 20);
const feedbackLimiter = createLimiter("feedback", 5 * 60 * 1000, 10);
const interactionLimiter = createLimiter("interaction", 60 * 1000, 60);

module.exports = {
  authLimiter,
  codeLimiter,
  aiLimiter,
  exportLimiter,
  feedbackLimiter,
  interactionLimiter,
};
