<template>
  <AppLayout>
    <div class="enterprise-bi-page">
      <!-- 标签页导航 -->
      <div class="enterprise-tab-bar">
        <div class="tabs-nav">
          <button
            v-for="tab in tabs"
            :key="tab"
            :class="['ent-tab', { active: activeTab === tab }]"
            @click="selectTab(tab)"
          >
            {{ tab }}
          </button>
        </div>
        <div class="time-range-selector">
          <span class="time-label">时间范围:</span>
          <select v-model="timeRange" @change="selectTimeRange(timeRange)" class="time-select">
            <option>近7天</option>
            <option selected>近30天</option>
            <option>本月</option>
          </select>
        </div>
      </div>

      <!-- 资源概览卡片 -->
      <div class="resource-overview-grid">
        <div
          v-for="(resource, index) in resourceOverview"
          :key="index"
          class="resource-card"
        >
          <div class="resource-header">
            <div class="resource-icon" :style="{ background: resource.color + '15', color: resource.color }">
              <i :data-lucide="resource.icon" style="width: 20px; height: 20px;"></i>
            </div>
            <span class="resource-label">{{ resource.label }}</span>
          </div>
          <div class="resource-value-row">
            <span class="resource-value">{{ resource.value }}</span>
            <span class="resource-suffix">{{ resource.suffix }}</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-bg">
              <div
                class="progress-bar-fill"
                :style="{ width: resource.percent + '%', background: resource.color }"
              ></div>
            </div>
            <span class="progress-text">{{ resource.percent }}%</span>
          </div>
        </div>
      </div>

      <!-- KPI指标卡片区 -->
      <div class="kpi-cards-section">
        <h3 class="section-title-bi">核心KPI指标</h3>
        <div class="kpi-cards-grid">
          <div v-for="(kpi, index) in kpiCards" :key="index" class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-title">{{ kpi.title }}</span>
              <div class="kpi-icon-wrap" :style="{ background: index === 0 ? '#eef2ff' : index === 1 ? '#f0fdf4' : index === 2 ? '#fdf4ff' : index === 3 ? '#fef3e2' : '#fff7ed', color: index === 0 ? '#6366f1' : index === 1 ? '#10b981' : index === 2 ? '#a855f7' : index === 3 ? '#f59e0b' : '#ea580c' }">
                <i :data-lucide="kpi.icon" style="width: 18px; height: 18px;"></i>
              </div>
            </div>
            <div class="kpi-value-row">
              <span class="kpi-unit">{{ kpi.unit }}</span>
              <span class="kpi-value">{{ kpi.value.toLocaleString() }}</span>
            </div>
            <div class="kpi-change-row">
              <span :class="['change-badge', kpi.trend]">
                <i :data-lucide="kpi.trend === 'up' ? 'trending-up' : 'trending-down'" style="width: 12px; height: 12px;"></i>
                {{ Math.abs(kpi.change) }}%
              </span>
              <span class="change-text">较上期</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="charts-grid">
        <!-- 消耗趋势图 -->
        <div class="chart-card chart-large">
          <div class="chart-header">
            <h4 class="chart-title">消耗趋势分析</h4>
            <div class="chart-actions">
              <button class="chart-action-btn">导出</button>
            </div>
          </div>
          <div id="trend-chart" class="chart-container"></div>
        </div>

        <!-- 内容生成统计 -->
        <div class="chart-card">
          <div class="chart-header">
            <h4 class="chart-title">内容生成统计</h4>
          </div>
          <div id="content-chart" class="chart-container"></div>
        </div>

        <!-- AI模型使用分布 -->
        <div class="chart-card">
          <div class="chart-header">
            <h4 class="chart-title">AI模型使用分布</h4>
          </div>
          <div id="model-chart" class="chart-container"></div>
        </div>

        <!-- 部门成本分布 -->
        <div class="chart-card">
          <div class="chart-header">
            <h4 class="chart-title">部门成本分布</h4>
          </div>
          <div id="cost-chart" class="chart-container"></div>
        </div>
      </div>

      <!-- 账号池与部门排名 -->
      <div class="bottom-grid">
        <!-- 账号池状态 -->
        <div class="info-card">
          <div class="info-card-header">
            <h4 class="info-card-title">账号池状态</h4>
            <router-link to="/enterprise/member" class="manage-link">管理账号 ›</router-link>
          </div>
          <div class="account-pool-info">
            <div id="account-pool-chart" class="pool-chart"></div>
            <div class="pool-stats">
              <div class="pool-stat-item">
                <span class="pool-stat-label">总账号数</span>
                <span class="pool-stat-value">{{ accountPool.total }}</span>
              </div>
              <div class="pool-stat-item">
                <span class="pool-stat-label">已分配</span>
                <span class="pool-stat-value pool-allocated">{{ accountPool.allocated }}</span>
              </div>
              <div class="pool-stat-item">
                <span class="pool-stat-label">可用</span>
                <span class="pool-stat-value pool-available">{{ accountPool.available }}</span>
              </div>
              <div class="pool-stat-item">
                <span class="pool-stat-label">已回收</span>
                <span class="pool-stat-value pool-recycled">{{ accountPool.recycled }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 部门成本排名 -->
        <div class="info-card info-card-large">
          <div class="info-card-header">
            <h4 class="info-card-title">部门成本排名</h4>
            <router-link to="/enterprise/department" class="manage-link">查看全部 ›</router-link>
          </div>
          <div class="ranking-table">
            <table>
              <thead>
                <tr>
                  <th>排名</th>
                  <th>部门名称</th>
                  <th>账号数</th>
                  <th>总消耗(¥)</th>
                  <th>人均成本(¥)</th>
                  <th>环比变化</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="dept in departmentRanking" :key="dept.rank">
                  <td>
                    <span :class="['rank-badge', 'rank-' + dept.rank]">{{ dept.rank }}</span>
                  </td>
                  <td>{{ dept.name }}</td>
                  <td>{{ dept.accounts }}</td>
                  <td class="cost-cell">¥{{ dept.totalCost.toLocaleString() }}</td>
                  <td>¥{{ dept.avgCost.toLocaleString() }}</td>
                  <td>
                    <span :class="['change-indicator', dept.change > 0 ? 'up' : 'down']">
                      <i :data-lucide="dept.change > 0 ? 'trending-up' : 'trending-down'" style="width: 12px; height: 12px;"></i>
                      {{ Math.abs(dept.change) }}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 部门预算进度 -->
          <div class="budget-progress-section">
            <h5 class="budget-title">部门预算使用情况</h5>
            <div class="budget-items">
              <div v-for="budget in budgetData" :key="budget.name" class="budget-item">
                <div class="budget-header-row">
                  <span class="budget-dept-name">{{ budget.name }}</span>
                  <span class="budget-percent" :class="getBudgetClass(budget.percent)">{{ budget.percent }}%</span>
                </div>
                <div class="budget-bar-bg">
                  <div
                    class="budget-bar-fill"
                    :style="{ width: budget.percent + '%' }"
                    :class="getBudgetClass(budget.percent)"
                  ></div>
                </div>
                <div class="budget-values">
                  <span>已用: ¥{{ budget.used.toLocaleString() }}</span>
                  <span>总额: ¥{{ budget.total.toLocaleString() }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 账号消耗TOP5 -->
        <div class="info-card">
          <div class="info-card-header">
            <h4 class="info-card-title">账号消耗 TOP5</h4>
            <router-link to="/enterprise/member" class="manage-link">查看全部 ›</router-link>
          </div>
          <div class="top-list">
            <div v-for="(account, idx) in accountRanking" :key="idx" class="top-account-item">
              <span :class="['top-rank', 'rank-' + (idx + 1)]">{{ idx + 1 }}</span>
              <div class="top-account-info">
                <span class="top-account-name">{{ account.userName }}</span>
                <span class="top-account-id">{{ account.accountId }}</span>
              </div>
              <div class="top-account-cost">
                <span class="cost-value">¥{{ account.cost.toLocaleString() }}</span>
                <span class="cost-dept">{{ account.dept }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '../../components/layout/AppLayout.vue'

const router = useRouter()

const tabs = ['概览', '账号管理', '人员管理', '部门管理', '项目管理', '智能路由']
const activeTab = ref('概览')
const timeRange = ref('近30天')

const resourceOverview = ref([
  { label: '视频生成时长', value: '128.5', suffix: '/ 200 h', percent: 64.3, icon: 'clock', color: '#6366f1' },
  { label: 'AI积分消耗', value: '85,600', suffix: '/ 120,000', percent: 71.3, icon: 'sparkles', color: '#8b5cf6' },
  { label: '存储空间', value: '23.66', suffix: '/ 100 GB', percent: 23.7, icon: 'hard-drive', color: '#06b6d4' },
  { label: '成员数量', value: '42', suffix: '/ 100', percent: 42, icon: 'users', color: '#10b981' },
  { label: '账号池使用率', value: '42', suffix: '/ 50 个', percent: 84, icon: 'key-round', color: '#f59e0b' }
])

const kpiCards = ref([
  { title: '总消耗额度', value: 198560, unit: '¥', change: 12.5, trend: 'up', icon: 'banknote' },
  { title: '活跃账号数', value: 38, unit: '个', change: 2, trend: 'up', icon: 'users' },
  { title: '生成内容数', value: 1256, unit: '个', change: 8.3, trend: 'up', icon: 'sparkles' },
  { title: '平均单次成本', value: 102.3, unit: '¥', change: -5.2, trend: 'down', icon: 'trending-down' },
  { title: '账号池使用率', value: '42/50', unit: '个', percent: 84, change: 5, trend: 'up', icon: 'key-round' }
])

const accountPool = ref({
  total: 50,
  allocated: 42,
  available: 6,
  recycled: 2
})

const departmentRanking = ref([
  { rank: 1, name: '视频1组', accounts: 12, totalCost: 78500, avgCost: 6542, change: 15.2 },
  { rank: 2, name: '视频2组', accounts: 10, totalCost: 56700, avgCost: 5670, change: 8.5 },
  { rank: 3, name: '视频3组', accounts: 10, totalCost: 126760, avgCost: 12676, change: -2.3 },
  { rank: 4, name: '视频4组', accounts: 10, totalCost: 81000, avgCost: 8100, change: 22.1 }
])

const accountRanking = ref([
  { rank: 1, accountId: 'ACC_ENT001_01', userName: '创作者小明', dept: '视频1组', cost: 30000 },
  { rank: 2, accountId: 'ACC_ENT001_03', userName: '清风徐来', dept: '视频3组', cost: 25000 },
  { rank: 3, accountId: 'ACC_ENT001_07', userName: '银河漫游者', dept: '视频1组', cost: 18500 },
  { rank: 4, accountId: 'ACC_ENT001_05', userName: 'Neon 光影', dept: '视频4组', cost: 15200 },
  { rank: 5, accountId: 'ACC_ENT001_02', userName: '基座大海', dept: '视频2组', cost: 12000 }
])

const budgetData = ref([
  { name: '视频1组', used: 178500, total: 250000, percent: 71.4 },
  { name: '视频2组', used: 112300, total: 200000, percent: 56.2 },
  { name: '视频3组', used: 126760, total: 180000, percent: 70.4 },
  { name: '视频4组', used: 81000, total: 220000, percent: 36.8 }
])

const selectTab = (tab) => {
  activeTab.value = tab
  const routeMap = {
    '概览': '/enterprise/bi',
    '账号管理': '/enterprise/member',
    '人员管理': '/enterprise/personnel',
    '部门管理': '/enterprise/department',
    '项目管理': '/enterprise/project',
    '智能路由': '/enterprise/routing'
  }
  if (routeMap[tab]) {
    router.push(routeMap[tab])
  }
}

const selectTimeRange = (range) => {
  timeRange.value = range
}

const getBudgetClass = (percent) => {
  if (percent >= 95) return 'budget-danger'
  if (percent >= 80) return 'budget-warning'
  return 'budget-safe'
}

const initCharts = () => {
  nextTick(() => {
    initTrendChart()
    initContentChart()
    initModelChart()
    initCostChart()
    initAccountPoolChart()
  })
}

const initTrendChart = () => {
  const chartDom = document.getElementById('trend-chart')
  if (!chartDom || !window.echarts) return

  const chart = window.echarts.init(chartDom)

  const dates = []
  const consumption = []
  const budget = []

  for (let i = 13; i >= 0; i--) {
    const date = new Date(2026, 4, 14 - i)
    dates.push(`${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`)
    consumption.push(Math.floor(Math.random() * 8000) + 3000)
    budget.push(15000)
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['实际消耗', '预算线'],
      bottom: 0
    },
    grid: {
      left: '3%', right: '4%', bottom: '12%', top: '8%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { fontSize: 11, color: '#9ca3af' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: {
        formatter: val => `¥${val / 1000}k`,
        fontSize: 11,
        color: '#9ca3af'
      }
    },
    series: [
      {
        name: '实际消耗',
        type: 'line',
        smooth: true,
        data: consumption,
        areaStyle: {
          color: new window.echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(99, 102, 241, 0.25)' },
            { offset: 1, color: 'rgba(99, 102, 241, 0.02)' }
          ])
        },
        lineStyle: { color: '#6366f1', width: 2.5 },
        itemStyle: { color: '#6366f1' }
      },
      {
        name: '预算线',
        type: 'line',
        data: budget,
        lineStyle: { color: '#f59e0b', width: 1.5, type: 'dashed' },
        itemStyle: { color: '#f59e0b' },
        symbol: 'none'
      }
    ]
  }

  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

