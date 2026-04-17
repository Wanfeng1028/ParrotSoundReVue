<template>
  <div class="auth-page">
    <picture class="auth-page__bg">
      <source :srcset="loginBgWebp" type="image/webp" />
      <img :src="loginBgPng" alt="Parrot Sound 重置密码背景" fetchpriority="high" />
    </picture>
    <div class="auth-page__overlay"></div>

    <section class="auth-card">
      <div class="auth-card__header">
        <h1>重置密码</h1>
        <p>想起来了？<RouterLink to="/login">返回登录</RouterLink></p>
      </div>

      <el-form label-position="top" class="auth-form">
        <el-form-item prop="email">
          <el-input v-model="formData.email" class="auth-input" type="email" placeholder="请输入邮箱">
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input v-model="formData.password" class="auth-input" type="password" show-password placeholder="请输入新密码">
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="code">
          <div class="verify-box">
            <el-input v-model="formData.code" class="auth-input code-input" placeholder="请输入验证码">
              <template #prefix>
                <el-icon><Key /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" class="verify-btn" :disabled="isCounting" @click="sendCode">
              {{ isCounting ? `${count}s` : "发送验证码" }}
            </el-button>
          </div>
        </el-form-item>

        <el-button type="primary" class="auth-submit" :loading="loading" @click="submit">
          重置密码
        </el-button>
      </el-form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { Message, Lock, Key } from "@element-plus/icons-vue";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const isCounting = ref(false);
const count = ref(60);
const formData = reactive({
  email: "",
  password: "",
  code: "",
});

const loginBgWebp = new URL("../assets/images/login-signup-bg.webp", import.meta.url).href;
const loginBgPng = new URL("../assets/images/login-signup-bg.png", import.meta.url).href;

const sendCode = async () => {
  if (!formData.email) {
    ElMessage.warning({
      message: "请先输入邮箱",
      grouping: true,
    });
    return;
  }
  const response = await authStore.requestCode(formData.email);
  ElMessage.success({
    message: response.data.code ? `开发模式验证码：${response.data.code}` : "验证码已发送",
    grouping: true,
  });
  isCounting.value = true;
  count.value = 60;
  const timer = window.setInterval(() => {
    count.value -= 1;
    if (count.value <= 0) {
      window.clearInterval(timer);
      count.value = 60;
      isCounting.value = false;
    }
  }, 1000);
};

const submit = async () => {
  loading.value = true;
  try {
    await authStore.resetAccountPassword(formData);
    ElMessage.success({
      message: "密码已重置，请重新登录",
      grouping: true,
    });
    router.push("/login");
  } finally {
    loading.value = false;
  }
};
</script>
