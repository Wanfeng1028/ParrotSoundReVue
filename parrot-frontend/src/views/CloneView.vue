<template>
  <div class="clone-container">
    <div class="left-panel">
      <div class="content-card">
        <h3 class="card-title">模型详情</h3>

        <div class="model-form-layout">
          <div class="upload-box">
            <div class="upload-inner">
              <el-icon class="upload-icon"><Picture /></el-icon>
              <span class="upload-text">添加图片</span>
            </div>
          </div>

          <div class="form-right">
            <div class="form-row">
              <el-input
                v-model="formData.name"
                placeholder="输入模型名称"
                class="custom-gray-input flex-input"
              />
              <div class="custom-switch">
                <div
                  class="switch-item"
                  :class="{ active: formData.isPublic }"
                  @click="formData.isPublic = true"
                >
                  公开
                </div>
                <div
                  class="switch-item"
                  :class="{ active: !formData.isPublic }"
                  @click="formData.isPublic = false"
                >
                  私有
                </div>
              </div>
            </div>
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="4"
              placeholder="描述（选填）"
              class="custom-gray-input mt-15"
              resize="none"
            />
          </div>
        </div>
      </div>

      <div class="content-card mt-20 flex-grow">
        <h3 class="card-title">上传音频</h3>

        <div v-if="uploadMode === 'select'" class="mode-wrapper">
          <div class="selection-area">
            <div class="big-action-card">
              <el-icon class="action-icon cloud-icon"><UploadFilled /></el-icon>
              <div class="action-title">上传音频文件</div>
              <div class="action-desc">最佳时长：30秒。最大大小：50MB</div>
            </div>

            <div class="big-action-card" @click="enterRecordMode">
              <div class="wave-visual">
                <span class="bar short"></span><span class="bar long"></span
                ><span class="bar medium"></span><span class="bar long"></span
                ><span class="bar short"></span>
              </div>
              <div class="action-title">录音</div>
              <div class="action-desc">录制音频样本以进行语音克隆</div>
            </div>
          </div>

          <div class="footer-area">
            <p class="sub-tip">
              *提示：音频时长最佳为30秒，最短为10秒，最长为45秒
            </p>
            <el-button class="submit-gradient-btn">提 交</el-button>
          </div>
        </div>

        <div v-else class="mode-wrapper recording-area">
          <div class="back-link" @click="uploadMode = 'select'">
            <el-icon><Back /></el-icon> 返回
          </div>

          <div class="timer-text">{{ timerStr }}</div>

          <el-button
            v-if="!isFinished"
            type="primary"
            class="purple-btn stop-btn"
            @click="stopRecording"
          >
            {{ isRecording ? "停止录制" : "开始录制" }}
          </el-button>

          <div class="tips-box">
            <p class="main-tip">
              注意：录制正在进行中，请不要刷新或关闭浏览器。
            </p>
            <p class="sub-tip">
              *提示：音频时长最佳为30秒，最短为10秒，最长为45秒
            </p>
          </div>

          <div class="footer-area">
            <el-button class="submit-gradient-btn" :disabled="!isFinished"
              >提 交</el-button
            >
          </div>
        </div>
      </div>
    </div>

    <div class="right-panel">
      <h3 class="sidebar-title">我的声音</h3>
      <div class="voice-list-container">
        <div class="voice-card" v-for="item in myVoices" :key="item.id">
          <img :src="item.avatar" class="voice-avatar" />
          <div class="voice-info">
            <div class="v-row-top">
              <span class="v-name">{{ item.name }}</span>
            </div>
            <div class="v-tag">{{ item.tag }}</div>
            <div class="v-date">
              <el-icon><Clock /></el-icon> {{ item.date }}
            </div>
          </div>
          <el-icon class="delete-btn"><Delete /></el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import {
  Picture,
  UploadFilled,
  Back,
  Delete,
  Clock,
} from "@element-plus/icons-vue";

const formData = reactive({ name: "", isPublic: true, description: "" });
const uploadMode = ref<"select" | "record">("select");
const isRecording = ref(true);
const isFinished = ref(false);
const timerStr = ref("00 : 00");

const myVoices = ref([
  {
    id: 1,
    name: "命名",
    tag: "古灵精怪",
    date: "2025/1/22",
    avatar:
      "https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png",
  },
  {
    id: 2,
    name: "命名",
    tag: "",
    date: "2025/1/22",
    avatar:
      "https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png",
  },
  {
    id: 3,
    name: "命名",
    tag: "",
    date: "2025/1/22",
    avatar:
      "https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png",
  },
]);

