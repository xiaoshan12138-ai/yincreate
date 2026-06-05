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
            <select v-model="userStatusFilter" class="filter-select-member status-filter-highlight">
              <option value="current">当前用户</option>
              <option value="history">历史用户</option>
              <option value="all">全体人员</option>
            </select>
            <button class="export-btn">
              <i data-lucide="download" style="width: 14px; height: 14px;"></i>
              导出报表
            </button>
            <button class="settings-btn" @click="openPersonnelSettings">
              <i data-lucide="settings" style="width: 14px; height: 14px;"></i>
              人员设置
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
                <th class="col-user-status">人员状态</th>
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
                <td class="cell-user-status">
                  <span :class="['user-status-badge', `status-${p.userStatus || 'current'}`]">
                    {{ getUserStatusLabel(p.userStatus || 'current') }}
                  </span>
                </td>
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

      <!-- 人员设置弹窗 -->
      <Teleport to="body">
        <div v-if="showSettingsModal" class="modal-overlay" @click.self="closePersonnelSettings">
          <div class="modal-settings-container">
            <div class="modal-header-settings">
              <h3 class="modal-title-settings">
                <i data-lucide="settings" style="width: 20px; height: 20px; margin-right: 8px;"></i>
                人员设置
              </h3>
              <button class="close-modal-btn" @click="closePersonnelSettings">×</button>
            </div>

            <div class="modal-body-settings">
              <!-- 添加人员区域 -->
              <div class="settings-section">
                <h4 class="section-title-settings">
                  <i data-lucide="user-plus" style="width: 16px; height: 16px;"></i>
                  添加新人员
                </h4>
                <div class="add-person-form">
                  <div class="form-row">
                    <div class="form-field">
                      <label class="field-label">姓名 <span class="required">*</span></label>
                      <input
                        type="text"
                        v-model="newPersonForm.name"
                        placeholder="请输入人员姓名"
                        class="field-input"
                      >
                    </div>
                    <div class="form-field">
                      <label class="field-label">部门 <span class="required">*</span></label>
                      <select v-model="newPersonForm.department" class="field-select">
                        <option value="">请选择部门</option>
                        <option value="公司">公司</option>
                        <option value="漫剧部">漫剧部</option>
                        <option value="电商部">电商部</option>
                        <option value="漫剧1组">漫剧1组</option>
                        <option value="漫剧2组">漫剧2组</option>
                        <option value="电商1组">电商1组</option>
                      </select>
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-field">
                      <label class="field-label">状态</label>
                      <select v-model="newPersonForm.status" class="field-select">
                        <option value="active">在职</option>
                        <option value="pending">待入职</option>
                      </select>
                    </div>
                    <div class="form-field field-preview">
                      <label class="field-label">预览 - 人员编号</label>
                      <div class="preview-id-badge">
                        <i data-lucide="hash" style="width: 14px; height: 14px;"></i>
                        {{ previewPersonId || 'P___' }}
                      </div>
                    </div>
                  </div>
                  <button class="btn-add-person" @click="addNewPerson" :disabled="!canAddPerson">
                    <i data-lucide="plus-circle" style="width: 16px; height: 16px;"></i>
                    确认添加
                  </button>
                </div>
              </div>

              <!-- 人员列表管理 -->
              <div class="settings-section">
                <h4 class="section-title-settings">
                  <i data-lucide="users" style="width: 16px; height: 16px;"></i>
                  人员管理
                  <span class="person-count-badge">{{ allPersonnelList.length }} 人</span>
                </h4>

                <div class="search-filter-bar">
                  <input
                    type="text"
                    v-model="settingsSearchKeyword"
                    placeholder="搜索人员..."
                    class="settings-search-input"
                  >
                  <select v-model="settingsStatusFilter" class="settings-filter-select">
                    <option value="all">全部状态</option>
                    <option value="active">在职</option>
                    <option value="inactive">离职</option>
                    <option value="pending">待入职</option>
                  </select>
                </div>

                <div class="personnel-manage-list">
                  <div
                    v-for="person in filteredSettingsPersonnel"
                    :key="person.id"
                    :class="['manage-person-card', `status-${person.status}`]"
                  >
                    <div class="person-main-info">
                      <div class="person-avatar">
                        {{ person.name.charAt(0) }}
                      </div>
                      <div class="person-details">
                        <div class="person-name-row">
                          <span class="person-name">{{ person.name }}</span>
                          <span :class="['status-tag', `tag-${person.status}`]">
                            {{ getStatusLabel(person.status) }}
                          </span>
                        </div>
                        <div class="person-meta">
                          <span class="meta-item">
                            <i data-lucide="hash" style="width: 12px; height: 12px;"></i>
                            {{ person.id }}
                          </span>
                          <span class="meta-item">
                            <i data-lucide="building-2" style="width: 12px; height: 12px;"></i>
                            {{ person.department }}
                          </span>
                          <span v-if="person.accountId" class="meta-item">
                            <i data-lucide="link" style="width: 12px; height: 12px;"></i>
                            账号 #{{ person.accountId }}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="person-actions">
                      <button
                        v-if="person.status === 'inactive'"
                        class="action-btn btn-restore"
                        @click="restorePerson(person)"
                        title="恢复在职"
                      >
                        <i data-lucide="rotate-ccw" style="width: 14px; height: 14px;"></i>
                        恢复
                      </button>
                      <button
                        v-if="person.status !== 'inactive'"
                        class="action-btn btn-remove"
                        @click="removePerson(person)"
                        title="标记离职"
                      >
                        <i data-lucide="user-x" style="width: 14px; height: 14px;"></i>
                        离职
                      </button>
                      <button
                        class="action-btn btn-delete-permanent"
                        @click="deletePersonPermanently(person)"
                        title="彻底删除"
                      >
                        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                      </button>
                    </div>
                  </div>

                  <div v-if="filteredSettingsPersonnel.length === 0" class="empty-state">
                    <i data-lucide="users" style="width: 40px; height: 40px; color: #d1d5db;"></i>
                    <p>暂无匹配的人员记录</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer-settings">
              <div class="footer-stats">
                <span class="stat-text">
                  在职: <strong>{{ activeCount }}</strong> 人 |
                  离职: <strong>{{ inactiveCount }}</strong> 人 |
                  待入职: <strong>{{ pendingCount }}</strong> 人
                </span>
              </div>
              <button class="btn-close-settings" @click="closePersonnelSettings">关闭</button>
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
import { useEnterpriseStore } from '../../stores/enterprise'

