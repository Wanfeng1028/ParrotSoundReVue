<template>
  <div class="edu-container">
    
    <div class="left-sidebar">
      <div class="mode-switch-btn">
        <span>切换至视频模式</span>
      </div>

      <div class="import-btn">
        <span>导入PPT</span>
      </div>

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
               <el-icon v-if="index === 0" :size="30" color="#ccc"><Picture /></el-icon>
            </div>
            <div class="slide-index">{{ index + 1 }}</div>
            
            <div class="slide-tools" v-if="index === activeSlideIndex">
               <el-icon><CopyDocument /></el-icon>
               <el-icon><Delete /></el-icon>
            </div>
          </div>
        </el-scrollbar>
      </div>

      <div class="add-slide-box">
        <el-icon><Plus /></el-icon>
      </div>
      
      <div class="apply-btn">应用全部</div>
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
           <el-select v-model="settings.bitrate" size="small" class="transparent-select" style="width: 70px">
            <el-option label="默认" value="default" />
            <el-option label="高" value="high" />
          </el-select>
        </div>

        <div class="right-actions">
          <el-button class="tool-btn" plain size="small">
             <el-icon><Document /></el-icon> 保存
          </el-button>
          <el-button class="tool-btn" plain size="small">
             <el-icon><VideoPlay /></el-icon> 预览
          </el-button>
          <el-button type="primary" size="small" class="generate-btn">
             生成视频
          </el-button>
        </div>
      </div>

      <div class="canvas-wrapper">
        <div class="canvas-box">
          <img src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" class="digital-human" />
          <div class="subtitle-layer" v-if="showSubtitle">字幕在此显示</div>
        </div>
      </div>

      <div class="editor-panel" :class="{ 'is-expanded': isTrackExpanded }">
        
        <div class="editor-tools-row" v-if="!isTrackExpanded">
           <div class="undo-redo">
              <div class="ur-btn"><el-icon><RefreshLeft /></el-icon> 撤回</div>
              <div class="ur-btn"><el-icon><RefreshRight /></el-icon> 重做</div>
           </div>
           <div class="center-player">
              <el-icon class="cp-icon"><CaretLeft /></el-icon>
              <div class="play-circle"><el-icon><VideoPlay /></el-icon></div>
              <el-icon class="cp-icon"><CaretRight /></el-icon>
              <span class="time-text">00:00:00/00:00:00:00</span>
           </div>
           <div class="right-switches">
              字幕 <el-switch v-model="showSubtitle" size="small" style="--el-switch-on-color: #5362bc;"/>
           </div>
        </div>

        <div class="track-tools-row" v-else>
           <div class="track-left-actions">
              <div class="t-action"><el-icon><Scissor /></el-icon> 分割</div>
              <div class="t-action"><el-icon><CopyDocument /></el-icon> 复制</div>
              <div class="t-action"><el-icon><Delete /></el-icon> 删除</div>
              <div class="divider"></div>
              <div class="t-action"><el-icon><RefreshLeft /></el-icon> 撤回</div>
              <div class="t-action"><el-icon><RefreshRight /></el-icon> 重做</div>
           </div>
           
           <div class="center-player">
              <el-icon class="cp-icon"><CaretLeft /></el-icon>
              <div class="play-circle"><el-icon><VideoPlay /></el-icon></div>
              <el-icon class="cp-icon"><CaretRight /></el-icon>
              <span class="time-text">00:00:00/00:00:00:00</span>
           </div>

           <div class="right-zoom">
              <el-icon><Minus /></el-icon>
              <el-slider v-model="zoomLevel" size="small" class="zoom-slider" :show-tooltip="false" />
              <el-icon><Plus /></el-icon>
              <div class="ml-15">字幕 <el-switch v-model="showSubtitle" size="small" style="--el-switch-on-color: #5362bc;"/></div>
           </div>
        </div>

        <div class="track-handle" @click="isTrackExpanded = !isTrackExpanded">
           <span v-if="isTrackExpanded"><el-icon><ArrowDown /></el-icon> 收起轨道</span>
           <span v-else><el-icon><ArrowUp /></el-icon> 展开轨道</span>
        </div>

        <div class="panel-content">
          
          <div class="text-editor-box" v-show="!isTrackExpanded">
             <div class="te-toolbar">
                <div class="tt-item"><el-icon><Sort /></el-icon> 连读</div>
                <div class="tt-item"><el-icon><Timer /></el-icon> 设置停顿</div>
                <div class="tt-item"><el-icon><ChatDotRound /></el-icon> 多音字</div>
                <div class="tt-item"><el-icon><PriceTag /></el-icon> 数字</div>
                <div class="tt-item"><el-icon><Collection /></el-icon> 单词词组</div>
                <div class="divider"></div>
                <div class="tt-item purple"><el-icon><Upload /></el-icon> 上传文件</div>
                <div class="tt-item purple"><el-icon><EditPen /></el-icon> AI帮写</div>
                <div class="tt-item purple"><el-icon><Pointer /></el-icon> 添加动作</div>
             </div>
             <el-input 
                v-model="textContent" 
                type="textarea" 
                class="main-textarea" 
                placeholder="请输入文章内容"
                resize="none"
             />
             <div class="te-footer">
                <div class="clear-btn"><el-icon><Delete /></el-icon> 清空</div>
                <div class="stats">预估时长 00:00:00 &nbsp; 0/8000</div>
                <el-button class="save-play-btn">保存并生成播报</el-button>
             </div>
          </div>

          <div class="track-timeline-box" v-show="isTrackExpanded">
             <div class="timeline-ruler">
                <span>00:00</span>
                <span style="left: 200px">00:30</span>
                <span style="left: 400px">01:00</span>
                <span style="left: 600px">01:30</span>
                <div class="play-head-line"></div>
             </div>
             
             <div class="tracks-container">
                <div class="track-row">
                   <div class="track-header"><el-icon><Edit /></el-icon></div>
                   <div class="track-body">
                      <div class="clip text-clip" style="left: 0; width: 400px;"></div>
                   </div>
                </div>
                <div class="track-row">
                   <div class="track-header"><el-icon><User /></el-icon></div>
                   <div class="track-body">
                      <div class="clip person-clip" style="left: 0; width: 300px;"></div>
                   </div>
                </div>
                <div class="track-row">
                   <div class="track-header"><el-icon><Microphone /></el-icon></div>
                   <div class="track-body">
                      <div class="clip audio-clip" style="left: 0; width: 300px;"></div>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>


    <div class="right-sidebar">
      
      <div class="resource-panel">
        <div class="search-row">
           <el-input v-model="searchText" placeholder="请输入关键词" size="small" class="custom-search">
              <template #append><el-button>搜索</el-button></template>
           </el-input>
        </div>
        <div class="filter-row">
           <el-select v-model="filter.gender" placeholder="全部性别" size="small" style="width: 48%">
             <el-option label="全部性别" value="all" />
           </el-select>
           <el-select v-model="filter.pose" placeholder="全部姿势" size="small" style="width: 48%">
             <el-option label="全部姿势" value="all" />
           </el-select>
        </div>

        <el-scrollbar class="resource-scroll">
           <div class="resource-grid">
              <div class="res-card" v-for="i in 6" :key="i">
                 <img src="https://cube.elemecdn.com/6/94/4d3ea53c084bad6931a56d5158a48jpeg.jpeg" class="res-img"/>
              </div>
           </div>
        </el-scrollbar>
      </div>

      <div class="nav-strip">
         <div class="nav-item active">
            <el-icon :size="20"><User /></el-icon>
            <span>数字人</span>
         </div>
         <div class="nav-item">
            <el-icon :size="20"><Microphone /></el-icon>
            <span>声音</span>
         </div>
         <div class="nav-item">
            <el-icon :size="20"><Picture /></el-icon>
            <span>背景</span>
         </div>
         <div class="nav-item">
            <el-icon :size="20"><Edit /></el-icon>
            <span>字幕</span>
         </div>
         <div class="nav-item">
            <el-icon :size="20"><Headset /></el-icon>
            <span>音乐</span>
         </div>
      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { 
  Picture, Plus, CopyDocument, Delete, Document, VideoPlay, 
  RefreshLeft, RefreshRight, CaretLeft, CaretRight, ArrowUp, ArrowDown,
  Sort, Timer, ChatDotRound, PriceTag, Collection, Upload, EditPen, Pointer,
  Scissor, Minus, Edit, User, Microphone, Headset
} from '@element-plus/icons-vue'

