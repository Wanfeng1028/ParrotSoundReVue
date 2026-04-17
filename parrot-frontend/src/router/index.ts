import { createRouter, createWebHistory } from "vue-router";
import PublicLayout from "../layouts/PublicLayout.vue";
import UserLayout from "../components/UserLayout.vue";
import HomeView from "../views/HomeView.vue";
import DubbingView from "../views/DubbingView.vue";
import CloneView from "../views/CloneView.vue";
import HistoryView from "../views/HistoryView.vue";
import TechingView from "../views/TechingView.vue";
import CommunityView from "../views/CommunityView.vue";
import HelpView from "../views/HelpView.vue";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import RePasswordView from "../views/RePasswordView.vue";
import UserInfoView from "../views/User/UserInfo.vue";
import HistoryWorksView from "../views/User/HistoryWorks.vue";
import InteractionView from "../views/User/InteractionView.vue";
import NotificationView from "../views/User/NotificationView.vue";
import AudioRecordView from "../views/AudioRecordView.vue";
import { useAuthStore } from "../stores/auth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/home" },
    {
      path: "/",
      component: PublicLayout,
      children: [
        { path: "home", name: "home", component: HomeView },
        { path: "dubbing", name: "dubbing", component: DubbingView, meta: { requiresAuth: true } },
        { path: "clone", name: "clone", component: CloneView, meta: { requiresAuth: true } },
        { path: "history", name: "history", component: HistoryView, meta: { requiresAuth: true } },
        { path: "teching", name: "teching", component: TechingView, meta: { requiresAuth: true } },
        { path: "community", name: "community", component: CommunityView, meta: { requiresAuth: true } },
        { path: "audio-record", name: "audio-record", component: AudioRecordView, meta: { requiresAuth: true } },
        { path: "help", name: "help", component: HelpView, meta: { requiresAuth: true } },
        { path: "login", name: "login", component: LoginView },
        { path: "register", name: "register", component: RegisterView },
        { path: "re-password", name: "re-password", component: RePasswordView },
        {
          path: "user",
          component: UserLayout,
          meta: { requiresAuth: true },
          children: [
            { path: "", redirect: "/user/profile" },
            { path: "profile", name: "user-profile", component: UserInfoView },
            { path: "history", name: "history-works", component: HistoryWorksView },
            { path: "interaction", name: "interaction", component: InteractionView },
            { path: "notification", name: "notification", component: NotificationView },
          ],
        },
      ],
    },
  ],
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  await authStore.initialize();
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }
  if (authStore.isLoggedIn && (to.path === "/login" || to.path === "/register")) {
    return { path: "/dubbing" };
  }
  return true;
});

export default router;
