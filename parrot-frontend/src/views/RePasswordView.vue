<template>
  <div class="login-container">
    <img class="login-signup-bg-img" src="../assets/images/login-signup-bg.png" alt="Parrot-Login-Bg" />
    <div class="gradient-layer"></div>

    <div class="login-box">
      <h1 class="login-title-text">Parrot Sound<br />重置密码</h1>
      <el-form label-position="top" class="login-form">
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱" class="custom-input" type="email" />
        </el-form-item>
        <el-form-item label="新密码" prop="password">
          <el-input v-model="formData.password" placeholder="请输入密码(6-20个数字或字母)" show-password class="custom-input" type="password" />
        </el-form-item>
        <el-form-item label="验证码" prop="code">
          <div class="verify-box">
            <el-input v-model="formData.code" placeholder="请输入验证码" class="custom-input code-input" type="text" />
            <el-button type="primary" class="verify-btn" :disabled="isCounting" @click="sendCode">
              {{ isCounting ? `${count}秒后重新获取` : "发送验证码" }}
            </el-button>
          </div>
        </el-form-item>
        <el-button type="primary" class="login-btn" :loading="loading" @click="submit">重置密码</el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
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

const sendCode = async () => {
  if (!formData.email) {
    ElMessage.warning("请先输入邮箱");
    return;
  }
  const response = await authStore.requestCode(formData.email);
  ElMessage.success(response.data.code ? `开发模式验证码：${response.data.code}` : "验证码已发送");
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
    ElMessage.success("密码已重置，请重新登录");
    router.push("/login");
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container { width: 100vw; height: 100vh; display: flex; align-items: center; position: relative; overflow: hidden; }
.login-signup-bg-img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; }
.gradient-layer { position: absolute; top: 0; left: 0; width: 60%; height: 100%; z-index: 1; background: linear-gradient(to right, rgba(227,229,250,1) 20%, rgba(227,229,250,0.8) 50%, rgba(227,229,250,0) 100%); }
.login-box { display: flex; flex-direction: column; padding: 40px; position: relative; width: 700px; height: 500px; background-color: rgba(255,255,255,0.6); backdrop-filter: blur(10px); border-radius: 16px; z-index: 2; margin-left: 10%; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); }
.login-title-text { font-size: 32px; color: #333; text-align: center; margin-bottom: 40px; }
:deep(.custom-input .el-input__wrapper) { background-color: #e6e8eb; box-shadow: none; padding: 10px 15px; border-radius: 8px; }
:deep(.el-form-item__label) { font-weight: bold; color: #333; }
.login-btn { width: 100%; height: 48px; font-size: 16px; background-color: #5362bc; border: none; border-radius: 8px; margin-top: 20px; }
.verify-box { display: flex; gap: 10px; }
.code-input { flex: 1; }
.verify-btn { width: 140px; background-color: #5362bc; border-color: #5362bc; border-radius: 8px; }
</style>
