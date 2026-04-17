import { apiRequest } from "../utils/request";
import type { AuthUser, InteractionItem, NotificationItem, PaginatedResponse } from "../types";

export const updateProfile = (formData: FormData) =>
  apiRequest<AuthUser>({
    url: "/api/users/profile",
    method: "PUT",
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updatePassword = (data: {
  q1: string;
  q2: string;
  q3: string;
  password: string;
  confirmPassword: string;
}) =>
  apiRequest<null>({
    url: "/api/users/password",
    method: "PUT",
    data,
  });

export const fetchHistory = (type: "all" | "audio" | "video" | "voice", page = 1, pageSize = 12) =>
  apiRequest<
    PaginatedResponse<{ id: string; itemId: number; type: string; title: string; date: string; cover: string; status: string; audioUrl: string }>
  >({
    url: "/api/users/history",
    method: "GET",
    params: { type, page, pageSize },
  });

export const fetchInteractions = (type: string, page = 1, pageSize = 12) =>
  apiRequest<PaginatedResponse<InteractionItem>>({
    url: "/api/users/interactions",
    method: "GET",
    params: { type, page, pageSize },
  });

export const fetchNotifications = (type: string, page = 1, pageSize = 12) =>
  apiRequest<PaginatedResponse<NotificationItem>>({
    url: "/api/users/notifications",
    method: "GET",
    params: { type, page, pageSize },
  });
