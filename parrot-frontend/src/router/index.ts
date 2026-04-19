import { createRouter, createWebHistory } from "vue-router";
import { ElMessage } from "element-plus";
import { useAuthStore } from "../stores/auth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/home" },
    {
      path: "/",
      component: () => import("../layouts/PublicLayout.vue"),
      children: [
        { path: "home", name: "home", component: () => import("../views/HomeView.vue") },
        { path: "dubbing", name: "dubbing", component: () => import("../views/DubbingView.vue"), meta: { requiresAuth: true } },
        { path: "clone", name: "clone", component: () => import("../views/CloneView.vue"), meta: { requiresAuth: true } },
        { path: "history", name: "history", component: () => import("../views/HistoryView.vue"), meta: { requiresAuth: true } },
        {
          path: "teaching",
          alias: "/teching",
          name: "teaching",
          component: () => import("../views/TeachingView.vue"),
          meta: { requiresAuth: true },
        },
        { path: "community", name: "community", component: () => import("../views/CommunityView.vue"), meta: { requiresAuth: true } },
        { path: "audio-record", name: "audio-record", component: () => import("../views/AudioRecordView.vue"), meta: { requiresAuth: true } },
        { path: "help", name: "help", component: () => import("../views/HelpView.vue"), meta: { requiresAuth: true } },
        { path: "login", name: "login", component: () => import("../views/LoginView.vue") },
        { path: "register", name: "register", component: () => import("../views/RegisterView.vue") },
        { path: "re-password", name: "re-password", component: () => import("../views/RePasswordView.vue") },
        {
          path: "user",
          component: () => import("../components/UserLayout.vue"),
          meta: { requiresAuth: true },
          children: [
            { path: "", redirect: "/user/profile" },
            { path: "profile", name: "user-profile", component: () => import("../views/User/UserInfo.vue") },
            { path: "history", name: "history-works", component: () => import("../views/User/HistoryWorks.vue") },
            { path: "interaction", name: "interaction", component: () => import("../views/User/InteractionView.vue") },
            { path: "notification", name: "notification", component: () => import("../views/User/NotificationView.vue") },
          ],
        },
      ],
    },
  ],
});

router.beforeEach((to) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }
  if (authStore.isLoggedIn && (to.path === "/login" || to.path === "/register")) {
    return { path: "/dubbing" };
  }
  return true;
});

router.afterEach(() => {
  window.setTimeout(() => {
    ElMessage.closeAll();
  }, 0);
});

export default router;
