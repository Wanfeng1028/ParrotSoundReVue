<template>
  <div class="community-container">
    <div class="main-card">
      <div class="header-bar">
        <h2 class="page-title">社区声音库</h2>

        <div class="filter-group">
          <div class="filter-item">
            <span class="label">排序</span>
            <el-select v-model="filters.sort" class="custom-select" style="width: 100px" @change="load">
              <el-option label="推荐" value="recommend" />
              <el-option label="最新" value="newest" />
              <el-option label="最热" value="hot" />
            </el-select>
          </div>

          <div class="filter-item">
            <span class="label">语言</span>
            <el-select v-model="filters.language" class="custom-select" style="width: 100px" @change="load">
              <el-option label="全部" value="all" />
              <el-option label="中文" value="cn" />
              <el-option label="英语" value="en" />
            </el-select>
          </div>

          <div class="search-box">
            <el-input v-model="filters.search" placeholder="请输入关键词" class="custom-search" @input="debouncedLoad">
              <template #append>
                <el-button class="search-btn" @click="load">搜索</el-button>
              </template>
            </el-input>
          </div>
        </div>
      </div>

      <div class="content-body">
        <div class="left-list" v-loading="loading">
          <div class="voice-card" v-for="item in voiceList" :key="item.id">
            <div class="card-left">
              <img :src="item.coverUrl || fallbackAvatar" class="voice-avatar" loading="lazy" @click="previewVoice(item.id, item.sampleAudioUrl)" />
            </div>

            <div class="card-center">
              <div class="v-title">{{ item.name }}</div>

              <div class="v-meta">
                <el-avatar :size="18" :src="item.userAvatar || undefined" class="u-avatar">{{ item.username.slice(0, 1) }}</el-avatar>
                <span class="u-name">{{ item.username }}</span>
                <span class="v-date"><el-icon><Clock /></el-icon> {{ formatDate(item.date) }}</span>
                <span class="v-tag">· {{ item.tag }}</span>
              </div>

              <div class="play-row">
                <el-icon class="play-icon" :class="{ active: playingId === item.id }" @click="previewVoice(item.id, item.sampleAudioUrl)">
                  <CaretRight />
                </el-icon>
                <span class="play-wave">{{ item.desc || "点击试听社区样音" }}</span>
              </div>

              <div class="action-bar">
                <el-button type="primary" class="use-btn" @click="useVoice(item.id)">使用声音</el-button>
                <el-button plain @click="likeVoice(item.id)">点赞</el-button>
                <el-button plain @click="favoriteVoice(item.id)">收藏</el-button>
              </div>
            </div>

            <div class="card-right-stats">
              <div class="stat-item"><el-icon><VideoPlay /></el-icon> {{ item.stats.play }}</div>
              <div class="stat-item red"><el-icon><StarFilled /></el-icon> {{ item.stats.like }}</div>
              <div class="stat-item"><el-icon><Share /></el-icon> {{ item.stats.use }}</div>
              <div class="stat-item yellow"><el-icon><Star /></el-icon> {{ item.stats.favorite }}</div>
            </div>
          </div>

          <el-empty v-if="!voiceList.length && !loading" description="暂无匹配音色" />

          <div class="pagination-row">
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

        <div class="right-rank">
          <h3 class="rank-title">最佳声音</h3>

          <div class="rank-list">
            <div class="rank-item" v-for="(item, index) in rankList" :key="item.id" @click="useRankVoice(item.id)">
              <div class="rank-num">{{ (index + 1).toString().padStart(2, "0") }}</div>

              <div class="rank-info">
                <div class="r-name">{{ item.name }}</div>
                <div class="r-sub">
                  <el-avatar :size="16" :src="item.userAvatar || undefined">{{ item.username.slice(0, 1) }}</el-avatar>
                  <span class="r-user">{{ item.username }}</span>
                  <el-icon class="r-heart"><Star /></el-icon>
                  <span class="r-count">{{ item.likes }}</span>
                </div>
              </div>

              <img :src="item.avatar || fallbackAvatar" class="rank-img" loading="lazy" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { Clock, CaretRight, VideoPlay, StarFilled, Share, Star } from "@element-plus/icons-vue";
