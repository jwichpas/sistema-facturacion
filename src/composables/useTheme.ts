import { ref, watch, onMounted } from 'vue'
import type { Theme } from '@/types'

const theme = ref<Theme>('system')
const isDark = ref(false)

export function useTheme() {
  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
    localStorage.setItem('theme', newTheme)
    updateDarkMode()
  }

  const updateDarkMode = () => {
    const root = document.documentElement

    if (theme.value === 'dark') {
      isDark.value = true
      root.classList.add('dark')
    } else if (theme.value === 'light') {
      isDark.value = false
      root.classList.remove('dark')
    } else {
      // System preference
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      isDark.value = systemDark
      if (systemDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }

  const toggleTheme = () => {
    if (theme.value === 'light') {
      setTheme('dark')
    } else if (theme.value === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const initTheme = () => {
    const stored = localStorage.getItem('theme') as Theme
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      theme.value = stored
    }
    updateDarkMode()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', updateDarkMode)
  }

  // Watch for theme changes
  watch(theme, updateDarkMode)

  onMounted(() => {
    initTheme()
  })

  return {
    theme: readonly(theme),
    isDark: readonly(isDark),
    setTheme,
    toggleTheme,
    initTheme,
  }
}

// Create a readonly function
function readonly<T>(ref: any): T {
  return ref
}
