const STORAGE_PREFIX = 'szg_'

export function getStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error('Error reading from localStorage:', error)
    return defaultValue
  }
}

export function setStorage(key, value) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error('Error writing to localStorage:', error)
    return false
  }
}

/**
 * 带过期时间的存储（毫秒）
 */
export function setStorageWithExpiry(key, value, ttlMs) {
  try {
    const data = { value, expiresAt: Date.now() + ttlMs }
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data))
    return true
  } catch (error) {
    console.error('Error writing to localStorage:', error)
    return false
  }
}

/**
 * 读取带过期时间的存储，过期返回 null 并自动清除
 */
export function getStorageWithExpiry(key) {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key)
    if (!item) return null
    const data = JSON.parse(item)
    if (data.expiresAt && Date.now() > data.expiresAt) {
      removeStorage(key)
      return null
    }
    return data.value
  } catch (error) {
    console.error('Error reading from localStorage:', error)
    return null
  }
}

export function removeStorage(key) {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key)
    return true
  } catch (error) {
    console.error('Error removing from localStorage:', error)
    return false
  }
}

export function clearStorage() {
  try {
    Object.keys(localStorage)
      .filter(key => key.startsWith(STORAGE_PREFIX))
      .forEach(key => localStorage.removeItem(key))
    return true
  } catch (error) {
    console.error('Error clearing localStorage:', error)
    return false
  }
}
