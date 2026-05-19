export const toolsData = {
  categories: [
    {
      id: 'video-creation',
      name: '视频创作',
      icon: 'video',
      color: 'blue',
      tools: [
        { id: 'text-to-video', name: '文本转视频', desc: '输入文本，AI生成视频', icon: 'video', color: 'blue' },
        { id: 'image-to-video', name: '图文转视频', desc: '上传图片，生成视频', icon: 'image-plus', color: 'green' },
        { id: 'video-clone', name: '视频克隆', desc: '克隆视频风格', icon: 'copy', color: 'purple' },
        { id: 'video-merge', name: '视频合并', desc: '合并多个视频片段', icon: 'layers', color: 'orange' }
      ]
    },
    {
      id: 'editing',
      name: '后期剪辑',
      icon: 'scissors',
      color: 'purple',
      tools: [
        { id: 'smart-cut', name: '智能剪辑', desc: 'AI智能剪辑视频', icon: 'scissors', color: 'purple' },
        { id: 'auto-subtitle', name: '自动字幕', desc: '自动识别生成字幕', icon: 'subtitles', color: 'blue' },
        { id: 'video-overlay', name: '画中画', desc: '添加画中画效果', icon: 'layout', color: 'green' },
        { id: 'transition', name: '转场特效', desc: '添加转场动画', icon: 'arrow-right-left', color: 'orange' }
      ]
    },
    {
      id: 'enhancement',
      name: '画质增强',
      icon: 'sparkles',
      color: 'green',
      tools: [
        { id: 'upscale', name: '超分辨率', desc: '提升视频清晰度', icon: 'image-upscale', color: 'green' },
        { id: 'denoise', name: '降噪处理', desc: '去除视频噪点', icon: 'wand-2', color: 'blue' },
        { id: 'stabilize', name: '防抖修复', desc: '稳定抖动画面', icon: 'activity', color: 'purple' },
        { id: 'color-correct', name: '色彩校正', desc: '智能调色优化', icon: 'palette', color: 'orange' }
      ]
    },
    {
      id: 'audio',
      name: '音频处理',
      icon: 'volume-2',
      color: 'orange',
      tools: [
        { id: 'voiceover', name: '智能配音', desc: '多音色AI配音', icon: 'volume-2', color: 'orange' },
        { id: 'bgm', name: '背景音乐', desc: '智能匹配背景音乐', icon: 'music', color: 'blue' },
        { id: 'audio-mix', name: '音频混音', desc: '调整音量混音', icon: 'sliders', color: 'green' },
        { id: 'voice-changer', name: '变声器', desc: '改变声音特征', icon: 'mic', color: 'purple' }
      ]
    },
    {
      id: 'effects',
      name: '特效滤镜',
      icon: 'wand-2',
      color: 'blue',
      tools: [
        { id: 'filter', name: '风格滤镜', desc: '多种电影级滤镜', icon: 'filter', color: 'blue' },
        { id: 'effects', name: '视觉特效', desc: '添加视觉特效', icon: 'zap', color: 'purple' },
        { id: 'motion-graphics', name: '动态图形', desc: 'MG动画模板', icon: 'move', color: 'green' },
        { id: 'animation', name: '关键帧动画', desc: '自定义动画效果', icon: 'play', color: 'orange' }
      ]
    },
    {
      id: 'export',
      name: '导出发布',
      icon: 'upload',
      color: 'green',
      tools: [
        { id: 'compress', name: '视频压缩', desc: '减小文件大小', icon: 'file-down', color: 'green' },
        { id: 'convert', name: '格式转换', desc: '支持多种格式', icon: 'refresh-cw', color: 'blue' },
        { id: 'watermark', name: '水印添加', desc: '添加版权水印', icon: 'image', color: 'purple' },
        { id: 'batch-export', name: '批量导出', desc: '一次导出多个', icon: 'files', color: 'orange' }
      ]
    }
  ]
}
