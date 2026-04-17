<template>
  <div class="page-inner">
    <div class="header-title">通知中心</div>
    
    <el-tabs v-model="activeTab" class="custom-tabs">
      <el-tab-pane label="全部消息" name="all"></el-tab-pane>
      <el-tab-pane label="系统公告" name="system"></el-tab-pane>
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
             <span class="n-time">{{ item.time }}</span>
           </div>
           <div class="n-desc">{{ item.desc }}</div>
        </div>
        
        <div class="action-box">
           <el-button link size="small" type="primary">查看详情</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { BellFilled, InfoFilled } from '@element-plus/icons-vue'

const activeTab = ref('all')
const notifList = ref([
  { id: 1, type: 'system', title: '系统维护通知', time: '2025-01-29 10:00', desc: '平台将于今晚凌晨 2:00 进行系统维护，预计耗时 2 小时，请提前保存您的作品。' },
  { id: 2, type: 'info', title: '会员到期提醒', time: '2025-01-28 14:30', desc: '您的会员资格即将于 3 天后到期，请及时续费以保留高级权益。' },
  { id: 3, type: 'system', title: '新功能上线：声音克隆', time: '2025-01-20 09:00', desc: '全新声音克隆功能已上线！只需 30 秒录音，即可复刻您的声音。' },
])
</script>

<style scoped>
.page-inner { padding: 20px 30px; }
.header-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #333; }

/* 复用 Tabs 样式 */
:deep(.el-tabs__item.is-active) { color: #5362bc; }
:deep(.el-tabs__active-bar) { background-color: #5362bc; }

.notif-item {
  display: flex; padding: 20px 0; border-bottom: 1px solid #f0f0f0; gap: 20px;
}
.notif-item:hover { background-color: #fafafa; }

.icon-wrapper {
  width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0;
}
.icon-wrapper.system { background-color: #5362bc; }
.icon-wrapper.info { background-color: #e6a23c; }

.content-box { flex: 1; }
.n-top { display: flex; justify-content: space-between; margin-bottom: 8px; }
.n-title { font-weight: bold; color: #333; font-size: 15px; }
.n-time { font-size: 12px; color: #999; }
.n-desc { font-size: 13px; color: #666; line-height: 1.5; }

.action-box { display: flex; align-items: center; }
</style>