<template>
  <div class="page-inner">
    <el-tabs v-model="activeTab" class="custom-tabs">
      <el-tab-pane label="我收藏的声音" name="collect"></el-tab-pane>
      <el-tab-pane label="我喜欢的声音" name="like"></el-tab-pane>
      <el-tab-pane label="谁赞过我" name="who_liked"></el-tab-pane>
    </el-tabs>

    <div class="list-container">
      <div class="interact-item" v-for="i in 2" :key="i">
        <div class="avatar-group">
          <img src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" class="user-avatar" />
          
          <div class="badge-icon red" v-if="activeTab === 'who_liked'">
             <el-icon><StarFilled /></el-icon>
          </div>
          <div class="badge-icon yellow" v-else>
             <el-icon><StarFilled /></el-icon>
          </div>
        </div>

        <div class="info-content">
          <div class="user-name">用户名字</div>
          <div class="action-desc">
            <span v-if="activeTab==='who_liked'">赞了你的声音</span>
            <span v-else>收藏了你的声音</span>
            <span class="time">2025-01-29</span>
          </div>
        </div>

        <div class="thumb-box">
           <img src="https://cube.elemecdn.com/6/94/4d3ea53c084bad6931a56d5158a48jpeg.jpeg" class="thumb-img" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
// 🔴 修复点：去掉不存在的 HeartFilled，只保留 StarFilled
import { StarFilled } from '@element-plus/icons-vue'

const activeTab = ref('who_liked')
</script>

<style scoped>
.page-inner { padding: 20px 30px; }

:deep(.el-tabs__item.is-active) { color: #5362bc; }
:deep(.el-tabs__active-bar) { background-color: #5362bc; }

.list-container { margin-top: 10px; }
.interact-item {
  display: flex; align-items: center; padding: 20px 0; border-bottom: 1px solid #eee;
}

.avatar-group { position: relative; margin-right: 15px; }
.user-avatar { width: 50px; height: 50px; border-radius: 8px; object-fit: cover; }
.badge-icon {
  position: absolute; bottom: -5px; right: -5px; width: 22px; height: 22px;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  color: #fff; border: 2px solid #fff; font-size: 12px;
}
.red { background-color: #f56c6c; }
.yellow { background-color: #e6a23c; }

.info-content { flex: 1; }
.user-name { font-size: 14px; font-weight: bold; color: #333; margin-bottom: 5px; }
.action-desc { font-size: 12px; color: #666; }
.time { margin-left: 10px; color: #999; }

.thumb-box { width: 80px; height: 60px; border-radius: 6px; overflow: hidden; }
.thumb-img { width: 100%; height: 100%; object-fit: cover; }
</style>