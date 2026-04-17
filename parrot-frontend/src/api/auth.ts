import { apiRequest } from "../utils/request";
import type { AuthUser } from "../types";

interface AuthPayload {
  token: string;
  user: AuthUser;
}

export const login = (data: { email: string; password: string }) =>
  apiRequest<AuthPayload>({
    url: "/api/auth/login",
    method: "POST",
    data,
  });

export const sendCodeApi = (data: { email: string }) =>
  apiRequest<{ email: string; expiresAt: string; delivery: string; code?: string }>({
    url: "/api/auth/send-code",
    method: "POST",
    data,
  });

export const register = (data: {
  email: string;
  username: string;
  password: string;
  code: string;
}) =>
  apiRequest<AuthPayload>({
    url: "/api/auth/register",
    method: "POST",
    data,
  });

export const resetPassword = (data: {
  email: string;
  password: string;
  code: string;
}) =>
  apiRequest<null>({
    url: "/api/auth/reset-password",
    method: "POST",
    data,
  });

export const fetchCurrentUser = () =>
  apiRequest<AuthUser>({
    url: "/api/auth/me",
    method: "GET",
  });
