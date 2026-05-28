<template>
  <AppLayout>
    <div class="test-page">
      <div class="test-header">
        <h1 class="page-title">模型测试中心</h1>
        <p class="page-subtitle">一键批量测试所有AI模型的生成能力、速度和质量</p>
      </div>

      <div class="test-content">
        <!-- 左侧：控制面板 -->
        <div class="control-panel">
          <!-- 生成类型选择 -->
          <div class="panel-section">
            <h3>生成类型</h3>
            <div class="type-selector">
              <button
                v-for="type in generateTypes"
                :key="type.id"
                :class="['type-btn', { active: selectedType === type.id }]"
                @click="switchType(type.id)"
              >
                <i :data-lucide="type.icon"></i>
                {{ type.label }}
              </button>
            </div>
          </div>

          <!-- 批量测试控制 -->
          <div class="panel-section batch-control">
            <h3>🚀 一键批量测试</h3>

            <!-- 分辨率多选 -->
            <div class="param-group">
              <label>选择分辨率（可多选）</label>
              <div class="resolution-grid">
                <label
                  v-for="res in resolutions"
                  :key="res"
                  :class="['resolution-checkbox', { selected: selectedResolutions.includes(res) }]"
                >
                  <input
                    type="checkbox"
                    :value="res"
                    v-model="selectedResolutions"
                    :disabled="isBatchTesting"
                  />
                  <span>{{ res }}</span>
                </label>
              </div>
            </div>

            <!-- 视频时长选择（仅视频生成时显示） -->
            <div class="param-group" v-if="selectedType === 'video'">
              <label>⏱️ 视频时长（秒）</label>
              <div class="duration-grid">
                <label
                  v-for="duration in videoDurations"
                  :key="duration"
                  :class="['duration-option', { selected: selectedVideoDuration === duration }]"
                >
                  <input
                    type="radio"
                    :value="duration"
                    v-model="selectedVideoDuration"
                    name="videoDuration"
                    :disabled="isBatchTesting"
                  />
                  <span>{{ duration }}秒</span>
                </label>
              </div>
            </div>

            <!-- 提示词 -->
            <div class="param-group">
              <label>统一提示词</label>
              <textarea
                v-model="testPrompt"
                class="prompt-input"
                placeholder="输入测试提示词（所有模型使用相同提示词）..."
                rows="3"
                :disabled="isBatchTesting"
              ></textarea>
            </div>

            <!-- 图片上传 -->
            <div class="param-group image-upload-section">
              <label>📷 上传测试图片（可选）</label>
              <p class="upload-hint">用于测试参考图、局部重绘、AI换脸等需要图片输入的功能</p>

              <div v-if="uploadedTestImages.length === 0" class="upload-area" @click="triggerImageUpload">
                <i data-lucide="upload-cloud"></i>
                <span>点击或拖拽上传图片</span>
                <small>支持 JPG、PNG、WebP 格式</small>
              </div>

              <div v-else class="uploaded-images-list">
                <div
                  v-for="(image, index) in uploadedTestImages"
                  :key="index"
                  class="uploaded-image-item"
                >
                  <img :src="image.previewUrl" alt="测试图片" />
                  <div class="image-info">
                    <span class="image-name">{{ image.name }}</span>
                    <span class="image-size">{{ image.sizeText }}</span>
                  </div>
                  <button
                    class="remove-image-btn"
                    @click="removeTestImage(index)"
                    title="移除图片"
                  >
                    <i data-lucide="x"></i>
                  </button>
                </div>

                <button
                  v-if="uploadedTestImages.length < 5"
                  class="add-more-btn"
                  @click="triggerImageUpload"
                >
                  <i data-lucide="plus"></i>
                  继续添加
                </button>
              </div>

              <input
                ref="testImageInputRef"
                type="file"
                accept="image/*"
                multiple
                style="display: none;"
                @change="handleTestImagesUpload"
              />
            </div>

            <!-- 测试模式 -->
            <div class="param-group">
              <label>测试模式</label>
              <select v-model="testMode" class="param-select" :disabled="isBatchTesting">
                <option value="all">全部模型 × 全部分辨率</option>
                <option value="models">全部模型 × 单一分辨率</option>
                <option value="resolutions">单一模型 × 全部分辨率</option>
              </select>
            </div>

            <!-- 进度显示 -->
            <div v-if="isBatchTesting || testResults.length > 0" class="progress-section">
              <div class="progress-header">
                <span class="progress-label">{{ progressText }}</span>
                <span class="progress-percent">{{ progressPercent }}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
              </div>
              <div v-if="currentTestingModel" class="current-testing">
                <i data-lucide="loader-2" class="spin-icon"></i>
                <template v-if="isStopping">
                  正在接收数据: <strong>{{ currentTestingModel.name }}</strong>
                  ({{ currentResolution }}) - 等待完成后停止
                </template>
                <template v-else-if="isPaused">
                  暂停于: <strong>{{ currentTestingModel.name }}</strong>
                  ({{ currentResolution }}) - 当前任务完成后暂停
                </template>
                <template v-else>
                  正在测试: <strong>{{ currentTestingModel.name }}</strong>
                  ({{ currentResolution }})
                </template>
              </div>
            </div>

            <!-- 保存目录设置 -->
            <div class="save-directory-section">
              <label>📁 文件保存位置</label>
              <div class="directory-selector">
                <button
                  class="select-directory-btn"
                  @click="selectTestDirectory"
                  :disabled="isBatchTesting"
                >
                  <i data-lucide="folder-open"></i>
                  {{ testDirectoryHandle ? '更改目录' : '选择test文件夹' }}
                </button>
                <span v-if="testDirectoryHandle" class="directory-path">
                  <i data-lucide="check-circle"></i>
                  {{ testDirectoryHandle.name }}
                </span>
                <span v-else class="directory-hint">
                  <i data-lucide="info"></i>
                  未选择，文件将下载到浏览器默认目录
                </span>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="batch-buttons">
              <button
                v-if="!isBatchTesting"
                class="batch-btn start"
                @click="startBatchTest"
                :disabled="canStartBatch"
              >
                <i data-lucide="play-circle"></i>
                开始一键测试
              </button>
              <template v-else>
                <button class="batch-btn pause" @click="pauseBatchTest" :disabled="isStopping">
                  <i data-lucide="pause-circle"></i>
                  {{ isPaused ? '继续' : '暂停' }}
                </button>
                <button class="batch-btn stop" @click="stopBatchTest" :disabled="isStopping">
                  <i data-lucide="stop-circle"></i>
                  {{ isStopping ? '停止中...' : '停止' }}
                </button>
              </template>
            </div>

            <!-- 统计信息 -->
            <div v-if="testResults.length > 0" class="stats-summary">
              <div class="stat-item success">
                <i data-lucide="check-circle"></i>
                <span><strong>{{ successCount }}</strong> 成功</span>
              </div>
              <div class="stat-item failed">
                <i data-lucide="x-circle"></i>
                <span><strong>{{ failedCount }}</strong> 失败</span>
              </div>
              <div class="stat-item total-time">
                <i data-lucide="clock"></i>
                <span><strong>{{ totalDuration }}</strong> 总耗时</span>
              </div>
            </div>
          </div>

          <!-- 特色功能筛选 -->
          <div class="panel-section feature-filter-section">
            <div class="feature-filter-header">
              <h3>🎯 按特色功能筛选模型</h3>
              <button
                v-if="selectedFeature"
                class="clear-feature-btn"
                @click="clearFeatureFilter"
              >
                <i data-lucide="x"></i>
                清除筛选
              </button>
            </div>

            <p class="feature-hint">选择一个特色功能，查看哪些模型支持该功能</p>

            <div class="feature-selector-grid">
              <button
                v-for="feature in currentTypeFeatures"
                :key="feature.id"
                :class="['feature-select-btn', { active: selectedFeature === feature.id }]"
                @click="selectFeature(feature.id)"
                :disabled="isBatchTesting"
              >
                <span class="feature-icon">✨</span>
                <span class="feature-label">{{ feature.label }}</span>
              </button>
            </div>

            <div v-if="selectedFeature" class="feature-result-info">
              <div class="result-stats">
                <span class="stat-badge success">
                  <i data-lucide="check-circle"></i>
                  {{ modelsSupportingFeature.length }} 个模型支持
                </span>
                <span v-if="modelsNotSupportingFeature.length > 0" class="stat-badge warning">
                  <i data-lucide="x-circle"></i>
                  {{ modelsNotSupportingFeature.length }} 个不支持
                </span>
              </div>
            </div>
          </div>

          <!-- 模型多选列表 -->
          <div class="panel-section">
            <div class="model-list-header">
              <h3>选择测试模型 ({{ selectedModels.length }}/{{ filteredModels.length }})</h3>
              <div class="model-select-actions">
                <button
                  class="select-action-btn"
                  @click="selectAllModels"
                  :disabled="isBatchTesting"
                >
                  全选
                </button>
                <button
                  class="select-action-btn"
                  @click="clearModelSelection"
                  :disabled="isBatchTesting"
                >
                  清空
                </button>
              </div>
            </div>

            <div class="model-search-box">
              <i data-lucide="search"></i>
              <input
                type="text"
                v-model="modelSearchKeyword"
                placeholder="搜索模型..."
                :disabled="isBatchTesting"
              />
            </div>

            <div class="model-list-mini">
              <label
                v-for="(model, index) in filteredModelsBySearch"
                :key="model.id"
                :class="['model-item-mini', {
                  completed: isModelCompleted(model.id),
                  testing: currentTestingModel?.id === model.id,
                  failed: hasModelFailed(model.id),
                  selected: isModelSelected(model.id),
                  supports: selectedFeature && doesModelSupportFeature(model, selectedFeature),
                  'not-supports': selectedFeature && !doesModelSupportFeature(model, selectedFeature)
                }]"
                @mouseenter="onModelHover(model, true)"
                @mouseleave="onModelHover(model, false)"
              >
                <input
                  type="checkbox"
                  :value="model.id"
                  v-model="selectedModels"
                  :disabled="isBatchTesting"
                  class="model-checkbox"
                />
                <span class="model-index">{{ index + 1 }}</span>
                <span class="model-name-mini">{{ model.name }}</span>
                <span class="vendor-tag-small">{{ model.vendor_name }}</span>
                <span
                  v-if="selectedFeature"
                  :class="['feature-support-badge', doesModelSupportFeature(model, selectedFeature) ? 'yes' : 'no']"
                >
                  <i :data-lucide="doesModelSupportFeature(model, selectedFeature) ? 'check' : 'x'"></i>
                </span>
                <i v-if="isModelCompleted(model.id)" data-lucide="check" class="status-icon success"></i>
                <i v-if="hasModelFailed(model.id)" data-lucide="alert-circle" class="status-icon failed"></i>
                <i v-if="currentTestingModel?.id === model.id" data-lucide="loader-2" class="status-icon testing spin-icon"></i>
              </label>
            </div>

            <p class="model-hint">提示：鼠标悬停可查看模型支持的特色功能</p>
          </div>
        </div>

        <!-- 右侧：结果展示区 -->
        <div class="result-panel">
          <!-- 模型详情与特色功能 -->
          <div class="info-card model-detail-card">
            <h3>🔧 模型详情与特色功能</h3>
            <div class="model-detail-content" v-if="currentTestingModel || hoveredModel || selectedModels.length > 0">
              <div class="detail-header">
                <span class="detail-model-name">{{ (currentTestingModel || hoveredModel || getFirstSelectedModel())?.name }}</span>
                <span class="vendor-badge">{{ (currentTestingModel || hoveredModel || getFirstSelectedModel())?.vendor_name }}</span>
              </div>

              <div class="detail-section">
                <h4><i data-lucide="sparkles"></i> 支持的特色功能</h4>
                <div class="features-grid">
                  <span
                    v-for="feature in getModelFeatures(currentTestingModel || hoveredModel || getFirstSelectedModel())"
                    :key="feature.id"
                    class="feature-tag"
                  >
                    {{ feature.label }}
                  </span>
                </div>
              </div>

              <div class="detail-info-row">
                <span><i data-lucide="hash"></i> ID: {{ (currentTestingModel || hoveredModel || getFirstSelectedModel())?.id }}</span>
              </div>
              <div class="detail-info-row" v-if="(currentTestingModel || hoveredModel || getFirstSelectedModel())?.description">
                <span><i data-lucide="file-text"></i> {{ (currentTestingModel || hoveredModel || getFirstSelectedModel())?.description }}</span>
              </div>
              <div class="detail-tags">
                <span v-if="(currentTestingModel || hoveredModel || getFirstSelectedModel())?.is_new" class="tag new">新</span>
                <span v-if="(currentTestingModel || hoveredModel || getFirstSelectedModel())?.is_vip" class="tag vip">VIP</span>
                <span v-if="(currentTestingModel || hoveredModel || getFirstSelectedModel())?.free_trial" class="tag trial">限免</span>
              </div>
            </div>
            <div class="empty-detail" v-else>
              <i data-lucide="mouse-pointer-click"></i>
              <p>请选择或悬停模型以查看详情和特色功能</p>
            </div>
          </div>

          <!-- 实时测试结果 -->
          <div class="info-card test-results">
            <h3>📊 实时测试结果 ({{ testResults.length }}条)</h3>

            <div v-if="testResults.length === 0" class="empty-state">
              <i data-lucide="flask-conical"></i>
              <p>点击左侧「开始一键测试」开始批量测试</p>
              <p class="hint">将自动遍历所有选定的模型和分辨率组合</p>
            </div>

            <div v-else class="results-list">
              <div
                v-for="(result, index) in testResults"
                :key="index"
                :class="['result-item', result.status, { expanded: expandedResults.includes(index) }]"
              >
                <div class="result-header" @click.stop="toggleResultExpand(index)">
                  <div class="result-title">
                    <span class="expand-icon">
                      <i :data-lucide="expandedResults.includes(index) ? 'chevron-down' : 'chevron-right'"></i>
                    </span>
                    <span class="result-number">#{{ index + 1 }}</span>
                    <span class="result-model">{{ result.modelName }}</span>
                    <span class="resolution-badge">{{ result.resolution }}</span>
                    <span v-if="result.videoDuration" class="duration-badge">⏱️ {{ result.videoDuration }}s</span>
                    <span v-if="result.actualVideoDuration" class="actual-duration-badge">📹 {{ result.actualVideoDuration }}s</span>
                  </div>
                  <span :class="['status', result.status]">
                    <i data-lucide="loader-2" v-if="result.status === 'testing'" class="spin-icon"></i>
                    <i v-else :data-lucide="result.status === 'success' ? 'check-circle' : 'x-circle'"></i>
                    {{ result.status === 'testing' ? '测试中...' : (result.status === 'success' ? '成功' : '失败') }}
                  </span>
                </div>

                <div v-show="expandedResults.includes(index)" class="result-body">
                  <div class="result-meta">
                    <div class="meta-item">
                      <i data-lucide="building-2"></i>
                      <span>{{ result.vendor }}</span>
                    </div>
                    <div class="meta-item timing-info">
                      <i data-lucide="timer"></i>
                      <div class="timing-details">
                        <strong class="client-time">{{ result.duration }}</strong>
                        <span v-if="result.serverDuration" class="server-time" :title="'后端计时: ' + result.serverDuration">
                          (后端: {{ result.serverDuration }})
                        </span>
                      </div>
                    </div>
                    <div class="meta-item" v-if="result.status === 'success'">
                      <i data-lucide="hard-drive"></i>
                      <span>{{ result.fileSize }}</span>
                    </div>
                    <div class="meta-item">
                      <i data-lucide="calendar"></i>
                      <span>{{ result.timestamp }}</span>
                    </div>
                    <div class="meta-item" v-if="result.taskId">
                      <i data-lucide="link"></i>
                      <code>{{ result.taskId.slice(0, 12) }}...</code>
                    </div>
                  </div>

                  <div v-if="result.error" class="error-message">
                    <i data-lucide="alert-triangle"></i>
                    {{ result.error }}
                  </div>

                  <div v-if="result.previewUrl" class="result-preview">
                    <img v-if="result.type === 'image'" :src="result.previewUrl" alt="生成结果" @error="(e) => { e.target.style.display = 'none'; console.error('图片加载失败:', result.modelName) }" />
                    <video
                      v-else-if="result.type === 'video'"
                      :src="result.displayUrl || result.previewUrl"
                      controls
                      preload="metadata"
                      @error="(e) => { console.error('视频加载失败:', result.modelName, e.target.error); e.target.parentElement.innerHTML = '<div style=\'padding:20px;color:#ef4444;text-align:center;\'><i data-lucide=\'alert-triangle\'></i><br>视频加载失败</div>' }"
                      @loadeddata="console.log('✅ 视频加载成功:', result.modelName)"
                      @click.stop
                    >
                      您的浏览器不支持视频播放
                    </video>
                  </div>

                  <div v-if="result.filePath" class="file-info">
                    <i data-lucide="folder"></i>
                    <code>{{ result.filePath }}</code>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="action-buttons">
            <button class="action-btn export" @click="exportReport" :disabled="testResults.length === 0">
              <i data-lucide="download"></i>
              导出完整报告
            </button>
            <button class="action-btn clear" @click="clearResults" :disabled="testResults.length === 0 || isBatchTesting">
              <i data-lucide="trash-2"></i>
              清空数据
            </button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'

