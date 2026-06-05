<template>
  <AppLayout>
    <!-- AI生成页面主容器 - 即梦AI风格 -->
    <div class="generate-page-jimeng">
      <!-- 左侧对话历史侧边栏 -->
      <aside class="jimeng-left-sidebar">
        <!-- 顶部：开启创作 -->
        <div class="sidebar-header">
          <span class="sidebar-title">开启创作</span>
          <button class="sidebar-collapse-btn" title="收起侧栏">
            <i data-lucide="panel-left-close" style="width: 16px; height: 16px;"></i>
          </button>
        </div>

        <!-- 新对话按钮 -->
        <button class="new-chat-btn" @click="startNewChat">
          <i data-lucide="plus-square" style="width: 16px; height: 16px;"></i>
          新对话
        </button>

        <!-- 最近对话列表 -->
        <div class="recent-section">
          <div class="recent-label">最近</div>
          <div class="conversation-list">
            <div
              v-for="conv in conversationHistory"
              :key="conv.id"
              :class="['conversation-item', { active: activeConversationId === conv.id }]"
              @click="selectConversation(conv.id)"
            >
              <div class="conv-thumb">
                <img v-if="conv.thumbnail" :src="conv.thumbnail" alt="" />
                <div v-else class="conv-thumb-placeholder">
                  <i data-lucide="image" style="width: 18px; height: 18px;"></i>
                </div>
              </div>
              <div class="conv-info">
                <span class="conv-title">{{ conv.title }}</span>
                <span class="conv-meta">{{ conv.cards?.length || 0 }} 条结果 · {{ formatConvTime(conv.time) }}</span>
              </div>
              <button class="conv-delete-btn" @click.stop="deleteConversation(conv.id)" title="删除对话">
                <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
              </button>
            </div>
            <div v-if="conversationHistory.length === 0" class="no-conversations">
              暂无历史对话
            </div>
          </div>
        </div>
      </aside>

      <!-- 主内容区域 -->
      <main class="jimeng-main-area">
        <!-- ====== 未交互状态：欢迎页 ====== -->
        <div v-if="!hasInteracted" class="jimeng-welcome">
          <h1 class="welcome-title">你好，想创作什么？</h1>

          <!-- 输入卡片 -->
          <div class="input-card">
            <!-- 输入区：上传 + 文字输入 -->
            <div class="input-card-body">
              <!-- 左侧上传区域（+号触发下拉菜单） -->
              <div class="upload-dropdown" :class="{ open: isUploadDropdownOpen }">
                <div class="upload-zone" @click.stop="toggleUploadDropdown" title="上传素材">
                  <i data-lucide="plus" style="width: 24px; height: 24px;"></i>
                </div>
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
                </div>
              </div>

              <!-- 中间文字输入区 -->
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
            </div>

            <!-- 媒体素材栏 -->
            <div v-if="uploadedFiles.length > 0 || referencedFiles.length > 0" class="media-bar">
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
              <div
                v-if="uploadedFiles.length > 0 && referencedFiles.length > 0"
                class="media-bar-divider"
              ></div>
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

            <!-- 底部操作栏 -->
            <div class="input-card-footer">
              <!-- 左侧：生成类型 + 模型 + 参数选项 -->
              <div class="footer-options">
                <!-- 生成类型选择器 -->
                <div
                  class="option-chip type-chip"
                  :class="{ open: isTypeDropdownOpen }"
                  @click="toggleTypeDropdown"
                  ref="typeTriggerRef"
                >
                  <i :data-lucide="selectedTypeIcon" style="width: 14px; height: 14px;"></i>
                  <span>{{ selectedTypeLabel }}</span>
                  <i data-lucide="chevron-down" style="width: 12px; height: 12px;"></i>
                  <Teleport to="body">
                    <div
                      v-if="isTypeDropdownOpen"
                      class="select-dropdown type-dropdown-menu"
                      :style="typeDropdownPos"
                      @click.stop
                    >
                      <div
                        v-for="type in generateTypes"
                        :key="type.id"
                        :class="['select-option', { active: selectedType === type.id }]"
                        @click.stop="selectType(type)"
                      >
                        <i :data-lucide="type.icon" style="width: 16px; height: 16px; margin-right: 8px;"></i>
                        {{ type.label }}
                      </div>
                    </div>
                  </Teleport>
                </div>

                <!-- 模型选择器 -->
                <div
                  class="option-chip model-chip"
                  :class="{ open: isModelDropdownOpen }"
                  @click="toggleModelDropdown"
                  ref="modelTriggerRef"
                >
                  <i data-lucide="sparkles" style="width: 14px; height: 14px;"></i>
                  <span>{{ selectedModelName }}</span>
                  <i data-lucide="chevron-down" style="width: 12px; height: 12px;"></i>
                  <Teleport to="body">
                    <div v-if="isModelDropdownOpen" class="select-dropdown model-dropdown-menu" :style="modelDropdownPos" @click.stop>
                      <div
                        v-for="model in models"
                        :key="model.id"
                        :class="['select-option', { active: selectedModel === model.id }, { 'default-model-option': model.is_default }]"
                        @click.stop="selectModel(model)"
                      >
                        <div class="model-option-main">
                          <span class="model-name">
                            {{ model.name }}
                            <span v-if="model.is_default" class="default-badge">推荐</span>
                          </span>
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
                  </Teleport>
                </div>

                <!-- 特色功能选择器 -->
                <div
                  class="option-chip feature-chip"
                  :class="{ open: isFeatureDropdownOpen }"
                  @click="toggleFeatureDropdown"
                  ref="featureTriggerRef"
                >
                  <i data-lucide="wand-2" style="width: 14px; height: 14px;"></i>
                  <span>{{ selectedFeatureLabel }}</span>
                  <i data-lucide="chevron-down" style="width: 12px; height: 12px;"></i>
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
                        @click.stop="selectFeature(feature)"
                      >
                        {{ feature.label }}
                      </div>
                    </div>
                  </Teleport>
                </div>

                <!-- 画面比例 -->
                <div
                  class="option-chip ratio-chip"
                  :class="{ open: isRatioDropdownOpen }"
                  @click="toggleRatioDropdown"
                  ref="ratioTriggerRef"
                >
                  <i data-lucide="crop" style="width: 14px; height: 14px;"></i>
                  <span>{{ selectedRatio }}</span>
                  <i data-lucide="chevron-down" style="width: 12px; height: 12px;"></i>
                  <Teleport to="body">
                    <div
                      v-if="isRatioDropdownOpen"
                      class="select-dropdown ratio-dropdown-menu"
                      :style="ratioDropdownPos"
                      @click.stop
                    >
                      <div
                        v-for="ratio in aspectRatios"
                        :key="ratio"
                        :class="['select-option', { active: selectedRatio === ratio }]"
                        @click.stop="selectRatio(ratio)"
                      >
                        {{ ratio }}
                      </div>
                    </div>
                  </Teleport>
                </div>

                <!-- 视频时长（仅视频模式） -->
                <div
                  v-if="selectedType === 'video'"
                  class="option-chip duration-chip"
                  :class="{ open: isDurationDropdownOpen }"
                  @click="toggleDurationDropdown"
                  ref="durationTriggerRef"
                >
                  <i data-lucide="clock" style="width: 14px; height: 14px;"></i>
                  <span>{{ videoDuration }}s</span>
                  <i data-lucide="chevron-down" style="width: 12px; height: 12px;"></i>
                  <Teleport to="body">
                    <div
                      v-if="isDurationDropdownOpen"
                      class="select-dropdown duration-dropdown-menu"
                      :style="durationDropdownPos"
                      @click.stop
                    >
                      <div
                        v-for="dur in videoDurationOptions"
                        :key="dur"
                        :class="['select-option', { active: videoDuration === dur }]"
                        @click="selectDuration(dur)"
                      >
                        {{ dur }} 秒
                      </div>
                    </div>
                  </Teleport>
                </div>

                <!-- 画质 -->
                <div
                  class="option-chip quality-chip"
                  :class="{ open: isQualityDropdownOpen }"
                  @click="toggleQualityDropdown"
                  ref="qualityTriggerRef"
                >
                  <span>{{ selectedQualityLabel }}</span>
                  <i data-lucide="chevron-down" style="width: 12px; height: 12px;"></i>
                  <Teleport to="body">
                    <div
                      v-if="isQualityDropdownOpen"
                      class="select-dropdown quality-dropdown-menu"
                      :style="qualityDropdownPos"
                      @click.stop
                    >
                      <div
                        v-for="quality in qualities"
                        :key="quality.id"
                        :class="['select-option', { active: selectedQuality === quality.id }]"
                        @click.stop="selectQuality(quality)"
                      >
                        {{ quality.label }}
                      </div>
                    </div>
                  </Teleport>
                </div>

                <!-- 声音开关（仅特定视频模型） -->
                <button
                  v-if="showSoundToggle"
                  :class="['option-chip sound-chip', { active: videoSoundEnabled }]"
                  @click="videoSoundEnabled = !videoSoundEnabled"
                  :title="videoSoundEnabled ? '点击关闭声音' : '点击开启声音'"
                >
                  <i :data-lucide="videoSoundEnabled ? 'volume-2' : 'volume-x'" style="width: 14px; height: 14px;"></i>
                </button>
              </div>

              <!-- 右侧：字数 + 发送 -->
              <div class="footer-right">
                <span class="char-count-mini">{{ prompt.length }} / 2000</span>
                <button
                  class="send-btn"
                  :disabled="!canGenerate || isGenerating"
                  @click="handleGenerate"
                >
                  <i data-lucide="arrow-up" style="width: 18px; height: 18px;"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ====== 已交互状态：结果展示 + 输入框 ====== -->
        <div v-else class="jimeng-interaction">
          <!-- 顶部信息栏 -->
          <div class="interaction-topbar">
            <div class="topbar-context">
              <span class="context-title">{{ currentConversationTitle }}</span>
              <span class="context-sep">|</span>
              <span class="context-model">{{ selectedModelName }}</span>
              <span class="context-sep">|</span>
              <span class="context-feature">{{ selectedFeatureLabel }}</span>
              <span class="context-sep">|</span>
              <span class="context-quality">{{ selectedQualityLabel }}</span>
            </div>
            <div class="topbar-actions">
            </div>
          </div>

          <!-- 结果展示区域 -->
          <div class="results-area" ref="canvasContainer">
            <!-- 已生成的结果卡片（历史对话） -->
            <div v-for="card in generatedCards" :key="card.id" class="result-card-group">
              <!-- 图片/视频结果网格 -->
              <div v-if="card.results && card.results.length > 0" class="result-grid">
                <div v-for="(result, idx) in card.results" :key="idx" class="result-grid-item">
                  <div class="result-media-wrap">
                    <img
                      v-if="result.type === 'image'"
                      :src="convertBase64ToBlobUrl(result.url)"
                      :alt="'生成图片 ' + (idx + 1)"
                      class="result-img"
                    />
                    <video
                      v-else-if="result.type === 'video' && !card.loadingVideo"
                      :src="result.displayUrl || result.url"
                      controls
                      class="result-video"
                      @loadeddata="onVideoLoaded(card)"
                    ></video>
                    <div v-else-if="result.type === 'video' && card.loadingVideo" class="video-loading-overlay">
                      <div class="spinner-small"></div>
                    </div>
                    <!-- 悬浮操作按钮 -->
                    <div class="result-hover-actions">
                      <button class="result-action-btn" @click="downloadResult(result, idx)" title="下载">
                        <i data-lucide="download" style="width: 14px; height: 14px;"></i>
                      </button>
                      <button class="result-action-btn" @click="useAsInput(result)" title="作为输入">
                        <i data-lucide="repeat" style="width: 14px; height: 14px;"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="card-placeholder-inline">
                <i data-lucide="loader" style="width: 24px; height: 24px;"></i>
                <span>生成中...</span>
              </div>

              <!-- 操作按钮行 -->
              <div class="result-actions-row">
                <button class="result-action-chip" @click="editPrompt(card)">
                  <i data-lucide="pencil" style="width: 14px; height: 14px;"></i>
                  重新编辑
                </button>
                <button class="result-action-chip" @click="regenerateFromCard(card)">
                  <i data-lucide="refresh-cw" style="width: 14px; height: 14px;"></i>
                  再次生成
                </button>
                <button class="result-action-chip more-btn">
                  <i data-lucide="more-horizontal" style="width: 14px; height: 14px;"></i>
                </button>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-if="generatedCards.length === 0 && !isGenerating" class="results-empty">
              <i data-lucide="image" style="width: 48px; height: 48px; color: #d1d5db;"></i>
              <p>暂无生成结果</p>
            </div>

            <!-- 生成中的加载状态（在历史对话下方） -->
            <div v-if="isGenerating && generatedCards.filter(c => c.results?.length > 0).length === 0" class="generating-indicator-full">
              <div class="spinner-large"></div>
              <p>AI 正在创作中，请稍候...</p>
            </div>
          </div>

          <!-- 底部输入卡片（与欢迎态复用相同结构） -->
          <div class="input-card input-card-bottom">
            <div class="input-card-body">
              <div class="upload-dropdown" :class="{ open: isUploadDropdownOpen }">
                <div class="upload-zone" @click.stop="toggleUploadDropdown" title="上传素材">
                  <i data-lucide="plus" style="width: 24px; height: 24px;"></i>
                </div>
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
                </div>
              </div>
              <div class="prompt-editor-wrapper" ref="editorWrapperRefBottom">
                <div
                  class="prompt-input"
                  contenteditable="true"
                  :placeholder="promptPlaceholder"
                  @input="onPromptInput"
                  @keydown="onPromptKeydown"
                  ref="promptEditorRefBottom"
                ></div>
                <!-- @提及下拉列表（底部输入卡片） -->
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
                        :key="'candb-' + idx"
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
            </div>

            <!-- 媒体素材栏 -->
            <div v-if="uploadedFiles.length > 0 || referencedFiles.length > 0" class="media-bar">
              <div v-if="uploadedFiles.length > 0" class="media-section">
                <div class="section-label">
                  <i data-lucide="upload" style="width: 13px; height: 13px;"></i>
                  上传素材
                  <span class="section-count">{{ uploadedFiles.length }}</span>
                </div>
                <div class="media-items-row">
                  <div
                    v-for="(file, index) in uploadedFiles"
                    :key="'upb-' + index"
                    class="media-item draggable-item"
                    :class="[`type-${file.type}`]"
                    draggable="true"
                    @dragstart="onDragStart(file, index, 'upload')"
                    @dragend="onDragEnd"
                    @click.stop="clickToReference(file)"
                  >
                    <img v-if="file.type === 'image'" :src="convertBase64ToBlobUrl(file.url)" :alt="file.name" class="preview-thumb" />
                    <video v-else-if="file.type === 'video'" :src="file.url" class="preview-thumb" muted />
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
              <div v-if="uploadedFiles.length > 0 && referencedFiles.length > 0" class="media-bar-divider"></div>
              <div v-if="referencedFiles.length > 0" class="media-section ref-section">
                <div class="section-label">
                  <i data-lucide="at-sign" style="width: 13px; height: 13px;"></i>
                  @ 引用素材
                  <span class="section-count">{{ referencedFiles.length }}</span>
                </div>
                <div class="media-items-row">
                  <div
                    v-for="refFile in referencedFiles"
                    :key="'refb-' + refFile.atId"
                    class="media-item ref-item"
                    :class="[`type-${refFile.type}`, { active: activeAtTagId === refFile.atId }]"
                    @click="focusAtTagById(refFile.atId)"
                  >
                    <img v-if="refFile.type === 'image'" :src="convertBase64ToBlobUrl(refFile.url)" :alt="refFile.name" class="preview-thumb" />
                    <video v-else-if="refFile.type === 'video'" :src="refFile.url" class="preview-thumb" muted />
                    <div class="ref-at-badge">@{{ refFile.atLabel }}</div>
                    <button class="remove-ref-btn" @click.stop="removeReferencedFile(refFile.atId)" title="取消引用">
                      <i data-lucide="x" style="width: 11px; height: 11px;"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 底部操作栏 -->
            <div class="input-card-footer">
              <div class="footer-options">
                <div class="option-chip type-chip" :class="{ open: isTypeDropdownOpen }" @click="toggleTypeDropdown" ref="typeTriggerRef2">
                  <i :data-lucide="selectedTypeIcon" style="width: 14px; height: 14px;"></i>
                  <span>{{ selectedTypeLabel }}</span>
                  <i data-lucide="chevron-down" style="width: 12px; height: 12px;"></i>
                  <Teleport to="body">
                    <div
                      v-if="isTypeDropdownOpen"
                      class="select-dropdown type-dropdown-menu"
                      :style="typeDropdownPos"
                      @click.stop
                    >
                      <div
                        v-for="type in generateTypes"
                        :key="type.id"
                        :class="['select-option', { active: selectedType === type.id }]"
                        @click.stop="selectType(type)"
                      >
                        <i :data-lucide="type.icon" style="width: 16px; height: 16px; margin-right: 8px;"></i>
                        {{ type.label }}
                      </div>
                    </div>
                  </Teleport>
                </div>
                <div class="option-chip model-chip" :class="{ open: isModelDropdownOpen }" @click="toggleModelDropdown" ref="modelTriggerRef2">
                  <i data-lucide="sparkles" style="width: 14px; height: 14px;"></i>
                  <span>{{ selectedModelName }}</span>
                  <i data-lucide="chevron-down" style="width: 12px; height: 12px;"></i>
                  <Teleport to="body">
                    <div v-if="isModelDropdownOpen" class="select-dropdown model-dropdown-menu" :style="modelDropdownPos" @click.stop>
                      <div
                        v-for="model in models"
                        :key="model.id"
                        :class="['select-option', { active: selectedModel === model.id }, { 'default-model-option': model.is_default }]"
                        @click.stop="selectModel(model)"
                      >
                        <div class="model-option-main">
                          <span class="model-name">
                            {{ model.name }}
                            <span v-if="model.is_default" class="default-badge">推荐</span>
                          </span>
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
                  </Teleport>
                </div>
                <div class="option-chip feature-chip" :class="{ open: isFeatureDropdownOpen }" @click="toggleFeatureDropdown" ref="featureTriggerRef2">
                  <i data-lucide="wand-2" style="width: 14px; height: 14px;"></i>
                  <span>{{ selectedFeatureLabel }}</span>
                  <i data-lucide="chevron-down" style="width: 12px; height: 12px;"></i>
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
                        @click.stop="selectFeature(feature)"
                      >
                        {{ feature.label }}
                      </div>
                    </div>
                  </Teleport>
                </div>
                <div class="option-chip ratio-chip" :class="{ open: isRatioDropdownOpen }" @click="toggleRatioDropdown" ref="ratioTriggerRef2">
                  <i data-lucide="crop" style="width: 14px; height: 14px;"></i>
                  <span>{{ selectedRatio }}</span>
                  <i data-lucide="chevron-down" style="width: 12px; height: 12px;"></i>
                  <Teleport to="body">
                    <div
                      v-if="isRatioDropdownOpen"
                      class="select-dropdown ratio-dropdown-menu"
                      :style="ratioDropdownPos"
                      @click.stop
                    >
                      <div
                        v-for="ratio in aspectRatios"
                        :key="ratio"
                        :class="['select-option', { active: selectedRatio === ratio }]"
                        @click.stop="selectRatio(ratio)"
                      >
                        {{ ratio }}
                      </div>
                    </div>
                  </Teleport>
                </div>
                <div v-if="selectedType === 'video'" class="option-chip duration-chip" :class="{ open: isDurationDropdownOpen }" @click="toggleDurationDropdown" ref="durationTriggerRef2">
                  <i data-lucide="clock" style="width: 14px; height: 14px;"></i>
                  <span>{{ videoDuration }}s</span>
                  <i data-lucide="chevron-down" style="width: 12px; height: 12px;"></i>
                  <Teleport to="body">
                    <div
                      v-if="isDurationDropdownOpen"
                      class="select-dropdown duration-dropdown-menu"
                      :style="durationDropdownPos"
                      @click.stop
                    >
                      <div
                        v-for="dur in videoDurationOptions"
                        :key="dur"
                        :class="['select-option', { active: videoDuration === dur }]"
                        @click="selectDuration(dur)"
                      >
                        {{ dur }} 秒
                      </div>
                    </div>
                  </Teleport>
                </div>
                <div class="option-chip quality-chip" :class="{ open: isQualityDropdownOpen }" @click="toggleQualityDropdown" ref="qualityTriggerRef2">
                  <span>{{ selectedQualityLabel }}</span>
                  <i data-lucide="chevron-down" style="width: 12px; height: 12px;"></i>
                  <Teleport to="body">
                    <div
                      v-if="isQualityDropdownOpen"
                      class="select-dropdown quality-dropdown-menu"
                      :style="qualityDropdownPos"
                      @click.stop
                    >
                      <div
                        v-for="quality in qualities"
                        :key="quality.id"
                        :class="['select-option', { active: selectedQuality === quality.id }]"
                        @click.stop="selectQuality(quality)"
                      >
                        {{ quality.label }}
                      </div>
                    </div>
                  </Teleport>
                </div>
                <button
                  v-if="showSoundToggle"
                  :class="['option-chip sound-chip', { active: videoSoundEnabled }]"
                  @click="videoSoundEnabled = !videoSoundEnabled"
                >
                  <i :data-lucide="videoSoundEnabled ? 'volume-2' : 'volume-x'" style="width: 14px; height: 14px;"></i>
                </button>
              </div>
              <div class="footer-right">
                <span class="char-count-mini">{{ prompt.length }} / 2000</span>
                <button class="send-btn" :disabled="!canGenerate || isGenerating" @click="handleGenerate">
                  <i data-lucide="arrow-up" style="width: 18px; height: 18px;"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

  </AppLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '../components/layout/AppLayout.vue'
