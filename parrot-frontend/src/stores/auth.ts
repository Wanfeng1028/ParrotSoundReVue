import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { AuthUser } from "../types";
import { fetchCurrentUser, login, register, resetPassword, sendCodeApi, socialLogin } from "../api/auth";
import {
  FRONTEND_DEMO_ENABLED,
  FRONTEND_DEMO_EMAIL,
  FRONTEND_DEMO_PASSWORD,
  FRONTEND_DEMO_TOKEN,
  getDemoState,
  isFrontendDemoMode,
  resetDemoState,
  setFrontendDemoMode,
} from "../mocks/demo-account";

export const useAuthStore = defineStore("auth", () => {
  const token = ref(localStorage.getItem("token") || "");
  const user = ref<AuthUser | null>(null);
  const initialized = ref(false);
  const loading = ref(false);

  const isLoggedIn = computed(() => Boolean(token.value));

  const setToken = (value: string) => {
    token.value = value;
    if (value) {
      localStorage.setItem("token", value);
    } else {
      localStorage.removeItem("token");
    }
  };

  const initialize = async () => {
    if (initialized.value) return;
    initialized.value = true;
    if (!token.value) return;
    if (isFrontendDemoMode() && token.value === FRONTEND_DEMO_TOKEN) {
      user.value = getDemoState().user;
      return;
    }
    try {
      const response = await fetchCurrentUser();
      user.value = response.data;
    } catch {
      setToken("");
      user.value = null;
    }
  };

  const loginWithPassword = async (payload: { email: string; password: string }) => {
    loading.value = true;
    try {
      const email = payload.email.trim().toLowerCase();
      if (FRONTEND_DEMO_ENABLED && email === FRONTEND_DEMO_EMAIL && payload.password === FRONTEND_DEMO_PASSWORD) {
        resetDemoState();
        setFrontendDemoMode(true);
        setToken(FRONTEND_DEMO_TOKEN);
        user.value = getDemoState().user;
        return user.value;
      }
      setFrontendDemoMode(false);
      const response = await login(payload);
      setToken(response.data.token);
      user.value = response.data.user;
      return response.data.user;
    } finally {
      loading.value = false;
    }
  };

  const registerAccount = async (payload: {
    email: string;
    username: string;
    password: string;
    code: string;
  }) => {
    loading.value = true;
    try {
      const response = await register(payload);
      setToken(response.data.token);
      user.value = response.data.user;
      return response.data.user;
    } finally {
      loading.value = false;
    }
  };

  const loginWithSocialProvider = async (provider: "google" | "facebook" | "microsoft" | "x" | "apple") => {
    loading.value = true;
    try {
      setFrontendDemoMode(false);
      const response = await socialLogin({ provider });
      setToken(response.data.token);
      user.value = response.data.user;
      return response.data.user;
    } finally {
      loading.value = false;
    }
  };

  const requestCode = async (email: string) => sendCodeApi({ email });

  const resetAccountPassword = async (payload: {
    email: string;
    password: string;
    code: string;
  }) => resetPassword(payload);

  const refreshProfile = async () => {
    if (!token.value) return null;
    if (isFrontendDemoMode() && token.value === FRONTEND_DEMO_TOKEN) {
      user.value = getDemoState().user;
      return user.value;
    }
    const response = await fetchCurrentUser();
    user.value = response.data;
    return response.data;
  };

  const logout = () => {
    setFrontendDemoMode(false);
    setToken("");
    user.value = null;
  };

  return {
    token,
    user,
    loading,
    isLoggedIn,
    frontendDemoEnabled: FRONTEND_DEMO_ENABLED,
    initialize,
    loginWithPassword,
    loginWithSocialProvider,
    registerAccount,
    requestCode,
    resetAccountPassword,
    refreshProfile,
    logout,
    frontendDemoAccount: {
      email: FRONTEND_DEMO_EMAIL,
      password: FRONTEND_DEMO_PASSWORD,
    },
  };
});
