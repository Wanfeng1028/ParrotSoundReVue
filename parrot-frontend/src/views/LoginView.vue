<template>
  <div class="auth-page">
    <picture class="auth-page__bg">
      <source :srcset="loginBgWebp" type="image/webp" />
      <img :src="loginBgPng" alt="Parrot Sound login background" fetchpriority="high" />
    </picture>
    <div class="auth-page__overlay"></div>
    <div class="auth-page__headline">Which is</div>

    <section class="auth-card">
      <div class="auth-card__header">
        <h1>Sign in</h1>
        <p>New user? <RouterLink to="/register">Create an account</RouterLink></p>
      </div>

      <el-form label-position="top" class="auth-form">
        <el-form-item prop="email">
          <el-input v-model="loginForm.email" class="auth-input" type="email" placeholder="Email Address" @keyup.enter="hanadleLogin">
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            class="auth-input"
            type="password"
            show-password
            placeholder="Password"
            @keyup.enter="hanadleLogin"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <div class="auth-card__meta">
          <el-link :underline="false" @click="$router.push('/re-password')">Forgot password?</el-link>
        </div>

        <el-button type="primary" class="auth-submit" :loading="loading" @click="hanadleLogin">
          Login
        </el-button>
      </el-form>

      <div class="auth-divider"><span>or</span></div>

      <div class="social-list">
        <button
          v-for="provider in socialProviders"
          :key="provider.label"
          type="button"
          class="social-button"
          @click="handleSocialLogin(provider.label)"
        >
          <span class="social-button__icon">{{ provider.icon }}</span>
          <span>{{ provider.label }}</span>
        </button>
      </div>

      <div v-if="frontendDemoEnabled" class="demo-box">
        <div class="demo-box__head">
          <strong>前端测试账号</strong>
          <el-button plain class="demo-box__button" @click="fillDemoAccount">一键填充</el-button>
        </div>
        <div class="demo-box__line">账号：{{ frontendDemoAccount.email }}</div>
        <div class="demo-box__line">密码：{{ frontendDemoAccount.password }}</div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { Message, Lock } from "@element-plus/icons-vue";
import { useLoginLogic } from "../composables/useLoginLogic";

const { loading, hanadleLogin, loginForm, frontendDemoEnabled, frontendDemoAccount } = useLoginLogic();

const loginBgWebp = new URL("../assets/images/login-signup-bg.webp", import.meta.url).href;
const loginBgPng = new URL("../assets/images/login-signup-bg.png", import.meta.url).href;

const socialProviders = [
  { label: "Continue with Google", icon: "G" },
  { label: "Continue with Facebook", icon: "f" },
  { label: "Continue with X", icon: "X" },
  { label: "Continue with Apple", icon: "" },
];

const fillDemoAccount = () => {
  loginForm.email = frontendDemoAccount.email;
  loginForm.password = frontendDemoAccount.password;
};

const handleSocialLogin = (provider: string) => {
  ElMessage.info(`${provider} 暂未接入`);
};
</script>

<style scoped>
.auth-page {
  position: relative;
  min-height: calc(100vh - var(--header-height));
  padding: 32px 16px;
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
  background: linear-gradient(90deg, rgba(246, 247, 249, 0.94), rgba(246, 247, 249, 0.82));
}

.auth-page__headline {
  position: absolute;
  top: 12px;
  right: max(4vw, 20px);
  font-size: clamp(48px, 8vw, 86px);
  line-height: 1;
  color: rgba(24, 24, 27, 0.92);
  font-family: Georgia, "Times New Roman", serif;
  pointer-events: none;
}

.auth-card {
  position: relative;
  z-index: 1;
  width: min(420px, 100%);
  padding: 34px 28px 28px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
}

.auth-card__header h1 {
  font-size: 36px;
  line-height: 1.05;
  margin: 0;
  color: #18181b;
}

.auth-card__header p {
  margin-top: 8px;
  color: #808694;
  font-size: 14px;
}

.auth-card__header a {
  color: #4a6cf7;
  font-weight: 600;
}

.auth-form {
  margin-top: 24px;
}

.auth-form :deep(.el-form-item) {
  margin-bottom: 14px;
}

.auth-form :deep(.auth-input .el-input__wrapper) {
  min-height: 52px;
  border-radius: 16px;
  background: #fbfbfc;
  box-shadow: inset 0 0 0 1px #eceef3;
  padding: 0 16px;
}

.auth-form :deep(.auth-input .el-input__prefix-inner) {
  color: #9aa0ad;
}

.auth-card__meta {
  display: flex;
  justify-content: flex-start;
  margin: 6px 0 18px;
}

.auth-card__meta :deep(.el-link) {
  color: #6b7280;
  font-weight: 600;
}

.auth-submit {
  width: 100%;
  min-height: 50px;
  border: none;
  border-radius: 999px;
  background: #0b0b0c;
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
}

.auth-submit:hover {
  background: #19191d;
}

.auth-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 22px 0 18px;
  color: #8b93a3;
  font-size: 13px;
}

.auth-divider::before,
.auth-divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: #e8ebf0;
}

.social-list {
  display: grid;
  gap: 12px;
}

.social-button {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  width: 100%;
  min-height: 52px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid #eceef3;
  background: #ffffff;
  color: #20222a;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.social-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}

.social-button__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f4f6fb;
  font-size: 16px;
  font-weight: 700;
}

.demo-box {
  margin-top: 18px;
  padding: 14px 16px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid #edf1f5;
}

.demo-box__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.demo-box__head strong {
  font-size: 14px;
  color: #20222a;
}

.demo-box__button {
  border-color: #d8dbe3;
  color: #20222a;
}

.demo-box__line {
  color: #6c7383;
  line-height: 1.8;
  font-size: 13px;
}

@media (max-width: 640px) {
  .auth-page {
    padding: 20px 12px;
  }

  .auth-card {
    padding: 28px 20px 22px;
    border-radius: 22px;
  }
}
</style>
