<template>
  <div class="project-header-bar">
    <div class="header-left">
      <h2 class="page-title">{{ title }}</h2>
      <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
    </div>
    <div class="header-right">
      <button v-if="addLabel" class="add-btn" @click="$emit('add')">
        <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
        {{ addLabel }}
      </button>
      <slot name="extra"></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  addLabel: { type: String, default: '' }
})

defineEmits(['add'])
</script>

<style scoped>
.project-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: white;
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-xl);
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--text-primary);
}

.page-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
}

.add-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}
</style>
