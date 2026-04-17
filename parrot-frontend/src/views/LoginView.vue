<template>
  <div class="auth-page">
    <picture class="auth-page__bg">
      <source :srcset="loginBgWebp" type="image/webp" />
      <img :src="loginBgPng" alt="Parrot Sound login background" fetchpriority="high" />
    </picture>
    <div class="auth-page__overlay"></div>

    <div class="auth-shell">
      <section class="auth-intro">
        <span class="auth-intro__badge">Sign in</span>
        <h1>回到你的 AI 语音工作台。</h1>
        <p>
          登录后可以继续处理配音任务、声音资产和教学项目。页面布局已改为自适应双栏，中小屏也能稳定使用。
        </p>

        <div class="auth-highlights">
          <div class="auth-highlight">
            <strong>任务可追踪</strong>
            <span>AI 生成、试听、导出都能回查状态和结果。</span>
          </div>
          <div class="auth-highlight">
            <strong>资源可复用</strong>
            <span>声音模型、课程项目和社区内容可贯穿多个页面流转。</span>
          </div>
        </div>
      </section>

      <section class="auth-card">
        <div class="auth-card__header">
          <h2>登录账户</h2>
          <RouterLink to="/home">返回首页</RouterLink>
        </div>

        <el-form label-position="top" class="auth-form">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="loginForm.email" placeholder="请输入邮箱" class="auth-input" type="email" />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="loginForm.password"
              placeholder="请输入密码(6-20个数字或字母)"
              show-password
              class="auth-input"
              type="password"
              @keyup.enter="hanadleLogin"
            />
          </el-form-item>

          <div class="auth-form__meta">
            <el-link :underline="false" @click="$router.push('/re-password')">忘记密码？</el-link>
            <span>没有账号？<RouterLink to="/register">去注册</RouterLink></span>
          </div>

          <el-button type="primary" class="auth-submit" :loading="loading" @click="hanadleLogin">
            登录并进入工作台
          </el-button>

          <div v-if="frontendDemoEnabled" class="demo-box">
            <div class="demo-box__title">前端演示模式</div>
            <div class="demo-box__line">账号：{{ frontendDemoAccount.email }}</div>
            <div class="demo-box__line">密码：{{ frontendDemoAccount.password }}</div>
            <p>仅在 `VITE_ENABLE_FRONTEND_DEMO=true` 时生效，生产构建默认关闭。</p>
            <el-button plain class="demo-box__button" @click="fillDemoAccount">一键填充演示账号</el-button>
          </div>
        </el-form>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLoginLogic } from "../composables/useLoginLogic";

const { loading, hanadleLogin, loginForm, frontendDemoEnabled, frontendDemoAccount } = useLoginLogic();

const loginBgWebp = new URL("../assets/images/login-signup-bg.webp", import.meta.url).href;
const loginBgPng = new URL("../assets/images/login-signup-bg.png", import.meta.url).href;

const fillDemoAccount = () => {
  loginForm.email = frontendDemoAccount.email;
  loginForm.password = frontendDemoAccount.password;
};
</script>

<style scoped>
.auth-page {
  position: relative;
  min-height: calc(100vh - var(--header-height));
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.auth-page__bg,
.auth-page__bg img,
.auth-page__overlay {
  position: absolute;
  inset: 0;
}

.auth-page__bg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.auth-page__overlay {
  background:
    linear-gradient(90deg, rgba(244, 248, 251, 0.95) 0%, rgba(244, 248, 251, 0.75) 42%, rgba(244, 248, 251, 0.18) 100%),
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.18), transparent 35%);
}

.auth-shell {
  position: relative;
  z-index: 1;
  width: min(1160px, 100%);
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 440px);
  gap: 24px;
  align-items: stretch;
}

.auth-intro,
.auth-card {
  border-radius: 32px;
  border: 1px solid rgba(255, 255, 255, 0.42);
  box-shadow: var(--shadow-strong);
  backdrop-filter: blur(16px);
}

.auth-intro {
  padding: 40px;
  background: rgba(17, 32, 49, 0.82);
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.auth-intro__badge {
  display: inline-flex;
  width: fit-content;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(20, 184, 166, 0.14);
  color: #99f6e4;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.auth-intro h1 {
  margin-top: 22px;
  font-size: clamp(34px, 4vw, 54px);
  line-height: 1.05;
  letter-spacing: -0.05em;
  max-width: 8ch;
}

.auth-intro p {
  margin-top: 18px;
  max-width: 580px;
  color: rgba(248, 250, 252, 0.78);
  line-height: 1.8;
}

.auth-highlights {
  margin-top: 30px;
  display: grid;
  gap: 14px;
}

.auth-highlight {
  padding: 18px 20px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.auth-highlight strong {
  display: block;
  font-size: 18px;
}

.auth-highlight span {
  display: block;
  margin-top: 8px;
  color: rgba(248, 250, 252, 0.72);
  line-height: 1.7;
}

.auth-card {
  padding: 30px;
  background: rgba(255, 255, 255, 0.85);
}

.auth-card__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 18px;
}

.auth-card__header h2 {
  font-size: 28px;
  letter-spacing: -0.03em;
}

.auth-card__header a {
  color: var(--brand-700);
  font-weight: 700;
}

.auth-form :deep(.el-form-item__label) {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
}

.auth-form :deep(.auth-input .el-input__wrapper) {
  min-height: 48px;
  border-radius: 14px;
  background: rgba(244, 248, 251, 0.96);
  box-shadow: inset 0 0 0 1px rgba(17, 32, 49, 0.08);
}

.auth-form__meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin: 8px 0 20px;
  color: var(--text-muted);
  font-size: 14px;
  flex-wrap: wrap;
}

.auth-form__meta a {
  color: var(--brand-700);
  font-weight: 700;
}

.auth-submit {
  width: 100%;
  min-height: 50px;
  border-radius: 16px;
  border: none;
  font-weight: 700;
  background: linear-gradient(135deg, var(--brand-600), var(--accent-500));
  box-shadow: 0 18px 34px rgba(15, 118, 110, 0.18);
}

.demo-box {
  margin-top: 20px;
  padding: 18px;
  border-radius: 20px;
  background: rgba(13, 148, 136, 0.08);
  border: 1px solid rgba(13, 148, 136, 0.16);
}

.demo-box__title {
  font-size: 14px;
  font-weight: 800;
  color: var(--brand-700);
  margin-bottom: 10px;
}

.demo-box__line {
  color: var(--text-muted);
  line-height: 1.8;
}

.demo-box p {
  margin-top: 10px;
  color: var(--text-subtle);
  line-height: 1.7;
  font-size: 13px;
}

.demo-box__button {
  margin-top: 12px;
  border-color: rgba(13, 148, 136, 0.32);
  color: var(--brand-700);
}

@media (max-width: 960px) {
  .auth-shell {
    grid-template-columns: 1fr;
  }

  .auth-intro {
    min-height: 320px;
  }

  .auth-intro h1 {
    max-width: none;
  }
}

@media (max-width: 640px) {
  .auth-page {
    padding: 12px;
  }

  .auth-intro,
  .auth-card {
    padding: 22px;
    border-radius: 24px;
  }
}
</style>
