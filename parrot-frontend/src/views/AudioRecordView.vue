<template>
  <div class="record-page-container">
    <div class="header-section">
      <div class="page-title-bar">
        <div class="title-text">音频记录</div>
        <div class="header-decoration"></div>
      </div>
      <div class="header-actions">
        <el-input v-model="searchText" placeholder="搜索音频内容..." class="custom-search-input" :prefix-icon="Search" />
        <el-button class="all-btn" @click="loadRecords">刷新</el-button>
      </div>
    </div>

    <div class="card-grid" v-loading="loading">
      <div v-for="item in recordList" :key="item.id" class="record-card">
        <div class="status-badge" :class="item.status">{{ item.status === "processing" ? "处理中" : "已完成" }}</div>
        <div class="content-box">{{ item.text }}</div>

        <div class="card-footer">
          <div class="meta-row">
            <span class="meta-text">创建时间: {{ formatDate(item.createdAt) }}</span>
            <span class="meta-text align-right">音色 ID: {{ item.voiceId || "-" }}</span>
          </div>
          <div class="action-row">
            <button class="btn btn-play" @click="playRecord(item)">播放</button>
            <button class="btn btn-download" @click="downloadRecord(item)">下载</button>
            <button class="btn btn-delete" @click="removeRecord(item.id)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <el-empty v-if="!recordList.length && !loading" description="暂无音频记录" />

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

    <div class="bottom-player" v-if="currentRecord">
      <div class="player-left">
        <div class="p-title">{{ currentRecord.title }}</div>
        <div class="p-voice">音色: {{ currentRecord.voiceId || "默认" }}</div>
      </div>
      <div class="player-center">
        <div class="play-circle-btn" @click="togglePlayer">
          <el-icon><VideoPlay /></el-icon>
        </div>
        <div class="progress-wrapper">
          <el-slider v-model="playProgress" :show-tooltip="false" class="purple-slider" @input="seekRecord" />
          <span class="time-label">{{ playerTimeLabel }}</span>
        </div>
      </div>
      <div class="player-right">
        <el-button class="p-btn-white" @click="downloadRecord(currentRecord)">下载</el-button>
        <el-button class="p-btn-white" @click="currentRecord = null">关闭</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { Search, VideoPlay } from "@element-plus/icons-vue";
import { deleteAudioRecord, fetchAudioRecords } from "../api/dubbing";
import type { DubbingJob } from "../types";

const searchText = ref("");
const playProgress = ref(0);
const loading = ref(false);
const recordList = ref<DubbingJob[]>([]);
const currentRecord = ref<DubbingJob | null>(null);
const playerDuration = ref(0);
const isPlaying = ref(false);
const page = ref(1);
const pageSize = ref(8);
const total = ref(0);

const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
let audioPlayer: HTMLAudioElement | null = null;
let searchTimer: number | null = null;

const loadRecords = async () => {
  loading.value = true;
  try {
    const response = await fetchAudioRecords(searchText.value, page.value, pageSize.value);
    recordList.value = response.data.items;
    total.value = response.data.total;
  } finally {
    loading.value = false;
  }
};

const playRecord = (item: DubbingJob) => {
  currentRecord.value = item;
  if (audioPlayer) {
    audioPlayer.pause();
  }
  audioPlayer = new Audio(`${baseUrl}${item.audioUrl}`);
  audioPlayer.ontimeupdate = () => {
    if (!audioPlayer) return;
    const duration = audioPlayer.duration || 0;
    playerDuration.value = duration;
    playProgress.value = duration ? Math.round((audioPlayer.currentTime / duration) * 100) : 0;
  };
  audioPlayer.onended = () => {
    isPlaying.value = false;
    playProgress.value = 100;
  };
  audioPlayer.play().then(() => {
    isPlaying.value = true;
  }).catch(() => {
    isPlaying.value = false;
    ElMessage.warning("音频暂时无法播放");
  });
};

const togglePlayer = () => {
  if (!audioPlayer || !currentRecord.value) {
    return;
  }

  if (audioPlayer.paused) {
    audioPlayer.play().then(() => {
      isPlaying.value = true;
    }).catch(() => {
      ElMessage.warning("音频暂时无法播放");
    });
    return;
  }

  audioPlayer.pause();
  isPlaying.value = false;
};