const enterRecordMode = () => {
  uploadMode.value = "record";
  isRecording.value = true;
  isFinished.value = false;
};
const stopRecording = () => {
  isRecording.value = false;
  isFinished.value = true;
};
</script>

<style scoped>
/* 全局布局 */
.clone-container {
  display: flex;
  min-height: calc(100vh - 60px);
  background-color: #f0f2f5;
  padding: 20px;
  gap: 20px;
}
.left-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.right-panel {
  width: 340px;
  background: #fff;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}
.content-card {
  background: #fff;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}
.mt-20 {
  margin-top: 20px;
}
.flex-grow {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.card-title,
.sidebar-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin-bottom: 25px;
}

/* 模型详情 */
.model-form-layout {
  display: flex;
  gap: 25px;
}
.upload-box {
  width: 130px;
  height: 130px;
  border: 1px dashed #5362bc;
  border-radius: 12px;
  background-color: #f9faff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}
.upload-box:hover {
  background-color: #f0f2ff;
}
.upload-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #5362bc;
}
.upload-icon {
  font-size: 36px;
  margin-bottom: 8px;
}
.upload-text {
  font-size: 14px;
  font-weight: 500;
}
.form-right {
  flex: 1;
}
.form-row {
  display: flex;
  gap: 15px;
  align-items: center;
}
.flex-input {
  flex: 1;
}
.mt-15 {
  margin-top: 15px;
}

/* 输入框 & 开关 */
:deep(.custom-gray-input .el-input__wrapper),
:deep(.custom-gray-input .el-textarea__inner) {
  background-color: #f5f5f5;
  box-shadow: none !important;
  border: none;
  border-radius: 6px;
  padding: 10px 15px;
}
.custom-switch {
  display: flex;
  background: #fff;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
}
.switch-item {
  padding: 6px 20px;
  font-size: 14px;
  color: #666;
  background: #f5f5f5;
  transition: all 0.3s;
}
.switch-item.active {
  background-color: #312eff;
  color: #fff;
  font-weight: 500;
}

/* 上传区域通用 */
.mode-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: center;
}

/* 模式A: 选择卡片 */
.selection-area {
  display: flex;
  gap: 30px;
  justify-content: center;
  margin-top: 20px;
}
.big-action-card {
  width: 320px;
  height: 200px;
  border: 1px dashed #dcdfe6;
  border-radius: 12px;
  background-color: #fafafa;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}
.big-action-card:hover {
  border-color: #5362bc;
  background-color: #f4f6ff;
}
.action-icon {
  font-size: 48px;
  color: #5362bc;
  margin-bottom: 15px;
}
.action-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}
.action-desc {
  font-size: 12px;
  color: #999;
}
.wave-visual {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 48px;
  margin-bottom: 15px;
}
.bar {
  width: 4px;
  background: #5362bc;
  border-radius: 2px;
}
.bar.short {
  height: 20px;
}
.bar.medium {
  height: 32px;
}
.bar.long {
  height: 48px;
}

/* 底部区域 (提示语 + 按钮) */
.footer-area {
  text-align: center;
  margin-top: 40px;
  margin-bottom: 20px;
}
.sub-tip {
  font-size: 12px;
  color: #888;
  margin-bottom: 20px;
}
.submit-gradient-btn {
  width: 240px;
  height: 50px;
  background: linear-gradient(90deg, #6c7293 0%, #3e4466 100%);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.3s;
}
.submit-gradient-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 模式B: 录音 */
.recording-area {
  align-items: center;
  padding-top: 20px;
  position: relative;
}
.back-link {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  color: #333;
  font-weight: bold;
  font-size: 14px;
}
.timer-text {
  font-size: 80px;
  font-weight: 700;
  color: #000;
  margin-top: 30px;
  margin-bottom: 20px;
  font-family: monospace;
  letter-spacing: 2px;
}
.purple-btn {
  background-color: #5362bc;
  border-color: #5362bc;
  padding: 10px 35px;
  border-radius: 8px;
  font-size: 16px;
}
.tips-box {
  text-align: center;
  margin-top: 20px;
}
.main-tip {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
}

/* 右侧列表 */
.voice-list-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.voice-card {
  background-color: #f9fafb;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #f0f0f0;
}
.voice-avatar {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  object-fit: cover;
}
.voice-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.v-name {
  font-size: 15px;
  font-weight: bold;
  color: #333;
}
.v-tag {
  font-size: 12px;
  color: #666;
}
.v-date {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
}
.delete-btn {
  color: #ccc;
  cursor: pointer;
  font-size: 16px;
  align-self: flex-start;
}
.delete-btn:hover {
  color: #ff4d4f;
}
</style>
