<template>
  <div>
    <AppHeader />
    <div class="page">
      <router-view />
    </div>
  </div>
</template>

<script setup lang = "ts">
  import AppHeader from '../components/AppHeader.vue'

</script>
<style scoped>
  /* 在PublicLayout.vue中，
  .page类已经设置了padding-top: 60px来容纳固定导航栏，
  而在HomeView.vue中，.home-banner类又设置了margin-top: 60px，
  这两个间距叠加会导致了顶部白边。 */
.page {
  padding-top: 60px; /* 60 = header 高度 */
}
</style>