<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useUserStore } from './stores/user'
import { userData } from './data/userData'

const userStore = useUserStore()

onMounted(() => {
  if (window.lucide) {
    lucide.createIcons()
  }

  if (!userStore.isLoggedIn) {
    userStore.setUser(userData.user)
  }
})
</script>

<style>
@import './assets/styles/variables.css';
@import './assets/styles/common.css';
</style>
