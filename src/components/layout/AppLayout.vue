<template>
  <div class="app-layout">
    <Sidebar />
    <div class="main-wrapper">
      <TopNav :page-title="pageTitle" />
      <div class="content-wrapper">
        <main class="content-area">
          <slot />
        </main>
        <aside v-if="showRightSidebar" class="right-sidebar-container">
          <slot name="right-sidebar">
            <RightSidebar />
          </slot>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './Sidebar.vue'
import TopNav from './TopNav.vue'
import RightSidebar from './RightSidebar.vue'

const route = useRoute()

const pageTitle = computed(() => {
  const titleMap = {
    '/': '首页',
    '/generate': '生成',
    '/tools': '全部工具',
    '/community': '社区',
    '/assets': '资产',
    '/pricing': '定价方案',
    '/profile': '个人资料',
    '/settings': '设置',
    '/login': '登录'
  }

  if (route.path.startsWith('/enterprise')) {
    const enterpriseTitles = {
      '/enterprise/bi': '企业仪表盘',
      '/enterprise/department': '部门管理',
      '/enterprise/member': '成员管理',
      '/enterprise/personnel': '人员管理',
      '/enterprise/project': '项目管理',
      '/enterprise/routing': '路由配置'
    }
    return enterpriseTitles[route.path] || '企业管理'
  }

  return titleMap[route.path] || '影创studio'
})

const showRightSidebar = computed(() => {
  return route.path === '/' || route.path === '/profile'
})
</script>

<style scoped>
.app-layout {
  width: 100%;
  height: 100vh;
  display: flex;
  overflow: hidden;
  position: relative;
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-wrapper {
  flex: 1;
  display: flex;
  overflow: hidden;
  background: linear-gradient(135deg, #fafafa 0%, #f5f3ff 100%);
}

.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  max-width: 1400px;
}

.content-area::-webkit-scrollbar {
  width: 3px;
}

.content-area::-webkit-scrollbar-track {
  background: transparent;
}

.content-area::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.25);
  border-radius: 8px;
}

.content-area::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.35);
}

.right-sidebar-container {
  width: 270px;
  min-width: 270px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border-left: 1px solid rgba(243, 244, 246, 1);
  overflow-y: auto;
  position: relative;
  z-index: 50;
}

.right-sidebar-container::-webkit-scrollbar {
  width: 3px;
}

.right-sidebar-container::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.25);
  border-radius: 8px;
}
</style>
