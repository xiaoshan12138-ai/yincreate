<template>
  <AppLayout>
    <!-- 个人资料页面主容器 -->
    <div class="profile-page">
      <!-- 用户信息卡片 - 头像、昵称、VIP状态 -->
      <div class="profile-card">
        <div class="profile-user-section">
          <img :src="userData.user.avatar" alt="" class="profile-avatar-img" @error="handleImageError">
          <div class="profile-user-info">
            <div class="profile-name-row">
              <h3 class="profile-name">{{ userData.user.name }}</h3>
              <span v-if="userData.user.isVip" class="vip-badge-inline">
                <i data-lucide="crown" style="width: 12px; height: 12px;"></i>
                VIP
              </span>
            </div>
            <p class="profile-id">ID: {{ userData.user.id }}</p>
            <p class="profile-join-days">
              <i data-lucide="calendar" style="width: 13px; height: 13px;"></i>
              加入影创 studio 已 {{ userData.user.joinDays }} 天
            </p>
            <p class="profile-bio">{{ userData.user.bio }}</p>
          </div>
          <button class="edit-profile-btn">编辑资料</button>
        </div>
      </div>

      <!-- 统计数据行 - 作品数、草稿、收藏、素材 -->
      <div class="stats-row">
        <div v-for="(stat, index) in userStats" :key="index" class="stat-box">
          <div class="stat-icon-wrap" :style="{ background: index === 0 ? '#eef2ff' : index === 1 ? '#fef3e2' : index === 2 ? '#fdf4ff' : '#f0fdf4' }">
            <i :data-lucide="stat.icon" :style="{ width: '20px', height: '20px', color: index === 0 ? '#6366f1' : index === 1 ? '#f59e0b' : index === 2 ? '#a855f7' : '#10b981' }"></i>
          </div>
          <div class="stat-content">
            <span class="stat-num">{{ stat.value }}</span>
            <span class="stat-label">{{ stat.label }}</span>
          </div>
        </div>
      </div>

      <!-- 会员中心 - VIP信息和权益 -->
      <div class="section-block">
        <h3 class="section-title">会员中心</h3>
        <div class="vip-card">
          <div class="vip-card-left">
            <div class="vip-title-row">
              <i data-lucide="crown" style="width: 20px; height: 20px; color: #f59e0b;"></i>
              <span class="vip-title">VIP 尊享会员</span>
            </div>
            <p class="vip-expiry">有效期至 {{ userData.user.vipExpiry }}</p>
          </div>
          <button class="manage-vip-btn" @click="$router.push('/pricing')">管理会员</button>
        </div>
        <div class="benefits-grid">
          <div v-for="(benefit, idx) in vipBenefits" :key="idx" class="benefit-item">
            <i :data-lucide="benefit.icon" style="width: 15px; height: 15px; color: #9ca3af;"></i>
            <span>{{ benefit.text }}</span>
          </div>
        </div>
        <router-link to="/pricing" class="view-more-link">查看权益详情 ›</router-link>
      </div>

      <!-- 安全中心 - 密码、手机、邮箱等安全设置 -->
      <div class="section-block">
        <h3 class="section-title">安全中心</h3>
        <div class="security-list">
          <div v-for="(item, idx) in securityItems" :key="idx" class="security-item">
            <div class="security-item-left">
              <div class="security-icon-wrap">
                <i :data-lucide="item.type === 'password' ? 'key-round' : item.type === 'phone' ? 'smartphone' : item.type === 'mail' ? 'mail' : item.type === 'link' ? 'link' : 'monitor'" style="width: 18px; height: 18px; color: #6366f1;"></i>
              </div>
              <div class="security-info">
                <span class="security-label">{{ item.label }}</span>
                <span class="security-desc">{{ item.desc }}</span>
              </div>
            </div>
            <button class="security-action-btn" @click="item.type === 'badge-check' ? openRealNameAuth() : $router.push('/settings')">{{ item.action }}</button>
          </div>
        </div>
        <button class="logout-btn" @click="handleLogout">
          <i data-lucide="log-out" style="width: 15px; height: 15px;"></i>
          退出登录
        </button>
      </div>
    </div>

    <!-- 右侧边栏内容（通过AppLayout的slot传入） -->
    <template #right-sidebar>
      <aside class="right-sidebar-profile">
        <!-- 快捷入口 -->
        <div class="sidebar-section">
          <h3 class="sidebar-section-title">快捷入口</h3>
          <div class="quick-grid">
            <div v-for="(entry, idx) in quickEntries" :key="idx" class="quick-entry-item">
              <div class="quick-entry-icon" :style="{ background: entry.color + '15', color: entry.color }">
                <i :data-lucide="entry.icon" style="width: 20px; height: 20px;"></i>
              </div>
              <span class="quick-entry-label">{{ entry.label }}</span>
            </div>
          </div>
        </div>

        <!-- 账户设置 -->
        <div class="sidebar-section">
          <h3 class="sidebar-section-title">账户设置</h3>
          <div class="settings-list">
            <div v-for="(setting, idx) in accountSettings" :key="idx" class="settings-item" @click="$router.push('/settings')">
              <div class="settings-item-left">
                <div class="settings-icon-wrap" :style="{ background: setting.color + '15', color: setting.color }">
                  <i :data-lucide="setting.icon" style="width: 16px; height: 16px;"></i>
                </div>
                <div class="settings-info">
                  <span class="settings-label">{{ setting.label }}</span>
                  <span class="settings-desc">{{ setting.desc }}</span>
                </div>
              </div>
              <i data-lucide="chevron-right" style="width: 16px; height: 16px; color: #d1d5db;"></i>
            </div>
          </div>
        </div>

        <!-- 帮助中心 -->
        <div class="sidebar-section">
          <h3 class="sidebar-section-title">帮助中心</h3>
          <div class="help-list">
            <div v-for="(item, idx) in helpItems" :key="idx" class="help-item">
              <div class="help-item-left">
                <div class="help-icon-wrap" :style="{ background: item.color + '15', color: item.color }">
                  <i :data-lucide="item.icon" style="width: 16px; height: 16px;"></i>
                </div>
                <div class="help-info">
                  <span class="help-label">{{ item.label }}</span>
                  <span class="help-desc">{{ item.desc }}</span>
                </div>
              </div>
              <i data-lucide="chevron-right" style="width: 16px; height: 16px; color: #d1d5db;"></i>
            </div>
          </div>
        </div>
      </aside>
    </template>

    <!-- 实名认证弹窗 -->
    <Teleport to="body">
      <div v-if="showRealNameAuthModal" class="modal-overlay" @click.self="closeRealNameAuth">
        <div class="realname-modal-container">
          <!-- 步骤条 -->
          <div class="realname-header">
            <button class="back-btn" @click="closeRealNameAuth">
              <i data-lucide="chevron-left" style="width: 16px; height: 16px;"></i>
              返回认证中心
            </button>
            <div class="step-indicator">
              <div :class="['step-item', { active: currentStep >= 1, completed: currentStep > 1 }]">
                <span class="step-num">1</span>
                <span class="step-text">同意协议</span>
                <i v-if="currentStep > 1" data-lucide="check" class="step-check"></i>
              </div>
              <i data-lucide="chevron-right" class="step-arrow"></i>
              <div :class="['step-item', { active: currentStep >= 2, completed: currentStep > 2 }]">
                <span class="step-num">2</span>
                <span class="step-text">填写身份信息及验证</span>
                <i v-if="currentStep > 2" data-lucide="check" class="step-check"></i>
              </div>
              <i data-lucide="chevron-right" class="step-arrow"></i>
              <div :class="['step-item', { active: currentStep >= 3 }]">
                <span class="step-num">3</span>
                <span class="step-text">完成认证</span>
              </div>
            </div>
          </div>

          <div class="realname-body">
            <!-- 第一步：同意协议 -->
            <div v-if="currentStep === 1" class="step-content">
              <h3 class="step-title">实名认证协议</h3>
              <div class="agreement-box">
                <p class="agreement-placeholder">协议内容</p>
              </div>
              <div class="agreement-actions">
                <button class="btn-disagree" @click="closeRealNameAuth">不同意</button>
                <button class="btn-agree" @click="goToStep(2)">同意</button>
              </div>
            </div>

            <!-- 第二步：填写身份信息 -->
            <div v-if="currentStep === 2" class="step-content">
              <h3 class="step-title">填写身份信息</h3>
              <div class="form-section">
                <div class="form-group-realname">
                  <label class="form-label-realname">证件类型</label>
                  <select v-model="authForm.idType" class="form-select-realname">
                    <option value="">请选择证件类型</option>
                    <option value="身份证">中国居民身份证</option>
                  </select>
                </div>

                <div class="form-group-realname">
                  <label class="form-label-realname">姓名</label>
                  <input
                    type="text"
                    v-model="authForm.realName"
                    placeholder="请输入真实姓名"
                    class="form-input-realname"
                  >
                </div>

                <div class="form-group-realname">
                  <label class="form-label-realname">证件号码</label>
                  <input
                    type="text"
                    v-model="authForm.idNumber"
                    placeholder="请输入证件号码"
                    class="form-input-realname"
                    maxlength="18"
                    @blur="validateIdNumber"
                  >
                  <p v-if="idNumberError" class="error-msg">{{ idNumberError }}</p>
                </div>
              </div>

              <div class="form-actions">
                <button class="btn-submit-auth" @click="submitAuth">提交</button>
              </div>
            </div>

            <!-- 第三步：认证成功 -->
            <div v-if="currentStep === 3" class="step-content success-content">
              <div class="success-icon-wrap">
                <i data-lucide="check-circle" style="width: 64px; height: 64px; color: #10b981;"></i>
              </div>
              <h3 class="success-title">认证成功！</h3>
              <p class="success-desc">您的实名认证已通过审核，现在可以享受更多服务了。</p>
              <button class="btn-close-success" @click="closeRealNameAuth">完成</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '../components/layout/AppLayout.vue'
