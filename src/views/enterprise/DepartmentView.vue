<template>
  <AppLayout>
    <div class="department-page">
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
      </div>

      <!-- 统计概览 -->
      <div class="dept-stats-grid">
        <div class="dept-stat-card">
          <div class="stat-icon-dept" style="background: #eef2ff; color: #6366f1;">
            <i data-lucide="building-2" style="width: 20px; height: 20px;"></i>
          </div>
          <div class="stat-info-dept">
            <span class="stat-value-dept">{{ totalStats.deptCount }}</span>
            <span class="stat-label-dept">部门总数</span>
          </div>
        </div>
        <div class="dept-stat-card">
          <div class="stat-icon-dept" style="background: #f0fdf4; color: #10b981;">
            <i data-lucide="users" style="width: 20px; height: 20px;"></i>
          </div>
          <div class="stat-info-dept">
            <span class="stat-value-dept">{{ totalStats.accountCount }}</span>
            <span class="stat-label-dept">关联账号</span>
          </div>
        </div>
        <div class="dept-stat-card">
          <div class="stat-icon-dept" style="background: #fef3e2; color: #f59e0b;">
            <i data-lucide="wallet" style="width: 20px; height: 20px;"></i>
          </div>
          <div class="stat-info-dept">
            <span class="stat-value-dept">¥{{ (totalStats.totalQuota / 10000).toFixed(0) }}万</span>
            <span class="stat-label-dept">总配额</span>
          </div>
        </div>
        <div class="dept-stat-card">
          <div class="stat-icon-dept" style="background: #fdf4ff; color: #a855f7;">
            <i data-lucide="trending-up" style="width: 20px; height: 20px;"></i>
          </div>
          <div class="stat-info-dept">
            <span class="stat-value-dept">{{ totalStats.avgUsage }}%</span>
            <span class="stat-label-dept">平均使用率</span>
          </div>
        </div>
      </div>

      <!-- 搜索和筛选 -->
      <div class="search-filter-bar">
        <div class="search-input-wrap">
          <i data-lucide="search" style="width: 16px; height: 16px; color: #9ca3af;"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索部门名称、ID或账号..."
            class="search-input-dept"
          >
        </div>
        <button class="add-dept-btn">
          <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
          新增部门
        </button>
      </div>

      <!-- 部门列表表格 -->
      <div class="dept-table-card">
        <table class="dept-table">
          <thead>
            <tr>
              <th>部门ID</th>
              <th>部门名称</th>
              <th>上级部门</th>
              <th>关联账号数</th>
              <th>已分配(¥)</th>
              <th>已使用(¥)</th>
              <th>剩余(¥)</th>
              <th>使用率</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="dept in pagedDepartments" :key="dept.id">
              <td>{{ dept.id }}</td>
              <td class="dept-name-cell">{{ dept.name }}</td>
              <td>{{ dept.parent }}</td>
              <td>{{ dept.accounts.length }} 个</td>
              <td class="money-cell">¥{{ dept.allocated.toLocaleString() }}</td>
              <td class="money-cell">¥{{ dept.used.toLocaleString() }}</td>
              <td class="money-cell">¥{{ dept.remaining.toLocaleString() }}</td>
              <td>
                <div class="usage-bar-container">
                  <div class="usage-bar-bg">
                    <div
                      class="usage-bar-fill"
                      :style="{ width: (dept.used / dept.allocated * 100) + '%' }"
                      :class="getUsageClass(dept.used / dept.allocated * 100)"
                    ></div>
                  </div>
                  <span class="usage-text">{{ (dept.used / dept.allocated * 100).toFixed(1) }}%</span>
                </div>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="action-btn view-btn" @click="viewDetail(dept)">详情</button>
                  <button class="action-btn edit-btn">编辑</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- 分页器 -->
        <div class="pagination-dept">
          <button
            class="page-btn-dept"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            <i data-lucide="chevron-left" style="width: 14px; height: 14px;"></i>
          </button>
          <button
            v-for="page in totalPages"
            :key="page"
            :class="['page-num-dept', { active: currentPage === page }]"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
          <button
            class="page-btn-dept"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            <i data-lucide="chevron-right" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      </div>

      <!-- 部门详情弹窗 -->
      <Teleport to="body">
        <div v-if="showDetail && selectedDept" class="modal-overlay" @click.self="closeDetail">
          <div class="modal-container-detail">
            <div class="modal-header">
              <h3 class="modal-title">部门详情 - {{ selectedDept.name }}</h3>
              <button class="modal-close-btn" @click="closeDetail">
                <i data-lucide="x" style="width: 18px; height: 18px;"></i>
              </button>
            </div>
            <div class="modal-body">
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">部门ID</span>
                  <span class="detail-value">{{ selectedDept.id }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">部门名称</span>
                  <span class="detail-value">{{ selectedDept.name }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">上级部门</span>
                  <span class="detail-value">{{ selectedDept.parent }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">关联账号数</span>
                  <span class="detail-value">{{ selectedDept.accounts.length }} 个</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">已分配配额</span>
                  <span class="detail-value money-text">¥{{ selectedDept.allocated?.toLocaleString() || 0 }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">已使用</span>
                  <span class="detail-value used-text">¥{{ selectedDept.used?.toLocaleString() || 0 }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">剩余额度</span>
                  <span class="detail-value remain-text">¥{{ selectedDept.remaining?.toLocaleString() || 0 }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">使用率</span>
                  <span class="detail-value">{{ (selectedDept.used / selectedDept.allocated * 100).toFixed(1) }}%</span>
                </div>
              </div>

              <h4 class="detail-section-title">关联账号列表</h4>
              <div class="accounts-list">
                <div v-for="accId in selectedDept.accounts" :key="accId" class="account-tag">
                  账号 #{{ accId }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '../../components/layout/AppLayout.vue'

const router = useRouter()

const tabs = ['概览', '账号管理', '人员管理', '部门管理', '项目管理', '智能路由']
const activeTab = ref('部门管理')
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const departments = ref([
  { id: 201, name: '公司', parent: '-', accounts: ['101','102'], allocated: 150000, used: 112000, remaining: 33000 },
  { id: 202, name: '漫剧部', parent: '公司', accounts: ['103','104'], allocated: 155000, used: 115000, remaining: 34000 },
  { id: 203, name: '电商部', parent: '公司', accounts: ['105','106'], allocated: 115000, used: 80000, remaining: 31000 },
  { id: 204, name: '漫剧1组', parent: '漫剧部', accounts: ['107','108'], allocated: 75000, used: 63000, remaining: 8000 },
  { id: 205, name: '漫剧2组', parent: '漫剧部', accounts: ['109','110'], allocated: 74000, used: 55000, remaining: 15000 },
  { id: 206, name: '电商1组', parent: '电商部', accounts: ['111'], allocated: 30000, used: 20000, remaining: 8000 }
])

const filteredDepartments = computed(() => {
  if (!searchQuery.value.trim()) return departments.value
  const q = searchQuery.value.toLowerCase()
  return departments.value.filter(d =>
    String(d.id).includes(q) ||
    d.name.toLowerCase().includes(q) ||
    d.parent.toLowerCase().includes(q)
  )
})

const totalPages = computed(() => Math.ceil(filteredDepartments.value.length / pageSize.value) || 1)

const pagedDepartments = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredDepartments.value.slice(start, start + pageSize.value)
})

const totalStats = computed(() => ({
  deptCount: departments.value.length,
  accountCount: departments.value.reduce((s, d) => s + d.accounts.length, 0),
  totalQuota: departments.value.reduce((s, d) => s + d.allocated, 0),
  avgUsage: Math.round(departments.value.reduce((s, d) => s + (d.used / d.allocated * 100), 0) / departments.value.length)
}))

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

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

const getUsageClass = (percent) => {
  if (percent >= 90) return 'usage-danger'
  if (percent >= 70) return 'usage-warning'
  return 'usage-safe'
}

const viewDetail = (dept) => {
  selectedDept.value = dept
  showDetail.value = true
}

const showDetail = ref(false)
const selectedDept = ref(null)

const closeDetail = () => {
  showDetail.value = false
  selectedDept.value = null
}

const getTypeBadgeClass = (type) => {
  const map = { '视频': 'type-video', '图片': 'type-image', '文字': 'type-text', '音频': 'type-audio', '数字人': 'type-avatar' }
  return map[type] || 'type-text'
}

onMounted(() => {
  setTimeout(() => {
    if (window.lucide) lucide.createIcons()
  }, 100)
})
</script>

<style scoped>
.department-page {
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

.dept-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.dept-stat-card {
  background: white;
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-xl);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.stat-icon-dept {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-info-dept {
  display: flex;
  flex-direction: column;
}

.stat-value-dept {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label-dept {
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 500;
}

.search-filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: white;
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-xl);
}

.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  max-width: 400px;
  padding: 8px 14px;
  background: #f8fafc;
  border: 1.5px solid var(--border-light);
  border-radius: 10px;
}

.search-input-dept {
  flex: 1;
  border: none;
  outline: none;
  font-size: 13px;
  color: var(--text-primary);
  background: transparent;
}

.add-dept-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}

.add-dept-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.dept-table-card {
  background: white;
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-xl);
  padding: 20px;
  overflow-x: auto;
}

.dept-table {
  width: 100%;
  border-collapse: collapse;
}

.dept-table th {
  padding: 12px 14px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  background: #f8fafc;
  border-bottom: 1.5px solid var(--border-light);
  white-space: nowrap;
}

.dept-table td {
  padding: 14px;
  font-size: 13px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-light);
}

.dept-name-cell {
  font-weight: 600;
  color: var(--primary-color);
}

.money-cell {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.usage-bar-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.usage-bar-bg {
  width: 80px;
  height: 6px;
  background: #f3f4f6;
  border-radius: 3px;
  overflow: hidden;
}

.usage-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.usage-safe {
  background: #10b981;
}

.usage-warning {
  background: #f59e0b;
}

.usage-danger {
  background: #dc2626;
}

.usage-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 40px;
}

.action-buttons {
  display: flex;
  gap: 6px;
}

.action-btn {
  padding: 5px 12px;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-btn {
  background: #eef2ff;
  color: #6366f1;
}

.view-btn:hover {
  background: #ddd6fe;
}

.edit-btn {
  background: #f1f5f9;
  color: var(--text-secondary);
}

.edit-btn:hover {
  background: #e2e8f0;
}

.pagination-dept {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border-light);
}

.page-btn-dept {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1.5px solid var(--border-light);
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn-debt:not(:disabled):hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.page-btn-dept:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-num-dept {
  min-width: 32px;
  height: 32px;
  padding: 0 10px;
  border: 1.5px solid var(--border-light);
  border-radius: 8px;
  background: white;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-num-dept:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.page-num-dept.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container-detail {
  background: #fff;
  border-radius: 16px;
  width: 90%;
  max-width: 700px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.modal-close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s ease;
}

.modal-close-btn:hover {
  background: #f3f4f6;
  color: #111827;
}

.modal-body {
  padding: 24px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.detail-value {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.money-text { color: #111827; }
.used-text { color: #ef4444; }
.remain-text { color: #10b981; }

.detail-section-title {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  margin: 20px 0 12px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.accounts-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.account-tag {
  padding: 6px 14px;
  background: #eff6ff;
  color: #6366f1;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}
</style>