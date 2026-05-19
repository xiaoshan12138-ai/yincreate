<template>
  <AppLayout>
    <div class="tools-page">
      <!-- 标签页导航 -->
      <div class="tools-tab-bar">
        <div class="tabs-nav">
          <button
            v-for="tab in tabs"
            :key="tab"
            :class="['tool-tab', { active: activeTab === tab }]"
            @click="selectTab(tab)"
          >
            {{ tab }}
          </button>
        </div>
        <button class="my-favorites-btn">
          <i data-lucide="star" style="width: 14px; height: 14px;"></i>
          我的收藏
        </button>
      </div>

      <!-- 工具分类列表 -->
      <template v-for="(category, catIdx) in toolCategories" :key="catIdx">
        <h3 v-if="shouldShowCategory(category)" class="tool-category-title">{{ category.title }}</h3>
        <div v-if="shouldShowCategory(category)" class="tools-grid">
          <div v-for="(tool, toolIdx) in category.tools" :key="toolIdx" class="tool-card">
            <div class="tool-card-main">
              <div class="tool-icon-wrap" :style="{ background: tool.color + '12', color: tool.color }">
                <i :data-lucide="tool.icon" style="width: 24px; height: 24px;"></i>
              </div>
              <div class="tool-info">
                <span class="tool-name">{{ tool.name }}</span>
                <span class="tool-desc">{{ tool.desc }}</span>
              </div>
            </div>
            <button class="tool-fav-btn">
              <i data-lucide="star" style="width: 15px; height: 15px;"></i>
            </button>
          </div>
        </div>
      </template>

      <!-- 收起/展开 -->
      <div v-if="!collapsed" class="collapse-tools-row">
        <button class="collapse-tools-btn" @click="toggleCollapse">
          收起更多工具
          <i data-lucide="chevron-up" style="width: 14px; height: 14px;"></i>
        </button>
      </div>
      <div v-else class="collapse-tools-row">
        <button class="collapse-tools-btn" @click="toggleCollapse">
          展开更多工具
          <i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>
        </button>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'

const activeTab = ref('全部')
const tabs = ['全部', '视频处理', '音频处理', '图片处理', '实用工具', 'AI 工具']
const collapsed = ref(false)