const API_CONFIG = {
  BASE_URL: 'http://192.168.31.243:8003/api/v1'
}

const VENDOR_B_API_KEY = 'ErtveAQybj1XCVRsncebuiIYzTxUV0tganVf4bMijr5SKVzU'

const generateTypes = [
  { id: 'image', label: '图片生成', icon: 'image' },
  { id: 'video', label: '视频生成', icon: 'video' }
]

const resolutions = ['720p', '1080p', '2k', '4k']
const videoDurations = [5, 6, 7, 8]

const featureMap = {
  'image': [
    { id: 'text2img', label: '文生图', icon: 'type' },
    { id: 'reference', label: '参考图', icon: 'image-plus' },
    { id: 'style-transfer', label: '风格转换', icon: 'palette' },
    { id: 'inpaint', label: '局部重绘', icon: 'brush' },
    { id: 'outpaint', label: '扩图', icon: 'expand' },
    { id: 'erase', label: '消除笔', icon: 'eraser' },
    { id: 'face-swap', label: 'AI换脸', icon: 'user-check' },
    { id: 'outfit-change', label: 'AI换装', icon: 'shirt' }
  ],
  'video': [
    { id: 'text_to_video', label: '文生视频', icon: 'video' },
    { id: 'global_reference', label: '全能参考', icon: 'layers' },
    { id: 'video-expand', label: '视频扩写', icon: 'maximize-2' },
    { id: 'first-last-frame', label: '首尾帧', icon: 'flip-horizontal' },
    { id: 'smart-multi-frame', label: '智能多帧', icon: 'grid-3x3' },
    { id: 'first-frame-gen', label: '首帧生成', icon: 'image' },
    { id: 'motion-imitate', label: '动作模仿', icon: 'move' },
    { id: 'lip-sync', label: '对口型', icon: 'mic' },
    { id: 'ai-outfit', label: 'AI换装', icon: 'shirt' },
    { id: 'scene-replace', label: '场景替换', icon: 'map' },
    { id: 'local-adjust', label: '局部调整', icon: 'crop' },
    { id: 'style-replace', label: '风格替换', icon: 'wand-2' },
    { id: 'effect-copy', label: '特效复刻', icon: 'sparkles' },
    { id: 'item-fix', label: '物品修复', icon: 'wrench' },
    { id: 'color-restore', label: '色彩还原', icon: 'droplet' },
    { id: 'smart-remove', label: '智能消除', icon: 'trash-2' }
  ]
}

