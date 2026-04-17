<template>
  <div class="edu-container">
    <div class="left-sidebar">
      <div class="mode-switch-btn">AI 课件模式</div>
      <div class="import-btn">导入 PPT</div>
      <div class="slide-list">
        <el-scrollbar>
          <div
            v-for="(_, index) in slides"
            :key="index"
            class="slide-item"
            :class="{ active: index === activeSlideIndex }"
            @click="activeSlideIndex = index"
          >
            <div class="slide-img-placeholder">
              <el-icon :size="30" color="#ccc"><Picture /></el-icon>
            </div>
            <div class="slide-index">{{ index + 1 }}</div>
          </div>
        </el-scrollbar>
      </div>
      <div class="add-slide-box"><el-icon><Plus /></el-icon></div>
      <div class="apply-btn" @click="handleSave()">保存当前</div>
    </div>

    <div class="center-area">
      <div class="top-toolbar">
        <div class="setting-group">
          <span class="label">尺寸</span>
          <el-select v-model="settings.ratio" size="small" class="transparent-select" style="width: 70px">
            <el-option label="16 : 9" value="16:9" />
            <el-option label="9 : 16" value="9:16" />
          </el-select>
        </div>
        <div class="setting-group">
          <span class="label">分辨率</span>
          <el-select v-model="settings.resolution" size="small" class="transparent-select" style="width: 80px">
            <el-option label="1080P" value="1080P" />
            <el-option label="720P" value="720P" />
          </el-select>
        </div>
        <div class="setting-group">
          <span class="label">视频码率</span>
          <el-select v-model="settings.bitrate" size="small" class="transparent-select" style="width: 80px">
            <el-option label="default" value="default" />
            <el-option label="high" value="high" />
          </el-select>
        </div>
        <div class="setting-group">
          <span class="label">模型</span>
          <el-select v-model="selectedModel" size="small" class="transparent-select" style="width: 160px">
            <el-option v-for="model in aiModels" :key="model.id" :label="model.label" :value="model.id" />
          </el-select>
        </div>

        <div class="right-actions">
          <el-button class="tool-btn" plain size="small" @click="handleSave()">保存</el-button>
          <el-button class="tool-btn" plain size="small" @click="generateByAi">AI 帮写</el-button>
          <el-button type="primary" size="small" class="generate-btn" :loading="loading" @click="handleGenerate">
            生成视频任务
          </el-button>
        </div>
      </div>

      <div class="canvas-wrapper">
        <div class="canvas-box">
          <div class="canvas-title">{{ projectTitle }}</div>
          <div class="subtitle-layer" v-if="showSubtitle">{{ textContent || "字幕在此显示" }}</div>
        </div>
      </div>

      <div class="editor-panel" :class="{ 'is-expanded': isTrackExpanded }">
        <div class="track-handle" @click="isTrackExpanded = !isTrackExpanded">
          <span v-if="isTrackExpanded"><el-icon><ArrowDown /></el-icon> 收起轨道</span>
          <span v-else><el-icon><ArrowUp /></el-icon> 展开轨道</span>
        </div>

        <div class="panel-content">
          <div class="text-editor-box" v-show="!isTrackExpanded">
            <div class="te-toolbar">
              <el-input v-model="projectTitle" placeholder="输入项目标题" class="ai-input-line" />
              <el-input v-model="aiPrompt" placeholder="输入本节课的主题、受众和讲解目标" class="ai-input-line" />
              <el-button class="save-play-btn" @click="generateByAi">AI 讲解稿</el-button>
            </div>
            <el-input
              v-model="textContent"
              type="textarea"
              class="main-textarea"
              placeholder="请输入文章内容"
              resize="none"
            />
            <div class="te-footer">
              <div class="clear-btn">字幕 <el-switch v-model="showSubtitle" size="small" /></div>
              <div class="stats">已保存项目 {{ projects.length }} 个</div>
              <el-button class="save-play-btn" @click="handleSave()">保存草稿</el-button>
            </div>
          </div>

          <div class="track-timeline-box" v-show="isTrackExpanded">
            <div class="timeline-ruler">
              <span>00:00</span>
              <span style="left: 200px">00:30</span>
              <span style="left: 400px">01:00</span>
              <div class="play-head-line"></div>
            </div>
            <div class="tracks-container">
              <div class="track-row">
                <div class="track-header"><el-icon><Edit /></el-icon></div>
                <div class="track-body"><div class="clip text-clip" style="left: 0; width: 400px"></div></div>
              </div>
              <div class="track-row">
                <div class="track-header"><el-icon><Microphone /></el-icon></div>
                <div class="track-body"><div class="clip audio-clip" style="left: 0; width: 300px"></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="right-sidebar">
      <div class="resource-panel">
        <div class="search-row">
          <el-input v-model="searchText" placeholder="请输入关键词" size="small" class="custom-search" />
        </div>
        <div class="filter-row">
          <el-select v-model="filter.gender" placeholder="全部性别" size="small" style="width: 48%">
            <el-option label="全部性别" value="all" />
          </el-select>
          <el-select v-model="filter.pose" placeholder="全部姿势" size="small" style="width: 48%">
            <el-option label="全部姿势" value="all" />
          </el-select>
        </div>

        <div class="resource-grid">
          <div class="res-card" v-for="project in projects" :key="project.id">
            <div class="project-name">{{ project.title }}</div>
            <div class="project-meta">{{ project.status }}</div>
          </div>
        </div>
      </div>

      <div class="nav-strip">
        <div class="nav-item active"><el-icon :size="20"><User /></el-icon><span>数字人</span></div>
        <div class="nav-item"><el-icon :size="20"><Microphone /></el-icon><span>声音</span></div>
        <div class="nav-item"><el-icon :size="20"><Picture /></el-icon><span>背景</span></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { Picture, Plus, ArrowUp, ArrowDown, Edit, User, Microphone } from "@element-plus/icons-vue";
