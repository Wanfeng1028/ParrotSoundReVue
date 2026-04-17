import { apiRequest } from "../utils/request";
import type { AiModelOption, DubbingJob } from "../types";

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
  apiRequest<{ content: string }>({
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
  apiRequest<DubbingJob>({
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
  apiRequest<DubbingJob>({
    url: "/api/dubbing/export",
    method: "POST",
    data,
  });

export const fetchAudioRecords = (search = "") =>
  apiRequest<DubbingJob[]>({
    url: "/api/dubbing/records",
    method: "GET",
    params: { search },
  });

export const deleteAudioRecord = (id: number) =>
  apiRequest<null>({
    url: `/api/dubbing/records/${id}`,
    method: "DELETE",
  });
