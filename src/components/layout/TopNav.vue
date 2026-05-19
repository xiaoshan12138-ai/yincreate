<template>
  <header class="top-nav">
    <h2 class="page-title">{{ pageTitle }}</h2>

    <div class="search-container">
      <input
        type="text"
        class="search-input"
        placeholder="搜索模板、工具、用户或作品"
        v-model="searchQuery"
        @input="handleSearch"
      >
      <i data-lucide="search" class="search-icon" style="width: 18px; height: 18px;"></i>
    </div>

    <div class="nav-actions">
      <button class="action-btn notification-btn" title="通知">
        <i data-lucide="bell" style="width: 18px; height: 18px;"></i>
        <span class="notification-badge">3</span>
      </button>

      <div class="user-info" @click="goToProfile">
        <span class="user-avatar">{{ userAvatar }}</span>
        <span class="user-name">{{ userName }}</span>
        <i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import { useAppStore } from '../../stores/app'

const props = defineProps({
  pageTitle: {
    type: String,
    default: '首页'
  }
})

const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()

const searchQuery = ref('')

const userAvatar = computed(() => userStore.user?.avatar || '👤')
const userName = computed(() => userStore.user?.name || '用户')

function handleSearch() {
  appStore.setSearchQuery(searchQuery.value)
}

function goToProfile() {
  router.push('/profile')
}

onMounted(() => {
  if (!userStore.isLoggedIn) {
    userStore.setUser(userData.user)
  }

  if (window.lucide) {
    lucide.createIcons()
  }
})

import { userData } from '../../data/userData'
</script>

<style scoped>
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 28px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(229, 231, 235, 0.7);
  gap: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
}

.search-container {
  flex: 1;
  max-width: 480px;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 10px 16px 10px 42px;
  border: 1.5px solid rgba(209, 213, 219, 0.8);
  border-radius: 10px;
  font-size: 13.5px;
  background: white;
  outline: none;
  transition: all 0.25s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.search-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08), 0 2px 8px rgba(0, 0, 0, 0.06);
}

.search-input::placeholder {
  color: #9ca3af;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  pointer-events: none;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-btn {
  width: 38px;
  height: 38px;
  border: none;
  background: transparent;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s ease;
  position: relative;
}

.action-btn:hover {
  background: rgba(99, 102, 241, 0.08);
  color: #4338ca;
}

.notification-btn {
  position: relative;
}

.notification-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  border: 2px solid white;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px 6px 6px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1.5px solid transparent;
}

.user-info:hover {
  background: rgba(99, 102, 241, 0.05);
  border-color: rgba(99, 102, 241, 0.15);
}

.user-avatar {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}
</style>
