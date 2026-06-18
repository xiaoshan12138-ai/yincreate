<template>
  <AppLayout>
    <!-- 定价/充值页面主容器 -->
    <div class="pricing-page">
      <!-- 左侧主内容区 - 充值流程 -->
      <div class="pricing-main">
        <!-- 充值横幅 - 影创点介绍 -->
        <div class="recharge-banner">
          <div class="banner-text">
            <h2 class="banner-title">充值影创点</h2>
            <p class="banner-subtitle">影创点可用于支付会员、素材购买、增值服务等</p>
          </div>
          <div class="banner-illustration">
              <div class="illustration-wallet">
                <i data-lucide="wallet" style="width: 54px; height: 54px; color: #a5b4fc;"></i>
              <div class="coin coin-1">P</div>
              <div class="coin coin-2">P</div>
            </div>
          </div>
        </div>

        <!-- 选择充值金额 -->
        <div class="recharge-section">
          <h3 class="section-title">选择充值金额</h3>
          <div class="amount-grid">
            <div
              v-for="opt in amountOptions"
              :key="opt.value"
              :class="['amount-card', { selected: selectedAmount === opt.value }]"
              @click="selectAmount(opt.value)"
            >
              <div class="amount-bonus-tag">送 {{ opt.bonus }}</div>
              <div class="amount-price">¥ {{ opt.value }}</div>
              <div class="amount-points">影创点 {{ opt.points.toLocaleString() }}</div>
              <div v-if="selectedAmount === opt.value" class="amount-check">
                <i data-lucide="check" style="width: 16px; height: 16px;"></i>
              </div>
            </div>
            <div
              :class="['amount-card amount-custom', { selected: selectedAmount === 0 && customAmount }]"
              @click="selectCustom"
            >
              <div class="amount-price-label">自定义</div>
              <div class="custom-input-wrap">
                <span class="currency-symbol">¥</span>
                <input type="number" v-model="customAmount" placeholder="请输入金额" class="custom-amount-input" @click.stop />
              </div>
              <div class="amount-points">最低充值 10 元</div>
            </div>
          </div>
          <p class="recharge-note">充值说明：充值金额按 1 元 = 100 影创点 进行换算。不同充值档位享受不同赠送比例。</p>
        </div>

        <!-- 选择支付方式 -->
        <div class="recharge-section">
          <h3 class="section-title">选择支付方式</h3>
          <div class="payment-grid">
            <div
              v-for="method in paymentMethods"
              :key="method.id"
              :class="['payment-card', { selected: selectedPayment === method.id }]"
              @click="selectPayment(method.id)"
            >
              <div class="payment-icon" :style="{ background: method.color + '10', color: method.color }">
                <i :data-lucide="method.icon" style="width: 22px; height: 22px;"></i>
              </div>
              <span class="payment-name">{{ method.name }}</span>
              <div v-if="selectedPayment === method.id" class="payment-check">
                <i data-lucide="check" style="width: 16px; height: 16px;"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部结算栏 -->
        <div class="checkout-bar">
          <div class="checkout-left">
            <div class="checkout-item">
              <span class="checkout-label">充值金额</span>
              <span class="checkout-value">¥ {{ getCurrentPayAmount() }}</span>
            </div>
            <div class="checkout-item">
              <span class="checkout-label">赠送影创点</span>
              <span class="checkout-value bonus-green">+{{ getBonusPoints().toLocaleString() }}</span>
            </div>
            <div class="checkout-item">
              <span class="checkout-label">获得影创点</span>
              <span class="checkout-value total-purple">{{ getTotalPoints().toLocaleString() }}</span>
            </div>
            <div class="checkout-item checkout-total">
              <span class="checkout-label">应付金额：</span>
              <span class="checkout-final">¥ {{ getCurrentPayAmount() }}</span>
            </div>
          </div>
          <div class="checkout-right">
            <label class="agreement-check">
              <input type="checkbox" v-model="agreed">
              <span>我已阅读并同意 <a href="javascript:;">《影创 studio 充值协议》</a></span>
            </label>
            <button class="pay-now-btn" @click="proceedToPay">立即支付</button>
          </div>
        </div>

        <p class="footer-contact">如有任何问题，请联系在线客服或发送邮件至 service@yingchuang.com</p>
      </div>

      <!-- 右侧边栏 -->
      <div class="pricing-sidebar">
        <!-- 我的影创点 -->
        <div class="points-balance-card">
          <h3 class="points-title">我的影创点</h3>
          <div class="points-row">
            <span class="points-number">12,560</span>
            <span class="points-unit">影创点</span>
          </div>
          <div class="points-tabs">
            <button :class="['point-tab', { active: activeTab === '影创点明细' }]" @click="activeTab = '影创点明细'">影创点明细</button>
            <button :class="['point-tab', { active: activeTab === '充值记录' }]" @click="activeTab = '充值记录'">充值记录</button>
          </div>
          <p class="points-hint">影创点永久有效，可叠加使用</p>
        </div>

        <!-- 常见问题 -->
        <div class="faq-section">
          <div class="faq-header">
            <h3 class="faq-title">常见问题</h3>
            <a href="javascript:;" class="faq-more">更多 ›</a>
          </div>
          <div class="faq-list">
            <div v-for="(item, idx) in faqItems" :key="idx" class="faq-item">
              <div class="faq-q">{{ item.q }}</div>
              <div class="faq-a">{{ item.a }}</div>
              <i data-lucide="chevron-right" class="faq-arrow" style="width: 14px; height: 14px;"></i>
            </div>
          </div>
        </div>

        <!-- 安全保障 -->
        <div class="security-section">
          <h3 class="security-title">安全保障</h3>
          <div class="security-list">
            <div v-for="(item, idx) in securityItems" :key="idx" class="security-item">
              <div class="security-icon">
                <i :data-lucide="item.icon" style="width: 16px; height: 16px;"></i>
              </div>
              <div class="security-text">
                <div class="security-name">{{ item.title }}</div>
                <div class="security-desc">{{ item.desc }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'

const activeTab = ref('影创点明细')
const selectedAmount = ref(50)
const customAmount = ref('')
const selectedPayment = ref('wechat')
const agreed = ref(false)

const amountOptions = [
  { value: 10, bonus: '10%', points: 1100 },
  { value: 50, bonus: '15%', points: 5750 },
  { value: 100, bonus: '20%', points: 12000 },
  { value: 300, bonus: '25%', points: 37500 },
  { value: 500, bonus: '30%', points: 65000 }
]

const paymentMethods = [
  { id: 'wechat', name: '微信支付', icon: 'message-circle', color: '#07c160' },
  { id: 'alipay', name: '支付宝支付', icon: 'wallet', color: '#1677ff' },
  { id: 'unionpay', name: '银联支付', icon: 'credit-card', color: '#e03e4d' },
  { id: 'qq', name: 'QQ 钱包支付', icon: 'send', color: '#12b7f5' },
  { id: 'apple', name: 'Apple Pay', icon: 'apple', color: '#000' },
  { id: 'transfer', name: '对公转账', icon: 'building-2', color: '#6b7280' }
]

const faqItems = [
  { q: '影创点可以用来做什么？', a: '可用于支付会员、素材购买、增值服务等。' },
  { q: '影创点是否有效期限？', a: '影创点永久有效，可叠加使用。' },
  { q: '充值到账怎么办？', a: '一般实时到账，如延迟可联系客服处理。' },
  { q: '可以申请发票吗？', a: '支持开具电子发票，充值后可在订单记录中申请。' }
]

const securityItems = [
  { title: '官方正版', desc: '影创 studio 官方直充，安全可靠', icon: 'shield-check' },
  { title: '支付安全', desc: '多重加密保护，支付安全有保障', icon: 'lock' },
  { title: '售后无忧', desc: '如有问题，7×24 小时在线客服支持', icon: 'headphones' }
]

function selectAmount(val) {
  selectedAmount.value = val
  customAmount.value = ''
  nextTick(() => {
    if (window.lucide) lucide.createIcons()
  })
}

function selectCustom() {
  selectedAmount.value = 0
  nextTick(() => {
    if (window.lucide) lucide.createIcons()
  })
}

function selectPayment(id) {
  selectedPayment.value = id
  nextTick(() => {
    if (window.lucide) lucide.createIcons()
  })
}

function getSelectedOption() {
  return amountOptions.find(o => o.value === selectedAmount.value)
}

function getBonusPoints() {
  if (selectedAmount.value > 0) {
    const opt = getSelectedOption()
    return opt ? opt.points - selectedAmount.value * 100 : 0
  }
  const val = parseFloat(customAmount.value) || 0
  return Math.floor(val * 10)
}

function getTotalPoints() {
  if (selectedAmount.value > 0) {
    const opt = getSelectedOption()
    return opt ? opt.points : 0
  }
  const val = parseFloat(customAmount.value) || 0
  return Math.floor(val * 100) + getBonusPoints()
}

function getCurrentPayAmount() {
  return selectedAmount.value > 0 ? selectedAmount.value : (parseFloat(customAmount.value) || 0)
}

function proceedToPay() {
  if (!agreed.value) {
    alert('请先阅读并同意充值协议')
    return
  }
  alert(`即将跳转到支付...\n\n充值金额：¥${getCurrentPayAmount()}\n获得影创点：${getTotalPoints()}\n支付方式：${paymentMethods.find(m => m.id === selectedPayment.value).name}`)
}

onMounted(() => {
  setTimeout(() => {
    if (window.lucide) lucide.createIcons()
  }, 100)
})
</script>

<style scoped>
.pricing-page {
  display: flex;
  gap: 20px;
  width: 100%;
  align-items: stretch;
}

.pricing-main {
  width: 920px;
  max-width: 100%;
  flex-shrink: 1;
  min-width: 0;
}

.recharge-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28px 32px;
  background: linear-gradient(135deg, #9db3f9 0%, #74aee1 50%, #0bacdd 100%);
  border-radius: 16px;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
}

.recharge-banner::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 400px;
  height: 400px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.banner-text {
  z-index: 1;
}

.banner-title {
  font-size: 28px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 6px;
}

.banner-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
}

