import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const activeNav = ref('home')
  const searchQuery = ref('')
  const isLoading = ref(false)

  function setActiveNav(navId) {
    activeNav.value = navId
  }

  function setSearchQuery(query) {
    searchQuery.value = query
  }

  function setLoading(loading) {
    isLoading.value = loading
  }

  return {
    activeNav,
    searchQuery,
    isLoading,
    setActiveNav,
    setSearchQuery,
    setLoading
  }
})
