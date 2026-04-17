const path = require("path");
const multer = require("multer");
const { env } = require("../config/env");
const { ensureDir } = require("../utils/file-store");

ensureDir(env.uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, env.uploadDir),
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`;
    cb(null, safeName);
  },
});

const upload = multer({ storage });

module.exports = { upload };
