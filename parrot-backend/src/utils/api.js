const ok = (data = null, msg = "ok") => ({ code: 200, msg, data });

const fail = (res, code, msg, status = 400, data = null) =>
  res.status(status).json({ code, msg, data });

module.exports = { ok, fail };
