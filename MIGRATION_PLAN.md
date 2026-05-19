# szg-v Vue 项目迁移计划

## 目标目录结构

```
szg-v/
├── public/
│   └── favicon.ico
├── src/
│   ├── api/                    # API 接口层
│   │   ├── index.js           # API 实例配置
│   │   ├── auth.js            # 认证相关 API
│   │   ├── user.js            # 用户相关 API
│   │   ├── generate.js        # AI生成相关 API
│   │   └── assets.js          # 资产相关 API
│   │
│   ├── assets/                 # 静态资源
│   │   ├── images/            # 图片资源
│   │   ├── icons/             # 图标资源
│   │   └── styles/            # 全局样式
│   │       ├── variables.css  # CSS 变量
│   │       ├── common.css     # 公共样式
│   │       ├── home.css       # 首页样式
│   │       └── components.css # 组件样式
│   │
│   ├── components/             # 公共组件
│   │   ├── layout/            # 布局组件
│   │   │   ├── AppLayout.vue  # 主布局（侧边栏+顶栏+内容区）
│   │   │   ├── Sidebar.vue    # 左侧导航栏
│   │   │   ├── TopNav.vue     # 顶部导航栏
│   │   │   └── LoginLayout.vue# 登录页布局
│   │   ├── common/            # 通用组件
│   │   │   ├── SearchBar.vue  # 搜索框
│   │   │   ├── UserAvatar.vue # 用户头像
│   │   │   ├── Card.vue       # 卡片组件
│   │   │   ├── Modal.vue      # 模态框
│   │   │   ├── Toast.vue      # 提示组件
│   │   │   └── Loading.vue    # 加载组件
│   │   └── business/          # 业务组件
│   │       ├── VideoCard.vue  # 视频卡片
│   │       ├── ToolCard.vue   # 工具卡片
│   │       ├── ProjectCard.vue# 项目卡片
│   │       └── MemberCard.vue # 会员卡片
│   │
│   ├── composables/            # 组合式函数
│   │   ├── useAuth.js         # 认证逻辑
│   │   ├── useSearch.js       # 搜索逻辑
│   │   └── useToast.js        # 提示逻辑
│   │
│   ├── data/                   # 静态数据（从JSON迁移）
│   │   ├── navData.js         # 导航数据
│   │   ├── userData.js        # 用户数据
│   │   ├── toolsData.js       # 工具数据
│   │   └── videosData.js      # 视频数据
│   │
│   ├── router/                 # 路由配置
│   │   └── index.js           # 路由定义
│   │
│   ├── stores/                 # Pinia 状态管理
│   │   ├── index.js           # Store 入口
│   │   ├── user.js            # 用户状态
│   │   ├── app.js             # 应用状态（导航、搜索等）
│   │   └── generate.js        # 生成状态
│   │
│   ├── utils/                  # 工具函数
│   │   ├── index.js           # 工具函数集合
│   │   ├── format.js          # 格式化工具
│   │   ├── storage.js         # 本地存储
│   │   └── validators.js      # 验证函数
│   │
│   ├── views/                  # 页面组件
│   │   ├── HomeView.vue       # 首页
│   │   ├── LoginView.vue      # 登录页
│   │   ├── GenerateView.vue   # AI生成页
│   │   ├── ToolsView.vue      # 工具集页
│   │   ├── CommunityView.vue  # 社区页
│   │   ├── AssetsView.vue     # 资产管理页
│   │   ├── PricingView.vue    # 定价页
│   │   ├── ProfileView.vue    # 个人资料页
│   │   ├── SettingsView.vue   # 设置页
│   │   └── enterprise/        # 企业管理子页面
│   │       ├── EnterpriseBIView.vue      # BI仪表盘
│   │       ├── DepartmentView.vue       # 部门管理
│   │       ├── MemberView.vue           # 成员管理
│   │       ├── PersonnelView.vue        # 人员管理
│   │       ├── ProjectView.vue          # 项目管理
│   │       └── RoutingView.vue          # 路由配置
│   │
│   ├── App.vue                # 根组件
│   └── main.js                # 应用入口
│
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 页面对应关系

| 原始文件 | Vue 组件 | 路由路径 |
|---------|---------|---------|
| index.html | HomeView.vue | / |
| pages/login.html | LoginView.vue | /login |
| pages/generate.html | GenerateView.vue | /generate |
| pages/tools.html | ToolsView.vue | /tools |
| pages/community.html | CommunityView.vue | /community |
| pages/assets.html | AssetsView.vue | /assets |
| pages/pricing.html | PricingView.vue | /pricing |
| pages/profile.html | ProfileView.vue | /profile |
| pages/settings.html | SettingsView.vue | /settings |
| pages/enterprise-bi.html | EnterpriseBIView.vue | /enterprise/bi |
| pages/enterprise-department.html | DepartmentView.vue | /enterprise/department |
| pages/enterprise-member.html | MemberView.vue | /enterprise/member |
| pages/enterprise-personnel.html | PersonnelView.vue | /enterprise/personnel |
| pages/enterprise-project.html | ProjectView.vue | /enterprise/project |
| pages/enterprise-routing.html | RoutingView.vue | /enterprise/routing |

## 迁移优先级

### P0 - 核心框架（必须）
- [x] 项目初始化和目录结构创建
- [ ] App.vue 主布局组件
- [ ] Sidebar + TopNav 公共布局
- [ ] Router 路由配置
- [ ] Pinia Store 状态管理

### P1 - 主要页面（重要）
- [ ] HomeView 首页
- [ ] LoginView 登录页
- [ ] GenerateView AI生成页
- [ ] ToolsView 工具集页

### P2 - 次要页面（一般）
- [ ] CommunityView 社区页
- [ ] AssetsView 资产管理页
- [ ] PricingView 定价页
- [ ] ProfileView 个人资料页
- [ ] SettingsView 设置页

### P3 - 企业后台（扩展）
- [ ] 企业管理所有子页面

### P4 - 数据和优化（完善）
- [ ] JSON数据迁移为JS模块
- [ ] API层封装
- [ ] 样式优化和响应式适配
- [ ] 性能优化
