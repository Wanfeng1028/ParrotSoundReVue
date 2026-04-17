<template>
  <div class="record-page-container">
    
    <transition name="slide-fade">
      <div class="custom-toast" v-if="toast.visible" :class="toast.type">
        <div class="toast-line"></div>
        
        <el-icon class="toast-icon">
          <CircleCheckFilled v-if="toast.type === 'success'" />
          <WarningFilled v-else />
        </el-icon>
        
        <span class="toast-text">{{ toast.msg }}</span>
        
        <el-icon class="close-icon" @click="toast.visible = false"><Close /></el-icon>
      </div>
    </transition>

    <div class="header-section">
      <div class="page-title-bar">
        <div class="title-text">音频记录</div>
        <div class="header-decoration"></div>
      </div>
      <div class="header-actions">
        <el-input v-model="searchText" placeholder="搜索音频内容..." class="custom-search-input" :prefix-icon="Search" />
        <el-button class="all-btn">全部记录</el-button>
      </div>
    </div>

    <div class="card-grid">
      <div v-for="item in recordList" :key="item.id" class="record-card">
        <div class="status-badge" :class="item.status">
          {{ item.status === 'processing' ? '处理中' : '已完成' }}
        </div>
        <div class="content-box">{{ item.content }}</div>
        
        <div class="card-footer">
          <div class="meta-row">
            <span class="meta-text">创建时间: {{ item.time }}</span>
            <span class="meta-text align-right">音色: {{ item.voice }}</span>
          </div>
          <div class="action-row">
            <template v-if="item.status === 'processing'">
              <button class="btn btn-delete">删除</button>
            </template>
            <template v-else>
              <button v-if="item.isPlaying" class="btn btn-pause" @click="handlePlay(item)">暂停</button>
              <button v-else class="btn btn-play" @click="handlePlay(item)">播放</button>
              
              <button class="btn btn-download">下载</button>
              <button class="btn btn-delete">删除</button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div class="bottom-player">
      <div class="player-left">
        <div class="p-title">下面进行英语四级听力考试</div>
        <div class="p-voice">音色: 标准</div>
      </div>
      <div class="player-center">
        <div class="play-circle-btn"><el-icon><VideoPlay /></el-icon></div>
        <div class="progress-wrapper">
          <el-slider v-model="playProgress" :show-tooltip="false" class="purple-slider" />
          <span class="time-label">0:00/0:00</span>
        </div>
      </div>
      <div class="player-right">
        <el-button class="p-btn-white">下载</el-button>
        <el-button class="p-btn-white">关闭</el-button>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Search, VideoPlay, WarningFilled, CircleCheckFilled, Close } from '@element-plus/icons-vue'

const searchText = ref('')
const playProgress = ref(0)

// === 弹窗状态管理 ===
const toast = reactive({
  visible: false,
  type: 'error', // 'success' 或 'error'
  msg: ''
})

// === 核心逻辑：点击播放 ===
const handlePlay = (item: any) => {
  // 1. 切换按钮状态 (纯视觉效果)
  item.isPlaying = !item.isPlaying

  // 2. 模拟随机成功或失败 (为了演示两种效果)
  // 如果你想每次都只显示失败，就把 Math.random() > 0.5 改成 false
  const isSuccess = Math.random() > 0.5 

  if (isSuccess) {
    showToast('success', '播放成功，开始播放音频')
  } else {
    // 这就是截图里的效果
    item.isPlaying = false // 失败了就变回暂停状态
    showToast('error', '播放失败，请点击重试')
  }
}

// 显示弹窗的通用函数
const showToast = (type: 'success'|'error', msg: string) => {
  toast.visible = true
  toast.type = type
  toast.msg = msg

  // 3秒后自动消失
  setTimeout(() => {
    toast.visible = false
  }, 3000)
}

// 模拟数据
const recordList = ref([
  { id: 1, content: '111111111111111', time: '2025/04/03 16:23', voice: '女声', status: 'processing', isPlaying: false },
  { id: 2, content: '下面进行英语四级听力考试', time: '2025/04/03 15:51', voice: '默认', status: 'completed', isPlaying: false },
  { id: 3, content: '哈哈哈，我是剑魔', time: '2025/04/03 15:32', voice: '默认', status: 'completed', isPlaying: false },
  { id: 4, content: '测试文本', time: '2025/04/03 15:12', voice: '默认', status: 'completed', isPlaying: false }
])
</script>

<style scoped>
/* 全局容器 */
.record-page-container {
  min-height: calc(100vh - 60px);
  background-color: #f5f7fa;
  padding: 20px 40px 100px 40px;
  position: relative;
}

