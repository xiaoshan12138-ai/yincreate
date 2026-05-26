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
            <!-- 提示词输入区（支持@提及下拉） -->
            <div class="prompt-editor-wrapper" ref="editorWrapperRef">
              <div
                class="prompt-input"
                contenteditable="true"
                :placeholder="promptPlaceholder"
                @input="onPromptInput"
                @keydown="onPromptKeydown"
                ref="promptEditorRef"
              ></div>

              <!-- @提及下拉列表 -->
              <Teleport to="body">
                <div
                  v-if="showAtMentionDropdown"
                  class="at-mention-dropdown"
                  :style="mentionDropdownStyle"
                  @mousedown.prevent
                >
                  <div class="at-mention-header">选择要引用的素材</div>
                  <div class="at-mention-list">
                    <div
                      v-for="(file, idx) in atMentionCandidates"
                      :key="'cand-' + idx"
                      :class="['at-mention-item', { active: activeMentionIndex === idx }]"
                      @click="selectAtMention(file)"
                      @mouseenter="activeMentionIndex = idx"
                    >
                      <div class="mention-thumb-wrap">
                        <img
                          v-if="file.type === 'image'"
                          :src="convertBase64ToBlobUrl(file.url)"
                          class="mention-thumb"
                        />
                        <video
                          v-else-if="file.type === 'video'"
                          :src="file.url"
                          class="mention-thumb"
                          muted
                        />
                        <div v-else class="mention-thumb audio-thumb">
                          <i data-lucide="music" style="width: 16px; height: 16px;"></i>
                        </div>
                        <span :class="['mention-type-icon', file.type]">
                          {{ file.type === 'video' ? '▶' : '🖼' }}
                        </span>
                      </div>
                      <div class="mention-info">
                        <span class="mention-name">{{ file.name || (file.type === 'video' ? '视频' : '图片') }}</span>
                        <span class="mention-type-label">{{ getFileTypeLabel(file.type) }}</span>
                      </div>
                    </div>
                  </div>
                  <div v-if="atMentionCandidates.length === 0" class="at-mention-empty">
                    暂无可引用素材，请先上传图片或视频
                  </div>
                </div>
              </Teleport>
            </div>

            <!-- 媒体素材栏：上传素材 + 引用素材（同一行流式布局） -->
            <div v-if="uploadedFiles.length > 0 || referencedFiles.length > 0" class="media-bar">
              <!-- 上传素材 -->
              <div v-if="uploadedFiles.length > 0" class="media-section">
                <div class="section-label">
                  <i data-lucide="upload" style="width: 13px; height: 13px;"></i>
                  上传素材
                  <span class="section-count">{{ uploadedFiles.length }}</span>
                </div>
                <div class="media-items-row">
                  <div
                    v-for="(file, index) in uploadedFiles"
                    :key="'up-' + index"
                    class="media-item draggable-item"
                    :class="[`type-${file.type}`]"
                    draggable="true"
                    @dragstart="onDragStart(file, index, 'upload')"
                    @dragend="onDragEnd"
                    @click.stop="clickToReference(file)"
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
                      <i data-lucide="music" style="width: 18px; height: 18px;"></i>
                      <span>{{ file.name }}</span>
                    </div>
                    <button class="remove-file-btn" @click="removeUploadedFile(index)" title="删除">
                      <i data-lucide="x" style="width: 12px; height: 12px;"></i>
                    </button>
                    <div class="file-type-badge">{{ getFileTypeLabel(file.type) }}</div>
                    <div class="drag-hint-overlay">
                      <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
                      点击引用
                    </div>
                  </div>
                </div>
              </div>

              <!-- 分隔 -->
              <div
                v-if="uploadedFiles.length > 0 && referencedFiles.length > 0"
                class="media-bar-divider"
              ></div>

              <!-- 引用素材（紧跟上传栏后面） -->
              <div v-if="referencedFiles.length > 0" class="media-section ref-section">
                <div class="section-label">
                  <i data-lucide="at-sign" style="width: 13px; height: 13px;"></i>
                  @ 引用素材
                  <span class="section-count">{{ referencedFiles.length }}</span>
                </div>
                <div class="media-items-row">
                  <div
                    v-for="refFile in referencedFiles"
                    :key="'ref-' + refFile.atId"
                    class="media-item ref-item"
                    :class="[`type-${refFile.type}`, { active: activeAtTagId === refFile.atId }]"
                    @click="focusAtTagById(refFile.atId)"
                  >
                    <img
                      v-if="refFile.type === 'image'"
                      :src="convertBase64ToBlobUrl(refFile.url)"
                      :alt="refFile.name"
                      class="preview-thumb"
                    />
                    <video
                      v-else-if="refFile.type === 'video'"
                      :src="refFile.url"
                      class="preview-thumb"
                      muted
                    />
                    <div class="ref-at-badge">@{{ refFile.atLabel }}</div>
                    <button class="remove-ref-btn" @click.stop="removeReferencedFile(refFile.atId)" title="取消引用">
                      <i data-lucide="x" style="width: 11px; height: 11px;"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="input-footer">
              <div class="footer-left">
                <span class="char-count">{{ prompt.length }} / 2000</span>
                <button
                  v-if="selectedType === 'video'"
                  :class="['sound-toggle-btn', { active: videoSoundEnabled }]"
                  @click="videoSoundEnabled = !videoSoundEnabled"
                  :title="videoSoundEnabled ? '点击关闭声音' : '点击开启声音'"
                >
                  <i :data-lucide="videoSoundEnabled ? 'volume-2' : 'volume-x'" style="width: 16px; height: 16px;"></i>
                  {{ videoSoundEnabled ? '有声' : '无声' }}
                </button>
              </div>
              <div class="input-actions">
                <div class="upload-dropdown" :class="{ open: isUploadDropdownOpen }">
                  <button class="upload-btn" @click.stop="toggleUploadDropdown">
                    <i data-lucide="upload" style="width: 18px; height: 18px;"></i>
                    输入内容
                    <i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>
                  </button>
                  <div v-if="isUploadDropdownOpen" class="upload-menu" @click.stop>
                    <div class="upload-menu-section">
                      <div class="upload-section-title">本地上传</div>
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
                    <div class="upload-menu-divider"></div>
                    <div class="upload-menu-section">
                      <div class="upload-section-title">云资料库</div>
                      <button class="upload-option cloud-option" @click="openCloudLibrary">
                        <i data-lucide="cloud" style="width: 16px; height: 16px;"></i>
                        从云资料库选择
                      </button>
                    </div>
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

    <!-- 云资料库选择弹窗 -->
    <Teleport to="body">
      <div v-if="showCloudLibrary" class="cloud-library-modal-overlay" @click.self="closeCloudLibrary">
        <div class="cloud-library-modal">
          <!-- 弹窗头部 -->
          <div class="cloud-modal-header">
            <h3 class="cloud-modal-title">
              <i data-lucide="cloud" style="width: 20px; height: 20px;"></i>
              云资料库
            </h3>
            <button class="cloud-modal-close" @click="closeCloudLibrary">
              <i data-lucide="x" style="width: 18px; height: 18px;"></i>
            </button>
          </div>

          <!-- 搜索栏 -->
          <div class="cloud-search-bar">
            <i data-lucide="search" style="width: 16px; height: 16px; color: #9ca3af;"></i>
            <input
              type="text"
              v-model="cloudSearchKeyword"
              placeholder="搜索云资料库中的文件..."
              class="cloud-search-input"
            />
          </div>

          <!-- 文件类型筛选 -->
          <div class="cloud-filter-tabs">
            <button
              v-for="tab in cloudFilterTabs"
              :key="tab.id"
              :class="['cloud-tab', { active: cloudActiveTab === tab.id }]"
              @click="cloudActiveTab = tab.id"
            >
              <i :data-lucide="tab.icon" style="width: 14px; height: 14px;"></i>
              {{ tab.label }}
            </button>
          </div>

          <!-- 文件列表 -->
          <div class="cloud-files-container">
            <div v-if="filteredCloudFiles.length === 0" class="cloud-empty-state">
              <i data-lucide="folder-open" style="width: 48px; height: 48px; color: #d1d5db;"></i>
              <p>暂无文件</p>
              <span class="cloud-empty-hint">请先在资产管理页面上传文件到云资料库</span>
            </div>
            <div v-else class="cloud-files-grid">
              <div
                v-for="(file, idx) in filteredCloudFiles"
                :key="'cloud-' + idx"
                :class="['cloud-file-item', `type-${file.type}`, { selected: isCloudFileSelected(file) }]"
                @click="toggleCloudFileSelection(file)"
              >
                <div class="cloud-file-thumb">
                  <img
                    v-if="file.type === 'image' && file.thumbnail"
                    :src="file.thumbnail"
                    :alt="file.name"
                  />
                  <video
                    v-else-if="file.type === 'video' && file.thumbnail"
                    :src="file.url || file.thumbnail"
                    muted
                    class="cloud-video-thumb"
                  />
                  <div v-else class="cloud-file-placeholder" :class="'placeholder-' + file.type">
                    <i
                      :data-lucide="file.type === 'audio' ? 'music' : (file.type === 'video' ? 'video' : 'file')"
                      style="width: 32px; height: 32px;"
                    ></i>
                  </div>
                  <div v-if="isCloudFileSelected(file)" class="cloud-selected-check">
                    <i data-lucide="check" style="width: 16px; height: 16px;"></i>
                  </div>
                </div>
                <div class="cloud-file-info">
                  <p class="cloud-file-name">{{ file.name }}</p>
                  <span class="cloud-file-meta">{{ getFileTypeLabel(file.type) }} · {{ formatCloudFileSize(file.size) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部操作栏 -->
          <div class="cloud-modal-footer">
            <div class="cloud-selection-info">
              已选择 {{ selectedCloudFiles.length }} 个文件
            </div>
            <div class="cloud-actions">
              <button class="cloud-btn-secondary" @click="closeCloudLibrary">取消</button>
              <button
                class="cloud-btn-primary"
                :disabled="selectedCloudFiles.length === 0"
                @click="confirmCloudSelection"
              >
                确认选择
                <i data-lucide="check-circle" style="width: 16px; height: 16px;"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'

// const API_CONFIG = {
//    BASE_URL: 'http://192.168.31.243:8003/api/v1'
// }
const API_CONFIG = {
  //使用相对路径，自动匹配当前域名和端口
 BASE_URL: '/api/v1'
}

const VENDOR_B_API_KEY = 'ErtveAQybj1XCVRsncebuiIYzTxUV0tganVf4bMijr5SKVzU'

let globalModels = {
  image_models: [],
  video_models: [],
  voices: []
}
const uploadedFiles = ref([])
const referencedFiles = ref([])
const atTags = ref([])
const activeAtTagId = ref(null)
const promptEditorRef = ref(null)
const editorWrapperRef = ref(null)
const promptPlaceholder = '描述您想要生成的内容，例如：一只可爱的猫咪在花园里玩耍... 输入 @ 可引用素材'
let atVideoCounter = 0
let atImageCounter = 0

const showAtMentionDropdown = ref(false)
const atMentionCandidates = computed(() => {
  const alreadyReferencedIds = new Set(referencedFiles.value.map(r => r.sourceId))
  return uploadedFiles.value.filter(f => !alreadyReferencedIds.has(f.object_id))
})
const activeMentionIndex = ref(0)
const mentionDropdownStyle = ref({})
let mentionAnchorRange = null

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
const videoSoundEnabled = ref(false)
const isGenerating = ref(false)
const isUploadDropdownOpen = ref(false)
const generatedCards = ref([])
const expandedCardId = ref(null)

const showCloudLibrary = ref(false)
const cloudSearchKeyword = ref('')
const cloudActiveTab = ref('all')
const selectedCloudFiles = ref([])

const cloudFilterTabs = [
  { id: 'all', label: '全部', icon: 'layout-grid' },
  { id: 'image', label: '图片', icon: 'image' },
  { id: 'video', label: '视频', icon: 'video' },
  { id: 'audio', label: '音频', icon: 'music' }
]

const cloudLibraryFiles = ref([
  {
    id: 'cloud_1',
    name: '风景照片1.jpg',
    type: 'image',
    thumbnail: 'https://picsum.photos/200/150?random=1',
    url: '',
    size: 2048576,
    uploadTime: '2024-01-15'
  },
  {
    id: 'cloud_2',
    name: '人物肖像.png',
    type: 'image',
    thumbnail: 'https://picsum.photos/200/150?random=2',
    url: '',
    size: 1536000,
    uploadTime: '2024-01-14'
  },
  {
    id: 'cloud_3',
    name: '产品展示.mp4',
    type: 'video',
    thumbnail: 'https://picsum.photos/200/150?random=3',
    url: '',
    size: 52428800,
    uploadTime: '2024-01-13'
  },
  {
    id: 'cloud_4',
    name: '背景音乐.mp3',
    type: 'audio',
    thumbnail: null,
    url: '',
    size: 5242880,
    uploadTime: '2024-01-12'
  },
  {
    id: 'cloud_5',
    name: '城市夜景.jpg',
    type: 'image',
    thumbnail: 'https://picsum.photos/200/150?random=4',
    url: '',
    size: 3072000,
    uploadTime: '2024-01-11'
  },
  {
    id: 'cloud_6',
    name: '动画片段.mov',
    type: 'video',
    thumbnail: 'https://picsum.photos/200/150?random=5',
    url: '',
    size: 104857600,
    uploadTime: '2024-01-10'
  }
])

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

  result.image = (fetchedModels.image_models || []).map(m => ({
    ...m,
    inputType: 'text',
    categoryLabel: '文本输入'
  }))

  result.video = (fetchedModels.video_models || []).map(m => ({
    ...m,
    inputType: 'text',
    categoryLabel: '文本输入'
  }))

  result.digitalHuman = (fetchedModels.voices || []).map(m => ({
    ...m,
    inputType: 'audio',
    categoryLabel: '音频输入',
    _isDigitalHuman: true
  }))

  console.log('📊 模型分类完成（使用后端分类）:', {
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

  if (removed && removed.object_id) {
    const relatedRefs = referencedFiles.value.filter(r => r.sourceId === removed.object_id)
    relatedRefs.forEach(ref => {
      removeAtTag(ref.atId)
    })
  }

  nextTick(() => {
    if (window.lucide) lucide.createIcons()
  })
}

function getFileTypeLabel(type) {
  const labels = { image: '图片', video: '视频', audio: '音频' }
  return labels[type] || type
}

const filteredCloudFiles = computed(() => {
  let files = cloudLibraryFiles.value

  if (cloudActiveTab.value !== 'all') {
    files = files.filter(f => f.type === cloudActiveTab.value)
  }

  if (cloudSearchKeyword.value.trim()) {
    const keyword = cloudSearchKeyword.value.toLowerCase()
    files = files.filter(f =>
      f.name.toLowerCase().includes(keyword)
    )
  }

  return files
})

function openCloudLibrary() {
  isUploadDropdownOpen.value = false
  showCloudLibrary.value = true
  selectedCloudFiles.value = []
  cloudSearchKeyword.value = ''
  cloudActiveTab.value = 'all'
  document.body.style.overflow = 'hidden'

  nextTick(() => {
    if (window.lucide) lucide.createIcons()
  })
}

function closeCloudLibrary() {
  showCloudLibrary.value = false
  selectedCloudFiles.value = []
  document.body.style.overflow = ''
}

function isCloudFileSelected(file) {
  return selectedCloudFiles.value.some(f => f.id === file.id)
}

function toggleCloudFileSelection(file) {
  const index = selectedCloudFiles.value.findIndex(f => f.id === file.id)

  if (index > -1) {
    selectedCloudFiles.value.splice(index, 1)
  } else {
    selectedCloudFiles.value.push(file)
  }
}

function formatCloudFileSize(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

async function confirmCloudSelection() {
  if (selectedCloudFiles.value.length === 0) return

  for (const file of selectedCloudFiles.value) {
    const objectId = `${file.type}_${uploadedFiles.value.length + 1}`

    let fileUrl = file.url

    if (!fileUrl && file.thumbnail && file.type === 'image') {
      try {
        const response = await fetch(file.thumbnail)
        const blob = await response.blob()
        fileUrl = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target.result)
          reader.readAsDataURL(blob)
        })
      } catch (error) {
        console.warn('无法加载云文件:', file.name, error)
        fileUrl = file.thumbnail
      }
    }

    uploadedFiles.value.push({
      type: file.type,
      url: fileUrl,
      purpose: 'reference',
      object_id: objectId,
      name: file.name,
      fromCloud: true,
      cloudId: file.id
    })

    console.log(`☁️ 已从云资料库选择: ${file.name} (${file.type}, ID: ${objectId})`)
  }

  const typeLabels = { image: '图片', video: '视频', audio: '音频' }
  showToast(`已从云资料库添加 ${selectedCloudFiles.value.length} 个文件`, 'success')

  closeCloudLibrary()

  nextTick(() => {
    if (window.lucide) lucide.createIcons()
  })

  setTimeout(() => {
    console.log('📁 当前已上传文件（含云资料库）:', uploadedFiles.value.length, '个')
  }, 500)
}

function onPromptInput(e) {
  const editor = e.target
  const text = editor.innerText || ''
  if (text.length <= 2000) {
    prompt.value = text
  } else {
    editor.innerText = text.slice(0, 2000)
    prompt.value = text.slice(0, 2000)
  }

  checkAtMention(e)
}

function onPromptKeydown(e) {
  if (showAtMentionDropdown.value) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      activeMentionIndex.value = Math.min(activeMentionIndex.value + 1, atMentionCandidates.value.length - 1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      activeMentionIndex.value = Math.max(activeMentionIndex.value - 1, 0)
    } else if (e.key === 'Escape') {
      closeMentionDropdown()
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      const candidate = atMentionCandidates.value[activeMentionIndex.value]
      if (candidate) selectAtMention(candidate)
    }
    return
  }

  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleGenerate()
    return
  }

  if (e.key === '@') {
    nextTick(() => checkAtMention(e))
  }
}

