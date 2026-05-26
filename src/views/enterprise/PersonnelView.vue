<template>
  <AppLayout>
    <div class="personnel-page">
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

      <!-- 统计卡片 -->
      <div class="personnel-stats-row">
        <div class="personnel-stat-card stat-total">
          <div class="stat-icon-wrap" style="background: #eef2ff; color: #6366f1;">
            <i data-lucide="users" style="width: 20px; height: 20px;"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.total }}</span>
            <span class="stat-label">总人数</span>
          </div>
        </div>
        <div class="personnel-stat-card stat-active">
          <div class="stat-icon-wrap" style="background: #f0fdf4; color: #10b981;">
            <i data-lucide="user-check" style="width: 20px; height: 20px;"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.active }}</span>
            <span class="stat-label">在职</span>
          </div>
        </div>
        <div class="personnel-stat-card stat-inactive">
          <div class="stat-icon-wrap" style="background: #fef2f2; color: #dc2626;">
            <i data-lucide="user-x" style="width: 20px; height: 20px;"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.inactive }}</span>
            <span class="stat-label">离职</span>
          </div>
        </div>
        <div class="personnel-stat-card stat-pending">
          <div class="stat-icon-wrap" style="background: #fff7ed; color: #ea580c;">
            <i data-lucide="user-plus" style="width: 20px; height: 20px;"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.pending }}</span>
            <span class="stat-label">待入职</span>
          </div>
        </div>
      </div>

      <!-- 人员列表 -->
      <div class="search-action-bar">
        <div class="table-header-row">
          <h3 class="table-title">人员列表（共 {{ filteredPersonnel.length }} 个）</h3>
          <div class="header-actions">
            <div class="search-wrap-member">
              <i data-lucide="search" style="width: 16px; height: 16px; color: #9ca3af;"></i>
              <input v-model="searchKeyword" type="text" placeholder="搜索人员姓名或账号ID..." class="search-input-member">
            </div>
            <select v-model="departmentFilter" class="filter-select-member">
              <option>全部部门</option>
              <option>公司</option>
              <option>漫剧部</option>
              <option>电商部</option>
              <option>漫剧1组</option>
              <option>漫剧2组</option>
              <option>电商1组</option>
            </select>
            <select v-model="statusFilter" class="filter-select-member">
              <option>全部状态</option>
              <option>在职</option>
              <option>离职</option>
              <option>待入职</option>
            </select>
            <button class="export-btn">
              <i data-lucide="download" style="width: 14px; height: 14px;"></i>
              导出报表
            </button>
          </div>
        </div>

        <!-- 人员列表表格 -->
        <div class="table-wrapper-scroll">
          <table class="personnel-table">
            <thead>
              <tr>
                <th class="col-person-id">人员ID</th>
                <th class="col-name">人员称呼</th>
                <th class="col-dept">部门</th>
                <th class="col-account-id">账号ID</th>
                <th class="col-allocated">累计分配</th>
                <th class="col-used">累计使用</th>
                <th class="col-remaining">剩余额度</th>
                <th class="col-expired">过期额度</th>
                <th class="col-video">视频</th>
                <th class="col-image">图片</th>
                <th class="col-text">文字</th>
                <th class="col-audio">音频</th>
                <th class="col-avatar">数字人</th>
                <th class="col-action">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in pagedPersonnel" :key="p.accountId" class="person-row">
                <td class="cell-person-id">{{ p.personId || '-' }}</td>
                <td class="cell-name">{{ p.name }}</td>
                <td class="cell-dept">{{ p.department }}</td>
                <td class="cell-acct-id">{{ p.accountId }}</td>
                <td class="cell-money">{{ formatQuota(p.allocated) }}</td>
                <td class="cell-money cell-used">{{ formatQuota(p.used) }}</td>
                <td class="cell-money cell-remaining">{{ formatQuota(p.remaining) }}</td>
                <td class="cell-money cell-expired">{{ formatQuota(p.expired) }}</td>
                <td class="cell-count">{{ p.video }}</td>
                <td class="cell-count">{{ p.image }}</td>
                <td class="cell-count">{{ p.text }}</td>
                <td class="cell-count">{{ p.audio }}</td>
                <td class="cell-count">{{ p.avatar }}</td>
                <td class="cell-action">
                  <button class="detail-btn" @click="openDetail(p)">详情</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页器 -->
        <div class="pagination-dept">
          <button class="page-btn-dept" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">
            <i data-lucide="chevron-left" style="width: 14px; height: 14px;"></i>
          </button>
          <button v-for="page in totalPages" :key="page" :class="['page-num-dept', { active: currentPage === page }]" @click="goToPage(page)">{{ page }}</button>
          <button class="page-btn-dept" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">
            <i data-lucide="chevron-right" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      </div>

      <!-- 详情弹窗 -->
      <div v-if="showDetailModal && selectedPerson" class="modal-overlay" @click.self="closeDetail">
        <div class="modal-content-personnel">
          <div class="modal-header-personnel">
            <h3 class="modal-title-personnel">人员详情 - {{ selectedPerson.name }}</h3>
            <button class="close-modal-btn" @click="closeDetail">×</button>
          </div>
          <div class="modal-body-personnel">
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">人员ID</span>
                <span class="detail-value">{{ selectedPerson.personId || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">姓名</span>
                <span class="detail-value">{{ selectedPerson.name }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">部门</span>
                <span class="detail-value">{{ selectedPerson.department }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">关联账号</span>
                <span class="detail-value">{{ selectedPerson.accountId }}</span>
              </div>
            </div>

            <h4 class="section-subtitle">配额信息</h4>
            <div class="quota-grid">
              <div class="quota-card">
                <span class="quota-label">累计分配</span>
                <span class="quota-value">¥{{ formatQuota(selectedPerson.allocated).toLocaleString() }}</span>
              </div>
              <div class="quota-card">
                <span class="quota-label">累计使用</span>
                <span class="quota-value">¥{{ formatQuota(selectedPerson.used).toLocaleString() }}</span>
              </div>
              <div class="quota-card">
                <span class="quota-label">剩余额度</span>
                <span class="quota-value">¥{{ formatQuota(selectedPerson.remaining).toLocaleString() }}</span>
              </div>
              <div class="quota-card">
                <span class="quota-label">过期额度</span>
                <span class="quota-value">¥{{ formatQuota(selectedPerson.expired).toLocaleString() }}</span>
              </div>
            </div>

            <h4 class="section-subtitle">生成统计</h4>
            <div class="stats-mini-row">
              <div class="mini-stat"><i data-lucide="video" style="width: 14px; height: 14px;"></i><span>{{ selectedPerson.video }} 视频</span></div>
              <div class="mini-stat"><i data-lucide="image" style="width: 14px; height: 14px;"></i><span>{{ selectedPerson.image }} 图片</span></div>
              <div class="mini-stat"><i data-lucide="file-text" style="width: 14px; height: 14px;"></i><span>{{ selectedPerson.text }} 文字</span></div>
              <div class="mini-stat"><i data-lucide="music" style="width: 14px; height: 14px;"></i><span>{{ selectedPerson.audio }} 音频</span></div>
              <div class="mini-stat"><i data-lucide="user-circle" style="width: 14px; height: 14px;"></i><span>{{ selectedPerson.avatar }} 数字人</span></div>
            </div>

            <h4 class="section-subtitle">最近订单记录</h4>
            <div class="orders-list">
              <div v-for="order in selectedPerson.orders" :key="order.orderId" class="order-item">
                <span class="order-type-badge" :class="'type-' + order.type.toLowerCase()">{{ order.type }}</span>
                <span class="order-cost">¥{{ order.cost }}</span>
                <span class="order-model">{{ order.model }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '../../components/layout/AppLayout.vue'
import { useEnterpriseStore } from '../../stores/enterprise'

const router = useRouter()
const enterpriseStore = useEnterpriseStore()

const tabs = ['概览', '额度分配', '账号管理', '人员管理', '部门管理', '项目管理', '智能路由']
const activeTab = ref('人员管理')
const searchKeyword = ref('')
const departmentFilter = ref('全部')
const statusFilter = ref('全部')
const currentPage = ref(1)
const pageSize = ref(10)
const showDetailModal = ref(false)
const selectedPerson = ref(null)

const stats = computed(() => {
  const list = enterpriseStore.personnelList
  return {
    total: list.length,
    active: list.length - 3,
    inactive: 3,
    pending: 1
  }
})

const personnel = computed(() => enterpriseStore.personnelList)

const filteredPersonnel = computed(() => {
  let result = personnel.value

  if (searchKeyword.value.trim()) {
    const q = searchKeyword.value.toLowerCase()
    result = result.filter(p =>
      String(p.accountId).includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.department.toLowerCase().includes(q)
    )
  }

  return result
})

const totalPages = computed(() => Math.ceil(filteredPersonnel.value.length / pageSize.value) || 1)

const pagedPersonnel = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredPersonnel.value.slice(start, start + pageSize.value)
})

const selectTab = (tab) => {
  activeTab.value = tab
  const routeMap = {
    '概览': '/enterprise/bi',
    '额度分配': '/enterprise/quota',
    '账号管理': '/enterprise/member',
    '人员管理': '/enterprise/personnel',
    '部门管理': '/enterprise/department',
    '项目管理': '/enterprise/project',
    '智能路由': '/enterprise/routing'
  }
  if (routeMap[tab]) router.push(routeMap[tab])
}

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

const formatQuota = (v) => v !== null && v !== undefined ? v : '/'

const openDetail = (person) => {
  selectedPerson.value = person
  showDetailModal.value = true
  nextTick(() => {
    if (window.lucide) lucide.createIcons()
  })
}

const closeDetail = () => {
  showDetailModal.value = false
  selectedPerson.value = null
}

onMounted(() => {
  setTimeout(() => {
    if (window.lucide) lucide.createIcons()
  }, 100)
})
</script>

<style scoped>
.personnel-page {
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
  position: relative;
}
.ent-tab:hover { color: #3b82f6; }
.ent-tab.active { color: #3b82f6; }
.ent-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 2.5px;
  background: #3b82f6;
  border-radius: 2px;
}

.personnel-stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.personnel-stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  background: white;
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-xl);
  transition: all 0.25s ease;
}

.personnel-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
}

.stat-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.search-action-bar {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
  padding: 24px;
  background: white;
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-xl);
}

