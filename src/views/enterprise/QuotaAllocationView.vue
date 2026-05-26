<template>
  <AppLayout>
    <div class="quota-page">
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
      <div class="quota-stats-grid">
        <div class="quota-stat-card">
          <div class="stat-icon-wrap" style="background: #eef2ff; color: #6366f1;">
            <i data-lucide="wallet" style="width: 20px; height: 20px;"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">¥{{ (totalQuota / 10000).toFixed(1) }}万</span>
            <span class="stat-label">总额度池</span>
          </div>
        </div>
        <div class="quota-stat-card">
          <div class="stat-icon-wrap" style="background: #f0fdf4; color: #10b981;">
            <i data-lucide="check-circle-2" style="width: 20px; height: 20px;"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">¥{{ (allocatedQuota / 10000).toFixed(1) }}万</span>
            <span class="stat-label">已分配</span>
          </div>
        </div>
        <div class="quota-stat-card">
          <div class="stat-icon-wrap" style="background: #fef3c7; color: #d97706;">
            <i data-lucide="clock" style="width: 20px; height: 20px;"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">¥{{ ((totalQuota - allocatedQuota) / 10000).toFixed(1) }}万</span>
            <span class="stat-label">可分配</span>
          </div>
        </div>
        <div class="quota-stat-card">
          <div class="stat-icon-wrap" style="background: #fdf4ff; color: #a855f7;">
            <i data-lucide="users" style="width: 20px; height: 20px;"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ accountList.length }}</span>
            <span class="stat-label">账号数量</span>
          </div>
        </div>
      </div>

      <!-- 额度分配操作栏 -->
      <ProjectHeaderBar
        title="额度分配"
        subtitle="为各账号分配使用额度，支持批量调整和按部门筛选"
        add-label="批量分配"
        @add="openBatchModal"
      >
        <template #extra>
          <button class="save-quota-btn" :disabled="!hasChanges" @click="saveQuotaAllocations">
            <i data-lucide="save" style="width: 16px; height: 16px;"></i>
            保存分配
          </button>
        </template>
      </ProjectHeaderBar>

      <!-- 额度分配表格 -->
      <div class="quota-table-wrapper">
        <div class="table-header-row">
          <h3 class="table-title">账号额度列表（共 {{ filteredAccounts.length }} 个）</h3>
          <div class="header-actions">
            <div class="search-wrap-member">
              <i data-lucide="search" style="width: 16px; height: 16px; color: #9ca3af;"></i>
              <input v-model="searchKeyword" type="text" placeholder="搜索账号ID或人员姓名..." class="search-input-member">
            </div>
            <select v-model="departmentFilter" class="filter-select-member">
              <option value="">全部部门</option>
              <option>公司</option>
              <option>漫剧部</option>
              <option>电商部</option>
              <option>漫剧1组</option>
              <option>漫剧2组</option>
              <option>电商1组</option>
            </select>
          </div>
        </div>

        <table class="quota-table">
          <thead>
            <tr>
              <th>账号ID</th>
              <th>账号名称</th>
              <th>部门</th>
              <th>关联人员</th>
              <th>当前配额(¥)</th>
              <th>调整金额(¥)</th>
              <th>调整后(¥)</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(account, idx) in pagedAccounts" :key="account.id" :class="{ 'row-changed': account._changed }">
              <td class="cell-id">{{ account.id }}</td>
              <td class="cell-name">{{ account.name }}</td>
              <td>{{ account.department }}</td>
              <td>{{ account.personName }}</td>
              <td class="cell-money">{{ account.allocated.toLocaleString() }}</td>
              <td class="cell-adjust">
                <input
                  type="number"
                  v-model.number="account._adjust"
                  placeholder="0"
                  class="adjust-input"
                  @input="onAdjustChange(account)"
                >
              </td>
              <td class="cell-money cell-total">{{ adjustedTotal(account).toLocaleString() }}</td>
              <td><span :class="['status-tag', getAdjustStatusClass(account)]">{{ getAdjustStatusText(account) }}</span></td>
              <td class="cell-action">
                <button class="action-btn reset-btn" @click="resetAdjust(account)" :disabled="!account._changed">重置</button>
                <button class="action-btn apply-btn" @click="applyAdjust(account)" :disabled="!account._adjust || account._adjust === 0">确认</button>
              </td>
            </tr>
          </tbody>
        </table>

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

      <!-- 批量分配弹窗 -->
      <Teleport to="body">
        <div v-if="showBatchModal" class="modal-overlay" @click.self="closeBatchModal">
          <div class="modal-container-add">
            <div class="modal-header">
              <h3 class="modal-title">批量分配额度</h3>
              <button class="modal-close-btn" @click="closeBatchModal">
                <i data-lucide="x" style="width: 18px; height: 18px;"></i>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">目标部门</label>
                <select v-model="batchForm.department" class="form-select">
                  <option value="">全部账号</option>
                  <option>公司</option>
                  <option>漫剧部</option>
                  <option>电商部</option>
                  <option>漫剧1组</option>
                  <option>漫剧2组</option>
                  <option>电商1组</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">调整方式</label>
                <select v-model="batchForm.mode" class="form-select">
                  <option value="add">增加额度</option>
                  <option value="set">设置固定额度</option>
                  <option value="percent">按百分比调整</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">金额/数值（元）</label>
                <input type="number" v-model.number="batchForm.amount" placeholder="请输入金额" class="form-input">
              </div>
              <div class="batch-preview">
                <p class="preview-text">将影响 <strong>{{ batchTargetCount }}</strong> 个账号</p>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" @click="closeBatchModal">取消</button>
              <button class="btn-submit" @click="submitBatch">确认执行</button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '../../components/layout/AppLayout.vue'