const selectedType = ref('image')
const selectedResolutions = ref(['1080p'])
const selectedVideoDuration = ref(5)
const testPrompt = ref('一只可爱的猫咪在花园里玩耍，阳光明媚，高质量，细节丰富')
const testMode = ref('all')

const isBatchTesting = ref(false)
const isPaused = ref(false)
const shouldStop = ref(false)
const isStopping = ref(false)

const currentTestingModel = ref(null)
const currentResolution = ref('')
const currentTaskIndex = ref(0)
const totalTasks = ref(0)
const hoveredModel = ref(null)
const selectedModels = ref([])
const modelSearchKeyword = ref('')
const selectedFeature = ref('')
const showOnlyImageRequired = ref(false)
const uploadedTestImages = ref([])
const testImageInputRef = ref(null)
const testDirectoryHandle = ref(null)
const isFileSystemAccessSupported = 'showDirectoryPicker' in window

const testResults = ref([])
const expandedResults = ref([])
const allModels = ref({
  image_models: [],
  video_models: []
})

const allFilteredModels = computed(() => {
  return selectedType.value === 'image'
    ? allModels.value.image_models
    : allModels.value.video_models
})

const filteredModelsBySearch = computed(() => {
  const keyword = modelSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return allFilteredModels.value
  return allFilteredModels.value.filter(model =>
    model.name.toLowerCase().includes(keyword) ||
    (model.vendor_name && model.vendor_name.toLowerCase().includes(keyword))
  )
})

const filteredModels = computed(() => {
  if (selectedModels.value.length === 0) return []
  return allFilteredModels.value.filter(m => selectedModels.value.includes(m.id))
})

const currentTypeFeatures = computed(() => {
  return featureMap[selectedType.value] || []
})

const modelsSupportingFeature = computed(() => {
  if (!selectedFeature.value) return []
  return allFilteredModels.value.filter(m => doesModelSupportFeature(m, selectedFeature.value))
})

const modelsNotSupportingFeature = computed(() => {
  if (!selectedFeature.value) return []
  return allFilteredModels.value.filter(m => !doesModelSupportFeature(m, selectedFeature.value))
})

const canStartBatch = computed(() => {
  return isBatchTesting.value ||
    filteredModels.value.length === 0 ||
    selectedResolutions.value.length === 0 ||
    !testPrompt.value.trim()
})

const progressPercent = computed(() => {
  if (totalTasks.value === 0) return 0
  return Math.round((currentTaskIndex.value / totalTasks.value) * 100)
})

