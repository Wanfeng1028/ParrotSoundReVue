import { apiRequest } from "../utils/request";
import type { AiModelOption, PaginatedResponse, TeachingProject } from "../types";

export const fetchTeachingProjects = (page = 1, pageSize = 12) =>
  apiRequest<{ items: PaginatedResponse<TeachingProject>; models: AiModelOption[] }>({
    url: "/api/teaching/projects",
    method: "GET",
    params: { page, pageSize },
  });

export const saveTeachingProject = (data: Partial<TeachingProject> & { title: string; script: string }) =>
  apiRequest<TeachingProject>({
    url: "/api/teaching/projects",
    method: "POST",
    data,
  });

export const generateTeachingScript = (data: { prompt: string; model?: string }) =>
  apiRequest<{ taskId: string; status: string }>({
    url: "/api/teaching/ai-script",
    method: "POST",
    data,
  });

export const generateTeachingVideoTask = (data: {
  title: string;
  script: string;
  voiceId: number | null;
  ratio: string;
  resolution: string;
  bitrate: string;
}) =>
  apiRequest<{ taskId: string; status: string }>({
    url: "/api/teaching/generate",
    method: "POST",
    data,
  });
