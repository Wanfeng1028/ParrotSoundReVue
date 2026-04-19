import { createApp } from "vue";
import { createPinia } from "pinia";
import { ElMessage } from "element-plus";
import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "./stores/auth";
import { initThemeMode } from "./composables/useThemeMode";
import "element-plus/theme-chalk/el-message.css";
import "./main.css";
import "./style.css";
import "./styles/auth.css";

initThemeMode();

const messageDefaults = {
  duration: 1800,
  showClose: false,
};

const patchMessageMethod = (method: "success" | "warning" | "info" | "error" | "primary") => {
  const original = ElMessage[method].bind(ElMessage);
  ElMessage[method] = ((options: string | Record<string, unknown>) =>
    original(
      typeof options === "string"
        ? { message: options, ...messageDefaults }
        : { ...messageDefaults, ...options },
    )) as typeof ElMessage[typeof method];
};

patchMessageMethod("success");
patchMessageMethod("warning");
patchMessageMethod("info");
patchMessageMethod("error");
patchMessageMethod("primary");

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

const authStore = useAuthStore(pinia);
authStore.initialize().finally(() => {
  app.mount("#app");
});
