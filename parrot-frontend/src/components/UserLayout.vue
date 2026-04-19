<template>
  <div class="user-layout">
    <div class="user-sidebar">
      <el-menu
        :default-active="activePath"
        class="custom-menu"
        router
      >
        <el-menu-item index="/user/profile">
          <el-icon><InfoFilled /></el-icon>
          <span>账号信息</span>
        </el-menu-item>
        <el-menu-item index="/user/history">
          <el-icon><Files /></el-icon>
          <span>历史作品</span>
        </el-menu-item>
        <el-menu-item index="/user/interaction">
          <el-icon><StarFilled /></el-icon>
          <span>互动信息</span>
        </el-menu-item>
        <el-menu-item index="/user/notification">
          <el-icon><BellFilled /></el-icon>
          <span>通知提醒</span>
        </el-menu-item>
      </el-menu>
    </div>

    <div class="user-content">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { InfoFilled, Files, StarFilled, BellFilled } from '@element-plus/icons-vue'

const route = useRoute()
const activePath = computed(() => route.path)
</script>

<style scoped>
.user-layout {
  display: flex;
  min-height: var(--page-shell-min-height);
  background: var(--app-bg); /* 全局灰底 */
  padding: 20px 0;
  justify-content: center;
  gap: 20px;
  box-sizing: border-box;
}

.user-sidebar {
  width: 240px;
  background: var(--surface-elevated);
  /* 这里的 padding 和样式是为了还原左侧那种悬浮感，实际上你可以包裹个卡片 */
  border-radius: 20px;
  box-shadow: var(--shadow-soft);
}

/* 侧边栏菜单深度定制 */
.custom-menu {
  border-right: none;
  background: transparent;
  padding: 10px;
}
:deep(.el-menu-item) {
  height: 50px;
  margin-bottom: 5px;
  border-radius: 8px;
  color: var(--text-muted);
  font-weight: 500;
}
:deep(.el-menu-item.is-active) {
  background: var(--nav-active-bg); /* 选中时的浅灰背景 */
  color: var(--accent-500);
  font-weight: bold;
}
:deep(.el-menu-item:hover) {
  background-color: var(--header-link-hover-bg);
}
:deep(.el-icon) { font-size: 18px; margin-right: 10px; }

.user-content {
  width: 900px; /* 右侧固定宽度，还原设计图的大卡片宽度 */
  background: var(--surface-elevated);
  border-radius: 8px; /* 大圆角 */
  padding: 0; /* 内部 padding 由页面自己控制 */
  overflow: hidden; /* 防止圆角溢出 */
  box-shadow: var(--shadow-soft);
}
</style>
