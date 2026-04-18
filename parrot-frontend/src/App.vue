<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { initThemeMode } from "./composables/useThemeMode";

onMounted(() => {
  initThemeMode();
});
</script>

<style scoped>
</style>
