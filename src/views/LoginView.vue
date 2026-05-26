<template>
  <!-- 登录页面主容器 -->
  <div class="login-page">
    <!-- 左侧品牌展示区域 -->
    <div class="login-brand">
      <div class="brand-bg-orb orb-1"></div>
      <div class="brand-bg-orb orb-2"></div>
      <div class="brand-bg-orb orb-3"></div>

      <div class="brand-content">
        <div class="brand-logo">
          <div class="logo-icon-large">
            <i data-lucide="play" style="width: 28px; height: 28px;"></i>
          </div>
          <span class="logo-text-large">影创studio</span>
        </div>
        <h1 class="brand-tagline">
          用 AI 释放<br><span class="accent">创意无限</span>
        </h1>
        <p class="brand-desc">
          从灵感到成片，AI让视频创作更简单高效
        </p>
        <div class="brand-features">
          <div class="feature-item">
            <i data-lucide="sparkles" style="width: 16px; height: 16px;"></i>
            <span>AI智能生成</span>
          </div>
          <div class="feature-item">
            <i data-lucide="zap" style="width: 16px; height: 16px;"></i>
            <span>极速渲染</span>
          </div>
          <div class="feature-item">
            <i data-lucide="shield" style="width: 16px; height: 16px;"></i>
            <span>安全可靠</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧登录表单区域 -->
    <div class="login-form-container">
      <form class="login-form" @submit.prevent="handleLogin">
        <h2 class="form-title">{{ isRegister ? '创建账号' : '欢迎回来' }}</h2>
        <p class="form-subtitle">{{ isRegister ? '开始您的AI创作之旅' : '登录以继续使用' }}</p>

        <!-- 认证方式切换 -->
        <div class="auth-tabs">
          <button
            type="button"
            :class="['auth-tab', { active: authMode === 'account' }]"
            @click="authMode = 'account'"
          >
            账号密码
          </button>
          <button
            type="button"
            :class="['auth-tab', { active: authMode === 'phone' }]"
            @click="authMode = 'phone'"
          >
            手机验证码
          </button>
        </div>

        <!-- 账号密码模式 -->
        <template v-if="authMode === 'account'">
          <div class="form-group">
            <label class="form-label">邮箱地址</label>
            <input
              v-model="email"
              type="email"
              class="form-input"
              placeholder="请输入邮箱"
              :class="{ error: errors.email }"
            >
            <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">密码</label>
            <div class="password-input-wrapper">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="form-input"
                placeholder="请输入密码"
                :class="{ error: errors.password }"
              >
              <button
                type="button"
                class="password-toggle"
                @click="showPassword = !showPassword"
              >
                <i :data-lucide="showPassword ? 'eye-off' : 'eye'" style="width: 18px; height: 18px;"></i>
              </button>
            </div>
            <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
          </div>
        </template>

        <!-- 手机验证码模式 -->
        <template v-if="authMode === 'phone'">
          <div class="form-group">
            <label class="form-label">手机号码</label>
            <input
              v-model="phone"
              type="tel"
              class="form-input"
              placeholder="请输入手机号"
              :class="{ error: errors.phone }"
            >
            <span v-if="errors.phone" class="error-message">{{ errors.phone }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">验证码</label>
            <div class="code-input-wrapper">
              <input
                v-model="code"
                type="text"
                class="form-input"
                placeholder="请输入验证码"
                :class="{ error: errors.code }"
              >
              <button
                type="button"
                class="send-code-btn"
                :disabled="codeCountdown > 0"
                @click="sendCode"
              >
                {{ codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码' }}
              </button>
            </div>
            <span v-if="errors.code" class="error-message">{{ errors.code }}</span>
          </div>
        </template>

        <!-- 记住我 & 忘记密码 -->
        <div class="form-options">
          <label class="remember-me">
            <input type="checkbox" v-model="rememberMe">
            <span>记住我</span>
          </label>
          <a href="#" class="forgot-password">忘记密码？</a>
        </div>

        <!-- 登录按钮 -->
        <button type="submit" class="submit-btn" :disabled="isLoading">
          {{ isLoading ? '登录中...' : (isRegister ? '注册' : '登录') }}
        </button>

        <!-- 分隔线 -->
        <div class="divider">
          <span>或</span>
        </div>

        <!-- 第三方登录 -->
        <div class="social-login">
          <button type="button" class="social-btn wechat">
            <i data-lucide="message-circle" style="width: 20px; height: 20px;"></i>
          </button>
          <button type="button" class="social-btn github">
            <i data-lucide="github" style="width: 20px; height: 20px;"></i>
          </button>
          <button type="button" class="social-btn google">
            <i data-lucide="chrome" style="width: 20px; height: 20px;"></i>
          </button>
        </div>

        <!-- 切换注册/登录 -->
        <p class="switch-mode">
          {{ isRegister ? '已有账号？' : '还没有账号？' }}
          <a href="#" @click.prevent="isRegister = !isRegister">
            {{ isRegister ? '立即登录' : '立即注册' }}
          </a>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isRegister = ref(false)
const authMode = ref('account')
const email = ref('')
const password = ref('')
const phone = ref('')
const code = ref('')
const showPassword = ref(false)
const rememberMe = ref(false)
const isLoading = ref(false)
const codeCountdown = ref(0)

const errors = reactive({})

let countdownTimer = null

function sendCode() {
  if (!phone.value.trim()) {
    errors.phone = '请输入手机号'
    return
  }
  if (!/^1\d{10}$/.test(phone.value)) {
    errors.phone = '手机号格式不正确'
    return
  }
  errors.phone = ''
  codeCountdown.value = 60
  countdownTimer = setInterval(() => {
    codeCountdown.value--
    if (codeCountdown.value <= 0) {
      clearInterval(countdownTimer)
      codeCountdown.value = 0
    }
  }, 1000)
}

function validate() {
  Object.keys(errors).forEach(key => delete errors[key])

  if (authMode.value === 'account') {
    if (!email.value.trim()) errors.email = '请输入邮箱'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) errors.email = '邮箱格式不正确'

    if (!password.value.trim()) errors.password = '请输入密码'
    else if (password.value.length < 6) errors.password = '密码至少6位'
  } else {
    if (!phone.value.trim()) errors.phone = '请输入手机号'
    else if (!/^1\d{10}$/.test(phone.value)) errors.phone = '手机号格式不正确'

    if (!code.value.trim()) errors.code = '请输入验证码'
  }

  return Object.keys(errors).length === 0
}

async function handleLogin() {
  if (!validate()) return

  isLoading.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 1500))

    const mockUser = {
      id: 10086,
      name: '创作者小明',
      avatar: '👤',
      isVip: true,
      vipExpiry: '2025-06-30',
      joinDate: '2024-01-15',
      stats: { works: 36, drafts: 12, favorites: 8, assets: 128 },
      storage: { used: 23.6, total: 100, unit: 'GB' }
    }

    userStore.setUser(mockUser)

    router.push({ path: '/', query: { showRealNameTip: 'true' } })
  } catch (error) {
    console.error('登录失败:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (window.lucide) {
    lucide.createIcons()
  }
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  background: linear-gradient(135deg, #fafafa 0%, #f5f3ff 100%);
}

.login-brand {
  width: 50%;
  background: linear-gradient(135deg, #9db3f9 0%, #74aee1 50%, #0bacdd 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.brand-bg-orb {
  position: absolute;
  border-radius: 50%;
  opacity: 0.15;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: white;
  top: -100px;
  left: -100px;
  animation: float 8s ease-in-out infinite;
}

.orb-2 {
  width: 300px;
  height: 300px;
  background: rgba(251, 191, 36, 0.4);
  bottom: -80px;
  right: -80px;
  animation: float 6s ease-in-out infinite reverse;
}

.orb-3 {
  width: 200px;
  height: 200px;
  background: white;
  top: 50%;
  right: 20%;
  animation: float 7s ease-in-out infinite 1s;
}

@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-30px) scale(1.05); }
}

