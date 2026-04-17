<template>
  <div class="auth-page">
    <picture class="auth-page__bg">
      <source :srcset="loginBgWebp" type="image/webp" />
      <img :src="loginBgPng" alt="Parrot Sound 登录背景" fetchpriority="high" />
    </picture>
    <div class="auth-page__overlay"></div>
    <div class="auth-page__headline">欢迎回来</div>

    <section class="auth-card">
      <div class="auth-card__header">
        <h1>登录</h1>
        <p>还没有账号？<RouterLink to="/register">立即注册</RouterLink></p>
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

        <div class="auth-card__meta">
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
          plain
          class="social-button"
          @click="handleSocialLogin(provider.label)"
        >
          <span class="social-button__icon">{{ provider.icon }}</span>
          <span>{{ provider.label }}</span>
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
import { ElMessage } from "element-plus";
import { Message, Lock } from "@element-plus/icons-vue";
import { useLoginLogic } from "../composables/useLoginLogic";

const { loading, hanadleLogin, loginForm, frontendDemoEnabled, frontendDemoAccount } = useLoginLogic();

const loginBgWebp = new URL("../assets/images/login-signup-bg.webp", import.meta.url).href;
const loginBgPng = new URL("../assets/images/login-signup-bg.png", import.meta.url).href;

const socialProviders = [
  { label: "使用 Google 登录", icon: "G" },
  { label: "使用 Facebook 登录", icon: "F" },
  { label: "使用 X 登录", icon: "X" },
  { label: "使用 Apple 登录", icon: "A" },
];

const fillDemoAccount = () => {
  loginForm.email = frontendDemoAccount.email;
  loginForm.password = frontendDemoAccount.password;
};

const handleSocialLogin = (provider: string) => {
  ElMessage.info(`${provider} 暂未接入`);
};
</script>
