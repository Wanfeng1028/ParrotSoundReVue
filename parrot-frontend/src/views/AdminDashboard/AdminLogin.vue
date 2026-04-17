<template>
  <div class="admin-login-bg">
    <div class="login-box">
      <h2 class="title">Parrot Sound管理平台</h2>
      
      <div class="form-group">
        <label>账号</label>
        <el-input class="admin-input" placeholder="请输入账号" v-model="user" />
      </div>
      
      <div class="form-group">
        <label>密码</label>
        <el-input class="admin-input" type="password" placeholder="请输入密码" v-model="pwd" />
      </div>
      
      <el-button type="primary" class="login-btn">登 录</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 1. 定义响应式变量，让模板里的 v-model 能找到它们
const user = ref('')
const pwd = ref('')

</script>
<style scoped>
.admin-login-bg { 
  width: 100vw; height: 100vh; background: #e3e6f0; 
  display: flex; align-items: center; justify-content: center; 
}
.login-box { 
  width: 480px; background: #fff; padding: 50px; border-radius: 10px; 
  display: flex; flex-direction: column;
}
.title { text-align: center; color: #333; font-weight: bold; margin-bottom: 40px; font-size: 26px; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; margin-bottom: 8px; font-weight: bold; color: #333; }
:deep(.admin-input .el-input__wrapper) {
  background: #e8e8e8; border-radius: 6px; box-shadow: none; height: 44px;
}
.login-btn { 
  height: 48px; font-size: 16px; background: #4e5ecd; border-color: #4e5ecd; width: 100%; margin-top: 20px;
}
</style>