const progressText = computed(() => {
  if (!isBatchTesting.value && testResults.value.length === 0) return ''
  return `${currentTaskIndex.value} / ${totalTasks.value}`
})

const successCount = computed(() =>
  testResults.value.filter(r => r.status === 'success').length
)

const failedCount = computed(() =>
  testResults.value.filter(r => r.status === 'failed').length
)

const totalDuration = computed(() => {
  const totalMs = testResults.value.reduce((sum, r) => {
    const seconds = parseFloat(r.duration)
    return sum + (isNaN(seconds) ? 0 : seconds * 1000)
  }, 0)

  const totalSec = Math.round(totalMs / 1000)
  if (totalSec < 60) return `${totalSec}s`
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}m ${sec}s`
})

function getTypeLabel(type) {
  const map = { 'image': '图片生成', 'video': '视频生成' }
  return map[type] || type
}

function getModelFeatures(model) {
  if (!model) return []
  const type = selectedType.value
  return featureMap[type] || []
}

function onModelHover(model, isHovering) {
  hoveredModel.value = isHovering ? model : null
}

function isModelSelected(modelId) {
  return selectedModels.value.includes(modelId)
}

function selectAllModels() {
  selectedModels.value = allFilteredModels.value.map(m => m.id)
}

function clearModelSelection() {
  selectedModels.value = []
}

function triggerImageUpload() {
  if (testImageInputRef.value) {
    testImageInputRef.value.click()
  }
}

async function handleTestImagesUpload(event) {
  const files = event.target.files
  if (!files || files.length === 0) return

  const maxFiles = 5 - uploadedTestImages.value.length
  const filesToProcess = Array.from(files).slice(0, maxFiles)

  for (const file of filesToProcess) {
    if (!file.type.startsWith('image/')) {
      showToast(`文件 "${file.name}" 不是有效的图片格式`, 'warning')
      continue
    }

    try {
      const previewUrl = await convertFileToBase64(file)
      uploadedTestImages.value.push({
        name: file.name,
        size: file.size,
        sizeText: formatFileSize(file.size),
        type: file.type,
        base64Data: previewUrl,
        previewUrl: previewUrl
      })
    } catch (error) {
      console.error('处理图片失败:', error)
      showToast(`处理图片 "${file.name}" 失败`, 'error')
    }
  }

  event.target.value = ''
}

function removeTestImage(index) {
  uploadedTestImages.value.splice(index, 1)
}

function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function extractResultFromResponse(data) {
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

  console.log(`📋 提取结果: ${results.length} 个文件 (${results.map(r => r.type).join(', ')})`)
  
  return { ...taskInfo, results }
}

async function fetchProtectedVideo(videoUrl) {
  try {
    const token = localStorage.getItem('token') || ''
    const response = await fetch(videoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    
    const blob = await response.blob()
    return URL.createObjectURL(blob)
  } catch (error) {
    console.error('❌ 获取受保护视频失败:', error)
    throw error
  }
}

async function selectTestDirectory() {
  try {
    if (!isFileSystemAccessSupported) {
      showToast('您的浏览器不支持直接选择文件夹，文件将下载到默认目录', 'warning')
      return
    }

    const handle = await window.showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'downloads'
    })

    testDirectoryHandle.value = handle
    console.log('✅ 已选择保存目录:', handle.name)
    showToast(`✅ 已设置保存目录: ${handle.name}`, 'success')
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('❌ 选择目录失败:', error)
      showToast('选择目录失败: ' + error.message, 'error')
    }
  }
}

async function saveToFileWithFileSystemAccess(fileUrl, fileName, fileType) {
  try {
    if (!testDirectoryHandle.value || !isFileSystemAccessSupported) {
      console.log('📁 未指定保存目录，使用浏览器默认下载')
      await saveToFileFallback(fileUrl, fileName)
      return false
    }

    let blob

    if (fileUrl.startsWith('data:')) {
      const parts = fileUrl.split(',')
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png'
      const bstr = atob(parts[1])
      const u8arr = new Uint8Array(bstr.length)
      for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i)
      blob = new Blob([u8arr], { type: mime })
    } else {
      console.log('🌐 正在下载文件:', fileUrl)
      try {
        const response = await fetch(fileUrl)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        blob = await response.blob()
        console.log(`✅ 文件下载完成: ${(blob.size / 1024 / 1024).toFixed(2)} MB`)
      } catch (fetchError) {
        console.error('❌ 文件下载失败:', fetchError)
        await saveToFileFallback(fileUrl, fileName)
        return false
      }
    }

    const fileHandle = await testDirectoryHandle.value.getFileHandle(fileName, { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(blob)
    await writable.close()

    console.log(`💾 已保存到test文件夹: ${fileName} (${(blob.size / 1024 / 1024).toFixed(2)} MB)`)
    return true
  } catch (error) {
    console.error('❌ 保存到test文件夹失败，尝试浏览器下载:', error)
    await saveToFileFallback(fileUrl, fileName)
    return false
  }
}

async function saveToFileFallback(fileUrl, fileName) {
  try {
    if (fileUrl.startsWith('data:')) {
      const parts = fileUrl.split(',')
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png'
      const bstr = atob(parts[1])
      const u8arr = new Uint8Array(bstr.length)
      for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i)

      const blob = new Blob([u8arr], { type: mime })

      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
    } else {
      const link = document.createElement('a')
      link.href = fileUrl
      link.download = fileName
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }

    console.log(`💾 已通过浏览器下载: ${fileName}`)
    return true
  } catch (error) {
    console.error('❌ 保存文件失败:', error)
    return false
  }
}

function getFirstSelectedModel() {
  if (selectedModels.value.length === 0) return null
  return allFilteredModels.value.find(m => m.id === selectedModels.value[0]) || null
}

function doesModelSupportFeature(model, featureId) {
  if (!model || !featureId) return false
  const type = selectedType.value
  const features = featureMap[type] || []
  return features.some(f => f.id === featureId)
}

function selectFeature(featureId) {
  selectedFeature.value = featureId === selectedFeature.value ? '' : featureId
}

function clearFeatureFilter() {
  selectedFeature.value = ''
}

function extractServerTiming(responseData) {
  if (!responseData || !responseData.data) return null

  const data = responseData.data

  if (data.elapsed_time_formatted) {
    return data.elapsed_time_formatted
  }

  if (data.elapsed_time !== undefined && data.elapsed_time !== null) {
    const value = parseFloat(data.elapsed_time)
    if (!isNaN(value)) {
      if (value > 60) {
        const minutes = Math.floor(value / 60)
        const seconds = Math.round(value % 60)
        return `${minutes}分${seconds}秒`
      }
      return value.toFixed(2) + 's'
    }
  }

  const timingFields = [
    'generation_time',
    'timing',
    'duration',
    'server_time',
    'processing_time',
    'total_time'
  ]

  for (const field of timingFields) {
    if (data[field] !== undefined && data[field] !== null) {
      const value = parseFloat(data[field])
      if (!isNaN(value)) {
        if (value > 100) {
          return (value / 1000).toFixed(2) + 's'
        }
        return value.toFixed(2) + 's'
      }
    }
  }

  if (data.result) {
    const resultTimingFields = ['generation_time', 'timing', 'duration', 'elapsed', 'time']
    for (const field of resultTimingFields) {
      if (data.result[field] !== undefined && data.result[field] !== null) {
        const value = parseFloat(data.result[field])
        if (!isNaN(value)) {
          if (value > 100) {
            return (value / 1000).toFixed(2) + 's'
          }
          return value.toFixed(2) + 's'
        }
      }
    }
  }

  return null
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
    const data = await response.json()
    if (data.code === 200) {
      allModels.value = data.data
      console.log('✅ 模型列表加载成功:', {
        图片模型: data.data.image_models?.length || 0,
        视频模型: data.data.video_models?.length || 0
      })
    }
  } catch (error) {
    console.error('❌ 获取模型失败:', error)
    showToast('获取模型列表失败', 'error')
  }
}

function switchType(typeId) {
  if (isBatchTesting.value) {
    showToast('测试进行中，请先停止当前测试', 'warning')
    return
  }
  selectedType.value = typeId
  selectedModels.value = []
  modelSearchKeyword.value = ''
  selectedFeature.value = ''
  showOnlyImageRequired.value = false
  uploadedTestImages.value = []
  selectedVideoDuration.value = 5
}

function getModelPrice(model, resolution) {
  const vendor = model.vendor
  const isVideo = selectedType.value === 'video'

  if (isVideo) {
    const videoPrices = {
      '720p': { cost: vendor === 'vendor_a' ? '¥2.0' : '$0.08', time: '30-60s' },
      '1080p': { cost: vendor === 'vendor_a' ? '¥4.0' : '$0.16', time: '60-120s' },
      '2k': { cost: vendor === 'vendor_a' ? '¥8.0' : '$0.32', time: '120-180s' },
      '4k': { cost: vendor === 'vendor_a' ? '¥16.0' : '$0.64', time: '240-360s' }
    }
    return videoPrices[resolution] || videoPrices['1080p']
  }

  const imagePrices = {
    'vendor_a': {
      '720p': { cost: '¥0.5', time: '5-10s' },
      '1080p': { cost: '¥1.0', time: '10-20s' },
      '2k': { cost: '¥2.0', time: '20-30s' },
      '4k': { cost: '¥4.0', time: '40-60s' }
    },
    'vendor_b': {
      '720p': { cost: '$0.02', time: '8-15s' },
      '1080p': { cost: '$0.04', time: '15-25s' },
      '2k': { cost: '$0.08', time: '25-40s' },
      '4k': { cost: '$0.16', time: '50-70s' }
    }
  }

  return imagePrices[vendor]?.[resolution] || imagePrices['vendor_a']['1080p']
}

function isModelCompleted(modelId) {
  return testResults.value.some(r =>
    r.modelId === modelId && r.status === 'success'
  )
}

function hasModelFailed(modelId) {
  return testResults.value.some(r =>
    r.modelId === modelId && r.status === 'failed' &&
    !testResults.value.some(rr => rr.modelId === modelId && rr.status === 'success')
  )
}

async function startBatchTest() {
  if (canStartBatch.value) return

  const models = filteredModels.value
  const resList = selectedResolutions.value

  let taskQueue = []

  if (testMode.value === 'all') {
    for (const model of models) {
      for (const res of resList) {
        taskQueue.push({ model, resolution: res })
      }
    }
  } else if (testMode.value === 'models') {
    for (const model of models) {
      taskQueue.push({ model, resolution: resList[0] })
    }
  } else if (testMode.value === 'resolutions') {
    if (models.length > 0) {
      for (const res of resList) {
        taskQueue.push({ model: models[0], resolution: res })
      }
    }
  }

  if (taskQueue.length === 0) {
    showToast('没有可执行的任务', 'warning')
    return
  }

  isBatchTesting.value = true
  isPaused.value = false
  shouldStop.value = false
  isStopping.value = false
  currentTaskIndex.value = 0
  totalTasks.value = taskQueue.length
  testResults.value = []

  try {
    for (let i = 0; i < taskQueue.length; i++) {
      if (shouldStop.value) break

      while (isPaused.value && !shouldStop.value) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      if (shouldStop.value) break

      const task = taskQueue[i]
      currentTaskIndex.value = i + 1
      currentTestingModel.value = task.model
      currentResolution.value = task.resolution

      await runSingleTest(task.model, task.resolution)

      nextTick(() => {
        if (window.lucide) lucide.createIcons()
      })
    }

    if (!shouldStop.value) {
      showToast(`🎉 批量测试完成！共完成 ${testResults.value.length} 个任务`, 'success')
    } else {
      showToast(`⏹️ 测试已停止，已完成 ${testResults.value.length}/${totalTasks.value}`, 'info')
    }
  } finally {
    isBatchTesting.value = false
    isStopping.value = false
    currentTestingModel.value = null
    currentResolution.value = ''

    nextTick(() => {
      if (window.lucide) lucide.createIcons()
    })
  }
}

async function runSingleTest(model, resolution) {
  const startTime = Date.now()
  const resultId = `${model.id}_${resolution}_${startTime}`

  const createTestingResult = () => ({
    id: resultId,
    modelName: model.name,
    modelId: model.id,
    vendor: model.vendor_name,
    type: selectedType.value,
    resolution: resolution,
    videoDuration: selectedType.value === 'video' ? selectedVideoDuration.value : null,
    duration: '测试中...',
    serverDuration: null,
    taskId: null,
    status: 'testing',
    fileSize: '-',
    filePath: '',
    previewUrl: null,
    displayUrl: null,
    timestamp: new Date().toLocaleString(),
    prompt: testPrompt.value
  })

  const findResultIndex = () => testResults.value.findIndex(r => r.id === resultId)

  const updateResultToFailed = (errorMsg, durationStr) => {
    try {
      const idx = findResultIndex()
      if (idx > -1) {
        const newResults = [...testResults.value]
        newResults[idx] = {
          ...newResults[idx],
          duration: durationStr,
          status: 'failed',
          error: errorMsg
        }
        testResults.value = newResults
      } else {
        testResults.value = [...testResults.value, {
          ...createTestingResult(),
          duration: durationStr,
          status: 'failed',
          error: errorMsg
        }]
      }
    } catch (updateError) {
      console.error('更新失败状态出错:', updateError.message)
    }
  }

  testResults.value = [...testResults.value, createTestingResult()]

  nextTick(() => {
    if (window.lucide) lucide.createIcons()
    const idx = findResultIndex()
    if (idx > -1 && !expandedResults.value.includes(idx)) {
      expandedResults.value = [...expandedResults.value, idx]
    }
  })

  try {
    const submitModelValue = model.vendor === 'vendor_b' ? (model.id || model.name) : model.name

    const inputFiles = uploadedTestImages.value.map((img, index) => ({
      type: 'image',
      url: img.base64Data,
      purpose: 'reference',
      object_id: `image_${index + 1}`
    }))

    const requestBody = {
      output_type: selectedType.value,
      model: submitModelValue,
      vendor: model.vendor,
      feature: (selectedFeature.value) || (selectedType.value === 'image' ? 'text_to_image' : 'text_to_video'),
      parameters: {
        resolution: resolution.toUpperCase(),
        ratio: '16:9',
        count: 1,
        duration: selectedType.value === 'video' ? selectedVideoDuration.value : undefined
      },
      prompt: testPrompt.value,
      input_files: inputFiles
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 300000)

    let response
    let data

    try {
      response = await fetch(`${API_CONFIG.BASE_URL}/generate?sync=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
    } catch (fetchErr) {
      clearTimeout(timeoutId)
      if (fetchErr.name === 'AbortError') {
        throw new Error('请求超时（5分钟）')
      }
      throw fetchErr
    }

    if (!response.ok) {
      let errorText = ''
      try {
        errorText = await response.text()
      } catch (e) {}
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`)
    }

    try {
      data = await response.json()
    } catch (jsonErr) {
      throw new Error('解析响应JSON失败')
    }

    if (!data || data.code !== 200 || !data.data) {
      const errMsg = data?.message || data?.error || '生成失败'
      throw new Error(errMsg)
    }

    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2) + 's'

    let extractedData
    try {
      extractedData = extractResultFromResponse(data)
    } catch (extractErr) {
      throw new Error(`提取结果失败: ${extractErr.message}`)
    }

    if (!extractedData.results || extractedData.results.length === 0) {
      throw new Error('未返回有效的生成结果')
    }

    for (const resultData of extractedData.results) {
      if (!resultData.url) {
        continue
      }

      let displayUrl = resultData.url
      let previewUrl = resultData.url

      if (resultData.type === 'video' && resultData.url.includes('neolink.com')) {
        try {
          displayUrl = await Promise.race([
            fetchProtectedVideo(resultData.url),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('视频超时')), 15000)
            )
          ])
          previewUrl = displayUrl
        } catch (videoErr) {
        }
      } else if (resultData.url.startsWith('data:')) {
        previewUrl = convertBase64ToBlobUrl(resultData.url)
      }

      const fileName = `${model.name}_${resolution}.${resultData.type === 'image' ? 'png' : 'mp4'}`
      const filePath = `test/${fileName}`

      try {
        await Promise.race([
          saveToFileWithFileSystemAccess(resultData.url, fileName, resultData.type),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('保存超时')), 30000)
          )
        ])
      } catch (saveErr) {
      }

      const serverDuration = extractServerTiming(data)
      const actualVideoDuration = data.data?.result?.video?.duration || null

      const successResult = {
        ...createTestingResult(),
        type: resultData.type || selectedType.value,
        actualVideoDuration: actualVideoDuration,
        duration: duration,
        serverDuration: serverDuration,
        taskId: extractedData.taskId || data.data.task_id || null,
        status: 'success',
        fileSize: estimateFileSize(resultData.url),
        filePath: filePath,
        previewUrl: previewUrl,
        displayUrl: displayUrl
      }

      const idx = findResultIndex()
      if (idx > -1) {
        const newResults = [...testResults.value]
        newResults[idx] = successResult
        testResults.value = newResults
      }
    }
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2) + 's'
    updateResultToFailed(error.message, duration)
  }
}

function pauseBatchTest() {
  if (!isBatchTesting.value || isStopping.value) return

  isPaused.value = !isPaused.value
  showToast(isPaused.value ? '⏸️ 测试已暂停，当前任务完成后不会启动新任务' : '▶️ 继续测试...', 'info')
}

function stopBatchTest() {
  if (!isBatchTesting.value) return

  shouldStop.value = true
  isStopping.value = true
  isPaused.value = false
  showToast('⏹️ 正在停止测试，等待当前任务完成...', 'info')
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

function estimateFileSize(dataUrl) {
  if (!dataUrl) return '未知'
  const sizeKB = Math.round((dataUrl.length * 3) / 4 / 1024)
  if (sizeKB < 1024) return `${sizeKB} KB`
  return `${(sizeKB / 1024).toFixed(2)} MB`
}

function exportReport() {
  if (testResults.value.length === 0) return

  const now = new Date()
  let report = `# 📊 AI模型批量测试报告\n\n`
  report += `**生成时间**: ${now.toLocaleString()}\n`
  report += `**测试类型**: ${getTypeLabel(selectedType.value)}\n`
  report += `**测试提示词**: "${testPrompt.value}"\n\n`

  report += `---\n\n## 📈 测试概览\n\n`
  report += `| 指标 | 数值 |\n|------|------|\n`
  report += `- **总测试次数**: ${testResults.value.length}\n`
  report += `- **成功次数**: ${successCount.value}\n`
  report += `- **失败次数**: ${failedCount.value}\n`
  report += `- **成功率**: ${testResults.value.length > 0 ? ((successCount.value / testResults.value.length) * 100).toFixed(1) : 0}%\n`
  report += `- **总耗时**: ${totalDuration.value}\n\n`

  report += `---\n\n## 💰 成本估算\n\n`
  let totalCostA = 0
  let totalCostB = 0
  testResults.value.forEach(r => {
    const model = filteredModels.value.find(m => m.id === r.modelId)
    if (model) {
      const priceInfo = getModelPrice(model, r.resolution)
      const costStr = priceInfo.cost.replace(/[¥$]/g, '')
      const cost = parseFloat(costStr) || 0
      if (priceInfo.cost.startsWith('¥')) {
        totalCostA += cost
      } else {
        totalCostB += cost
      }
    }
  })

  report += `- **预估总成本 (腾讯云)**: ¥${totalCostA.toFixed(2)}\n`
  report += `- **预估总成本 (Token Switch)**: $${totalCostB.toFixed(2)}\n\n`

  report += `---\n\n## 📋 详细结果\n\n`

  const groupedByModel = {}
  testResults.value.forEach((result, index) => {
    if (!groupedByModel[result.modelName]) {
      groupedByModel[result.modelName] = []
    }
    groupedByModel[result.modelName].push({ ...result, index: index + 1 })
  })

  Object.entries(groupedByModel).forEach(([modelName, results]) => {
    const model = filteredModels.value.find(m => m.name === modelName)
    const features = model ? getModelFeatures(model) : []

    report += `### 🔹 ${modelName}\n\n`

    if (features.length > 0) {
      report += `**支持的特色功能**: ${features.map(f => f.label).join('、')}\n\n`
    }

    const hasVideoDuration = results.some(r => r.videoDuration || r.actualVideoDuration)
    if (hasVideoDuration) {
      report += `| # | 分辨率 | 视频时长 | 实际时长 | 状态 | 客户端耗时 | 后端耗时 | 文件大小 | 任务ID | 时间 |\n|---|--------|----------|----------|------|-----------|---------|----------|--------|------|\n`
    } else {
      report += `| # | 分辨率 | 状态 | 客户端耗时 | 后端耗时 | 文件大小 | 任务ID | 时间 |\n|---|--------|------|-----------|---------|----------|--------|------|\n`
    }

    results.forEach(result => {
      report += `| ${result.index} | ${result.resolution} | `
      if (hasVideoDuration) {
        report += result.videoDuration ? `${result.videoDuration}s` : '-'
        report += ` | `
        report += result.actualVideoDuration ? `${result.actualVideoDuration}s` : '-'
        report += ` | `
      }
      report += result.status === 'success' ? '✅ 成功' : '❌ 失败'
      report += ` | ${result.duration} | `
      report += result.serverDuration || '-'
      report += ` | `
      report += result.status === 'success' ? result.fileSize : '-'
      report += ` | `
      report += result.taskId ? result.taskId.slice(0, 12) + '...' : '-'
      report += ` | ${result.timestamp} |\n`
    })

    report += `\n`
  })

  report += `---\n\n## ⚠️ 错误详情\n\n`
  const failures = testResults.value.filter(r => r.status === 'failed')
  if (failures.length === 0) {
    report += `所有测试均通过，无错误记录 ✨\n\n`
  } else {
    failures.forEach((result, idx) => {
      report += `${idx + 1}. **${result.modelName}** (${result.resolution}): ${result.error}\n\n`
    })
  }

  report += `---\n\n*报告由模型测试中心自动生成*\n`

  const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `AI模型测试报告_${now.toISOString().slice(0, 10)}.md`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  showToast('📄 完整测试报告已导出', 'success')
}

