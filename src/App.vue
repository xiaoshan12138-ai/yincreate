<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useUserStore } from './stores/user'
import { useAppStore } from './stores/app'
import { getSiteCustomizationApi } from './api/profile'

const userStore = useUserStore()
const appStore = useAppStore()

onMounted(async () => {
  if (window.lucide) {
    lucide.createIcons()
  }

  // 企业账号从后端获取网站个性化设置并应用
  if (userStore.user?.user_type === 'enterprise') {
    try {
      const res = await getSiteCustomizationApi()
      const { favicon_url, site_title } = res.data
      if (favicon_url || site_title) {
        appStore.setSiteCustomization({ favicon_url, site_title })
      }
    } catch (e) {
      // 后端获取失败时使用本地缓存
    }
  }

  // 应用本地缓存的网站个性化设置
  appStore.applySiteCustomization()
})
</script>

<style>
@import './assets/styles/variables.css';
@import './assets/styles/common.css';
</style>
