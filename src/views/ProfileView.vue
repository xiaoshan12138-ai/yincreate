<template>
  <AppLayout>
    <div class="profile-page">
      <!-- 用户信息卡片 -->
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

      <!-- 统计数据行 -->
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

      <!-- 会员中心 -->
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

      <!-- 安全中心 -->
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
            <button class="security-action-btn" @click="$router.push('/settings')">{{ item.action }}</button>
          </div>
        </div>
        <button class="logout-btn">
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
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'
import { userData } from '../data/userData'

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
  { label: '设备管理', desc: '暂无登录设备，保护账号安全', action: '管理', type: 'monitor' }
])

const quickEntries = ref([
  { label: '我的订单', icon: 'receipt', color: '#6366f1' },
  { label: '我的会员', icon: 'crown', color: '#f59e0b' },
  { label: '我的发票', icon: 'file-text', color: '#10b981' },
  { label: '兑换码', icon: 'ticket', color: '#10b981' },
  { label: '邀请好友', icon: 'users', color: '#a855f7' },
  { label: '帮助中心', icon: 'help-circle', color: '#6366f1' }
])

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

onMounted(() => {
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
</style>