<template>
  <div class="dashboard">
    <div class="welcome">
      <div>
        <h2>管理概览</h2>
        <p>集中查看当前站点的课程、配音和克隆模块使用状态。</p>
      </div>
      <div class="quick-actions">
        <el-button class="ps-btn ps-btn--secondary ps-btn--sm" @click="goToRoute('/dubbing')">查看配音页</el-button>
        <el-button class="ps-btn ps-btn--secondary ps-btn--sm" @click="goToRoute('/teaching')">查看教学页</el-button>
        <el-button class="ps-btn ps-btn--secondary ps-btn--sm" @click="goToRoute('/community')">查看社区页</el-button>
      </div>
    </div>

    <div class="stat-cards">
      <div v-for="item in statCards" :key="item.label" class="card">
        <div class="icon-box" :class="item.tone">{{ item.icon }}</div>
        <div class="text">
          <div class="label">{{ item.label }}</div>
          <div class="num">{{ item.value }}</div>
          <div class="delta">{{ item.delta }}</div>
        </div>
      </div>
    </div>

    <div class="panels">
      <section class="panel">
        <div class="panel__head">
          <h3>模块占比</h3>
          <span>本周有效任务</span>
        </div>
        <div class="ratio-list">
          <div v-for="item in ratioCards" :key="item.label" class="ratio-item">
            <div class="ratio-item__top">
              <strong>{{ item.label }}</strong>
              <span>{{ item.percent }}%</span>
            </div>
            <div class="ratio-track">
              <div class="ratio-track__bar" :style="{ width: `${item.percent}%`, background: item.color }"></div>
            </div>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel__head">
          <h3>最近趋势</h3>
          <span>近 6 天内容生产量</span>
        </div>
        <div class="trend-chart">
          <div v-for="point in trendPoints" :key="point.day" class="trend-point">
            <div class="trend-point__bar-wrap">
              <div class="trend-point__bar" :style="{ height: `${point.value}%` }"></div>
            </div>
            <span>{{ point.day }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

const statCards = [
  { label: "网站浏览量", value: "32,654", delta: "较昨日 +12.4%", tone: "green", icon: "览" },
  { label: "配音导出", value: "1,286", delta: "较昨日 +8.1%", tone: "blue", icon: "音" },
  { label: "教学任务", value: "438", delta: "较昨日 +5.7%", tone: "violet", icon: "课" },
];

const ratioCards = [
  { label: "教育教学", percent: 46, color: "linear-gradient(90deg, #4e5ecd, #7383ff)" },
  { label: "智能配音", percent: 36, color: "linear-gradient(90deg, #67c23a, #8dd35f)" },
  { label: "声音克隆", percent: 18, color: "linear-gradient(90deg, #96d7b8, #b8e9cc)" },
];

const trendPoints = [
  { day: "周一", value: 52 },
  { day: "周二", value: 46 },
  { day: "周三", value: 75 },
  { day: "周四", value: 58 },
  { day: "周五", value: 70 },
  { day: "周六", value: 88 },
];

const goToRoute = (path: string) => {
  router.push(path);
};
</script>

<style scoped>
.dashboard { padding: 20px; }
.welcome {
  background: #fff;
  padding: 20px 24px;
  border-radius: 18px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
}
.welcome h2 { margin: 0; color: #334155; }
.welcome p { margin: 6px 0 0; color: #64748b; }
.quick-actions { display: flex; gap: 12px; flex-wrap: wrap; }
.stat-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; margin-bottom: 20px; }
.card {
  background: #fff;
  padding: 20px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  gap: 16px;
}
.icon-box {
  width: 60px;
  height: 60px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
}
.icon-box.green { background: #e1f3d8; color: #67c23a; }
.icon-box.blue { background: #dbeafe; color: #2563eb; }
.icon-box.violet { background: #ede9fe; color: #7c3aed; }
.label { color: #64748b; font-size: 14px; }
.num { margin-top: 6px; font-size: 28px; font-weight: 700; color: #1e293b; }
.delta { margin-top: 6px; color: #16a34a; font-size: 13px; }
.panels { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
.panel { background: #fff; border-radius: 18px; padding: 20px; }
.panel__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
.panel__head h3 { margin: 0; color: #334155; }
.panel__head span { color: #94a3b8; font-size: 13px; }
.ratio-list { display: flex; flex-direction: column; gap: 16px; }
.ratio-item__top { display: flex; justify-content: space-between; margin-bottom: 8px; color: #475569; }
.ratio-track { width: 100%; height: 12px; border-radius: 999px; background: #eef2ff; overflow: hidden; }
.ratio-track__bar { height: 100%; border-radius: inherit; }
.trend-chart { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 14px; align-items: end; min-height: 240px; }
.trend-point { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.trend-point__bar-wrap {
  width: 100%;
  height: 190px;
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fbff, #eef2ff);
  display: flex;
  align-items: end;
  padding: 10px;
  box-sizing: border-box;
}
.trend-point__bar {
  width: 100%;
  border-radius: 14px;
  background: linear-gradient(180deg, #89a2ff, #4e5ecd);
}
.trend-point span { color: #64748b; font-size: 13px; }

@media (max-width: 960px) {
  .welcome,
  .panels {
    grid-template-columns: 1fr;
    flex-direction: column;
    align-items: flex-start;
  }

  .stat-cards,
  .panels {
    grid-template-columns: 1fr;
  }
}
</style>
