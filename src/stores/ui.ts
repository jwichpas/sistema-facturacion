import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Theme, Locale, Notification, SearchResult } from '@/types'
import { STORAGE_KEYS } from '@/utils/constants'

export const useUIStore = defineStore('ui', () => {
  // State
  const sidebarCollapsed = ref(false)
  const theme = ref<Theme>('system')
  const locale = ref<Locale>('es')
  const notifications = ref<Notification[]>([])
  const globalSearchOpen = ref(false)
  const globalSearchQuery = ref('')
  const globalSearchResults = ref<SearchResult[]>([])
  const globalSearchLoading = ref(false)

  // Getters
  const unreadNotifications = computed(() => notifications.value.filter((n) => !n.read))

  const unreadNotificationCount = computed(() => unreadNotifications.value.length)

  // Actions
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(sidebarCollapsed.value))
  }

  const setSidebarCollapsed = (collapsed: boolean) => {
    sidebarCollapsed.value = collapsed
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(collapsed))
  }

  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme)
    updateThemeClass()
  }

  const setLocale = (newLocale: Locale) => {
    locale.value = newLocale
    localStorage.setItem(STORAGE_KEYS.LOCALE, newLocale)
  }

  const updateThemeClass = () => {
    const root = document.documentElement

    // Add theme changing class to prevent transition flashing
    root.classList.add('theme-changing')

    if (theme.value === 'dark') {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
    } else if (theme.value === 'light') {
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
    } else {
      // System preference
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (systemDark) {
        root.classList.add('dark')
        root.style.colorScheme = 'dark'
      } else {
        root.classList.remove('dark')
        root.style.colorScheme = 'light'
      }
    }

    // Remove theme changing class after a brief delay
    setTimeout(() => {
      root.classList.remove('theme-changing')
    }, 50)
  }

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification,
    }

    notifications.value.unshift(newNotification)

    // Auto-remove success notifications after 5 seconds
    if (notification.type === 'success') {
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, 5000)
    }
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex((n) => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const markNotificationAsRead = (id: string) => {
    const notification = notifications.value.find((n) => n.id === id)
    if (notification) {
      notification.read = true
    }
  }

  const markAllNotificationsAsRead = () => {
    notifications.value.forEach((n) => (n.read = true))
  }

  const clearNotifications = () => {
    notifications.value = []
  }

  const openGlobalSearch = () => {
    globalSearchOpen.value = true
    globalSearchQuery.value = ''
    globalSearchResults.value = []
  }

  const closeGlobalSearch = () => {
    globalSearchOpen.value = false
    globalSearchQuery.value = ''
    globalSearchResults.value = []
  }

  const performGlobalSearch = async (query: string) => {
    globalSearchQuery.value = query

    if (!query.trim()) {
      globalSearchResults.value = []
      return
    }

    globalSearchLoading.value = true

    try {
      // TODO: Implement actual search functionality
      // This will be implemented in a later task
      await new Promise((resolve) => setTimeout(resolve, 300)) // Simulate API call

      // Mock results for now
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'product' as const,
          title: `Producto que contiene "${query}"`,
          subtitle: 'SKU: PROD001',
          url: '/products/1',
        },
        {
          id: '2',
          type: 'customer' as const,
          title: `Cliente que contiene "${query}"`,
          subtitle: 'RUC: 20123456789',
          url: '/customers/2',
        },
      ]

      globalSearchResults.value = mockResults.filter(
        (result) =>
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.subtitle?.toLowerCase().includes(query.toLowerCase()),
      )
    } catch (error) {
      console.error('Error performing global search:', error)
      globalSearchResults.value = []
    } finally {
      globalSearchLoading.value = false
    }
  }

  const initializeUI = () => {
    // Restore sidebar state
    const storedSidebarState = localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED)
    if (storedSidebarState !== null) {
      sidebarCollapsed.value = storedSidebarState === 'true'
    }

    // Restore theme
    const storedTheme = localStorage.getItem(STORAGE_KEYS.THEME) as Theme
    if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
      theme.value = storedTheme
    }
    updateThemeClass()

    // Restore locale
    const storedLocale = localStorage.getItem(STORAGE_KEYS.LOCALE) as Locale
    if (storedLocale && ['es', 'en'].includes(storedLocale)) {
      locale.value = storedLocale
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', updateThemeClass)
  }

  return {
    // State
    sidebarCollapsed: readonly(sidebarCollapsed),
    theme: readonly(theme),
    locale: readonly(locale),
    notifications: readonly(notifications),
    globalSearchOpen: readonly(globalSearchOpen),
    globalSearchQuery: readonly(globalSearchQuery),
    globalSearchResults: readonly(globalSearchResults),
    globalSearchLoading: readonly(globalSearchLoading),

    // Getters
    unreadNotifications,
    unreadNotificationCount,

    // Actions
    toggleSidebar,
    setSidebarCollapsed,
    setTheme,
    setLocale,
    addNotification,
    removeNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    openGlobalSearch,
    closeGlobalSearch,
    performGlobalSearch,
    initializeUI,
  }
})

// Helper function for readonly refs
function readonly<T>(ref: T): T {
  return ref
}