import { useEducationLogic } from "../composables/useEducationLogic";

const {
  settings,
  activeSlideIndex,
  slides,
  showSubtitle,
  isTrackExpanded,
  textContent,
  searchText,
  filter,
  projectTitle,
  projects,
  aiModels,
  selectedModel,
  aiPrompt,
  loading,
  loadProjects,
  handleSave,
  handleGenerate,
  generateByAi,
} = useEducationLogic();

onMounted(() => {
  loadProjects();
});
</script>

<style scoped>
.edu-container { display: flex; height: calc(100vh - 60px); background-color: #f0f2f5; overflow: hidden; }
.left-sidebar { width: 130px; background: #fff; border-right: 1px solid #e0e0e0; display: flex; flex-direction: column; padding: 12px 8px; gap: 12px; }
.mode-switch-btn, .apply-btn { border: 1px solid #ddd; border-radius: 4px; padding: 6px 0; text-align: center; font-size: 12px; color: #666; cursor: pointer; }
.import-btn { border: 1px solid #5362bc; color: #5362bc; font-weight: bold; border-radius: 6px; padding: 8px 0; text-align: center; font-size: 13px; cursor: pointer; }
.slide-list { flex: 1; overflow: hidden; }
.slide-item { position: relative; width: 100%; aspect-ratio: 16/9; background-color: #eee; border-radius: 6px; margin-bottom: 10px; cursor: pointer; border: 2px solid transparent; transition: all 0.2s; }
.slide-item.active { border-color: #5362bc; }
.slide-img-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background-color: #f5f5f5; border-radius: 4px; }
.slide-index { position: absolute; left: 4px; bottom: 4px; background: rgba(0,0,0,0.5); color: #fff; font-size: 10px; padding: 1px 5px; border-radius: 2px; }
.add-slide-box { height: 40px; background: #f5f5f5; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #666; }
.center-area { flex: 1; display: flex; flex-direction: column; min-width: 600px; }
.top-toolbar { height: 50px; background: #fff; border-bottom: 1px solid #e0e0e0; display: flex; align-items: center; padding: 0 20px; gap: 15px; }
.setting-group { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #666; }
:deep(.transparent-select .el-input__wrapper) { box-shadow: none !important; padding: 0 5px; }
.right-actions { margin-left: auto; display: flex; gap: 10px; }
.tool-btn { background: #5362bc; color: #fff; border: none; font-weight: bold; }
.generate-btn { background: #4e5ecd; border-color: #4e5ecd; font-weight: bold; }
.canvas-wrapper { flex: 1; background-color: #ebedf0; display: flex; align-items: center; justify-content: center; }
.canvas-box { width: 70%; aspect-ratio: 16/9; background: linear-gradient(160deg, #f7f8ff, #dbe1ff); box-shadow: 0 4px 12px rgba(0,0,0,0.1); position: relative; border-radius: 20px; }
.canvas-title { position: absolute; top: 32px; left: 32px; font-size: 24px; font-weight: 700; color: #4b5ac8; }
.subtitle-layer { position: absolute; bottom: 10%; width: calc(100% - 60px); left: 30px; color: #2f2f2f; font-size: 18px; line-height: 1.6; font-weight: 600; }
.editor-panel { background: #fff; height: 280px; border-top: 1px solid #ccc; display: flex; flex-direction: column; position: relative; transition: height 0.3s ease; }
.editor-panel.is-expanded { height: 380px; }
.track-handle { position: absolute; top: -22px; left: 50%; transform: translateX(-50%); background: #fff; padding: 2px 20px; border-radius: 8px 8px 0 0; box-shadow: 0 -2px 4px rgba(0,0,0,0.05); cursor: pointer; font-size: 12px; color: #666; display: flex; align-items: center; gap: 4px; }
.panel-content { flex: 1; overflow: hidden; position: relative; }
.text-editor-box { display: flex; flex-direction: column; height: 100%; }
.te-toolbar { padding: 12px 15px; display: flex; gap: 12px; border-bottom: 1px solid #f5f5f5; }
.ai-input-line { flex: 1; }
:deep(.main-textarea .el-textarea__inner) { border: none; box-shadow: none; padding: 20px; font-size: 14px; height: 100%; }
.main-textarea { flex: 1; }
.te-footer { padding: 10px 20px; border-top: 1px solid #f5f5f5; display: flex; align-items: center; }
.clear-btn { font-size: 12px; color: #999; display: flex; align-items: center; gap: 8px; }
.stats { margin-left: auto; font-size: 12px; color: #999; margin-right: 20px; }
.save-play-btn { background: linear-gradient(90deg, #7c85ad, #5362bc); border: none; color: #fff; border-radius: 6px; padding: 8px 20px; }
.track-timeline-box { height: 100%; display: flex; flex-direction: column; background: #fff; }
.timeline-ruler { height: 24px; border-bottom: 1px solid #eee; position: relative; font-size: 10px; color: #999; background: #fcfcfc; padding-left: 40px; }
.timeline-ruler span { position: absolute; top: 4px; }
.play-head-line { position: absolute; left: 200px; top: 0; bottom: -300px; width: 1px; background: #666; z-index: 10; }
.tracks-container { flex: 1; overflow-y: auto; padding: 10px 0; }
.track-row { height: 44px; display: flex; margin-bottom: 4px; }
.track-header { width: 40px; border-right: 1px solid #eee; display: flex; align-items: center; justify-content: center; color: #555; }
.track-body { flex: 1; position: relative; background: rgba(0,0,0,0.02); }
.clip { position: absolute; top: 4px; bottom: 4px; border-radius: 4px; cursor: pointer; }
.text-clip { background: #d9ecff; border: 1px solid #a0cfff; }
.audio-clip { background: #e1f3d8; border: 1px solid #b3e19d; }
.right-sidebar { width: 340px; background: #fff; border-left: 1px solid #e0e0e0; display: flex; }
.resource-panel { flex: 1; padding: 15px; display: flex; flex-direction: column; }
.search-row { margin-bottom: 12px; }
.filter-row { display: flex; justify-content: space-between; margin-bottom: 15px; }
.resource-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding-bottom: 20px; }
.res-card { width: 100%; aspect-ratio: 3/4; background: #f5f5f5; border-radius: 6px; overflow: hidden; cursor: pointer; padding: 12px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; }
.project-name { font-weight: 700; color: #3d4784; }
.project-meta { font-size: 12px; color: #666; }
.nav-strip { width: 64px; border-left: 1px solid #f0f0f0; display: flex; flex-direction: column; }
.nav-item { height: 70px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #666; font-size: 12px; gap: 4px; cursor: pointer; }
.nav-item.active { color: #5362bc; background-color: #f0f2ff; position: relative; }
.nav-item.active::after { content: ""; position: absolute; right: 0; top: 0; bottom: 0; width: 3px; background: #5362bc; }
</style>
