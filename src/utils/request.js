import axios from 'axios'
import { getStorage, removeStorage } from '../utils/storage'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const request = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器：自动附加 token
request.interceptors.request.use(
  (config) => {
    const token = getStorage('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：统一处理错误
request.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data, config } = error.response
      const detail = data?.detail || {}
      const isLoginRequest = config.url?.includes('/auth/login')

      // token 过期或无效，清除本地登录状态（登录接口本身返回401不跳转）
      if (status === 401 && !isLoginRequest) {
        removeStorage('access_token')
        removeStorage('refresh_token')
        removeStorage('user')
        window.location.href = '/login'
      }

      const err = new Error(detail.message || `请求失败 (${status})`)
      err.code = detail.code || 'UNKNOWN_ERROR'
      err.status = status
      return Promise.reject(err)
    }

    // 网络错误、超时、代理失败等（无 response）
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
      const err = new Error('无法连接到服务器，请检查后端服务是否已启动')
      err.code = 'NETWORK_ERROR'
      return Promise.reject(err)
    }
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      const err = new Error('请求超时，请稍后重试')
      err.code = 'TIMEOUT_ERROR'
      return Promise.reject(err)
    }

    return Promise.reject(error)
  }
)

export default request
