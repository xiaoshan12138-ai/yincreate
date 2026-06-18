import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { title: '首页', requiresAuth: true }
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
    {
      path: '/test',
      name: 'test',
      component: () => import('../views/TestView.vue'),
      meta: { title: '模型测试', requiresAuth: true }
    },
    {
      path: '/announcement',
      name: 'announcement',
      component: () => import('../views/AnnouncementView.vue'),
      meta: { title: '平台公告', requiresAuth: true }
    },
    {
      path: '/announcement/:id',
      name: 'announcement-detail',
      component: () => import('../views/AnnouncementDetailView.vue'),
      meta: { title: '公告详情', requiresAuth: true }
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      meta: { title: '系统管理', requiresAuth: true }
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
      path: '/enterprise/quota',
      name: 'enterprise-quota',
      component: () => import('../views/enterprise/QuotaAllocationView.vue'),
      meta: { title: '额度分配', requiresAuth: true }
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
  // 优先使用企业自定义网站标题
  let customTitle = null
  try {
    const stored = localStorage.getItem('szg_site_customization')
    if (stored) {
      const data = JSON.parse(stored)
      customTitle = data.site_title || null
    }
  } catch {}

  if (customTitle) {
    document.title = customTitle
  } else {
    document.title = `${to.meta.title || '影创studio'} - 影创studio AI视频创作平台`
  }

  const userStore = useUserStore()
  const userType = userStore.user?.user_type

  // 已登录用户访问登录页，按角色跳转到默认页面
  if (to.name === 'login' && userStore.isLoggedIn) {
    const defaultRoute = userType === 'admin' ? '/admin'
      : userType === 'enterprise' ? '/enterprise/bi'
      : '/'
    next({ path: defaultRoute })
    return
  }

  // 需要认证的页面，未登录则跳转登录页
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  // 系统管理员页面：仅 admin 角色可访问
  if (to.path.startsWith('/admin') && userType !== 'admin') {
    next({ path: '/' })
    return
  }

  // 企业管理页面：企业账号和管理员可访问，员工身份不可见
  if (to.path.startsWith('/enterprise') && userType !== 'enterprise' && userType !== 'admin') {
    next({ path: '/' })
    return
  }

  next()
})

export default router