import { userData } from '../data/userData'

const router = useRouter()

const userStats = ref([
  { value: 36, label: '我的作品', icon: 'file-video' },
  { value: 12, label: '草稿箱', icon: 'file-text' },
  { value: 8, label: '收藏夹', icon: 'star' },
  { value: 128, label: '素材库', icon: 'folder' }
])

const vipBenefits = ref([
  { text: '无限量视频生成', icon: 'infinity' },
  { text: '高清导出', icon: 'download' },
  { text: '专属素材库', icon: 'image' },
  { text: '优先客服', icon: 'headphones' }
])

const securityItems = ref([
  { label: '登录密码', desc: '建议定期更换密码以保障账户安全', action: '修改', type: 'password' },
  { label: '手机绑定', desc: '138****8888', action: '修改', type: 'phone' },
  { label: '邮箱绑定', desc: 'creator@example.com', action: '修改', type: 'mail' },
  { label: '第三方账号', desc: '已绑定微信', action: '管理', type: 'link' },
  { label: '设备管理', desc: '暂无登录设备，保护账号安全', action: '管理', type: 'monitor' },
  { label: '实名认证', desc: '未认证，完成认证可享受更多服务', action: '去认证', type: 'badge-check' }
])

const quickEntries = ref([])

const updateQuickEntries = () => {
  const userLevel = userData.user.level
  if (userLevel === 1) {
    quickEntries.value = [
      { label: '我的订单', icon: 'receipt', color: '#6366f1' },
      { label: '我的发票', icon: 'file-text', color: '#10b981' },
      { label: '兑换码', icon: 'ticket', color: '#10b981' },
      { label: '帮助中心', icon: 'help-circle', color: '#6366f1' }
    ]
  } else {
    quickEntries.value = [
      { label: '帮助中心', icon: 'help-circle', color: '#6366f1' }
    ]
  }
}

