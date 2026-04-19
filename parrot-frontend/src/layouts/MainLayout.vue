<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div class="admin-sidebar__brand">
        <img src="../assets/images/logo.png" alt="Parrot Sound" />
        <div>
          <strong>Parrot Admin</strong>
          <p>管理控制台</p>
        </div>
      </div>

      <el-menu :default-active="activePath" class="admin-menu" router>
        <el-menu-item index="/admin/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>概览面板</span>
        </el-menu-item>
        <el-menu-item index="/admin/profile">
          <el-icon><User /></el-icon>
          <span>账号设置</span>
        </el-menu-item>
      </el-menu>

      <div class="admin-sidebar__footer">
        <div class="admin-user">
          <el-avatar :size="40" :src="adminProfile.avatarUrl || undefined">
            {{ adminProfile.username.slice(0, 1) }}
          </el-avatar>
          <div>
            <strong>{{ adminProfile.username }}</strong>
            <p>{{ adminAccount }}</p>
          </div>
        </div>
        <el-button class="ps-btn ps-btn--secondary ps-btn--sm" @click="handleLogout">退出管理端</el-button>
      </div>
    </aside>

    <main class="admin-main">
      <div class="admin-main__header">
        <div>
          <h1>{{ pageTitle }}</h1>
          <p>当前为本地演示管理台，所有配置会保存到浏览器本地。</p>
        </div>
      </div>

      <div class="admin-main__body">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { DataAnalysis, User } from "@element-plus/icons-vue";
import { getAdminAccount, getAdminProfile, logoutAdmin } from "../utils/admin-session";

const route = useRoute();
const router = useRouter();

const adminProfile = computed(() => getAdminProfile());
const adminAccount = computed(() => getAdminAccount());
const pageTitle = computed(() => {
  const titleMap: Record<string, string> = {
    "/admin/dashboard": "概览面板",
    "/admin/profile": "账号设置",
  };
  return titleMap[route.path] || "管理控制台";
});
const activePath = computed(() => route.path);

const handleLogout = () => {
  logoutAdmin();
  ElMessage.success("已退出管理端");
  router.push("/admin/login");
};
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 260px 1fr;
  background: linear-gradient(180deg, #f4f7fb, #eef3fb);
}

.admin-sidebar {
  display: flex;
  flex-direction: column;
  padding: 24px 18px;
  background: rgba(255, 255, 255, 0.92);
  border-right: 1px solid rgba(135, 149, 214, 0.16);
  box-shadow: 18px 0 40px rgba(90, 112, 185, 0.08);
}

.admin-sidebar__brand {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 6px 8px 18px;
}

.admin-sidebar__brand img {
  width: 46px;
  height: 46px;
}

.admin-sidebar__brand strong {
  display: block;
  color: #334155;
}

.admin-sidebar__brand p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
}

.admin-menu {
  flex: 1;
  border-right: none;
  background: transparent;
}

:deep(.admin-menu .el-menu-item) {
  height: 48px;
  border-radius: 14px;
  margin-bottom: 8px;
}

:deep(.admin-menu .el-menu-item.is-active) {
  background: linear-gradient(135deg, rgba(90, 174, 255, 0.14), rgba(37, 99, 235, 0.12));
  color: #2563eb;
}

.admin-sidebar__footer {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 8px 0;
}

.admin-user {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(232, 240, 255, 0.95), rgba(244, 247, 255, 0.92));
}

.admin-user strong {
  display: block;
  color: #334155;
}

.admin-user p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 12px;
}

.admin-main {
  min-width: 0;
  padding: 28px 28px 24px;
}

.admin-main__header {
  margin-bottom: 20px;
}

.admin-main__header h1 {
  margin: 0;
  font-size: 30px;
  color: #334155;
}

.admin-main__header p {
  margin: 8px 0 0;
  color: #64748b;
}

.admin-main__body {
  min-height: calc(100vh - 126px);
  border-radius: 24px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 20px 50px rgba(79, 94, 163, 0.08);
}

@media (max-width: 960px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }

  .admin-sidebar {
    border-right: none;
    border-bottom: 1px solid rgba(135, 149, 214, 0.16);
  }

  .admin-main {
    padding: 20px 16px 16px;
  }
}
</style>
