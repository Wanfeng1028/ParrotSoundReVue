<template>
  <div class="community-container">
    <div class="main-card">
      
      <div class="header-bar">
        <h2 class="page-title">列表</h2>
        
        <div class="filter-group">
          <div class="filter-item">
            <span class="label">排序</span>
            <el-select v-model="filters.sort" class="custom-select" style="width: 100px">
              <el-option label="推荐" value="recommend" />
              <el-option label="最新" value="newest" />
              <el-option label="最热" value="hot" />
            </el-select>
          </div>

          <div class="filter-item">
            <span class="label">语言</span>
            <el-select v-model="filters.lang" class="custom-select" style="width: 100px">
              <el-option label="中文" value="cn" />
              <el-option label="英语" value="en" />
            </el-select>
          </div>

          <div class="search-box">
            <el-input 
              v-model="filters.search" 
              placeholder="请输入关键词" 
              class="custom-search"
            >
              <template #append>
                <el-button class="search-btn">搜索</el-button>
              </template>
            </el-input>
          </div>
        </div>
      </div>

      <div class="content-body">
        
        <div class="left-list">
          <div class="voice-card" v-for="item in voiceList" :key="item.id">
            
            <div class="card-left">
              <img :src="item.avatar" class="voice-avatar" />
            </div>

            <div class="card-center">
              <div class="v-title">{{ item.name }}</div>
              
              <div class="v-meta">
                <el-avatar :size="18" :src="item.userAvatar" class="u-avatar" />
                <span class="u-name">{{ item.username }}</span>
                <span class="v-date"><el-icon><Clock /></el-icon> {{ item.date }}</span>
                <span class="v-tag">· {{ item.tag }}</span>
              </div>

              <div class="play-row">
                <el-icon class="play-icon"><CaretRight /></el-icon>
                <span class="play-wave">范例句子 · · · · · · · · · · · ·</span>
              </div>

              <el-button type="primary" class="use-btn">使用声音</el-button>
            </div>

            <div class="card-right-stats">
              <div class="stat-item">
                <el-icon><VideoPlay /></el-icon> {{ item.stats.play }}
              </div>
              <div class="stat-item red">
                <el-icon><StarFilled /></el-icon> {{ item.stats.like }}
              </div>
              <div class="stat-item">
                <el-icon><Share /></el-icon> {{ item.stats.share }}
              </div>
              <div class="stat-item yellow">
                <el-icon><Star /></el-icon> {{ item.stats.fav }}
              </div>
            </div>

          </div>
        </div>

        <div class="right-rank">
          <h3 class="rank-title">最佳声音</h3>
          
          <div class="rank-list">
            <div class="rank-item" v-for="(item, index) in rankList" :key="item.id">
              <div class="rank-num">{{ (index + 1).toString().padStart(2, '0') }}</div>
              
              <div class="rank-info">
                <div class="r-name">{{ item.name }}</div>
                <div class="r-sub">
                  <el-avatar :size="16" :src="item.userAvatar" />
                  <span class="r-user">{{ item.username }}</span>
                  <el-icon class="r-heart"><Star /></el-icon>
                  <span class="r-count">{{ item.likes }}</span>
                </div>
              </div>

              <img :src="item.avatar" class="rank-img" />
            </div>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { 
  Clock, CaretRight, VideoPlay, StarFilled, Share, Star 
} from '@element-plus/icons-vue'

// 筛选状态
const filters = reactive({
  sort: 'recommend',
  lang: 'cn',
  search: ''
})

// 模拟左侧列表数据
const voiceList = ref([
  {
    id: 1,
    name: '刘德华',
    username: '用户89757',
    userAvatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
    date: '2025/1/22',
    tag: '古灵精怪',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    stats: { play: 2131, like: 2131, share: 2131, fav: 2131 }
  },
  {
    id: 2,
    name: '刘德华', // 保持图片文案
    username: '用户89757',
    userAvatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
    date: '2025/1/22',
    tag: '古灵精怪',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    stats: { play: 2131, like: 2131, share: 2131, fav: 2131 }
  },
  {
    id: 3,
    name: '刘德华',
    username: '用户89757',
    userAvatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
    date: '2025/1/22',
    tag: '古灵精怪',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    stats: { play: 2131, like: 2131, share: 2131, fav: 2131 }
  }
])

