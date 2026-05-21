<template>
  <AppLayout>
    <!-- AI生成页面主容器 -->
    <div class="generate-page">
      <!-- 页面头部 - 标题和副标题 -->

      <!-- 三栏布局：控制面板 | 画布区域 | 历史记录 -->
      <div class="generate-layout">
        <!-- 左侧控制面板 - 参数设置 -->
        <div class="control-panel">
          <!-- 生成类型选择 -->
          <div class="panel-section">
            <h3 class="section-label">生成类型</h3>
            <div class="type-selector">
              <button
                v-for="type in generateTypes"
                :key="type.id"
                :class="['type-btn', { active: selectedType === type.id }]"
                @click="selectedType = type.id"
              >
                <i :data-lucide="type.icon" style="width: 18px; height: 18px;"></i>
                {{ type.label }}
              </button>
            </div>
          </div>

          <!-- 模型选择 -->
          <div class="panel-section">
            <h3 class="section-label">模型选择</h3>
            <select v-model="selectedModel" class="model-select">
              <option v-for="model in models" :key="model.id" :value="model.id">
                {{ model.name }}
              </option>
            </select>
          </div>

          <!-- 参数设置 -->
          <div class="panel-section">
            <h3 class="section-label">参数设置</h3>
            <div class="param-group">
              <label>画面比例</label>
              <div class="ratio-options">
                <button
                  v-for="ratio in aspectRatios"
                  :key="ratio"
                  :class="['ratio-btn', { active: selectedRatio === ratio }]"
                  @click="selectedRatio = ratio"
                >
                  {{ ratio }}
                </button>
              </div>
            </div>
            <div class="param-group">
              <label>画质</label>
              <div class="quality-options">
                <button
                  v-for="quality in qualities"
                  :key="quality.id"
                  :class="['quality-btn', { active: selectedQuality === quality.id }]"
                  @click="selectedQuality = quality.id"
                >
                  {{ quality.label }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 中间画布区域 -->
         
        <div class="canvas-area">
          <!-- 画布 -->
          <div class="canvas-container" ref="canvasContainer">
            <div class="canvas-inner" :style="canvasTransformStyle">
              <div v-if="generatedCards.length === 0 && !isGenerating" class="canvas-empty">
                <i data-lucide="image" style="width: 64px; height: 64px; color: #d1d5db;"></i>
                <p>在下方输入提示词开始创作</p>
              </div>

              <div
                v-for="card in generatedCards"
                :key="card.id"
                class="generated-card"
                :style="{ left: card.x + 'px', top: card.y + 'px' }"
              >
                <div class="card-placeholder">
                  <i data-lucide="video" style="width: 32px; height: 32px;"></i>
                  <p>{{ card.title }}</p>
                </div>
              </div>

              <div v-if="isGenerating" class="generating-indicator">
                <div class="spinner"></div>
                <p>AI正在创作中...</p>
              </div>
            </div>
          </div>

          <!-- 输入框 -->
          <div class="prompt-input-container">
            <textarea
              v-model="prompt"
              class="prompt-input"
              placeholder="描述您想要生成的内容，例如：一只可爱的猫咪在花园里玩耍..."
              rows="4"
              maxlength="2000"
            ></textarea>
            <div class="input-footer">
              <span class="char-count">{{ prompt.length }} / 2000</span>
              <div class="input-actions">
                <button class="upload-btn" @click="handleUpload">
                  <i data-lucide="image-plus" style="width: 18px; height: 18px;"></i>
                  上传图片
                </button>
                <button
                  class="generate-btn"
                  :disabled="!canGenerate || isGenerating"
                  @click="handleGenerate"
                >
                  {{ isGenerating ? '生成中...' : '开始生成' }}
                  <i data-lucide="sparkles" style="width: 18px; height: 18px;"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧历史记录面板 -->
        <div class="history-panel">
          <h3 class="history-title">生成历史</h3>
          <div class="history-list">
            <div v-if="generatedCards.length === 0" class="history-empty">
              <p>暂无生成记录</p>
            </div>
            <div
              v-for="(card, index) in generatedCards.slice().reverse()"
              :key="card.id"
              class="history-item"
            >
              <div class="history-thumb"></div>
              <div class="history-info">
                <p class="history-name">{{ card.title }}</p>
                <span class="history-time">{{ index + 1 }} 分钟前</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'

const prompt = ref('')
const selectedType = ref('text-to-video')
const selectedModel = ref('gpt-4o')
const selectedRatio = ref('16:9')
const selectedQuality = ref('hd')
const isGenerating = ref(false)
const generatedCards = ref([])
const canvasTransform = ref({ x: 0, y: 0, scale: 1 })

const generateTypes = [
  { id: 'text-to-video', label: '文本转视频', icon: 'type' },
  { id: 'image-to-video', label: '图片转视频', icon: 'image-plus' },
  { id: 'text-to-image', label: '文本转图像', icon: 'image' }
]

const models = [
  { id: 'gpt-4o', name: 'GPT-4o (推荐)' },
  { id: 'midjourney', name: 'Midjourney V6' },
  { id: 'stable-diffusion', name: 'Stable Diffusion XL' },
  { id: 'dall-e-3', name: 'DALL·E 3' }
]

const aspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4']
const qualities = [
  { id: 'sd', label: '标清' },
  { id: 'hd', label: '高清' },
  { id: '2k', label: '2K' },
  { id: '4k', label: '4K' }
]

const canGenerate = computed(() => prompt.value.trim().length > 0)
const canvasTransformStyle = computed(() => ({
  transform: `translate(${canvasTransform.value.x}px, ${canvasTransform.value.y}px) scale(${canvasTransform.value.scale})`
}))

function handleUpload() {
  alert('上传功能开发中...')
}

async function handleGenerate() {
  if (!canGenerate.value || isGenerating.value) return

  isGenerating.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 2000))

    const newCard = {
      id: Date.now(),
      title: prompt.value.slice(0, 30) + (prompt.value.length > 30 ? '...' : ''),
      type: selectedType.value,
      model: selectedModel.value,
      x: Math.random() * 600 + 100,
      y: Math.random() * 300 + 100
    }

    generatedCards.value.push(newCard)
    prompt.value = ''

    nextTick(() => {
      if (window.lucide) lucide.createIcons()
    })
  } catch (error) {
    console.error('生成失败:', error)
  } finally {
    isGenerating.value = false
  }
}

