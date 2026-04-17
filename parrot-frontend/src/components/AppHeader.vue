<template>
  <header class="app-header">
    <div class="app-header__inner">
      <RouterLink class="app-header__brand" to="/home">
        <img class="app-header__logo" src="../assets/images/logo.png" alt="Parrot Sound AI" />
      </RouterLink>

      <el-menu
        class="el-menu-demo app-header__menu"
        mode="horizontal"
        :default-active="$route.path"
        router
        :ellipsis="false"
      >
        <el-menu-item index="/home">首页</el-menu-item>
        <el-menu-item index="/dubbing">智能配音</el-menu-item>
        <el-menu-item index="/audio-record">音频记录</el-menu-item>
        <el-menu-item index="/clone">声音克隆</el-menu-item>
        <el-menu-item index="/teching">教育教学</el-menu-item>
        <el-menu-item index="/community">社区交流</el-menu-item>
        <el-menu-item index="/help">帮助中心</el-menu-item>
      </el-menu>

      <div class="app-header__right">
        
        <template v-if="isLogin">
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="user-dropdown-link">
              <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
              <span class="username-text">我的</span>
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
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
              <img class="app-header__login-icon" src="../assets/images/avatar-default.png" alt="登录">
              <el-link class="app-header__login-link" :underline="false">Login</el-link>
            </RouterLink>
            
            <RouterLink to="/register">
              <el-button class="app-header__signup" type="primary" round>
                Sign Up
              </el-button>
            </RouterLink>
          </div>
        </template>

      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
// 引入需要的图标
import { User, Files, SwitchButton, ArrowDown } from '@element-plus/icons-vue'

const router = useRouter()
const isLogin = ref(false)

// 检查登录状态
onMounted(() => {
  const token = localStorage.getItem('token')
  if (token) {
    isLogin.value = true
  }
})

// 处理下拉菜单点击
const handleCommand = (cmd: string) => {
  if (cmd === 'logout') {
    // 退出登录：清除 token，重置状态，跳回首页
    localStorage.removeItem('token')
    isLogin.value = false
    router.push('/')
  } else if (cmd === 'profile') {
    router.push('/user/profile')
  } else if (cmd === 'history') {
    router.push('/user/history')
  }
}
</script>

<style scoped>
/* 顶部导航固定 */
.app-header {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 60px;
  background: hsl(0, 0%, 99%);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

/* 中间内容容器 */
.app-header__inner {
  height: 60px;
  max-width: 1200px; /*稍微加宽一点以免挤*/
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between; /* 确保左右贴边 */
}

/* Logo */
.app-header__brand {
  display: flex;
  align-items: center;
  text-decoration: none;
  margin-right: 20px;
}

.app-header__logo {
  height: 50px;
  width: auto; /* 自适应宽度 */
  object-fit: contain;
  display: block;
}

/* 菜单（Element Plus） */
.app-header__menu {
  flex: 1;
  background: transparent;
  border-bottom: none !important; /* 强制去掉底边框 */
  display: flex;
  justify-content: center; /* 菜单居中 */
}

:deep(.el-menu--horizontal .el-menu-item) {
  padding: 0 16px;
  font-size: 14px;
  color: #333;
  background: transparent;
  border-bottom: none; 
}

/* hover 颜色 */
:deep(.el-menu--horizontal .el-menu-item:hover) {
  color: #6b5cff;
  background: transparent;
}

/* active 颜色 */
:deep(.el-menu--horizontal .el-menu-item.is-active) {
  color: #6b5cff !important;
  background: transparent !important;
  border-bottom: 2px solid #6b5cff !important; /* 只有选中的才有下划线 */
}

/* === 右侧区域容器 === */
.app-header__right {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* 未登录时的按钮组 */
.auth-buttons {
  display: flex;
  align-items: center;
  gap: 15px;
}

/* Login 按钮样式 */
.app-header__login {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  cursor: pointer;
}
.app-header__login-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}
.app-header__login-link {
  font-size: 15px;
  color: #333;
  font-weight: 500;
}
.app-header__login:hover .app-header__login-link {
  color: #6b5cff;
}

/* Sign Up 按钮样式 */
.app-header__signup {
  padding: 8px 20px;
  font-weight: 600;
  background-color: #6b5cff; /* 你的主题色 */
  border-color: #6b5cff;
}
.app-header__signup:hover {
  background-color: #5362bc;
  border-color: #5362bc;
}

/* === 已登录状态样式 (新增) === */
.user-dropdown-link {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 20px;
  transition: background 0.3s;
}
.user-dropdown-link:hover {
  background-color: rgba(0,0,0,0.05);
}
.username-text {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}
</style>