import { userData } from '../data/userData'

const route = useRoute()
const router = useRouter()

// ========== 即梦AI风格新增状态 ==========
const hasInteracted = ref(false)
const activeConversationId = ref(null)
const conversationHistory = ref([])

const currentConversationTitle = computed(() => {
  const conv = conversationHistory.value.find(c => c.id === activeConversationId.value)
  return conv ? conv.title : '新对话'
})

// 当前对话的结果卡片（computed 自动跟随活跃对话）
const generatedCards = computed({
  get() {
    const conv = conversationHistory.value.find(c => c.id === activeConversationId.value)
    return conv ? conv.cards : []
  },
  set(val) {
    const conv = conversationHistory.value.find(c => c.id === activeConversationId.value)
    if (conv) conv.cards = val
  }
})

function startNewChat() {
  hasInteracted.value = false
  activeConversationId.value = null
  prompt.value = ''
  if (promptEditorRef.value) promptEditorRef.value.innerHTML = ''
  if (promptEditorRefBottom.value) promptEditorRefBottom.value.innerHTML = ''
  uploadedFiles.value = []
  referencedFiles.value = []
  atTags.value = []
  activeAtTagId.value = null
  atImageCounter = 0
  atVideoCounter = 0
}

async function selectConversation(id) {
  if (id === activeConversationId.value) return
  activeConversationId.value = id
  hasInteracted.value = true
  // 切换对话时清空输入区（卡片由 computed 自动切换）
  prompt.value = ''
  if (promptEditorRef.value) promptEditorRef.value.innerHTML = ''
  if (promptEditorRefBottom.value) promptEditorRefBottom.value.innerHTML = ''
  uploadedFiles.value = []
  referencedFiles.value = []
  atTags.value = []
  activeAtTagId.value = null
  atImageCounter = 0
  atVideoCounter = 0
  // 按需加载对话详情（cards 为空时从 API 获取）
  const conv = conversationHistory.value.find(c => c.id === id)
  if (conv && conv.cards.length === 0) {
    await loadConversationDetail(id)
  }
  nextTick(() => { if (window.lucide) lucide.createIcons() })
}