const initContentChart = () => {
  const chartDom = document.getElementById('content-chart')
  if (!chartDom || !window.echarts) return

  const chart = window.echarts.init(chartDom)

  const option = {
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['图片生成', '视频生成'],
      bottom: 0
    },
    grid: {
      left: '3%', right: '4%', bottom: '14%', top: '8%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['05-01', '05-03', '05-05', '05-07', '05-09', '05-11', '05-13'],
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { fontSize: 11, color: '#9ca3af' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: { fontSize: 11, color: '#9ca3af' }
    },
    series: [
      {
        name: '图片生成',
        type: 'bar',
        stack: 'total',
        data: [45, 52, 38, 65, 48, 72, 55],
        itemStyle: { color: '#8b5cf6', borderRadius: [4, 4, 0, 0] }
      },
      {
        name: '视频生成',
        type: 'bar',
        stack: 'total',
        data: [28, 35, 42, 38, 45, 32, 48],
        itemStyle: { color: '#06b6d4', borderRadius: [4, 4, 0, 0] }
      }
    ]
  }

  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

const initModelChart = () => {
  const chartDom = document.getElementById('model-chart')
  if (!chartDom || !window.echarts) return

  const chart = window.echarts.init(chartDom)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold' }
      },
      data: [
        { value: 35, name: 'Kling', itemStyle: { color: '#6366f1' } },
        { value: 25, name: 'Hailuo', itemStyle: { color: '#8b5cf6' } },
        { value: 20, name: 'Vidu', itemStyle: { color: '#06b6d4' } },
        { value: 12, name: 'GEM', itemStyle: { color: '#f59e0b' } },
        { value: 8, name: '其他', itemStyle: { color: '#e5e7eb' } }
      ]
    }]
  }

  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

