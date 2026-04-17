<template>
  <div class="clone-container">
    <div class="left-panel">
      <div class="content-card">
        <h3 class="card-title">模型详情</h3>

        <div class="model-form-layout">
          <div class="upload-box">
            <input class="file-input" type="file" accept="image/*" @change="onCoverChange" />
            <div class="upload-inner">
              <el-icon class="upload-icon"><Picture /></el-icon>
              <span class="upload-text">添加图片</span>
            </div>
          </div>

          <div class="form-right">
            <div class="form-row">
              <el-input v-model="formData.name" placeholder="输入模型名称" class="custom-gray-input flex-input" />
              <div class="custom-switch">
                <div class="switch-item" :class="{ active: formData.isPublic }" @click="setPrivacy(true)">公开</div>
                <div class="switch-item" :class="{ active: !formData.isPublic }" @click="setPrivacy(false)">私有</div>
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
            <div class="form-row mt-15">
              <el-input v-model="formData.tag" placeholder="标签，如：新闻/温柔/播报" class="custom-gray-input flex-input" />
              <el-input v-model="formData.aiPrompt" placeholder="风格提示词" class="custom-gray-input flex-input" />
              <el-button :loading="aiLoading" @click="fillByAi">AI 生成</el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="content-card mt-20 flex-grow">
        <h3 class="card-title">上传音频</h3>

        <div v-if="uploadMode === 'select'" class="mode-wrapper">
          <div class="selection-area">
            <label class="big-action-card">
              <input class="file-input" type="file" accept="audio/*" @change="onSampleChange" />
              <el-icon class="action-icon cloud-icon"><UploadFilled /></el-icon>
              <div class="action-title">上传音频文件</div>
              <div class="action-desc">最佳时长：30秒。最大大小：50MB</div>
            </label>

            <div class="big-action-card" @click="enterRecordMode">
              <div class="wave-visual">
                <span class="bar short"></span><span class="bar long"></span><span class="bar medium"></span><span class="bar long"></span><span class="bar short"></span>
              </div>
              <div class="action-title">录音</div>
              <div class="action-desc">录制音频样本以进行语音克隆</div>
            </div>
          </div>

          <div class="footer-area">
            <div class="sample-status" v-if="sampleName">当前样本：{{ sampleName }}</div>
            <p class="sub-tip">*提示：音频时长最佳为30秒，最短为10秒，最长为45秒</p>
            <div class="footer-actions">
              <el-button plain @click="previewSample">试听样本</el-button>
              <el-button class="submit-gradient-btn" :loading="loading" @click="handleSubmit">提 交</el-button>
            </div>
          </div>
        </div>

        <div v-else class="mode-wrapper recording-area">
          <div class="back-link" @click="goBack"><el-icon><Back /></el-icon> 返回</div>
          <div class="timer-text">{{ recordTimer }}</div>
          <el-button type="primary" class="purple-btn stop-btn" @click="stopTimer">
            {{ isRecording ? "停止录制" : "已停止" }}
          </el-button>
          <div class="tips-box">
            <p class="main-tip">录音完成后会自动生成可提交的音频样本。</p>
            <p class="sub-tip">*提示：停止录制后可直接试听并提交，不必再额外上传文件。</p>
          </div>
          <div class="footer-area">
            <div class="sample-status" v-if="sampleName">录音样本：{{ sampleName }}</div>
            <div class="footer-actions">
              <el-button plain @click="previewSample">试听样本</el-button>
              <el-button class="submit-gradient-btn" @click="goBack">返回编辑</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="right-panel">
      <h3 class="sidebar-title">我的声音</h3>
      <div class="voice-list-container" v-loading="loading">
        <div class="voice-card" v-for="item in myVoices" :key="item.id">
          <img :src="item.coverUrl || fallbackAvatar" class="voice-avatar" />
          <div class="voice-info">
            <div class="v-row-top">
              <span class="v-name">{{ item.name }}</span>
            </div>
            <div class="v-tag">{{ item.tag }}</div>
            <div class="v-date">
              <el-tag size="small" :type="item.visibility === 'public' ? 'success' : 'info'">
                {{ item.visibility === "public" ? "公开" : "私有" }}
              </el-tag>
              {{ formatDate(item.createdAt) }}
            </div>
          </div>
          <div class="voice-actions">
            <el-button text size="small" @click="toggleVisibility(item)">切换</el-button>
            <el-icon class="delete-btn" @click="handleDelete(item.id)"><Delete /></el-icon>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { Picture, UploadFilled, Back, Delete } from "@element-plus/icons-vue";
import fallbackAvatar from "../assets/images/voice-avatar.png";
import { useVoiceCloneLogic } from "../composables/useVoiceCloneLogic";

const {
  loading,
  aiLoading,
  formData,
  uploadMode,
  recordTimer,
  isRecording,
  sampleName,
  myVoices,
  setPrivacy,
  setCoverFile,
  setSampleFile,
  enterRecordMode,
  goBack,
  stopTimer,
  previewSample,
  handleSubmit,
  handleDelete,
  toggleVisibility,
  fillByAi,
  loadVoices,
} = useVoiceCloneLogic();

const onCoverChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0] || null;
  setCoverFile(file);
};

const onSampleChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0] || null;
  setSampleFile(file);
};

const formatDate = (date: string) => new Date(date).toLocaleDateString();

onMounted(() => {
  loadVoices();
});
</script>

<style scoped>
.clone-container { display: flex; min-height: calc(100vh - 60px); background-color: #f0f2f5; padding: 20px; gap: 20px; }
.left-panel { flex: 1; display: flex; flex-direction: column; }
.right-panel { width: 340px; background: #fff; border-radius: 16px; padding: 25px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03); }
.content-card { background: #fff; border-radius: 16px; padding: 30px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03); }
.mt-20 { margin-top: 20px; }
.flex-grow { flex: 1; display: flex; flex-direction: column; }
.card-title, .sidebar-title { font-size: 18px; font-weight: 700; color: #333; margin-bottom: 25px; }
.model-form-layout { display: flex; gap: 25px; }
.upload-box { width: 130px; height: 130px; border: 1px dashed #5362bc; border-radius: 12px; background-color: #f9faff; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden; }
.upload-box:hover { background-color: #f0f2ff; }
.upload-inner { display: flex; flex-direction: column; align-items: center; color: #5362bc; }
.upload-icon { font-size: 36px; margin-bottom: 8px; }
.upload-text { font-size: 14px; font-weight: 500; }
.file-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.form-right { flex: 1; }
.form-row { display: flex; gap: 15px; align-items: center; }
.flex-input { flex: 1; }
.mt-15 { margin-top: 15px; }
:deep(.custom-gray-input .el-input__wrapper), :deep(.custom-gray-input .el-textarea__inner) { background-color: #f5f5f5; box-shadow: none !important; border: none; border-radius: 6px; padding: 10px 15px; }
.custom-switch { display: flex; background: #fff; border-radius: 4px; overflow: hidden; cursor: pointer; }
.switch-item { padding: 6px 20px; font-size: 14px; color: #666; background: #f5f5f5; transition: all 0.3s; }
.switch-item.active { background-color: #312eff; color: #fff; font-weight: 500; }
.mode-wrapper { display: flex; flex-direction: column; flex: 1; justify-content: center; }
.selection-area { display: flex; gap: 30px; justify-content: center; margin-top: 20px; }
.big-action-card { width: 320px; height: 200px; border: 1px dashed #dcdfe6; border-radius: 12px; background-color: #fafafa; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden; }
.big-action-card:hover { border-color: #5362bc; background-color: #f4f6ff; }
.action-icon { font-size: 48px; color: #5362bc; margin-bottom: 15px; }
.action-title { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 10px; }
.action-desc { font-size: 12px; color: #999; }
.wave-visual { display: flex; align-items: center; gap: 4px; height: 48px; margin-bottom: 15px; }
.bar { width: 4px; background: #5362bc; border-radius: 2px; }
.bar.short { height: 20px; }
.bar.medium { height: 32px; }
.bar.long { height: 48px; }
.footer-area { text-align: center; margin-top: 40px; margin-bottom: 20px; }
.footer-actions { display: flex; gap: 12px; justify-content: center; align-items: center; }
.sub-tip { font-size: 12px; color: #888; margin-bottom: 20px; }
.sample-status { font-size: 13px; color: #5362bc; margin-bottom: 12px; font-weight: 600; }
.submit-gradient-btn { width: 240px; height: 50px; background: linear-gradient(90deg, #6c7293 0%, #3e4466 100%); border: none; border-radius: 8px; color: #fff; font-size: 18px; font-weight: bold; }
.recording-area { align-items: center; padding-top: 20px; position: relative; }
.back-link { position: absolute; left: 0; top: 0; display: flex; align-items: center; gap: 5px; cursor: pointer; color: #333; font-weight: bold; font-size: 14px; }
.timer-text { font-size: 80px; font-weight: 700; color: #000; margin-top: 30px; margin-bottom: 20px; font-family: monospace; letter-spacing: 2px; }
.purple-btn { background-color: #5362bc; border-color: #5362bc; padding: 10px 35px; border-radius: 8px; font-size: 16px; }
.tips-box { text-align: center; margin-top: 20px; }
.main-tip { font-size: 14px; color: #333; margin-bottom: 8px; }
.voice-list-container { display: flex; flex-direction: column; gap: 15px; }
.voice-card { background-color: #f9fafb; border-radius: 10px; padding: 12px; display: flex; align-items: center; gap: 12px; border: 1px solid #f0f0f0; }
.voice-avatar { width: 50px; height: 50px; border-radius: 8px; object-fit: cover; }
.voice-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.v-name { font-size: 15px; font-weight: bold; color: #333; }
.v-tag { font-size: 12px; color: #666; }
.v-date { font-size: 12px; color: #999; display: flex; align-items: center; gap: 4px; margin-top: 2px; }
.voice-actions { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.delete-btn { color: #ccc; cursor: pointer; font-size: 16px; }
.delete-btn:hover { color: #ff4d4f; }
</style>
