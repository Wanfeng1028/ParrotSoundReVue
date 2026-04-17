<template>
  <div class="dubbing-container">
    <div class="left-section">
      <div class="ai-bar">
        <el-input
          v-model="aiInput"
          placeholder="描述您的需求，让AI帮您智能生成文案"
          class="ai-input"
        >
          <template #prefix>
            <el-icon><EditPen /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" class="ai-btn" @click="handleAIGenerate"
          >创作文章</el-button
        >
      </div>

      <div class="editor-card">
        <div class="toolbar">
          <div class="tools-list">
            <div class="tool-btn">
              <el-icon class="tool-icon-el"><Sort /></el-icon>
              <span>连读</span>
            </div>
            <div class="tool-btn">
              <el-icon class="tool-icon-el"><Timer /></el-icon>
              <span>设置停顿</span>
            </div>
            <div class="tool-btn">
              <el-icon class="tool-icon-el"><ChatDotRound /></el-icon>
              <span>多音字</span>
            </div>
            <div class="tool-btn">
              <el-icon class="tool-icon-el"><PriceTag /></el-icon>
              <span>数字</span>
            </div>
            <div class="tool-btn">
              <el-icon class="tool-icon-el"><Collection /></el-icon>
              <span>单词词组</span>
            </div>

            <div class="divider"></div>

            <div class="tool-btn">
              <el-icon class="tool-icon-el"><Microphone /></el-icon>
              <span>局部音量</span>
            </div>
            <div class="tool-btn">
              <el-icon class="tool-icon-el"><Headset /></el-icon>
              <span>局部变速</span>
            </div>
          </div>

          <div class="toolbar-right">
            <el-button class="add-music-btn" plain>
              <el-icon><Headset /></el-icon> 添加配乐
            </el-button>
            <div class="current-voice-bubble">
              <el-avatar :size="28" :src="currentVoice.avatar" />
              <span class="name">{{ currentVoice.name }}</span>
            </div>
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
          <div class="word-count">
            预估时长 00:00:00 &nbsp; {{ textContent.length }}/8000
          </div>
        </div>

        <div class="bottom-actions">
          <div class="action-left">
            <div class="icon-action">
              <el-icon><RefreshLeft /></el-icon> 撤回
            </div>
            <div class="icon-action">
              <el-icon><RefreshRight /></el-icon> 重做
            </div>
            <el-divider direction="vertical" />
            <el-button plain size="small">一键清空</el-button>
            <el-button plain size="small">智能分段</el-button>
            <el-button plain size="small">批量替换</el-button>
            <el-button plain size="small">导入文件</el-button>
          </div>
          <div class="action-right">
            <el-button class="white-btn" @click="handlePlay">试听</el-button>
            <el-button class="gradient-btn" @click="handleExport"
              >导出音频</el-button
            >
          </div>
        </div>
      </div>
    </div>

    <div class="right-sidebar">
      <div class="sidebar-header">
        <div class="search-row">
          <el-input
            v-model="searchText"
            placeholder="请输入关键词"
            size="small"
          >
            <template #append><el-button>搜索</el-button></template>
          </el-input>
        </div>
        <div class="tabs-row">
          <span class="tab active">全部</span>
          <span class="tab">收藏</span>
          <span class="tab">热门</span>
          <el-icon class="filter-icon"><Filter /></el-icon>
        </div>
      </div>

      <div class="voice-grid-scroll">
        <div
          v-for="voice in voiceList"
          :key="voice.id"
          class="voice-item"
          :class="{ active: currentVoice.id === voice.id }"
          @click="selectVoice(voice)"
        >
          <el-avatar :size="40" :src="voice.avatar" />
          <div class="voice-info">
            <div class="v-name">{{ voice.name }}</div>
            <div class="v-tag">{{ voice.tag }}</div>
          </div>
          <div class="v-desc">能言善道<br />爱聊不停</div>
        </div>
      </div>

      <div class="sidebar-footer">
        <div class="slider-group">
          <div class="slider-row">
            <span class="label">音量：</span>
            <el-slider
              v-model="settings.volume"
              :max="100"
              size="small"
              class="custom-slider"
            />
            <span class="val">{{ settings.volume }}</span>
          </div>
          <div class="slider-row">
            <span class="label">音调：</span>
            <el-slider
              v-model="settings.pitch"
              :max="100"
              size="small"
              class="custom-slider"
            />
            <span class="val">{{ settings.pitch }}</span>
          </div>
          <div class="slider-row">
            <span class="label">语速：</span>
            <el-slider
              v-model="settings.speed"
              :min="0.5"
              :max="2.0"
              :step="0.1"
              size="small"
              class="custom-slider"
            />
            <span class="val">{{ settings.speed }}x</span>
          </div>
        </div>

        <div class="emotion-section">
          <div class="emotion-title">情感：</div>
          <div class="emotion-grid">
            <div
              v-for="emo in emotionList"
              :key="emo"
              class="emo-tag"
              :class="{ active: currentEmotion === emo }"
              @click="selectEmotion(emo)"
            >
              <el-icon v-if="currentEmotion === emo"><VideoPlay /></el-icon>
              {{ emo }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
// 引入需要的图标
import {
  EditPen,
  Headset,
  RefreshLeft,
  RefreshRight,
  Filter,
  VideoPlay,
  Sort,
  Timer,
  ChatDotRound,
  PriceTag,
  Collection,
  Microphone,
} from "@element-plus/icons-vue";
import { useDubbingLogic } from "../composables/useDubbingLogic";

const searchText = ref("");

const {
  textContent,
  aiInput,
  currentVoice,
  voiceList,
  settings,
  emotionList,
  currentEmotion,
  selectVoice,
  selectEmotion,
  handlePlay,
  handleExport,
  handleAIGenerate,
} = useDubbingLogic();
</script>

<style scoped>
/* 全局布局 */
.dubbing-container {
  display: flex;
  height: calc(100vh - 60px);
  background-color: #f5f6fa;
  padding: 15px;
  gap: 15px;
}

/* === 左侧 === */
.left-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* AI 栏 */
.ai-bar {
  display: flex;
  gap: 10px;
}
:deep(.ai-input .el-input__wrapper) {
  border-radius: 8px;
  box-shadow: none;
  border: 1px solid #ddd;
}
.ai-btn {
  background: #737b96;
  border: none;
  border-radius: 8px;
}

/* 编辑器卡片 */
.editor-card {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

/* 工具栏 */
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
  cursor: pointer;
  font-size: 12px;
  color: #666;
  gap: 4px;
}
.tool-icon-el {
  font-size: 20px; /* 图标大小 */
  color: #555;
}
.divider {
  width: 1px;
  height: 20px;
  background: #ddd;
  margin: 0 10px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 15px;
}
.add-music-btn {
  border-radius: 8px;
  color: #5362bc;
  border-color: #dcdfe6;
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
}

/* 文本区 */
.textarea-container {
  flex: 1;
  position: relative;
  background: #fff;
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

/* 底部操作 */
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
.icon-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 10px;
  color: #999;
  cursor: pointer;
  margin-right: 10px;
}
.white-btn {
  width: 100px;
  border-radius: 8px;
}
.gradient-btn {
  width: 120px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(90deg, #6a709d 0%, #464d7c 100%);
  color: #fff;
}

/* === 右侧侧边栏 === */
.right-sidebar {
  width: 320px;
  background: #fff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.sidebar-header {
  padding: 15px;
  border-bottom: 1px solid #f5f5f5;
}
.search-row {
  margin-bottom: 10px;
}
.tabs-row {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 14px;
  color: #666;
  position: relative;
}
.tab.active {
  background: #5362bc;
  color: #fff;
  padding: 2px 10px;
  border-radius: 4px;
}
.filter-icon {
  margin-left: auto;
  cursor: pointer;
}

/* 列表滚动区 */
.voice-grid-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  background: #f9f9f9;
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

/* 底部控制区 */
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
  width: 30px;
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