const initCostChart = () => {
  const chartDom = document.getElementById('cost-chart')
  if (!chartDom || !window.echarts) return

  const chart = window.echarts.init(chartDom)

  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '50%'],
      roseType: 'area',
      itemStyle: { borderRadius: 6 },
      data: [
        { value: 78500, name: '视频1组', itemStyle: { color: '#6366f1' } },
        { value: 56700, name: '视频2组', itemStyle: { color: '#8b5cf6' } },
        { value: 126760, name: '视频3组', itemStyle: { color: '#06b6d4' } },
        { value: 81000, name: '视频4组', itemStyle: { color: '#f59e0b' } }
      ]
    }],
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { fontSize: 12 }
    }
  }

  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

const initAccountPoolChart = () => {
  const chartDom = document.getElementById('account-pool-chart')
  if (!chartDom || !window.echarts) return

  const chart = window.echarts.init(chartDom)

  const option = {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['55%', '75%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
      data: [
        { value: 42, name: '已分配', itemStyle: { color: '#10b981' } },
        { value: 6, name: '可用', itemStyle: { color: '#3b82f6' } },
        { value: 2, name: '已回收', itemStyle: { color: '#9ca3af' } }
      ]
    }]
  }

  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

onMounted(() => {
  setTimeout(() => {
    if (window.lucide) lucide.createIcons()
    initCharts()
  }, 100)
})
</script>