function toggleResultExpand(index) {
  if (index < 0 || index >= testResults.value.length) return

  if (expandedResults.value.includes(index)) {
    expandedResults.value = expandedResults.value.filter(i => i !== index)
  } else {
    expandedResults.value = [...expandedResults.value, index]
  }

  nextTick(() => {
    if (window.lucide) lucide.createIcons()
  })
}

function clearResults() {
  if (confirm('确定要清空所有测试数据吗？此操作不可撤销。')) {
    testResults.value = []
    expandedResults.value = []
    currentTaskIndex.value = 0
    totalTasks.value = 0
    showToast('🗑️ 测试数据已清空', 'info')
  }
}

function showToast(msg, type = 'info') {
  console.log(`[${type.toUpperCase()}] ${msg}`)
}

onMounted(async () => {
  if (window.lucide) lucide.createIcons()
  await fetchModels()
  nextTick(() => {
    if (window.lucide) lucide.createIcons()
  })
})
</script>

<style scoped>
.test-page {
  max-width: 1600px;
  margin: 0 auto;
  padding: 24px;
}

.test-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
}

.test-content {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 24px;
  height: calc(100vh - 160px);
}

.test-content > div:nth-child(2) {
  overflow-y: auto;
  max-height: calc(100vh - 160px);
  padding-right: 8px;
}

