<template>
  <AppLayout>
    <!-- 资产管理页面主容器 -->
    <div class="assets-page">
      <!-- 顶部标签栏导航 + 存储空间信息 -->
      <div class="assets-tab-bar">
        <div class="tabs-nav">
          <button
            v-for="tab in tabs"
            :key="tab"
            :class="['asset-tab', { active: activeTab === tab }]"
            @click="activeTab = tab"
          >
            {{ tab }}
          </button>
        </div>
        <div class="storage-info-inline">
          <span class="storage-label-text">存储空间:</span>
          <span class="storage-value-bold">{{ storageUsed }} / {{ storageTotal }}</span>
          <a href="#" class="upgrade-link">升级空间</a>
        </div>
      </div>

      <!-- 操作工具栏 - 文件夹选择、上传、搜索、视图切换 -->
      <div class="assets-toolbar">
        <div class="toolbar-left">
          <select class="folder-select">
            <option>所有文件夹</option>
            <option>我的模板</option>
            <option>我的草稿</option>
            <option>我的素材</option>
            <option>项目文件</option>
          </select>
          <button class="upload-btn-primary">
            <i data-lucide="upload" style="width: 16px; height: 16px;"></i>
            上传
          </button>
        </div>
        <div class="toolbar-right">
          <div class="search-assets-wrap">
            <i data-lucide="search" style="width: 15px; height: 15px; color: #9ca3af;"></i>
            <input type="text" placeholder="搜索我的资产" class="search-assets-input">
          </div>
          <div class="view-toggle-group">
            <button
              :class="['view-toggle-btn', { active: activeView === 'grid' }]"
              @click="activeView = 'grid'"
            >
              <i data-lucide="layout-grid" style="width: 17px; height: 17px;"></i>
            </button>
            <button
              :class="['view-toggle-btn', { active: activeView === 'list' }]"
              @click="activeView = 'list'"
            >
              <i data-lucide="list" style="width: 17px; height: 17px;"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 文件夹卡片区域 - 我的模板、草稿、素材等 -->
      <div class="folders-row">
        <div
          v-for="(folder, idx) in folders"
          :key="idx"
          :class="['folder-card', { 'trash-folder': idx === 4 }]"
        >
          <div
            class="folder-card-icon"
            :style="{ background: idx === 4 ? '#fef2f2' : '#eff6ff', color: idx === 4 ? '#ef4444' : '#3b82f6' }"
          >
            <i :data-lucide="folder.icon" style="width: 28px; height: 28px;"></i>
          </div>
          <div class="folder-card-info">
            <span class="folder-card-name">{{ folder.name }}</span>
            <span class="folder-card-count">{{ folder.count }} 项</span>
          </div>
        </div>
      </div>

      <!-- 最近文件标题 -->
      <h3 class="recent-files-title">最近文件</h3>

      <!-- 文件网格 -->
      <div class="files-grid">
        <div v-for="(file, idx) in recentFiles" :key="idx" :class="['file-card', 'file-' + file.type]">
          <div v-if="file.thumbnail" class="file-thumb">
            <img :src="file.thumbnail" :alt="file.name" @error="handleImageError">
            <div v-if="file.duration" class="file-duration-badge">{{ file.duration }}</div>
            <div v-if="file.type === 'video'" class="file-type-badge-video">
              <i data-lucide="play-circle" style="width: 12px; height: 12px;"></i>
            </div>
          </div>
          <div v-else class="file-thumb-placeholder" :class="'placeholder-' + file.type">
            <div v-if="file.type === 'audio'" class="placeholder-audio-content">
              <i data-lucide="music" style="width: 28px; height: 28px; color: white;"></i>
              <span v-if="file.duration" class="audio-duration-sm">{{ file.duration }}</span>
            </div>
            <div v-else-if="file.type === 'template'" class="placeholder-template-content">
              <span class="template-tag">模板</span>
              <img
                v-if="idx === 7"
                src="https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=120&h=80&fit=crop"
                alt=""
                class="template-preview-img"
                @error="handleImageError"
              >
              <img
                v-else-if="idx === 8"
                src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=120&h=80&fit=crop"
                alt=""
                class="template-preview-img"
                @error="handleImageError"
              >
            </div>
            <div v-else-if="file.type === 'project'" class="placeholder-project-content">
              <i v-if="file.name.includes('.aep')" style="font-size: 24px; font-weight: 800; color: #2563eb;">Ae</i>
              <i v-else style="font-size: 24px; font-weight: 800; color: #7e22ce;">Pr</i>
            </div>
          </div>
          <div class="file-info">
            <h4 class="file-name">{{ file.name }}</h4>
            <p class="file-meta">{{ file.date }}</p>
            <p class="file-size">{{ file.size }}</p>
          </div>
        </div>

        <!-- 上传文件卡片 -->
        <div class="file-card file-upload">
          <div class="upload-placeholder">
            <i data-lucide="plus" style="width: 28px; height: 28px; color: #9ca3af;"></i>
            <span class="upload-text">上传文件</span>
          </div>
        </div>
      </div>

      <!-- 分页器 -->
      <div class="pagination">
        <button class="page-btn page-arrow">
          <i data-lucide="chevron-left" style="width: 16px; height: 16px;"></i>
        </button>
        <button class="page-btn page-num active">1</button>
        <button class="page-btn page-num">2</button>
        <button class="page-btn page-num">3</button>
        <button class="page-btn page-num">4</button>
        <button class="page-btn page-num">5</button>
        <span class="page-dots">...</span>
        <button class="page-btn page-num">20</button>
        <button class="page-btn page-arrow">
          <i data-lucide="chevron-right" style="width: 16px; height: 16px;"></i>
        </button>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'

