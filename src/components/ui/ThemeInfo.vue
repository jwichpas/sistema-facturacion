<template>
  <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
      {{ $t('theme.themeInfo') }}
    </h3>

    <div class="space-y-3">
      <!-- Current Theme -->
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ $t('theme.currentTheme') }}
        </span>
        <div class="flex items-center space-x-2">
          <component
            :is="getThemeIconComponent(currentTheme)"
            class="h-4 w-4 text-gray-500 dark:text-gray-400"
          />
          <span class="text-sm text-gray-900 dark:text-white">
            {{ getThemeLabel(currentTheme) }}
          </span>
        </div>
      </div>

      <!-- Effective Theme -->
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ $t('theme.effectiveTheme') }}
        </span>
        <div class="flex items-center space-x-2">
          <component
            :is="getThemeIconComponent(effectiveTheme)"
            class="h-4 w-4 text-gray-500 dark:text-gray-400"
          />
          <span class="text-sm text-gray-900 dark:text-white">
            {{ getThemeLabel(effectiveTheme) }}
          </span>
        </div>
      </div>

      <!-- System Preference -->
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ $t('theme.systemPreference') }}
        </span>
        <div class="flex items-center space-x-2">
          <component
            :is="systemDark ? 'Moon' : 'Sun'"
            class="h-4 w-4 text-gray-500 dark:text-gray-400"
          />
          <span class="text-sm text-gray-900 dark:text-white">
            {{ systemDark ? $t('theme.dark') : $t('theme.light') }}
          </span>
        </div>
      </div>

      <!-- Color Scheme -->
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ $t('theme.colorScheme') }}
        </span>
        <span class="text-sm text-gray-900 dark:text-white">
          {{ getColorScheme() }}
        </span>
      </div>

      <!-- Reduced Motion -->
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ $t('theme.reducedMotion') }}
        </span>
        <span class="text-sm text-gray-900 dark:text-white">
          {{ prefersReducedMotion ? $t('common.yes') : $t('common.no') }}
        </span>
      </div>
    </div>

    <!-- Theme Actions -->
    <div class="mt-6 flex flex-wrap gap-2">
      <button
        v-for="theme in availableThemes"
        :key="theme"
        @click="selectTheme(theme)"
        :class="[
          'inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
          {
            'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200':
              theme === currentTheme,
            'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600':
              theme !== currentTheme,
          },
        ]"
      >
        <component
          :is="getThemeIconComponent(theme)"
          class="mr-1.5 h-3 w-3"
        />
        {{ getThemeLabel(theme) }}
      </button>
    </div>

    <!-- CSS Variables Preview (Development only) -->
    <div v-if="showCSSVariables" class="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
      <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
        {{ $t('theme.cssVariables') }}
      </h4>
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div
          v-for="variable in cssVariables"
          :key="variable.name"
          class="flex items-center justify-between rounded bg-gray-50 px-2 py-1 dark:bg-gray-700"
        >
          <span class="font-mono text-gray-600 dark:text-gray-400">
            {{ variable.name }}
          </span>
          <span class="text-gray-900 dark:text-white">
            {{ variable.value }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import type { Theme } from '@/types'
import {
  Sun,
  Moon,
  Monitor,
} from 'lucide-vue-next'

// Props
interface Props {
  showCSSVariables?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showCSSVariables: false
})

// Composables
const {
  currentTheme,
  effectiveTheme,
  availableThemes,
  setTheme,
  getThemeLabel,
  getColorScheme,
  applyThemeWithTransition,
} = useTheme()

// Local state
const systemDark = ref(false)
const prefersReducedMotion = ref(false)
const cssVariables = ref<Array<{ name: string; value: string }>>([])

// Computed properties
const getThemeIconComponent = (theme: Theme) => {
  switch (theme) {
    case 'light':
      return Sun
    case 'dark':
      return Moon
    case 'system':
      return Monitor
    default:
      return Monitor
  }
}

// Methods
const selectTheme = (theme: Theme) => {
  applyThemeWithTransition(theme)
}

const updateSystemPreferences = () => {
  // Check system dark mode preference
  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
  systemDark.value = darkModeQuery.matches

  // Check reduced motion preference
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  prefersReducedMotion.value = reducedMotionQuery.matches

  // Listen for changes
  darkModeQuery.addEventListener('change', (e) => {
    systemDark.value = e.matches
  })

  reducedMotionQuery.addEventListener('change', (e) => {
    prefersReducedMotion.value = e.matches
  })
}

const loadCSSVariables = () => {
  if (!props.showCSSVariables) return

  const root = document.documentElement
  const computedStyle = getComputedStyle(root)

  const variableNames = [
    '--color-primary',
    '--color-primary-50',
    '--color-primary-500',
    '--color-primary-600',
    '--color-gray-50',
    '--color-gray-100',
    '--color-gray-900',
    '--color-gray-950',
  ]

  cssVariables.value = variableNames.map(name => ({
    name,
    value: computedStyle.getPropertyValue(name).trim() || 'Not set'
  }))
}

// Lifecycle
onMounted(() => {
  updateSystemPreferences()
  loadCSSVariables()
})
</script>