.banner-illustration {
  z-index: 1;
}

.illustration-wallet {
  position: relative;
  width: 120px;
  height: 120px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.coin {
  position: absolute;
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 18px;
  color: #fff;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
}

.coin-1 {
  top: -12px;
  right: -8px;
  animation: float 3s ease-in-out infinite;
}

.coin-2 {
  bottom: -8px;
  left: -8px;
  animation: float 3s ease-in-out infinite 1.5s;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.recharge-section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 17px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 20px;
}

.amount-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}

.amount-card {
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  position: relative;
}

.amount-card:hover {
  border-color: #c7d2fe;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.08);
}

.amount-card.selected {
  border-color: #0b80e7;
  background: #eff6ff;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.15);
}

.amount-bonus-tag {
  position: absolute;
  top: -10px;
  right: 12px;
  padding: 4px 10px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  border-radius: 6px;
}

.amount-price {
  font-size: 22px;
  font-weight: 800;
  color: #111827;
  margin: 6px 0 4px;
}

.amount-price-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 8px 0 6px;
}

.amount-points {
  font-size: 13px;
  color: #9ca3af;
}

.custom-input-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin: 8px 0;
}

.currency-symbol {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
}

.custom-amount-input {
  width: 80px;
  padding: 6px 10px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  outline: none;
  transition: all 0.2s ease;
}

