<template>
  <div class="dubbing-container">
    <div class="left-section">
      <div class="ai-bar">
        <el-input
          v-model="aiInput"
          placeholder="描述您的需求，让 AI 帮您智能生成文案"
          class="ai-input"
        >
          <template #prefix>
            <el-icon><EditPen /></el-icon>
          </template>
        </el-input>
        <el-select v-model="selectedModel" class="model-select" placeholder="模型">
          <el-option v-for="model in availableModels" :key="model.id" :label="model.label" :value="model.id" />
        </el-select>
        <el-button type="primary" class="ai-btn ps-btn ps-btn--primary ps-btn--sm" :loading="generating" @click="handleAIGenerate">
          创作文章
        </el-button>
      </div>

      <div class="editor-card">
        <div class="toolbar">
          <div class="tools-list">
            <button type="button" class="tool-btn ps-btn-native ps-btn-native--secondary" @click="handleLiaison">
              <el-icon class="tool-icon-el"><Sort /></el-icon>
              <span>连读</span>
            </button>
            <button type="button" class="tool-btn ps-btn-native ps-btn-native--secondary" @click="handleInsertPause">
              <el-icon class="tool-icon-el"><Timer /></el-icon>
              <span>设置停顿</span>
            </button>
            <button type="button" class="tool-btn ps-btn-native ps-btn-native--secondary" @click="handlePolyphoneAssist">
              <el-icon class="tool-icon-el"><ChatDotRound /></el-icon>
              <span>多音字</span>
            </button>
            <button type="button" class="tool-btn ps-btn-native ps-btn-native--secondary" @click="handleNumberNormalize">
              <el-icon class="tool-icon-el"><PriceTag /></el-icon>
              <span>数字</span>
            </button>
            <button type="button" class="tool-btn ps-btn-native ps-btn-native--secondary" @click="handlePhraseNormalize">
              <el-icon class="tool-icon-el"><Collection /></el-icon>
              <span>单词词组</span>
            </button>
          </div>

          <div class="toolbar-right">
            <button type="button" class="current-voice-bubble" v-if="currentVoice" @click="previewCurrentVoice">
              <el-avatar :size="28" :src="currentVoice.avatar || undefined">{{ currentVoice.name.slice(0, 1) }}</el-avatar>
              <span class="name">{{ currentVoice.name }}</span>
            </button>
          </div>
        </div>

        <div class="textarea-container">
          <el-input
            v-model="textContent"
            type="textarea"
            class="main-textarea"
            placeholder="请输入文章内容"
            resize="none"
          />
          <div v-if="!textContent" class="watermark">创作中 · · · · · ·</div>
          <div class="word-count">预估时长 {{ estimatedDuration }} &nbsp; {{ textContent.length }}/8000</div>
        </div>

        <div class="bottom-actions">
          <div class="action-left">
            <el-button plain size="small" class="ps-btn ps-btn--secondary ps-btn--sm" @click="handleClearText">一键清空</el-button>
            <el-button plain size="small" class="ps-btn ps-btn--secondary ps-btn--sm" @click="handleSmartSegment">智能分段</el-button>
            <el-tag type="info" class="emotion-indicator" @click="cycleEmotion">
              当前情感：{{ currentEmotion }}
            </el-tag>
          </div>
          <div class="action-right">
            <el-button class="white-btn ps-btn ps-btn--secondary" @click="handlePlay">试听</el-button>
            <el-button class="gradient-btn ps-btn ps-btn--primary" @click="handleExport">导出音频</el-button>
          </div>
        </div>
      </div>
    </div>

    <div class="right-sidebar">
      <div class="sidebar-header">
        <div class="search-row">
          <el-input v-model="searchText" placeholder="请输入关键词" size="small" />
        </div>
      </div>

      <div class="voice-grid-scroll" v-loading="loading">
        <div
          v-for="voice in voiceList"
          :key="voice.id"
          class="voice-item"
          :class="{ active: currentVoice?.id === voice.id }"
          @click="selectVoice(voice)"
        >
          <el-avatar :size="40" :src="voice.avatar || undefined">{{ voice.name.slice(0, 1) }}</el-avatar>
          <div class="voice-info">
            <div class="v-name">{{ voice.name }}</div>
            <div class="v-tag">{{ voice.tag }}</div>
          </div>
          <div class="v-desc">试听可直接写入音频记录</div>
        </div>
      </div>

      <div class="sidebar-footer">
        <div class="slider-group">
          <div class="slider-row">
            <span class="label">音量：</span>
            <el-slider v-model="settings.volume" :min="0" :max="100" size="small" class="custom-slider" />
            <span class="val">{{ settings.volume }}</span>
          </div>
          <div class="slider-row">
            <span class="label">音调：</span>
            <el-slider v-model="settings.pitch" :min="0" :max="100" size="small" class="custom-slider" />
            <span class="val">{{ settings.pitch }}</span>
          </div>
          <div class="slider-row">
            <span class="label">语速：</span>
            <el-slider v-model="settings.speed" :min="0.5" :max="2" :step="0.1" size="small" class="custom-slider" />
            <span class="val">{{ settings.speed.toFixed(1) }}x</span>
          </div>
        </div>

        <div class="emotion-section">
          <div class="emotion-title">情感：</div>
          <div class="emotion-grid">
            <div
              v-for="emotion in emotionList"
              :key="emotion"
              class="emo-tag"
              :class="{ active: currentEmotion === emotion }"
              @click="selectEmotion(emotion)"
            >
              {{ emotion }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import {
  EditPen,
  Sort,
  Timer,
  ChatDotRound,
  PriceTag,
  Collection,
} from "@element-plus/icons-vue";
import { useDubbingLogic } from "../composables/useDubbingLogic";

const {
  loading,
  generating,
  textContent,
  aiInput,
  searchText,
  currentVoice,
  voiceList,
  settings,
  emotionList,
  currentEmotion,
  availableModels,
  selectedModel,
  loadOptions,
  selectVoice,
  selectEmotion,
  handleClearText,
  handleSmartSegment,
  handleLiaison,
  handleInsertPause,
  handlePolyphoneAssist,
  handleNumberNormalize,
  handlePhraseNormalize,
  previewCurrentVoice,
  cycleEmotion,
  handlePlay,
  handleExport,
  handleAIGenerate,
} = useDubbingLogic();

const estimatedDuration = computed(() => {
  const seconds = Math.max(1, Math.round(textContent.value.length / 4));
  const hour = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const minute = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const second = String(seconds % 60).padStart(2, "0");
  return `${hour}:${minute}:${second}`;
});

onMounted(() => {
  loadOptions();
});
</script>

<style scoped>
.dubbing-container {
  display: flex;
  height: calc(100vh - 60px);
  background:
    radial-gradient(circle at top left, rgba(117, 190, 255, 0.18), transparent 24%),
    radial-gradient(circle at top right, rgba(191, 219, 254, 0.2), transparent 22%),
    linear-gradient(180deg, #eef6ff 0%, #e7f0ff 100%);
  padding: 15px;
  gap: 15px;
}

.left-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ai-bar {
  display: flex;
  gap: 10px;
}

:deep(.ai-input .el-input__wrapper) {
  border-radius: 8px;
  box-shadow: none;
  border: 1px solid #ddd;
}

.model-select {
  width: 340px;
}

.ai-btn {
  min-width: 120px;
}

.editor-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 30px rgba(37, 99, 235, 0.08);
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.toolbar {
  padding: 10px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tools-list {
  display: flex;
  gap: 20px;
  align-items: center;
}

.tool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 88px;
  min-width: 88px;
  height: 64px;
  padding: 8px 10px;
  font-size: 12px;
  color: #666;
  gap: 4px;
}

.tool-btn:hover {
  color: #5362bc;
}

.tool-btn:hover .tool-icon-el {
  color: #5362bc;
}

.tool-icon-el {
  font-size: 20px;
  color: #555;
}

.current-voice-bubble {
  background: #f2f3f5;
  padding: 4px 12px 4px 4px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: bold;
  border: none;
  cursor: pointer;
}

.current-voice-bubble:hover {
  color: #5362bc;
}

.textarea-container {
  flex: 1;
  position: relative;
  background: rgba(255, 255, 255, 0.82);
}

:deep(.main-textarea .el-textarea__inner) {
  height: 100%;
  border: none;
  resize: none;
  box-shadow: none;
  padding: 20px;
  font-size: 16px;
  line-height: 1.8;
}

.watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #ccc;
  font-size: 18px;
  pointer-events: none;
}

.word-count {
  position: absolute;
  bottom: 10px;
  right: 20px;
  font-size: 12px;
  color: #999;
}

.bottom-actions {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-left {
  display: flex;
  gap: 10px;
  align-items: center;
}

.emotion-indicator {
  cursor: pointer;
}

.white-btn {
  width: 100px;
}

.gradient-btn {
  width: 120px;
}

.right-sidebar {
  width: 320px;
  background: rgba(255, 255, 255, 0.88);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 30px rgba(37, 99, 235, 0.08);
  backdrop-filter: blur(10px);
}

.sidebar-header {
  padding: 15px;
  border-bottom: 1px solid #f5f5f5;
}

.voice-grid-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  background: rgba(239, 246, 255, 0.55);
}

.voice-item {
  background: #fff;
  border-radius: 8px;
  padding: 15px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  border: 1px solid transparent;
}

.voice-item.active {
  border-color: #5362bc;
}

.voice-info {
  margin-top: 5px;
}

.v-name {
  font-weight: bold;
  font-size: 14px;
}

.v-tag {
  background: #333;
  color: #fff;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 2px;
  margin-top: 2px;
}

.v-desc {
  font-size: 10px;
  color: #999;
  margin-top: 5px;
  line-height: 1.4;
}

.sidebar-footer {
  padding: 15px;
  background: #fff;
  border-top: 1px solid #f5f5f5;
  border-radius: 0 0 12px 12px;
}

.slider-row {
  display: flex;
  align-items: center;
  font-size: 12px;
  margin-bottom: 8px;
}

.label {
  width: 40px;
  color: #333;
}

.val {
  width: 40px;
  text-align: right;
  color: #666;
}

:deep(.custom-slider .el-slider__bar) {
  background-color: #5362bc;
}

:deep(.custom-slider .el-slider__button) {
  border-color: #5362bc;
}

.emotion-section {
  margin-top: 10px;
}

.emotion-title {
  font-size: 12px;
  margin-bottom: 5px;
  color: #666;
}

.emotion-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.emo-tag {
  border: 1px solid #eee;
  border-radius: 4px;
  font-size: 12px;
  text-align: center;
  padding: 4px 0;
  cursor: pointer;
  color: #666;
}

.emo-tag.active {
  border-color: #5362bc;
  color: #5362bc;
}
</style>