import fallbackAvatar from "../assets/images/voice-avatar.png";
import { useCommunityLogic } from "../composables/useCommunityLogic";

const {
  filters,
  voiceList,
  rankList,
  loading,
  playingId,
  page,
  pageSize,
  total,
  load,
  debouncedLoad,
  previewVoice,
  likeVoice,
  favoriteVoice,
  useVoice,
  useRankVoice,
  handlePageChange,
} = useCommunityLogic();

const formatDate = (value: string) => new Date(value).toLocaleDateString();

onMounted(() => {
  load();
});
</script>

<style scoped>
.community-container { min-height: calc(100vh - 60px); background-color: #f0f2f5; padding: 30px; display: flex; justify-content: center; }
.main-card { width: 1200px; background-color: #fff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); padding: 30px 40px; display: flex; flex-direction: column; }
.header-bar { display: flex; align-items: center; margin-bottom: 30px; }
.page-title { font-size: 24px; font-weight: bold; color: #333; margin-right: auto; }
.filter-group { display: flex; align-items: center; gap: 20px; }
.filter-item { display: flex; align-items: center; gap: 8px; }
.label { font-size: 14px; color: #333; font-weight: bold; }
:deep(.custom-select .el-input__wrapper), :deep(.custom-search .el-input__wrapper) { background-color: #f5f5f5; box-shadow: none !important; border-radius: 6px; }
:deep(.custom-search .el-input-group__append) { background-color: #f5f5f5; box-shadow: none; border-left: none; }
.search-btn { border: none; background: transparent; color: #666; font-weight: bold; }
.search-box { width: 240px; }
.content-body { display: flex; gap: 40px; }
.left-list { flex: 1; display: flex; flex-direction: column; gap: 15px; min-height: 480px; }
.voice-card { background-color: #f9f9f9; border-radius: 10px; padding: 20px; display: flex; gap: 20px; position: relative; }
.card-left .voice-avatar { width: 100px; height: 100px; border-radius: 8px; object-fit: cover; }
.card-center { flex: 1; display: flex; flex-direction: column; }
.v-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 8px; }
.v-meta { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #666; margin-bottom: 12px; }
.u-name { font-weight: bold; color: #444; }
.v-date { display: flex; align-items: center; gap: 4px; }
.play-row { display: flex; align-items: center; gap: 8px; color: #333; margin-bottom: 15px; }
.play-icon { font-size: 16px; cursor: pointer; }
.play-icon.active { color: #5362bc; }
.play-wave { font-size: 12px; letter-spacing: 1px; color: #666; }
.action-bar { display: flex; gap: 10px; }
.use-btn { width: 100px; background-color: #5362bc; border-color: #5362bc; font-weight: bold; }
.card-right-stats { position: absolute; bottom: 20px; right: 20px; display: flex; gap: 20px; color: #666; font-size: 13px; }
.stat-item { display: flex; align-items: center; gap: 4px; }
.red { color: #f56c6c; }
.yellow { color: #e6a23c; }
.right-rank { width: 280px; background-color: #f0f2f5; border-radius: 12px; padding: 20px; height: fit-content; }
.rank-title { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 20px; }
.rank-list { display: flex; flex-direction: column; gap: 20px; }
.rank-item { display: flex; align-items: center; cursor: pointer; border-radius: 8px; padding: 6px; }
.rank-item:hover { background: rgba(83, 98, 188, 0.08); }
.rank-num { width: 30px; font-size: 16px; font-weight: bold; color: #333; }
.rank-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.r-name { font-size: 14px; font-weight: bold; color: #333; }
.r-sub { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #666; }
.r-heart { margin-left: 2px; }
.rank-img { width: 40px; height: 40px; border-radius: 6px; object-fit: cover; margin-left: 10px; }
.pagination-row { margin-top: auto; display: flex; justify-content: flex-end; padding-top: 12px; }
</style>
