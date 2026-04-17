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

        <el-button type="primary" class="auth-submit" @click="handleLogin">登录管理端</el-button>
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
    ElMessage.warning({
      message: "请输入管理员账号和密码",
      grouping: true,
    });
    return;
  }
  ElMessage.success({
    message: "管理端登录入口已就绪，后续可接真实接口",
    grouping: true,
  });
};
</script>