// === 状态管理 ===
const settings = reactive({ ratio: '16:9', resolution: '1080P', bitrate: 'default' })
const activeSlideIndex = ref(0)
const slides = ref([1, 2, 3]) // 模拟3个幻灯片
const showSubtitle = ref(true)
const isTrackExpanded = ref(false) // 轨道是否展开
const textContent = ref('')
const searchText = ref('')
const filter = reactive({ gender: 'all', pose: 'all' })
const zoomLevel = ref(50)

</script>

<style scoped>
/* 容器 */
.edu-container {
  display: flex;
  height: calc(100vh - 60px);
  background-color: #f0f2f5;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial;
}

/* === 左侧边栏 === */
.left-sidebar {
  width: 130px;
  background: #fff;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  padding: 12px 8px;
  gap: 12px;
}

.mode-switch-btn {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 6px 0;
  text-align: center;
  font-size: 12px;
  color: #666;
  cursor: pointer;
}
.import-btn {
  border: 1px solid #5362bc;
  color: #5362bc;
  font-weight: bold;
  border-radius: 6px;
  padding: 8px 0;
  text-align: center;
  font-size: 13px;
  cursor: pointer;
}

.slide-list { flex: 1; overflow: hidden; }
.slide-item {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  background-color: #eee;
  border-radius: 6px;
  margin-bottom: 10px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}
