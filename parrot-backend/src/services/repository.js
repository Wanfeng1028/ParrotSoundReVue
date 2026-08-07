const path = require("path");
const bcrypt = require("bcrypt");
const { loadState, saveState } = require("../utils/file-store");
const { nowIso } = require("../utils/time");

const clone = (value) => JSON.parse(JSON.stringify(value));

const safeUser = (user) => {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
};

const nextId = (state, key) => {
  const value = state.meta.nextIds[key];
  state.meta.nextIds[key] += 1;
  return value;
};

const read = () => clone(loadState());

const mutate = (fn) =>
  clone(
    saveState((state) => {
      fn(state);
      return state;
    }),
  );

const getUserByEmail = (email) => read().users.find((item) => item.email === email);
const getUserById = (id) => read().users.find((item) => item.id === Number(id));

const createUser = (user) =>
  mutate((state) => {
    state.users.push({
      id: nextId(state, "user"),
      username: user.username,
      email: user.email,
      passwordHash: user.passwordHash,
      phone: user.phone || "",
      age: user.age || "",
      gender: user.gender || "未设置",
      avatarUrl: user.avatarUrl || "",
      securityAnswers: user.securityAnswers || { q1: "", q2: "", q3: "" },
      createdAt: nowIso(),
    });
  }).users.slice(-1)[0];

const updateUser = (userId, updater) =>
  mutate((state) => {
    const user = state.users.find((item) => item.id === Number(userId));
    if (user) updater(user, state);
  }).users.find((item) => item.id === Number(userId));

const createVoice = (voice) =>
  mutate((state) => {
    state.voices.unshift({
      id: nextId(state, "voice"),
      userId: voice.userId,
      name: voice.name,
      description: voice.description,
      tag: voice.tag,
      language: voice.language || "cn",
      visibility: voice.visibility || "private",
      coverUrl: voice.coverUrl || "",
      sampleAudioUrl: voice.sampleAudioUrl || "/api/media/demo-audio",
      createdAt: nowIso(),
      stats: { play: 0, like: 0, favorite: 0, use: 0 },
    });
  }).voices[0];

const updateVoice = (voiceId, updater) =>
  mutate((state) => {
    const voice = state.voices.find((item) => item.id === Number(voiceId));
    if (voice) updater(voice, state);
  }).voices.find((item) => item.id === Number(voiceId));

const deleteVoice = (voiceId, userId) =>
  mutate((state) => {
    state.voices = state.voices.filter(
      (item) => !(item.id === Number(voiceId) && item.userId === Number(userId)),
    );
  }).voices;

const createJob = (job) =>
  mutate((state) => {
    state.jobs.unshift({
      id: nextId(state, "job"),
      userId: job.userId,
      type: job.type,
      title: job.title,
      text: job.text,
      voiceId: job.voiceId || null,
      voiceName: job.voiceName || "",
      status: job.status || "completed",
      audioUrl: job.audioUrl || "/api/media/demo-audio",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      settings: job.settings || {},
    });
  }).jobs[0];

const deleteJob = (jobId, userId) =>
  mutate((state) => {
    state.jobs = state.jobs.filter(
      (item) => !(item.id === Number(jobId) && item.userId === Number(userId)),
    );
  }).jobs;

const createNotification = (notification) =>
  mutate((state) => {
    state.notifications.unshift({
      id: nextId(state, "notification"),
      userId: notification.userId,
      type: notification.type || "info",
      title: notification.title,
      desc: notification.desc,
      createdAt: nowIso(),
    });
  }).notifications[0];

const createInteraction = (interaction) =>
  mutate((state) => {
    state.interactions.unshift({
      id: nextId(state, "interaction"),
      userId: interaction.userId,
      actorId: interaction.actorId,
      voiceId: interaction.voiceId,
      type: interaction.type,
      createdAt: nowIso(),
    });
  }).interactions[0];

const createFeedback = (feedback) =>
  mutate((state) => {
    state.feedbacks.unshift({
      id: nextId(state, "feedback"),
      userId: feedback.userId,
      usageTime: feedback.usageTime,
      content: feedback.content,
      createdAt: nowIso(),
    });
  }).feedbacks[0];