onMounted(() => {
  if (window.lucide) {
    lucide.createIcons()
  }
})
</script>

<style scoped>
.generate-page {
  max-width: 100%;
  margin: 0 auto;
}

.generate-header {
  margin-bottom: 24px;
}

.page-title-main {
  font-size: 28px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 6px;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
}

.generate-layout {
  display: grid;
  grid-template-columns: 300px 1fr 280px;
  gap: 20px;
  height: calc(100vh - 140px);
}

.control-panel,
.history-panel {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(229, 231, 235, 0.7);
}

.panel-section {
  margin-bottom: 26px;
}

.section-label {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 14px;
}

.type-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.type-btn {
  padding: 12px 16px;
  border: none;
  border-radius: 0;
  background: transparent;
  font-size: 14.5px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
}

.type-btn::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: transparent;
  border-radius: 1px;
  transition: all 0.2s ease;
}

.type-btn:hover {
  color: #3b82f6;
}

.type-btn.active {
  color: #3b82f6;
}

.type-btn.active::after {
  background: #3b82f6;
}

.model-select {
  width: 100%;
  padding: 12px 16px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  cursor: pointer;
  background: #f9fafb;
}

.model-select:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
}

.param-group {
  margin-bottom: 16px;
}

.param-group > label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 10px;
}

.ratio-options,
.quality-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.ratio-btn,
.quality-btn {
  padding: 9px 16px;
  border: none;
  border-radius: 0;
  background: transparent;
  font-size: 13.5px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.ratio-btn::after,
.quality-btn::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: transparent;
  border-radius: 1px;
  transition: all 0.2s ease;
}

.ratio-btn:hover,
.quality-btn:hover {
  color: #3b82f6;
}

.ratio-btn.active,
.quality-btn.active {
  color: #3b82f6;
}

.ratio-btn.active::after,
.quality-btn.active::after {
  background: #3b82f6;
}

.canvas-area {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.prompt-input-container {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(229, 231, 235, 0.7);
}

.prompt-input {
  width: 100%;
  border: none;
  resize: none;
  font-size: 15px;
  line-height: 1.6;
  outline: none;
  font-family: inherit;
  color: #111827;
  background: transparent;
}

.prompt-input::placeholder {
  color: #9ca3af;
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.char-count {
  font-size: 12px;
  color: #9ca3af;
}

.input-actions {
  display: flex;
  gap: 10px;
}

.upload-btn {
  padding: 10px 18px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  background: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #374151;
}

.upload-btn:hover {
  border-color: #6366f1;
  color: #6366f1;
}

.generate-btn {
  padding: 10px 28px;
  background: linear-gradient(135deg, #33d0e8 0%, #2954df 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: var(--shadow-sm), 0 4px 12px rgba(99, 102, 241, 0.25);
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md), 0 6px 16px rgba(99, 102, 241, 0.35);
}

.generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.canvas-container {
  flex: 1;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(229, 231, 235, 0.7);
}

.canvas-inner {
  width: 200%;
  height: 200%;
  position: relative;
  background: repeating-conic-gradient(#f9fafb 0% 25%, white 0% 50%) 50% / 40px 40px;
  transform-origin: 0 0;
}

.canvas-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #9ca3af;
}

.canvas-empty p {
  margin-top: 14px;
  font-size: 16px;
}

.generated-card {
  position: absolute;
  width: 300px;
  background: white;
  border-radius: 14px;
  box-shadow: var(--shadow-md);
  border: 1px solid rgba(229, 231, 235, 0.8);
  overflow: hidden;
  cursor: move;
  transition: box-shadow 0.2s ease;
}

.generated-card:hover {
  box-shadow: var(--shadow-lg);
}

.card-placeholder {
  height: 180px;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #6366f1;
}

.card-placeholder p {
  font-size: 13px;
  font-weight: 600;
}

.generating-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #6366f1;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.generating-indicator p {
  font-size: 15px;
  font-weight: 600;
}

.history-title {
  font-size: 17px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 18px;
}

.history-list {
  max-height: calc(100% - 60px);
  overflow-y: auto;
}

.history-empty {
  text-align: center;
  padding: 36px 16px;
  color: #9ca3af;
  font-size: 14.5px;
}

.history-item {
  display: flex;
  gap: 14px;
  padding: 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s ease;
  margin-bottom: 10px;
}

.history-item:hover {
  background: #f9fafb;
}

.history-thumb {
  width: 62px;
  height: 62px;
  border-radius: 10px;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  flex-shrink: 0;
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-time {
  font-size: 11.5px;
  color: #9ca3af;
}

@media (max-width: 1200px) {
  .generate-layout {
    grid-template-columns: 260px 1fr;
  }

  .history-panel {
    display: none;
  }
}

@media (max-width: 768px) {
  .generate-layout {
    grid-template-columns: 1fr;
  }

  .control-panel {
    order: 2;
  }
}
</style>
