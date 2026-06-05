import request from '../utils/request'

// 开发模式 Mock 开关
const MOCK_ENABLED = import.meta.env.VITE_MOCK === 'true'
const MOCK_DELAY = 600

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Mock 公告数据
const mockAnnouncements = [
  {
    id: 1,
    title: 'AI生成模型全新升级V3.0',
    category: 'update',
    summary: '全新AI视频生成模型V3.0正式上线，生成速度提升50%，画质提升显著。',
    content: '<h2>AI生成模型V3.0正式发布</h2><p>我们非常高兴地宣布，全新的AI视频生成模型V3.0已经正式上线！本次升级带来了以下重大改进：</p><ul><li><strong>生成速度提升50%</strong>：通过优化推理引擎，视频生成速度大幅提升</li><li><strong>画质显著提升</strong>：支持4K分辨率输出，画面更加细腻</li><li><strong>动作更自然</strong>：改进了动作生成算法，人物动作更加流畅自然</li><li><strong>多语言支持</strong>：新增日语、韩语等6种语言支持</li></ul><p>所有用户即日起即可体验新模型，欢迎前往生成页面尝试！</p>',
    cover_image: '',
    is_top: true,
    status: 'published',
    author: '系统管理员',
    view_count: 1280,
    created_at: '2026-05-16 10:00:00',
    updated_at: '2026-05-16 10:00:00',
    published_at: '2026-05-16 10:00:00'
  },
  {
    id: 2,
    title: '五月创作者激励计划进行中',
    category: 'event',
    summary: '参与五月创作者激励计划，赢取丰厚奖励和VIP会员时长。',
    content: '<h2>五月创作者激励计划</h2><p>亲爱的创作者们，五月创作者激励计划正式开启！参与活动即可赢取丰厚奖励：</p><ul><li>发布3个作品即可获得7天VIP体验</li><li>发布5个作品额外获得100积分</li><li>点赞最多的前10名创作者将获得月度会员</li></ul><p>活动时间：2026年5月1日 - 5月31日</p><p>赶快参与吧！</p>',
    cover_image: '',
    is_top: false,
    status: 'published',
    author: '运营团队',
    view_count: 856,
    created_at: '2026-05-15 09:00:00',
    updated_at: '2026-05-15 09:00:00',
    published_at: '2026-05-15 09:00:00'
  },
  {
    id: 3,
    title: '如何用AI制作电影级视频',
    category: 'tutorial',
    summary: '从脚本到成片，手把手教你用AI工具制作高质量视频。',
    content: '<h2>AI视频制作完全指南</h2><p>本教程将带你从零开始，学习如何使用AI工具制作电影级视频：</p><h3>第一步：编写脚本</h3><p>使用AI文本生成工具，快速生成视频脚本...</p><h3>第二步：选择模板</h3><p>从丰富的模板库中选择适合的风格...</p><h3>第三步：生成视频</h3><p>输入脚本和素材，一键生成高质量视频...</p><h3>第四步：后期编辑</h3><p>使用智能剪辑工具进行精细调整...</p>',
    cover_image: '',
    is_top: false,
    status: 'published',
    author: '教程团队',
    view_count: 2340,
    created_at: '2026-05-14 14:00:00',
    updated_at: '2026-05-14 14:00:00',
    published_at: '2026-05-14 14:00:00'
  },
  {
    id: 4,
    title: '新增智能字幕功能',
    category: 'update',
    summary: '智能字幕功能上线，支持自动识别和多语言翻译。',
    content: '<h2>智能字幕功能上线</h2><p>全新的智能字幕功能已经上线！主要特性包括：</p><ul><li>自动语音识别，准确率高达98%</li><li>支持中英日韩等12种语言</li><li>一键翻译字幕</li><li>自定义字幕样式</li></ul>',
    cover_image: '',
    is_top: false,
    status: 'published',
    author: '产品团队',
    view_count: 670,
    created_at: '2026-05-13 11:00:00',
    updated_at: '2026-05-13 11:00:00',
    published_at: '2026-05-13 11:00:00'
  },
  {
    id: 5,
    title: '六月创意大赛报名开启',
    category: 'event',
    summary: '六月创意大赛正式开启报名，主题为"未来世界"，丰厚奖金等你来拿。',
    content: '<h2>六月创意大赛</h2><p>主题：未来世界</p><p>报名截止：2026年6月15日</p><p>一等奖：5000元 + 年度会员</p><p>二等奖：3000元 + 半年会员</p><p>三等奖：1000元 + 季度会员</p>',
    cover_image: '',
    is_top: true,
    status: 'published',
    author: '运营团队',
    view_count: 1520,
    created_at: '2026-06-01 08:00:00',
    updated_at: '2026-06-01 08:00:00',
    published_at: '2026-06-01 08:00:00'
  },
  {
    id: 6,
    title: '视频抠像功能使用教程',
    category: 'tutorial',
    summary: '详细讲解如何使用视频抠像功能，快速替换视频背景。',
    content: '<h2>视频抠像教程</h2><p>本教程将教你如何使用视频抠像功能：</p><ul><li>上传视频素材</li><li>选择抠像模式</li><li>调整边缘参数</li><li>替换背景</li></ul>',
    cover_image: '',
    is_top: false,
    status: 'published',
    author: '教程团队',
    view_count: 980,
    created_at: '2026-05-10 16:00:00',
    updated_at: '2026-05-10 16:00:00',
    published_at: '2026-05-10 16:00:00'
  }
]