// 模拟右侧榜单数据
const rankList = ref([
  { id: 1, name: '刘德华', username: '用户名', likes: 2131, userAvatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png', avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png' },
  { id: 2, name: '刘德华', username: '用户名', likes: 2131, userAvatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png', avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png' },
  { id: 3, name: '刘德华', username: '用户名', likes: 2131, userAvatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png', avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png' },
  { id: 4, name: '刘德华', username: '用户名', likes: 2131, userAvatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png', avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png' },
  { id: 5, name: '刘德华', username: '用户名', likes: 2131, userAvatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png', avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png' },
])
</script>

<style scoped>
/* 全局容器 */
.community-container {
  min-height: calc(100vh - 60px);
  background-color: #f0f2f5; /* 页面底色 */
  padding: 30px;
  display: flex;
  justify-content: center;
}

/* 主白色大卡片 */
.main-card {
  width: 1200px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.03);
  padding: 30px 40px;
  display: flex;
  flex-direction: column;
}

/* === 顶部筛选栏 === */
.header-bar {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
}
.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-right: auto; /* 标题靠左 */
}
.filter-group {
  display: flex;
  align-items: center;
  gap: 20px;
}
.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.label {
  font-size: 14px;
  color: #333;
  font-weight: bold;
}

/* 核心：定制输入框和下拉框样式 (灰底无边框) */
:deep(.custom-select .el-input__wrapper),
:deep(.custom-search .el-input__wrapper) {
  background-color: #f5f5f5; /* 浅灰背景 */
  box-shadow: none !important; /* 去掉边框 */
  border-radius: 6px;
}
:deep(.custom-search .el-input-group__append) {
  background-color: #f5f5f5;
  box-shadow: none;
  border-left: none; /* 去掉分割线 */
}
.search-btn {
  border: none;
  background: transparent;
  color: #666;
  font-weight: bold;
}
.search-box {
  width: 240px;
}

/* === 内容主体 (左右布局) === */
.content-body {
  display: flex;
  gap: 40px;
}

/* 左侧列表 */
.left-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.voice-card {
  background-color: #f9f9f9; /* 卡片灰底 */
  border-radius: 10px;
  padding: 20px;
  display: flex;
  gap: 20px;
  position: relative; /* 为了定位右下角数据 */
}

.card-left .voice-avatar {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  object-fit: cover;
}

.card-center {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.v-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}
.v-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
  margin-bottom: 12px;
}
.u-name { font-weight: bold; color: #444; }
.v-date { display: flex; align-items: center; gap: 4px; }

.play-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #333;
  margin-bottom: 15px;
}
.play-icon { font-size: 16px; cursor: pointer; }
.play-wave { font-size: 12px; letter-spacing: 2px; color: #666; }

.use-btn {
  width: 90px;
  background-color: #5362bc; /* 你的主题紫 */
  border-color: #5362bc;
  font-weight: bold;
}

/* 右下角统计数据 */
.card-right-stats {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 20px;
  color: #666;
  font-size: 13px;
}
.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
.red { color: #f56c6c; } /* 红色爱心 */
.yellow { color: #e6a23c; } /* 黄色星星 */

/* === 右侧榜单 === */
.right-rank {
  width: 280px;
  background-color: #f0f2f5; /* 榜单也是浅色背景 */
  border-radius: 12px;
  padding: 20px;
  height: fit-content;
}
.rank-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
}

.rank-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.rank-item {
  display: flex;
  align-items: center;
}
.rank-num {
  width: 30px;
  font-size: 16px;
  font-weight: bold;
  color: #333;
}
.rank-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.r-name {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}
.r-sub {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
}
.r-heart { margin-left: 2px; }

.rank-img {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
  margin-left: 10px;
}
</style>