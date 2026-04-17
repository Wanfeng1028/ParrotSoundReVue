import { apiRequest } from "../utils/request";
import type { VoiceModel } from "../types";

export const fetchVoiceLibrary = (params?: Record<string, string>) =>
  apiRequest<VoiceModel[]>({
    url: "/api/voices/library",
    method: "GET",
    params,
  });

export const fetchMyVoices = () =>
  apiRequest<VoiceModel[]>({
    url: "/api/voices/my",
    method: "GET",
  });

export const createVoice = (formData: FormData) =>
  apiRequest<VoiceModel>({
    url: "/api/voices",
    method: "POST",
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateVoiceVisibility = (voiceId: number, visibility: "public" | "private") =>
  apiRequest<VoiceModel>({
    url: `/api/voices/${voiceId}/visibility`,
    method: "PATCH",
    data: { visibility },
  });

export const deleteVoice = (voiceId: number) =>
  apiRequest<null>({
    url: `/api/voices/${voiceId}`,
    method: "DELETE",
  });

export const generateVoiceDescription = (data: { name: string; prompt: string; model?: string }) =>
  apiRequest<{ raw: string }>({
    url: "/api/voices/describe-ai",
    method: "POST",
    data,
  });