/**
 * 获取公告列表
 * GET /api/v1/announcements
 * @param {Object} params - { category?, page?, page_size?, status? }
 *   category: 'update' | 'event' | 'tutorial' | 不传则全部
 *   page: 页码，默认1
 *   page_size: 每页条数，默认10
 *   status: 'published' | 'draft' | 不传则仅返回已发布
 * @returns {Promise} { items: [], total, page, page_size }
 */
export function getAnnouncementsApi(params = {}) {
  if (MOCK_ENABLED) {
    return delay(MOCK_DELAY).then(() => {
      let filtered = [...mockAnnouncements]
      if (params.category) {
        filtered = filtered.filter(a => a.category === params.category)
      }
      if (params.status) {
        filtered = filtered.filter(a => a.status === params.status)
      }
      const page = params.page || 1
      const pageSize = params.page_size || 10
      const total = filtered.length
      const items = filtered.slice((page - 1) * pageSize, page * pageSize)
      return {
        data: { items, total, page, page_size: pageSize }
      }
    })
  }
  return request.get('/api/v1/announcements', { params })
}

/**
 * 获取公告详情
 * GET /api/v1/announcements/:id
 * @param {number|string} id
 * @returns {Promise} { data: Announcement }
 */
export function getAnnouncementDetailApi(id) {
  if (MOCK_ENABLED) {
    return delay(MOCK_DELAY).then(() => {
      const item = mockAnnouncements.find(a => a.id === Number(id))
      if (!item) {
        const err = new Error('公告不存在')
        err.code = 'NOT_FOUND'
        err.status = 404
        throw err
      }
      return { data: item }
    })
  }
  return request.get(`/api/v1/announcements/${id}`)
}

/**
 * 创建公告
 * POST /api/v1/announcements
 * @param {Object} data - { title, category, summary, content, cover_image?, is_top?, status }
 * @returns {Promise} { data: Announcement }
 */
export function createAnnouncementApi(data) {
  if (MOCK_ENABLED) {
    return delay(MOCK_DELAY).then(() => {
      const newItem = {
        id: mockAnnouncements.length + 1,
        ...data,
        author: '系统管理员',
        view_count: 0,
        created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
        updated_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
        published_at: data.status === 'published' ? new Date().toISOString().replace('T', ' ').slice(0, 19) : null
      }
      mockAnnouncements.unshift(newItem)
      return { data: newItem }
    })
  }
  return request.post('/api/v1/announcements', data)
}

/**
 * 更新公告
 * PUT /api/v1/announcements/:id
 * @param {number|string} id
 * @param {Object} data - { title?, category?, summary?, content?, cover_image?, is_top?, status? }
 * @returns {Promise} { data: Announcement }
 */
export function updateAnnouncementApi(id, data) {
  if (MOCK_ENABLED) {
    return delay(MOCK_DELAY).then(() => {
      const index = mockAnnouncements.findIndex(a => a.id === Number(id))
      if (index === -1) {
        const err = new Error('公告不存在')
        err.code = 'NOT_FOUND'
        err.status = 404
        throw err
      }
      mockAnnouncements[index] = {
        ...mockAnnouncements[index],
        ...data,
        updated_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
        published_at: data.status === 'published' && !mockAnnouncements[index].published_at
          ? new Date().toISOString().replace('T', ' ').slice(0, 19)
          : mockAnnouncements[index].published_at
      }
      return { data: mockAnnouncements[index] }
    })
  }
  return request.put(`/api/v1/announcements/${id}`, data)
}

/**
 * 删除公告
 * DELETE /api/v1/announcements/:id
 * @param {number|string} id
 * @returns {Promise} { data: { message: string } }
 */
export function deleteAnnouncementApi(id) {
  if (MOCK_ENABLED) {
    return delay(MOCK_DELAY).then(() => {
      const index = mockAnnouncements.findIndex(a => a.id === Number(id))
      if (index === -1) {
        const err = new Error('公告不存在')
        err.code = 'NOT_FOUND'
        err.status = 404
        throw err
      }
      mockAnnouncements.splice(index, 1)
      return { data: { message: '删除成功' } }
    })
  }
  return request.delete(`/api/v1/announcements/${id}`)
}

/**
 * 获取最新公告（首页侧边栏用）
 * GET /api/v1/announcements/latest
 * @param {Object} params - { limit?: number } 默认5条
 * @returns {Promise} { data: Announcement[] }
 */
export function getLatestAnnouncementsApi(params = {}) {
  if (MOCK_ENABLED) {
    return delay(MOCK_DELAY).then(() => {
      const limit = params.limit || 5
      return {
        data: mockAnnouncements
          .filter(a => a.status === 'published')
          .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
          .slice(0, limit)
      }
    })
  }
  return request.get('/api/v1/announcements/latest', { params })
}
