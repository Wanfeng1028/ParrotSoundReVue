<template>
  <div class="auth-page">
    <picture class="auth-page__bg">
      <source :srcset="loginBgWebp" type="image/webp" />
      <img :src="loginBgPng" alt="Parrot Sound register background" fetchpriority="high" />
    </picture>
    <div class="auth-page__overlay"></div>

    <section class="auth-card auth-card--wide">
      <div class="auth-card__header">
        <h1>Create account</h1>
        <p>Already have an account? <RouterLink to="/login">Sign in</RouterLink></p>
      </div>

      <el-form label-position="top" class="auth-form">
        <el-form-item prop="email">
          <el-input v-model="registerForm.email" class="auth-input" type="email" placeholder="Email Address">
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="username">
          <el-input v-model="registerForm.username" class="auth-input" placeholder="Username">
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input v-model="registerForm.password" class="auth-input" type="password" show-password placeholder="Password">
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
            placeholder="Confirm Password"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="code">
          <div class="verify-box">
            <el-input v-model="registerForm.code" class="auth-input code-input" placeholder="Verification Code">
              <template #prefix>
                <el-icon><Key /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" class="verify-btn" :disabled="isCounting" @click="hanadleSendCode">
              {{ isCounting ? `${count}s` : "Send Code" }}
            </el-button>
          </div>
        </el-form-item>

        <el-button type="primary" class="auth-submit" :loading="loading" @click="hanadleRegiter">
          Create account
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

.auth-card {
  position: relative;
  z-index: 1;
  width: min(460px, 100%);
  padding: 34px 28px 28px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
}

.auth-card__header h1 {
  font-size: 34px;
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
  margin-top: 22px;
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

.verify-box {
  display: flex;
  width: 100%;
  gap: 12px;
}

.code-input {
  flex: 1;
}

.verify-btn {
  min-width: 118px;
  border-radius: 16px;
  border: none;
  background: #0b0b0c;
}

.verify-btn:disabled {
  background: #a0a5b1;
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

@media (max-width: 640px) {
  .auth-page {
    padding: 20px 12px;
  }

  .auth-card {
    padding: 28px 20px 22px;
    border-radius: 22px;
  }

  .verify-btn {
    min-width: 102px;
  }
}
</style>