const router = useRouter()
const enterpriseStore = useEnterpriseStore()

const tabs = ['概览', '额度分配', '账号管理', '人员管理', '部门管理', '项目管理', '智能路由']
const activeTab = ref('人员管理')
const searchKeyword = ref('')
const departmentFilter = ref('全部')
const statusFilter = ref('全部')
const userStatusFilter = ref('current')
const currentPage = ref(1)
const pageSize = ref(10)
const showDetailModal = ref(false)
const selectedPerson = ref(null)

const showSettingsModal = ref(false)
const newPersonForm = ref({
  name: '',
  department: '',
  status: 'active'
})
const settingsSearchKeyword = ref('')
const settingsStatusFilter = ref('all')

const allPersonnelList = ref([
  { id: 'P001', name: '王开发', department: '公司', status: 'active', userStatus: 'current', accountId: 101 },
  { id: 'P002', name: '李设计', department: '漫剧部', status: 'active', userStatus: 'current', accountId: 102 },
  { id: 'P003', name: '张运营', department: '电商部', status: 'active', userStatus: 'current', accountId: 103 },
  { id: 'P004', name: '赵策划', department: '漫剧1组', status: 'active', userStatus: 'current', accountId: 104 },
  { id: 'P005', name: '陈编辑', department: '漫剧2组', status: 'active', userStatus: 'current', accountId: 105 },
  { id: 'P006', name: '马经理', department: '电商部', status: 'active', userStatus: 'current', accountId: null },
  { id: 'P007', name: '刘助理', department: '公司', status: 'inactive', userStatus: 'history', accountId: 107 },
  { id: 'P008', name: '周专员', department: '电商1组', status: 'active', userStatus: 'current', accountId: null },
  { id: 'P009', name: '吴主管', department: '漫剧部', status: 'inactive', userStatus: 'history', accountId: null },
  { id: 'P010', name: '郑实习生', department: '漫剧1组', status: 'pending', userStatus: 'current', accountId: null }
])

const nextPersonId = computed(() => {
  const maxNum = Math.max(...allPersonnelList.value.map(p => {
    const num = parseInt(p.id.replace('P', ''))
    return isNaN(num) ? 0 : num
  }), 0)
  return `P${String(maxNum + 1).padStart(3, '0')}`
})

const previewPersonId = computed(() => {
  if (newPersonForm.value.name.trim() && newPersonForm.value.department) {
    return nextPersonId.value
  }
  return ''
})

const canAddPerson = computed(() => {
  return newPersonForm.value.name.trim() && newPersonForm.value.department
})

