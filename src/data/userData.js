export const userData = {
  user: {
    id: 10086,
    name: '创作者小明',
    avatar: '👤',
    isVip: true,
    vipExpiry: '2025-06-30',
    joinDate: '2024-01-15',
    stats: {
      works: 36,
      drafts: 12,
      favorites: 8,
      assets: 128
    },
    storage: {
      used: 23.6,
      total: 100,
      unit: 'GB'
    }
  },
  announcements: [
    { id: 1, tag: '功能更新', type: 'update', text: 'AI生成模型全新升级', date: '05-16' },
    { id: 2, tag: '活动', type: 'event', text: '五月创作者激励计划进行中', date: '05-15' },
    { id: 3, tag: '教程', type: 'feature', text: '如何用AI制作电影级视频', date: '05-14' },
    { id: 4, tag: '功能更新', type: 'update', text: '新增智能字幕功能', date: '05-13' }
  ],
  recentProjects: [
    { id: 1, name: '旅行Vlog', date: '更新于 2024-05-18 11:20', thumbnail: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=320&h=200&fit=crop' },
    { id: 2, name: '产品宣传片', date: '更新于 2024-05-16 09:15', thumbnail: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=320&h=200&fit=crop' },
    { id: 3, name: '毕业纪念视频', date: '更新于 2024-05-14 16:30', thumbnail: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=320&h=200&fit=crop' },
    { id: 4, name: '节日祝福视频', date: '更新于 2024-05-13 10:20', thumbnail: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=320&h=200&fit=crop' },
    { id: 5, name: '企业宣传片', date: '更新于 2024-05-12 16:45', thumbnail: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=320&h=200&fit=crop' }
  ],
  recommendedTools: [
    { id: 1, name: '智能配音', desc: '多音色选择', color: 'blue', icon: 'volume-2' },
    { id: 2, name: '字幕识别', desc: '自动识别并生成字幕', color: 'purple', icon: 'subtitles' },
    { id: 3, name: '视频抠像', desc: '精准提取前景背景', color: 'green', icon: 'wand-2' },
    { id: 4, name: '画面修复', desc: '提升画质清晰度', color: 'orange', icon: 'image-upscale' },
    { id: 5, name: '视频压缩', desc: '减小文件大小', color: 'blue', icon: 'file-down' },
    { id: 6, name: '格式转换', desc: '支持多种格式', color: 'green', icon: 'refresh-cw' }
  ],
  membershipPlans: [
    {
      id: 'monthly',
      name: '月度会员',
      price: 99,
      period: '月',
      features: [
        '无限使用AI生成功能',
        '优先渲染队列',
        '专属客服支持',
        '高清素材库访问'
      ]
    },
    {
      id: 'yearly',
      name: '年度会员',
      price: 699,
      period: '年',
      originalPrice: 1188,
      features: [
        '所有月度会员权益',
        '2个月免费时长',
        '专属会员标识',
        '线下活动邀请'
      ],
      recommended: true
    },
    {
      id: 'enterprise',
      name: '企业会员',
      price: 2999,
      period: '年',
      features: [
        '所有年度会员权益',
        '团队协作功能',
        'API接口访问',
        '专属客户经理',
        '定制化服务'
      ]
    }
  ]
}