function checkAtMention(e) {
  const editor = promptEditorRef.value
  if (!editor) return

  const selection = window.getSelection()
  if (!selection.rangeCount || !editor.contains(selection.anchorNode)) {
    closeMentionDropdown()
    return
  }

  const range = selection.getRangeAt(0)
  const textBeforeCaret = getTextBeforeCursor(editor, range)

  const atMatch = textBeforeCaret.match(/@(\w*)$/)

  if (atMatch && atMentionCandidates.value.length > 0) {
    mentionAnchorRange = range.cloneRange()
    mentionAnchorRange.setStart(range.startContainer, range.startOffset - atMatch[0].length)

    const rect = range.getBoundingClientRect()
    const wrapperRect = editorWrapperRef.value?.getBoundingClientRect()

    showAtMentionDropdown.value = true
    activeMentionIndex.value = 0
    mentionDropdownStyle.value = {
      position: 'fixed',
      top: `${rect.bottom + 6}px`,
      left: `${Math.max(rect.left, wrapperRect?.left || rect.left)}px`,
      minWidth: `${Math.min(320, wrapperRect?.width || 320)}px`,
      zIndex: 9999
    }

    nextTick(() => {
      if (window.lucide) lucide.createIcons()
    })
  } else {
    closeMentionDropdown()
  }
}