.custom-amount-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.amount-check {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: #3b82f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.payment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(145px, 1fr));
  gap: 12px;
}

.payment-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.payment-card:hover {
  border-color: #c7d2fe;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.08);
}

.payment-card.selected {
  border-color: #0b80e7;
  background: #eff6ff;
}

.payment-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.payment-name {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.payment-check {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: #3b82f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.checkout-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  margin-bottom: 16px;
}

.checkout-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.checkout-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.checkout-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.checkout-value {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.bonus-green {
  color: #10b981 !important;
}

.total-purple {
  color: #6366f1 !important;
}

.checkout-total .checkout-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.checkout-final {
  font-size: 24px !important;
  font-weight: 800 !important;
  color: #ef4444 !important;
}

.checkout-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.agreement-check {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
}

.agreement-check input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #6366f1;
  cursor: pointer;
}

.agreement-check a {
  color: #6366f1;
  text-decoration: underline;
}

.pay-now-btn {
  padding: 12px 32px;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #4fc3e7 0%, #404cf7 100%);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.pay-now-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.footer-contact {
  text-align: center;
  font-size: 13px;
  color: #9ca3af;
  margin-top: 20px;
}

.pricing-sidebar {
  width: 400px;
  max-width: 35%;
  flex-shrink: 1;
  min-width: 260px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.points-balance-card,
.faq-section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px;
}

.security-section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px;
  min-height: 407px;
}

.points-title,
.faq-title,
.security-title {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 16px;
}

.points-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 16px;
}

.points-number {
  font-size: 28px;
  font-weight: 800;
  color: #111827;
}

.points-unit {
  font-size: 14px;
  color: #6b7280;
}

.points-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.point-tab {
  flex: 1;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.point-tab.active {
  color: #6366f1;
  background: #eff6ff;
  border-color: #6366f1;
}

.points-hint {
  font-size: 12px;
  color: #9ca3af;
}

.faq-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.faq-more {
  font-size: 13px;
  color: #6366f1;
  text-decoration: none;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.faq-item {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.faq-item:hover {
  background: #f3f4f6;
}

.faq-q {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
}

.faq-a {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
}

.faq-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #d1d5db;
}

.security-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.security-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.security-icon {
  width: 32px;
  height: 32px;
  background: #eff6ff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6366f1;
  flex-shrink: 0;
}

.security-name {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 2px;
}

.security-desc {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
}

.recharge-note {
  font-size: 13px;
  color: #9ca3af;
  line-height: 1.6;
}
</style>