const toolCategories = [
  {
    title: '视频处理',
    tools: [
      { name: '视频剪辑', desc: '精准剪辑，轻松分割视频片段', icon: 'scissors', color: '#6366f1' },
      { name: '视频拼接', desc: '多段视频合并，流畅自然', icon: 'image', color: '#ec4899' },
      { name: '画面裁剪', desc: '自由裁剪画面尺寸与比例', icon: 'crop', color: '#06b6d4' },
      { name: '视频调色', desc: '专业调色，提升画面质感', icon: 'palette', color: '#8b5cf6' },
      { name: '添加字幕', desc: '智能识别，快速添加字幕', icon: 'type', color: '#3b82f6' },
      { name: '去水印', desc: '智能去除水印与文字', icon: 'droplet', color: '#06b6d4' },
      { name: '视频转音频', desc: '提取视频中的音频文件', icon: 'audio-waveform', color: '#10b981' },
      { name: '格式转换', desc: '支持多种视频格式互转', icon: 'arrow-left-right', color: '#8b5cf6' },
      { name: '视频压缩', desc: '高效压缩，减小文件体积', icon: 'file-down', color: '#3b82f6' },
      { name: '视频倒数', desc: '一键倒放，创意无限', icon: 'clock', color: '#ef4444' }
    ]
  },
  {
    title: '音频处理',
    tools: [
      { name: '音频提取', desc: '从视频中提取音频文件', icon: 'file-audio', color: '#ec4899' },
      { name: '音频降噪', desc: '去除噪音音质，提升音质', icon: 'activity', color: '#8b5cf6' },
      { name: '音频剪辑', desc: '裁剪音频片段，精确到秒', icon: 'scissors', color: '#ef4444' },
      { name: '音量调整', desc: '自由调整各音频大小', icon: 'volume-2', color: '#3b82f6' },
      { name: '音频变声', desc: '多种声音效果，趣味十足', icon: 'mic-2', color: '#10b981' },
      { name: '背景音乐', desc: '海量音乐素材，免费下载', icon: 'music', color: '#10b981' }
    ]
  },
  {
    title: '图片处理',
    tools: [
      { name: '图片编辑', desc: '图片裁剪、滤镜、调色等', icon: 'image-plus', color: '#3b82f6' },
      { name: '图片抠图', desc: '智能抠图，快速去除背景', icon: 'user', color: '#ec4899' },
      { name: '图片转视频', desc: '将多张图片生成视频', icon: 'film', color: '#f59e0b' },
      { name: '图片压缩', desc: '压缩图片大小，不失画质', icon: 'file-down', color: '#3b82f6' },
      { name: '格式转换', desc: '支持多种图片格式互转', icon: 'arrow-left-right', color: '#10b981' }
    ]
  },
  {
    title: '实用工具',
    tools: [
      { name: '视频水印', desc: '透文字或图片水印', icon: 'user', color: '#3b82f6' },
      { name: 'GIF 制作', desc: '视频转GIF，快速生成动图', icon: 'gif', color: '#10b981' },
      { name: '二维码生成', desc: '生成专属二维码', icon: 'qr-code', color: '#8b5cf6' },
      { name: '视频截图', desc: '一键截取，保存精彩画面', icon: 'image', color: '#f59e0b' },
      { name: '时间码生成', desc: '生成标准时间码', icon: 'clock', color: '#3b82f6' }
    ]
  },
  {
    title: 'AI 工具',
    tools: [
      { name: 'AI 智能字幕', desc: '自动识别并生成字幕', icon: 'sparkles', color: '#3b82f6' },
      { name: 'AI 数字人', desc: '数字人播报，逼真自然', icon: 'clock', color: '#ec4899' },
      { name: 'AI 智能配音', desc: '多种音色，文本转语音', icon: 'mic-2', color: '#10b981' },
      { name: 'AI 智能扩图', desc: '智能扩展图片边界', icon: 'expand', color: '#8b5cf6' },
      { name: 'AI 视频增强', desc: '提升画质，增强细节', icon: 'monitor-play', color: '#f97316' }
    ]
  }
]

function selectTab(tab) {
  activeTab.value = tab
}

function toggleCollapse() {
  collapsed.value = !collapsed.value
}

function shouldShowCategory(category) {
  if (activeTab.value === '全部') return true
  return category.title.includes(activeTab.value.replace(' ', ''))
}

onMounted(() => {
  setTimeout(() => {
    if (window.lucide) lucide.createIcons()
  }, 100)
})
</script>

<style scoped>
.tools-page {
  max-width: none;
  width: 100%;
}

.tools-tab-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
  margin-bottom: 28px;
  border-bottom: 1px solid #e5e7eb;
}

.tabs-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-tab {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
  position: relative;
}

.tool-tab:hover {
  color: #373151;
  background: #f9fafb;
}

.tool-tab.active {
  color: #3b82f6;
  font-weight: 600;
  background: #eff6ff;
}

.my-favorites-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #373151;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.my-favorites-btn:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.my-favorites-btn i {
  color: #9ca3af;
}

.tool-category-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin: 28px 0 18px 0;
  padding-left: 2px;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 8px;
}

.tool-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.tool-card:hover {
  border-color: #c7d2fe;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.1);
  transform: translateY(-2px);
}

.tool-card-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.tool-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.tool-card:hover .tool-icon-wrap {
  transform: scale(1.08);
}

.tool-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.tool-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tool-desc {
  font-size: 12px;
  color: #9ca3af;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.tool-fav-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: #d1d5db;
  flex-shrink: 0;
  transition: all 0.25s ease;
  margin-left: 4px;
}

.tool-fav-btn:hover {
  color: #fbbf24;
  background: #fefce8;
}

.collapse-tools-row {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding-top: 20px;
}

.collapse-tools-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 24px;
  font-size: 13px;
  font-weight: 500;
  color: #3b82f6;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.collapse-tools-btn:hover {
  background: #eff6ff;
}

@media (max-width: 1200px) {
  .tools-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 900px) {
  .tools-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 700px) {
  .tools-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