.brand-content {
  position: relative;
  z-index: 1;
  color: white;
  max-width: 420px;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 40px;
}

.logo-icon-large {
  width: 52px;
  height: 52px;
  background: white;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6366f1;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.logo-text-large {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.brand-tagline {
  font-size: 48px;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 20px;
}

.accent {
  color: #fbbf24;
}

.brand-desc {
  font-size: 17px;
  line-height: 1.6;
  opacity: 0.9;
  margin-bottom: 40px;
}

.brand-features {
  display: flex;
  gap: 24px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  font-size: 13.5px;
  font-weight: 600;
}

.login-form-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  background: white;
}

.login-form {
  width: 100%;
  max-width: 420px;
}

.form-title {
  font-size: 32px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 8px;
}

.form-subtitle {
  font-size: 15px;
  color: #6b7280;
  margin-bottom: 32px;
}

.auth-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: #f3f4f6;
  padding: 4px;
  border-radius: 10px;
}

.auth-tab {
  flex: 1;
  padding: 10px 16px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.auth-tab.active {
  background: white;
  color: #111827;
  box-shadow: var(--shadow-sm);
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 13.5px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1.5px solid #d1d5db;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s ease;
  background: #f9fafb;
}

.form-input:focus {
  border-color: #6366f1;
  background: white;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
}

.form-input.error {
  border-color: #ef4444;
}

.form-input::placeholder {
  color: #9ca3af;
}

.password-input-wrapper,
.code-input-wrapper {
  position: relative;
}

.password-toggle,
.send-code-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s ease;
}

.password-toggle:hover,
.send-code-btn:hover {
  color: #6366f1;
}

.send-code-btn {
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
}

.send-code-btn:disabled {
  color: #9ca3af;
  cursor: not-allowed;
}

.error-message {
  display: block;
  font-size: 12px;
  color: #ef4444;
  margin-top: 6px;
  font-weight: 500;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  color: #6b7280;
  cursor: pointer;
}

.remember-me input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #6366f1;
  cursor: pointer;
}

.forgot-password {
  color: #6366f1;
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 600;
  transition: color 0.2s ease;
}

.forgot-password:hover {
  color: #4f46e5;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #4fc3e7 0%, #404cf7 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(99, 102, 241, 0.4);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.divider {
  text-align: center;
  margin: 28px 0;
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: calc(50% - 40px);
  height: 1px;
  background: #e5e7eb;
}

.divider::before { left: 0; }
.divider::after { right: 0; }

.divider span {
  background: white;
  padding: 0 16px;
  color: #9ca3af;
  font-size: 13px;
  position: relative;
  z-index: 1;
}

.social-login {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 28px;
}

.social-btn {
  width: 52px;
  height: 52px;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s ease;
}

.social-btn:hover {
  border-color: #6366f1;
  color: #6366f1;
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.switch-mode {
  text-align: center;
  font-size: 14px;
  color: #6b7280;
}

.switch-mode a {
  color: #6366f1;
  text-decoration: none;
  font-weight: 700;
  margin-left: 4px;
  transition: color 0.2s ease;
}

.switch-mode a:hover {
  color: #4f46e5;
}

@media (max-width: 968px) {
  .login-brand {
    display: none;
  }

  .login-form-container {
    padding: 32px 24px;
  }
}
</style>
