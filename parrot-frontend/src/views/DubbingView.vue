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
        <el-button plain class="example-btn ps-btn ps-btn--secondary ps-btn--sm" @click="handleFillExample">
          填入示例
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
          <div class="textarea-tip">
            先填入示例文案或输入自己的稿件，再选择右侧音色进行试听和导出。
          </div>
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
          <div class="v-desc">点击卡片即可选中，试听可直接验证真实样音。</div>
          <button type="button" class="voice-preview-btn ps-btn-native ps-btn-native--secondary ps-btn-native--sm" @click.stop="previewVoiceSample(voice)">
            试听音色
          </button>
        </div>
        <el-empty v-if="!voiceList.length" description="没有匹配的音色" />
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
  handleFillExample,
  handleSmartSegment,
  handleLiaison,
  handleInsertPause,
  handlePolyphoneAssist,
  handleNumberNormalize,
  handlePhraseNormalize,
  previewCurrentVoice,
  previewVoiceSample,
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
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  height: var(--page-shell-min-height);
  background:
    radial-gradient(circle at top left, rgba(117, 190, 255, 0.18), transparent 24%),
    radial-gradient(circle at top right, rgba(191, 219, 254, 0.2), transparent 22%),
    linear-gradient(180deg, #eef6ff 0%, #e7f0ff 100%);
  padding: 16px;
  gap: 15px;
  box-sizing: border-box;
  overflow: hidden;
}

.left-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.ai-bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240px 120px 108px;
  gap: 10px;
}

:deep(.ai-input .el-input__wrapper) {
  border-radius: 8px;
  box-shadow: none;
  border: 1px solid #ddd;
}

.model-select {
  width: 100%;
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
  min-height: 0;
}

.toolbar {
  padding: 10px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.tools-list {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
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
  min-height: 0;
}

.textarea-tip {
  padding: 14px 20px 0;
  font-size: 13px;
  color: #6f7b90;
}

:deep(.main-textarea .el-textarea__inner) {
  min-height: 100%;
  border: none;
  resize: none;
  box-shadow: none;
  padding: 12px 20px 20px;
  font-size: 16px;
  line-height: 1.8;
}

.main-textarea {
  height: calc(100% - 34px);
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
  background: rgba(255, 255, 255, 0.88);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 30px rgba(37, 99, 235, 0.08);
  backdrop-filter: blur(10px);
  min-height: 0;
}

.sidebar-header {
  padding: 15px;
  border-bottom: 1px solid #f5f5f5;
}

.voice-grid-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(239, 246, 255, 0.55);
}

.voice-item {
  background: #fff;
  border-radius: 16px;
  padding: 14px 16px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  align-items: center;
  text-align: left;
  cursor: pointer;
  border: 1px solid rgba(181, 207, 245, 0.72);
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.06);
}

.voice-item.active {
  border-color: #5362bc;
  background: linear-gradient(135deg, rgba(240, 246, 255, 0.98), rgba(255, 255, 255, 0.98));
}

.voice-info {
  min-width: 0;
}

.v-name {
  font-weight: bold;
  font-size: 14px;
}

.v-tag {
  display: inline-flex;
  width: fit-content;
  margin-top: 6px;
  background: #333;
  color: #fff;
  font-size: 10px;
  padding: 3px 6px;
  border-radius: 999px;
}

.v-desc {
  grid-column: 2 / 4;
  font-size: 12px;
  color: #999;
  line-height: 1.4;
}

.voice-preview-btn {
  min-width: 92px;
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

.example-btn {
  min-width: 108px;
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

@media (max-width: 1180px) {
  .dubbing-container {
    grid-template-columns: 1fr;
    height: auto;
    min-height: var(--page-shell-min-height);
    overflow: visible;
  }

  .ai-bar {
    grid-template-columns: minmax(0, 1fr);
  }

  .right-sidebar {
    min-height: 420px;
  }
}
</style>
