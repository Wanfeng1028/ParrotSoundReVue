const path = require("path");
const { loadState, saveState } = require("../utils/file-store");
const { nowIso } = require("../utils/time");

const clone = (value) => JSON.parse(JSON.stringify(value));

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
  resolveAssetUrl,
};
