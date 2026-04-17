const { randomUUID } = require("crypto");
const { env } = require("../config/env");

const tasks = new Map();
const waitingQueue = [];
let activeWorkers = 0;

const updateTask = (taskId, patch) => {
  const task = tasks.get(taskId);
  if (!task) return null;
  Object.assign(task, patch, { updatedAt: new Date().toISOString() });
  return task;
};

const runNext = () => {
  if (activeWorkers >= env.queueConcurrency) {
    return;
  }

  const task = waitingQueue.shift();
  if (!task) {
    return;
  }

  activeWorkers += 1;
  updateTask(task.id, { status: "running", progress: 15 });

  Promise.resolve()
    .then(async () => {
      const result = await task.handler(task);
      updateTask(task.id, { status: "completed", progress: 100, result });
    })
    .catch((error) => {
      updateTask(task.id, {
        status: "failed",
        progress: 100,
        error: error.message || "任务执行失败",
      });
    })
    .finally(() => {
      activeWorkers -= 1;
      runNext();
    });
};

const enqueueTask = ({ type, userId, payload, handler }) => {
  const id = randomUUID();
  const task = {
    id,
    type,
    userId,
    payload,
    handler,
    status: "queued",
    progress: 0,
    result: null,
    error: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tasks.set(id, task);
  waitingQueue.push(task);
  runNext();
  return { taskId: id, status: task.status };
};

const getTask = (taskId) => {
  const task = tasks.get(taskId);
  if (!task) return null;
  return {
    taskId: task.id,
    status: task.status,
    progress: task.progress,
    result: task.result,
    error: task.error,
    type: task.type,
    updatedAt: task.updatedAt,
  };
};

module.exports = {
  enqueueTask,
  getTask,
  updateTask,
};
