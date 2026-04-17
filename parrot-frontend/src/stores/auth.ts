import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { AuthUser } from "../types";
import { fetchCurrentUser, login, register, resetPassword, sendCodeApi } from "../api/auth";

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

  const requestCode = async (email: string) => sendCodeApi({ email });

  const resetAccountPassword = async (payload: {
    email: string;
    password: string;
    code: string;
  }) => resetPassword(payload);

  const refreshProfile = async () => {
    if (!token.value) return null;
    const response = await fetchCurrentUser();
    user.value = response.data;
    return response.data;
  };

  const logout = () => {
    setToken("");
    user.value = null;
  };

  return {
    token,
    user,
    loading,
    isLoggedIn,
    initialize,
    loginWithPassword,
    registerAccount,
    requestCode,
    resetAccountPassword,
    refreshProfile,
    logout,
  };
});
