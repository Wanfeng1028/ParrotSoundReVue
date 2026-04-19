<template>
  <div class="auth-page">
    <picture class="auth-page__bg">
      <source :srcset="loginBgWebp" type="image/webp" />
      <img :src="loginBgPng" alt="Parrot Sound 登录背景" fetchpriority="high" />
    </picture>
    <div class="auth-page__overlay"></div>

    <section class="auth-card">
      <div class="auth-card__header auth-card__header--login">
        <h1>登录</h1>
        <p class="auth-card__register-tip">还没有账号？<RouterLink to="/register">立即注册</RouterLink></p>
      </div>

      <el-form label-position="top" class="auth-form">
        <el-form-item prop="email">
          <el-input v-model="loginForm.email" class="auth-input" type="email" placeholder="请输入邮箱" @keyup.enter="hanadleLogin">
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
            placeholder="请输入密码"
            @keyup.enter="hanadleLogin"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <div class="auth-card__meta auth-card__meta--login">
          <el-link :underline="false" @click="$router.push('/re-password')">忘记密码？</el-link>
        </div>

        <el-button type="primary" class="auth-submit" :loading="loading" @click="hanadleLogin">
          登录
        </el-button>
      </el-form>

      <div class="auth-divider"><span>其他登录方式</span></div>

      <div class="social-list">
        <el-button
          v-for="provider in socialProviders"
          :key="provider.label"
          class="social-button"
          @click="handleSocialLogin(provider.key, provider.label)"
        >
          <span class="social-button__content">
            <span class="social-button__icon">
              <svg v-if="provider.key === 'google'" viewBox="0 0 24 24" aria-hidden="true" class="social-button__icon-svg">
                <path
                  fill="#EA4335"
                  d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.3-1.9 3.1l3 2.3c1.8-1.6 2.8-4 2.8-6.9 0-.7-.1-1.5-.2-2.2H12z"
                />
                <path
                  fill="#34A853"
                  d="M12 21c2.6 0 4.8-.9 6.4-2.5l-3-2.3c-.8.6-1.9 1-3.4 1-2.6 0-4.8-1.7-5.5-4.1l-3.1 2.4C5 18.8 8.2 21 12 21z"
                />
                <path
                  fill="#FBBC05"
                  d="M6.5 13.1c-.2-.6-.3-1.3-.3-2.1s.1-1.4.3-2.1l-3.1-2.4C2.5 8 2 9.5 2 11s.5 3 1.4 4.4l3.1-2.3z"
                />
                <path
                  fill="#4285F4"
                  d="M12 4.8c1.4 0 2.7.5 3.7 1.5l2.8-2.8C16.8 1.9 14.6 1 12 1 8.2 1 5 3.2 3.4 6.6L6.5 9C7.2 6.5 9.4 4.8 12 4.8z"
                />
              </svg>
              <svg v-else-if="provider.key === 'facebook'" viewBox="0 0 24 24" aria-hidden="true" class="social-button__icon-svg">
                <circle cx="12" cy="12" r="11" fill="#1877F2" />
                <path fill="#FFF" d="M13.3 20v-6.3h2.1l.3-2.4h-2.4V9.8c0-.7.2-1.2 1.2-1.2h1.3V6.4c-.2 0-1-.1-1.9-.1-1.9 0-3.1 1.1-3.1 3.3v1.7H8.7v2.4h2.1V20h2.5z" />
              </svg>
              <svg v-else-if="provider.key === 'microsoft'" viewBox="0 0 24 24" aria-hidden="true" class="social-button__icon-svg">
                <rect x="2" y="2" width="9" height="9" fill="#F25022" />
                <rect x="13" y="2" width="9" height="9" fill="#7FBA00" />
                <rect x="2" y="13" width="9" height="9" fill="#00A4EF" />
                <rect x="13" y="13" width="9" height="9" fill="#FFB900" />
              </svg>
              <svg v-else-if="provider.key === 'x'" viewBox="0 0 24 24" aria-hidden="true" class="social-button__icon-svg">
                <circle cx="12" cy="12" r="11" fill="#111" />
                <path fill="#FFF" d="M8 7h2.3l2.4 3.4L15.7 7H17l-3.7 4.3L17 17h-2.3l-2.6-3.8L8.8 17H7.5l3.9-4.5z" />
              </svg>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true" class="social-button__icon-svg">
                <path
                  fill="#111"
                  d="M16.7 12.8c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.7-1.7-3.3-1.7-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-3-.8-1.5 0-2.9.9-3.7 2.2-1.6 2.8-.4 6.9 1.1 9.1.7 1.1 1.6 2.3 2.8 2.2 1.1 0 1.5-.7 2.8-.7 1.3 0 1.6.7 2.8.7 1.2 0 1.9-1 2.6-2.1.8-1.2 1.1-2.4 1.1-2.4-.1 0-2.1-.8-2.1-3zM14.4 6.3c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.6.7-1 1.7-.9 2.7 1 0 1.9-.5 2.5-1.3z"
                />
              </svg>
            </span>
            <span class="social-button__label">{{ provider.label }}</span>
          </span>
        </el-button>
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
import { Message, Lock } from "@element-plus/icons-vue";
import { useLoginLogic } from "../composables/useLoginLogic";

const { loading, hanadleLogin, handleSocialLogin, loginForm, frontendDemoEnabled, frontendDemoAccount } = useLoginLogic();

const loginBgWebp = new URL("../assets/images/login-signup-bg.webp", import.meta.url).href;
const loginBgPng = new URL("../assets/images/login-signup-bg.png", import.meta.url).href;

type SocialProviderKey = "google" | "facebook" | "microsoft" | "x" | "apple";

const socialProviders: Array<{ key: SocialProviderKey; label: string }> = [
  { key: "google", label: "使用 Google 登录" },
  { key: "facebook", label: "使用 Facebook 登录" },
  { key: "microsoft", label: "使用 Microsoft 登录" },
  { key: "x", label: "使用 X 登录" },
  { key: "apple", label: "使用 Apple 登录" },
];

const fillDemoAccount = () => {
  loginForm.email = frontendDemoAccount.email;
  loginForm.password = frontendDemoAccount.password;
};
</script>

<style scoped>
</style>
