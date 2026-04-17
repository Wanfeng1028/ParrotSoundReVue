<template>
  <div class="page-container">
    <div class="custom-card">
      <h3 class="card-title">完善账户信息</h3>
      <div class="info-content">
        <div class="avatar-section">
          <div class="avatar-wrapper">
             <el-avatar :size="80" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
             <div class="upload-mask"><el-icon><Upload /></el-icon></div>
          </div>
        </div>
        
        <el-form label-position="left" label-width="70px" class="info-form">
           <el-row :gutter="40">
             <el-col :span="12">
               <el-form-item label="用户名"><el-input v-model="form.username" class="gray-input" /></el-form-item>
               <el-form-item label="手机号"><el-input v-model="form.phone" class="gray-input" /></el-form-item>
             </el-col>
             <el-col :span="12">
               <el-form-item label="年龄"><el-input v-model="form.age" class="gray-input" /></el-form-item>
               <el-form-item label="性别" class="gender-item">
                  <span class="gender-text">男</span>
               </el-form-item>
             </el-col>
           </el-row>
           <div class="form-actions">
             <el-button type="primary" class="purple-btn ps-btn ps-btn--primary ps-btn--sm">保存</el-button>
             <el-button class="gray-btn ps-btn ps-btn--secondary ps-btn--sm">取消</el-button>
           </div>
        </el-form>
      </div>
    </div>

    <div class="custom-card mt-20">
      <h3 class="card-title">修改密码</h3>
      <p class="sub-tip">请回答密保问题</p>
      <el-form label-position="top" class="pwd-form">
        <el-row :gutter="40">
          <el-col :span="12">
            <el-form-item label="密保问题1：您的生日是？">
              <el-input v-model="pwd.q1" placeholder="请输入答案" class="gray-input" />
            </el-form-item>
            <el-form-item label="密保问题2：您母亲的名字是？">
              <el-input v-model="pwd.q2" placeholder="请输入答案" class="gray-input" />
            </el-form-item>
            <el-form-item label="密保问题3：您就读的小学是？">
              <el-input v-model="pwd.q3" placeholder="请输入答案" class="gray-input" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="密码">
              <el-input v-model="pwd.old" placeholder="请输入密码 (6-20个数字或字母)" class="gray-input" show-password/>
            </el-form-item>
            <el-form-item label="确认新密码">
              <el-input v-model="pwd.new" placeholder="请输入密码 (6-20个数字或字母)" class="gray-input" show-password/>
            </el-form-item>
            <el-button type="primary" class="purple-btn full-btn ps-btn ps-btn--primary">确认修改密码</el-button>
          </el-col>
        </el-row>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { Upload } from '@element-plus/icons-vue'
const form = reactive({ username: 'xxxxxxx', phone: 'xxxxxxx', age: 'xxxxxxx' })
const pwd = reactive({ q1: '', q2: '', q3: '', old: '', new: '' })
</script>

<style scoped>
.page-container { padding: 20px; background: #f5f7fa; min-height: 100vh; }
.custom-card { background: #fff; padding: 30px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.03); }
.mt-20 { margin-top: 20px; }
.card-title { font-size: 18px; font-weight: bold; margin-bottom: 25px; color: #333; }
.sub-tip { font-size: 14px; color: #666; margin-bottom: 15px; }

/* 布局 */
.info-content { display: flex; gap: 40px; }
.avatar-section { width: 100px; }
.avatar-wrapper { position: relative; width: 80px; height: 80px; cursor: pointer; }
.upload-mask { 
  position: absolute; inset: 0; background: rgba(0,0,0,0.3); border-radius: 50%; 
  display: flex; align-items: center; justify-content: center; color: #fff; font-size: 20px;
}
.info-form { flex: 1; }

/* === 核心：高度还原输入框样式 (灰底无边框) === */
:deep(.gray-input .el-input__wrapper) {
  background-color: #eef0f5; /* 设计图的浅灰色 */
  box-shadow: none !important; /* 去掉边框 */
  border-radius: 6px;
  height: 40px;
}
:deep(.el-form-item__label) { color: #333; font-weight: 500; }

/* 按钮样式 */
.purple-btn,
.gray-btn { min-width: 108px; }
.full-btn { width: 100%; margin-top: 10px; }
</style>
