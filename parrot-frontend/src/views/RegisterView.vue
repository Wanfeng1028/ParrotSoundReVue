<template>
  <div class="auth-page">
    <picture class="auth-page__bg">
      <source :srcset="loginBgWebp" type="image/webp" />
      <img :src="loginBgPng" alt="Parrot Sound 注册背景" fetchpriority="high" />
    </picture>
    <div class="auth-page__overlay"></div>

    <section class="auth-card auth-card--wide">
      <div class="auth-card__header">
        <h1>创建账号</h1>
        <p>已有账号？<RouterLink to="/login">去登录</RouterLink></p>
      </div>

      <el-form label-position="top" class="auth-form">
        <el-form-item prop="email">
          <el-input v-model="registerForm.email" class="auth-input" type="email" placeholder="请输入邮箱">
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="username">
          <el-input v-model="registerForm.username" class="auth-input" placeholder="请输入用户名">
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input v-model="registerForm.password" class="auth-input" type="password" show-password placeholder="请输入密码">
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            class="auth-input"
            type="password"
            show-password
            placeholder="请再次输入密码"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="code">
          <div class="verify-box">
            <el-input v-model="registerForm.code" class="auth-input code-input" placeholder="请输入验证码">
              <template #prefix>
                <el-icon><Key /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" class="verify-btn" :disabled="isCounting" @click="hanadleSendCode">
              {{ isCounting ? `${count}s` : "发送验证码" }}
            </el-button>
          </div>
        </el-form-item>

        <el-button type="primary" class="auth-submit" :loading="loading" @click="hanadleRegiter">
          创建账号
        </el-button>
      </el-form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Message, User, Lock, Key } from "@element-plus/icons-vue";
import { useRegisterLogic } from "../composables/useRegisterLogic";

const { registerForm, isCounting, count, loading, hanadleSendCode, hanadleRegiter } = useRegisterLogic();

const loginBgWebp = new URL("../assets/images/login-signup-bg.webp", import.meta.url).href;
const loginBgPng = new URL("../assets/images/login-signup-bg.png", import.meta.url).href;
</script>
