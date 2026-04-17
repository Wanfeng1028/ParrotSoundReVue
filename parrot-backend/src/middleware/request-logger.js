const { randomUUID } = require("crypto");
const { env } = require("../config/env");
const { getCacheMode } = require("../services/cache");

const requestLogger = (req, res, next) => {
  const startedAt = Date.now();
  req.requestId = req.headers["x-request-id"] || randomUUID();
  res.setHeader("x-request-id", req.requestId);

  res.on("finish", () => {
    const duration = Date.now() - startedAt;
    const payload = {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
      cacheMode: getCacheMode(),
      cacheHit: Boolean(res.locals.cacheHit),
      rateLimited: Boolean(res.locals.rateLimited),
      slow: duration >= env.requestLogSlowMs,
    };
    console.log(`[request] ${JSON.stringify(payload)}`);
  });

  next();
};

module.exports = { requestLogger };
