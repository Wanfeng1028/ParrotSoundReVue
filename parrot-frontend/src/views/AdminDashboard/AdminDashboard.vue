<template>
  <div class="dashboard">
    <div class="welcome">
      <h2>Hello, 你好, Leslie Alexander~</h2>
      <p>欢迎使用Parrot Sound管理平台!</p>
    </div>
    <div class="stat-cards">
       <div class="card">
         <div class="icon-box green"><el-icon><View/></el-icon></div>
         <div class="text">
           <div class="label">网站浏览量</div>
           <div class="num">32654</div>
         </div>
       </div>
       </div>
    <div class="charts">
       <div class="chart-box" ref="pieRef"></div>
       <div class="chart-box" ref="lineRef"></div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import * as echarts from 'echarts'

const pieRef = ref(null)
const lineRef = ref(null)

onMounted(() => {
  // 还原饼图颜色：蓝/绿/浅绿
  const pieChart = echarts.init(pieRef.value)
  pieChart.setOption({
    color: ['#4e5ecd', '#67c23a', '#b3e19d'],
    series: [{ type: 'pie', radius: ['40%', '70%'], data: [{value:46, name:'教育'}, {value:36, name:'配音'}, {value:17, name:'克隆'}] }]
  })
  
  // 还原折线图：紫色线条，紫色渐变填充
  const lineChart = echarts.init(lineRef.value)
  lineChart.setOption({
    color: ['#4e5ecd'],
    xAxis: { type: 'category', data: ['周一','周二','周三','周四','周五','周六'] },
    yAxis: { type: 'value' },
    series: [{ 
      type: 'line', smooth: true, data: [200, 180, 300, 220, 280, 400],
      areaStyle: { opacity: 0.2 } 
    }]
  })
})
</script>

<style scoped>
.dashboard { padding: 20px; }
.welcome { background: #fff; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
.welcome h2 { color: #333; margin-bottom: 5px; }
.stat-cards { display: flex; gap: 20px; margin-bottom: 20px; }
.card { flex: 1; background: #fff; padding: 20px; border-radius: 10px; display: flex; align-items: center; gap: 20px; }
.icon-box { width: 60px; height: 60px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
.green { background: #e1f3d8; color: #67c23a; }
.charts { display: flex; gap: 20px; height: 400px; }
.chart-box { flex: 1; background: #fff; border-radius: 10px; padding: 20px; }
</style>