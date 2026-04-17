import { apiRequest } from "../utils/request";
import type { AiModelOption, TeachingProject } from "../types";

export const fetchTeachingProjects = () =>
  apiRequest<{ projects: TeachingProject[]; models: AiModelOption[] }>({
    url: "/api/teaching/projects",
    method: "GET",
  });

export const saveTeachingProject = (data: Partial<TeachingProject> & { title: string; script: string }) =>
  apiRequest<TeachingProject>({
    url: "/api/teaching/projects",
    method: "POST",
    data,
  });

export const generateTeachingScript = (data: { prompt: string; model?: string }) =>
  apiRequest<{ content: string }>({
    url: "/api/teaching/ai-script",
    method: "POST",
    data,
  });
