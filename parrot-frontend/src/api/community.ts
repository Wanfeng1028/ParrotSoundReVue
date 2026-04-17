import { apiRequest } from "../utils/request";
import type { PaginatedResponse, VoiceModel } from "../types";

export const fetchCommunityVoices = (params: {
  sort: string;
  language: string;
  search: string;
  page?: number;
  pageSize?: number;
}) =>
  apiRequest<
    PaginatedResponse<
      VoiceModel & {
        username: string;
        userAvatar: string;
        date: string;
        desc: string;
        avatar: string;
      }
    >
  >({
    url: "/api/community/voices",
    method: "GET",
    params,
  });

export const fetchCommunityRankings = (params?: { page?: number; pageSize?: number }) =>
  apiRequest<
    PaginatedResponse<{ id: number; name: string; username: string; likes: number; userAvatar: string; avatar: string }>
  >({
    url: "/api/community/rankings",
    method: "GET",
    params,
  });

export const likeCommunityVoice = (voiceId: number) =>
  apiRequest<VoiceModel>({
    url: `/api/community/voices/${voiceId}/like`,
    method: "POST",
  });

export const playCommunityVoice = (voiceId: number) =>
  apiRequest<VoiceModel>({
    url: `/api/community/voices/${voiceId}/play`,
    method: "POST",
  });

export const favoriteCommunityVoice = (voiceId: number) =>
  apiRequest<VoiceModel>({
    url: `/api/community/voices/${voiceId}/favorite`,
    method: "POST",
  });

export const useCommunityVoice = (voiceId: number) =>
  apiRequest<{ voiceId: number }>({
    url: `/api/community/voices/${voiceId}/use`,
    method: "POST",
  });