import ProjectHeaderBar from '../../components/enterprise/ProjectHeaderBar.vue'
import { useEnterpriseStore } from '../../stores/enterprise'

const router = useRouter()
const enterpriseStore = useEnterpriseStore()

const tabs = ['概览', '额度分配', '账号管理', '人员管理', '部门管理', '项目管理', '智能路由']
const activeTab = ref('额度分配')
const searchKeyword = ref('')
const departmentFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const showBatchModal = ref(false)

const batchForm = ref({
  department: '',
  mode: 'add',
  amount: ''
})

const accountList = computed(() => enterpriseStore.accountList)

const totalQuota = computed(() => 600000)
const allocatedQuota = computed(() => accountList.value.reduce((s, a) => s + a.allocated + (a._adjust || 0), 0))
const hasChanges = computed(() => accountList.value.some(a => a._changed))

const filteredAccounts = computed(() => {
  let result = accountList.value
  if (searchKeyword.value.trim()) {
    const q = searchKeyword.value.toLowerCase()
    result = result.filter(a =>
      String(a.id).includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.personName.toLowerCase().includes(q)
    )
  }
  if (departmentFilter.value) {
    result = result.filter(a => a.department === departmentFilter.value)
  }
  return result
})

const totalPages = computed(() => Math.ceil(filteredAccounts.value.length / pageSize.value) || 1)

const pagedAccounts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredAccounts.value.slice(start, start + pageSize.value)
})