async function deleteConversation(id) {
  const idx = conversationHistory.value.findIndex(c => c.id === id)
  if (idx === -1) return
  conversationHistory.value.splice(idx, 1)
  if (activeConversationId.value === id) {
    activeConversationId.value = null
    hasInteracted.value = conversationHistory.value.length > 0
    if (conversationHistory.value.length > 0) {
      selectConversation(conversationHistory.value[0].id)
    }
  }
  saveConversationsToLocal()
  // 同步删除后端
  await deleteConversationAPI(id)
}

function saveConversationsToLocal() {
  try {
    const data = conversationHistory.value.map(c => ({
      id: c.id, title: c.title, type: c.type, time: c.time,
      cards: c.cards.map(card => ({
        id: card.id, title: card.title, prompt: card.prompt,
        type: card.type, model: card.model, taskId: card.taskId,
        results: card.results, status: card.status
      }))
    }))
    localStorage.setItem('szg_conversations', JSON.stringify(data))
  } catch (e) { console.warn('保存对话失败:', e) }
}

function loadConversationsFromLocal() {
  try {
    const raw = localStorage.getItem('szg_conversations')
    if (!raw) return
    const data = JSON.parse(raw)
    conversationHistory.value = data.map(c => ({
      ...c,
      thumbnail: c.cards?.[0]?.results?.[0]?.url || '',
      cards: (c.cards || []).map(card => ({ ...card, loadingVideo: false, uploadedInputFiles: [] }))
    }))
  } catch (e) { console.warn('加载对话失败:', e) }
}

