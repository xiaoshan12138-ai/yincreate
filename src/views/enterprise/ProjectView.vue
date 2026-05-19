<template>
  <AppLayout>
    <div class="project-page">
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

      <!-- 项目标题栏 -->
      <div class="project-header-bar">
        <div class="project-header-left">
          <h2 class="project-title">项目管理</h2>
          <p class="project-subtitle">项目制协作管理中心 - 管理项目进度与资源分配</p>
        </div>
        <button class="add-project-btn">
          <i data-lucide="plus" style="width: 15px; height: 15px;"></i>
          新建项目
        </button>
      </div>

      <!-- 统计卡片 -->
      <div class="project-stats-row">
        <div class="proj-stat-card proj-stat-total">
          <div class="proj-stat-icon" style="background: #eef2ff; color: #6366f1;">
            <i data-lucide="folder-kanban" style="width: 20px; height: 20px;"></i>
          </div>
          <div class="proj-stat-info">
            <span class="proj-stat-label">全部项目</span>
            <span class="proj-stat-value">{{ stats.total }}</span>
          </div>
        </div>
        <div class="proj-stat-card proj-stat-ongoing">
          <div class="proj-stat-icon" style="background: #dbeafe; color: #2563eb;">
            <i data-lucide="play-circle" style="width: 20px; height: 20px;"></i>
          </div>
          <div class="proj-stat-info">
            <span class="proj-stat-label">进行中</span>
            <span class="proj-stat-value">{{ stats.ongoing }}</span>
          </div>
        </div>
        <div class="proj-stat-card proj-stat-planning">
          <div class="proj-stat-icon" style="background: #fef3c7; color: #d97706;">
            <i data-lucide="clipboard-list" style="width: 20px; height: 20px;"></i>
          </div>
          <div class="proj-stat-info">
            <span class="proj-stat-label">规划中</span>
            <span class="proj-stat-value">{{ stats.planning }}</span>
          </div>
        </div>
        <div class="proj-stat-card proj-stat-completed">
          <div class="proj-stat-icon" style="background: #dcfce7; color: #16a34a;">
            <i data-lucide="check-circle-2" style="width: 20px; height: 20px;"></i>
          </div>
          <div class="proj-stat-info">
            <span class="proj-stat-label">已完成</span>
            <span class="proj-stat-value">{{ stats.completed }}</span>
          </div>
        </div>
        <div class="proj-stat-card proj-stat-overbudget">
          <div class="proj-stat-icon" style="background: #fee2e2; color: #dc2626;">
            <i data-lucide="alert-triangle" style="width: 20px; height: 20px;"></i>
          </div>
          <div class="proj-stat-info">
            <span class="proj-stat-label">超支预警</span>
            <span class="proj-stat-value">{{ stats.overbudget }}</span>
          </div>
        </div>
      </div>

      <!-- 搜索和操作栏 -->
      <div class="search-action-bar">
        <div class="search-wrap-member">
          <i data-lucide="search" style="width: 16px; height: 16px; color: #9ca3af;"></i>
          <input v-model="searchKeyword" type="text" placeholder="搜索项目ID或名称..." class="search-input-member">
        </div>
        <div class="filter-group">
          <select v-model="departmentFilter" class="filter-select-member">
            <option>全部部门</option>
            <option>公司</option>
            <option>漫剧部</option>
            <option>电商部</option>
          </select>
          <select v-model="statusFilter" class="filter-select-member">
            <option>全部状态</option>
            <option>进行中</option>
            <option>已完成</option>
            <option>超支预警</option>
          </select>
        </div>
        <button class="export-btn">
          <i data-lucide="download" style="width: 14px; height: 14px;"></i>
          导出报表
        </button>
      </div>

      <!-- 项目列表表格 -->
      <div class="account-table-card">
        <h3 class="table-title">项目列表（共 {{ filteredProjects.length }} 个）</h3>

        <div class="table-wrapper-scroll">
          <table class="personnel-table">
            <thead>
              <tr>
                <th class="col-proj-id">项目ID</th>
                <th class="col-proj-name">项目名称</th>
                <th class="col-start-date">立项时间</th>
                <th class="col-end-date">结项时间</th>
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
              <tr v-for="proj in pagedProjects" :key="proj.projectId" class="proj-row">
                <td class="cell-proj-id">{{ proj.projectId }}</td>
                <td class="cell-proj-name">{{ proj.name }}</td>
                <td class="cell-date">{{ proj.startDate || '-' }}</td>
                <td class="cell-date">{{ proj.endDate || '-' }}</td>
                <td class="cell-money">{{ formatQuota(proj.allocated) }}</td>
                <td class="cell-money cell-used">{{ formatQuota(proj.used) }}</td>
                <td class="cell-money cell-remaining">{{ formatQuota(proj.remaining) }}</td>
                <td class="cell-money cell-expired">{{ formatQuota(proj.expired) }}</td>
                <td class="cell-count">{{ proj.video }}</td>
                <td class="cell-count">{{ proj.image }}</td>
                <td class="cell-count">{{ proj.text }}</td>
                <td class="cell-count">{{ proj.audio }}</td>
                <td class="cell-count">{{ proj.avatar }}</td>
                <td class="cell-action">
                  <button class="detail-btn" @click="openDetail(proj)">详情</button>
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
      <div v-if="showDetailModal && selectedProject" class="modal-overlay" @click.self="closeDetail">
        <div class="modal-content-personnel">
          <div class="modal-header-personnel">
            <h3 class="modal-title-personnel">项目详情 - {{ selectedProject.name }}</h3>
            <button class="close-modal-btn" @click="closeDetail">×</button>
          </div>
          <div class="modal-body-personnel">
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">项目ID</span>
                <span class="detail-value">{{ selectedProject.projectId }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">项目名称</span>
                <span class="detail-value">{{ selectedProject.name }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">立项时间</span>
                <span class="detail-value">{{ selectedProject.startDate || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">结项时间</span>
                <span class="detail-value">{{ selectedProject.endDate || '进行中' }}</span>
              </div>
            </div>

            <h4 class="section-subtitle">配额信息</h4>
            <div class="quota-grid">
              <div class="quota-card">
                <span class="quota-label">累计分配</span>
                <span class="quota-value">¥{{ formatQuota(selectedProject.allocated).toLocaleString() }}</span>
              </div>
              <div class="quota-card">
                <span class="quota-label">累计使用</span>
                <span class="quota-value">¥{{ formatQuota(selectedProject.used).toLocaleString() }}</span>
              </div>
              <div class="quota-card">
                <span class="quota-label">剩余额度</span>
                <span class="quota-value">¥{{ formatQuota(selectedProject.remaining).toLocaleString() }}</span>
              </div>
              <div class="quota-card">
                <span class="quota-label">过期额度</span>
                <span class="quota-value">¥{{ formatQuota(selectedProject.expired).toLocaleString() }}</span>
              </div>
            </div>

            <h4 class="section-subtitle">生成统计</h4>
            <div class="stats-mini-row">
              <div class="mini-stat"><i data-lucide="video" style="width: 14px; height: 14px;"></i><span>{{ selectedProject.video }} 视频</span></div>
              <div class="mini-stat"><i data-lucide="image" style="width: 14px; height: 14px;"></i><span>{{ selectedProject.image }} 图片</span></div>
              <div class="mini-stat"><i data-lucide="file-text" style="width: 14px; height: 14px;"></i><span>{{ selectedProject.text }} 文字</span></div>
              <div class="mini-stat"><i data-lucide="music" style="width: 14px; height: 14px;"></i><span>{{ selectedProject.audio }} 音频</span></div>
              <div class="mini-stat"><i data-lucide="user-circle" style="width: 14px; height: 14px;"></i><span>{{ selectedProject.avatar }} 数字人</span></div>
            </div>

            <h4 class="section-subtitle">关联订单记录</h4>
            <div class="orders-list">
              <div v-for="order in selectedProject.orders" :key="order.orderId" class="order-item">
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '../../components/layout/AppLayout.vue'

const router = useRouter()

const tabs = ['概览', '账号管理', '人员管理', '部门管理', '项目管理', '智能路由']
const activeTab = ref('项目管理')
const searchKeyword = ref('')
const departmentFilter = ref('全部')
const statusFilter = ref('全部')
const currentPage = ref(1)
const pageSize = ref(10)
const showDetailModal = ref(false)
const selectedProject = ref(null)

const stats = ref({
  total: 6,
  ongoing: 2,
  planning: 1,
  completed: 1,
  overbudget: 1
})

const projects = ref([
  { projectId: 301, name: '品牌宣传片', startDate: '2025-03-01', endDate: '', allocated: 80000, used: 55000, remaining: 22000, expired: 3000, video: 25, image: 12, text: 40, audio: 5, avatar: 3, orders: [{ orderId: 'ORD-20250501', type: '视频', cost: '¥2,500', model: 'Sora' }, { orderId: 'ORD-20250428', type: '图片', cost: '¥800', model: 'DALL-E 3' }, { orderId: 'ORD-20250420', type: '数字人', cost: '¥1,200', model: 'HeyGen' }] },
  { projectId: 302, name: '产品展示视频', startDate: '2025-04-15', endDate: '', allocated: 70000, used: 57000, remaining: 11000, expired: 2000, video: 15, image: 11, text: 65, audio: 6, avatar: 4, orders: [{ orderId: 'ORD-20250502', type: '文字', cost: '¥350', model: 'GPT-4o' }, { orderId: 'ORD-20250429', type: '视频', cost: '¥1,800', model: 'Runway Gen-3' }] },
  { projectId: 303, name: '漫剧A制作', startDate: '2025-02-10', endDate: '2025-06-30', allocated: 95000, used: 72000, remaining: 18000, expired: 5000, video: 38, image: 22, text: 65, audio: 8, avatar: 5, orders: [{ orderId: 'ORD-20250503', type: '视频', cost: '¥3,200', model: 'Kling' }, { orderId: 'ORD-20250427', type: '音频', cost: '¥600', model: 'ElevenLabs' }, { orderId: 'ORD-20250418', type: '图片', cost: '¥1,100', model: 'Midjourney v6' }] },
  { projectId: 304, name: '漫剧B制作', startDate: '2025-05-01', endDate: '', allocated: 60000, used: 43000, remaining: 14000, expired: 3000, video: 19, image: 16, text: 70, audio: 8, avatar: 5, orders: [{ orderId: 'ORD-20250505', type: '文字', cost: '¥280', model: 'Claude 3.5' }, { orderId: 'ORD-20250426', type: '视频', cost: '¥2,100', model: 'Pika 2.0' }] },
  { projectId: 305, name: '电商直播素材', startDate: '2025-04-01', endDate: '', allocated: 55000, used: 38000, remaining: 14000, expired: 3000, video: 15, image: 28, text: 35, audio: 3, avatar: 3, orders: [{ orderId: 'ORD-20250506', type: '图片', cost: '¥950', model: 'Stable Diffusion XL' }, { orderId: 'ORD-20250422', type: '数字人', cost: '¥1,800', model: 'D-ID' }] },
  { projectId: 306, name: '社交媒体推广', startDate: '2025-05-10', endDate: '', allocated: 40000, used: 22000, remaining: 15000, expired: 3000, video: 3, image: 27, text: 40, audio: 4, avatar: 3, orders: [{ orderId: 'ORD-20250508', type: '文字', cost: '¥420', model: 'Gemini Pro' }, { orderId: 'ORD-20250424', type: '图片', cost: '¥680', model: 'Flux Pro' }] }
])

const filteredProjects = computed(() => {
  let result = projects.value

  if (searchKeyword.value.trim()) {
    const q = searchKeyword.value.toLowerCase()
    result = result.filter(p =>
      String(p.projectId).includes(q) ||
      p.name.toLowerCase().includes(q)
    )
  }

  return result
})

const totalPages = computed(() => Math.ceil(filteredProjects.value.length / pageSize.value) || 1)

const pagedProjects = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredProjects.value.slice(start, start + pageSize.value)
})

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
  if (routeMap[tab]) router.push(routeMap[tab])
}

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

const formatQuota = (v) => v !== null && v !== undefined ? v : '/'

const openDetail = (project) => {
  selectedProject.value = project
  showDetailModal.value = true
}

const closeDetail = () => {
  showDetailModal.value = false
  selectedProject.value = null
}

onMounted(() => {
  setTimeout(() => {
    if (window.lucide) lucide.createIcons()
  }, 100)
})
</script>

<style scoped>
.project-page {
  max-width: 1600px;
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

.ent-tab:hover { background: #f1f5f9; color: var(--text-primary); }
.ent-tab.active { background: var(--primary-color); color: white; }

.project-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px 24px;
  background: white;
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-xl);
}

.project-header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.project-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--text-primary);
}

