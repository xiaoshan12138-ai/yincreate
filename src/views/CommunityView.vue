<template>
  <AppLayout>
    <!-- 社区页面主容器 -->
    <div class="community-page">
      <!-- 顶部标签栏 + 操作按钮（发布、筛选） -->
      <div class="community-tab-header">
        <div class="tabs-nav">
          <button
            v-for="tab in tabs"
            :key="tab"
            :class="['comm-tab', { active: activeTab === tab }]"
            @click="activeTab = tab"
          >
            {{ tab }}
          </button>
        </div>
        <div class="tab-actions">
          <button class="publish-btn">
            <i data-lucide="send" style="width: 15px; height: 15px;"></i>
            发布作品
          </button>
          <select class="filter-select-comm">
            <option>全部筛选</option>
            <option>按时间排序</option>
            <option>按热度排序</option>
          </select>
        </div>
      </div>

      <!-- 分类标签行 - 内容类型筛选 -->
      <div class="category-tags-row">
        <button
          v-for="(cat, idx) in categories"
          :key="idx"
          :class="['cat-tag', { active: idx === 0 }]"
        >
          {{ cat }}<span v-if="idx === 0"> ▼</span>
        </button>
      </div>

      <!-- 精选横幅卡片 - 热门榜单、新星榜等 -->
      <div class="banner-cards-row">
        <div
          v-for="(banner, idx) in banners"
          :key="idx"
          :class="['banner-card', 'banner-' + banner.type]"
        >
          <div class="banner-card-inner">
            <h3 class="banner-title">{{ banner.title }}</h3>
            <p class="banner-subtitle">{{ banner.subtitle }}</p>
          </div>
        </div>
      </div>

      <!-- 视频网格 - 社区作品展示 -->
      <div class="video-grid-community">
        <div v-for="video in videos" :key="video.id" class="video-card-community">
          <div class="v-thumb-wrap">
            <img :src="video.thumbnail" :alt="video.title" class="v-thumb-img" @error="handleImageError">
            <span class="v-duration">{{ video.duration }}</span>
            <div class="v-play-overlay">
              <i data-lucide="play-circle" style="width: 28px; height: 28px; color: white;"></i>
            </div>
          </div>
          <div class="v-info">
            <h4 class="v-title">{{ video.title }}</h4>
            <p class="v-desc">{{ video.desc }}</p>
            <div class="v-meta-row">
              <div class="v-author">
                <div class="v-author-avatar">{{ video.author[0] }}</div>
                <span>{{ video.author }}</span>
              </div>
              <div class="v-stats">
                <span class="v-stat">
                  <i data-lucide="eye" style="width: 13px; height: 13px;"></i>
                  {{ formatViews(video.views) }}
                </span>
                <span class="v-stat">
                  <i data-lucide="heart" style="width: 13px; height: 13px;"></i>
                  {{ video.likes }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧边栏内容（通过AppLayout的slot传入） -->
    <template #right-sidebar>
      <aside class="right-sidebar-community">
        <!-- 热门话题 -->
        <div class="sidebar-section">
          <div class="section-head-row">
            <h3 class="sidebar-section-title">热门话题</h3>
            <a href="#" class="more-link">更多 ›</a>
          </div>
          <div class="topic-list">
            <div v-for="(topic, idx) in hotTopics" :key="idx" class="topic-item">
              <div class="topic-avatar" :style="{ background: topic.color + '20', color: topic.color }">
                <span style="font-size: 11px; font-weight: 700;">#</span>
              </div>
              <div class="topic-info">
                <span class="topic-name">{{ topic.tag.replace('#', '') }}</span>
                <span class="topic-count">{{ topic.count }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 创作者推荐 -->
        <div class="sidebar-section">
          <div class="section-head-row">
            <h3 class="sidebar-section-title">创作者推荐</h3>
            <a href="#" class="refresh-link">
              换一换
              <i data-lucide="refresh-cw" style="width: 12px; height: 12px;"></i>
            </a>
          </div>
          <div class="creator-list">
            <div v-for="(creator, idx) in creators" :key="idx" class="creator-item">
              <div class="creator-avatar-sm">{{ creator.name[0] }}</div>
              <div class="creator-info">
                <span class="creator-name">{{ creator.name }}</span>
                <span class="creator-fans">{{ creator.fans }}粉丝</span>
              </div>
              <button class="follow-btn">+ 关注</button>
            </div>
          </div>
        </div>
      </aside>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'

const activeTab = ref('推荐')
const tabs = ['推荐', '最新', '热门', '关注']
const categories = ['全部分类', 'AI短片', '旅行风光', '动感动漫', '产品宣传', '知识科普', '游戏混剪', '节日祝福']

const banners = [
  { title: '热门榜单', subtitle: '本周最受欢迎作品 →', type: 'purple' },
  { title: '新星榜', subtitle: '发现潜力创作者 ★', type: 'dark' },
  { title: '创意榜', subtitle: '最潮天马行空创意', type: 'castle' },
  { title: '技术榜', subtitle: '高质量制作作品', type: 'camera' }
]

const videos = [
  { id: 1, title: '未来科技城市之旅', duration: '02:35', author: '星辰大海', avatar: '', views: 120000, likes: 243, thumbnail: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=250&fit=crop', desc: '穿梭在未来的都市，感受科技与生活的融合' },
  { id: 2, title: '自然风光延时摄影', duration: '01:45', author: '风信染', avatar: '', views: 8456, likes: 132, thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop', desc: '记录大自然的美妙与宁静' },
  { id: 3, title: '太空漫步：星际探索', duration: '03:21', author: '银河漫游者', avatar: '', views: 18000, likes: 352, thumbnail: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=250&fit=crop', desc: '探索未知宇宙的奥秘' },
  { id: 4, title: '赛博朋克霓虹', duration: '00:59', author: 'Neon·光影', avatar: '', views: 6738, likes: 98, thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=250&fit=crop', desc: '未来世界的光影故事' },
  { id: 5, title: '治愈系乡村生活', duration: '02:10', author: '小熊猫星', avatar: '', views: 5832, likes: 75, thumbnail: 'https://images.unsplash.com/photo-1500382017468-995a87c134087?w=400&h=250&fit=crop', desc: '慢节奏的田园生活记录' },
  { id: 6, title: '海底世界奇遇记', duration: '00:48', author: '蓝色星球', avatar: '', views: 16000, likes: 276, thumbnail: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400&h=250&fit=crop', desc: '潜入深海，遇见奇妙生物' },
  { id: 7, title: '运动健身宣传片', duration: '00:36', author: '活力人生', avatar: '', views: 18000, likes: 165, thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop', desc: '释放能量，挑战自我' },
  { id: 8, title: '产品宣传片', duration: '01:06', author: '创意工坊', avatar: '', views: 8803, likes: 119, thumbnail: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=250&fit=crop', desc: '科技改变生活，品质创造未来' }
]

const hotTopics = [
  { tag: '#科幻世界', count: '1.3w 作品', color: '#6366f1' },
  { tag: '#旅行风光', count: '8560 作品', color: '#10b981' },
  { tag: '#国风古韵', count: '6420 作品', color: '#f59e0b' },
  { tag: '#节日祝福', count: '1.1w 作品', color: '#ec4899' },
  { tag: '#游戏混剪', count: '6680 作品', color: '#8b5cf6' }
]

const creators = [
  { name: '星辰大海', fans: '12万', avatar: '' },
  { name: '清风绘梦', fans: '8450', avatar: '' },
  { name: '银河漫游者', fans: '18万', avatar: '' },
  { name: 'Neon·光影', fans: '6750', avatar: '' },
  { name: '小熊猫星', fans: '5632', avatar: '' },
  { name: '创意工坊', fans: '8852', avatar: '' }
]

function formatViews(views) {
  if (views >= 10000) return (views / 10000).toFixed(1) + 'w'
  if (views >= 1000) return (views / 1000).toFixed(1) + 'k'
  return views
}

function handleImageError(e) {
  e.target.style.display = 'none'
}

onMounted(() => {
  if (window.lucide) lucide.createIcons()
})
</script>

<style scoped>
/* 社区页面样式 - 基于原始 community.css */
.community-page {
  display: flex;
  flex-direction: column;
}

.page-header-info {
  display: flex;
  flex-direction: column;
}

.page-subtitle {
  font-size: 13px;
  color: #9ca3af;
  margin-top: 2px;
}

/* 标签页头部 */
.community-tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.tabs-nav {
  display: flex;
  gap: 4px;
}

.comm-tab {
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

.comm-tab:hover {
  color: #3b82f6;
}

.comm-tab.active {
  color: #3b82f6;
  font-weight: 700;
}

.comm-tab.active::after {
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

.tab-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.publish-btn {
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

.publish-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
}

.filter-select-comm {
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

/* 分类标签行 */
.category-tags-row {
  display: flex;
  gap: 8px;
  margin-bottom: 22px;
  overflow-x: visible;
  flex-wrap: wrap;
}

.cat-tag {
  padding: 8px 18px;
  background: white;
  border: 1.5px solid rgba(229, 231, 235, 0.7);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.cat-tag:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.cat-tag.active {
  border-color: #3b82f6;
  color: #3b82f6;
  font-weight: 600;
  background: rgba(59, 130, 246, 0.04);
}

/* 横幅卡片 */
.banner-cards-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 26px;
}

.banner-card {
  border-radius: 18px;
  overflow: hidden;
  position: relative;
  min-height: 120px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.banner-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.08);
}

.banner-card-inner {
  padding: 22px 20px;
  position: relative;
  z-index: 1;
}

.banner-purple {
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
}

.banner-dark {
  background: linear-gradient(135deg, #374151, #1f2937);
}

.banner-castle {
  background: linear-gradient(135deg, #f97316, #ea580c);
}

.banner-camera {
  background: linear-gradient(135deg, #64748b, #475569);
}

.banner-title {
  font-size: 17px;
  font-weight: 800;
  color: white;
  margin-bottom: 6px;
}

.banner-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.82);
  font-weight: 500;
}

/* 视频网格 */
.video-grid-community {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 18px;
}

.video-card-community {
  background: white;
  border: 1.5px solid rgba(229, 231, 235, 0.7);
  border-radius: 18px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.video-card-community:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.08);
  border-color: rgba(99, 102, 241, 0.25);
}

.v-thumb-wrap {
  position: relative;
  aspect-ratio: 16/10;
  overflow: hidden;
}

.v-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.video-card-community:hover .v-thumb-img {
  transform: scale(1.05);
}

.v-duration {
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

.v-play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.85);
  opacity: 0;
  transition: all 0.3s ease;
}

.video-card-community:hover .v-play-overlay {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.v-info {
  padding: 13px 15px 15px;
}

.v-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.v-desc {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 10px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.v-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.v-author {
  display: flex;
  align-items: center;
  gap: 7px;
}

.v-author-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, #c7d2fe, #a5b4fc);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.v-author span {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.v-stats {
  display: flex;
  gap: 10px;
}

.v-stat {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: #9ca3af;
}
</style>