<style scoped>
.enterprise-bi-page {
  max-width: 1400px;
}

.enterprise-tab-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: white;
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-xl);
}

.tabs-nav {
  display: flex;
  gap: 8px;
}

.ent-tab {
  padding: 8px 18px;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ent-tab:hover {
  background: #f1f5f9;
  color: var(--text-primary);
}

.ent-tab.active {
  background: var(--primary-color);
  color: white;
}

.time-range-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.time-select {
  padding: 6px 12px;
  border: 1.5px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-primary);
  background: white;
  cursor: pointer;
}

.resource-overview-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.resource-card {
  background: white;
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-xl);
  padding: 20px;
}

.resource-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.resource-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.resource-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.resource-value-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 12px;
}

.resource-value {
  font-size: 28px;
  font-weight: 800;
  color: var(--text-primary);
}

.resource-suffix {
  font-size: 13px;
  color: var(--text-tertiary);
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar-bg {
  flex: 1;
  height: 6px;
  background: #f3f4f6;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 600;
  min-width: 36px;
  text-align: right;
}

.kpi-cards-section {
  margin-bottom: 24px;
}

.section-title-bi {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.kpi-cards-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

.kpi-card {
  background: white;
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-xl);
  padding: 20px;
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.kpi-title {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.kpi-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.kpi-value-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 10px;
}

.kpi-unit {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.kpi-value {
  font-size: 26px;
  font-weight: 800;
  color: var(--text-primary);
}

.kpi-change-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.change-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
}

.change-badge.up {
  background: #dcfce7;
  color: #16a34a;
}

.change-badge.down {
  background: #dcfce7;
  color: #16a34a;
}

.change-text {
  font-size: 12px;
  color: var(--text-tertiary);
}

.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.chart-card {
  background: white;
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-xl);
  padding: 20px;
}

.chart-large {
  grid-row: span 2;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.chart-actions {
  display: flex;
  gap: 8px;
}

.chart-action-btn {
  padding: 6px 14px;
  background: #f1f5f9;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.chart-action-btn:hover {
  background: #e2e8f0;
}

.chart-container {
  width: 100%;
  height: 280px;
}

.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 16px;
}

.info-card {
  background: white;
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-xl);
  padding: 20px;
}

