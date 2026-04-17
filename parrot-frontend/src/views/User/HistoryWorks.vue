<template>
  <div class="page-inner">
    <el-tabs v-model="activeTab" class="custom-tabs" @tab-change="load">
      <el-tab-pane label="音频" name="audio"></el-tab-pane>
      <el-tab-pane label="视频" name="video"></el-tab-pane>
      <el-tab-pane label="我的声音" name="voice"></el-tab-pane>
    </el-tabs>

    <div class="toolbar">
      <el-input v-model="searchText" placeholder="输入内容进行搜索" class="gray-search" :prefix-icon="Search" />
      <div class="right-btns">
        <el-button class="tool-btn ps-btn ps-btn--secondary ps-btn--sm" @click="load">刷新</el-button>
      </div>
    </div>

    <div class="works-grid">
      <div class="work-card" v-for="item in filteredWorks" :key="item.id">
        <div class="cover-wrapper">
          <div class="cover-fallback">{{ item.title.slice(0, 1) }}</div>
          <div class="overlay">
            <div class="play-status" @click="play(item.audioUrl)"><el-icon :size="40"><VideoPlay /></el-icon></div>
          </div>
        </div>
        <div class="work-info">
          <div class="w-title">{{ item.title }}</div>
          <div class="w-date">{{ formatDate(item.date) }} 生成</div>
        </div>
      </div>
    </div>

    <el-empty v-if="!filteredWorks.length" description="当前筛选下暂无作品" />

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
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Search, VideoPlay } from "@element-plus/icons-vue";
import { fetchHistory } from "../../api/users";

interface HistoryItem {
  id: string;
  title: string;
  date: string;
  audioUrl: string;
  type: string;
}

const activeTab = ref("audio");
const searchText = ref("");
const worksList = ref<HistoryItem[]>([]);
const page = ref(1);
const pageSize = ref(12);
const total = ref(0);

const load = async () => {
  const response = await fetchHistory(activeTab.value as "audio" | "video" | "voice", page.value, pageSize.value);
  worksList.value = response.data.items.map((item) => ({
    id: item.id,
    title: item.title,
    date: item.date,
    audioUrl: item.audioUrl,
    type: item.type,
  }));
  total.value = response.data.total;
};

const filteredWorks = computed(() =>
  worksList.value.filter((item) => item.title.toLowerCase().includes(searchText.value.toLowerCase())),
);

const play = (audioUrl: string) => {
  const audio = new Audio(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}${audioUrl}`);
  audio.play().catch(() => undefined);
};

const handlePageChange = (nextPage: number) => {
  page.value = nextPage;
  load();
};

const formatDate = (value: string) => new Date(value).toLocaleDateString();

onMounted(() => {
  load();
});
</script>

<style scoped>
.page-inner { padding: 20px 30px; }
:deep(.el-tabs__item) { font-size: 16px; font-weight: bold; color: #333; }
:deep(.el-tabs__item.is-active) { color: #5362bc; }
:deep(.el-tabs__active-bar) { background-color: #5362bc; height: 3px; }
:deep(.el-tabs__nav-wrap::after) { height: 1px; background-color: #eee; }
.toolbar { margin-top: 20px; display: flex; justify-content: space-between; }
.gray-search { width: 240px; }
:deep(.gray-search .el-input__wrapper) { background-color: #f5f5f5; border-radius: 6px; box-shadow: none; }
.tool-btn { min-width: 88px; }
.works-grid { display: flex; gap: 20px; margin-top: 20px; flex-wrap: wrap; min-height: 240px; }
.work-card { width: 180px; }
.cover-wrapper { width: 180px; height: 180px; border-radius: 12px; overflow: hidden; position: relative; cursor: pointer; background: linear-gradient(160deg, #dbe1ff, #aab7ff); }
.cover-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 48px; font-weight: 700; color: #4250af; }
.overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; color: #fff; }
.work-info { margin-top: 10px; }
.w-title { font-weight: bold; font-size: 14px; color: #333; }
.w-date { font-size: 12px; color: #999; margin-top: 4px; }
.pagination-row { margin-top: 24px; display: flex; justify-content: flex-end; }
</style>