.slide-item.active { border-color: #5362bc; }
.slide-img-placeholder {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  background-color: #f5f5f5; border-radius: 4px;
}
.slide-index {
  position: absolute; left: 4px; bottom: 4px;
  background: rgba(0,0,0,0.5); color: #fff; font-size: 10px; padding: 1px 5px; border-radius: 2px;
}
.slide-tools {
  position: absolute; right: 4px; top: 4px;
  display: flex; gap: 4px; color: #666; background: rgba(255,255,255,0.8);
  padding: 2px; border-radius: 2px;
}

.add-slide-box {
  height: 40px; background: #f5f5f5; border-radius: 6px;
  display: flex; align-items: center; justify-content: center; cursor: pointer; color: #666;
}
.apply-btn {
  background: #e6e6e6; color: #666; text-align: center; padding: 8px 0; border-radius: 6px; font-size: 12px; cursor: pointer;
}

/* === 中间区域 === */
.center-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 600px;
}

/* 顶部栏 */
.top-toolbar {
  height: 50px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 15px;
}
.setting-group { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #666; }
/* 去掉 Select 边框 */
:deep(.transparent-select .el-input__wrapper) {
  box-shadow: none !important; padding: 0 5px;
}
:deep(.transparent-select .el-input__inner) { font-size: 12px; color: #333; font-weight: bold; }

.right-actions { margin-left: auto; display: flex; gap: 10px; }
.tool-btn { background: #5362bc; color: #fff; border: none; font-weight: bold; } /* 还原图中的蓝色按钮 */
.generate-btn { background: #4e5ecd; border-color: #4e5ecd; font-weight: bold; }

/* 画布 */
.canvas-wrapper {
  flex: 1;
  background-color: #ebedf0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.canvas-box {
  width: 70%; aspect-ratio: 16/9; background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  position: relative;
}
.digital-human {
  width: 100%; height: 100%; object-fit: contain; /* 模拟数字人显示 */
}
.subtitle-layer {
  position: absolute; bottom: 10%; width: 100%; text-align: center;
  color: #fff; font-size: 20px; text-shadow: 0 2px 4px rgba(0,0,0,0.5); font-weight: bold;
}

/* === 底部编辑器 (核心) === */
.editor-panel {
  background: #fff;
  height: 280px; /* 收起高度 */
  border-top: 1px solid #ccc;
  display: flex; flex-direction: column;
  position: relative;
  transition: height 0.3s ease;
}
.editor-panel.is-expanded {
  height: 380px; /* 展开高度 */
}

/* 伸缩把手 */
.track-handle {
  position: absolute; top: -22px; left: 50%; transform: translateX(-50%);
  background: #fff; padding: 2px 20px; border-radius: 8px 8px 0 0;
  box-shadow: 0 -2px 4px rgba(0,0,0,0.05); cursor: pointer;
  font-size: 12px; color: #666; display: flex; align-items: center; gap: 4px;
}

/* 工具栏行 (两种模式通用样式) */
.editor-tools-row, .track-tools-row {
  height: 44px; border-bottom: 1px solid #f0f0f0;
  display: flex; align-items: center; padding: 0 15px; justify-content: space-between;
}

.undo-redo, .track-left-actions { display: flex; gap: 15px; align-items: center; }
.ur-btn, .t-action { font-size: 12px; color: #666; display: flex; flex-direction: column; align-items: center; cursor: pointer; gap: 2px; }
.t-action { flex-direction: row; gap: 4px; } /* 轨道模式下横排 */
.divider { width: 1px; height: 14px; background: #ddd; margin: 0 5px; }

.center-player {
  display: flex; align-items: center; gap: 15px; position: absolute; left: 50%; transform: translateX(-50%);
}
.play-circle {
  width: 36px; height: 36px; background: #312eff; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; color: #fff; font-size: 18px; cursor: pointer;
}
.cp-icon { font-size: 24px; color: #312eff; cursor: pointer; }
.time-text { font-size: 12px; color: #999; margin-left: 10px; font-family: monospace; }

.right-zoom { display: flex; align-items: center; gap: 8px; color: #666; font-size: 12px; }
.zoom-slider { width: 80px; margin: 0 5px; }
.ml-15 { margin-left: 15px; }

/* 内容区 */
.panel-content { flex: 1; overflow: hidden; position: relative; }

/* 1. 文本编辑器 */
.text-editor-box { display: flex; flex-direction: column; height: 100%; }
.te-toolbar { padding: 8px 15px; display: flex; gap: 20px; border-bottom: 1px solid #f5f5f5; }
.tt-item { font-size: 12px; color: #666; display: flex; flex-direction: column; align-items: center; cursor: pointer; gap: 2px; }
.tt-item.purple { color: #8e44ad; }
:deep(.main-textarea .el-textarea__inner) {
  border: none; box-shadow: none; padding: 20px; font-size: 14px; height: 100%;
}
.main-textarea { flex: 1; }
.te-footer { padding: 10px 20px; border-top: 1px solid #f5f5f5; display: flex; align-items: center; }
.clear-btn { font-size: 12px; color: #999; display: flex; align-items: center; cursor: pointer; }
.stats { margin-left: auto; font-size: 12px; color: #999; margin-right: 20px; }
.save-play-btn {
  background: linear-gradient(90deg, #7c85ad, #5362bc); border: none; color: #fff; border-radius: 6px; padding: 8px 20px;
}

/* 2. 轨道编辑器 */
.track-timeline-box { height: 100%; display: flex; flex-direction: column; background: #fff; }
.timeline-ruler {
  height: 24px; border-bottom: 1px solid #eee; position: relative; font-size: 10px; color: #999;
  background: #fcfcfc; padding-left: 40px; /* 给左侧图标留空 */
}
.timeline-ruler span { position: absolute; top: 4px; }
.play-head-line {
  position: absolute; left: 200px; top: 0; bottom: -300px; width: 1px; background: #666; z-index: 10;
}
.play-head-line::after {
  content: ''; position: absolute; top: 0; left: -5px; border-width: 6px; border-style: solid; 
  border-color: #666 transparent transparent transparent;
}

.tracks-container { flex: 1; overflow-y: auto; padding: 10px 0; }
.track-row { height: 44px; display: flex; margin-bottom: 4px; }
.track-header {
  width: 40px; border-right: 1px solid #eee; display: flex; align-items: center; justify-content: center; color: #555;
}
.track-body { flex: 1; position: relative; background: rgba(0,0,0,0.02); }
.clip {
  position: absolute; top: 4px; bottom: 4px; border-radius: 4px; cursor: pointer;
}
.text-clip { background: #d9ecff; border: 1px solid #a0cfff; } /* 还原图中的浅紫 */
.person-clip { background: #e1f3d8; border: 1px solid #b3e19d; } /* 还原图中的浅绿 */
.audio-clip { background: #e1f3d8; border: 1px solid #b3e19d; }

/* === 右侧素材库 === */
.right-sidebar {
  width: 340px;
  background: #fff;
  border-left: 1px solid #e0e0e0;
  display: flex;
}

.resource-panel { flex: 1; padding: 15px; display: flex; flex-direction: column; }
.search-row { margin-bottom: 12px; }
:deep(.custom-search .el-input-group__append) { background-color: #f5f7fa; color: #666; padding: 0 15px; }

.filter-row { display: flex; justify-content: space-between; margin-bottom: 15px; }

.resource-scroll { flex: 1; }
.resource-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding-bottom: 20px;
}
.res-card {
  width: 100%; aspect-ratio: 3/4; background: #f5f5f5; border-radius: 6px; overflow: hidden; cursor: pointer;
}
.res-img { width: 100%; height: 100%; object-fit: cover; }

.nav-strip {
  width: 64px;
  border-left: 1px solid #f0f0f0;
  display: flex; flex-direction: column;
}
.nav-item {
  height: 70px; display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: #666; font-size: 12px; gap: 4px; cursor: pointer;
}
.nav-item:hover { background-color: #f9f9f9; }
.nav-item.active { color: #5362bc; background-color: #f0f2ff; position: relative; }
.nav-item.active::after {
  content: ''; position: absolute; right: 0; top: 0; bottom: 0; width: 3px; background: #5362bc;
}
</style>