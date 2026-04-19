import { computed, readonly, ref } from "vue";

type ThemeMode = "day" | "night";

const STORAGE_KEY = "parrot-sound-theme-mode";
const themeMode = ref<ThemeMode>("day");

let initialized = false;

const applyThemeMode = (mode: ThemeMode) => {
  themeMode.value = mode;

  if (typeof document !== "undefined") {
    const token = mode === "night" ? "dark" : "light";
    document.documentElement.dataset.theme = token;
    document.documentElement.style.colorScheme = token;
    document.body.dataset.theme = token;
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, mode);
  }
};

const getInitialThemeMode = (): ThemeMode => {
  return "day";
};

export const initThemeMode = () => {
  if (initialized) {
    return;
  }

  initialized = true;
  applyThemeMode(getInitialThemeMode());
};

export const useThemeMode = () => {
  const isDark = computed(() => themeMode.value === "night");

  const setThemeMode = (mode: ThemeMode) => {
    applyThemeMode(mode);
  };

  const toggleThemeMode = () => {
    applyThemeMode(themeMode.value === "night" ? "day" : "night");
  };

  return {
    themeMode: readonly(themeMode),
    isDark,
    setThemeMode,
    toggleThemeMode,
  };
};
