<template>
  <div class="page-inner">
    <div class="header-title">通知中心</div>
    <el-tabs v-model="activeTab" class="custom-tabs" @tab-change="load">
      <el-tab-pane label="全部消息" name="all"></el-tab-pane>
      <el-tab-pane label="系统公告" name="system"></el-tab-pane>
      <el-tab-pane label="提醒通知" name="info"></el-tab-pane>
    </el-tabs>

    <div class="list-container">
      <div class="notif-item" v-for="item in notifList" :key="item.id">
        <div class="icon-wrapper" :class="item.type">
          <el-icon v-if="item.type === 'system'"><BellFilled /></el-icon>
          <el-icon v-else><InfoFilled /></el-icon>
        </div>

        <div class="content-box">
          <div class="n-top">
            <span class="n-title">{{ item.title }}</span>
            <span class="n-time">{{ formatDate(item.createdAt) }}</span>
          </div>
          <div class="n-desc">{{ item.desc }}</div>
        </div>
      </div>
    </div>

    <el-empty v-if="!notifList.length" description="暂无通知" />

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
import { onMounted, ref } from "vue";
import { BellFilled, InfoFilled } from "@element-plus/icons-vue";
import { fetchNotifications } from "../../api/users";
import type { NotificationItem } from "../../types";

const activeTab = ref("all");
const notifList = ref<NotificationItem[]>([]);
const page = ref(1);
const pageSize = ref(12);
const total = ref(0);

const load = async () => {
  const response = await fetchNotifications(activeTab.value, page.value, pageSize.value);
  notifList.value = response.data.items;
  total.value = response.data.total;
};

const handlePageChange = (nextPage: number) => {
  page.value = nextPage;
  load();
};

const formatDate = (value: string) => new Date(value).toLocaleString();

onMounted(() => {
  load();
});
</script>

<style scoped>
.page-inner { padding: 20px 30px; }
.header-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #333; }
:deep(.el-tabs__item.is-active) { color: #5362bc; }
:deep(.el-tabs__active-bar) { background-color: #5362bc; }
.list-container { min-height: 320px; }
.notif-item { display: flex; padding: 20px 0; border-bottom: 1px solid #f0f0f0; gap: 20px; }
.icon-wrapper { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
.icon-wrapper.system { background-color: #5362bc; }
.icon-wrapper.info { background-color: #e6a23c; }
.content-box { flex: 1; }
.n-top { display: flex; justify-content: space-between; margin-bottom: 8px; }
.n-title { font-weight: bold; color: #333; font-size: 15px; }
.n-time { font-size: 12px; color: #999; }
.n-desc { font-size: 13px; color: #666; line-height: 1.5; }
.pagination-row { margin-top: 24px; display: flex; justify-content: flex-end; }
</style>
