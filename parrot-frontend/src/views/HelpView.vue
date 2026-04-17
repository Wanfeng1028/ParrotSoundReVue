<template>
  <div class="help-container">
    <div class="help-card">
      <div class="help-header">
        <h2 class="main-title">{{ pageTitle }}</h2>
        <p class="sub-title" v-if="activeTab !== 'feedback'">快速了解平台功能和创作方法</p>
      </div>

      <div class="help-body">
        <div class="nav-sidebar">
          <div class="nav-pill" :class="{ active: activeTab === 'guide' }" @click="switchTab('guide')">
            <el-icon><Compass /></el-icon> 平台指引
          </div>
          <div class="nav-pill" :class="{ active: activeTab === 'dubbing' }" @click="switchTab('dubbing')">
            <el-icon><Microphone /></el-icon> 智能配音
          </div>
          <div class="nav-pill" :class="{ active: activeTab === 'clone' }" @click="switchTab('clone')">
            <el-icon><CopyDocument /></el-icon> 声音克隆
          </div>
          <div class="nav-pill" :class="{ active: activeTab === 'education' }" @click="switchTab('education')">
            <el-icon><Monitor /></el-icon> 教育教学
          </div>
          <div class="nav-pill" :class="{ active: activeTab === 'feedback' }" @click="switchTab('feedback')">
            <el-icon><EditPen /></el-icon> 意见反馈
          </div>
        </div>

        <div class="content-area">
          <div v-if="activeTab !== 'feedback'" class="video-grid" v-loading="loading">
            <div class="video-item" v-for="video in videoList" :key="video.id" @click="openTutorial(video)">
              <div class="video-thumb">
                <el-icon class="play-btn"><CaretRight /></el-icon>
                <div class="duration">{{ video.duration }}</div>
                <div class="video-title">{{ video.title }}</div>
                <div class="video-summary">{{ video.summary }}</div>
              </div>
            </div>
            <el-empty v-if="!videoList.length && !loading" description="当前分类暂无教程" />
          </div>

          <div v-else class="feedback-box">
            <div class="form-group">
              <div class="f-label">使用时间</div>
              <el-radio-group v-model="feedbackForm.usageTime" class="custom-radios">
                <div class="radio-row"><el-radio value="不到 1 个月" size="large" /></div>
                <div class="radio-row"><el-radio value="1 - 3 个月左右" size="large" /></div>
                <div class="radio-row"><el-radio value="3 个月以上 6 个月以内" size="large" /></div>
                <div class="radio-row"><el-radio value="6 个月及以上" size="large" /></div>
              </el-radio-group>
            </div>

            <div class="form-group">
              <div class="f-label">问题描述</div>
              <el-input
                v-model="feedbackForm.content"
                type="textarea"
                :rows="6"
                placeholder="详细描述你遇到的问题或者一些意见和建议"
                class="f-textarea"
              />
            </div>

            <div class="f-footer">
              <el-button type="primary" class="submit-btn" @click="submitFeedback">确认提交</el-button>
            </div>
          </div>

          <div v-if="activeTab !== 'feedback'" class="pagination-row">
            <el-pagination
              background
              layout="prev, pager, next"
              :current-page="page"
              :page-size="pageSize"
              :total="total"
              @current-change="handlePageChange"
            />
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="tutorialVisible" width="620px" :title="currentTutorial?.title || '教程详情'">
      <div v-if="currentTutorial" class="tutorial-dialog">
        <div class="dialog-summary">{{ currentTutorial.summary }}</div>
        <div class="dialog-content">{{ currentTutorial.content || "本教程会带你快速完成该功能的关键流程。" }}</div>
        <div class="dialog-steps">
          <div class="step-item" v-for="(step, index) in currentTutorial.steps || []" :key="`${currentTutorial.id}-${index}`">
            <span class="step-index">{{ index + 1 }}</span>
            <span>{{ step }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="tutorialVisible = false">关闭</el-button>
        <el-button type="primary" @click="goToTutorialTarget">前往对应功能</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { Compass, Microphone, CopyDocument, Monitor, EditPen, CaretRight } from "@element-plus/icons-vue";
import { useHelpLogic } from "../composables/useHelpLogic";

const {
  activeTab,
  feedbackForm,
  videoList,
  tutorialVisible,
  currentTutorial,
  loading,
  page,
  pageSize,
  total,
  switchTab,
  openTutorial,
  goToTutorialTarget,
  submitFeedback,
  handlePageChange,
} = useHelpLogic();

const pageTitle = computed(() => {
  const map: Record<string, string> = {
    guide: "使用教程",
    dubbing: "智能配音教程",
    clone: "声音克隆教程",
    education: "教育教学教程",
    feedback: "意见反馈",
  };
  return map[activeTab.value] || "帮助中心";
});

onMounted(() => {
  switchTab("guide");
});
</script>

<style scoped>
.help-container { min-height: calc(100vh - 60px); background-color: #f0f2f5; padding: 40px; display: flex; justify-content: center; }
.help-card { width: 1000px; background: #fff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
.help-header { margin-bottom: 30px; display: flex; align-items: baseline; gap: 15px; }
.main-title { font-size: 24px; font-weight: bold; color: #333; }
.sub-title { font-size: 14px; color: #666; }
.help-body { display: flex; gap: 50px; }
.nav-sidebar { width: 160px; display: flex; flex-direction: column; gap: 15px; }
.nav-pill { padding: 12px 20px; background: #f5f7fa; border-radius: 8px; color: #555; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: all 0.3s; font-weight: 500; }
.nav-pill.active { background-color: #5865f2; color: #fff; box-shadow: 0 4px 10px rgba(88, 101, 242, 0.3); }
.content-area { flex: 1; display: flex; flex-direction: column; }
.video-grid { display: flex; gap: 20px; flex-wrap: wrap; min-height: 260px; }
.video-item { width: 300px; height: 180px; background: #ccc; border-radius: 8px; position: relative; cursor: pointer; overflow: hidden; }
.video-thumb { width: 100%; height: 100%; background: linear-gradient(180deg, #d7dcff, #a7b0f6); color: #fff; padding: 20px; box-sizing: border-box; position: relative; }
.play-btn { font-size: 32px; color: #5865f2; background: #fff; border-radius: 50%; padding: 5px; }
.duration { position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.6); color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
.video-title { position: absolute; left: 20px; bottom: 44px; font-weight: 700; }
.video-summary { position: absolute; left: 20px; right: 20px; bottom: 16px; font-size: 12px; line-height: 1.4; }
.feedback-box { background: #f8faff; padding: 30px; border-radius: 12px; }
.form-group { margin-bottom: 25px; }
.f-label { font-weight: bold; color: #333; margin-bottom: 15px; }
.radio-row { margin-bottom: 10px; }
.f-textarea :deep(.el-textarea__inner) { border: none; border-radius: 8px; padding: 15px; font-size: 14px; }
.f-footer { display: flex; justify-content: flex-end; }
.submit-btn { background-color: #5362bc; border-color: #5362bc; padding: 12px 40px; }
.tutorial-dialog { display: flex; flex-direction: column; gap: 16px; }
.dialog-summary { font-size: 14px; color: #5d678b; }
.dialog-content { font-size: 14px; line-height: 1.7; color: #333; background: #f7f8ff; border-radius: 8px; padding: 14px 16px; }
.dialog-steps { display: flex; flex-direction: column; gap: 10px; }
.step-item { display: flex; gap: 10px; align-items: flex-start; }
.step-index { width: 22px; height: 22px; border-radius: 50%; background: #5865f2; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
.pagination-row { margin-top: auto; display: flex; justify-content: flex-end; padding-top: 20px; }
</style>
