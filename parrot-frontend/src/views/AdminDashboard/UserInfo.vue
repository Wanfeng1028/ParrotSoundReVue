<template>
  <div class="page-container">
    <div class="custom-card">
      <h3 class="card-title">完善账户信息</h3>
      <div class="info-content">
        <div class="avatar-section">
          <label class="avatar-wrapper">
            <input class="hidden-input" type="file" accept="image/*" @change="onAvatarChange" />
            <el-avatar :size="80" :src="form.avatarUrl || undefined">
              {{ (form.username || "A").slice(0, 1) }}
            </el-avatar>
            <div class="upload-mask"><el-icon><Upload /></el-icon></div>
          </label>
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
                <el-select v-model="form.gender" class="gray-input">
                  <el-option label="男" value="男" />
                  <el-option label="女" value="女" />
                  <el-option label="未设置" value="未设置" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <div class="form-actions">
            <el-button type="primary" class="purple-btn ps-btn ps-btn--primary ps-btn--sm" @click="saveProfile">保存</el-button>
            <el-button class="gray-btn ps-btn ps-btn--secondary ps-btn--sm" @click="resetProfile">取消</el-button>
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
            <el-form-item label="当前密码">
              <el-input v-model="pwd.old" placeholder="请输入当前密码" class="gray-input" show-password />
            </el-form-item>
            <el-form-item label="新密码">
              <el-input v-model="pwd.new" placeholder="请输入新密码 (6-20个数字或字母)" class="gray-input" show-password />
            </el-form-item>
            <el-button type="primary" class="purple-btn full-btn ps-btn ps-btn--primary" @click="savePassword">确认修改密码</el-button>
          </el-col>
        </el-row>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { ElMessage } from "element-plus";
import { Upload } from "@element-plus/icons-vue";
import { getAdminProfile, saveAdminProfile, updateAdminPassword } from "../../utils/admin-session";

const createProfileForm = () => ({ ...getAdminProfile() });
const form = reactive(createProfileForm());
const pwd = reactive({ q1: "", q2: "", q3: "", old: "", new: "" });

const syncForm = () => {
  Object.assign(form, createProfileForm());
};

const onAvatarChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    form.avatarUrl = typeof reader.result === "string" ? reader.result : "";
  };
  reader.readAsDataURL(file);
};

const saveProfile = () => {
  if (!form.username.trim() || !form.phone.trim() || !form.age.trim()) {
    ElMessage.warning("请补全账号资料后再保存");
    return;
  }

  saveAdminProfile({
    username: form.username.trim(),
    phone: form.phone.trim(),
    age: form.age.trim(),
    gender: form.gender || "未设置",
    avatarUrl: form.avatarUrl || "",
    securityAnswers: getAdminProfile().securityAnswers,
  });
  syncForm();
  ElMessage.success("管理端资料已保存");
};

const resetProfile = () => {
  syncForm();
  ElMessage.success("已恢复到上次保存的资料");
};

const savePassword = () => {
  if (!pwd.q1.trim() || !pwd.q2.trim() || !pwd.q3.trim() || !pwd.old || !pwd.new) {
    ElMessage.warning("请完整填写密保和密码信息");
    return;
  }

  if (!/^[A-Za-z0-9]{6,20}$/.test(pwd.new)) {
    ElMessage.warning("新密码需为 6-20 位数字或字母");
    return;
  }

  const result = updateAdminPassword(pwd.old, pwd.new, {
    q1: pwd.q1.trim(),
    q2: pwd.q2.trim(),
    q3: pwd.q3.trim(),
  });

  if (!result.ok) {
    ElMessage.warning(result.message);
    return;
  }

  pwd.q1 = "";
  pwd.q2 = "";
  pwd.q3 = "";
  pwd.old = "";
  pwd.new = "";
  ElMessage.success("管理端密码已更新");
};
</script>

<style scoped>
.page-container { padding: 20px; background: transparent; min-height: 100%; }
.custom-card { background: #fff; padding: 30px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.03); }
.mt-20 { margin-top: 20px; }
.card-title { font-size: 18px; font-weight: bold; margin-bottom: 25px; color: #333; }
.sub-tip { font-size: 14px; color: #666; margin-bottom: 15px; }
.info-content { display: flex; gap: 40px; }
.avatar-section { width: 100px; }
.avatar-wrapper { position: relative; width: 80px; height: 80px; cursor: pointer; display: block; }
.hidden-input { display: none; }
.upload-mask {
  position: absolute; inset: 0; background: rgba(0,0,0,0.3); border-radius: 50%;
  display: flex; align-items: center; justify-content: center; color: #fff; font-size: 20px;
}
.info-form { flex: 1; }
:deep(.gray-input .el-input__wrapper),
:deep(.gray-input .el-select__wrapper) {
  background-color: #eef0f5;
  box-shadow: none !important;
  border-radius: 6px;
  min-height: 40px;
}
:deep(.el-form-item__label) { color: #333; font-weight: 500; }
.form-actions { display: flex; gap: 12px; }
.purple-btn,
.gray-btn { min-width: 108px; }
.full-btn { width: 100%; margin-top: 10px; }
</style>