const activeTab = ref('全部')
const activeView = ref('grid')
const storageUsed = ref('23.6GB')
const storageTotal = ref('100GB')
const tabs = ['全部', '视频', '模板', '素材', '草稿箱', '收藏夹']

const folders = [
  { name: '我的模板', count: 128, icon: 'folder' },
  { name: '我的草稿', count: 36, icon: 'folder' },
  { name: '我的素材', count: 259, icon: 'folder' },
  { name: '项目文件', count: 19, icon: 'folder' },
  { name: '回收站', count: 12, icon: 'trash-2' }
]

const recentFiles = [
  { name: '产品宣传片', type: 'video', size: '128MB', date: '2024-05-16 11:20', thumbnail: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=300&h=200&fit=crop', duration: '02:35' },
  { name: '旅行Vlog', type: 'video', size: '86MB', date: '2024-05-15 09:15', thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop', duration: '01:45' },
  { name: '企业宣传片', type: 'video', size: '152MB', date: '2024-05-14 18:45', thumbnail: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=300&h=200&fit=crop', duration: '00:59' },
  { name: '节日祝福视频', type: 'video', size: '94MB', date: '2024-05-13 10:20', thumbnail: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=300&h=200&fit=crop', duration: '02:10' },
  { name: '毕业纪念视频', type: 'video', size: '112MB', date: '2024-05-12 16:30', thumbnail: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=300&h=200&fit=crop', duration: '01:30' },
  { name: '自然风光延时摄影', type: 'video', size: '96MB', date: '2024-05-11 11:40', thumbnail: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=300&h=200&fit=crop', duration: '03:15' },
  { name: '背景音乐-轻快', type: 'audio', size: '8.6MB', date: '2024-05-10 14:30', thumbnail: '', duration: '03:45' },
  { name: '简约企业介绍模板', type: 'template', size: '32MB', date: '2024-05-09 17:20', thumbnail: '' },
  { name: '科技发布会片头模板', type: 'template', size: '24MB', date: '2024-05-08 10:30', thumbnail: '' },
  { name: '片头动画.aep', type: 'project', size: '18.7MB', date: '2024-05-07 09:15', thumbnail: '' },
  { name: '项目工程文件.prproj', type: 'project', size: '56.3MB', date: '2024-05-06 16:40', thumbnail: '' }
]

function handleImageError(e) {
  e.target.style.display = 'none'
}

onMounted(() => {
  if (window.lucide) lucide.createIcons()
})
</script>

<style scoped>
/* 资产页面样式 - 基于原始 assets.css */
.assets-page {
  display: flex;
  flex-direction: column;
}

/* 标签页导航栏 */
.assets-tab-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  gap: 16px;
}

.tabs-nav {
  display: flex;
  gap: 4px;
}

.asset-tab {
  padding: 9px 18px;
  background: transparent;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
}

.asset-tab:hover {
  color: #3b82f6;
}

.asset-tab.active {
  color: #3b82f6;
  font-weight: 700;
}

.asset-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 2.5px;
  background: #3b82f6;
  border-radius: 2px;
}

.storage-info-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  white-space: nowrap;
}

.storage-label-text {
  color: #9ca3af;
}

.storage-value-bold {
  font-weight: 700;
  color: #111827;
}

.upgrade-link {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 600;
  margin-left: 4px;
}

/* 操作工具栏 */
.assets-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 22px;
  gap: 16px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.folder-select {
  padding: 9px 32px 9px 14px;
  background: white;
  border: 1.5px solid rgba(229, 231, 235, 0.7);
  border-radius: 10px;
  font-size: 13px;
  color: #111827;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
}

.upload-btn-primary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 20px;
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}

.upload-btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-assets-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: white;
  border: 1.5px solid rgba(229, 231, 235, 0.7);
  border-radius: 10px;
}

.search-assets-input {
  border: none;
  outline: none;
  font-size: 13px;
  color: #111827;
  width: 140px;
  background: transparent;
}

.search-assets-input::placeholder {
  color: #d1d5db;
}

.view-toggle-group {
  display: flex;
  border: 1.5px solid rgba(229, 231, 235, 0.7);
  border-radius: 10px;
  overflow: hidden;
}

.view-toggle-btn {
  width: 38px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-toggle-btn + .view-toggle-btn {
  border-left: 1.5px solid rgba(229, 231, 235, 0.7);
}

.view-toggle-btn:hover {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.04);
}

.view-toggle-btn.active {
  background: rgba(59, 130, 246, 0.08);
  color: #3b82f6;
}

/* 文件夹卡片行 */
.folders-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
  margin-bottom: 28px;
}

