<template>
  <div class="page-inner">
    <el-tabs v-model="activeTab" class="custom-tabs" @tab-change="load">
      <el-tab-pane label="我收藏的声音" name="favorite"></el-tab-pane>
      <el-tab-pane label="我喜欢的声音" name="like"></el-tab-pane>
      <el-tab-pane label="谁使用过我" name="use"></el-tab-pane>
    </el-tabs>

    <div class="list-container">
      <div class="interact-item" v-for="item in items" :key="item.id">
        <div class="avatar-group">
          <el-avatar :size="50" :src="item.actorAvatar || undefined">{{ item.actorName.slice(0, 1) }}</el-avatar>
          <div class="badge-icon yellow">
            <el-icon><StarFilled /></el-icon>
          </div>
        </div>

        <div class="info-content">
          <div class="user-name">{{ item.actorName }}</div>
          <div class="action-desc">
            <span>{{ actionText(item.type) }}：{{ item.voiceName }}</span>
            <span class="time">{{ formatDate(item.createdAt) }}</span>
          </div>
        </div>

        <div class="thumb-box">
          <img :src="item.voiceCover || fallbackAvatar" class="thumb-img" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { StarFilled } from "@element-plus/icons-vue";
import fallbackAvatar from "../../assets/images/voice-avatar.png";
import { fetchInteractions } from "../../api/users";
import type { InteractionItem } from "../../types";

const activeTab = ref("favorite");
const items = ref<InteractionItem[]>([]);

const load = async () => {
  const response = await fetchInteractions(activeTab.value);
  items.value = response.data;
};

const actionText = (type: string) => {
  if (type === "favorite") return "收藏了你的声音";
  if (type === "like") return "点赞了你的声音";
  return "使用了你的声音";
};

const formatDate = (value: string) => new Date(value).toLocaleDateString();

onMounted(() => {
  load();
});
</script>

<style scoped>
.page-inner { padding: 20px 30px; }
:deep(.el-tabs__item.is-active) { color: #5362bc; }
:deep(.el-tabs__active-bar) { background-color: #5362bc; }
.list-container { margin-top: 10px; }
.interact-item { display: flex; align-items: center; padding: 20px 0; border-bottom: 1px solid #eee; }
.avatar-group { position: relative; margin-right: 15px; }
.badge-icon { position: absolute; bottom: -5px; right: -5px; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; border: 2px solid #fff; font-size: 12px; background-color: #e6a23c; }
.info-content { flex: 1; }
.user-name { font-size: 14px; font-weight: bold; color: #333; margin-bottom: 5px; }
.action-desc { font-size: 12px; color: #666; }
.time { margin-left: 10px; color: #999; }
.thumb-box { width: 80px; height: 60px; border-radius: 6px; overflow: hidden; }
.thumb-img { width: 100%; height: 100%; object-fit: cover; }
</style>
