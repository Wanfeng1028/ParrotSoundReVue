<template>
  <div class="public-layout">
    <AppHeader />
    <div class="page">
      <div v-if="viewError" class="page-fallback">
        <div class="page-fallback__card">
          <h2>页面加载异常</h2>
          <p>刚才这个页面渲染失败了，已阻止空白页继续扩散。你可以重新进入当前页面，或先回到首页。</p>
          <div class="page-fallback__actions">
            <el-button class="page-fallback__btn page-fallback__btn--primary" @click="retryCurrentRoute">
              重新加载当前页
            </el-button>
            <el-button class="page-fallback__btn" @click="goHome">
              返回首页
            </el-button>
          </div>
        </div>
      </div>
      <router-view v-else v-slot="{ Component }">
        <component :is="Component" :key="route.fullPath" />
      </router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onErrorCaptured, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppHeader from "../components/AppHeader.vue";

const route = useRoute();
const router = useRouter();
const viewError = ref(false);

watch(
  () => route.fullPath,
  () => {
    viewError.value = false;
  },
);

onErrorCaptured((error) => {
  console.error("Public route render error:", error);
  viewError.value = true;
  return false;
});

const retryCurrentRoute = async () => {
  viewError.value = false;
  await router.replace({
    path: route.fullPath,
    query: { ...route.query, _retry: Date.now().toString() },
  });
};

const goHome = () => {
  viewError.value = false;
  router.push("/home");
};
</script>

<style scoped>
.public-layout {
  min-height: 100vh;
  background: var(--app-bg);
}

.page {
  padding-top: var(--header-height);
  min-height: 100vh;
}

.page-fallback {
  min-height: calc(100vh - var(--header-height));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  background: var(--app-bg);
}

.page-fallback__card {
  width: min(560px, 100%);
  padding: 32px 28px;
  border-radius: 28px;
  background: var(--surface-elevated);
  box-shadow: 0 18px 40px rgba(37, 99, 235, 0.12);
  text-align: center;
}

.page-fallback__card h2 {
  margin: 0;
  font-size: 30px;
  line-height: 1.15;
  background: linear-gradient(135deg, #69b3ff, #2563eb);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.page-fallback__card p {
  margin: 14px 0 0;
  color: var(--text-muted);
  line-height: 1.8;
}

.page-fallback__actions {
  margin-top: 22px;
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.page-fallback__btn.el-button {
  min-width: 172px;
  height: 52px;
  border-radius: 20px;
  border: 1px solid var(--ps-btn-secondary-border);
  color: var(--text-strong);
  background: var(--ps-btn-secondary-bg);
}

.page-fallback__btn--primary.el-button {
  border: none;
  color: #ffffff;
  background: linear-gradient(135deg, #5aaeff, #2563eb);
}
</style>