const batchTargetCount = computed(() => {
  if (!batchForm.value.department) return accountList.value.length
  return accountList.value.filter(a => a.department === batchForm.value.department).length
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

const adjustedTotal = (account) => {
  return account.allocated + (account._adjust || 0)
}

const onAdjustChange = (account) => {
  account._changed = (account._adjust !== undefined && account._adjust !== 0)
}

const getAdjustStatusClass = (account) => {
  if (!account._changed) return 'status-neutral'
  const total = adjustedTotal(account)
  if (total > account.allocated) return 'status-increase'
  return 'status-decrease'
}

const getAdjustStatusText = (account) => {
  if (!account._changed) return '未调整'
  const total = adjustedTotal(account)
  if (total > account.allocated) return `+${(total - account.allocated).toLocaleString()}`
  return `${(total - account.allocated).toLocaleString()}`
}

const applyAdjust = (account) => {
  if (!account._adjust || account._adjust === 0) return
  account.allocated += account._adjust
  account._adjust = 0
  account._changed = false
}

const resetAdjust = (account) => {
  account._adjust = 0
  account._changed = false
}

const openBatchModal = () => {
  batchForm.value = { department: '', mode: 'add', amount: '' }
  showBatchModal.value = true
  nextTick(() => {
    if (window.lucide) lucide.createIcons()
  })
}

const closeBatchModal = () => {
  showBatchModal.value = false
}

const submitBatch = () => {
  const targets = batchForm.value.department
    ? accountList.value.filter(a => a.department === batchForm.value.department)
    : accountList.value

  const amount = batchForm.value.amount || 0

  targets.forEach(acc => {
    if (batchForm.value.mode === 'add') {
      acc.allocated += amount
    } else if (batchForm.value.mode === 'set') {
      acc.allocated = amount
    } else if (batchForm.value.mode === 'percent') {
      acc.allocated = Math.round(acc.allocated * (1 + amount / 100))
    }
  })

  showBatchModal.value = false
}

const saveQuotaAllocations = () => {
  accountList.value.forEach(a => { a._changed = false })
  alert('额度分配已保存成功！')
}

onMounted(() => {
  setTimeout(() => {
    if (window.lucide) lucide.createIcons()
  }, 100)
})
</script>

<style scoped>
.quota-page {
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

.quota-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.quota-stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  background: white;
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-xl);
  transition: all 0.25s ease;
}

.quota-stat-card:hover {
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
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.save-quota-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
}

.save-quota-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.save-quota-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quota-table-wrapper {
  display: flex;
  flex-direction: column;
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

.quota-table {
  width: 100%;
  border-collapse: collapse;
}

.quota-table th {
  padding: 12px 14px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  background: #f8fafc;
  border-bottom: 1.5px solid var(--border-light);
  white-space: nowrap;
}

.quota-table td {
  padding: 14px;
  font-size: 13px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-light);
}

.row-changed {
  background: #fffbeb;
}

.cell-id { font-family: monospace; font-weight: 700; }
.cell-name { font-weight: 600; }
.cell-money { font-weight: 600; font-variant-numeric: tabular-nums; }
.cell-total { color: #6366f1; font-weight: 700; }

.adjust-input {
  width: 120px;
  padding: 7px 12px;
  border: 1.5px solid var(--border-light);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  outline: none;
  transition: all 0.2s ease;
}

.adjust-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.status-tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.status-neutral { background: #f3f4f6; color: #9ca3af; }
.status-increase { background: #dcfce7; color: #16a34a; }
.status-decrease { background: #fee2e2; color: #dc2626; }

.cell-action {
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

.reset-btn {
  background: #f1f5f9;
  color: var(--text-secondary);
}
.reset-btn:hover:not(:disabled) { background: #e2e8f0; }
.reset-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.apply-btn {
  background: #eef2ff;
  color: #3b82f6;
}
.apply-btn:hover:not(:disabled) { background: #bfdbfe; }
.apply-btn:disabled { opacity: 0.4; cursor: not-allowed; }

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
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container-add {
  background: #fff;
  border-radius: 16px;
  width: 90%;
  max-width: 480px;
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
  font-size: 17px;
  font-weight: 700;
  color: #111827;
}

.modal-close-btn {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  background: none; border: none; border-radius: 8px;
  cursor: pointer; color: #6b7280; transition: all 0.2s ease;
}
.modal-close-btn:hover { background: #f3f4f6; color: #111827; }

.modal-body { padding: 24px; }

.form-group {
  margin-bottom: 18px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

.form-select, .form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  color: #111827;
  outline: none;
  transition: all 0.2s ease;
}
.form-select:focus, .form-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); }

.batch-preview {
  margin-top: 16px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 10px;
}

.preview-text {
  font-size: 13px;
  color: var(--text-secondary);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel {
  padding: 9px 20px;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-cancel:hover { background: #e5e7eb; }

.btn-submit {
  padding: 9px 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}
.btn-submit:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }
</style>
