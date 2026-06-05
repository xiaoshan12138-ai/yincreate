import request from '../utils/request'

// 开发模式 Mock 开关：在 .env 中设置 VITE_MOCK=true 即可开启
const MOCK_ENABLED = import.meta.env.VITE_MOCK === 'true'

// 模拟延迟（毫秒）
const MOCK_DELAY = 800

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 模拟登录响应数据
function mockLoginData(params) {
  const { user_type, login_id } = params

  // 模拟账号密码错误
  if (params.password !== 'admin123' && params.password !== 'demo123' && params.password !== 'manager123' && params.password !== 'employee123') {
    const err = new Error('账号或密码错误')
    err.code = 'INVALID_CREDENTIALS'
    err.status = 401
    throw err
  }

  // 模拟账号禁用
  if (login_id === 'disabled-user') {
    const err = new Error('账号已被禁用，请联系管理员')
    err.code = 'ACCOUNT_DISABLED'
    err.status = 403
    throw err
  }

  const userMap = {
    admin: {
      user_id: 'admin-001',
      user_type: 'admin',
      name: login_id || '系统管理员',
      enterprise_id: null,
      enterprise_name: null,
      permission_level: null,
      email: null,
      last_login_at: new Date().toISOString(),
      last_login_ip: '127.0.0.1'
    },
    enterprise: {
      user_id: login_id || 'demo-company',
      user_type: 'enterprise',
      name: login_id === 'demo-company' ? '示例科技有限公司' : login_id,
      enterprise_id: login_id || 'demo-company',
      enterprise_name: login_id === 'demo-company' ? '示例科技有限公司' : login_id,
      permission_level: null,
      email: 'admin@' + (login_id || 'example.com'),
      last_login_at: new Date().toISOString(),
      last_login_ip: '127.0.0.1'
    },
    employee: {
      user_id: login_id || 'demo-company90010001',
      user_type: 'employee',
      name: login_id?.includes('9001') ? '超级管理员' : login_id?.includes('5101') ? '部门经理' : '普通员工',
      enterprise_id: 'demo-company',
      enterprise_name: '示例科技有限公司',
      permission_level: login_id?.includes('9001') ? 9 : login_id?.includes('5101') ? 5 : 2,
      email: (login_id || 'admin') + '@demo-company.com',
      last_login_at: new Date().toISOString(),
      last_login_ip: '127.0.0.1'
    }
  }

  return {
    data: {
      access_token: 'mock_access_token_' + Date.now(),
      refresh_token: 'mock_refresh_token_' + Date.now(),
      token_type: 'bearer',
      expires_in: 7200,
      user: userMap[user_type] || userMap.employee
    }
  }
}

/**
 * 登录
 * @param {Object} params - { login_id, password, user_type }
 * @returns {Promise} { access_token, refresh_token, token_type, expires_in, user }
 */
export function loginApi(params) {
  if (MOCK_ENABLED) {
    return delay(MOCK_DELAY).then(() => mockLoginData(params))
  }
  return request.post('/api/v1/auth/login', params)
}

/**
 * 刷新 access_token
 * @param {string} refreshToken
 * @returns {Promise} { access_token, token_type, expires_in }
 */
export function refreshTokenApi(refreshToken) {
  if (MOCK_ENABLED) {
    return delay(300).then(() => ({
      data: {
        access_token: 'mock_access_token_refreshed_' + Date.now(),
        token_type: 'bearer',
        expires_in: 7200
      }
    }))
  }
  return request.post('/api/v1/auth/refresh', { refresh_token: refreshToken })
}

/**
 * 获取当前用户基本信息（不查库，从JWT解析）
 * @returns {Promise}
 */
export function getMeApi() {
  if (MOCK_ENABLED) {
    return delay(300).then(() => ({
      data: {
        user_id: 'demo-company90010001',
        user_type: 'employee',
        name: '超级管理员',
        enterprise_id: 'demo-company',
        enterprise_name: null,
        permission_level: 9,
        email: null,
        last_login_at: null,
        last_login_ip: null
      }
    }))
  }
  return request.get('/api/v1/auth/me')
}

/**
 * 获取当前用户完整信息（查库）
 * @returns {Promise}
 */
export function getMeProfileApi() {
  if (MOCK_ENABLED) {
    return delay(300).then(() => ({
      data: {
        user_id: 'demo-company90010001',
        user_type: 'employee',
        name: '超级管理员',
        enterprise_id: 'demo-company',
        enterprise_name: '示例科技有限公司',
        permission_level: 9,
        email: 'admin@demo-company.com',
        last_login_at: new Date().toISOString(),
        last_login_ip: '127.0.0.1'
      }
    }))
  }
  return request.get('/api/v1/auth/me/profile')
}

/**
 * 登出
 * @returns {Promise}
 */
export function logoutApi() {
  if (MOCK_ENABLED) {
    return delay(300).then(() => ({ data: { message: 'Logged out' } }))
  }
  return request.post('/api/v1/auth/logout')
}