.project-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.add-project-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
}

.add-project-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.project-stats-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}

.proj-stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 18px 16px;
  background: white;
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-xl);
  transition: all 0.25s ease;
}

.proj-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
}

.proj-stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.proj-stat-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.proj-stat-label {
  font-size: 11.5px;
  color: var(--text-secondary);
  font-weight: 500;
}

.proj-stat-value {
  font-size: 26px;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
}

.search-action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: white;
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-xl);
  gap: 12px;
}

.search-wrap-member {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  max-width: 350px;
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

.filter-group {
  display: flex;
  gap: 10px;
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
  padding: 9px 18px;
  background: #f1f5f9;
  color: var(--text-secondary);
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.export-btn:hover { background: #e2e8f0; }

.account-table-card {
  background: white;
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-xl);
  padding: 24px;
  overflow-x: auto;
}

.table-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 16px;
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

.cell-proj-id { font-family: monospace; font-weight: 600; }
.cell-proj-name { font-weight: 600; }
.cell-date { font-family: monospace; }
.cell-money { font-weight: 600; font-variant-numeric: tabular-nums; }
.cell-used { color: #dc2626; }
.cell-remaining { color: #059669; }
.cell-expired { color: #9ca3af; }
.cell-count { text-align: center; font-variant-numeric: tabular-nums; }

.detail-btn {
  padding: 5px 14px;
  background: #eef2ff;
  color: #6366f1;
  border: none;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.detail-btn:hover { background: #ddd6fe; }

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
  max-width: 700px;
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