import { apiRequest } from "../utils/request";
import type { AuthUser, InteractionItem, NotificationItem } from "../types";

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

export const fetchHistory = (type: "all" | "audio" | "video" | "voice") =>
  apiRequest<Array<{ id: string; itemId: number; type: string; title: string; date: string; cover: string; status: string; audioUrl: string }>>({
    url: "/api/users/history",
    method: "GET",
    params: { type },
  });

export const fetchInteractions = (type: string) =>
  apiRequest<InteractionItem[]>({
    url: "/api/users/interactions",
    method: "GET",
    params: { type },
  });

export const fetchNotifications = (type: string) =>
  apiRequest<NotificationItem[]>({
    url: "/api/users/notifications",
    method: "GET",
    params: { type },
  });
