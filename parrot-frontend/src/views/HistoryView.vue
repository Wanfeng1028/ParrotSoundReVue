<template>
  <div class="history-hub">
    <div class="hub-card">
      <h1>创作历史中心</h1>
      <p>音频导出、教学生成任务和个人声音模型都会在这里归档。</p>
      <div class="hub-actions">
        <el-button type="primary" class="ps-btn ps-btn--primary" @click="$router.push('/audio-record')">查看音频记录</el-button>
        <el-button class="ps-btn ps-btn--secondary" @click="$router.push('/user/history')">查看历史作品</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-hub { min-height: calc(100vh - 60px); display: flex; align-items: center; justify-content: center; background: linear-gradient(180deg, #f5f7ff, #eef1fb); }
.hub-card { background: #fff; border-radius: 24px; padding: 48px; box-shadow: 0 18px 60px rgba(62, 77, 124, 0.12); text-align: center; }
.hub-card h1 { margin: 0 0 12px; color: #36407a; }
.hub-card p { margin: 0 0 24px; color: #5f678e; }
.hub-actions { display: flex; gap: 12px; justify-content: center; }
</style>