function getTextBeforeCursor(editor, range) {
  const container = range.startContainer
  const offset = range.startOffset

  if (container.nodeType === Node.TEXT_NODE) {
    let text = container.textContent.slice(0, offset)
    let node = container
    while ((node = node.previousSibling)) {
      if (node.nodeType === Node.TEXT_NODE) {
        text = node.textContent + text
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        text = node.textContent + text
      }
    }
    let parent = container.parentNode
    while (parent && parent !== editor) {
      let prev = parent.previousSibling
      while (prev) {
        text = prev.textContent + text
        prev = prev.previousSibling
      }
      parent = parent.parentNode
    }
    return text
  }

  if (container === editor || editor.contains(container)) {
    let text = ''
    const children = Array.from(container.childNodes).slice(0, offset)
    for (const child of children) {
      text += child.textContent
    }
    let parent = container.parentNode
    while (parent && parent !== editor) {
      let prev = parent.previousSibling
      while (prev) {
        text = prev.textContent + text
        prev = prev.previousSibling
      }
      parent = parent.parentNode
    }
    return text
  }

  return ''
}

function closeMentionDropdown() {
  showAtMentionDropdown.value = false
  mentionAnchorRange = null
  activeMentionIndex.value = 0
}

function selectAtMention(file) {
  const editor = promptEditorRef.value
  if (!editor) { closeMentionDropdown(); return }

  if (mentionAnchorRange) {
    try {
      const selection = window.getSelection()
      selection.removeAllRanges()
      selection.addRange(mentionAnchorRange)
      mentionAnchorRange.deleteContents()
    } catch (_) {}
  }

  createReferenceFrom(file)
  closeMentionDropdown()

  nextTick(() => {
    editor.focus()
    if (window.lucide) lucide.createIcons()
  })
}