.test-content > div:nth-child(2)::-webkit-scrollbar {
  width: 6px;
}

.test-content > div:nth-child(2)::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 3px;
}

.test-content > div:nth-child(2)::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.test-content > div:nth-child(2)::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.control-panel {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 20px;
  overflow-y: auto;
  max-height: calc(100vh - 160px);
}

.panel-section {
  margin-bottom: 24px;
}

.panel-section h3 {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.type-selector {
  display: flex;
  gap: 8px;
}

.type-btn {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  transition: all 0.2s;
}

.type-btn:hover:not(:disabled) {
  border-color: #3b82f6;
  background: #eff6ff;
}

.type-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.type-btn i {
  width: 16px;
  height: 16px;
}

.batch-control {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px solid #bae6fd;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.batch-control h3 {
  color: #0369a1;
  font-size: 16px;
  margin-bottom: 16px;
}

.param-group {
  margin-bottom: 16px;
}

.param-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.resolution-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.resolution-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.resolution-checkbox:hover:not(:disabled) {
  border-color: #3b82f6;
}

.resolution-checkbox.selected {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #3b82f6;
  font-weight: 600;
}

.resolution-checkbox input {
  display: none;
}

/* 视频时长选择 */
.duration-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.duration-option {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
  font-size: 13px;
}

.duration-option:hover:not(:disabled) {
  border-color: #8b5cf6;
  background: #faf5ff;
}

.duration-option.selected {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
  color: #7c3aed;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.15);
}

.duration-option input {
  display: none;
}

.param-select {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  background: white;
}

.prompt-input {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  resize: vertical;
  font-family: inherit;
}

.prompt-input:focus {
  outline: none;
  border-color: #3b82f6;
}

/* 图片上传区域 */
.image-upload-section {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 2px solid #93c5fd;
  border-radius: 10px;
  padding: 16px;
}

.upload-hint {
  font-size: 11px;
  color: #3b82f6;
  margin-bottom: 12px;
  opacity: 0.8;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  background: white;
  border: 2px dashed #93c5fd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-area:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.upload-area i {
  width: 32px;
  height: 32px;
  color: #3b82f6;
}

.upload-area span {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.upload-area small {
  font-size: 11px;
  color: #9ca3af;
}

.uploaded-images-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.uploaded-image-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: white;
  border-radius: 8px;
  position: relative;
}

.uploaded-image-item img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.image-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.image-name {
  font-size: 13px;
  font-weight: 500;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-size {
  font-size: 11px;
  color: #6b7280;
}

.remove-image-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #fecaca;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  color: #dc2626;
  transition: all 0.2s;
  flex-shrink: 0;
}

.remove-image-btn:hover {
  background: #fef2f2;
  border-color: #ef4444;
}

.remove-image-btn i {
  width: 14px;
  height: 14px;
}

.add-more-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border: 1px dashed #93c5fd;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  color: #3b82f6;
  font-size: 12px;
  transition: all 0.2s;
}