function formatConvTime(ts) {
  if (!ts) return ''
  const diff = Date.now() - ts
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function triggerUpload() {
  handleUploadType(selectedType.value === 'video' ? 'image' : 'image')
}

function toggleUploadDropdown() {
  isUploadDropdownOpen.value = !isUploadDropdownOpen.value
}

function editPrompt(card) {
  prompt.value = card.prompt || ''
  const editor = promptEditorRef.value || promptEditorRefBottom.value
  if (editor) editor.innerHTML = card.prompt || ''
}

function regenerateFromCard(card) {
  prompt.value = card.prompt || ''
  handleGenerate()
}

// ========== 原有状态和逻辑 ==========
const prompt = ref('')
const selectedType = ref('image')
const selectedModel = ref('')
const selectedRatio = ref('16:9')
const selectedQuality = ref('2k')
const selectedFeature = ref('')
const isGenerating = ref(false)
const uploadedFiles = ref([])
const referencedFiles = ref([])
const atTags = ref([])
const activeAtTagId = ref(null)
let atImageCounter = 0
let atVideoCounter = 0
const showAtMentionDropdown = ref(false)
const atMentionCandidates = ref([])
const activeMentionIndex = ref(0)
const mentionDropdownStyle = ref({})
const videoSoundEnabled = ref(false)
const videoDuration = ref(5)
const videoDurationOptions = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
const expandedCardId = ref(null)

const generateTypes = [
  { id: 'image', label: '图片生成', icon: 'image' },
  { id: 'video', label: '视频生成', icon: 'video' },
  { id: 'audio', label: '音频生成', icon: 'music' },
  { id: 'digital-human', label: '数字人', icon: 'user' }
]

const selectedTypeIcon = computed(() => {
  const t = generateTypes.find(g => g.id === selectedType.value)
  return t ? t.icon : 'image'
})

const selectedTypeLabel = computed(() => {
  const t = generateTypes.find(g => g.id === selectedType.value)
  return t ? t.label : '图片生成'
})

const promptPlaceholder = computed(() => {
  if (selectedType.value === 'image') {
    return '上传参考图、输入文字或 @ 主体，描述你想生成的图片。'
  } else if (selectedType.value === 'video') {
    return '上传最多12个参考素材，输入文字或 @ 参考内容，自由组合图、文、音、视频多元素，定义精彩互动。例如：@图片1 模仿 @视频1 的动作，音色参考 @音频1。'
  }
  return '输入你的创作描述...'
})

const canGenerate = computed(() => prompt.value.trim().length > 0)

const showSoundToggle = computed(() => {
  if (selectedType.value !== 'video') return false
  const model = models.value.find(m => m.id === selectedModel.value)
  if (!model) return false
  const modelName = (model.name || model.id || '').toLowerCase()
  return (modelName.includes('kling') && modelName.includes('3.0')) || modelName.includes('kling_3')
})

// ========== 下拉框状态 ==========
const isTypeDropdownOpen = ref(false)
const isModelDropdownOpen = ref(false)
const isRatioDropdownOpen = ref(false)
const isQualityDropdownOpen = ref(false)
const isFeatureDropdownOpen = ref(false)
const isDurationDropdownOpen = ref(false)
const isUploadDropdownOpen = ref(false)
const typeDropdownPos = ref({})
const modelDropdownPos = ref({})
const ratioDropdownPos = ref({})
const qualityDropdownPos = ref({})
const featureDropdownPos = ref({})
const durationDropdownPos = ref({})

const typeTriggerRef = ref(null)
const typeTriggerRef2 = ref(null)
const modelTriggerRef = ref(null)
const modelTriggerRef2 = ref(null)
const ratioTriggerRef = ref(null)
const ratioTriggerRef2 = ref(null)
const qualityTriggerRef = ref(null)
const qualityTriggerRef2 = ref(null)
const featureTriggerRef = ref(null)
const featureTriggerRef2 = ref(null)
const durationTriggerRef = ref(null)
const durationTriggerRef2 = ref(null)
const editorWrapperRef = ref(null)
const editorWrapperRefBottom = ref(null)
const promptEditorRef = ref(null)
const promptEditorRefBottom = ref(null)
const canvasContainer = ref(null)
let mentionAnchorRange = null

// ========== 模型数据 ==========
const models = ref([])
const imageModels = ref([])
const videoModels = ref([])
const digitalHumanModels = ref([])
const audioModels = ref([])

const defaultModel = { id: '', name: '默认模型', description: '系统自动选择最优模型', is_default: true }

const aspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4', '5:4', '4:5', '21:9']
const qualities = [
  { id: '480p', label: '480p' },
  { id: '720p', label: '720P' },
  { id: '1080p', label: '1080P' },
  { id: '2k', label: '2K' },
  { id: '4k', label: '4K' }
]

const selectedModelName = computed(() => {
  if (!selectedModel.value) return '默认模型'
  const model = models.value.find(m => m.id === selectedModel.value)
  return model ? model.name : '默认模型'
})

const selectedQualityLabel = computed(() => {
  const quality = qualities.find(q => q.id === selectedQuality.value)
  return quality ? quality.label : '2K'
})

const featureMap = {
  image: [
    { id: 'text2img', label: '文生图' },
    { id: 'reference', label: '参考图' },
    { id: 'style-transfer', label: '风格转换' },
    { id: 'inpaint', label: '局部重绘' },
    { id: 'outpaint', label: '扩图' },
    { id: 'erase', label: '消除笔' },
    { id: 'face-swap', label: 'AI换脸' },
    { id: 'outfit-change', label: 'AI换装' }
  ],
  video: [
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
const selectedFeatureLabel = computed(() => {
  if (!selectedFeature.value) return selectedType.value === 'video' ? '全能参考' : '文生图'
  const allFeatures = currentFeatures.value
  const feature = allFeatures.find(f => f.id === selectedFeature.value)
  return feature ? feature.label : (selectedType.value === 'video' ? '全能参考' : '文生图')
})

// ========== 下拉框切换函数 ==========
function toggleTypeDropdown() {
  isTypeDropdownOpen.value = !isTypeDropdownOpen.value
  closeOtherDropdowns('type')
  if (isTypeDropdownOpen.value) positionDropdown('type', typeTriggerRef.value || typeTriggerRef2.value, typeDropdownPos)
}
function toggleModelDropdown() {
  isModelDropdownOpen.value = !isModelDropdownOpen.value
  closeOtherDropdowns('model')
  if (isModelDropdownOpen.value) positionDropdown('model', modelTriggerRef.value || modelTriggerRef2.value, modelDropdownPos)
}
function toggleRatioDropdown() {
  isRatioDropdownOpen.value = !isRatioDropdownOpen.value
  closeOtherDropdowns('ratio')
  if (isRatioDropdownOpen.value) positionDropdown('ratio', ratioTriggerRef.value || ratioTriggerRef2.value, ratioDropdownPos)
}
function toggleQualityDropdown() {
  isQualityDropdownOpen.value = !isQualityDropdownOpen.value
  closeOtherDropdowns('quality')
  if (isQualityDropdownOpen.value) positionDropdown('quality', qualityTriggerRef.value || qualityTriggerRef2.value, qualityDropdownPos)
}
function toggleFeatureDropdown() {
  isFeatureDropdownOpen.value = !isFeatureDropdownOpen.value
  closeOtherDropdowns('feature')
  if (isFeatureDropdownOpen.value) positionDropdown('feature', featureTriggerRef.value || featureTriggerRef2.value, featureDropdownPos)
}
function toggleDurationDropdown() {
  isDurationDropdownOpen.value = !isDurationDropdownOpen.value
  closeOtherDropdowns('duration')
  if (isDurationDropdownOpen.value) positionDropdown('duration', durationTriggerRef.value || durationTriggerRef2.value, durationDropdownPos)
}

function closeOtherDropdowns(keep) {
  if (keep !== 'type') isTypeDropdownOpen.value = false
  if (keep !== 'model') isModelDropdownOpen.value = false
  if (keep !== 'ratio') isRatioDropdownOpen.value = false
  if (keep !== 'quality') isQualityDropdownOpen.value = false
  if (keep !== 'feature') isFeatureDropdownOpen.value = false
  if (keep !== 'duration') isDurationDropdownOpen.value = false
  if (keep !== 'upload') isUploadDropdownOpen.value = false
}

function positionDropdown(name, triggerRef, posRef) {
  nextTick(() => {
    if (triggerRef) {
      const rect = triggerRef.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      const estimatedHeight = 280
      const openUpward = spaceBelow < estimatedHeight && spaceAbove > spaceBelow

      if (openUpward) {
        posRef.value = {
          position: 'fixed',
          left: `${rect.left}px`,
          width: `${Math.max(rect.width, 180)}px`,
          bottom: `${window.innerHeight - rect.top + 4}px`,
          zIndex: 99999,
          maxHeight: `${Math.min(280, spaceAbove - 20)}px`
        }
      } else {
        posRef.value = {
          position: 'fixed',
          left: `${rect.left}px`,
          width: `${Math.max(rect.width, 180)}px`,
          top: `${rect.bottom + 4}px`,
          zIndex: 99999,
          maxHeight: `${Math.min(280, window.innerHeight - rect.bottom - 20)}px`
        }
      }
    }
  })
}

function selectType(type) {
  selectedType.value = type.id
  isTypeDropdownOpen.value = false
  updateModelsByType()
  nextTick(() => { if (window.lucide) lucide.createIcons() })
}
function selectModel(model) {
  selectedModel.value = model.id
  isModelDropdownOpen.value = false
  nextTick(() => { if (window.lucide) lucide.createIcons() })
}
function selectRatio(ratio) {
  selectedRatio.value = ratio
  isRatioDropdownOpen.value = false
  nextTick(() => { if (window.lucide) lucide.createIcons() })
}
function selectQuality(quality) {
  selectedQuality.value = quality.id
  isQualityDropdownOpen.value = false
  nextTick(() => { if (window.lucide) lucide.createIcons() })
}
function selectFeature(feature) {
  selectedFeature.value = feature.id
  isFeatureDropdownOpen.value = false
  nextTick(() => { if (window.lucide) lucide.createIcons() })
}
function selectDuration(dur) {
  videoDuration.value = dur
  isDurationDropdownOpen.value = false
  nextTick(() => { if (window.lucide) lucide.createIcons() })
}

function getDefaultImageModels() {
  return [
    { id: 'image_5.0_lite', name: '图片5.0 Lite', description: '指令响应更精准', is_new: true, vendor: 'vendor_a', vendor_name: '腾讯云 VOD' },
    { id: 'image_5.0', name: '图片5.0', description: '全能王者', is_new: true, is_vip: true, free_trial: true, vendor: 'vendor_a', vendor_name: '腾讯云 VOD' },
    { id: 'hunyuan_1_5', name: 'Hunyuan 1.5', description: '混元大模型', vendor: 'vendor_a', vendor_name: '腾讯云 VOD' },
    { id: 'gpt-image-2', name: 'GPT Image 2', description: 'text_to_image', vendor: 'vendor_b', vendor_name: 'Token Switch' }
  ]
}

function getDefaultVideoModels() {
  return [
    { id: 'seedance_2.0_fast_vip', name: 'Seedance 2.0 Fast VIP+', description: '极速推理', is_new: true, is_vip: true, vendor: 'vendor_a', vendor_name: '腾讯云 VOD' },
    { id: 'seedance_2.0_fast', name: 'Seedance 2.0 Fast', description: '高性价比', is_new: true, vendor: 'vendor_a', vendor_name: '腾讯云 VOD' },
    { id: 'happyhorse-1.0-video-edit-720p', name: 'HappyHorse Video Edit 720p', description: '视频编辑', vendor: 'vendor_b', vendor_name: 'Token Switch' }
  ]
}

function getDefaultAudioModels() {
  return [
    { id: 'audio_1.0', name: '音频生成 1.0', description: '高质量音频生成', is_new: true, vendor: 'vendor_a', vendor_name: '腾讯云 VOD' },
    { id: 'music-gen-2.0', name: '音乐生成 2.0', description: '专业音乐创作', is_new: true, is_vip: true, vendor: 'vendor_b', vendor_name: 'Token Switch' }
  ]
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
    case 'audio':
      models.value = [...audioModels.value]
      break
    default:
      models.value = [...videoModels.value]
  }

  selectedModel.value = ''
  console.log('✅ 模型列表已更新, 当前模型数量:', models.value.length, `(${selectedType.value})`)
}

async function initModels() {
  console.log('🚀 开始初始化模型列表...')

  const isConnected = await testApiConnection()

  if (!isConnected) {
    console.warn('⚠️ API 未连通，将使用默认硬编码模型')
    showToast('无法连接到后端服务，使用默认模型', 'warning')
    imageModels.value = getDefaultImageModels()
    videoModels.value = getDefaultVideoModels()
    digitalHumanModels.value = []
    audioModels.value = getDefaultAudioModels()
    updateModelsByType()
  } else {
    const fetchedModels = await fetchModels()
    const classified = classifyModels(fetchedModels)

    imageModels.value = classified.image.length > 0 ? classified.image : getDefaultImageModels()
    videoModels.value = classified.video.length > 0 ? classified.video : getDefaultVideoModels()
    digitalHumanModels.value = classified.digitalHuman.length > 0 ? classified.digitalHuman : []
    audioModels.value = classified.audio?.length > 0 ? classified.audio : getDefaultAudioModels()

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

// 切换生成类型时自动更新模型列表
watch(selectedType, (newType) => {
  console.log('🔄 切换生成类型:', newType)
  selectedModel.value = ''
  selectedFeature.value = ''
  uploadedFiles.value = []
  updateModelsByType()
  console.log('✅ 模型列表已更新, 当前模型数量:', models.value.length, `(${newType})`)
})

// ========== 文件上传 ==========
function handleUploadType(fileType) {
  isUploadDropdownOpen.value = false
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  switch (fileType) {
    case 'image': input.accept = 'image/*'; break
    case 'video': input.accept = 'video/*'; break
    case 'audio': input.accept = 'audio/*'; break
    default: input.accept = 'image/*,video/*,audio/*'
  }
  input.onchange = async (e) => {
    const files = Array.from(e.target.files)
    for (const file of files) {
      const reader = new FileReader()
      reader.onload = (event) => {
        let detectedType = fileType
        if (file.type.startsWith('image/')) detectedType = 'image'
        else if (file.type.startsWith('video/')) detectedType = 'video'
        else if (file.type.startsWith('audio/')) detectedType = 'audio'
        uploadedFiles.value.push({
          type: detectedType,
          url: event.target.result,
          purpose: 'reference',
          object_id: `${detectedType}_${uploadedFiles.value.length + 1}`,
          name: file.name
        })
      }
      reader.readAsDataURL(file)
    }
    nextTick(() => { if (window.lucide) lucide.createIcons() })
  }
  input.click()
}

function removeUploadedFile(index) {
  const removed = uploadedFiles.value.splice(index, 1)[0]
  if (removed && removed.object_id) {
    referencedFiles.value.filter(r => r.sourceId === removed.object_id).forEach(ref => removeAtTag(ref.atId))
  }
  resequenceAtTags()
  nextTick(() => { if (window.lucide) lucide.createIcons() })
}

/** 删除后重新编排@标签编号，保持连续 */
function resequenceAtTags() {
  let imgSeq = 0, vidSeq = 0
  for (const tag of atTags.value) {
    if (tag.type === 'video') {
      vidSeq++
      const newLabel = `视频${vidSeq}`
      tag.label = newLabel; tag.fullTag = `@${newLabel}`
      const ref = referencedFiles.value.find(r => r.atId === tag.id)
      if (ref) { ref.atLabel = newLabel; ref.atTag = `@${newLabel}` }
      const domEl = document.querySelector(`[data-at-id="${tag.id}"] .at-tag-card-badge`)
      if (domEl) domEl.textContent = tag.fullTag
    } else {
      imgSeq++
      const newLabel = `图片${imgSeq}`
      tag.label = newLabel; tag.fullTag = `@${newLabel}`
      const ref = referencedFiles.value.find(r => r.atId === tag.id)
      if (ref) { ref.atLabel = newLabel; ref.atTag = `@${newLabel}` }
      const domEl = document.querySelector(`[data-at-id="${tag.id}"] .at-tag-card-badge`)
      if (domEl) domEl.textContent = tag.fullTag
    }
  }
  atImageCounter = imgSeq; atVideoCounter = vidSeq
  const editor = promptEditorRef.value || promptEditorRefBottom.value
  if (editor) prompt.value = editor.innerText.replace(/\u200B/g, '')
}

function getFileTypeLabel(type) {
  return { image: '图片', video: '视频', audio: '音频' }[type] || type
}

// ========== @提及功能 ==========
function closeMentionDropdown() {
  showAtMentionDropdown.value = false
  mentionAnchorRange = null
  activeMentionIndex.value = 0
}

function getTextBeforeCursor(editor, range) {
  const container = range.startContainer
  const offset = range.startOffset
  if (container.nodeType === Node.TEXT_NODE) {
    let text = container.textContent.slice(0, offset)
    let node = container
    while ((node = node.previousSibling)) {
      if (node.nodeType === Node.TEXT_NODE) text = node.textContent + text
      else if (node.nodeType === Node.ELEMENT_NODE) text = node.textContent + text
    }
    let parent = container.parentNode
    while (parent && parent !== editor) {
      let prev = parent.previousSibling
      while (prev) { text = prev.textContent + text; prev = prev.previousSibling }
      parent = parent.parentNode
    }
    return text
  }
  return ''
}

function checkAtMention(e) {
  const editor = promptEditorRef.value || promptEditorRefBottom.value
  if (!editor) { closeMentionDropdown(); return }
  const selection = window.getSelection()
  if (!selection.rangeCount || !editor.contains(selection.anchorNode)) { closeMentionDropdown(); return }

  // 填充候选列表（排除已引用的文件）
  const referencedIds = new Set(referencedFiles.value.map(r => r.sourceId))
  atMentionCandidates.value = uploadedFiles.value.filter(f => !referencedIds.has(f.object_id))

  const range = selection.getRangeAt(0)
  const textBeforeCaret = getTextBeforeCursor(editor, range)
  const atMatch = textBeforeCaret.match(/@(\w*)$/)

  if (atMatch && atMentionCandidates.value.length > 0) {
    mentionAnchorRange = range.cloneRange()
    mentionAnchorRange.setStart(range.startContainer, range.startOffset - atMatch[0].length)

    const rect = range.getBoundingClientRect()
    showAtMentionDropdown.value = true
    activeMentionIndex.value = 0

    const estimatedHeight = 240
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const openUpward = spaceBelow < estimatedHeight + 20 && spaceAbove > spaceBelow

    if (openUpward) {
      mentionDropdownStyle.value = {
        position: 'fixed',
        bottom: `${window.innerHeight - rect.top + 6}px`,
        left: `${rect.left + 8}px`,
        width: `${Math.min(rect.width - 16, 360)}px`,
        zIndex: 99999,
        maxHeight: `${Math.min(estimatedHeight, spaceAbove - 20)}px`
      }
    } else {
      mentionDropdownStyle.value = {
        position: 'fixed',
        top: `${rect.bottom + 6}px`,
        left: `${rect.left + 8}px`,
        width: `${Math.min(rect.width - 16, 360)}px`,
        zIndex: 99999,
        maxHeight: `${Math.min(estimatedHeight, window.innerHeight - rect.bottom - 20)}px`
      }
    }
  } else {
    closeMentionDropdown()
  }
}

function selectAtMention(file) {
  const editor = promptEditorRef.value || promptEditorRefBottom.value
  if (!editor) { closeMentionDropdown(); return }

  // 删除输入的@字符，保留光标位置
  if (mentionAnchorRange) {
    try {
      const selection = window.getSelection()
      selection.removeAllRanges()
      selection.addRange(mentionAnchorRange)
      mentionAnchorRange.deleteContents()
    } catch (_) {}
  }

  // 创建引用记录（编号 = 当前同类型标签数 + 1，不依赖全局计数器）
  const typeKey = file.type === 'video' ? '视频' : '图片'
  const existingCount = atTags.value.filter(t => t.type === file.type).length
  const counter = existingCount + 1
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

  // 插入带缩略图的标签到编辑器
  insertAtTagToPrompt(newAtTag)
  closeMentionDropdown()

  nextTick(() => {
    editor.focus()
    if (window.lucide) lucide.createIcons()
  })
}

function insertAtTagToPrompt(tag) {
  const editor = promptEditorRef.value || promptEditorRefBottom.value
  if (!editor) return

  // 芯片式HTML：标签 + 关闭按钮（无图标，避免乱码）
  const innerHtml = `
    <span class="at-tag-card-badge">${tag.fullTag}</span>
    <button class="at-tag-close" data-at-id="${tag.id}" title="取消引用"></button>
  `

  const selection = window.getSelection()

  if (selection.rangeCount > 0 && editor.contains(selection.anchorNode)) {
    const range = selection.getRangeAt(0)
    const span = document.createElement('span')
    span.className = `at-tag-inline at-tag-${tag.type}`
    span.contentEditable = 'false'
    span.dataset.atId = tag.id
    span.innerHTML = innerHtml
    range.insertNode(span)
    // 在span后插入零宽空格，确保光标有位置可落
    const zwsp = document.createTextNode('\u200B')
    range.setStartAfter(span)
    range.insertNode(zwsp)
    range.setStartAfter(zwsp)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)
  } else {
    editor.innerHTML += `<span class="at-tag-inline at-tag-${tag.type}" contenteditable="false" data-at-id="${tag.id}">${innerHtml}</span>\u200B`
  }

  activeAtTagId.value = tag.id
  prompt.value = editor.innerText.replace(/\u200B/g, '')

  nextTick(() => bindInlineCloseButtons())
}

function bindInlineCloseButtons() {
  const editor = promptEditorRef.value || promptEditorRefBottom.value
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

function removeAtTag(atId) {
  // 从标签列表中移除
  const tagIdx = atTags.value.findIndex(t => t.id === atId)
  if (tagIdx !== -1) atTags.value.splice(tagIdx, 1)

  // 从引用列表中移除
  const refIdx = referencedFiles.value.findIndex(r => r.atId === atId)
  if (refIdx !== -1) referencedFiles.value.splice(refIdx, 1)

  // 从编辑器DOM中移除
  const editor = promptEditorRef.value || promptEditorRefBottom.value
  if (editor) {
    const el = editor.querySelector(`[data-at-id="${atId}"]`)
    if (el) el.remove()
    prompt.value = editor.innerText
  }

  if (activeAtTagId.value === atId) activeAtTagId.value = null

  // 重置计数器
  recalcCounters()

  nextTick(() => { if (window.lucide) lucide.createIcons() })
}

function recalcCounters() {
  let maxVideo = 0, maxImage = 0
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

function focusAtTagById(atId) {
  activeAtTagId.value = atId
  const el = document.querySelector(`[data-at-id="${atId}"]`)
  if (el) { el.classList.add('at-tag-inline-highlight'); setTimeout(() => el.classList.remove('at-tag-inline-highlight'), 1000) }
}

function clickToReference(file) {
  if (!uploadedFiles.value.some(f => f.object_id === file.object_id)) uploadedFiles.value.push({ ...file })
  atMentionCandidates.value = [file]
  showAtMentionDropdown.value = true
  activeMentionIndex.value = 0
  selectAtMention(file)
}

function onPromptInput(e) {
  const editor = e.target
  const text = editor.innerText || ''
  if (text.length <= 2000) { prompt.value = text.replace(/\u200B/g, '') }
  else { editor.innerText = text.slice(0, 2000); prompt.value = text.slice(0, 2000) }
  checkAtMention(e)
  syncRemovedAtTags(editor)
}

/** 同步清理：编辑器中已被删除的@标签DOM，同步移除referencedFiles和atTags */
function syncRemovedAtTags(editor) {
  if (!editor || atTags.value.length === 0) return
  const domAtIds = new Set()
  editor.querySelectorAll('[data-at-id]').forEach(el => { domAtIds.add(el.dataset.atId) })
  const removed = atTags.value.filter(t => !domAtIds.has(t.id))
  if (removed.length === 0) return
  for (const tag of removed) {
    removeAtTag(tag.id)
  }
}

function onPromptKeydown(e) {
  if (showAtMentionDropdown.value) {
    if (e.key === 'ArrowDown') { e.preventDefault(); activeMentionIndex.value = Math.min(activeMentionIndex.value + 1, atMentionCandidates.value.length - 1) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); activeMentionIndex.value = Math.max(activeMentionIndex.value - 1, 0) }
    else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); if (atMentionCandidates.value[activeMentionIndex.value]) selectAtMention(atMentionCandidates.value[activeMentionIndex.value]) }
    else if (e.key === 'Escape') showAtMentionDropdown.value = false
    return
  }
  if (e.key === '@') { nextTick(() => checkAtMention(e)); return }
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (canGenerate.value && !isGenerating.value) handleGenerate() }
}

function onDragStart() {}
function onDragEnd() {}

// ========== 生成请求 ==========
const API_CONFIG = {
  BASE_URL: 'http://192.168.31.243:8003/api/v1'
}

let globalModels = {
  image_models: [],
  video_models: [],
  voices: []
}

async function testApiConnection() {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
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
        'Authorization': `Bearer ${getAuthToken()}`
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

const qualityMap = {
  '720p': '720P',
  '1080p': '1080P',
  '2k': '2K',
  '4k': '4K'
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

function buildGenerateRequest() {
  const currentModel = models.value.find(m => m.id === selectedModel.value)
  if (!currentModel) throw new Error('请先选择模型')

  const params = getCurrentParams()
  let outputType
  if (selectedType.value === 'image') outputType = 'image'
  else if (selectedType.value === 'digital-human') outputType = 'digital_human'
  else outputType = 'video'

  const submitModelValue = String(currentModel.id || '').trim()
  const hasAtReferences = referencedFiles.value.length > 0

  let allInputFiles
  if (hasAtReferences) {
    allInputFiles = referencedFiles.value.map(ref => ({
      type: ref.type, url: ref.url, purpose: 'reference', object_id: ref.object_id || String(ref.sourceId || '')
    }))
  } else {
    allInputFiles = [...uploadedFiles.value]
  }

  let feature = selectedFeature.value || 'text_to_video'
  if (!feature || feature === '') {
    if (outputType === 'image') feature = allInputFiles.length > 0 ? 'image_reference' : 'text_to_image'
    else if (outputType === 'digital_human') feature = 'digital_human'
    else feature = allInputFiles.length === 0 ? 'text_to_video' : allInputFiles.length === 1 ? 'global_reference' : 'multi_reference'
  }
  if (outputType === 'video' && allInputFiles.length >= 2) feature = 'multi_reference'

  let finalPrompt = String(prompt.value || '').trim()
  if (referencedFiles.value.length > 0 && finalPrompt.includes('@')) {
    const tagToObjectId = {}
    for (const ref of referencedFiles.value) {
      const tag = String(ref.atTag || '')
      const oid = String(ref.object_id || '')
      if (tag && oid) tagToObjectId[tag] = `<<<${oid}>>>`
    }
    finalPrompt = finalPrompt.replace(/@\S+/g, (match) => tagToObjectId[match] || match)
  }

  const request = {
    output_type: String(outputType || 'image'),
    model: String(submitModelValue || ''),
    vendor: String(currentModel.vendor || currentModel?.vendor || 'vendor_a'),
    feature: String(feature || 'text_to_video'),
    parameters: {},
    prompt: finalPrompt,
    input_files: allInputFiles.map((f) => ({
      type: String(f.type || 'image'), url: String(f.url || ''),
      purpose: String(f.purpose || 'reference'),
      object_id: String(f.object_id || `file_${f.type}_${Math.random().toString(36).slice(2, 6)}`)
    }))
  }

  if (outputType === 'image') request.parameters = { resolution: params.resolution, ratio: params.ratio, count: 1 }
  else if (outputType === 'video') request.parameters = { resolution: params.resolution, duration: videoDuration.value, ratio: params.ratio, sound: videoSoundEnabled.value }
  else if (outputType === 'digital_human') request.parameters = { voice_id: currentModel.id || '', action_description: '' }

  if (request.vendor === 'vendor_b' && allInputFiles.length > 0) {
    request.input = { media: allInputFiles.map((file, index) => ({ type: String(file.type || 'image'), url: String(file.url || ''), purpose: String(file.purpose || 'reference'), object_id: String(file.object_id || `media_${index + 1}`) })) }
  }
  return request
}

async function postJson(url, data, timeoutMs = 120000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken()}` },
      body: JSON.stringify(data),
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    return await response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') throw new Error('请求超时，请稍后重试')
    throw error
  }
}

function extractResultFromData(data) {
  if (!data || data.code !== 200) throw new Error(data?.message || '生成失败')
  const resultData = data.data
  if (!resultData) throw new Error('未获取到结果数据')
  const taskInfo = { taskId: resultData.task_id, type: resultData.type, status: resultData.status, progress: resultData.progress }
  let results = []

  // 尝试从多种可能的响应结构中提取结果
  const r = resultData.result || resultData.results || resultData.output || resultData.data || resultData

  // 图片结果：支持 images 数组、image 单个对象、image_url 字符串
  if (r.images && Array.isArray(r.images)) {
    r.images.forEach(img => {
      if (typeof img === 'string') results.push({ type: 'image', url: img, id: `img_${results.length}` })
      else if (img.url) results.push({ type: 'image', url: img.url, id: img.id || `img_${results.length}` })
    })
  }
  if (r.image && !r.images) {
    if (typeof r.image === 'string') results.push({ type: 'image', url: r.image, id: 'img_0' })
    else if (r.image.url) results.push({ type: 'image', url: r.image.url, id: r.image.id || 'img_0' })
  }
  if (r.image_url && results.length === 0) {
    const urls = Array.isArray(r.image_url) ? r.image_url : [r.image_url]
    urls.forEach((u, i) => { if (typeof u === 'string') results.push({ type: 'image', url: u, id: `img_${i}` }) })
  }

  // 视频结果
  if (r.video) {
    const v = r.video
    results.push({ type: 'video', url: v.url || v.video_url || '', id: v.id || taskInfo.taskId, thumbnail: v.thumbnail || v.cover_url || '' })
  }
  if (r.video_url && !r.video) {
    results.push({ type: 'video', url: r.video_url, id: taskInfo.taskId })
  }
  if (r.videos && Array.isArray(r.videos)) {
    r.videos.forEach((v, i) => {
      const url = typeof v === 'string' ? v : (v.url || v.video_url || '')
      if (url) results.push({ type: 'video', url, id: v.id || `vid_${i}`, thumbnail: v.thumbnail || v.cover_url || '' })
    })
  }

  // 通用 URL 列表（不确定类型时按 output_type 判断）
  if (results.length === 0 && r.urls && Array.isArray(r.urls)) {
    const defaultType = resultData.output_type || resultData.type || 'image'
    r.urls.forEach((u, i) => {
      if (typeof u === 'string') results.push({ type: defaultType === 'video' ? 'video' : 'image', url: u, id: `res_${i}` })
    })
  }

  // 最终兜底：如果 resultData 本身就是 URL 或包含 url 字段
  if (results.length === 0 && typeof r === 'string' && (r.startsWith('http') || r.startsWith('blob:'))) {
    results.push({ type: resultData.output_type === 'video' ? 'video' : 'image', url: r, id: taskInfo.taskId })
  }
  if (results.length === 0 && r.url && typeof r.url === 'string') {
    results.push({ type: resultData.output_type === 'video' ? 'video' : 'image', url: r.url, id: r.id || taskInfo.taskId })
  }

  console.log('🔍 提取结果:', { resultsCount: results.length, results })
  return { ...taskInfo, results }
}

async function processVideoResults(card) {
  for (const result of card.results) {
    if (result.type === 'video' && result.url && result.url.includes('neolink.com')) {
      card.loadingVideo = true
      try { const blobUrl = await fetchProtectedVideo(result.url); result.displayUrl = blobUrl }
      catch (error) { result.displayUrl = result.url }
      finally { card.loadingVideo = false }
    }
  }
}

function onVideoLoaded(card) {}

async function fetchProtectedVideo(url) {
  const response = await fetch(url, { headers: { 'Authorization': `Bearer ${getAuthToken()}` } })
  const blob = await response.blob()
  return URL.createObjectURL(blob)
}

function convertBase64ToBlobUrl(base64Data) {
  if (!base64Data) return ''
  if (base64Data.startsWith('blob:')) return base64Data
  if (base64Data.startsWith('http') || base64Data.startsWith('//')) return base64Data
  try {
    const byteCharacters = atob(base64Data.split(',')[1] || base64Data)
    const byteArray = new Uint8Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) byteArray[i] = byteCharacters.charCodeAt(i)
    const blob = new Blob([byteArray], { type: 'image/png' })
    return URL.createObjectURL(blob)
  } catch { return base64Data }
}

async function handleGenerate() {
  if (!canGenerate.value || isGenerating.value) return
  if (!selectedModel.value) { showToast('请先选择模型', 'warning'); return }

  const currentModel = models.value.find(m => m.id === selectedModel.value)
  if (currentModel && currentModel.vendor === 'vendor_b') {
    const modelId = (currentModel.id || currentModel.name || '').toLowerCase()
    const modelName = (currentModel.name || '').toLowerCase()
    const isI2VModel = modelId.includes('i2v') || modelName.includes('image.to.video')
    if (isI2VModel && uploadedFiles.value.length === 0 && referencedFiles.value.length === 0) {
      showToast('I2V（图生视频）模型需要上传参考图片', 'warning'); return
    }
  }

  isGenerating.value = true
  hasInteracted.value = true

  try {
    let requestBody = buildGenerateRequest()
    requestBody = JSON.parse(JSON.stringify(requestBody))

    const totalSize = JSON.stringify(requestBody).length
    const timeoutMs = 360000
    console.log(`📤 发送生成请求... (大小: ${(totalSize / 1024).toFixed(1)}KB, 超时: ${timeoutMs / 1000}s)`)
    console.log('📤 请求参数:', { output_type: requestBody.output_type, model: requestBody.model, feature: requestBody.feature, prompt_len: requestBody.prompt?.length, files: requestBody.input_files?.length })

    const response = await postJson(`${API_CONFIG.BASE_URL}/generate?sync=true`, requestBody, timeoutMs)

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

    // 追加到当前对话（同一对话内持续追加，不点新对话就不换）
    let convId = activeConversationId.value
    if (!convId) {
      // 新对话：先尝试从 API 创建
      const apiConv = await createConversationAPI(newCard)
      convId = apiConv?.id || `conv_${Date.now()}`
      activeConversationId.value = convId
      conversationHistory.value.unshift({
        id: convId,
        title: newCard.title,
        thumbnail: newCard.results?.[0]?.url || '',
        type: selectedType.value,
        time: Date.now(),
        cards: [newCard]
      })
    } else {
      const conv = conversationHistory.value.find(c => c.id === convId)
      if (conv) {
        conv.cards.push(newCard)
        conv.title = newCard.title
        conv.thumbnail = newCard.results?.[0]?.url || conv.thumbnail
        conv.time = Date.now()
      }
      // 同步追加到后端
      await appendCardToConversationAPI(convId, newCard)
    }
    console.log('💳 已添加结果卡片, 当前对话卡片数:', generatedCards.value.length)

    saveConversationsToLocal()

    if (newCard.results.some(r => r.type === 'video')) await processVideoResults(newCard)

    prompt.value = ''
    if (promptEditorRef.value) promptEditorRef.value.innerHTML = ''
    if (promptEditorRefBottom.value) promptEditorRefBottom.value.innerHTML = ''
    uploadedFiles.value = []
    referencedFiles.value = []
    atTags.value = []
    activeAtTagId.value = null
    atImageCounter = 0
    atVideoCounter = 0
    selectedFeature.value = ''

    scrollToCanvasBottom()
    nextTick(() => { if (window.lucide) lucide.createIcons() })
  } catch (error) {
    console.error('❌ 生成失败:', error)
    showToast(`生成失败: ${error.message}`, 'error')
  } finally {
    isGenerating.value = false
  }
}

function scrollToCanvasBottom() {
  const el = canvasContainer.value
  if (el) { el.scrollTop = el.scrollHeight }
}

function useAsInput(result) {
  addFileFromHistory({ type: result.type, url: result.displayUrl || result.url, name: `生成结果_${Date.now()}` })
}

// ========== 下载/保存结果 ==========
function downloadResult(result, idx) {
  const url = result.displayUrl || result.url
  if (!url) return
  const link = document.createElement('a')
  link.href = url
  link.download = `generate_${Date.now()}_${idx + 1}.${result.type === 'video' ? 'mp4' : 'png'}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// ========== 文件历史管理 ==========
const fileHistory = ref([])

function addFileFromHistory(file) {
  fileHistory.value.push(file)
  uploadedFiles.value.push({
    type: file.type,
    url: file.url,
    purpose: 'reference',
    object_id: `${file.type}_${uploadedFiles.value.length + 1}`,
    name: file.name || `文件_${Date.now()}`
  })
}

// ========== 移除引用素材（区别于removeAtTag）==========
function removeReferencedFile(atId) {
  // 从引用列表中移除
  referencedFiles.value = referencedFiles.value.filter(r => r.atId !== atId)
  // 从编辑器中移除对应的@标签DOM
  const editor = promptEditorRef.value || promptEditorRefBottom.value
  if (editor) {
    const tagEl = editor.querySelector(`[data-at-id="${atId}"]`)
    if (tagEl) tagEl.remove()
  }
  atTags.value = atTags.value.filter(t => t !== atId)
  if (activeAtTagId.value === atId) activeAtTagId.value = null
  nextTick(() => { if (window.lucide) lucide.createIcons() })
}

// ========== Toast 提示 ==========
const toastVisible = ref(false)
const toastMessage = ref('')
const toastType = ref('info')

function showToast(msg, type = 'info') {
  toastMessage.value = msg
  toastType.value = type
  toastVisible.value = true
  setTimeout(() => { toastVisible.value = false }, 3000)
}

// ========== 获取认证 Token ==========
function getAuthToken() {
  const stored = localStorage.getItem('szg_access_token')
  if (stored) {
    try { return JSON.parse(stored) } catch { return stored }
  }
  return ''
}

// ========== 对话管理 API ==========
async function apiFetch(path, options = {}) {
  const url = `${API_CONFIG.BASE_URL}${path}`
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`,
    ...(options.headers || {})
  }
  try {
    const res = await fetch(url, { ...options, headers })
    const data = await res.json()
    if (data.code !== 200) throw new Error(data.message || '请求失败')
    return data.data
  } catch (e) {
    console.warn(`API ${path} 失败:`, e.message)
    return null
  }
}

async function loadConversationsFromAPI() {
  const data = await apiFetch('/conversations?page=1&page_size=50')
  if (!data || !data.items) return false
  // API 返回空列表时，不覆盖本地已有数据
  if (data.items.length === 0 && conversationHistory.value.length > 0) return true
  conversationHistory.value = data.items.map(c => ({
    id: c.id,
    title: c.title,
    type: c.type,
    thumbnail: c.thumbnail || '',
    time: new Date(c.updated_at || c.created_at).getTime(),
    cards: []  // 详情在切换时按需加载
  }))
  return true
}

async function loadConversationDetail(id) {
  const data = await apiFetch(`/conversations/${id}`)
  if (!data) return false
  const conv = conversationHistory.value.find(c => c.id === id)
  if (conv) {
    conv.cards = (data.cards || []).map(card => ({
      id: card.id,
      title: card.title,
      prompt: card.prompt,
      type: card.type,
      model: card.model,
      taskId: card.task_id,
      results: card.results || [],
      status: card.status || 'completed',
      loadingVideo: false,
      uploadedInputFiles: card.input_files || []
    }))
    conv.title = data.title
    conv.thumbnail = data.thumbnail || conv.thumbnail
  }
  return true
}

async function createConversationAPI(card) {
  const data = await apiFetch('/conversations', {
    method: 'POST',
    body: JSON.stringify({ title: card.title, type: card.type })
  })
  return data  // 返回 { id, title, ... } 或 null
}

async function appendCardToConversationAPI(convId, card) {
  const data = await apiFetch(`/conversations/${convId}/cards`, {
    method: 'POST',
    body: JSON.stringify({
      title: card.title,
      prompt: card.prompt,
      type: card.type,
      model: card.model,
      task_id: card.taskId,
      status: card.status,
      results: card.results,
      input_files: card.uploadedInputFiles || []
    })
  })
  return data
}

async function deleteConversationAPI(id) {
  await apiFetch(`/conversations/${id}`, { method: 'DELETE' })
}

// ========== 生命周期 ==========
// hasInteracted 变化时重新初始化 lucide 图标（v-if/v-else 切换导致 DOM 重建）
watch(hasInteracted, () => {
  nextTick(() => { if (window.lucide) lucide.createIcons() })
})

onMounted(async () => {
  // 优先从 API 加载，失败则降级读 localStorage
  const apiOk = await loadConversationsFromAPI()
  if (!apiOk) {
    loadConversationsFromLocal()
  } else {
    // API 成功但 cards 为空，尝试从 localStorage 补充 cards 数据
    try {
      const raw = localStorage.getItem('szg_conversations')
      if (raw) {
        const localData = JSON.parse(raw)
        for (const conv of conversationHistory.value) {
          if (conv.cards.length === 0) {
            const localConv = localData.find(lc => lc.id === conv.id)
            if (localConv?.cards?.length > 0) {
              conv.cards = localConv.cards.map(card => ({ ...card, loadingVideo: false, uploadedInputFiles: card.uploadedInputFiles || [] }))
            }
          }
        }
      }
    } catch (e) { /* ignore */ }
  }
  await initModels()
  document.addEventListener('click', handleGlobalClick)
  if (window.lucide) lucide.createIcons()
})

onUnmounted(() => {
  document.removeEventListener('click', handleGlobalClick)
})

function handleGlobalClick(e) {
  if (!e.target.closest('.option-chip')) {
    closeOtherDropdowns('')
  }
  if (!e.target.closest('.upload-dropdown') && !e.target.closest('.upload-menu')) {
    isUploadDropdownOpen.value = false
  }
}
</script>

<style scoped>
/* ====== 即梦AI风格全局布局 ====== */
.generate-page-jimeng {
  width: 100%;
  height: 100%;
  display: flex;
  background: #f5f7fa;
  overflow: hidden;
}

/* ====== 左侧对话历史侧边栏 ====== */
.jimeng-left-sidebar {
  width: 260px;
  min-width: 260px;
  height: 100%;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 10;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  border-bottom: 1px solid #f3f4f6;
}

.sidebar-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.sidebar-collapse-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: all 0.2s;
}

.sidebar-collapse-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.new-chat-btn {
  margin: 12px 16px;
  padding: 10px 16px;
  border: 1px dashed #d1d5db;
  background: #fafafa;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #4b5563;
  transition: all 0.2s;
}

.new-chat-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  background: #f5f3ff;
}

.recent-section {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px 12px;
}

.recent-label {
  font-size: 11px;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 8px 4px 6px;
}

.conversation-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  position: relative;
}

.conversation-item:hover {
  background: #f9fafb;
  border-color: #e5e7eb;
}

.conversation-item.active {
  background: #f3f0ff;
  border-color: #c4b5fd;
}

.conv-thumb {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  overflow: hidden;
  background: #f3f4f6;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.conv-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.conv-thumb-placeholder {
  color: #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
}

.conv-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.conv-title {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-meta {
  font-size: 10px;
  color: #9ca3af;
}

.conv-delete-btn {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.15s;
}

.conversation-item:hover .conv-delete-btn {
  opacity: 1;
}

.conv-delete-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

.no-conversations {
  text-align: center;
  padding: 24px 0;
  font-size: 13px;
  color: #9ca3af;
}

/* ====== 主内容区域 ====== */
.jimeng-main-area {
  flex: 1;
  height: 100%;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* ====== 欢迎页（未交互状态）===== */
.jimeng-welcome {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  overflow-y: auto;
  position: relative;
}

.page-asset-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 8px;
  background: linear-gradient(135deg, #eef2ff, #e0e7ff);
  color: #4338ca;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
}

.page-asset-btn:hover {
  background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
}

.jimeng-interaction .page-asset-btn {
  position: absolute;
  top: 12px;
  right: 12px;
}

.welcome-title {
  font-size: 26px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 32px;
  letter-spacing: -0.5px;
}

/* ====== 输入卡片（通用）===== */
.input-card {
  width: 100%;
  max-width: 800px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
  overflow: visible;
  transition: box-shadow 0.3s;
}

.input-card:focus-within {
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
  border-color: #93c5fd;
}

.input-card-body {
  display: flex;
  align-items: flex-start;
  padding: 16px 16px 8px;
  gap: 12px;
}

.upload-zone {
  width: 48px;
  height: 48px;
  min-height: 48px;
  border: 2px dashed #d1d5db;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;
  position: relative;
  background: #fafafa;
}

.upload-zone:hover {
  border-color: #3b82f6;
  background: #f5f3ff;
}

.upload-hint {
  position: absolute;
  bottom: -18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 9px;
  color: #9ca3af;
  white-space: nowrap;
}

.prompt-editor-wrapper {
  flex: 1;
  min-height: 48px;
  position: relative;
}

.prompt-input {
  min-height: 48px;
  max-height: 200px;
  outline: none;
  font-size: 14px;
  line-height: 1.6;
  color: #1f2937;
  word-break: break-word;
  overflow-y: auto;
  padding: 4px 0;
}

.prompt-input:empty::before {
  content: attr(placeholder);
  color: #9ca3af;
  pointer-events: none;
}

.prompt-input::-webkit-scrollbar {
  width: 4px;
}

.prompt-input::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 4px;
}

/* ========== @标签内联样式（蓝色芯片，与普通文字明显区分） ========== */
:deep(.at-tag-inline) {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 1px 8px;
  border-radius: 6px;
  background: #3b82f6;
  color: white;
  font-weight: 600;
  font-size: 13px;
  cursor: default;
  vertical-align: middle;
  transition: background 0.15s ease;
  user-select: none;
  flex-shrink: 0;
  line-height: 1.6;
}

:deep(.at-tag-inline:hover) {
  background: #2563eb;
}

/* 蓝色徽章文字 */
:deep(.at-tag-card-badge) {
  pointer-events: none;
}

/* @视频标签：紫色系，区别于@图片的蓝色 */
:deep(.at-tag-inline.at-tag-video) {
  background: #7c3aed;
}

:deep(.at-tag-inline.at-tag-video:hover) {
  background: #6d28d9;
}

/* 右侧关闭按钮（×用伪元素渲染，避免污染innerText） */
:deep(.at-tag-close) {
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  font-size: 10px;
  line-height: 1;
  padding: 0;
  opacity: 0.6;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

:deep(.at-tag-close::before) {
  content: '\00D7';
}

:deep(.at-tag-close:hover) {
  opacity: 1;
  background: rgba(239, 68, 68, 0.85);
  transform: scale(1.15);
}

/* 激活状态（对应右侧引用素材高亮） */
:deep(.at-tag-inline-highlight) {
  animation: atPulse 1s ease-in-out;
}

@keyframes atPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba(59, 130, 246, 0); }
}

/* @视频标签高亮动画（紫色） */
.at-tag-inline-highlight.at-tag-video {
  animation: atPulseVideo 1s ease-in-out;
}

@keyframes atPulseVideo {
  0%, 100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba(124, 58, 237, 0); }
}

/* ========== 上传下拉菜单 ========== */
.upload-dropdown {
  position: relative;
  flex-shrink: 0;
}

.upload-dropdown.open .upload-zone {
  border-color: #3b82f6;
  background: #eff6ff;
}

.upload-dropdown.open .upload-zone i {
  color: #3b82f6;
}

.upload-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  background: white;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.04);
  padding: 6px;
  min-width: 190px;
  z-index: 9999;
}

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

.upload-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 9px 14px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #374151;
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.upload-option:hover {
  background: #f3f4f6;
  color: #111827;
}

/* 媒体素材栏 */
.media-bar {
  padding: 8px 16px 0;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.media-section {
  flex: 1;
  min-width: 200px;
}

.section-label {
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.section-count {
  background: #f3f4f6;
  color: #6b7280;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
}

.media-items-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.media-item {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
  background: #f9fafb;
}

.media-item:hover {
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.preview-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.audio-preview {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #9ca3af;
  font-size: 9px;
}

.remove-file-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 18px;
  height: 18px;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 5;
}

.media-item:hover .remove-file-btn {
  opacity: 1;
}

.file-type-badge {
  position: absolute;
  bottom: 2px;
  left: 2px;
  font-size: 8px;
  padding: 1px 4px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
}

.drag-hint-overlay {
  position: absolute;
  inset: 0;
  background: rgba(139, 92, 246, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 9px;
  opacity: 0;
  transition: opacity 0.2s;
  gap: 2px;
  pointer-events: none;
}

.media-item:hover .drag-hint-overlay {
  opacity: 1;
}

.ref-item.active {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
}

.ref-at-badge {
  position: absolute;
  top: 4px;
  left: 4px;
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 4px;
  background: #3b82f6;
  color: white;
  font-weight: 600;
}

/* @视频引用标签：紫色 */
.ref-item.type-video .ref-at-badge {
  background: #7c3aed;
}

.ref-item.type-video.active {
  border-color: #7c3aed;
  box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2);
}

.remove-ref-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  border: none;
  background: rgba(239, 68, 68, 0.9);
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.ref-item:hover .remove-ref-btn {
  opacity: 1;
}

.media-bar-divider {
  width: 1px;
  background: #e5e7eb;
  margin: 4px 0;
}

/* 底部操作栏 */
.input-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px 14px;
  border-top: 1px solid #f3f4f6;
  gap: 12px;
}

.footer-options {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  flex: 1;
}

.option-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 20px;
  font-size: 12px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.option-chip:hover {
  border-color: #c4b5fd;
  background: #faf5ff;
  color: #2563eb;
}

.option-chip.open {
  border-color: #3b82f6;
  background: #f5f3ff;
  color: #2563eb;
}

.option-chip.sound-chip.active {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #2563eb;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.char-count-mini {
  font-size: 11px;
  color: #9ca3af;
}

.send-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-radius: 10px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.35);
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 14px rgba(139, 92, 246, 0.45);
}

.send-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  box-shadow: none;
}

/* 下拉菜单通用样式 */
.select-dropdown {
  position: fixed;
  z-index: 9999;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 6px;
  min-width: 180px;
  max-height: 280px;
  overflow-y: auto;
}

.select-option {
  padding: 9px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #374151;
  transition: all 0.15s;
  display: flex;
  align-items: center;
}

.select-option:hover {
  background: #f3f4f6;
}

.select-option.active {
  background: #f5f3ff;
  color: #2563eb;
  font-weight: 500;
}

.model-option-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.model-name {
  display: flex;
  align-items: center;
  gap: 6px;
}

.default-badge {
  font-size: 9px;
  padding: 1px 5px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border-radius: 4px;
  font-weight: 500;
}

.model-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.input-type-tag,
.vendor-tag,
.new-tag,
.vip-tag {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: 500;
}

.input-type-tag.image { background: #dbeafe; color: #2563eb; }
.input-type-tag.text { background: #dcfce7; color: #16a34a; }
.vendor-tag { background: #fef3c7; color: #d97706; }
.new-tag { background: #fee2e2; color: #dc2626; }
.vip-tag { background: #eff6ff; color: #2563eb; }

/* @提及下拉列表 */
.at-mention-dropdown {
  position: fixed;
  z-index: 10000;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  padding: 8px;
  min-width: 260px;
  max-height: 300px;
  overflow-y: auto;
}

.at-mention-header {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  padding: 4px 8px 8px;
  border-bottom: 1px solid #f3f4f6;
  margin-bottom: 4px;
}

.at-mention-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.at-mention-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.at-mention-item:hover,
.at-mention-item.active {
  background: #f3f4f6;
}

.mention-thumb-wrap {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.mention-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.audio-thumb {
  width: 100%;
  height: 100%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}

.mention-type-icon {
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 8px;
  background: rgba(0, 0, 0, 0.55);
  color: white;
  padding: 1px 3px;
  border-radius: 3px;
}

.mention-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mention-name {
  font-size: 13px;
  color: #1f2937;
  font-weight: 500;
}

.mention-type-label {
  font-size: 11px;
  color: #9ca3af;
}

.at-mention-empty {
  text-align: center;
  padding: 20px;
  font-size: 13px;
  color: #9ca3af;
}

/* ====== 已交互状态：结果展示区域 ====== */
.jimeng-interaction {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.interaction-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.topbar-context {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;
}

.context-title {
  font-weight: 600;
  color: #1f2937;
}

.context-sep {
  color: #d1d5db;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.topbar-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 6px;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.topbar-action-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.results-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  scroll-behavior: smooth;
  min-height: 0;
}

.results-area::-webkit-scrollbar {
  width: 5px;
}

.results-area::-webkit-scrollbar-track {
  background: transparent;
}

.results-area::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 10px;
}

/* 结果卡片 */
.result-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.result-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #f3f4f6;
}

.result-prompt-text {
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
  flex: 1;
  margin-right: 16px;
}

.result-actions {
  display: flex;
  gap: 6px;
}

.result-action-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: all 0.2s;
}

.result-action-btn:hover {
  background: #f3f4f6;
  color: #374151;
  border-color: #d1d5db;
}

.result-card-body {
  padding: 18px;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}

.result-image-item {
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  transition: all 0.25s;
}

.result-image-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: #c4b5fd;
}

.result-image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
}

.video-wrapper video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: white;
  border-radius: 12px;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #9ca3af;
}

.empty-state i {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 14px;
}

/* 底部输入卡片（交互后） */
.input-card-bottom {
  flex-shrink: 0;
  margin: 0 auto 20px;
  max-width: 680px;
  width: 90%;
  position: relative;
  z-index: 10;
}

/* 结果卡片组 */
.result-card-group {
  margin-bottom: 24px;
}

.result-grid-item {
  position: relative;
}

.result-media-wrap {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 1;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  transition: all 0.25s;
}

.result-media-wrap:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: #c4b5fd;
}

.result-img,
.result-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.result-video {
  object-fit: contain;
  background: #000;
}

.video-loading-overlay {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 12px;
}

.spinner-small {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.result-hover-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 6px;
  opacity: 0;
  transform: translateY(-4px);
  transition: all 0.2s;
}

.result-media-wrap:hover .result-hover-actions {
  opacity: 1;
  transform: translateY(0);
}

.card-placeholder-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px;
  background: #f9fafb;
  border-radius: 12px;
  color: #9ca3af;
  font-size: 14px;
}

.result-actions-row {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #f3f4f6;
}

.result-action-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  border-radius: 20px;
  font-size: 13px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
}

.result-action-chip:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #1f2937;
}

.results-empty {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
}

.results-empty p {
  margin-top: 12px;
  font-size: 14px;
}

.generating-indicator-full {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 80px 20px;
  color: #6b7280;
}

.spinner-large {
  width: 44px;
  height: 44px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* ====== 响应式适配 ====== */
@media (max-width: 1024px) {
  .jimeng-left-sidebar {
    width: 220px;
    min-width: 220px;
  }
  
  .result-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .jimeng-left-sidebar {
    display: none;
  }
  
  .welcome-title {
    font-size: 22px;
  }
  
  .input-card {
    border-radius: 12px;
  }
  
  .footer-options {
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 4px;
  }
  
  .result-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
}
</style>