.info-card-large {
  grid-row: span 2;
}

.info-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.info-card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.manage-link {
  font-size: 12px;
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 600;
}

.account-pool-info {
  display: flex;
  gap: 20px;
}

.pool-chart {
  width: 160px;
  height: 160px;
}

.pool-stats {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
}

.pool-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pool-stat-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.pool-stat-value {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);
}

.pool-allocated {
  color: #10b981;
}

.pool-available {
  color: #3b82f6;
}

.pool-recycled {
  color: #9ca3af;
}

.ranking-table {
  overflow-x: auto;
  margin-bottom: 20px;
}

.ranking-table table {
  width: 100%;
  border-collapse: collapse;
}

.ranking-table th {
  padding: 10px 12px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  background: #f8fafc;
  border-bottom: 1.5px solid var(--border-light);
}

.ranking-table td {
  padding: 12px;
  font-size: 13px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-light);
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
}

.rank-1 {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e;
}

.rank-2 {
  background: linear-gradient(135deg, #e5e7eb, #d1d5db);
  color: #374151;
}

.rank-3 {
  background: linear-gradient(135deg, #fed7aa, #fdba74);
  color: #9a3412;
}

.rank-4 {
  background: #f3f4f6;
  color: #6b7280;
}

.cost-cell {
  font-weight: 700;
  color: var(--primary-color);
}

.change-indicator {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  font-weight: 600;
}

.change-indicator.up {
  color: #16a34a;
}

.change-indicator.down {
  color: #dc2626;
}

.budget-progress-section {
  margin-top: 20px;
}

.budget-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 14px;
}

.budget-items {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.budget-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.budget-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.budget-dept-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.budget-percent {
  font-size: 13px;
  font-weight: 700;
}

.budget-safe {
  color: #10b981;
}

.budget-warning {
  color: #f59e0b;
}

.budget-danger {
  color: #dc2626;
}

.budget-bar-bg {
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.budget-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.budget-bar-fill.budget-safe {
  background: #10b981;
}

.budget-bar-fill.budget-warning {
  background: #f59e0b;
}

.budget-bar-fill.budget-danger {
  background: #dc2626;
}

.budget-values {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-tertiary);
}

.top-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.top-account-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 10px;
  background: #f8fafc;
  transition: all 0.2s ease;
}

.top-account-item:hover {
  background: #f1f5f9;
}

.top-rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 800;
  flex-shrink: 0;
}

.top-rank.rank-1 {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e;
}

.top-rank.rank-2 {
  background: linear-gradient(135deg, #e5e7eb, #d1d5db);
  color: #374151;
}

.top-rank.rank-3 {
  background: linear-gradient(135deg, #fed7aa, #fdba74);
  color: #9a3412;
}

.top-rank:not(.rank-1):not(.rank-2):not(.rank-3) {
  background: #f3f4f6;
  color: #6b7280;
}

.top-account-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.top-account-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.top-account-id {
  font-size: 11px;
  color: var(--text-tertiary);
}

.top-account-cost {
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cost-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--primary-color);
}

.cost-dept {
  font-size: 11px;
  color: var(--text-tertiary);
}
</style>