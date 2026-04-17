<template>
  <div class="user-info-container">
    <div class="info-card">
      <h3 class="card-title">完善账户信息</h3>

      <div class="profile-content">
        <div class="avatar-section">
          <label class="avatar-wrapper">
            <input class="hidden-input" type="file" accept="image/*" @change="onAvatarChange" />
            <el-avatar :size="80" :src="previewAvatar || authStore.user?.avatarUrl || undefined" class="default-avatar">
              {{ (profileForm.username || authStore.user?.username || "P").slice(0, 1) }}
            </el-avatar>
            <div class="upload-icon-overlay">
              <el-icon><Upload /></el-icon>
            </div>
          </label>
          <div class="avatar-label">头像</div>
        </div>

        <el-form :model="profileForm" class="profile-form" label-position="left" label-width="70px">
          <el-row :gutter="60">
            <el-col :span="12">
              <el-form-item label="用户名:">
                <el-input v-model="profileForm.username" class="custom-gray-input" placeholder="请输入用户名" />
              </el-form-item>
              <el-form-item label="手机号:">
                <el-input v-model="profileForm.phone" class="custom-gray-input" placeholder="请输入手机号" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="年龄:">
                <el-input v-model="profileForm.age" class="custom-gray-input" placeholder="请输入年龄" />
              </el-form-item>
              <el-form-item label="性别:">
                <el-select v-model="profileForm.gender" class="custom-gray-input">
                  <el-option label="男" value="男" />
                  <el-option label="女" value="女" />
                  <el-option label="未设置" value="未设置" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <div class="profile-actions">
            <el-button type="primary" class="save-btn ps-btn ps-btn--primary ps-btn--sm" @click="saveProfile">保存</el-button>
            <el-button class="cancel-btn ps-btn ps-btn--secondary ps-btn--sm" @click="resetProfile">取消</el-button>
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
              <el-form-item label="新密码">
                <el-input v-model="securityForm.password" type="password" show-password class="custom-gray-input" placeholder="请输入密码" />
              </el-form-item>
              <el-form-item label="确认新密码">
                <el-input v-model="securityForm.confirmPassword" type="password" show-password class="custom-gray-input" placeholder="请再次输入密码" />
              </el-form-item>

              <div class="password-actions">
                <el-button type="primary" class="confirm-btn ps-btn ps-btn--primary" @click="savePassword">确认修改密码</el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { Upload } from "@element-plus/icons-vue";
import { updatePassword, updateProfile } from "../../api/users";
import { useAuthStore } from "../../stores/auth";

const authStore = useAuthStore();
const previewAvatar = ref("");
const avatarFile = ref<File | null>(null);
const profileForm = reactive({
  username: "",
  phone: "",
  age: "",
  gender: "未设置",
});

const securityForm = reactive({
  q1: "",
  q2: "",
  q3: "",
  password: "",
  confirmPassword: "",
});

const syncProfile = () => {
  profileForm.username = authStore.user?.username || "";
  profileForm.phone = authStore.user?.phone || "";
  profileForm.age = authStore.user?.age || "";
  profileForm.gender = authStore.user?.gender || "未设置";
  securityForm.q1 = authStore.user?.securityAnswers?.q1 || "";
  securityForm.q2 = authStore.user?.securityAnswers?.q2 || "";
  securityForm.q3 = authStore.user?.securityAnswers?.q3 || "";
};

const onAvatarChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  avatarFile.value = file;
  previewAvatar.value = URL.createObjectURL(file);
};

const saveProfile = async () => {
  const formData = new FormData();
  formData.append("username", profileForm.username);
  formData.append("phone", profileForm.phone);
  formData.append("age", profileForm.age);
  formData.append("gender", profileForm.gender);
  if (avatarFile.value) formData.append("avatar", avatarFile.value);
  await updateProfile(formData);
  await authStore.refreshProfile();
  syncProfile();
  ElMessage.success("资料已更新");
};

const resetProfile = () => {
  previewAvatar.value = "";
  avatarFile.value = null;
  syncProfile();
};

const savePassword = async () => {
  await updatePassword(securityForm);
  securityForm.password = "";
  securityForm.confirmPassword = "";
  ElMessage.success("密码修改成功");
};

onMounted(async () => {
  await authStore.refreshProfile();
  syncProfile();
});
</script>

<style scoped>
.user-info-container { padding: 30px; background-color: #fff; min-height: 100%; }
.mt-20 { margin-top: 20px; }
.info-card { background: #fff; border-radius: 12px; padding: 10px; }
.card-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 25px; padding-bottom: 10px; }
.profile-content { display: flex; gap: 40px; align-items: flex-start; padding: 0 10px; }
.avatar-section { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.avatar-wrapper { position: relative; width: 80px; height: 80px; border-radius: 50%; overflow: hidden; cursor: pointer; background-color: #f0f0f0; }
.hidden-input { display: none; }
.upload-icon-overlay { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.3); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 24px; }
.avatar-label { font-size: 14px; color: #333; font-weight: bold; }
.profile-form { flex: 1; }
:deep(.el-form-item__label) { color: #333; font-weight: 500; line-height: 40px; }
.profile-actions { display: flex; gap: 20px; margin-top: 10px; }
.save-btn, .cancel-btn { min-width: 108px; }
.security-section { padding: 0 10px; }
.sec-subtitle { font-size: 14px; color: #333; margin-bottom: 20px; font-weight: 500; }
.password-actions { margin-top: 30px; }
.confirm-btn { width: 100%; font-size: 15px; }
:deep(.custom-gray-input .el-input__wrapper), :deep(.custom-gray-input .el-select__wrapper) { background-color: #e4e4e4; box-shadow: none !important; border-radius: 6px; padding: 0 15px; min-height: 40px; }
</style>
