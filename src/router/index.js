import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { title: '首页', requiresAuth: false }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { title: '登录', requiresAuth: false, layout: 'empty' }
    },
    {
      path: '/generate',
      name: 'generate',
      component: () => import('../views/GenerateView.vue'),
      meta: { title: 'AI生成', requiresAuth: true }
    },
    {
      path: '/tools',
      name: 'tools',
      component: () => import('../views/ToolsView.vue'),
      meta: { title: '全部工具', requiresAuth: true }
    },
    {
      path: '/community',
      name: 'community',
      component: () => import('../views/CommunityView.vue'),
      meta: { title: '社区', requiresAuth: true }
    },
    {
      path: '/assets',
      name: 'assets',
      component: () => import('../views/AssetsView.vue'),
      meta: { title: '资产管理', requiresAuth: true }
    },
    {
      path: '/pricing',
      name: 'pricing',
      component: () => import('../views/PricingView.vue'),
      meta: { title: '定价方案', requiresAuth: false }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { title: '个人资料', requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { title: '设置', requiresAuth: true }
    },

    // 企业管理子路由
    {
      path: '/enterprise',
      redirect: '/enterprise/bi',
      meta: { title: '企业管理' }
    },
    {
      path: '/enterprise/bi',
      name: 'enterprise-bi',
      component: () => import('../views/enterprise/EnterpriseBIView.vue'),
      meta: { title: '企业仪表盘', requiresAuth: true }
    },
    {
      path: '/enterprise/department',
      name: 'enterprise-department',
      component: () => import('../views/enterprise/DepartmentView.vue'),
      meta: { title: '部门管理', requiresAuth: true }
    },
    {
      path: '/enterprise/member',
      name: 'enterprise-member',
      component: () => import('../views/enterprise/MemberView.vue'),
      meta: { title: '成员管理', requiresAuth: true }
    },
    {
      path: '/enterprise/personnel',
      name: 'enterprise-personnel',
      component: () => import('../views/enterprise/PersonnelView.vue'),
      meta: { title: '人员管理', requiresAuth: true }
    },
    {
      path: '/enterprise/project',
      name: 'enterprise-project',
      component: () => import('../views/enterprise/ProjectView.vue'),
      meta: { title: '项目管理', requiresAuth: true }
    },
    {
      path: '/enterprise/routing',
      name: 'enterprise-routing',
      component: () => import('../views/enterprise/RoutingView.vue'),
      meta: { title: '路由配置', requiresAuth: true }
    },

    // 404
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/HomeView.vue'),
      meta: { title: '页面未找到' }
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || '影创studio'} - 影创studio AI视频创作平台`

  if (to.meta.requiresAuth) {
    const userStore = useUserStore()
    if (!userStore.isLoggedIn) {
      next({ name: 'login', query: { redirect: to.fullPath } })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
