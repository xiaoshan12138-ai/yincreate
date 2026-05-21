<template>
  <!-- 占位页面 - 用于正在开发中的功能模块 -->
  <div class="placeholder-page">
    <div class="placeholder-icon">
      <i data-lucide="construction" style="width: 64px; height: 64px; color: #6366f1;"></i>
    </div>
    <h1 class="placeholder-title">{{ title }}</h1>
    <p class="placeholder-desc">该页面正在开发中，敬请期待...</p>
    <router-link to="/" class="home-link">
      返回首页
      <i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i>
    </router-link>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: '页面建设中'
  }
})

onMounted(() => {
  if (window.lucide) lucide.createIcons()
})
</script>

<style scoped>
.placeholder-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}

.placeholder-icon {
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

.placeholder-title {
  font-size: 36px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 12px;
}

.placeholder-desc {
  font-size: 17px;
  color: #6b7280;
  margin-bottom: 32px;
  max-width: 480px;
  line-height: 1.6;
}

.home-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  text-decoration: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-md), 0 4px 16px rgba(99, 102, 241, 0.25);
}

.home-link:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg), 0 6px 20px rgba(99, 102, 241, 0.35);
}
</style>