const accountSettings = ref([
  { label: '个人资料', desc: '头像、昵称、个人简介', icon: 'user', color: '#6366f1' },
  { label: '通知设置', desc: '消息通知、操作通知等', icon: 'bell', color: '#3b82f6' },
  { label: '隐私设置', desc: '隐私权限与数据管理', icon: 'shield', color: '#10b981' },
  { label: '敏感权限', desc: '敏感权限与数据管理', icon: 'lock', color: '#a855f7' },
  { label: '偏好设置', desc: '界面语言、主题模式等', icon: 'palette', color: '#ec4899' },
  { label: '内容偏好', desc: '推荐内容与屏蔽设置', icon: 'sliders', color: '#f97316' }
])

const helpItems = ref([
  { label: '常见问题', desc: '了解常见问题与解决方案', icon: 'help-circle', color: '#6366f1' },
  { label: '使用教程', desc: '学习如何使用影创 studio 各项功能', icon: 'book-open', color: '#3b82f6' },
  { label: '意见反馈', desc: '告诉我们您的建议与问题', icon: 'message-square', color: '#10b981' },
  { label: '联系客服', desc: '7x24 小时在线客服支持', icon: 'headphones', color: '#a855f7' }
])

const handleImageError = (event) => {
  event.target.style.display = 'none'
}

