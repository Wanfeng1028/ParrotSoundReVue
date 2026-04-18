const path = require("path");
const express = require("express");
const { ok } = require("../utils/api");
const { getCacheMode } = require("../services/cache");
const { listModels } = require("../services/ai-service");
const { getMysqlMode } = require("../services/mysql");
const { env } = require("../config/env");

const router = express.Router();

router.get("/ping", (req, res) => {
  res.json(
    ok({
      time: new Date().toISOString(),
      cacheMode: getCacheMode(),
      mysqlMode: getMysqlMode(),
      aiConfigured: Boolean(env.ai.apiKey),
    }, "服务器运行正常"),
  );
});

router.get("/ai/models", (req, res) => {
  res.json(ok(listModels()));
});

router.get("/media/demo-audio", (req, res) => {
  const filePath = path.resolve(process.cwd(), "../parrot-frontend/src/assets/audio/example.wav");
  res.sendFile(filePath);
});

module.exports = router;