.add-more-btn:hover {
  background: #eff6ff;
  border-color: #3b82f6;
}

.add-more-btn i {
  width: 14px;
  height: 14px;
}

.progress-section {
  margin: 20px 0;
  padding: 16px;
  background: white;
  border-radius: 8px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.progress-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.current-testing {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #0369a1;
  background: #f0f9ff;
  padding: 8px 12px;
  border-radius: 6px;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 保存目录设置 */
.save-directory-section {
  margin-top: 16px;
  padding: 12px;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 8px;
}

.save-directory-section label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 8px;
}

.directory-selector {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.select-directory-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.select-directory-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.select-directory-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.select-directory-btn i {
  width: 16px;
  height: 16px;
}

.directory-path {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #166534;
  font-weight: 500;
  padding: 6px 10px;
  background: #dcfce7;
  border-radius: 6px;
}

.directory-path i {
  width: 14px;
  height: 14px;
}

.directory-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #92400e;
  opacity: 0.8;
}

.directory-hint i {
  width: 12px;
  height: 12px;
}

.batch-buttons {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.batch-btn {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.batch-btn.start {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.batch-btn.start:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.batch-btn.pause {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.batch-btn.stop {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.batch-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.batch-btn i {
  width: 20px;
  height: 20px;
}

.stats-summary {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  padding: 12px;
  background: white;
  border-radius: 8px;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
}

.stat-item.success { color: #059669; }
.stat-item.failed { color: #dc2626; }
.stat-item.total-time { color: #2563eb; }

.stat-item strong {
  font-size: 18px;
  color: inherit;
}

.stat-item i {
  width: 16px;
  height: 16px;
}

/* 模型列表头部 */
.model-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

/* 特色功能筛选区域 */
.feature-filter-section {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-color: #86efac;
}

.feature-filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.feature-filter-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: #166534;
  margin-bottom: 0;
}

.clear-feature-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid #fca5a5;
  background: white;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  color: #dc2626;
  transition: all 0.2s;
}

.clear-feature-btn:hover {
  background: #fef2f2;
  border-color: #ef4444;
}

.clear-feature-btn i {
  width: 12px;
  height: 12px;
}

.feature-hint {
  font-size: 12px;
  color: #166534;
  margin-bottom: 12px;
  opacity: 0.8;
}

.feature-selector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.feature-select-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 8px;
  border: 1px solid #bbf7d0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.feature-select-btn:hover:not(:disabled) {
  border-color: #22c55e;
  background: #f0fdf4;
  transform: translateY(-1px);
}

.feature-select-btn.active {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.feature-select-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.feature-icon {
  font-size: 18px;
}

.feature-label {
  font-size: 11px;
  font-weight: 500;
  text-align: center;
  line-height: 1.3;
}

.feature-result-info {
  padding: 12px;
  background: white;
  border-radius: 8px;
  margin-top: 8px;
}

.result-stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stat-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.stat-badge.success {
  background: #dcfce7;
  color: #166534;
}

.stat-badge.warning {
  background: #fef3c7;
  color: #92400e;
}

.stat-badge i {
  width: 14px;
  height: 14px;
}

.model-list-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0;
}

.model-select-actions {
  display: flex;
  gap: 6px;
}

.select-action-btn {
  padding: 4px 10px;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}

.select-action-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #3b82f6;
  color: #3b82f6;
}

.select-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 搜索框 */
.model-search-box {
  position: relative;
  margin-bottom: 10px;
}

.model-search-box i {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  color: #9ca3af;
}

.model-search-box input {
  width: 100%;
  padding: 8px 10px 8px 32px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 12px;
  transition: all 0.2s;
}

.model-search-box input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.model-hint {
  font-size: 11px;
  color: #9ca3af;
  text-align: center;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e5e7eb;
}

.model-list-mini {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 300px;
  overflow-y: auto;
}

.model-item-mini {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 12px;
  transition: all 0.2s;
  background: white;
  cursor: pointer;
}

.model-item-mini.selected {
  background: #eff6ff;
  border-color: #3b82f6;
}

.model-item-mini.supports {
  background: #f0fdf4;
  border-color: #86efac;
}

.model-item-mini.not-supports {
  opacity: 0.5;
  background: #fef2f2;
  border-color: #fecaca;
}

.model-item-mini:hover:not(.completed):not(.testing) {
  border-color: #93c5fd;
  background: #f0f9ff;
}

.model-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #3b82f6;
  cursor: pointer;
  flex-shrink: 0;
}

.feature-support-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  flex-shrink: 0;
}

.feature-support-badge.yes {
  background: #dcfce7;
  color: #166534;
}

.feature-support-badge.no {
  background: #fef2f2;
  color: #dc2626;
}

.feature-support-badge i {
  width: 12px;
  height: 12px;
}

.model-item-mini.completed {
  background: #f0fdf4;
  border-color: #86efac;
}

.model-item-mini.testing {
  background: #eff6ff;
  border-color: #93c5fd;
  animation: pulse 1.5s ease-in-out infinite;
}

.model-item-mini.failed {
  background: #fef2f2;
  border-color: #fca5a5;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.model-index {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
}

.model-name-mini {
  flex: 1;
  font-weight: 500;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vendor-tag-small {
  font-size: 10px;
  padding: 2px 6px;
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 4px;
  white-space: nowrap;
}

.status-icon {
  width: 14px;
  height: 14px;
}

.status-icon.success { color: #059669; }
.status-icon.failed { color: #dc2626; }
.status-icon.testing { color: #2563eb; }

.result-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  max-height: calc(100vh - 160px);
}

.info-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 20px;
}

.info-card h3 {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f3f4f6;
}

.price-overview {
  overflow-x: auto;
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.comparison-table th,
.comparison-table td {
  padding: 10px 8px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
}

.comparison-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  position: sticky;
  top: 0;
}

.model-cell strong {
  color: #111827;
  font-size: 12px;
}

.vendor-badge {
  font-size: 10px;
  padding: 3px 8px;
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 4px;
}

.price-cell {
  text-align: center;
}

.price-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.price-info .cost {
  font-weight: 600;
  color: #059669;
  font-size: 12px;
}

.price-info .time {
  font-size: 10px;
  color: #9ca3af;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: #9ca3af;
}

.empty-state i {
  width: 56px;
  height: 56px;
  margin-bottom: 16px;
  opacity: 0.4;
}

.empty-state p {
  margin: 8px 0;
  font-size: 14px;
}

.empty-state .hint {
  font-size: 12px;
  color: #d1d5db;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
}

.result-item:hover {
  border-color: #93c5fd;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.result-item.expanded {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.result-item.success {
  border-color: #86efac;
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
}

.result-item.success:hover {
  border-color: #22c55e;
}

.result-item.success.expanded {
  border-color: #16a34a;
}

.result-item.failed {
  border-color: #fca5a5;
  background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%);
}

.result-item.failed:hover {
  border-color: #ef4444;
}

.result-item.failed.expanded {
  border-color: #dc2626;
}

.result-item.testing {
  border-color: #fbbf24;
  background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%);
  animation: pulse 2s infinite;
}

.result-item.testing:hover {
  border-color: #f59e0b;
}

.result-item.testing.expanded {
  border-color: #d97706;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.8);
  border-bottom: 1px solid #f3f4f6;
}

.result-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.expand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: #6b7280;
  transition: transform 0.2s ease;
}

.expand-icon i {
  width: 16px;
  height: 16px;
}

.result-number {
  font-size: 12px;
  font-weight: 700;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 10px;
}

.result-model {
  font-weight: 600;
  color: #111827;
  font-size: 14px;
}

.resolution-badge {
  font-size: 11px;
  padding: 3px 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 4px;
  font-weight: 600;
}

.duration-badge {
  font-size: 11px;
  padding: 3px 8px;
  background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
  color: white;
  border-radius: 4px;
  font-weight: 600;
}

.actual-duration-badge {
  font-size: 11px;
  padding: 3px 8px;
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  color: white;
  border-radius: 4px;
  font-weight: 600;
}

.status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
}

.status.success {
  background: #d1fae5;
  color: #065f46;
}

.status.failed {
  background: #fee2e2;
  color: #991b1b;
}

.status.testing {
  background: #fef3c7;
  color: #92400e;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.status i {
  width: 14px;
  height: 14px;
}

.result-body {
  padding: 16px;
}

.result-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}

