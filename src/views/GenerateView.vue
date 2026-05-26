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
            <div class="custom-select model-dropdown" :class="{ open: isModelDropdownOpen }" @click="toggleModelDropdown">
              <div class="select-display">
                <span>{{ selectedModelName }}</span>
                <i data-lucide="chevron-down" style="width: 16px; height: 16px; transition: transform 0.2s;"></i>
              </div>
              <div v-if="isModelDropdownOpen" class="select-dropdown">
                <div
                  v-for="model in models"
                  :key="model.id"
                  :class="['select-option', { active: selectedModel === model.id }]"
                  @click.stop="selectModel(model)"
                >
                  <div class="model-option-main">
                    <span class="model-name">{{ model.name }}</span>
                    <div class="model-tags">
                      <span v-if="model.inputType" :class="['input-type-tag', model.inputType]">
                        {{ model.categoryLabel || (model.inputType === 'image' ? '图片输入' : '文本输入') }}
                      </span>
                      <span v-if="model.vendor_name" class="vendor-tag">{{ model.vendor_name }}</span>
                      <span v-if="model.is_new" class="new-tag">新</span>
                      <span v-if="model.is_vip" class="vip-tag">VIP</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 参数设置 -->
          <div class="panel-section">
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

          <!-- 特色功能 -->
          <div class="panel-section">
            <h3 class="section-label">特色功能</h3>
            <div 
              class="custom-select feature-dropdown" 
              :class="{ open: isFeatureDropdownOpen }" 
              @click="toggleFeatureDropdown"
              ref="featureTriggerRef"
            >
              <div class="select-display">
                <span>{{ selectedFeatureLabel }}</span>
                <i data-lucide="chevron-down" style="width: 16px; height: 16px; transition: transform 0.2s;"></i>
              </div>
              <Teleport to="body">
                <div 
                  v-if="isFeatureDropdownOpen" 
                  class="select-dropdown feature-dropdown-menu"
                  :style="featureDropdownPos"
                  @click.stop
                >
                  <div
                    v-for="feature in currentFeatures"
                    :key="feature.id"
                    :class="['select-option', { active: selectedFeature === feature.id }]"
                    @click="selectFeature(feature)"
                  >
                    {{ feature.label }}
                  </div>
                </div>
              </Teleport>
            </div>
          </div>
        </div>

        <!-- 中间画布区域 -->

        <div class="canvas-area">
          <!-- 画布 -->
          <div class="canvas-container" ref="canvasContainer">
            <div class="canvas-inner">
              <div v-if="generatedCards.length === 0 && !isGenerating" class="canvas-empty">
                <i data-lucide="image" style="width: 64px; height: 64px; color: #d1d5db;"></i>
                <p>在下方输入提示词开始创作</p>
              </div>

              <div
                v-for="card in generatedCards"
                :key="card.id"
                class="generated-card"
              >
                <div v-if="card.results && card.results.length > 0" class="card-result">
                  <div v-for="(result, idx) in card.results" :key="idx" class="result-item">
                    <img
                      v-if="result.type === 'image'"
                      :src="convertBase64ToBlobUrl(result.url)"
                      :alt="'生成图片 ' + (idx + 1)"
                      class="result-image"
                    />
                    <video
                      v-else-if="result.type === 'video' && !card.loadingVideo"
                      :src="result.displayUrl || result.url"
                      controls
                      class="result-video"
                      @loadeddata="onVideoLoaded(card)"
                    ></video>
                    <div v-else-if="result.type === 'video' && card.loadingVideo" class="video-loading">
                      <div class="spinner-small"></div>
                      <p>加载视频中...</p>
                    </div>
                  </div>
                </div>
                <div v-else class="card-placeholder">
                  <i data-lucide="video" style="width: 32px; height: 32px;"></i>
                  <p>{{ card.title }}</p>
                </div>
                <div v-if="card.taskId" class="card-info">
                  <span class="task-id">任务ID: {{ card.taskId.slice(-8) }}</span>
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

            <!-- 已上传文件预览区 -->
            <div v-if="uploadedFiles.length > 0" class="uploaded-files-preview">
              <div
                v-for="(file, index) in uploadedFiles"
                :key="index"
                class="uploaded-file-item"
                :class="[`type-${file.type}`]"
              >
                <img
                  v-if="file.type === 'image'"
                  :src="convertBase64ToBlobUrl(file.url)"
                  :alt="file.name"
                  class="preview-thumb"
                />
                <video
                  v-else-if="file.type === 'video'"
                  :src="file.url"
                  class="preview-thumb"
                  muted
                />
                <div v-else-if="file.type === 'audio'" class="audio-preview">
                  <i data-lucide="music" style="width: 24px; height: 24px;"></i>
                  <span>{{ file.name }}</span>
                </div>
                <button class="remove-file-btn" @click="removeUploadedFile(index)" title="删除">
                  <i data-lucide="x" style="width: 14px; height: 14px;"></i>
                </button>
                <div class="file-type-badge">{{ getFileTypeLabel(file.type) }}</div>
              </div>
            </div>

            <div class="input-footer">
              <span class="char-count">{{ prompt.length }} / 2000</span>
              <div class="input-actions">
                <div class="upload-dropdown" :class="{ open: isUploadDropdownOpen }">
                  <button class="upload-btn" @click.stop="toggleUploadDropdown">
                    <i data-lucide="upload" style="width: 18px; height: 18px;"></i>
                    输入内容
                    <i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>
                  </button>
                  <div v-if="isUploadDropdownOpen" class="upload-menu" @click.stop>
                    <button class="upload-option" @click="handleUploadType('image')">
                      <i data-lucide="image-plus" style="width: 16px; height: 16px;"></i>
                      上传图片
                    </button>
                    <button class="upload-option" @click="handleUploadType('video')">
                      <i data-lucide="video-plus" style="width: 16px; height: 16px;"></i>
                      上传视频
                    </button>
                    <button class="upload-option" @click="handleUploadType('audio')">
                      <i data-lucide="music-plus" style="width: 16px; height: 16px;"></i>
                      上传音频
                    </button>
                  </div>
                </div>
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
              :class="['history-item', { expanded: expandedCardId === card.id }]"
              @click="toggleHistoryItem(card)"
            >
              <div class="history-header">
                <div class="history-thumb" v-if="card.results && card.results.length > 0">
                  <img
                    v-if="card.results[0].type === 'image'"
                    :src="convertBase64ToBlobUrl(card.results[0].url)"
                    :alt="'缩略图'"
                  />
                  <i v-else data-lucide="video" style="width: 20px; height: 20px; color: #6366f1;"></i>
                </div>
                <div v-else class="history-thumb-placeholder">
                  <i data-lucide="sparkles" style="width: 16px; height: 16px;"></i>
                </div>
                <div class="history-info">
                  <p class="history-prompt">{{ card.prompt || card.title }}</p>
                  <span class="history-meta">{{ getHistoryTime(card) }} · {{ getTypeLabel(card.type) }}</span>
                </div>
                <i
                  :data-lucide="expandedCardId === card.id ? 'chevron-up' : 'chevron-down'"
                  class="history-expand-icon"
                ></i>
              </div>

              <div v-if="expandedCardId === card.id" class="history-detail">
                <div class="detail-section user-request">
                  <div class="detail-label">
                    <i data-lucide="user" style="width: 14px; height: 14px;"></i>
                    用户请求
                  </div>
                  <div class="detail-content prompt-text">{{ card.prompt || '未提供提示词' }}</div>
                  <div v-if="card.model" class="detail-meta">
                    模型: {{ getModelName(card.model) }} · 类型: {{ getTypeLabel(card.type) }}
                  </div>
                  
                  <div v-if="card.uploadedInputFiles && card.uploadedInputFiles.length > 0" class="detail-section uploaded-inputs">
                    <div class="detail-label">
                      <i data-lucide="upload" style="width: 14px; height: 14px;"></i>
                      上传的输入内容
                    </div>
                    <div class="uploaded-files-list">
                      <div
                        v-for="(file, idx) in card.uploadedInputFiles"
                        :key="idx"
                        class="history-uploaded-file"
                        :class="[`type-${file.type}`]"
                      >
                        <img
                          v-if="file.type === 'image'"
                          :src="convertBase64ToBlobUrl(file.url)"
                          :alt="file.name"
                          class="history-file-thumb"
                        />
                        <video
                          v-else-if="file.type === 'video'"
                          :src="file.url"
                          class="history-file-thumb"
                          muted
                        />
                        <div v-else-if="file.type === 'audio'" class="history-audio-item">
                          <i data-lucide="music" style="width: 16px; height: 16px;"></i>
                          <span>{{ file.name }}</span>
                        </div>
                        <span class="history-file-type-badge">{{ getFileTypeLabel(file.type) }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="detail-section ai-response">
                  <div class="detail-label">
                    <i data-lucide="bot" style="width: 14px; height: 14px;"></i>
                    AI生成结果
                  </div>
                  <div v-if="card.results && card.results.length > 0" class="result-gallery">
                    <div
                      v-for="(result, idx) in card.results"
                      :key="idx"
                      class="gallery-item"
                    >
                      <div class="gallery-media-wrapper">
                        <img
                          v-if="result.type === 'image'"
                          :src="convertBase64ToBlobUrl(result.url)"
                          :alt="'生成结果 ' + (idx + 1)"
                          class="gallery-image"
                        />
                        <video
                          v-else-if="result.type === 'video'"
                          :src="result.displayUrl || result.url"
                          controls
                          class="gallery-video"
                        ></video>
                        <div class="gallery-actions">
                          <button
                            class="gallery-action-btn use-as-input-btn"
                            @click="useAsInput(result)"
                            title="作为输入使用"
                          >
                            <i data-lucide="upload" style="width: 14px; height: 14px;"></i>
                            使用
                          </button>
                          <button
                            class="gallery-action-btn download-btn"
                            @click="downloadResult(result, idx)"
                            title="下载"
                          >
                            <i data-lucide="download" style="width: 14px; height: 14px;"></i>
                            下载
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="no-result">
                    <i data-lucide="loader" style="width: 24px; height: 24px;"></i>
                    <p>生成中或暂无结果</p>
                  </div>
                  <div v-if="card.taskId" class="detail-meta task-info">
                    任务ID: {{ card.taskId }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'

const API_CONFIG = {
  BASE_URL: 'http://192.168.31.243:8003/api/v1'
}

const VENDOR_B_API_KEY = 'ErtveAQybj1XCVRsncebuiIYzTxUV0tganVf4bMijr5SKVzU'

let globalModels = {
  image_models: [],
  video_models: [],
  voices: []
}
const uploadedFiles = ref([])

function showToast(msg, type = 'info') {
  console.log(`[${type.toUpperCase()}] ${msg}`)
  alert(msg)
}

function getCurrentParams() {
  const scene = Array.from(document.querySelectorAll('.scene-controls')).find(s => {
    return window.getComputedStyle(s).display !== 'none'
  })

  let sceneType = 'image'
  if (scene) {
    if (scene.classList.contains('video-scene')) sceneType = 'video'
    else if (scene.classList.contains('digital-human-scene')) sceneType = 'digital-human'
  }

  let ratio = selectedRatio.value
  let resolution = qualityMap[selectedQuality.value] || '1080P'

  return { sceneType, ratio, resolution }
}

function convertBase64ToBlobUrl(dataUrl) {
  if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl
  const parts = dataUrl.split(',')
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png'
  const bstr = atob(parts[1])
  const u8arr = new Uint8Array(bstr.length)
  for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i)
  return URL.createObjectURL(new Blob([u8arr], { type: mime }))
}

async function fetchProtectedVideo(videoUrl) {
  try {
    const response = await fetch(videoUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${VENDOR_B_API_KEY}`
      }
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const blob = await response.blob()
    return URL.createObjectURL(blob)
  } catch (error) {
    console.error('获取受保护视频失败:', error)
    return videoUrl
  }
}

async function testApiConnection() {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    })
    if (!response.ok) return false
    const data = await response.json()
    return data.code === 200
  } catch (error) {
    console.error('API 连通性测试失败:', error)
    return false
  }
}

async function fetchModels() {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    })

    if (!response.ok) throw new Error(`获取模型列表失败: ${response.status}`)

    const data = await response.json()
    if (data.code !== 200) throw new Error(data.message || '获取模型列表失败')

    globalModels = data.data || { image_models: [], video_models: [], voices: [] }
    console.log('✅ 模型列表获取成功:', globalModels)

    if (data.data?.summary) {
      const s = data.data.summary
      console.log('📊 模型统计:',
        `图片=${s.total_image_models}, 视频=${s.total_video_models}, 音色=${s.total_voices}`,
        '| 厂商:', s.vendors?.join(', '))
    }

    return globalModels
  } catch (error) {
    console.error('❌ 获取模型列表失败:', error)
    showToast('获取模型列表失败，请检查后端服务', 'error')
    return { image_models: [], video_models: [], voices: [] }
  }
}

const prompt = ref('')
const selectedType = ref('video')
const isModelDropdownOpen = ref(false)
const isFeatureDropdownOpen = ref(false)
const featureTriggerRef = ref(null)
const featureDropdownPos = ref({})
const canvasContainer = ref(null)

function scrollToCanvasBottom() {
  nextTick(() => {
    if (canvasContainer.value) {
      canvasContainer.value.scrollTo({
        top: canvasContainer.value.scrollHeight,
        behavior: 'smooth'
      })
    }
  })
}

function toggleModelDropdown() {
  isModelDropdownOpen.value = !isModelDropdownOpen.value
  if (isModelDropdownOpen.value) {
    isFeatureDropdownOpen.value = false
  }
}

function selectModel(model) {
  selectedModel.value = model.id
  isModelDropdownOpen.value = false
  nextTick(() => {
    if (window.lucide) lucide.createIcons()
  })
}
const selectedRatio = ref('16:9')
const selectedQuality = ref('hd')
const isGenerating = ref(false)
const isUploadDropdownOpen = ref(false)
const generatedCards = ref([])
const expandedCardId = ref(null)

const generateTypes = [
  { id: 'image', label: '图片生成', icon: 'image' },
  { id: 'video', label: '视频生成', icon: 'video' },
  { id: 'digital-human', label: '数字人', icon: 'user' }
]

const qualityMap = {
  '720p': '720P',
  '1080p': '1080P',
  '2k': '2K',
  '4k': '4K'
}

const models = ref([])
const imageModels = ref([])
const videoModels = ref([])
const digitalHumanModels = ref([])

function classifyModels(fetchedModels) {
  const result = {
    image: [],
    video: [],
    digitalHuman: []
  }

  if (!fetchedModels) return result

  const allModels = [
    ...(fetchedModels.video_models || []).map(m => ({ ...m, _source: 'video_models' })),
    ...(fetchedModels.image_models || []).map(m => ({ ...m, _source: 'image_models' })),
    ...(fetchedModels.voices || []).map(m => ({ ...m, _source: 'voices', _isVoice: true }))
  ]

  allModels.forEach(model => {
    const desc = (model.description || '').toLowerCase()
    const name = (model.name || '').toLowerCase()
    const mid = (model.id || '').toLowerCase()
    const modelFeature = (model.feature || model.capabilities || '').toLowerCase()
    const source = model._source
    delete model._source

    console.log(`🔍 分析模型: ${model.name}`, { desc, source })

    const isTextToImageSignal = (
      desc.includes('text_to_image') ||
      desc.includes('image_generation') ||
      modelFeature.includes('text_to_image')
    )

    const isImageInputSignal = (
      desc.includes('图生视频') ||
      desc.includes('图生') ||
      desc.includes('img2vid') ||
      desc.includes('image_to_video') ||
      desc.includes('image2video') ||
      desc.includes('参考生成视频') ||
      desc.includes('首帧') ||
      desc.includes('first_frame') ||
      desc.includes('首尾帧') ||
      desc.includes('first_last_frame') ||
      desc.includes('智能多帧') ||
      desc.includes('smart_multi_frame') ||
      desc.includes('multi_frame') ||
      desc.includes('场景参考') ||
      desc.includes('scene_reference') ||
      desc.includes('全局参考') ||
      desc.includes('global_reference') ||
      desc.includes('图片参考') ||
      desc.includes('image_reference') ||
      desc.includes('多图参考') ||
      desc.includes('multi_reference') ||
      desc.includes('图片输入') ||
      desc.includes('image_input') ||
      desc.includes('图生图') ||
      desc.includes('img2img') ||
      desc.includes('image_edit') ||
      desc.includes('inpainting') ||
      desc.includes('局部重绘') ||
      desc.includes('扩图') ||
      desc.includes('outpaint') ||
      desc.includes('消除笔') ||
      desc.includes('erase') ||
      desc.includes('换脸') ||
      desc.includes('face_swap') ||
      desc.includes('lip_sync') ||
      desc.includes('对口型') ||
      desc.includes('换装') ||
      desc.includes('outfit') ||
      desc.includes('风格转换') ||
      desc.includes('style_transfer') ||
      desc.includes('风格替换') ||
      desc.includes('style_replace') ||
      desc.includes('场景替换') ||
      desc.includes('scene_replace') ||
      desc.includes('动作模仿') ||
      desc.includes('motion_imitate') ||
      desc.includes('motion_imitation') ||
      desc.includes('特效复刻') ||
      desc.includes('effect_copy') ||
      desc.includes('物品修复') ||
      desc.includes('object_repair') ||
      desc.includes('object_fix') ||
      desc.includes('色彩还原') ||
      desc.includes('color_restore') ||
      desc.includes('智能消除') ||
      desc.includes('smart_remove') ||
      desc.includes('remove_bg') ||
      desc.includes('upscale') ||
      desc.includes('超分辨率') ||
      desc.includes('image_extend') ||
      desc.includes('object_repair') ||
      desc.includes('object_replace') ||
      modelFeature.includes('image_reference') ||
      modelFeature.includes('global_reference') ||
      modelFeature.includes('image_edit') ||
      modelFeature.includes('image_input') ||
      modelFeature.includes('img2vid') ||
      modelFeature.includes('img2video') ||
      (name.includes('image') && !desc.includes('text_to_video'))
    )

    const isTextToVideoSignal = (
      desc.includes('text_to_video') ||
      desc.includes('文生视频') ||
      desc.includes('文本转视频') ||
      desc.includes('motion_control') ||
      desc.includes('template_effect') ||
      desc.includes('视频扩写') ||
      desc.includes('video_expand') ||
      modelFeature.includes('text_to_video') ||
      mid.includes('video')
    )

    console.log(`  判断结果:`, {
      isTextToImageSignal,
      isImageInputSignal,
      isTextToVideoSignal,
      source
    })

    const isDigitalHumanSignal = (
      model._isVoice ||
      source === 'voices' ||
      desc.includes('digital_human') ||
      desc.includes('数字人') ||
      desc.includes('voice') ||
      desc.includes('音色') ||
      desc.includes('tts') ||
      desc.includes('text_to_speech') ||
      desc.includes('speech') ||
      desc.includes('talking_head') ||
      desc.includes('avatar') ||
      name.includes('voice') ||
      name.includes('digital') ||
      mid.includes('voice') ||
      modelFeature.includes('digital_human') ||
      modelFeature.includes('tts') ||
      modelFeature.includes('voice')
    )

    console.log(`  数字人判断:`, { isDigitalHumanSignal, _isVoice: model._isVoice })

    if (isDigitalHumanSignal) {
      console.log(`  → 归类到: digitalHuman (数字人/音色)`)
      result.digitalHuman.push({
        ...model,
        inputType: 'audio',
        categoryLabel: '音频输入',
        _isDigitalHuman: true
      })
    } else if ((source === 'video_models') || (isTextToVideoSignal && !isTextToImageSignal)) {
      const finalInputType = isImageInputSignal ? 'image' : 'text'
      const finalLabel = isImageInputSignal ? '图片输入' : '文本输入'
      console.log(`  → 归类到: video (${finalLabel})`)
      result.video.push({
        ...model,
        inputType: finalInputType,
        categoryLabel: finalLabel
      })
    } else {
      const finalInputType = isImageInputSignal ? 'image' : 'text'
      const finalLabel = isImageInputSignal ? '图片输入' : '文本输入'
      console.log(`  → 归类到: image (${finalLabel})`)
      result.image.push({
        ...model,
        inputType: finalInputType,
        categoryLabel: finalLabel
      })
    }
  })

  console.log('📊 模型分类完成:', {
    图片生成: result.image.length,
    视频生成: result.video.length,
    数字人: result.digitalHuman.length
  })

  return result
}

const selectedModel = ref('')
const selectedModelName = computed(() => {
  if (!selectedModel.value) return '选择模型'
  const model = models.value.find(m => m.id === selectedModel.value)
  return model ? model.name : '选择模型'
})

async function initModels() {
  console.log('🚀 开始初始化模型列表...')

  const isConnected = await testApiConnection()

  if (!isConnected) {
    console.warn('⚠️ API 未连通，将使用默认硬编码模型')
    showToast('无法连接到后端服务，使用默认模型', 'warning')
    imageModels.value = getDefaultImageModels()
    videoModels.value = getDefaultVideoModels()
    digitalHumanModels.value = []
    updateModelsByType()
  } else {
    const fetchedModels = await fetchModels()
    const classified = classifyModels(fetchedModels)

    imageModels.value = classified.image.length > 0 ? classified.image : getDefaultImageModels()
    videoModels.value = classified.video.length > 0 ? classified.video : getDefaultVideoModels()
    digitalHumanModels.value = classified.digitalHuman.length > 0 ? classified.digitalHuman : []

    updateModelsByType()
  }

  console.log('✅ 模型列表初始化完成:', {
    图片生成: imageModels.value.length,
    视频生成: videoModels.value.length,
    数字人: digitalHumanModels.value.length,
    当前显示: models.value.length,
    总计: imageModels.value.length + videoModels.value.length + digitalHumanModels.value.length
  })
}

function updateModelsByType() {
  console.log('🔄 切换生成类型:', selectedType.value, {
    image: imageModels.value.length,
    video: videoModels.value.length,
    digitalHuman: digitalHumanModels.value.length
  })

  switch (selectedType.value) {
    case 'image':
      models.value = [...imageModels.value]
      break
    case 'video':
      models.value = [...videoModels.value]
      break
    case 'digital-human':
      models.value = [...digitalHumanModels.value]
      break
    default:
      models.value = [...videoModels.value]
  }

  selectedModel.value = ''
  console.log('✅ 模型列表已更新, 当前模型数量:', models.value.length, `(${selectedType.value})`)
}

function getDefaultModels() {
  if (selectedType.value === 'image') return getDefaultImageModels()
  if (selectedType.value === 'digital-human') return []
  return getDefaultVideoModels()
}

function getDefaultImageModels() {
  return [
    { id: 'image_5.0_lite', name: '图片5.0 Lite', description: '指令响应更精准', is_new: true, vendor: 'vendor_a', vendor_name: '腾讯云 VOD' },
    { id: 'image_5.0', name: '图片5.0', description: '全能王者，支持文生图、图生图等全能力', is_new: true, is_vip: true, free_trial: true, vendor: 'vendor_a', vendor_name: '腾讯云 VOD' },
    { id: 'hunyuan_1_5', name: 'Hunyuan 1.5', description: '混元大模型，支持中文理解', vendor: 'vendor_a', vendor_name: '腾讯云 VOD' },
    { id: 'gpt-image-2', name: 'GPT Image 2', description: 'text_to_image', vendor: 'vendor_b', vendor_name: 'Token Switch' }
  ]
}

function getDefaultVideoModels() {
  return [
    { id: 'seedance_2.0_fast_vip', name: 'Seedance 2.0 Fast VIP', description: '极速推理', is_new: true, is_vip: true, vendor: 'vendor_a', vendor_name: '腾讯云 VOD' },
    { id: 'seedance_2.0_fast', name: 'Seedance 2.0 Fast', description: '高性价比', is_new: true, vendor: 'vendor_a', vendor_name: '腾讯云 VOD' },
    { id: 'happyhorse-1.0-video-edit-720p', name: 'HappyHorse Video Edit 720p', description: '视频编辑', vendor: 'vendor_b', vendor_name: 'Token Switch' }
  ]
}

const aspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4']
const qualities = [
  { id: '720p', label: '720p' },
  { id: '1080p', label: '1080p' },
  { id: '2k', label: '2K' },
  { id: '4k', label: '4K' }
]

const featureMap = {
  'image': [
    { id: 'text2img', label: '文生图' },
    { id: 'reference', label: '参考图' },
    { id: 'style-transfer', label: '风格转换' },
    { id: 'inpaint', label: '局部重绘' },
    { id: 'outpaint', label: '扩图' },
    { id: 'erase', label: '消除笔' },
    { id: 'face-swap', label: 'AI换脸' },
    { id: 'outfit-change', label: 'AI换装' }
  ],
  'video': [
    { id: 'all-reference', label: '全能参考' },
    { id: 'video-expand', label: '视频扩写' },
    { id: 'first-last-frame', label: '首尾帧' },
    { id: 'smart-multi-frame', label: '智能多帧' },
    { id: 'first-frame-gen', label: '首帧生成' },
    { id: 'motion-imitate', label: '动作模仿' },
    { id: 'lip-sync', label: '对口型' },
    { id: 'ai-outfit', label: 'AI换装' },
    { id: 'scene-replace', label: '场景替换' },
    { id: 'local-adjust', label: '局部调整' },
    { id: 'style-replace', label: '风格替换' },
    { id: 'effect-copy', label: '特效复刻' },
    { id: 'item-fix', label: '物品修复' },
    { id: 'color-restore', label: '色彩还原' },
    { id: 'smart-remove', label: '智能消除' }
  ],
  'digital-human': [
    { id: 'talking-head', label: '数字人播报' },
    { id: 'lip-sync', label: '对口型' },
    { id: 'face-swap', label: 'AI换脸' },
    { id: 'voice-clone', label: '声音克隆' },
    { id: 'emotion-control', label: '情感控制' },
    { id: 'gesture-control', label: '手势控制' }
  ]
}

const currentFeatures = computed(() => featureMap[selectedType.value] || [])
const selectedFeature = ref('')

const selectedFeatureLabel = computed(() => {
  if (!selectedFeature.value) return '选择特色功能'
  const allFeatures = currentFeatures.value
  const feature = allFeatures.find(f => f.id === selectedFeature.value)
  return feature ? feature.label : '选择特色功能'
})

function toggleFeatureDropdown() {
  isFeatureDropdownOpen.value = !isFeatureDropdownOpen.value
  if (isFeatureDropdownOpen.value) {
    isModelDropdownOpen.value = false
    nextTick(() => {
      if (featureTriggerRef.value) {
        const rect = featureTriggerRef.value.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        featureDropdownPos.value = {
          position: 'fixed',
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          top: `${rect.bottom + 4}px`,
          zIndex: 99999,
          maxHeight: `${Math.min(400, viewportHeight - rect.bottom - 20)}px`
        }
      }
    })
  }
}

function selectFeature(feature) {
  selectedFeature.value = feature.id
  isFeatureDropdownOpen.value = false
  nextTick(() => {
    if (window.lucide) lucide.createIcons()
  })
}

const canGenerate = computed(() => prompt.value.trim().length > 0)

function toggleHistoryItem(card) {
  expandedCardId.value = expandedCardId.value === card.id ? null : card.id
  nextTick(() => {
    if (window.lucide) lucide.createIcons()
  })
}

function getHistoryTime(card) {
  const now = Date.now()
  const diff = now - card.id
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

function getTypeLabel(type) {
  const typeMap = {
    'image': '图片生成',
    'video': '视频生成',
    'digital-human': '数字人'
  }
  return typeMap[type] || type || '未知类型'
}

function getModelName(modelId) {
  const model = models.value.find(m => m.id === modelId)
  return model ? model.name : modelId || '未知模型'
}

function toggleUploadDropdown() {
  isUploadDropdownOpen.value = !isUploadDropdownOpen.value
}

function handleUploadType(fileType) {
  isUploadDropdownOpen.value = false

  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true

  switch (fileType) {
    case 'image':
      input.accept = 'image/*'
      break
    case 'video':
      input.accept = 'video/*'
      break
    case 'audio':
      input.accept = 'audio/*'
      break
    default:
      input.accept = 'image/*,video/*,audio/*'
  }

  input.onchange = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    for (const file of files) {
      const reader = new FileReader()
      reader.onload = (event) => {
        let detectedType = fileType
        if (file.type.startsWith('image/')) detectedType = 'image'
        else if (file.type.startsWith('video/')) detectedType = 'video'
        else if (file.type.startsWith('audio/')) detectedType = 'audio'

        const objectId = `${detectedType}_${uploadedFiles.value.length + 1}`

        uploadedFiles.value.push({
          type: detectedType,
          url: event.target.result,
          purpose: 'reference',
          object_id: objectId,
          name: file.name
        })

        console.log(`✅ 文件已上传: ${file.name} (${detectedType}, ID: ${objectId})`)
      }
      reader.readAsDataURL(file)
    }

    const typeLabels = { image: '图片', video: '视频', audio: '音频' }
    showToast(`已选择 ${files.length} 个${typeLabels[fileType] || '文件'}`, 'success')

    nextTick(() => {
      if (window.lucide) lucide.createIcons()
    })

    setTimeout(() => {
      console.log('📁 当前已上传文件:', uploadedFiles.value.length, '个')
    }, 500)
  }
  input.click()
}

function removeUploadedFile(index) {
  const removed = uploadedFiles.value.splice(index, 1)[0]
  console.log(`🗑️ 已删除文件: ${removed.name}`)
  
  nextTick(() => {
    if (window.lucide) lucide.createIcons()
  })
}

function getFileTypeLabel(type) {
  const labels = { image: '图片', video: '视频', audio: '音频' }
  return labels[type] || type
}

function addFileFromHistory(fileData) {
  const newFile = {
    type: fileData.type,
    url: fileData.url,
    purpose: 'reference',
    object_id: `${fileData.type}_${uploadedFiles.value.length + 1}`,
    name: fileData.name || `历史文件_${uploadedFiles.value.length + 1}`
  }
  uploadedFiles.value.push(newFile)
  console.log(`✅ 从历史记录添加文件: ${newFile.name} (${newFile.type})`)
}

function useAsInput(result) {
  addFileFromHistory({
    type: result.type,
    url: result.displayUrl || result.url,
    name: `生成结果_${Date.now()}`
  })
  showToast('已添加到输入内容', 'success')
}

function downloadResult(result, index) {
  try {
    const url = result.displayUrl || result.url
    const link = document.createElement('a')
    const timestamp = Date.now()
    
    if (result.type === 'image') {
      link.href = convertBase64ToBlobUrl(url)
      link.download = `generated_image_${timestamp}.png`
    } else if (result.type === 'video') {
      if (url.startsWith('data:') || url.includes('neolink.com')) {
        showToast('受保护视频暂不支持直接下载', 'warning')
        return
      }
      link.href = url
      link.download = `generated_video_${timestamp}.mp4`
    }
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    console.log(`📥 开始下载: ${link.download}`)
  } catch (error) {
    console.error('❌ 下载失败:', error)
    showToast('下载失败，请重试', 'error')
  }
}

function buildGenerateRequest() {
  const currentModel = models.value.find(m => m.id === selectedModel.value)
  if (!currentModel) {
    throw new Error('请先选择模型')
  }

  const params = getCurrentParams()
  let outputType
  if (selectedType.value === 'image') outputType = 'image'
  else if (selectedType.value === 'digital-human') outputType = 'digital_human'
  else outputType = 'video'

  const submitModelValue = currentModel.vendor === 'vendor_b'
    ? currentModel.id
    : currentModel.name

  let feature = selectedFeature.value || 'text_to_video'
  if (!feature || feature === '') {
    if (outputType === 'image') {
      feature = uploadedFiles.value.length > 0 ? 'image_reference' : 'text_to_image'
    } else if (outputType === 'digital_human') {
      feature = 'digital_human'
    } else {
      feature = uploadedFiles.value.length === 0 ? 'text_to_video'
        : uploadedFiles.value.length === 1 ? 'global_reference'
        : 'multi_reference'
    }
  }

  if (outputType === 'video' && uploadedFiles.value.length >= 2) {
    feature = 'multi_reference'
  }

  const request = {
    output_type: outputType,
    model: submitModelValue,
    vendor: currentModel.vendor || 'vendor_a',
    feature: feature,
    parameters: {},
    prompt: prompt.value.trim(),
    input_files: uploadedFiles.value.map((f, index) => ({
      type: f.type,
      url: f.url,
      purpose: f.purpose,
      object_id: f.object_id
    }))
  }

  if (outputType === 'image') {
    request.parameters = {
      resolution: params.resolution,
      ratio: params.ratio,
      count: 1
    }
  } else if (outputType === 'video') {
    request.parameters = {
      resolution: params.resolution,
      duration: 5,
      ratio: params.ratio
    }
  } else if (outputType === 'digital_human') {
    request.parameters = {
      voice_id: currentModel.id || '',
      action_description: ''
    }
  }

  console.log('📤 构建请求体:', JSON.stringify(request, null, 2))
  return request
}

async function postJson(url, data, timeoutMs = 120000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify(data),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('请求超时，请稍后重试')
    }
    throw error
  }
}

function extractResultFromData(data) {
  if (!data || data.code !== 200) {
    throw new Error(data?.message || '生成失败')
  }

  const resultData = data.data
  if (!resultData) {
    throw new Error('未获取到结果数据')
  }

  const taskInfo = {
    taskId: resultData.task_id,
    type: resultData.type,
    status: resultData.status,
    progress: resultData.progress
  }

  let results = []

  if (resultData.result) {
    if (resultData.result.images && Array.isArray(resultData.result.images)) {
      resultData.result.images.forEach(img => {
        results.push({
          type: 'image',
          url: img.url,
          id: img.id
        })
      })
    }

    if (resultData.result.video) {
      results.push({
        type: 'video',
        url: resultData.result.video.url,
        id: resultData.result.video.id,
        thumbnail: resultData.result.video.thumbnail
      })
    }

    if (resultData.result.video_url) {
      results.push({
        type: 'video',
        url: resultData.result.video_url,
        id: taskInfo.taskId
      })
    }
  }

  return { ...taskInfo, results }
}

async function processVideoResults(card) {
  for (const result of card.results) {
    if (result.type === 'video' && result.url && result.url.includes('neolink.com')) {
      card.loadingVideo = true
      try {
        console.log('🔒 处理受保护视频:', result.url)
        const blobUrl = await fetchProtectedVideo(result.url)
        result.displayUrl = blobUrl
        console.log('✅ 视频已转换为Blob URL')
      } catch (error) {
        console.error('❌ 处理视频失败:', error)
        result.displayUrl = result.url
      } finally {
        card.loadingVideo = false
      }
    }
  }
}

function onVideoLoaded(card) {
  console.log('▶️ 视频加载完成, 任务ID:', card?.taskId)
}

async function handleGenerate() {
  if (!canGenerate.value || isGenerating.value) return

  if (!selectedModel.value) {
    showToast('请先选择模型', 'warning')
    return
  }

  isGenerating.value = true

  try {
    const requestBody = buildGenerateRequest()

    const totalSize = JSON.stringify(requestBody).length
    let timeoutMs = 360000

    console.log(`📤 发送生成请求... (大小: ${(totalSize / 1024).toFixed(1)}KB, 超时: ${timeoutMs / 1000}s)`)

    const response = await postJson(
      `${API_CONFIG.BASE_URL}/generate?sync=true`,
      requestBody,
      timeoutMs
    )

    console.log('📥 收到响应:', response)

    const result = extractResultFromData(response)

    console.log('✅ 生成成功:', result)

    const newCard = {
      id: Date.now(),
      title: prompt.value.slice(0, 30) + (prompt.value.length > 30 ? '...' : ''),
      prompt: prompt.value,
      type: selectedType.value,
      model: selectedModel.value,
      taskId: result.taskId,
      results: result.results,
      status: 'completed',
      loadingVideo: false,
      uploadedInputFiles: [...uploadedFiles.value]
    }

    generatedCards.value.push(newCard)

    if (newCard.results.some(r => r.type === 'video')) {
      await processVideoResults(newCard)
    }

    prompt.value = ''
    uploadedFiles.value = []
    selectedFeature.value = ''

    scrollToCanvasBottom()

    nextTick(() => {
      if (window.lucide) lucide.createIcons()
    })
  } catch (error) {
    console.error('❌ 生成失败:', error)
    showToast(`生成失败: ${error.message}`, 'error')
  } finally {
    isGenerating.value = false
  }
}

onMounted(async () => {
  if (window.lucide) {
    lucide.createIcons()
  }
  document.addEventListener('click', handleClickOutside)

  await initModels()
})

watch(selectedType, async (newType) => {
  console.log('🔄 切换生成类型:', newType)
  selectedModel.value = ''
  selectedFeature.value = ''
  uploadedFiles.value = []

  updateModelsByType()

  console.log('✅ 模型列表已更新, 当前模型数量:', models.value.length, `(${newType})`)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function handleClickOutside(event) {
  const target = event.target
  if (!target.closest('.custom-select.model-dropdown')) {
    isModelDropdownOpen.value = false
  }
  if (!target.closest('.custom-select.feature-dropdown') && !target.closest('.feature-dropdown-menu')) {
    isFeatureDropdownOpen.value = false
  }
  if (!target.closest('.upload-dropdown') && !target.closest('.upload-menu')) {
    isUploadDropdownOpen.value = false
  }
}
</script>

<style scoped>
.generate-page {
  max-width: 100%;
  margin: 0 auto;
  height: calc(100vh - 80px);
}

.generate-header {
  margin-bottom: 16px;
}

.page-title-main {
  font-size: 24px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 4px;
}

.page-subtitle {
  font-size: 13px;
  color: #6b7280;
}

.generate-layout {
  display: grid;
  grid-template-columns: 280px 1fr 260px;
  gap: 16px;
  height: calc(100vh - 130px);
  overflow: hidden;
}

.control-panel,
.history-panel {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(229, 231, 235, 0.7);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.panel-section {
  margin-bottom: 18px;
  overflow: visible;
}

.section-label {
  font-size: 13.5px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 10px;
}

.type-selector {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.type-btn {
  padding: 10px 12px;
  border: none;
  border-radius: 0;
  background: transparent;
  font-size: 13.5px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
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

/* 自定义模型选择下拉框 */
.custom-select {
  position: relative;
  width: 100%;
}

.select-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
}

.select-display:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  transform: translateY(-1px);
}

.custom-select.open .select-display {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), 0 4px 12px rgba(59, 130, 246, 0.2);
  border-radius: 10px 10px 0 0;
}

/* 特色功能下拉框 - 向上展开 */
.feature-dropdown {
  overflow: visible !important;
  z-index: 200;
}

.feature-dropdown.open .select-display {
  border-radius: 0 0 10px 10px;
}

.custom-select.open .select-display i {
  transform: rotate(180deg);
}

.select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: -1.5px;
  background: white;
  border: 1.5px solid #3b82f6;
  border-top: none;
  border-radius: 0 0 10px 10px;
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.2);
  z-index: 100;
  max-height: 240px;
  overflow-y: auto;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.select-option {
  padding: 10px 12px;
  font-size: 12.5px;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
  border-left: 3px solid transparent;
}

.select-option:hover {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.08) 0%, transparent 100%);
  color: #3b82f6;
  padding-left: 16px;
}

.select-option.active {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.12) 0%, transparent 100%);
  color: #3b82f6;
  font-weight: 600;
  border-left-color: #3b82f6;
}

.model-option-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.model-name {
  font-weight: 600;
  color: #1e293b;
}

.model-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  align-items: center;
}

.input-type-tag,
.vendor-tag,
.new-tag,
.vip-tag {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  line-height: 1.3;
}

.input-type-tag.text {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
}

.input-type-tag.image {
  background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
  color: #9d174d;
}

.vendor-tag {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  color: #166534;
}

.new-tag {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
}

.vip-tag {
  background: linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%);
  color: #6b21a8;
}

.param-group {
  margin-bottom: 16px;
}

.param-group > label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.ratio-options,
.quality-options {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.ratio-btn,
.quality-btn {
  padding: 7px 12px;
  border: none;
  border-radius: 0;
  background: transparent;
  font-size: 12.5px;
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

/* 自定义多选下拉框 - 特色功能（已移除，现使用单选模式） */

.canvas-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.prompt-input-container {
  background: white;
  border-radius: 12px;
  padding: 14px;
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(229, 231, 235, 0.7);
  flex-shrink: 0;
}

.prompt-input {
  width: 100%;
  border: none;
  resize: none;
  font-size: 13.5px;
  line-height: 1.5;
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
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f3f4f6;
}

.char-count {
  font-size: 11px;
  color: #9ca3af;
}

.uploaded-files-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f3f4f6;
}

.uploaded-file-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e5e7eb;
  transition: all 0.2s ease;
}

.uploaded-file-item:hover {
  border-color: #6366f1;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.preview-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.audio-preview {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #6366f1;
  font-size: 10px;
  padding: 4px;
  text-align: center;
  word-break: break-all;
}

.remove-file-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.9);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 10;
}

.uploaded-file-item:hover .remove-file-btn {
  opacity: 1;
}

.remove-file-btn:hover {
  background: rgba(37, 99, 235, 1);
  transform: scale(1.1);
}

.file-type-badge {
  position: absolute;
  bottom: 4px;
  left: 4px;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 9px;
  font-weight: 600;
  border-radius: 4px;
}

.input-actions {
  display: flex;
  gap: 8px;
}

.upload-dropdown {
  position: relative;
}

.upload-dropdown.open .upload-btn {
  border-color: #6366f1;
  color: #6366f1;
}

.upload-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  background: white;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 6px;
  min-width: 140px;
  z-index: 100;
  animation: slideUp 0.2s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.upload-option {
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #374151;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.upload-option:hover {
  background: #f3f4f6;
  color: #6366f1;
}

.upload-btn {
  padding: 8px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  font-size: 13px;
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
  padding: 8px 20px;
  background: linear-gradient(135deg, #33d0e8 0%, #2954df 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
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
  border-radius: 12px;
  overflow: auto;
  position: relative;
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(229, 231, 235, 0.7);
}

.canvas-inner {
  width: 100%;
  min-height: 200px;
  position: relative;
  background: #f9fafb;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.canvas-empty {
  text-align: center;
  color: #9ca3af;
  padding: 50px 20px;
}

.canvas-empty p {
  margin-top: 10px;
  font-size: 14px;
}

.generated-card {
  width: 100%;
  background: white;
  border-radius: 10px;
  box-shadow: var(--shadow-md);
  border: 1px solid rgba(229, 231, 235, 0.8);
  overflow: hidden;
  transition: box-shadow 0.2s ease;
}

.generated-card:hover {
  box-shadow: var(--shadow-lg);
}

.card-placeholder {
  min-height: 200px;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #6366f1;
  border-radius: 8px;
}

.card-placeholder p {
  font-size: 12px;
  font-weight: 600;
}

.card-result {
  width: 100%;
}

.result-item {
  width: 100%;
}

.result-image {
  width: 100%;
  display: block;
  border-radius: 8px;
}

.result-video {
  width: 100%;
  display: block;
  border-radius: 8px;
}

.card-info {
  padding: 8px 10px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

.task-id {
  font-size: 10px;
  color: #6b7280;
  font-family: monospace;
}

.video-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  border-radius: 8px;
  min-height: 200px;
}

.video-loading p {
  font-size: 13px;
  color: #6366f1;
  font-weight: 600;
}

.spinner-small {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(99, 102, 241, 0.2);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.generating-indicator {
  text-align: center;
  color: #6366f1;
  padding: 40px 20px;
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
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 14px;
}

.history-list {
  max-height: calc(100vh - 220px);
  overflow-y: auto;
}

.history-empty {
  text-align: center;
  padding: 28px 12px;
  color: #9ca3af;
  font-size: 13px;
}

.history-item {
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 10px;
  background: white;
  border: 1.5px solid #e5e7eb;
  overflow: hidden;
}

.history-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.history-item.expanded {
  border-color: #3b82f6;
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.15);
}

.history-header {
  display: flex;
  gap: 10px;
  padding: 10px;
  align-items: center;
}

.history-thumb {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.history-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}

.history-thumb-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0ea5e9;
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-prompt {
  font-size: 13.5px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.history-meta {
  font-size: 11.5px;
  color: #6b7280;
  font-weight: 500;
}

.history-expand-icon {
  width: 18px;
  height: 18px;
  color: #9ca3af;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.history-detail {
  padding: 12px;
  border-top: 1px solid #e5e7eb;
  background: #fafafa;
}

.detail-section {
  margin-bottom: 12px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.user-request .detail-label {
  color: #2563eb;
}

.ai-response .detail-label {
  color: #059669;
}

.uploaded-inputs {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #e5e7eb;
}

.uploaded-inputs .detail-label {
  color: #7c3aed;
}

.uploaded-files-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.history-uploaded-file {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  border: 1.5px solid #e5e7eb;
  background: #f9fafb;
}

.history-file-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.history-audio-item {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: #7c3aed;
  font-size: 8px;
  padding: 2px;
  text-align: center;
  word-break: break-all;
}

.history-file-type-badge {
  position: absolute;
  bottom: 2px;
  left: 2px;
  padding: 1px 4px;
  background: rgba(0, 0, 0, 0.65);
  color: white;
  font-size: 8px;
  font-weight: 600;
  border-radius: 3px;
}

.detail-content {
  font-size: 12px;
  line-height: 1.5;
  color: #4b5563;
  background: white;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.prompt-text {
  max-height: 60px;
  overflow-y: auto;
  word-break: break-word;
}

.detail-meta {
  margin-top: 6px;
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
}

.task-info {
  font-family: monospace;
  word-break: break-all;
}

.result-gallery {
  display: grid;
  gap: 8px;
  margin-top: 6px;
}

.gallery-item {
  width: 100%;
  border-radius: 6px;
  overflow: hidden;
  background: white;
  border: 1px solid #e5e7eb;
}

.gallery-media-wrapper {
  position: relative;
}

.gallery-image,
.gallery-video {
  width: 100%;
  max-height: 200px;
  object-fit: contain;
  display: block;
}

.gallery-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.gallery-item:hover .gallery-actions {
  opacity: 1;
}

.gallery-action-btn {
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.15s ease;
  backdrop-filter: blur(4px);
}

.use-as-input-btn {
  background: rgba(99, 102, 241, 0.9);
  color: white;
}

.use-as-input-btn:hover {
  background: rgba(79, 70, 229, 1);
  transform: scale(1.05);
}

.download-btn {
  background: rgba(16, 185, 129, 0.9);
  color: white;
}

.download-btn:hover {
  background: rgba(5, 150, 105, 1);
  transform: scale(1.05);
}

.no-result {
  text-align: center;
  padding: 18px;
  color: #9ca3af;
}

.no-result p {
  margin-top: 6px;
  font-size: 12px;
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

<style>
.feature-dropdown-menu {
  background: white;
  border: 1.5px solid #3b82f6;
  border-bottom: 1.5px solid #3b82f6;
  border-top: none;
  border-radius: 0 0 10px 10px;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.18);
  overflow-y: auto;
  animation: featureSlideDown 0.25s ease-out;
  margin-top: 4px;
  position: fixed;
  top: auto;
  left: auto;
  right: auto;
  z-index: 99999;
}

@keyframes featureSlideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feature-dropdown-menu .select-option {
  padding: 12px 16px;
  font-size: 13.5px;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
  border-left: 3px solid transparent;
}

.feature-dropdown-menu .select-option:hover {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.08) 0%, transparent 100%);
  color: #3b82f6;
  padding-left: 20px;
}

.feature-dropdown-menu .select-option.active {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.12) 0%, transparent 100%);
  color: #3b82f6;
  font-weight: 600;
  border-left-color: #3b82f6;
}
</style>
