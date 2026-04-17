const express = require("express");
const cors = require("cors");
const compression = require("compression");
const path = require("path");
const { env } = require("./config/env");
const { errorHandler } = require("./middleware/error-handler");
const { requestLogger } = require("./middleware/request-logger");
const systemRoutes = require("./routes/system-routes");
const authRoutes = require("./routes/auth-routes");
const userRoutes = require("./routes/user-routes");
const voiceRoutes = require("./routes/voice-routes");
const dubbingRoutes = require("./routes/dubbing-routes");
const communityRoutes = require("./routes/community-routes");
const helpRoutes = require("./routes/help-routes");
const teachingRoutes = require("./routes/teaching-routes");
const taskRoutes = require("./routes/task-routes");

const app = express();

app.use(
  cors({
    origin: env.frontendOrigin,
    credentials: true,
  }),
);
app.use(compression());
app.use(requestLogger);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  "/uploads",
  express.static(path.resolve(env.uploadDir), {
    maxAge: "7d",
    etag: true,
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
    },
  }),
);

app.use("/api", systemRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/voices", voiceRoutes);
app.use("/api/dubbing", dubbingRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/help", helpRoutes);
app.use("/api/teaching", teachingRoutes);
app.use("/api/tasks", taskRoutes);

app.use(errorHandler);

module.exports = { app };
