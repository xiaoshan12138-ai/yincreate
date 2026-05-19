import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getStorage, setStorage } from '../utils/storage'

export const useUserStore = defineStore('user', () => {
  const user = ref(getStorage('user', null))
  const isLoggedIn = computed(() => !!user.value)

  function setUser(userData) {
    user.value = userData
    setStorage('user', userData)
  }

  function updateUser(updates) {
    user.value = { ...user.value, ...updates }
    setStorage('user', user.value)
  }

  function logout() {
    user.value = null
    removeStorage('user')
  }

  return {
    user,
    isLoggedIn,
    setUser,
    updateUser,
    logout
  }
})
