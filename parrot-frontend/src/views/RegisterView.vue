<template>
    <div class="login-container">
        <img class="login-signup-bg-img" src="../assets/images/login-signup-bg.png" alt="Parrot-Login-Bg" />
        <div class="gradient-layer"></div>
       
        <div class="login-box">
            <h1 class="login-title-text">开始注册<br>Parrot Sound</h1>
            <el-form ref="formRef"
            :model="registerForm"
            :rules="{}"
            label-width="80px" 
            label-position="left"
            class="custom-form"
            size="large"
            >
            
                <el-form-item label="邮箱" prop="email">
                    <el-input placeholder="请输入邮箱" class="custom-input" type="email" v-model="registerForm.email"/>
                </el-form-item>

                <el-form-item label="用户名" prop="username">
                    <el-input placeholder="请输入用户名" class="custom-input" type="text" v-model="registerForm.username"/>
                </el-form-item>

                <el-form-item label="密码" prop="password">
                    <el-input placeholder="请输入密码(6-20个数字或字母)" show-password class="custom-input" type="password" v-model="registerForm.password"/>
                </el-form-item>

                <el-form-item label="确认密码" prop="confirmPassword">
                    <el-input placeholder="请确认密码" show-password class="custom-input" type="password" v-model="registerForm.confirmPassword"/>
                </el-form-item>
                
                <el-form-item label="验证码" prop="code">
                    <div class="verify-box">
                    <el-input placeholder="请输入验证码" class="custom-input code-input" type="text" v-model="registerForm.code" />
                    <el-button type="primary" class="verify-btn" :disabled="isCounting" @click="hanadleSendCode"
                    >
                    {{ isCounting ? `${count}秒后重新获取` : '发送验证码' }}
            </el-button>
                    </div>
                </el-form-item>
                <el-button 
                      type="primary" 
                      class="login-btn" 
                      :loading="loading"
                      @click="hanadleRegiter"
                >
                   注 册
                </el-button>
                <div class="register-box">
                    <span>已有账号？</span>
                    <el-link type="primary" :underline="false" @click="$router.push('/login')">去登录</el-link>
                </div>
            </el-form>
        </div>

    </div>
    </template>

<script setup lang="ts">
//import { ref, reactive } from 'vue'
    // 删除未使用的 useRouter 导入
//import { ElMessage } from 'element-plus' // 1. 引入消息提示组件
import { useRegisterLogic } from '../composables/useRegisterLogic'
//旧版本的导入方式
//import loading from 'element-plus/lib/components/loading/index.js';
//import { ElLoading } from "element-plus";
import "element-plus/es/components/loading/style/css";


//解构出我们需要的所有东西
const { 
  registerForm, 
  isCounting, 
  count, 
  loading,
  hanadleSendCode, 
  hanadleRegiter 
} = useRegisterLogic()

</script>

<style scoped>
/* 首页的大背景 */
.bg-all{ 
    position: fixed;
    inset: 0;              /* 等价于 top:0 right:0 bottom:0 left:0 */
    width: 100vw;
    height: 100vh;
    background: linear-gradient(
        90deg,
        rgba(173, 178, 219, 0.81) 0%,
        rgba(227, 229, 250, 1) 100%
  );
    filter: blur(6px);
    z-index: -1;           /* ✅ 背景永远在最底层 */
}

.login-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center; /* 垂直居中 */
  position: relative;
  overflow: hidden; /* 防止甚至出滚动条 */
}

/* 1. 背景图：层级 0 */
.login-signup-bg-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0; 
}

/* 2. 渐变遮罩层：层级 1 */
.gradient-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 60%; /* 遮住左边 60% 的区域 */
  height: 100%;
  z-index: 1;
  /* 核心代码：从左边的淡紫色 (rgba 173...) 渐变到右边的完全透明 (rgba ... 0) */
  background: linear-gradient(
    to right,
    rgba(227, 229, 250, 1) 20%,   /* 左边 20% 是纯色 */
    rgba(227, 229, 250, 0.8) 50%, /* 中间稍微透一点 */
    rgba(227, 229, 250, 0) 100%   /* 最右边完全透明，露出麦克风 */
  );
  /* 如果你想让边缘更柔和，可以加一点 backdrop-filter（可选） */
  /* backdrop-filter: blur(2px); */
}

/* 3. 登录框：层级 2 */
.login-box {
  display: flex;
  flex-direction: column; /* 内容竖着排布 */
  padding: 40px;
  position: relative; /* 相对定位，为了让 z-index 生效 */
  width: 700px;
  height: 700px;
  /* 登录框本身可以是白色的，或者是半透明玻璃效果 */
  background-color: rgba(255, 255, 255, 0.6); 
  backdrop-filter: blur(10px); /* 毛玻璃效果 */
  border-radius: 16px; /* 圆角 */
  z-index: 2; /* 必须比遮罩层高 */
  margin-left: 10%; /* 距离左边的距离 */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); /* 加点阴影更立体 */
}

.login-title-text{
    font-size: 32px;
    color: #333;
    text-align: center;
    margin-bottom: 40px;

}
/* 1. 给输入框整容 */
/* 使用 :deep 穿透修改 Element Plus 内部样式 */
:deep(.custom-input .el-input__wrapper) {
  background-color: #e6e8eb; /* 设计图里的浅灰色背景 */
  box-shadow: none;          /* 去掉默认的灰色边框线 */
  padding: 10px 15px;        /* 把输入框撑大一点，舒服 */
  border-radius: 8px;        /* 圆角 */
}

/* 2. 让“用户名/密码”这两个字变粗 */
:deep(.el-form-item__label) {
  font-weight: bold;
  color: #333;
  margin-bottom: 5px; /* 让标签和输入框之间有点空隙 */
}

/* 3. 登录按钮：变宽、变高、变色 */
.login-btn {
  width: 100%;       /* 占满一行 */
  height: 48px;      /* 增高 */
  font-size: 16px;
  background-color: #5362bc; /* 你的主题紫色 */
  border: none;      /* 去掉边框 */
  border-radius: 8px;
  margin-top: 20px;  /* 距离上面远一点 */
}
.login-btn:hover {
  background-color: #6575d6; /* 鼠标悬停变亮一点 */
}

/* 4. 调整“忘记密码”的位置 */
.forgot-pwd-box {
  text-align: right; /* 靠右对齐 */
  margin-bottom: 10px;
}

/* 5. 调整底部“没有账号”的位置 */
.register-box {
  margin-top: 15px;
  font-size: 14px;
  color: #666;
}
/* 让验证码输入框和按钮横向排列 */
.verify-box {
  display: flex;
  width: 100%;
  gap: 10px; /* 按钮和输入框中间留点缝隙 */
}

/* 输入框占满剩余空间 */
.code-input {
  flex: 1;
}

/* 按钮的样式 */
.verify-btn {
  width: 120px; /* 固定按钮宽度，防止倒计时数字变化导致按钮忽大忽小 */
  background-color: #5362bc;
  border-color: #5362bc;
  color: #fff;
  border-radius: 8px;
}
/* 按钮被禁用时的样式（倒计时中） */
.verify-btn:disabled {
  background-color: #a0cfff;
  border-color: #a0cfff;
}
</style>