const handleLogout = () => {
  router.push('/login')
}

const showRealNameAuthModal = ref(false)
const currentStep = ref(1)
const authForm = ref({
  idType: '',
  realName: '',
  idNumber: ''
})
const idNumberError = ref('')

const openRealNameAuth = () => {
  currentStep.value = 1
  authForm.value = { idType: '', realName: '', idNumber: '' }
  idNumberError.value = ''
  showRealNameAuthModal.value = true
  nextTick(() => {
    if (window.lucide) lucide.createIcons()
  })
}

const closeRealNameAuth = () => {
  showRealNameAuthModal.value = false
  currentStep.value = 1
  authForm.value = { idType: '', realName: '', idNumber: '' }
  idNumberError.value = ''
}

const goToStep = (step) => {
  currentStep.value = step
  nextTick(() => {
    if (window.lucide) lucide.createIcons()
  })
}

const validateIdNumber = () => {
  const idNum = authForm.value.idNumber.trim()
  if (!idNum) {
    idNumberError.value = ''
    return false
  }
  if (!/^\d{18}$/.test(idNum)) {
    idNumberError.value = '请输入正确的身份证号！'
    return false
  }
  idNumberError.value = ''
  return true
}

const submitAuth = () => {
  if (!authForm.value.idType) {
    return
  }
  if (!authForm.value.realName.trim()) {
    return
  }
  if (!validateIdNumber()) {
    return
  }
  goToStep(3)
}

onMounted(() => {
  updateQuickEntries()
  setTimeout(() => {
    if (window.lucide) lucide.createIcons()
  }, 100)
})
</script>

<style scoped>
.profile-page {
  max-width: none;
  width: 100%;
}

.page-header-info {
  display: flex;
  flex-direction: column;
}

.page-subtitle {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

.header-user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 10px;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.2s ease;
}

.header-user-info:hover {
  background: #f1f5f9;
}

.header-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.header-username {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.vip-badge-sm {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 1px 6px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  color: #92400e;
}

.storage-expand {
  padding: 0 16px 20px;
}

.storage-link {
  display: block;
  font-size: 12px;
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
}

.profile-card {
  background: white;
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-xl);
  padding: 24px 28px;
  margin-bottom: 20px;
}

.profile-user-section {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.profile-avatar-img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid white;
  box-shadow: 0 2px 12px rgba(99, 102, 241, 0.15);
}

.profile-user-info {
  flex: 1;
}

.profile-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.profile-name {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
}

.vip-badge-inline {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 10px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #92400e;
}

.profile-id {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.profile-join-days {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.profile-bio {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.5;
}

.edit-profile-btn {
  padding: 8px 18px;
  background: white;
  border: 1.5px solid var(--border-color);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--primary-color);
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.edit-profile-btn:hover {
  border-color: var(--primary-color);
  background: rgba(99, 102, 241, 0.04);
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-box {
  background: white;
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-xl);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: all 0.25s ease;
}

.stat-box:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
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

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-num {
  font-size: 26px;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 500;
}

.section-block {
  background: white;
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-xl);
  padding: 24px 28px;
  margin-bottom: 20px;
}

.section-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 18px;
}

.vip-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 22px;
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
  border: 1.5px solid #fde68a;
  border-radius: var(--radius-lg);
  margin-bottom: 16px;
}

.vip-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.vip-title {
  font-size: 15px;
  font-weight: 700;
  color: #92400e;
}

.vip-expiry {
  font-size: 12px;
  color: #b45309;
}

.manage-vip-btn {
  padding: 9px 22px;
  background: linear-gradient(135deg, #374151, #1f2937);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}

.manage-vip-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(31, 41, 55, 0.3);
}

.benefits-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 14px;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.view-more-link {
  display: inline-block;
  font-size: 13px;
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 600;
}

.security-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-bottom: 18px;
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-light);
}

.security-item:first-child {
  padding-top: 0;
}

.security-item-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.security-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #eef2ff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.security-info {
  display: flex;
  flex-direction: column;
}

.security-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.security-desc {
  font-size: 12px;
  color: var(--text-tertiary);
}

.security-action-btn {
  padding: 6px 16px;
  background: white;
  border: 1.5px solid var(--border-color);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.security-action-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 10px;
  background: white;
  border: 1.5px solid #fecaca;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #dc2626;
  cursor: pointer;
  transition: all 0.25s ease;
}