const seekRecord = (value: number | number[]) => {
  if (!audioPlayer || Array.isArray(value) || !playerDuration.value) {
    return;
  }
  audioPlayer.currentTime = (value / 100) * playerDuration.value;
};

const downloadRecord = (item: DubbingJob) => {
  window.open(`${baseUrl}${item.audioUrl}`, "_blank");
};

const removeRecord = async (id: number) => {
  await deleteAudioRecord(id);
  recordList.value = recordList.value.filter((item) => item.id !== id);
  total.value = Math.max(0, total.value - 1);
  if (currentRecord.value?.id === id) {
    currentRecord.value = null;
    audioPlayer?.pause();
    audioPlayer = null;
    isPlaying.value = false;
    playProgress.value = 0;
  }
  ElMessage.success("记录已删除");
};

const handlePageChange = (nextPage: number) => {
  page.value = nextPage;
  loadRecords();
};

const formatDate = (value: string) => new Date(value).toLocaleString();
const formatTime = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  const minute = String(Math.floor(safe / 60)).padStart(2, "0");
  const second = String(safe % 60).padStart(2, "0");
  return `${minute}:${second}`;
};

const playerTimeLabel = computed(() => {
  if (!audioPlayer) {
    return currentRecord.value?.status || "--";
  }
  return `${formatTime(audioPlayer.currentTime)} / ${formatTime(playerDuration.value)}`;
});

watch(searchText, () => {
  if (searchTimer) {
    window.clearTimeout(searchTimer);
  }
  searchTimer = window.setTimeout(() => {
    page.value = 1;
    loadRecords();
  }, 300);
});

onBeforeUnmount(() => {
  audioPlayer?.pause();
});

onMounted(() => {
  loadRecords();
});
</script>

<style scoped>
.record-page-container { min-height: calc(100vh - 60px); background-color: #f5f7fa; padding: 20px 40px 100px 40px; position: relative; }
.header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
.title-text { font-size: 24px; font-weight: bold; color: #333; }
.header-decoration { width: 40px; height: 4px; background: #5362bc; margin-top: 8px; border-radius: 2px; }
.header-actions { display: flex; gap: 15px; }
.custom-search-input { width: 300px; }
:deep(.custom-search-input .el-input__wrapper) { background-color: #fff; border-radius: 20px; padding-left: 15px; }
.all-btn { border-radius: 20px; border: 1px solid #dcdfe6; color: #606266; font-weight: 500; }
.card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; min-height: 280px; }
.record-card { background: #fff; border-radius: 12px; padding: 25px; position: relative; box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.03); display: flex; flex-direction: column; height: 220px; }
.record-card::before { content: ""; position: absolute; left: 0; top: 25px; bottom: 25px; width: 4px; background-color: #5362bc; border-radius: 0 4px 4px 0; }
.status-badge { position: absolute; top: 15px; right: 15px; font-size: 12px; padding: 2px 8px; border-radius: 4px; }
.status-badge.processing { color: #409eff; background: #ecf5ff; border: 1px solid #d9ecff; }
.status-badge.completed { color: #67c23a; background: #f0f9eb; border: 1px solid #e1f3d8; }
.content-box { flex: 1; background: #f9fafc; border-radius: 6px; padding: 15px; color: #555; font-size: 14px; line-height: 1.6; margin-top: 10px; margin-bottom: 15px; overflow: auto; }
.card-footer { margin-top: auto; }
.meta-row { display: flex; justify-content: space-between; font-size: 12px; color: #999; margin-bottom: 15px; }
.action-row { display: flex; gap: 12px; }
.btn { padding: 6px 20px; border-radius: 6px; font-size: 13px; cursor: pointer; border: 1px solid transparent; transition: all 0.2s; font-weight: 500; }
.btn-delete { color: #f56c6c; background: #fef0f0; border-color: #fde2e2; }
.btn-play { color: #5362bc; background: #fff; border-color: #5362bc; }
.btn-download { color: #67c23a; background: #fff; border-color: #67c23a; }
.pagination-row { margin-top: 24px; display: flex; justify-content: flex-end; padding-bottom: 12px; }
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
