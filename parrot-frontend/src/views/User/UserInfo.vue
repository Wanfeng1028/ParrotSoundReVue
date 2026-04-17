<template>
  <div class="user-info-container">
    
    <div class="info-card">
      <h3 class="card-title">完善账户信息</h3>
      
      <div class="profile-content">
        <div class="avatar-section">
          <el-upload
            class="avatar-uploader"
            action="#"
            :show-file-list="false"
            :auto-upload="false"
          >
            <div class="avatar-wrapper">
              <el-avatar :size="80" src="" class="default-avatar">
                <template #default>
                  <img src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" style="width: 100%; height: 100%; opacity: 0.5;" />
                </template>
              </el-avatar>
              <div class="upload-icon-overlay">
                <el-icon><Upload /></el-icon>
              </div>
            </div>
          </el-upload>
          <div class="avatar-label">头像</div>
        </div>

        <el-form :model="userInfo" class="profile-form" label-position="left" label-width="70px">
          <el-row :gutter="60">
            <el-col :span="12">
              <el-form-item label="用户名:">
                <el-input v-model="userInfo.username" class="custom-gray-input" placeholder="xxxxxx" />
              </el-form-item>
              <el-form-item label="手机号:">
                <el-input v-model="userInfo.phone" class="custom-gray-input" placeholder="xxxxxx" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="年龄:">
                <el-input v-model="userInfo.age" class="custom-gray-input" placeholder="xxxxxx" />
              </el-form-item>
              <el-form-item label="性别:">
                <div class="gender-text">男</div>
              </el-form-item>
            </el-col>
          </el-row>

          <div class="profile-actions">
            <el-button type="primary" class="save-btn">保存</el-button>
            <el-button class="cancel-btn">取消</el-button>
          </div>
        </el-form>
      </div>
    </div>

    <div class="info-card mt-20">
      <h3 class="card-title">修改密码</h3>
      
      <div class="security-section">
        <p class="sec-subtitle">请回答密保问题</p>
        
        <el-form :model="securityForm" label-position="top" class="security-form">
          <el-row :gutter="60">
            <el-col :span="12">
              <el-form-item label="密保问题1：您的生日是？">
                <el-input v-model="securityForm.q1" class="custom-gray-input" placeholder="请输入答案" />
              </el-form-item>
              <el-form-item label="密保问题2：您母亲的名字是？">
                <el-input v-model="securityForm.q2" class="custom-gray-input" placeholder="请输入答案" />
              </el-form-item>
              <el-form-item label="密保问题3：您就读的小学是？">
                <el-input v-model="securityForm.q3" class="custom-gray-input" placeholder="请输入答案" />
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="密码">
                <el-input 
                  v-model="securityForm.password" 
                  type="password" 
                  show-password
                  class="custom-gray-input" 
                  placeholder="请输入密码 (6-20个数字或字母)" 
                />
              </el-form-item>
              <el-form-item label="确认新密码">
                <el-input 
                  v-model="securityForm.confirmPassword" 
                  type="password" 
                  show-password
                  class="custom-gray-input" 
                  placeholder="请输入密码 (6-20个数字或字母)" 
                />
              </el-form-item>
              
              <div class="password-actions">
                <el-button type="primary" class="confirm-btn">确认修改密码</el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { Upload } from '@element-plus/icons-vue'

const userInfo = reactive({
  username: 'xxxxxx',
  phone: 'xxxxxx',
  age: 'xxxxxx',
  gender: '男'
})

const securityForm = reactive({
  q1: '',
  q2: '',
  q3: '',
  password: '',
  confirmPassword: ''
})
</script>

<style scoped>
/* 页面容器 */
.user-info-container {
  padding: 30px;
  background-color: #fff; /* 右侧内容区白色背景，或者透明由父级控制 */
  min-height: 100%;
}

.mt-20 { margin-top: 20px; }

/* 通用卡片样式 */
.info-card {
  background: #fff;
  border-radius: 12px;
  /* 如果你的父布局已经有阴影，这里可以去掉 box-shadow */
  padding: 10px; 
}

.card-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 25px;
  padding-bottom: 10px;
  /* border-bottom: 1px solid #f0f0f0;  根据图示好像没有底线，如果有可以加上 */
}

/* === 顶部：个人信息 === */
.profile-content {
  display: flex;
  gap: 40px;
  align-items: flex-start;
  padding: 0 10px;
}

/* 头像区域 */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.avatar-wrapper {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  background-color: #f0f0f0;
}
/* 那个上传图标的遮罩层 */
.upload-icon-overlay {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  font-size: 24px;
}
.avatar-label {
  font-size: 14px;
  color: #333;
  font-weight: bold;
  margin-right: auto; /* 靠左对齐 */
  margin-left: 5px;
}

/* 表单样式 */
.profile-form {
  flex: 1;
}
/* 调整 Label 样式 */
:deep(.el-form-item__label) {
  color: #333;
  font-weight: 500;
  line-height: 40px; /* 垂直居中 */
}

.gender-text {
  line-height: 40px;
  font-weight: bold;
  color: #333;
}

/* 按钮组 */
.profile-actions {
  display: flex;
  gap: 20px;
  margin-top: 10px;
}
.save-btn {
  background-color: #5362bc; /* 主题紫 */
  border-color: #5362bc;
  padding: 10px 30px;
  font-weight: bold;
  border-radius: 6px;
}
.cancel-btn {
  background-color: #e6e6e6;
  border-color: #e6e6e6;
  color: #666;
  padding: 10px 30px;
  font-weight: bold;
  border-radius: 6px;
}

/* === 底部：修改密码 === */
.security-section {
  padding: 0 10px;
}
.sec-subtitle {
  font-size: 14px;
  color: #333;
  margin-bottom: 20px;
  font-weight: 500;
}

/* 确认修改按钮 */
.password-actions {
  margin-top: 30px;
}
.confirm-btn {
  width: 100%;
  height: 44px;
  background-color: #5362bc;
  border-color: #5362bc;
  font-weight: bold;
  font-size: 15px;
  border-radius: 6px;
}

/* ========================================= */
/* 🔥 核心样式定制：灰底无边框输入框 🔥 */
/* ========================================= */
:deep(.custom-gray-input .el-input__wrapper) {
  background-color: #e4e4e4; /* 图中的浅灰色 */
  box-shadow: none !important; /* 去掉边框 */
  border-radius: 6px;
  padding: 0 15px;
  height: 40px;
}

:deep(.custom-gray-input .el-input__inner) {
  color: #333;
  font-weight: 500;
}

/* focus 时的样式 (可选：轻微加深背景或加边框) */
:deep(.custom-gray-input .el-input__wrapper.is-focus) {
  background-color: #dedede;
  box-shadow: none !important;
}
</style>