const saveTeachingProject = (project) =>
  mutate((state) => {
    if (project.id) {
      const existing = state.teachingProjects.find((item) => item.id === Number(project.id));
      if (existing) {
        Object.assign(existing, project, { updatedAt: nowIso() });
      }
      return;
    }
    state.teachingProjects.unshift({
      id: nextId(state, "teachingProject"),
      userId: project.userId,
      title: project.title,
      script: project.script,
      ratio: project.ratio,
      resolution: project.resolution,
      bitrate: project.bitrate,
      subtitleEnabled: project.subtitleEnabled,
      voiceId: project.voiceId || null,
      status: project.status || "draft",
      mode: project.mode || "course",
      speakerId: project.speakerId || "",
      speakerName: project.speakerName || "",
      backgroundId: project.backgroundId || "",
      backgroundName: project.backgroundName || "",
      voiceName: project.voiceName || "",
      slides: project.slides || [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  }).teachingProjects[0];

const listTutorials = (category) =>
  read().tutorials.filter((item) => !category || item.category === category);

const getTutorialById = (tutorialId) =>
  read().tutorials.find((item) => item.id === Number(tutorialId)) || null;

const publicBase = () => {
  const state = read();
  return {
    users: state.users,
    voices: state.voices,
    jobs: state.jobs,
    interactions: state.interactions,
    notifications: state.notifications,
    feedbacks: state.feedbacks,
    teachingProjects: state.teachingProjects,
  };
};

const resolveAssetUrl = (targetPath) => {
  if (!targetPath) return "";
  return targetPath.startsWith("/") ? targetPath : `/uploads/${path.basename(targetPath)}`;
};

/* ===================== 管理后台：账户体系 ===================== */

const safeAdmin = (admin) => {
  if (!admin) return null;
  const { passwordHash, ...rest } = admin;
  return rest;
};

const getAdminByUsername = (username) =>
  read().admins.find((item) => item.username === String(username));

const getAdminById = (id) =>
  read().admins.find((item) => item.id === Number(id));

const createAdmin = (admin) =>
  mutate((state) => {
    state.admins.push({
      id: nextId(state, "admin"),
      username: admin.username,
      passwordHash: admin.passwordHash,
      phone: admin.phone || "",
      age: admin.age || "",
      gender: admin.gender || "未设置",
      avatarUrl: admin.avatarUrl || "",
      securityAnswers: admin.securityAnswers || { q1: "", q2: "", q3: "" },
      role: "admin",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  }).admins.slice(-1)[0];

const updateAdmin = (adminId, updater) =>
  mutate((state) => {
    const admin = state.admins.find((item) => item.id === Number(adminId));
    if (admin) updater(admin, state);
  }).admins.find((item) => item.id === Number(adminId));

const ensureDefaultAdmin = async ({ username, password }) => {
  const existing = read().admins;
  if (existing.length > 0) return null;
  const passwordHash = await bcrypt.hash(String(password), 10);
  const admin = createAdmin({
    username,
    passwordHash,
    phone: "",
    age: "",
    gender: "未设置",
    avatarUrl: "",
    securityAnswers: { q1: "", q2: "", q3: "" },
  });
  return safeAdmin(admin);
};

/* ===================== 管理后台：真实统计 ===================== */

const WEEKDAY_LABELS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const buildTrend = (jobs, days = 7) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const dateStr = toDateKey(day);
    buckets.push({
      date: dateStr,
      label: WEEKDAY_LABELS[day.getDay()],
      value: 0,
    });
  }
  const indexByKey = new Map(buckets.map((item, idx) => [item.date, idx]));
  jobs.forEach((job) => {
    const d = new Date(job.createdAt);
    if (Number.isNaN(d.getTime())) return;
    const key = toDateKey(d);
    const idx = indexByKey.get(key);
    if (idx !== undefined) buckets[idx].value += 1;
  });
  return buckets;
};

const getAdminStats = () => {
  const state = read();
  const users = state.users;
  const voices = state.voices;
  const jobs = state.jobs;
  const feedbacks = state.feedbacks;
  const teachingProjects = state.teachingProjects;
  const interactions = state.interactions;
  const notifications = state.notifications;

  const audioJobs = jobs.filter((item) => item.type === "audio");
  const teachingJobs = jobs.filter((item) => item.type === "teaching");
  const publicVoices = voices.filter((item) => item.visibility === "public");
  const activeUsers = users.filter((item) => item.status !== "banned");

  const moduleRatio = {
    dubbing: audioJobs.length,
    teaching: teachingJobs.length,
    clone: voices.length,
  };
  const ratioTotal = moduleRatio.dubbing + moduleRatio.teaching + moduleRatio.clone || 1;

  return {
    overview: {
      userCount: users.length,
      activeUserCount: activeUsers.length,
      bannedUserCount: users.length - activeUsers.length,
      voiceCount: voices.length,
      publicVoiceCount: publicVoices.length,
      privateVoiceCount: voices.length - publicVoices.length,
      jobCount: jobs.length,
      audioJobCount: audioJobs.length,
      teachingJobCount: teachingJobs.length,
      feedbackCount: feedbacks.length,
      teachingProjectCount: teachingProjects.length,
      interactionCount: interactions.length,
      notificationCount: notifications.length,
      adminCount: state.admins.length,
    },
    moduleRatio: {
      dubbing: moduleRatio.dubbing,
      teaching: moduleRatio.teaching,
      clone: moduleRatio.clone,
      dubbingPercent: Math.round((moduleRatio.dubbing / ratioTotal) * 100),
      teachingPercent: Math.round((moduleRatio.teaching / ratioTotal) * 100),
      clonePercent: Math.round((moduleRatio.clone / ratioTotal) * 100),
    },
    trend: buildTrend(jobs, 7),
  };
};

/* ===================== 管理后台：用户管理 ===================== */

const listUsersForAdmin = ({ search = "", status = "", page = 1, pageSize = 12 } = {}) => {
  const keyword = String(search).trim().toLowerCase();
  const items = read()
    .users.filter((item) => !status || item.status === status)
    .filter(
      (item) =>
        !keyword ||
        item.email.toLowerCase().includes(keyword) ||
        String(item.username || "").toLowerCase().includes(keyword) ||
        String(item.phone || "").toLowerCase().includes(keyword),
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(safeUser);
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  };
};

const getAdminUserById = (id) => safeUser(read().users.find((item) => item.id === Number(id)));

const updateAdminUser = (userId, patch) =>
  safeUser(
    mutate((state) => {
      const user = state.users.find((item) => item.id === Number(userId));
      if (!user) return;
      if (patch.username !== undefined) user.username = patch.username;
      if (patch.phone !== undefined) user.phone = patch.phone;
      if (patch.age !== undefined) user.age = patch.age;
      if (patch.gender !== undefined) user.gender = patch.gender;
      if (patch.avatarUrl !== undefined) user.avatarUrl = patch.avatarUrl;
      if (patch.status !== undefined) user.status = patch.status;
      if (patch.role !== undefined) user.role = patch.role;
    }).users.find((item) => item.id === Number(userId)),
  );

const deleteAdminUser = (userId) =>
  mutate((state) => {
    const id = Number(userId);
    state.users = state.users.filter((item) => item.id !== id);
    state.voices = state.voices.filter((item) => item.userId !== id);
    state.jobs = state.jobs.filter((item) => item.userId !== id);
    state.teachingProjects = state.teachingProjects.filter((item) => item.userId !== id);
    state.interactions = state.interactions.filter(
      (item) => item.userId !== id && item.actorId !== id,
    );
    state.notifications = state.notifications.filter((item) => item.userId !== id);
    state.feedbacks = state.feedbacks.filter((item) => item.userId !== id);
  });

/* ===================== 管理后台：声音审核 ===================== */

const listVoicesForAdmin = ({ search = "", visibility = "", page = 1, pageSize = 12 } = {}) => {
  const keyword = String(search).trim().toLowerCase();
  const items = read()
    .voices.filter((item) => !visibility || item.visibility === visibility)
    .filter(
      (item) =>
        !keyword ||
        String(item.name || "").toLowerCase().includes(keyword) ||
        String(item.tag || "").toLowerCase().includes(keyword),
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  };
};

const updateAdminVoice = (voiceId, patch) =>
  mutate((state) => {
    const voice = state.voices.find((item) => item.id === Number(voiceId));
    if (!voice) return;
    if (patch.visibility !== undefined) voice.visibility = patch.visibility;
    if (patch.name !== undefined) voice.name = patch.name;
    if (patch.tag !== undefined) voice.tag = patch.tag;
  }).voices.find((item) => item.id === Number(voiceId));

const deleteAdminVoice = (voiceId) =>
  mutate((state) => {
    const id = Number(voiceId);
    state.voices = state.voices.filter((item) => item.id !== id);
    state.interactions = state.interactions.filter((item) => item.voiceId !== id);
  });

/* ===================== 管理后台：作品/任务管理 ===================== */

const listJobsForAdmin = ({ search = "", type = "", page = 1, pageSize = 12 } = {}) => {
  const keyword = String(search).trim().toLowerCase();
  const items = read()
    .jobs.filter((item) => !type || item.type === type)
    .filter(
      (item) =>
        !keyword ||
        String(item.title || "").toLowerCase().includes(keyword) ||
        String(item.text || "").toLowerCase().includes(keyword),
    )
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  };
};

const deleteAdminJob = (jobId) =>
  mutate((state) => {
    state.jobs = state.jobs.filter((item) => item.id !== Number(jobId));
  });

/* ===================== 管理后台：反馈管理 ===================== */

const listFeedbacksForAdmin = ({ search = "", page = 1, pageSize = 12 } = {}) => {
  const keyword = String(search).trim().toLowerCase();
  const state = read();
  const items = state.feedbacks
    .filter((item) => !keyword || String(item.content || "").toLowerCase().includes(keyword))
    .map((item) => ({
      ...item,
      user: safeUser(state.users.find((user) => user.id === item.userId)),
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  };
};

const deleteAdminFeedback = (feedbackId) =>
  mutate((state) => {
    state.feedbacks = state.feedbacks.filter((item) => item.id !== Number(feedbackId));
  });

/* ===================== 管理后台：教学项目管理 ===================== */

const listTeachingForAdmin = ({ search = "", page = 1, pageSize = 12 } = {}) => {
  const keyword = String(search).trim().toLowerCase();
  const state = read();
  const items = state.teachingProjects
    .filter(
      (item) =>
        !keyword ||
        String(item.title || "").toLowerCase().includes(keyword) ||
        String(item.script || "").toLowerCase().includes(keyword),
    )
    .map((item) => ({
      ...item,
      user: safeUser(state.users.find((user) => user.id === item.userId)),
    }))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  };
};

const deleteAdminTeaching = (projectId) =>
  mutate((state) => {
    state.teachingProjects = state.teachingProjects.filter(
      (item) => item.id !== Number(projectId),
    );
  });

/* ===================== 管理后台：全局公告 ===================== */

const broadcastNotification = ({ title, desc, type = "system" }) => {
  const state = read();
  const created = [];
  mutate((inner) => {
    state.users.forEach((user) => {
      const notification = {
        id: nextId(inner, "notification"),
        userId: user.id,
        type: type || "system",
        title,
        desc,
        createdAt: nowIso(),
      };
      inner.notifications.unshift(notification);
      created.push(notification);
    });
  });
  return { recipients: created.length };
};

module.exports = {
  read,
  publicBase,
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  createVoice,
  updateVoice,
  deleteVoice,
  createJob,
  deleteJob,
  createNotification,
  createInteraction,
  createFeedback,
  saveTeachingProject,
  listTutorials,
  getTutorialById,
  resolveAssetUrl,
  safeUser,
  getAdminByUsername,
  getAdminById,
  createAdmin,
  updateAdmin,
  ensureDefaultAdmin,
  safeAdmin,
  getAdminStats,
  listUsersForAdmin,
  getAdminUserById,
  updateAdminUser,
  deleteAdminUser,
  listVoicesForAdmin,
  updateAdminVoice,
  deleteAdminVoice,
  listJobsForAdmin,
  deleteAdminJob,
  listFeedbacksForAdmin,
  deleteAdminFeedback,
  listTeachingForAdmin,
  deleteAdminTeaching,
  broadcastNotification,
};
