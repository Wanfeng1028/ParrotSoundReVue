import { apiRequest } from "../utils/request";
import type { TaskStatusResponse } from "../types";

export const fetchTaskStatus = <T = unknown>(taskId: string) =>
  apiRequest<TaskStatusResponse<T>>({
    url: `/api/tasks/${taskId}`,
    method: "GET",
  });

export const waitForTask = async <T = unknown>(
  taskId: string,
  options: { intervalMs?: number; maxAttempts?: number } = {},
) => {
  const intervalMs = options.intervalMs ?? 500;
  const maxAttempts = options.maxAttempts ?? 20;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const response = await fetchTaskStatus<T>(taskId);
    const task = response.data;
    if (task.status === "completed") {
      return task;
    }
    if (task.status === "failed") {
      throw new Error(task.error || "任务执行失败");
    }
    await new Promise((resolve) => window.setTimeout(resolve, intervalMs));
  }

  throw new Error("任务处理超时，请稍后在历史记录查看结果");
};