function createReferenceFrom(file) {
  const existingRef = referencedFiles.value.find(r => r.sourceId === file.object_id)
  if (existingRef) {
    showToast('该素材已被引用', 'info')
    return
  }

  const typeKey = file.type === 'video' ? '视频' : '图片'
  const counter = file.type === 'video' ? ++atVideoCounter : ++atImageCounter
  const atLabel = `${typeKey}${counter}`
  const atId = `at_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

  const refEntry = {
    ...file,
    atId,
    atLabel,
    atTag: `@${atLabel}`,
    sourceId: file.object_id,
  }
  referencedFiles.value.push(refEntry)

  const newAtTag = {
    id: atId,
    type: file.type,
    label: atLabel,
    fullTag: `@${atLabel}`,
    refEntry
  }
  atTags.value.push(newAtTag)

  insertAtTagToPrompt(newAtTag)
  console.log(`📌 已引用素材: @${atLabel} (${file.type})`)
}

let draggedFile = null
let draggedIndex = -1
let draggedSource = ''

function onDragStart(file, index, source) {
  draggedFile = file
  draggedIndex = index
  draggedSource = source
}

function onDragEnd() {
  draggedFile = null
  draggedIndex = -1
  draggedSource = ''
}

function clickToReference(file) {
  createReferenceFrom(file)
}

function insertAtTagToPrompt(tag) {
  const editor = promptEditorRef.value
  if (!editor) return

  const iconSvg = tag.type === 'video'
    ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>'
    : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>'

  const innerHtml = `${iconSvg}<span class="at-tag-text">${tag.fullTag}</span><button class="at-tag-close" data-at-id="${tag.id}" title="移除引用"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`

  const selection = window.getSelection()

  if (selection.rangeCount > 0 && editor.contains(selection.anchorNode)) {
    const range = selection.getRangeAt(0)
    const span = document.createElement('span')
    span.className = `at-tag-inline at-tag-${tag.type}`
    span.contentEditable = 'false'
    span.dataset.atId = tag.id
    span.innerHTML = innerHtml
    range.insertNode(span)
    range.setStartAfter(span)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)
  } else {
    editor.innerHTML += `<span class="at-tag-inline at-tag-${tag.type}" contenteditable="false" data-at-id="${tag.id}">${innerHtml}</span>&nbsp;`
  }

  activeAtTagId.value = tag.id
  prompt.value = editor.innerText

  nextTick(() => bindInlineCloseButtons())
}

function bindInlineCloseButtons() {
  const editor = promptEditorRef.value
  if (!editor) return
  editor.querySelectorAll('.at-tag-close').forEach(btn => {
    if (btn._bound) return
    btn._bound = true
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const atId = btn.dataset.atId
      if (atId) removeAtTag(atId)
    })
  })
}

function focusAtTag(tag) {
  activeAtTagId.value = tag.id
  const editor = promptEditorRef.value
  if (!editor) return
  const el = editor.querySelector(`[data-at-id="${tag.id}"]`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    el.classList.add('at-tag-highlight')
    setTimeout(() => el.classList.remove('at-tag-highlight'), 1500)
  }
}

function focusAtTagById(atId) {
  const tag = atTags.value.find(t => t.id === atId)
  if (tag) focusAtTag(tag)
}

function removeAtTag(atId) {
  const tagIdx = atTags.value.findIndex(t => t.id === atId)
  if (tagIdx !== -1) atTags.value.splice(tagIdx, 1)

  const refIdx = referencedFiles.value.findIndex(r => r.atId === atId)
  if (refIdx !== -1) referencedFiles.value.splice(refIdx, 1)

  const editor = promptEditorRef.value
  if (editor) {
    const el = editor.querySelector(`[data-at-id="${atId}"]`)
    if (el) el.remove()
    prompt.value = editor.innerText
  }

  if (activeAtTagId.value === atId) activeAtTagId.value = null

  recalcCounters()

  nextTick(() => {
    if (window.lucide) lucide.createIcons()
  })
}

function recalcCounters() {
  let maxVideo = 0
  let maxImage = 0
  for (const t of atTags.value) {
    if (t.type === 'video') {
      const n = parseInt(t.label.replace('视频', ''), 10) || 0
      if (n > maxVideo) maxVideo = n
    } else if (t.type === 'image') {
      const n = parseInt(t.label.replace('图片', ''), 10) || 0
      if (n > maxImage) maxImage = n
    }
  }
  atVideoCounter = maxVideo
  atImageCounter = maxImage
}

function removeReferencedFile(atId) {
  removeAtTag(atId)
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

  const hasAtReferences = referencedFiles.value.length > 0

  let allInputFiles
  if (hasAtReferences) {
    allInputFiles = referencedFiles.value.map(ref => ({
      type: ref.type,
      url: ref.url,
      purpose: 'reference',
      object_id: ref.object_id || String(ref.sourceId || '')
    }))
  } else {
    allInputFiles = [...uploadedFiles.value]
  }

  let feature = selectedFeature.value || 'text_to_video'
  if (!feature || feature === '') {
    if (outputType === 'image') {
      feature = allInputFiles.length > 0 ? 'image_reference' : 'text_to_image'
    } else if (outputType === 'digital_human') {
      feature = 'digital_human'
    } else {
      feature = allInputFiles.length === 0 ? 'text_to_video'
        : allInputFiles.length === 1 ? 'global_reference'
        : 'multi_reference'
    }
  }

  if (outputType === 'video' && allInputFiles.length >= 2) {
    feature = 'multi_reference'
  }

  let finalPrompt = String(prompt.value || '').trim()
  if (referencedFiles.value.length > 0 && finalPrompt.includes('@')) {
    const tagToObjectId = {}
    for (const ref of referencedFiles.value) {
      const tag = String(ref.atTag || '')
      const oid = String(ref.object_id || '')
      if (tag && oid) {
        tagToObjectId[tag] = oid
      }
    }
    finalPrompt = finalPrompt.replace(/@\S+/g, (match) => {
      const replacement = tagToObjectId[match]
      return replacement ? `<<<${replacement}>>>` : match
    })
  }

  const request = {
    output_type: String(outputType || 'image'),
    model: String(submitModelValue || ''),
    vendor: String(currentModel.vendor || currentModel?.vendor || 'vendor_a'),
    feature: String(feature || 'text_to_video'),
    parameters: {},
    prompt: finalPrompt,
    input_files: allInputFiles.map((f) => ({
      type: String(f.type || 'image'),
      url: String(f.url || ''),
      purpose: String(f.purpose || 'reference'),
      object_id: String(f.object_id || `file_${f.type}_${Math.random().toString(36).slice(2, 6)}`)
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
      ratio: params.ratio,
      sound: videoSoundEnabled.value
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
    let requestBody = buildGenerateRequest()
    requestBody = JSON.parse(JSON.stringify(requestBody))

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
    if (promptEditorRef.value) promptEditorRef.value.innerHTML = ''
    uploadedFiles.value = []
    referencedFiles.value = []
    atTags.value = []
    activeAtTagId.value = null
    atVideoCounter = 0
    atImageCounter = 0
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

.footer-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sound-toggle-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1.5px solid #e5e7eb;
  border-radius: 6px;
  background: #f9fafb;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sound-toggle-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  background: #eff6ff;
}

.sound-toggle-btn.active {
  border-color: #3b82f6;
  background: #3b82f6;
  color: white;
}

.sound-toggle-btn.active:hover {
  background: #2563eb;
  border-color: #2563eb;
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

/* ========== @提及 & 媒体素材栏样式 ========== */

.prompt-editor-wrapper {
  position: relative;
}

.prompt-input[contenteditable="true"] {
  width: 100%;
  border: none;
  resize: none;
  font-size: 13.5px;
  line-height: 1.6;
  outline: none;
  font-family: inherit;
  color: #111827;
  background: transparent;
  min-height: 80px;
  max-height: 200px;
  overflow-y: auto;
  padding: 4px 0;
}

.prompt-input[contenteditable="true"]:empty::before {
  content: attr(placeholder);
  color: #9ca3af;
  pointer-events: none;
}

/* ====== @提及下拉列表 ====== */
.at-mention-dropdown {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  animation: mentionFadeIn 0.15s ease-out;
}

@keyframes mentionFadeIn {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}

.at-mention-header {
  padding: 10px 14px 6px;
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.at-mention-list {
  max-height: 220px;
  overflow-y: auto;
  padding: 4px 8px;
}

.at-mention-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.at-mention-item:hover,
.at-mention-item.active {
  background: #f0f4ff;
}
.at-mention-item.active {
  box-shadow: inset 0 0 0 2px #6366f1;
}

.mention-thumb-wrap {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.mention-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.mention-thumb.audio-thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
  color: #6366f1;
}

.mention-type-icon {
  position: absolute;
  bottom: 1px;
  right: 1px;
  font-size: 8px;
  padding: 1px 4px;
  border-radius: 4px;
  background: rgba(0,0,0,0.65);
  color: white;
}
.mention-type-icon.video { background: rgba(190, 24, 93, 0.85); }
.mention-type-icon.image { background: rgba(29, 78, 216, 0.85); }

.mention-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.mention-name {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mention-type-label {
  font-size: 11px;
  color: #9ca3af;
}

.at-mention-empty {
  padding: 20px;
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
}

/* ====== 媒体素材栏（单行流式布局）===== */
.media-bar {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f3f4f6;
  min-height: 96px;
}

.media-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.section-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 5px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  background: #e5e7eb;
  color: #6b7280;
}

.media-items-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.media-bar-divider {
  width: 1px;
  min-height: 80px;
  align-self: stretch;
  background: #e5e7eb;
  border-radius: 1px;
  margin: 22px 0 0 0;
  flex-shrink: 0;
}

.ref-section .section-count {
  background: #dbeafe;
  color: #2563eb;
}

.media-item {
  position: relative;
  width: 68px;
  height: 68px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e5e7eb;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.media-item .preview-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.draggable-item {
  cursor: pointer;
}
.draggable-item:hover {
  border-color: #6366f1;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
  transform: translateY(-2px);
}

.drag-hint-overlay {
  position: absolute;
  inset: 0;
  background: rgba(99, 102, 241, 0.88);
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: white;
  font-size: 9px;
  font-weight: 600;
  z-index: 5;
}
.draggable-item:hover .drag-hint-overlay { display: flex; }

.ref-item {
  border-color: #c7d2fe;
  cursor: pointer;
}
.ref-item.active {
  border-color: #6366f1;
  border-style: solid;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}
.ref-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.ref-at-badge {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 3px 0;
  background: linear-gradient(to top, rgba(99, 102, 241, 0.92), rgba(99, 102, 241, 0.7));
  color: white;
  font-size: 10px;
  font-weight: 700;
  text-align: center;
  letter-spacing: 0.3px;
}

.remove-ref-btn {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.15s ease;
  z-index: 10;
}
.ref-item:hover .remove-ref-btn { opacity: 1; }
.remove-ref-btn:hover { background: #dc2626; transform: scale(1.1); }

.audio-preview {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: #6366f1;
  font-size: 9px;
  padding: 4px;
  text-align: center;
  word-break: break-all;
}

.remove-file-btn {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.9);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.15s ease;
  z-index: 10;
}
.uploaded-file-item:hover .remove-file-btn,
.draggable-item:hover .remove-file-btn { opacity: 1; }
.remove-file-btn:hover { background: rgba(37, 99, 235, 1); transform: scale(1.1); }

.file-type-badge {
  position: absolute;
  bottom: 3px;
  left: 3px;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 9px;
  font-weight: 600;
  border-radius: 4px;
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

/* ====== 输入框内 @标签徽章样式（全局，因由JS动态创建） ====== */
.at-tag-inline {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px 3px 7px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  margin: 0 2px;
  vertical-align: middle;
  cursor: default;
  transition: all 0.18s ease;
  user-select: none;
  white-space: nowrap;
  line-height: 1.2;
}
.at-tag-inline:hover { transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.at-tag-inline.at-tag-video {
  background: linear-gradient(135deg, #fce7f3, #fbcfe8);
  color: #be185d;
  border: 1.5px solid #f9a8d4;
}
.at-tag-inline.at-tag-image {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #1d4ed8;
  border: 1.5px solid #93c5fd;
}
.at-tag-text { letter-spacing: 0.2px; }
.at-tag-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 15px;
  margin-left: 1px;
  margin-right: -2px;
  border-radius: 50%;
  border: none;
  background: transparent;
  opacity: 0.45;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: all 0.15s ease;
}
.at-tag-close:hover { opacity: 1; background: rgba(0,0,0,0.12); }
.at-tag-inline.at-tag-video .at-tag-close:hover { background: rgba(190, 24, 93, 0.15); }
.at-tag-inline.at-tag-image .at-tag-close:hover { background: rgba(29, 78, 216, 0.15); }
.at-tag-inline.at-tag-highlight { animation: atPulse 1s ease-in-out; }
@keyframes atPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba(99, 102, 241, 0); }
}

/* 云资料库选择弹窗样式 */
.cloud-library-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100000;
  animation: cloudModalFadeIn 0.2s ease-out;
}

@keyframes cloudModalFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.cloud-library-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 800px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: cloudModalSlideUp 0.3s ease-out;
}

@keyframes cloudModalSlideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.cloud-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.cloud-modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.cloud-modal-close {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.cloud-modal-close:hover {
  background: #e5e7eb;
  color: #374151;
}

.cloud-search-bar {
  margin: 16px 24px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #f9fafb;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.cloud-search-bar:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background: white;
}

.cloud-search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: #374151;
}

.cloud-search-input::placeholder {
  color: #9ca3af;
}

.cloud-filter-tabs {
  display: flex;
  gap: 8px;
  padding: 16px 24px 12px;
  border-bottom: 1px solid #f3f4f6;
}

.cloud-tab {
  padding: 7px 14px;
  border-radius: 8px;
  border: 1.5px solid #e5e7eb;
  background: white;
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.cloud-tab:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  background: #eff6ff;
}

.cloud-tab.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.cloud-files-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
}

.cloud-empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
}

.cloud-empty-state p {
  margin: 16px 0 8px;
  font-size: 15px;
  font-weight: 500;
  color: #6b7280;
}

.cloud-empty-hint {
  font-size: 13px;
  color: #9ca3af;
}

.cloud-files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.cloud-file-item {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s ease;
}

.cloud-file-item:hover {
  border-color: #93c5fd;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  transform: translateY(-2px);
}

.cloud-file-item.selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.cloud-file-thumb {
  width: 100%;
  height: 120px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.cloud-file-thumb img,
.cloud-video-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cloud-file-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #d1d5db;
}

.placeholder-audio {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.placeholder-video {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.cloud-selected-check {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 26px;
  height: 26px;
  background: #3b82f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  animation: checkPop 0.2s ease-out;
}

@keyframes checkPop {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.cloud-file-info {
  padding: 10px 12px;
}

.cloud-file-name {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin: 0 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cloud-file-meta {
  font-size: 11px;
  color: #9ca3af;
}

.cloud-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 16px 16px;
}

.cloud-selection-info {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.cloud-actions {
  display: flex;
  gap: 10px;
}

.cloud-btn-secondary,
.cloud-btn-primary {
  padding: 9px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.cloud-btn-secondary {
  background: white;
  border: 1.5px solid #d1d5db;
  color: #6b7280;
}

.cloud-btn-secondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
  color: #374151;
}

.cloud-btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35);
}

.cloud-btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.45);
}

.cloud-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 上传菜单增强样式 */
.upload-menu-section {
  padding: 4px 0;
}

.upload-section-title {
  padding: 8px 16px 4px;
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.upload-menu-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 4px 12px;
}

.cloud-option {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  color: #2563eb !important;
  font-weight: 500 !important;
}

.cloud-option:hover {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%) !important;
}
</style>
