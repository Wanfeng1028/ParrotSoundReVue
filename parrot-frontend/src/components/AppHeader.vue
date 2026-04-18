<template>
  <header class="app-header" :class="{ 'app-header--scrolled': isScrolled }">
    <div class="app-header__inner">
      <RouterLink class="app-header__brand" to="/home">
        <img class="app-header__logo" src="../assets/images/logo.png" alt="Parrot Sound" />
        <div class="app-header__brand-copy">
          <span class="app-header__brand-kicker">AI Voice Studio</span>
          <strong>ParrotSound</strong>
        </div>
      </RouterLink>

      <nav class="app-header__nav" aria-label="Primary">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          class="app-header__nav-link"
          :class="{ 'is-active': isActive(item.to) }"
          :to="item.to"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="app-header__right">
        <button type="button" class="theme-switch" @click="toggleThemeMode">
          <el-icon class="theme-switch__icon">
            <component :is="isDark ? Sunny : Moon" />
          </el-icon>
          <span>{{ isDark ? "夜间模式" : "白天模式" }}</span>
        </button>

        <template v-if="isLogin">
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="user-dropdown-link">
              <el-avatar :size="32" :src="authStore.user?.avatarUrl || undefined">
                {{ username.slice(0, 1) }}
              </el-avatar>
              <div class="user-dropdown-link__copy">
                <span class="user-dropdown-link__label">工作台</span>
                <span class="username-text">{{ username }}</span>
              </div>
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </div>

            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon> 账号信息
                </el-dropdown-item>
                <el-dropdown-item command="history">
                  <el-icon><Files /></el-icon> 历史作品
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>

        <template v-else>
          <div class="auth-buttons">
            <RouterLink class="app-header__login" to="/login">
              登录
            </RouterLink>

            <RouterLink to="/register">
              <el-button class="app-header__signup" type="primary" round>
                免费开始
              </el-button>
            </RouterLink>
          </div>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { User, Files, SwitchButton, ArrowDown, Sunny, Moon } from "@element-plus/icons-vue";
import { useAuthStore } from "../stores/auth";
import { useThemeMode } from "../composables/useThemeMode";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const isScrolled = ref(false);
const { isDark, toggleThemeMode } = useThemeMode();

const navItems = [
  { label: "首页", to: "/home" },
  { label: "智能配音", to: "/dubbing" },
  { label: "音频记录", to: "/audio-record" },
  { label: "声音克隆", to: "/clone" },
  { label: "教育教学", to: "/teaching" },
  { label: "社区交流", to: "/community" },
  { label: "帮助中心", to: "/help" },
];

const isLogin = computed(() => authStore.isLoggedIn);
const username = computed(() => authStore.user?.username || "我的");

const handleScroll = () => {
  isScrolled.value = window.scrollY > 16;
};

const normalizedPath = computed(() => (route.path === "/teching" ? "/teaching" : route.path));

const isActive = (path: string) => normalizedPath.value === path || normalizedPath.value.startsWith(`${path}/`);

const handleCommand = (cmd: string) => {
  if (cmd === "logout") {
    authStore.logout();
    router.push("/home");
  } else if (cmd === "profile") {
    router.push("/user/profile");
  } else if (cmd === "history") {
    router.push("/user/history");
  }
};

onMounted(() => {
  handleScroll();
  window.addEventListener("scroll", handleScroll, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: var(--header-bg);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--header-border);
  transition:
    background-color 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;
}

.app-header--scrolled {
  background: var(--header-bg-scrolled);
  box-shadow: var(--header-shadow);
  border-bottom-color: var(--header-border-strong);
}

.app-header__inner {
  min-height: var(--header-height);
  max-width: 1280px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.app-header__brand {
  display: flex;
  align-items: center;
  gap: 14px;
  color: var(--text-strong);
  flex-shrink: 0;
}

.app-header__logo {
  height: 44px;
  width: auto;
}

.app-header__brand-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.app-header__brand-kicker {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--text-muted);
}

.app-header__brand-copy strong {
  font-size: 17px;
  letter-spacing: -0.02em;
}

.app-header__nav {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
}

.app-header__nav::-webkit-scrollbar {
  display: none;
}

.app-header__nav-link {
  flex-shrink: 0;
  padding: 10px 14px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    transform 0.2s ease;
}

.app-header__nav-link:hover {
  color: var(--text-strong);
  background: var(--header-link-hover-bg);
  transform: translateY(-1px);
}

.app-header__nav-link.is-active {
  color: var(--accent-500);
  background: var(--nav-active-bg);
}

.app-header__right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.theme-switch {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  height: 42px;
  padding: 0 16px;
  border: 1px solid var(--ps-btn-secondary-border);
  border-radius: 999px;
  background: var(--theme-toggle-bg);
  color: var(--text-strong);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    color 0.2s ease;
}

.theme-switch:hover {
  transform: translateY(-1px);
  border-color: rgba(90, 174, 255, 0.32);
}

.theme-switch__icon {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--theme-toggle-icon-bg);
  color: var(--accent-500);
}

.auth-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-header__login {
  padding: 10px 14px;
  border-radius: 999px;
  color: var(--text-strong);
  background: var(--ps-btn-secondary-bg);
  border: 1px solid var(--ps-btn-secondary-border);
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.app-header__login:hover {
  color: #2563eb;
  border-color: rgba(37, 99, 235, 0.25);
}

.app-header__signup {
  min-height: 42px;
  padding: 0 20px;
  font-weight: 600;
  background: linear-gradient(135deg, #5aaeff, #2563eb);
  border: none;
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.22);
}

.app-header__signup:hover {
  transform: translateY(-1px);
}

.user-dropdown-link {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--ps-btn-secondary-border);
  background: var(--dropdown-bg);
  transition: background-color 0.2s ease;
}

.user-dropdown-link:hover {
  background-color: var(--dropdown-hover-bg);
}

.user-dropdown-link__copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-dropdown-link__label {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-subtle);
}

.username-text {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
}

@media (max-width: 1080px) {
  .app-header__inner {
    flex-wrap: wrap;
    justify-content: center;
    padding-bottom: 18px;
  }

  .app-header__brand,
  .app-header__right {
    width: 100%;
    justify-content: center;
  }

  .app-header__right {
    flex-wrap: wrap;
  }
}

@media (max-width: 640px) {
  .app-header__inner {
    padding: 14px 16px 18px;
  }

  .app-header__brand-copy strong {
    font-size: 15px;
  }

  .app-header__nav {
    justify-content: flex-start;
    width: 100%;
  }

  .auth-buttons {
    width: 100%;
    justify-content: center;
  }
}
</style>
