import { computed, watch, onMounted } from 'vue'
import { useUIStore } from '@/stores/ui'
import type { Theme } from '@/types'

/**
 * Composable for theme management
 * Provides reactive theme state and utilities for theme switching
 */
export function useTheme() {
  const uiStore = useUIStore()

  // Computed properties
  const currentTheme = computed(() => uiStore.theme)

  const isDark = computed(() => {
    if (currentTheme.value === 'dark') return true
    if (currentTheme.value === 'light') return false

    // System preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const isLight = computed(() => !isDark.value)

  const effectiveTheme = computed(() => {
    if (currentTheme.value === 'system') {
      return isDark.value ? 'dark' : 'light'
    }
    return currentTheme.value
  })

  // Theme switching methods
  const setTheme = (theme: Theme) => {
    uiStore.setTheme(theme)
  }

  const toggleTheme = () => {
    const newTheme = effectiveTheme.value === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  const setLightTheme = () => setTheme('light')
  const setDarkTheme = () => setTheme('dark')
  const setSystemTheme = () => setTheme('system')

  // Theme utilities
  const getThemeIcon = (theme: Theme) => {
    switch (theme) {
      case 'light':
        return 'Sun'
      case 'dark':
        return 'Moon'
      case 'system':
        return 'Monitor'
      default:
        return 'Monitor'
    }
  }

  const getThemeLabel = (theme: Theme) => {
    switch (theme) {
      case 'light':
        return 'Claro'
      case 'dark':
        return 'Oscuro'
      case 'system':
        return 'Sistema'
      default:
        return 'Sistema'
    }
  }

  const availableThemes: Theme[] = ['light', 'dark', 'system']

  // CSS custom properties management
  const setCSSCustomProperty = (property: string, value: string) => {
    document.documentElement.style.setProperty(property, value)
  }

  const getCSSCustomProperty = (property: string) => {
    return getComputedStyle(document.documentElement).getPropertyValue(property)
  }

  // Theme transition utilities
  const enableTransitions = () => {
    document.documentElement.style.setProperty('--theme-transition', 'all 0.2s ease-in-out')
  }

  const disableTransitions = () => {
    document.documentElement.style.removeProperty('--theme-transition')
  }

  // Apply theme with smooth transition
  const applyThemeWithTransition = (theme: Theme) => {
    enableTransitions()
    setTheme(theme)

    // Remove transition after animation completes
    setTimeout(() => {
      disableTransitions()
    }, 200)
  }

  // System theme change detection
  const setupSystemThemeListener = () => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (currentTheme.value === 'system') {
        // Force re-evaluation of theme classes
        uiStore.initializeUI()
      }
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)

    // Return cleanup function
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }

  // Theme persistence
  const saveThemePreference = (theme: Theme) => {
    localStorage.setItem('theme', theme)
  }

  const loadThemePreference = (): Theme => {
    const saved = localStorage.getItem('theme') as Theme
    return saved && availableThemes.includes(saved) ? saved : 'system'
  }

  // Color scheme utilities
  const getColorScheme = () => {
    return isDark.value ? 'dark' : 'light'
  }

  const applyColorScheme = (scheme: 'light' | 'dark') => {
    const root = document.documentElement

    if (scheme === 'dark') {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
    } else {
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
    }
  }

  // Theme validation
  const isValidTheme = (theme: string): theme is Theme => {
    return availableThemes.includes(theme as Theme)
  }

  // Initialize theme on mount
  onMounted(() => {
    setupSystemThemeListener()
  })

  // Watch for theme changes and apply them
  watch(
    effectiveTheme,
    (newTheme) => {
      applyColorScheme(newTheme as 'light' | 'dark')
    },
    { immediate: true }
  )

  return {
    // State
    currentTheme,
    effectiveTheme,
    isDark,
    isLight,
    availableThemes,

    // Methods
    setTheme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    setSystemTheme,
    applyThemeWithTransition,

    // Utilities
    getThemeIcon,
    getThemeLabel,
    getColorScheme,
    isValidTheme,

    // CSS utilities
    setCSSCustomProperty,
    getCSSCustomProperty,

    // Persistence
    saveThemePreference,
    loadThemePreference,

    // System integration
    setupSystemThemeListener,
  }
}

export default useTheme