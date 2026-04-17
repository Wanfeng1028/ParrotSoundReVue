import { apiRequest } from "../utils/request";
import type { VoiceModel } from "../types";

export const fetchCommunityVoices = (params: {
  sort: string;
  language: string;
  search: string;
}) =>
  apiRequest<
    Array<
      VoiceModel & {
        username: string;
        userAvatar: string;
        date: string;
        desc: string;
      }
    >
  >({
    url: "/api/community/voices",
    method: "GET",
    params,
  });

export const fetchCommunityRankings = () =>
  apiRequest<
    Array<{ id: number; name: string; username: string; likes: number; userAvatar: string; avatar: string }>
  >({
    url: "/api/community/rankings",
    method: "GET",
  });

export const likeCommunityVoice = (voiceId: number) =>
  apiRequest<VoiceModel>({
    url: `/api/community/voices/${voiceId}/like`,
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
