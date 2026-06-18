import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getStorage, setStorage, removeStorage, setStorageWithExpiry, getStorageWithExpiry } from '../utils/storage'
import { loginApi, refreshTokenApi, getMeProfileApi, logoutApi } from '../api/auth'

// 登录有效期：7天（毫秒）
const LOGIN_EXPIRE_MS = 7 * 24 * 60 * 60 * 1000

export const useUserStore = defineStore('user', () => {
  const user = ref(getStorage('user', null))
  const accessToken = ref(getStorage('access_token', null))
  const refreshToken = ref(getStorage('refresh_token', null))
  // 过期标记：响应式 ref，登录/登出时同步更新
  const loginExpired = ref(!getStorageWithExpiry('loginTime'))

  // 首次加载时如果已过期，清除所有状态
  if (loginExpired.value && (accessToken.value || user.value)) {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    removeStorage('user')
    removeStorage('access_token')
    removeStorage('refresh_token')
  }

  const isLoggedIn = computed(() => !!accessToken.value && !!user.value && !loginExpired.value)

  function setTokens(access, refresh) {
    accessToken.value = access
    setStorage('access_token', access)
    if (refresh) {
      refreshToken.value = refresh
      setStorage('refresh_token', refresh)
    }
  }

  function setUser(userData) {
    user.value = userData
    setStorage('user', userData)
  }

  function updateUser(updates) {
    user.value = { ...user.value, ...updates }
    setStorage('user', user.value)
  }

  /**
   * 登录
   * @param {Object} params - { login_id, password, user_type }
   */
  async function login(params) {
    const res = await loginApi(params)
    const { access_token, refresh_token, user: userInfo } = res.data
    setTokens(access_token, refresh_token)
    setUser(userInfo)
    // 记录登录时间，7天后过期
    setStorageWithExpiry('loginTime', Date.now(), LOGIN_EXPIRE_MS)
    loginExpired.value = false
    return userInfo
  }

  /**
   * 刷新 access_token
   */
  async function refresh() {
    if (!refreshToken.value) throw new Error('无 refresh_token')
    const res = await refreshTokenApi(refreshToken.value)
    const { access_token } = res.data
    setTokens(access_token)
    return access_token
  }

  /**
   * 获取完整用户信息
   */
  async function fetchProfile() {
    const res = await getMeProfileApi()
    setUser(res.data)
    return res.data
  }

  /**
   * 登出
   */
  async function logout() {
    try {
      await logoutApi()
    } catch {
      // 即使接口失败也要清除本地状态
    }
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    loginExpired.value = true
    removeStorage('user')
    removeStorage('access_token')
    removeStorage('refresh_token')
    removeStorage('loginTime')
  }

  return {
    user,
    accessToken,
    refreshToken,
    isLoggedIn,
    setTokens,
    setUser,
    updateUser,
    login,
    refresh,
    fetchProfile,
    logout
  }
})
