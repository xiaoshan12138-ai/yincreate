<template>
  <AppLayout>
    <div class="member-page">
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

      <!-- 账号池状态 -->
      <div class="pool-status-card">
        <h3 class="pool-title">账号池状态</h3>
        <div class="pool-stats-row">
          <div class="pool-stat-item-member">
            <span class="pool-label">总账号数</span>
            <span class="pool-value">{{ accountPool.total }}</span>
          </div>
          <div class="pool-stat-item-member">
            <span class="pool-label">已分配</span>
            <span class="pool-value pool-green">{{ accountPool.allocated }}</span>
          </div>
          <div class="pool-stat-item-member">
            <span class="pool-label">可用</span>
            <span class="pool-value pool-blue">{{ accountPool.available }}</span>
          </div>
          <div class="pool-stat-item-member">
            <span class="pool-label">已回收</span>
            <span class="pool-value pool-gray">{{ accountPool.recycled }}</span>
          </div>
        </div>
      </div>

      <!-- 项目标题栏 -->
      <ProjectHeaderBar
        title="账号管理"
        subtitle="管理企业内所有账号的配额、状态与使用情况"
        add-label="分配账号"
        @add="openAddModal"
      />

      <!-- 账号列表 -->
      <div class="search-action-bar">
        <div class="table-header-row">
          <h3 class="table-title">账号列表（共 {{ filteredAccounts.length }} 个）</h3>
          <div class="header-actions">
            <div class="search-wrap-member">
              <i data-lucide="search" style="width: 16px; height: 16px; color: #9ca3af;"></i>
              <input v-model="searchKeyword" type="text" placeholder="搜索账号ID或使用人姓名..." class="search-input-member">
            </div>
            <select v-model="departmentFilter" class="filter-select-member">
              <option>全部视频组</option>
              <option>公司</option>
              <option>漫剧部</option>
              <option>电商部</option>
              <option>漫剧1组</option>
              <option>漫剧2组</option>
              <option>电商1组</option>
            </select>
            <select v-model="statusFilter" class="filter-select-member">
              <option>全部状态</option>
              <option>正常</option>
              <option>即将到期</option>
              <option>已过期</option>
            </select>
            <button class="export-btn">
              <i data-lucide="download" style="width: 14px; height: 14px;"></i>
              导出报表
            </button>
          </div>
        </div>

        <!-- 账号列表表格 -->
        <table class="account-table">
          <thead>
            <tr>
              <th>账号ID</th>
              <th>账号性质</th>
              <th>部门</th>
              <th>人员ID</th>
              <th>人员称呼</th>
              <th>累计分配</th>
              <th>累计使用</th>
              <th>剩余额度</th>
              <th>过期额度</th>
              <th>视频</th>
              <th>图片</th>
              <th>文字</th>
              <th>音频</th>
              <th>数字人</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="account in pagedAccounts" :key="account.id">
              <td>{{ account.id }}</td>
              <td><span :class="['nature-badge', getNatureClass(account.nature)]">{{ account.nature }}</span></td>
              <td>{{ account.department }}</td>
              <td>P{{ String(account.id).padStart(3, '0') }}</td>
              <td>{{ account.personName }}</td>
              <td class="money-cell">{{ account.allocated.toLocaleString() }}</td>
              <td class="money-cell text-red">{{ account.used.toLocaleString() }}</td>
              <td class="money-cell text-green">{{ account.remaining.toLocaleString() }}</td>
              <td class="money-cell">0</td>
              <td>{{ Math.floor(Math.random() * 30) + 5 }}</td>
              <td>{{ Math.floor(Math.random() * 20) + 5 }}</td>
              <td>{{ Math.floor(Math.random() * 60) + 10 }}</td>
              <td>{{ Math.floor(Math.random() * 10) + 1 }}</td>
              <td>{{ Math.floor(Math.random() * 5) }}</td>
              <td class="action-buttons">
                <button class="detail-btn" @click="viewAccount(account)">详情</button>
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

      <!-- 账号详情弹窗 -->
      <Teleport to="body">
        <div v-if="showDetailModal && selectedAccount" class="modal-overlay" @click.self="showDetailModal = false">
          <div class="modal-container-detail">
            <div class="modal-header">
              <h3 class="modal-title">账号详情 - {{ selectedAccount.id }}</h3>
              <button class="modal-close-btn" @click="showDetailModal = false">
                <i data-lucide="x" style="width: 18px; height: 18px;"></i>
              </button>
            </div>
            <div class="modal-body">
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">账号ID</span>
                  <span class="detail-value">{{ selectedAccount.id }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">账号性质</span>
                  <span :class="['nature-badge', getNatureClass(selectedAccount.nature)]">{{ selectedAccount.nature }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">所属部门</span>
                  <span class="detail-value">{{ selectedAccount.department }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">关联人员</span>
                  <span class="detail-value">{{ selectedAccount.personName }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">配额</span>
                  <span class="detail-value money-text">¥{{ selectedAccount.allocated?.toLocaleString() || 0 }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">已用</span>
                  <span class="detail-value money-text used-text">¥{{ selectedAccount.used?.toLocaleString() || 0 }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">剩余</span>
                  <span class="detail-value money-text remain-text">¥{{ selectedAccount.remaining?.toLocaleString() || 0 }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">使用率</span>
                  <span class="detail-value">{{ (selectedAccount.used / selectedAccount.allocated * 100).toFixed(1) }}%</span>
                </div>
              </div>

              <h4 class="detail-section-title">最近订单记录</h4>
              <div v-if="selectedAccount.orders && selectedAccount.orders.length > 0" class="orders-table-wrap">
                <table class="orders-table">
                  <thead>
                    <tr>
                      <th>订单ID</th>
                      <th>项目名称</th>
                      <th>类型</th>
                      <th>消耗(¥)</th>
                      <th>模型</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="order in selectedAccount.orders" :key="order.orderId">
                      <td>{{ order.orderId }}</td>
                      <td>{{ order.projectName }}</td>
                      <td><span :class="['type-badge', getTypeBadgeClass(order.type)]">{{ order.type }}</span></td>
                      <td>{{ order.cost }}</td>
                      <td>{{ order.model }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-else class="no-orders">暂无订单记录</p>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- 分配账号弹窗 -->
      <Teleport to="body">
        <div v-if="showAddModal" class="modal-overlay" @click.self="closeAddModal">
          <div class="modal-container-add">
            <div class="modal-header">
              <h3 class="modal-title">分配账号</h3>
              <button class="modal-close-btn" @click="closeAddModal">
                <i data-lucide="x" style="width: 18px; height: 18px;"></i>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">选择账号 <span class="required">*</span></label>
                <select v-model="addForm.accountId" class="form-select" required>
                  <option value="" disabled>请选择要分配的账号</option>
                  <option v-for="account in availableAccounts" :key="account.id" :value="account.id">
                    账号 #{{ account.id }} ({{ account.nature }})
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">账号性质</label>
                <input type="text" :value="selectedAccountNature" class="form-input" readonly disabled>
              </div>

              <div class="form-group">
                <label class="form-label">所属部门</label>
                <select v-model="addForm.department" class="form-select">
                  <option value="">请选择部门</option>
                  <option value="公司">公司</option>
                  <option value="漫剧部">漫剧部</option>
                  <option value="电商部">电商部</option>
                  <option value="漫剧1组">漫剧1组</option>
                  <option value="漫剧2组">漫剧2组</option>
                  <option value="电商1组">电商1组</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">关联人员 <span class="required">*</span></label>
                <select v-model="addForm.personId" class="form-select" @change="onPersonSelect" required>
                  <option value="" disabled>请选择人员或新增人员</option>
                  <optgroup label="已有人员">
                    <option v-for="person in personnelList" :key="person.id" :value="person.id">
                      {{ person.name }} ({{ person.department }})
                    </option>
                  </optgroup>
                  <option value="__new__">+ 新增人员</option>
                </select>
              </div>

              <div v-if="showNewPersonForm" class="form-group new-person-form">
                <label class="form-label"><i data-lucide="user-plus" style="width: 14px; height: 14px; margin-right: 4px;"></i>新增人员信息</label>
                <input
                  type="text"
                  v-model="addForm.newPersonName"
                  placeholder="请输入人员姓名"
                  class="form-input"
                  style="margin-bottom: 8px;"
                >
                <select v-model="addForm.newPersonDepartment" class="form-select">
                  <option value="">请选择所属部门</option>
                  <option value="公司">公司</option>
                  <option value="漫剧部">漫剧部</option>
                  <option value="电商部">电商部</option>
                  <option value="漫剧1组">漫剧1组</option>
                  <option value="漫剧2组">漫剧2组</option>
                  <option value="电商1组">电商1组</option>
                </select>
              </div>

              <div v-if="selectedPersonInfo && !showNewPersonForm" class="form-group person-info-display">
                <label class="form-label">当前绑定信息</label>
                <div class="info-card">
                  <div class="info-row">
                    <span class="info-label">姓名：</span>
                    <span class="info-value">{{ selectedPersonInfo.name }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">部门：</span>
                    <span class="info-value">{{ selectedPersonInfo.department }}</span>
                  </div>
                  <div v-if="selectedPersonInfo.boundAccount" class="info-row warning">
                    <span class="info-label">已绑定账号：</span>
                    <span class="info-value">#{{ selectedPersonInfo.boundAccount }}</span>
                  </div>
                </div>
                <button
                  v-if="selectedPersonInfo.boundAccount"
                  type="button"
                  class="btn-replace-person"
                  @click="replacePersonBinding"
                >
                  <i data-lucide="refresh-cw" style="width: 14px; height: 14px; margin-right: 4px;"></i>
                  替换当前绑定
                </button>
              </div>

              <div class="form-group">
                <label class="form-label">初始配额(¥)</label>
                <input type="number" v-model="addForm.allocated" placeholder="请输入配额金额" class="form-input">
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" @click="closeAddModal">取消</button>
              <button class="btn-submit" @click="submitAddAccount">确认分配</button>
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
const activeTab = ref('账号管理')
const searchKeyword = ref('')
const departmentFilter = ref('全部')
const statusFilter = ref('全部')
const currentPage = ref(1)
const pageSize = ref(10)

const accountPool = ref({
  total: 50,
  allocated: 42,
  available: 6,
  recycled: 2
})

const accounts = ref([
  { id: 101, nature: '超级管理员', department: '公司', personName: '王开发', personId: 'P001', allocated: 50000, used: 32000, remaining: 18000 },
  { id: 102, nature: '公司', department: '公司', personName: '赵老板', personId: 'P002', allocated: 100000, used: 80000, remaining: 15000 },
  { id: 103, nature: '普通', department: '漫剧部', personName: '杜总', personId: 'P003', allocated: 80000, used: 55000, remaining: 22000 },
  { id: 104, nature: '普通', department: '漫剧部', personName: '刘总', personId: 'P004', allocated: 75000, used: 60000, remaining: 12000 },
  { id: 105, nature: '普通', department: '电商部', personName: '张经理', personId: 'P005', allocated: 60000, used: 42000, remaining: 16000 },
  { id: 106, nature: '普通', department: '电商部', personName: '马经理', personId: 'P006', allocated: 55000, used: 38000, remaining: 15000 },
  { id: 107, nature: '普通', department: '漫剧1组', personName: '小关', personId: 'P007', allocated: 40000, used: 35000, remaining: 3000 },
  { id: 108, nature: '普通', department: '漫剧1组', personName: '小李', personId: 'P008', allocated: 35000, used: 28000, remaining: 5000 }
])

const availableAccounts = computed(() => {
  return [
    { id: 201, nature: '普通' },
    { id: 202, nature: '普通' },
    { id: 203, nature: '公司' },
    { id: 204, nature: '普通' },
    { id: 205, nature: '普通' },
    { id: 206, nature: '超级管理员' }
  ]
})

const personnelList = ref([
  { id: 'P001', name: '王开发', department: '公司', boundAccount: 101 },
  { id: 'P002', name: '赵老板', department: '公司', boundAccount: 102 },
  { id: 'P003', name: '杜总', department: '漫剧部', boundAccount: 103 },
  { id: 'P004', name: '刘总', department: '漫剧部', boundAccount: 104 },
  { id: 'P005', name: '张经理', department: '电商部', boundAccount: 105 },
  { id: 'P006', name: '马经理', department: '电商部', boundAccount: null },
  { id: 'P007', name: '小关', department: '漫剧1组', boundAccount: 107 },
  { id: 'P008', name: '小李', department: '漫剧1组', boundAccount: 108 },
  { id: 'P009', name: '小王', department: '电商1组', boundAccount: null },
  { id: 'P010', name: '小张', department: '漫剧2组', boundAccount: null }
])

const filteredAccounts = computed(() => {
  let result = accounts.value

  if (searchKeyword.value.trim()) {
    const q = searchKeyword.value.toLowerCase()
    result = result.filter(a =>
      String(a.id).includes(q) ||
      a.personName.toLowerCase().includes(q) ||
      a.department.toLowerCase().includes(q)
    )
  }

  if (departmentFilter.value !== '全部') {
    result = result.filter(a => a.department === departmentFilter.value)
  }

  return result
})

const totalPages = computed(() => Math.ceil(filteredAccounts.value.length / pageSize.value) || 1)

const pagedAccounts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredAccounts.value.slice(start, start + pageSize.value)
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

const getNatureClass = (nature) => {
  if (nature === '超级管理员') return 'nature-super'
  if (nature === '公司') return 'nature-company'
  return 'nature-normal'
}

const getUsageClass = (percent) => {
  if (percent >= 90) return 'usage-danger'
  if (percent >= 70) return 'usage-warning'
  return 'usage-safe'
}

const getStatusClass = (account) => {
  const percent = account.used / account.allocated * 100
  if (percent >= 95) return 'status-expired'
  if (percent >= 80) return 'status-warning'
  return 'status-active'
}

const getStatusText = (account) => {
  const percent = account.used / account.allocated * 100
  if (percent >= 95) return '已过期'
  if (percent >= 80) return '即将到期'
  return '正常'
}

const viewAccount = (account) => {
  selectedAccount.value = account
  showDetailModal.value = true
  nextTick(() => {
    if (window.lucide) lucide.createIcons()
  })
}

const showDetailModal = ref(false)
const selectedAccount = ref(null)

const showAddModal = ref(false)
const addForm = ref({
  accountId: '',
  nature: '',
  department: '',
  personId: '',
  newPersonName: '',
  newPersonDepartment: '',
  allocated: ''
})

const showNewPersonForm = ref(false)

const selectedAccountNature = computed(() => {
  if (!addForm.value.accountId) return '请先选择账号'
  const account = availableAccounts.value.find(a => a.id === addForm.value.accountId)
  return account ? account.nature : ''
})

const selectedPersonInfo = computed(() => {
  if (!addForm.value.personId || addForm.value.personId === '__new__') return null
  return personnelList.value.find(p => p.id === addForm.value.personId)
})

const openAddModal = () => {
  addForm.value = {
    accountId: '',
    nature: '',
    department: '',
    personId: '',
    newPersonName: '',
    newPersonDepartment: '',
    allocated: ''
  }
  showNewPersonForm.value = false
  showAddModal.value = true
  nextTick(() => {
    if (window.lucide) lucide.createIcons()
  })
}

const closeAddModal = () => {
  showAddModal.value = false
  showNewPersonForm.value = false
}

const onPersonSelect = () => {
  if (addForm.value.personId === '__new__') {
    showNewPersonForm.value = true
  } else {
    showNewPersonForm.value = false
  }
  nextTick(() => {
    if (window.lucide) lucide.createIcons()
  })
}

const replacePersonBinding = () => {
  const confirmed = confirm(`确定要替换 ${selectedPersonInfo.value.name} 的当前绑定账号吗？\n这将解除其与账号 #${selectedPersonInfo.value.boundAccount} 的绑定。`)
  if (confirmed) {
    console.log(`🔄 替换人员绑定: ${selectedPersonInfo.value.name}`)
    alert(`已准备替换 ${selectedPersonInfo.value.name} 的绑定，请完成分配操作`)
  }
}

const submitAddAccount = () => {
  if (!addForm.value.accountId) {
    alert('请选择要分配的账号')
    return
  }

  if (!addForm.value.personId) {
    alert('请选择关联人员')
    return
  }

  let personName = ''
  let personId = ''

  if (addForm.value.personId === '__new__') {
    if (!addForm.value.newPersonName.trim()) {
      alert('请输入新人员姓名')
      return
    }
    if (!addForm.value.newPersonDepartment) {
      alert('请选择新人员的所属部门')
      return
    }

    const newPersonId = `P${String(Date.now()).slice(-3)}`
    personName = addForm.value.newPersonName.trim()
    personId = newPersonId

    personnelList.value.push({
      id: newPersonId,
      name: personName,
      department: addForm.value.newPersonDepartment,
      boundAccount: addForm.value.accountId
    })

    console.log(`✨ 新增人员: ${personName} (${newPersonId})`)
  } else {
    const selectedPerson = personnelList.value.find(p => p.id === addForm.value.personId)
    personName = selectedPerson.name
    personId = selectedPerson.id

    if (selectedPerson.boundAccount) {
      console.log(`🔄 替换绑定: ${personName} 从账号 #${selectedPerson.boundAccount} → #${addForm.value.accountId}`)

      const oldAccount = accounts.value.find(a => a.id === selectedPerson.boundAccount)
      if (oldAccount) {
        oldAccount.personName = null
        oldAccount.personId = null
      }
    }

    selectedPerson.boundAccount = addForm.value.accountId
  }

  const account = availableAccounts.value.find(a => a.id === addForm.value.accountId)
  const allocated = addForm.value.allocated ? parseInt(addForm.value.allocated) : 0

  accounts.value.push({
    id: addForm.value.accountId,
    nature: account.nature,
    department: addForm.value.department || account.nature === '超级管理员' ? '公司' : addForm.value.department,
    personId: personId,
    personName: personName,
    allocated: allocated,
    used: 0,
    remaining: allocated,
    expired: 0,
    video: 0, image: 0, text: 0, audio: 0, avatar: 0,
    orders: []
  })

  const availableIndex = availableAccounts.value.findIndex(a => a.id === addForm.value.accountId)
  if (availableIndex > -1) {
    availableAccounts.value.splice(availableIndex, 1)
  }

  accountPool.value.allocated += 1
  accountPool.value.available = Math.max(0, accountPool.value.total - accountPool.value.allocated - accountPool.value.recycled)

  console.log(`📋 账号分配成功:`)
  console.log(`  - 账号ID: ${addForm.value.accountId}`)
  console.log(`  - 账号性质: ${account.nature}`)
  console.log(`  - 关联人员: ${personName} (${personId})`)
  console.log(`  - 所属部门: ${addForm.value.department}`)
  console.log(`  - 初始配额: ¥${allocated}`)

  showAddModal.value = false
  alert(`账号 #${addForm.value.accountId} 已成功分配给 ${personName}`)
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
.member-page {
  max-width: 1400px;
}

.enterprise-tab-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: white;
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

.pool-status-card {
  background: white;
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-xl);
  padding: 20px;
  margin-bottom: 20px;
}

.pool-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.pool-stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.pool-stat-item-member {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
}

.pool-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.pool-value {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-primary);
}

.pool-green { color: #10b981; }
.pool-blue { color: #3b82f6; }
.pool-gray { color: #9ca3af; }

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

.account-table {
  width: 100%;
  border-collapse: collapse;
}

.account-table th {
  padding: 12px 14px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  background: #f8fafc;
  border-bottom: 1.5px solid var(--border-light);
  white-space: nowrap;
}

.account-table td {
  padding: 14px;
  font-size: 13px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-light);
}

.nature-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.nature-super { background: #fef3c7; color: #92400e; }
.nature-company { background: #dbeafe; color: #1e40af; }
.nature-normal { background: #f1f5f9; color: #475569; }

.money-cell { font-weight: 600; font-variant-numeric: tabular-nums; }

.text-red { color: #ef4444; }

.text-green { color: #10b981; }

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
.usage-safe { background: #10b981; }
.usage-warning { background: #f59e0b; }
.usage-danger { background: #dc2626; }

.usage-text { font-size: 12px; font-weight: 600; color: var(--text-secondary); min-width: 40px; }

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.status-active { background: #dcfce7; color: #16a34a; }
.status-warning { background: #fef3c7; color: #d97706; }
.status-expired { background: #fee2e2; color: #dc2626; }

.action-buttons { display: flex; gap: 6px; }

.detail-btn {
  padding: 5px 14px;
  background: #dbeafe;
  color: #3b82f6;
  border: none;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.detail-btn:hover { background: #bfdbfe; }

.action-btn {
  padding: 5px 12px;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-btn { background: #eef2ff; color: #6366f1; }
.view-btn:hover { background: #bfdbfe; }
.edit-btn { background: #f1f5f9; color: var(--text-secondary); }
.edit-btn:hover { background: #e2e8f0; }

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

.modal-container-detail,
.modal-container-add {
  background: #fff;
  border-radius: 16px;
  width: 90%;
  max-width: 920px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-container-add {
  max-width: 500px;
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

.orders-table-wrap {
  overflow-x: auto;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
}

.orders-table th,
.orders-table td {
  padding: 10px 12px;
  text-align: left;
  font-size: 13px;
  border-bottom: 1px solid #f3f4f6;
}

.orders-table th {
  font-weight: 600;
  color: #6b7280;
  background: #f9fafb;
}

.type-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.type-video { background: #dbeafe; color: #2563eb; }
.type-image { background: #dbeafe; color: #2563eb; }
.type-text { background: #dcfce7; color: #16a34a; }
.type-audio { background: #fef3c7; color: #d97706; }
.type-avatar { background: #fce7f3; color: #db2777; }

.no-orders {
  text-align: center;
  color: #9ca3af;
  padding: 20px;
  font-size: 14px;
}

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

.form-select,
.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  color: #111827;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-select:focus,
.form-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel,
.btn-submit {
  padding: 10px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  border: none;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-submit {
  background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-submit:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
}

.required {
  color: #ef4444;
  margin-left: 2px;
}

.new-person-form {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  padding: 16px;
  border-radius: 10px;
  border: 1.5px solid #bae6fd;
}

.person-info-display {
  background: #fafafa;
  padding: 12px;
  border-radius: 8px;
}

.info-card {
  background: white;
  padding: 14px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-bottom: 10px;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 6px 0;
  font-size: 13px;
}

.info-row:not(:last-child) {
  border-bottom: 1px solid #f3f4f6;
}

.info-label {
  font-weight: 600;
  color: #6b7280;
  min-width: 90px;
  display: inline-block;
}

.info-value {
  color: #111827;
  font-weight: 500;
}

.info-row.warning .info-label {
  color: #f59e0b;
}

.info-row.warning .info-value {
  color: #dc2626;
  font-weight: 700;
}

.btn-replace-person {
  width: 100%;
  padding: 9px 16px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1.5px solid #f59e0b;
  border-radius: 8px;
  color: #92400e;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.btn-replace-person:hover {
  background: linear-gradient(135deg, #fde68a 0%, #fcd34d 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}
</style>