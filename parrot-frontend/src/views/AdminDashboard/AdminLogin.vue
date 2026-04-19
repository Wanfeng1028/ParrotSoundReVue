<template>
  <div class="auth-page auth-page--plain">
    <div class="auth-page__overlay"></div>

    <section class="auth-card">
      <div class="auth-card__header">
        <h1>管理端登录</h1>
        <p>Parrot Sound 管理平台登录入口</p>
      </div>

      <div class="auth-form">
        <div class="form-group">
          <el-input v-model="user" class="auth-input" placeholder="管理员账号" @keyup.enter="handleLogin">
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </div>

        <div class="form-group">
          <el-input v-model="pwd" class="auth-input" type="password" show-password placeholder="管理员密码" @keyup.enter="handleLogin">
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </div>

        <div class="demo-tip">
          <span>演示账号：admin</span>
          <span>演示密码：Parrot123</span>
        </div>

        <el-button type="primary" class="auth-submit" @click="handleLogin">登录管理端</el-button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { User, Lock } from "@element-plus/icons-vue";
import { loginAdmin } from "../../utils/admin-session";

const route = useRoute();
const router = useRouter();
const user = ref("");
const pwd = ref("");

const handleLogin = () => {
  if (!user.value || !pwd.value) {
    ElMessage.warning({
      message: "请输入管理员账号和密码",
      grouping: true,
    });
    return;
  }

  if (!loginAdmin(user.value, pwd.value)) {
    ElMessage.warning({
      message: "管理员账号或密码错误",
      grouping: true,
    });
    return;
  }

  ElMessage.success({
    message: "管理端登录成功",
    grouping: true,
  });
  const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/admin/dashboard";
  router.push(redirect);
};
</script>

<style scoped>
.demo-tip {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.94);
  color: #64748b;
  font-size: 13px;
  flex-wrap: wrap;
}
</style>