.meta-item i {
  width: 14px;
  height: 14px;
  opacity: 0.6;
}

.meta-item strong {
  color: #111827;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #991b1b;
  font-size: 12px;
  margin-bottom: 12px;
}

.error-message i {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.result-preview {
  margin-top: 12px;
  border-radius: 8px;
  overflow: hidden;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}

.result-preview img,
.result-preview video {
  width: 100%;
  max-height: 280px;
  object-fit: contain;
  display: block;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 12px;
  color: #6b7280;
}

.file-info i {
  width: 14px;
  height: 14px;
}

.file-info code {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  color: #374151;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.action-btn.export {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.action-btn.clear {
  background: #f3f4f6;
  color: #6b7280;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn i {
  width: 18px;
  height: 18px;
}

/* 模型详情卡片 */
.model-detail-card {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: #fbbf24;
}

.model-detail-card h3 {
  color: #92400e;
}

.model-detail-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-detail {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  text-align: center;
  color: #92400e;
}

.empty-detail i {
  width: 40px;
  height: 40px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-detail p {
  font-size: 13px;
  opacity: 0.7;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #fcd34d;
}

.detail-model-name {
  font-size: 18px;
  font-weight: 700;
  color: #78350f;
}

.detail-section {
  margin-top: 8px;
}

.detail-section h4 {
  font-size: 13px;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.detail-section h4 i {
  width: 16px;
  height: 16px;
}

.features-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.feature-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: white;
  border: 1px solid #fcd34d;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: #78350f;
  transition: all 0.2s;
}

.feature-tag:hover {
  background: #fffbeb;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.2);
}

.detail-info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #92400e;
  padding: 6px 0;
}

.detail-info-row i {
  width: 14px;
  height: 14px;
  opacity: 0.7;
}

.detail-tags {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
}

.tag.new {
  background: #dcfce7;
  color: #166534;
}

.tag.vip {
  background: #dbeafe;
  color: #1e40af;
}

.tag.trial {
  background: #fce7f3;
  color: #9d174d;
}

/* 计时器信息样式 */
.timing-info .timing-details {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.client-time {
  color: #111827;
}

.server-time {
  font-size: 11px;
  color: #059669;
  font-weight: 500;
  cursor: help;
  border-bottom: 1px dashed #059669;
}
</style>
