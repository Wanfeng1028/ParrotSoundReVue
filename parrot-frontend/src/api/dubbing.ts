import { apiRequest } from "../utils/request";
import type { AiModelOption, DubbingJob, PaginatedResponse } from "../types";

export const fetchDubbingOptions = () =>
  apiRequest<{
    voices: Array<{ id: number; name: string; tag: string; avatar: string; sampleAudioUrl: string }>;
    emotions: string[];
    models: AiModelOption[];
    currentModel?: AiModelOption;
  }>({
    url: "/api/dubbing/options",
    method: "GET",
  });

export const generateDubbingDraft = (data: { prompt: string; model?: string }) =>
  apiRequest<{ taskId: string; status: string }>({
    url: "/api/dubbing/ai-generate",
    method: "POST",
    data,
  });

export const previewDubbing = (data: {
  title: string;
  text: string;
  voiceId: number;
  settings: Record<string, unknown>;
}) =>
  apiRequest<{ taskId: string; status: string }>({
    url: "/api/dubbing/preview",
    method: "POST",
    data,
  });

export const exportDubbing = (data: {
  title: string;
  text: string;
  voiceId: number;
  settings: Record<string, unknown>;
}) =>
  apiRequest<{ taskId: string; status: string }>({
    url: "/api/dubbing/export",
    method: "POST",
    data,
  });

export const fetchAudioRecords = (search = "", page = 1, pageSize = 12) =>
  apiRequest<PaginatedResponse<DubbingJob>>({
    url: "/api/dubbing/records",
    method: "GET",
    params: { search, page, pageSize },
  });

export const deleteAudioRecord = (id: number) =>
  apiRequest<null>({
    url: `/api/dubbing/records/${id}`,
    method: "DELETE",
  });
