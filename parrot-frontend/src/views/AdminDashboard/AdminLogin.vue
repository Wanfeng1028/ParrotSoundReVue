<template>
  <div class="auth-page">
    <div class="auth-page__overlay"></div>

    <section class="auth-card">
      <div class="auth-card__header">
        <h1>Admin sign in</h1>
        <p>Parrot Sound 管理平台登录入口</p>
      </div>

      <div class="auth-form">
        <div class="form-group">
          <el-input v-model="user" class="auth-input" placeholder="管理员账号">
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </div>

        <div class="form-group">
          <el-input v-model="pwd" class="auth-input" type="password" show-password placeholder="管理员密码">
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </div>

        <el-button type="primary" class="auth-submit" @click="handleLogin">Login</el-button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { User, Lock } from "@element-plus/icons-vue";

const user = ref("");
const pwd = ref("");

const handleLogin = () => {
  if (!user.value || !pwd.value) {
    ElMessage.warning("请输入管理员账号和密码");
    return;
  }
  ElMessage.success("管理端登录入口已就绪，后续可接真实接口");
};
</script>

<style scoped>
.auth-page {
  position: relative;
  min-height: 100vh;
  padding: 24px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(180deg, #f4f6fb 0%, #ebedf3 100%);
}

.auth-page__overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.1), transparent 32%),
    radial-gradient(circle at left center, rgba(13, 148, 136, 0.08), transparent 28%);
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
  margin: 0;
  font-size: 34px;
  line-height: 1.05;
  color: #18181b;
}

.auth-card__header p {
  margin-top: 8px;
  color: #808694;
  font-size: 14px;
}

.auth-form {
  margin-top: 22px;
}

.form-group {
  margin-bottom: 14px;
}

:deep(.auth-input .el-input__wrapper) {
  min-height: 52px;
  border-radius: 16px;
  background: #fbfbfc;
  box-shadow: inset 0 0 0 1px #eceef3;
  padding: 0 16px;
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
</style>