.table-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.table-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-wrap-member {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 240px;
  padding: 8px 14px;
  background: #f8fafc;
  border: 1.5px solid var(--border-light);
  border-radius: 10px;
}

.search-input-member {
  flex: 1;
  border: none;
  outline: none;
  font-size: 13px;
  color: var(--text-primary);
  background: transparent;
}

.filter-select-member {
  padding: 8px 14px;
  border: 1.5px solid var(--border-light);
  border-radius: 10px;
  font-size: 13px;
  color: var(--text-primary);
  background: white;
  cursor: pointer;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  border: 1.5px solid var(--border-light);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.export-btn:hover {
  background: #f8fafc;
}

.table-wrapper-scroll {
  overflow-x: auto;
  margin-bottom: 20px;
}

.personnel-table {
  width: 100%;
  min-width: 1200px;
  border-collapse: collapse;
}

.personnel-table th {
  padding: 12px 10px;
  text-align: left;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-secondary);
  background: #f8fafc;
  border-bottom: 1.5px solid var(--border-light);
  white-space: nowrap;
}

.personnel-table td {
  padding: 13px 10px;
  font-size: 12.5px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-light);
  white-space: nowrap;
}

.cell-person-id, .cell-acct-id { font-family: monospace; font-weight: 600; }
.cell-name { font-weight: 600; }
.cell-money { font-weight: 600; font-variant-numeric: tabular-nums; }
.cell-used { color: #dc2626; }
.cell-remaining { color: #059669; }
.cell-expired { color: #9ca3af; }
.cell-count { text-align: center; font-variant-numeric: tabular-nums; }

.detail-btn {
  padding: 5px 14px;
  background: #eef2ff;
  color: #3b82f6;
  border: none;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.detail-btn:hover { background: #bfdbfe;}

.pagination-dept {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
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

.page-btn-dept:not(:disabled):hover { border-color: var(--primary-color); color: var(--primary-color); }
.page-btn-dept:disabled { opacity: 0.4; cursor: not-allowed; }

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

.page-num-dept:hover { border-color: var(--primary-color); color: var(--primary-color); }
.page-num-dept.active { background: var(--primary-color); color: white; border-color: var(--primary-color); }

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
  backdrop-filter: blur(4px);
}

.modal-content-personnel {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 920px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.modal-header-personnel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
}

.modal-title-personnel {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
}

.close-modal-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.close-modal-btn:hover { background: #e5e7eb; color: var(--text-primary); }

.modal-body-personnel {
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
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 10px;
}

.detail-label {
  font-size: 11.5px;
  color: var(--text-secondary);
  font-weight: 500;
}

.detail-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.section-subtitle {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
  margin-top: 20px;
}

.quota-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.quota-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  background: #f8fafc;
  border-radius: 10px;
  text-align: center;
}

.quota-label {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 500;
}

.quota-value {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-primary);
}

.stats-mini-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.mini-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #f8fafc;
  border-radius: 8px;
}

.order-type-badge {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}
.type-视频 { background: #dbeafe; color: #2563eb; }
.type-图片 { background: #dcfce7; color: #16a34a; }
.type-文字 { background: #fef3c7; color: #d97706; }
.type-音频 { background: #ede9fe; color: #7c3aed; }
.type-数字人 { background: #fce7f3; color: #db2777; }

.order-cost { font-weight: 700; color: var(--text-primary); flex: 1; }
.order-model { font-size: 11.5px; color: var(--text-secondary); background: white; padding: 3px 8px; border-radius: 4px; }
</style>