.logout-btn:hover {
  background: #fef2f2;
  border-color: #fca5a5;
}

.right-sidebar-profile {
  padding: 16px 14px;
}

.sidebar-section {
  margin-bottom: 14px;
  background: #ffffff;
  border-radius: 16px;
  padding: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1.5px solid rgba(229, 231, 235, 0.7);
}

.sidebar-section-title {
  font-size: 13.5px;
  font-weight: 650;
  color: #111827;
  margin-bottom: 12px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.quick-entry-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-entry-item:hover {
  background: #f8fafc;
}

.quick-entry-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-entry-label {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  text-align: center;
}

.settings-list,
.help-list {
  display: flex;
  flex-direction: column;
}

.settings-item,
.help-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid rgba(229, 231, 235, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
}

.settings-item:last-child,
.help-item:last-child {
  border-bottom: none;
}

.settings-item:hover,
.help-item:hover {
  background: #f8fafc;
  margin: 0 -14px;
  padding: 14px;
  border-radius: 10px;
  border-bottom-color: transparent;
}

.settings-item-left,
.help-item-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.settings-icon-wrap,
.help-icon-wrap {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.settings-info,
.help-info {
  display: flex;
  flex-direction: column;
}

.settings-label,
.help-label {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 2px;
}

.settings-desc,
.help-desc {
  font-size: 11px;
  color: #9ca3af;
}

/* 实名认证弹窗样式 */
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
  z-index: 9999;
}

.realname-modal-container {
  width: 90%;
  max-width: 680px;
  max-height: 85vh;
  background: white;
  border-radius: 16px;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.realname-header {
  padding: 20px 28px;
  border-bottom: 1.5px solid #e5e7eb;
  background: #fafafa;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #3b82f6;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 16px;
}

.back-btn:hover {
  background: rgba(59, 130, 246, 0.08);
}

.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: #9ca3af;
  background: white;
  border: 1.5px solid #e5e7eb;
  transition: all 0.25s ease;
  position: relative;
}

.step-item.active {
  color: #3b82f6;
  border-color: #3b82f6;
  background: #eff6ff;
}

.step-item.completed {
  color: #10b981;
  border-color: #10b981;
  background: #ecfdf5;
}

.step-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.step-item.active .step-num {
  background: #3b82f6;
  color: white;
}

.step-item.completed .step-num {
  background: #10b981;
  color: white;
}

.step-text {
  white-space: nowrap;
}

.step-check {
  position: absolute;
  right: -4px;
  top: -4px;
  width: 16px !important;
  height: 16px !important;
  color: #10b981;
  background: white;
  border-radius: 50%;
}

.step-arrow {
  width: 18px;
  height: 18px;
  color: #d1d5db;
  flex-shrink: 0;
}

.realname-body {
  padding: 32px 40px;
}

.step-content {
  animation: fadeInUp 0.3s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.step-title {
  font-size: 19px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 24px;
  text-align: left;
}

.agreement-box {
  min-height: 240px;
  padding: 24px;
  background: #f9fafb;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.agreement-placeholder {
  font-size: 15px;
  color: #9ca3af;
  text-align: center;
}

.agreement-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.btn-disagree,
.btn-agree {
  padding: 11px 36px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}

.btn-disagree {
  background: white;
  border: 1.5px solid #d1d5db;
  color: #6b7280;
}

.btn-disagree:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-agree {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-agree:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 28px;
}

.form-group-realname {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label-realname {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.form-select-realname,
.form-input-realname {
  padding: 12px 16px;
  border: 1.5px solid #d1d5db;
  border-radius: 10px;
  font-size: 14px;
  color: #111827;
  background: white;
  outline: none;
  transition: all 0.2s ease;
}

.form-select-realname:focus,
.form-input-realname:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.error-msg {
  font-size: 12px;
  color: #dc2626;
  margin-top: -4px;
  font-weight: 500;
}

.form-actions {
  display: flex;
  justify-content: center;
}

.btn-submit-auth {
  padding: 12px 56px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-submit-auth:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

.success-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  text-align: center;
}

.success-icon-wrap {
  margin-bottom: 20px;
  animation: scaleIn 0.4s ease;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.success-title {
  font-size: 26px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 12px;
}

.success-desc {
  font-size: 15px;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 32px;
  max-width: 400px;
}

.btn-close-success {
  padding: 12px 48px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-close-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}
</style>