/* === 🔴 动态弹窗样式 (高度还原) === */
.custom-toast {
  position: absolute;
  top: 20px; right: 20px;
  background: #fff;
  padding: 12px 20px 12px 15px;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15); /* 阴影稍微深一点 */
  display: flex; align-items: center; gap: 10px;
  font-size: 14px; color: #333;
  z-index: 1000;
  min-width: 200px;
  overflow: hidden;
}

/* 左侧竖线 */
.toast-line {
  position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
}
/* 失败红线 */
.custom-toast.error .toast-line { background: #f56c6c; }
.custom-toast.error .toast-icon { color: #f56c6c; }
/* 成功绿线 */
.custom-toast.success .toast-line { background: #67c23a; }
.custom-toast.success .toast-icon { color: #67c23a; }

.toast-text { flex: 1; font-weight: 500; }
.toast-icon { font-size: 18px; }
.close-icon { color: #999; cursor: pointer; font-size: 14px; }
.close-icon:hover { color: #333; }

/* 弹窗动画 (Vue Transition) */
.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.3s ease; }
.slide-fade-enter-from, .slide-fade-leave-to {
  transform: translateY(-20px); opacity: 0;
}

/* === 下面是之前的布局样式 (保持不变) === */
.header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
.title-text { font-size: 24px; font-weight: bold; color: #333; }
.header-decoration { width: 40px; height: 4px; background: #5362bc; margin-top: 8px; border-radius: 2px; }
.header-actions { display: flex; gap: 15px; }
.custom-search-input { width: 300px; }
:deep(.custom-search-input .el-input__wrapper) { background-color: #fff; border-radius: 20px; padding-left: 15px; }
.all-btn { border-radius: 20px; border: 1px solid #dcdfe6; color: #606266; font-weight: 500; }

.card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.record-card { 
background: #fff; 
border-radius: 12px; 
padding: 25px; 
position: relative; 
box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.03); display: flex; flex-direction: column; height: 220px; }
.record-card::before { content: ''; position: absolute; left: 0; top: 25px; bottom: 25px; width: 4px; background-color: #5362bc; border-radius: 0 4px 4px 0; }

.status-badge { position: absolute; top: 15px; right: 15px; font-size: 12px; padding: 2px 8px; border-radius: 4px; }
.status-badge.processing { color: #409eff; background: #ecf5ff; border: 1px solid #d9ecff; }
.status-badge.completed { color: #67c23a; background: #f0f9eb; border: 1px solid #e1f3d8; }

.content-box { flex: 1; background: #f9fafc; border-radius: 6px; padding: 15px; color: #555; font-size: 14px; line-height: 1.6; margin-top: 10px; margin-bottom: 15px; }
.card-footer { margin-top: auto; }
.meta-row { display: flex; justify-content: space-between; font-size: 12px; color: #999; margin-bottom: 15px; }

.action-row { display: flex; gap: 12px; }
.btn { padding: 6px 20px; border-radius: 6px; font-size: 13px; cursor: pointer; border: 1px solid transparent; transition: all 0.2s; font-weight: 500; }
.btn-delete { color: #f56c6c; background: #fef0f0; border-color: #fde2e2; }
.btn-delete:hover { background: #f56c6c; color: #fff; }
.btn-play { color: #5362bc; background: #fff; border-color: #5362bc; }
.btn-play:hover { background: #f0f2ff; }
.btn-pause { color: #5362bc; background: #ecebff; border-color: #ecebff; }
.btn-download { color: #67c23a; background: #fff; border-color: #67c23a; }
.btn-download:hover { background: #f0f9eb; }

.bottom-player { position: fixed; bottom: 0; left: 0; right: 0; height: 80px; background: #fff; box-shadow: 0 -2px 10px rgba(0,0,0,0.05); display: flex; align-items: center; justify-content: space-between; padding: 0 40px; z-index: 999; }
.player-left { min-width: 200px; }
.p-title { font-weight: bold; font-size: 16px; color: #333; margin-bottom: 4px; }
.p-voice { font-size: 12px; color: #999; }
.player-center { flex: 1; display: flex; align-items: center; justify-content: center; gap: 20px; }
.play-circle-btn { width: 48px; height: 48px; background: #6a5eff; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 24px; cursor: pointer; box-shadow: 0 4px 10px rgba(106, 94, 255, 0.3); }
.progress-wrapper { display: flex; align-items: center; gap: 10px; width: 300px; }
.time-label { font-size: 12px; color: #666; width: 70px; text-align: right; }
:deep(.purple-slider .el-slider__bar) { background-color: #6a5eff; }
:deep(.purple-slider .el-slider__button) { border-color: #6a5eff; }
.player-right { display: flex; gap: 15px; }
.p-btn-white { border-radius: 6px; color: #666; }
</style>