const filteredSettingsPersonnel = computed(() => {
  let result = allPersonnelList.value

  if (settingsSearchKeyword.value.trim()) {
    const q = settingsSearchKeyword.value.toLowerCase()
    result = result.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.department.toLowerCase().includes(q)
    )
  }

  if (settingsStatusFilter.value !== 'all') {
    result = result.filter(p => p.status === settingsStatusFilter.value)
  }

  return result
})

const activeCount = computed(() => allPersonnelList.value.filter(p => p.status === 'active').length)
const inactiveCount = computed(() => allPersonnelList.value.filter(p => p.status === 'inactive').length)
const pendingCount = computed(() => allPersonnelList.value.filter(p => p.status === 'pending').length)

const openPersonnelSettings = () => {
  newPersonForm.value = { name: '', department: '', status: 'active' }
  settingsSearchKeyword.value = ''
  settingsStatusFilter.value = 'all'
  showSettingsModal.value = true
  nextTick(() => {
    if (window.lucide) lucide.createIcons()
  })
}

const closePersonnelSettings = () => {
  showSettingsModal.value = false
}

const addNewPerson = () => {
  if (!canAddPerson.value) return

  const newPerson = {
    id: nextPersonId.value,
    name: newPersonForm.value.name.trim(),
    department: newPersonForm.value.department,
    status: newPersonForm.value.status,
    accountId: null
  }

  allPersonnelList.value.push(newPerson)

  console.log(`✅ 添加新人员:`)
  console.log(`  - 编号: ${newPerson.id}`)
  console.log(`  - 姓名: ${newPerson.name}`)
  console.log(`  - 部门: ${newPerson.department}`)
  console.log(`  - 状态: ${getStatusLabel(newPerson.status)}`)

  alert(`成功添加人员:\n编号: ${newPerson.id}\n姓名: ${newPerson.name}\n部门: ${newPerson.department}`)

  newPersonForm.value = { name: '', department: '', status: 'active' }

  nextTick(() => {
    if (window.lucide) lucide.createIcons()
  })
}

const removePerson = (person) => {
  const confirmed = confirm(`确定要将 "${person.name}" (${person.id}) 标记为离职吗？\n\n注意：该操作为软删除，人员数据将继续保留在系统中。`)

  if (confirmed) {
    person.status = 'inactive'

    console.log(`🚫 人员标记离职: ${person.name} (${person.id})`)
    alert(`${person.name} 已标记为离职状态`)
  }
}

const restorePerson = (person) => {
  const confirmed = confirm(`确定要恢复 "${person.name}" (${person.id}) 为在职状态吗？`)

  if (confirmed) {
    person.status = 'active'

    console.log(`✨ 人员恢复在职: ${person.name} (${person.id})`)
    alert(`${person.name} 已恢复为在职状态`)
  }
}

const deletePersonPermanently = (person) => {
  const confirmed = confirm(`⚠️ 警告：确定要彻底删除 "${person.name}" (${person.id}) 吗？\n\n此操作将永久移除该人员的所有数据，无法恢复！`)

  if (confirmed) {
    const index = allPersonnelList.value.findIndex(p => p.id === person.id)
    if (index > -1) {
      const deleted = allPersonnelList.value.splice(index, 1)[0]

      console.log(`🗑️ 彻底删除人员: ${deleted.name} (${deleted.id})`)
      alert(`已彻底删除人员: ${deleted.name}`)

      nextTick(() => {
        if (window.lucide) lucide.createIcons()
      })
    }
  }
}

const getStatusLabel = (status) => {
  const map = {
    active: '在职',
    inactive: '离职',
    pending: '待入职'
  }
  return map[status] || status
}

const stats = computed(() => {
  return {
    total: allPersonnelList.value.length,
    active: activeCount.value,
    inactive: inactiveCount.value,
    pending: pendingCount.value
  }
})

const personnel = computed(() => enterpriseStore.personnelList)

const filteredPersonnel = computed(() => {
  let result = personnel.value

  if (userStatusFilter.value !== 'all') {
    result = result.filter(p => (p.userStatus || 'current') === userStatusFilter.value)
  }

  if (searchKeyword.value.trim()) {
    const q = searchKeyword.value.toLowerCase()
    result = result.filter(p =>
      String(p.accountId).includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.department.toLowerCase().includes(q)
    )
  }

  if (departmentFilter.value && departmentFilter.value !== '全部') {
    result = result.filter(p => p.department === departmentFilter.value)
  }

  if (statusFilter.value && statusFilter.value !== '全部') {
    const statusMap = { '在职': 'active', '离职': 'inactive', '待入职': 'pending' }
    result = result.filter(p => p.status === statusMap[statusFilter.value])
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

const getUserStatusLabel = (status) => {
  const map = {
    current: '当前用户',
    history: '历史用户'
  }
  return map[status] || status
}

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

.settings-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.settings-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.35);
}

.modal-settings-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90vw;
  max-width: 960px;
  max-height: 85vh;
  background: white;
  border-radius: 16px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.25);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header-settings {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.modal-title-settings {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
}

.modal-body-settings {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
}

.modal-footer-settings {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 28px;
  border-top: 1.5px solid #e5e7eb;
  background: #f9fafb;
}

.footer-stats .stat-text {
  font-size: 13px;
  color: #6b7280;
}

.footer-stats strong {
  color: #111827;
  font-weight: 700;
}

.btn-close-settings {
  padding: 10px 28px;
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}

.btn-close-settings:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(107, 114, 128, 0.3);
}