.folder-card {
  background: white;
  border: 1.5px solid rgba(229, 231, 235, 0.7);
  border-radius: 18px;
  padding: 20px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.folder-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px -2px rgb(0 0 0 / 0.06);
  border-color: rgba(99, 102, 241, 0.25);
}

.folder-card-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.folder-card-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.folder-card-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.folder-card-count {
  font-size: 12px;
  color: #9ca3af;
}

.trash-folder .folder-card-icon {
  background: #fef2f2 !important;
  color: #ef4444 !important;
}

/* 最近文件标题 */
.recent-files-title {
  font-size: 17px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 18px;
}

/* 文件网格 */
.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
}

.file-card {
  background: white;
  border: 1.5px solid rgba(229, 231, 235, 0.7);
  border-radius: 18px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.file-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.08);
  border-color: rgba(99, 102, 241, 0.25);
}

.file-thumb {
  position: relative;
  aspect-ratio: 16/10;
  overflow: hidden;
}

.file-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-duration-badge {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.72);
  color: white;
  padding: 3px 8px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 700;
}

.file-type-badge-video {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 26px;
  height: 26px;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #111827;
}

.file-thumb-placeholder {
  aspect-ratio: 16/10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-audio {
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
}

.placeholder-audio-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  position: relative;
}

.audio-duration-sm {
  position: absolute;
  bottom: -18px;
  font-size: 11px;
  font-weight: 700;
  color: white;
  background: rgba(0, 0, 0, 0.35);
  padding: 2px 6px;
  border-radius: 4px;
}

.placeholder-template {
  background: #f8fafc;
  border: 1.5px dashed rgba(229, 231, 235, 0.7);
}

.placeholder-template-content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.template-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  font-size: 10px;
  font-weight: 700;
  color: #6b7280;
  background: rgba(255, 255, 255, 0.85);
  padding: 2px 8px;
  border-radius: 4px;
}

.template-preview-img {
  width: 80%;
  max-width: 120px;
  aspect-ratio: 3/2;
  object-fit: cover;
  border-radius: 6px;
}

.placeholder-project {
  background: white;
  border: 1.5px solid rgba(229, 231, 235, 0.7);
}

.placeholder-project-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.file-upload {
  border-style: dashed;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-upload:hover {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.03);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-text {
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
}

.file-info {
  padding: 12px 14px;
}

.file-name {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  font-size: 11px;
  color: #9ca3af;
  margin-bottom: 2px;
}

.file-size {
  font-size: 11px;
  color: #9ca3af;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  padding: 10px 0 20px;
}

.page-btn {
  min-width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1.5px solid rgba(229, 231, 235, 0.7);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.page-num.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.page-arrow {
  padding: 0 8px;
}

.page-dots {
  font-size: 14px;
  color: #9ca3af;
}
</style>
