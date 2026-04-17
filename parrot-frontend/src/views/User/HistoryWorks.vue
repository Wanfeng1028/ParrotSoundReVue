<template>
  <div class="page-inner">
    <el-tabs v-model="activeTab" class="custom-tabs">
      <el-tab-pane label="音频" name="audio"></el-tab-pane>
      <el-tab-pane label="视频" name="video"></el-tab-pane>
      <el-tab-pane label="我的声音" name="voice"></el-tab-pane>
    </el-tabs>

    <div class="toolbar">
      <el-input 
        v-model="searchText" 
        placeholder="输入内容进行搜索" 
        class="gray-search"
        :prefix-icon="Search" 
      />
      <div class="right-btns">
        <el-button class="tool-btn"><el-icon><Share /></el-icon> 分享</el-button>
        <el-button class="tool-btn"><el-icon><Delete /></el-icon> 删除</el-button>
      </div>
    </div>

    <div class="works-grid">
      <div class="work-card" v-for="item in worksList" :key="item.id">
        <div class="cover-wrapper">
          <img :src="item.cover" class="cover-img" />
          <div class="overlay">
            <el-icon class="more-icon"><MoreFilled /></el-icon>
            <div class="play-status">
              <el-icon v-if="item.status === 'playing'" :size="40"><VideoPause /></el-icon>
              <el-icon v-else :size="40"><VideoPlay /></el-icon>
            </div>
          </div>
          <div class="context-menu" v-if="item.id === 1">
             <div class="menu-item">生成副本</div>
             <div class="menu-item">设为公开</div>
             <div class="menu-item">设为私有</div>
             <div class="menu-item">重命名</div>
          </div>
        </div>
        <div class="work-info">
          <div class="w-title">{{ item.title }}</div>
          <div class="w-date">{{ item.date }} 生成</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Search, Share, Delete, MoreFilled, VideoPlay, VideoPause } from '@element-plus/icons-vue'

const activeTab = ref('voice')
const searchText = ref('')

const worksList = ref([
  { id: 1, title: '未命名草稿', date: '2025-01-26', status: 'paused', cover: 'https://cube.elemecdn.com/6/94/4d3ea53c084bad6931a56d5158a48jpeg.jpeg' },
  { id: 2, title: '未命名草稿', date: '2025-01-26', status: 'playing', cover: 'https://cube.elemecdn.com/6/94/4d3ea53c084bad6931a56d5158a48jpeg.jpeg' },
  { id: 3, title: '未命名草稿', date: '2025-01-26', status: 'paused', cover: 'https://cube.elemecdn.com/6/94/4d3ea53c084bad6931a56d5158a48jpeg.jpeg' },
])
</script>

<style scoped>
.page-inner { padding: 20px 30px; }

/* Tabs 定制 */
:deep(.el-tabs__item) {
  font-size: 16px; font-weight: bold; color: #333;
}
:deep(.el-tabs__item.is-active) {
  color: #5362bc; 
}
:deep(.el-tabs__active-bar) {
  background-color: #5362bc; height: 3px;
}
:deep(.el-tabs__nav-wrap::after) {
  height: 1px; background-color: #eee;
}

/* 工具栏 */
.toolbar { margin-top: 20px; display: flex; justify-content: space-between; }
.gray-search { width: 240px; }
:deep(.gray-search .el-input__wrapper) {
  background-color: #f5f5f5; border-radius: 6px; box-shadow: none;
}
.tool-btn { background: #f5f5f5; border: none; color: #666; font-weight: bold; padding: 10px 15px; }
.tool-btn:hover { background: #e0e0e0; }

/* 网格布局 */
.works-grid { display: flex; gap: 20px; margin-top: 20px; flex-wrap: wrap; }
.work-card { width: 180px; }

.cover-wrapper { 
  width: 180px; height: 180px; border-radius: 12px; overflow: hidden; position: relative; cursor: pointer; 
}
.cover-img { width: 100%; height: 100%; object-fit: cover; }

/* 遮罩层 */
.overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.3); display: flex; flex-direction: column;
  justify-content: center; align-items: center; color: #fff;
}
.more-icon { position: absolute; top: 10px; right: 10px; font-size: 20px; transform: rotate(90deg); }
.play-status { font-size: 40px; opacity: 0.9; }

/* 模拟白色弹出菜单 */
.context-menu {
  position: absolute; top: 35px; right: 10px; background: #fff; border-radius: 4px; padding: 5px 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15); width: 80px; z-index: 10;
}
.menu-item { font-size: 12px; color: #333; padding: 5px 10px; text-align: center; }
.menu-item:hover { background: #f5f5f5; color: #5362bc; }

.work-info { margin-top: 10px; }
.w-title { font-weight: bold; font-size: 14px; color: #333; }
.w-date { font-size: 12px; color: #999; margin-top: 4px; }
</style>