.settings-section {
  margin-bottom: 28px;
}

.section-title-settings {
  font-size: 17px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 18px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 2.5px solid #e5e7eb;
}

.person-count-badge {
  margin-left: auto;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.add-person-form {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  padding: 22px;
  border-radius: 12px;
  border: 2px solid #bbf7d0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-bottom: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

.field-input,
.field-select {
  padding: 11px 14px;
  border: 1.5px solid #d1d5db;
  border-radius: 10px;
  font-size: 14px;
  color: #111827;
  outline: none;
  transition: all 0.2s ease;
  background: white;
}

.field-input:focus,
.field-select:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
}

.field-preview {
  align-items: flex-end;
}

.preview-id-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 11px 14px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px dashed #f59e0b;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 800;
  color: #92400e;
  letter-spacing: 1px;
}

.btn-add-person {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 13px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
}

.btn-add-person:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
}

.btn-add-person:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.search-filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 18px;
}

.settings-search-input {
  flex: 1;
  padding: 10px 16px;
  border: 1.5px solid #d1d5db;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s ease;
}

.settings-search-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}

.settings-filter-select {
  padding: 10px 16px;
  border: 1.5px solid #d1d5db;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 140px;
}

.settings-filter-select:focus {
  border-color: #667eea;
}

.personnel-manage-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 420px;
  overflow-y: auto;
  padding-right: 8px;
}

.manage-person-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.25s ease;
}

.manage-person-card:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.manage-person-card.status-active {
  border-left: 4px solid #10b981;
}

.manage-person-card.status-inactive {
  border-left: 4px solid #ef4444;
  opacity: 0.65;
}

.manage-person-card.status-pending {
  border-left: 4px solid #f59e0b;
  background: #fffbeb;
}

.person-main-info {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
}

.person-avatar {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  font-weight: 800;
  flex-shrink: 0;
}

.person-details {
  flex: 1;
}

.person-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.person-name {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
}

.status-tag {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 700;
}

.tag-active {
  background: #dcfce7;
  color: #166534;
}

.tag-inactive {
  background: #fee2e2;
  color: #991b1b;
}

.tag-pending {
  background: #fef3c7;
  color: #92400e;
}

.person-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12.5px;
  color: #6b7280;
  font-weight: 500;
}

.person-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 7px 13px;
  border: 1.5px solid;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  background: white;
}

.btn-remove {
  color: #dc2626;
  border-color: #fecaca;
}

.btn-remove:hover {
  background: #fee2e2;
  transform: translateY(-1px);
}

.btn-restore {
  color: #059669;
  border-color: #a7f3d0;
}

.btn-restore:hover {
  background: #d1fae5;
  transform: translateY(-1px);
}

.btn-delete-permanent {
  color: #991b1b;
  border-color: #fca5a5;
}

.btn-delete-permanent:hover {
  background: #fee2e2;
  border-color: #dc2626;
  transform: translateY(-1px);
}

.empty-state {
  text-align: center;
  padding: 48px 20px;
  color: #9ca3af;
}

.empty-state p {
  margin-top: 12px;
  font-size: 15px;
}

.status-filter-highlight {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%) !important;
  border-color: #f59e0b !important;
  color: #92400e !important;
  font-weight: 700 !important;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.25) !important;
}

.status-filter-highlight:focus {
  border-color: #d97706 !important;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15) !important;
}

.col-user-status {
  width: 110px;
}

.cell-user-status {
  text-align: center;
  vertical-align: middle;
}

.user-status-badge {
  display: inline-block;
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
  transition: all 0.25s ease;
}

.user-status-badge.status-current {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  border: 1.5px solid #93c5fd;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.user-status-badge.status-history {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #6b7280;
  border: 1.5px solid #d1d5db;
  box-shadow: 0 2px 8px rgba(107, 114, 128, 0.1);
}

.user-status-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.required {
  color: #ef4444;
}
</style>