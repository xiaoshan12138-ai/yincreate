import request from '../utils/request'

// 开发模式 Mock 开关
const MOCK_ENABLED = import.meta.env.VITE_MOCK === 'true'

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 获取用户积分信息
 * @returns {Promise} { total_points, used_points, expired_points }
 */
export function getPointsApi() {
  if (MOCK_ENABLED) {
    return delay(300).then(() => ({
      data: {
        total_points: 5000,
        used_points: 2300,
        expired_points: 200
      }
    }))
  }
  return request.get('/api/v1/points')
}

/**
 * 获取网站个性化设置（企业专属）
 * @returns {Promise} { favicon_url, site_title }
 */
export function getSiteCustomizationApi() {
  if (MOCK_ENABLED) {
    return delay(300).then(() => ({
      data: {
        favicon_url: '',
        site_title: ''
      }
    }))
  }
  return request.get('/api/v1/site-customization')
}

/**
 * 保存网站个性化设置（企业专属）
 * @param {Object} params - { favicon_url, site_title }
 * @returns {Promise}
 */
export function saveSiteCustomizationApi(params) {
  if (MOCK_ENABLED) {
    return delay(500).then(() => ({
      data: {
        message: '保存成功',
        favicon_url: params.favicon_url,
        site_title: params.site_title
      }
    }))
  }
  return request.post('/api/v1/site-customization', params)
}

/**
 * 估算生成价格
 * @param {Object} params - { model, output_type, feature, parameters, input_files }
 * @returns {Promise} { estimated_cost, currency, breakdown, note }
 */
export function estimatePriceApi(params) {
  if (MOCK_ENABLED) {
    return delay(300).then(() => {
      const basePrice = params.output_type === 'video' ? 0.5 : 0.1
      const duration = params.parameters?.duration || 5
      const cost = params.output_type === 'video' ? basePrice * duration : basePrice
      return {
        data: {
          estimated_cost: cost,
          currency: 'CNY',
          breakdown: {
            base_price: params.output_type === 'video' ? `${basePrice}元/秒` : `${basePrice}元/张`,
            duration: params.output_type === 'video' ? `${duration}秒` : undefined,
            resolution: params.parameters?.resolution || '默认',
            with_audio: params.parameters?.with_audio ? '是' : '否',
            has_input: (params.input_files?.length > 0) ? '是' : '否',
            total: `${cost.toFixed(2)}元`
          },
          note: '实际扣费以生成结果为准'
        }
      }
    })
  }
  return request.post('/api/v1/estimate-price', params)
}

/**
 * 上传网站图标
 * @param {FormData} formData - 包含图片文件
 * @returns {Promise} { url }
 */
export function uploadFaviconApi(formData) {
  if (MOCK_ENABLED) {
    return delay(800).then(() => ({
      data: {
        url: URL.createObjectURL(formData.get('file'))
      }
    }))
  }
  return request.post('/api/v1/upload/favicon', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
