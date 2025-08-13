<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ $t('theme.themeSettings') }}
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ $t('theme.themeSettingsDescription') }}
      </p>
    </div>

    <!-- Theme Selection Card -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ $t('theme.appearance') }}
        </h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ $t('theme.appearanceDescription') }}
        </p>
      </div>

      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Light Theme Option -->
          <div
            @click="selectTheme('light')"
            :class="[
              'relative cursor-pointer rounded-lg border-2 p-4 transition-all',
              {
                'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20': currentTheme === 'light',
                'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600': currentTheme !== 'light',
              },
            ]"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <Sun class="h-6 w-6 text-yellow-500" />
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ $t('theme.light') }}
                  </h3>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ $t('theme.lightDescription') }}
                  </p>
                </div>
              </div>
              <Check
                v-if="currentTheme === 'light'"
                class="h-5 w-5 text-indigo-600 dark:text-indigo-400"
              />
            </div>

            <!-- Light Theme Preview -->
            <div class="mt-4 rounded border bg-white p-2 shadow-sm">
              <div class="h-2 w-full rounded bg-gray-100"></div>
              <div class="mt-2 flex space-x-1">
                <div class="h-1 w-4 rounded bg-gray-200"></div>
                <div class="h-1 w-6 rounded bg-gray-300"></div>
                <div class="h-1 w-3 rounded bg-gray-200"></div>
              </div>
            </div>
          </div>

          <!-- Dark Theme Option -->
          <div
            @click="selectTheme('dark')"
            :class="[
              'relative cursor-pointer rounded-lg border-2 p-4 transition-all',
              {
                'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20': currentTheme === 'dark',
                'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600': currentTheme !== 'dark',
              },
            ]"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <Moon class="h-6 w-6 text-indigo-400" />
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ $t('theme.dark') }}
                  </h3>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ $t('theme.darkDescription') }}
                  </p>
                </div>
              </div>
              <Check
                v-if="currentTheme === 'dark'"
                class="h-5 w-5 text-indigo-600 dark:text-indigo-400"
              />
            </div>

            <!-- Dark Theme Preview -->
            <div class="mt-4 rounded border border-gray-600 bg-gray-800 p-2 shadow-sm">
              <div class="h-2 w-full rounded bg-gray-700"></div>
              <div class="mt-2 flex space-x-1">
                <div class="h-1 w-4 rounded bg-gray-600"></div>
                <div class="h-1 w-6 rounded bg-gray-500"></div>
                <div class="h-1 w-3 rounded bg-gray-600"></div>
              </div>
            </div>
          </div>

          <!-- System Theme Option -->
          <div
            @click="selectTheme('system')"
            :class="[
              'relative cursor-pointer rounded-lg border-2 p-4 transition-all',
              {
                'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20': currentTheme === 'system',
                'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600': currentTheme !== 'system',
              },
            ]"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <Monitor class="h-6 w-6 text-gray-500 dark:text-gray-400" />
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ $t('theme.system') }}
                  </h3>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ $t('theme.systemDescription') }}
                  </p>
                </div>
              </div>
              <Check
                v-if="currentTheme === 'system'"
                class="h-5 w-5 text-indigo-600 dark:text-indigo-400"
              />
            </div>

            <!-- System Theme Preview -->
            <div class="mt-4 flex space-x-1">
              <div class="flex-1 rounded border bg-white p-1 shadow-sm">
                <div class="h-1 w-full rounded bg-gray-100"></div>
                <div class="mt-1 h-1 w-3/4 rounded bg-gray-200"></div>
              </div>
              <div class="flex-1 rounded border border-gray-600 bg-gray-800 p-1 shadow-sm">
                <div class="h-1 w-full rounded bg-gray-700"></div>
                <div class="mt-1 h-1 w-3/4 rounded bg-gray-600"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Current System Preference -->
        <div v-if="currentTheme === 'system'" class="mt-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <div class="flex items-center">
            <Info class="h-5 w-5 text-blue-400" />
            <div class="ml-3">
              <p class="text-sm text-blue-800 dark:text-blue-200">
                {{ $t('theme.systemCurrently', { theme: getThemeLabel(effectiveTheme) }) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Theme Information Card -->
    <ThemeInfo :show-c-s-s-variables="isDevelopment" />

    <!-- Advanced Settings Card -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ $t('theme.advancedSettings') }}
        </h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ $t('theme.advancedSettingsDescription') }}
        </p>
      </div>

      <div class="p-6 space-y-4">
        <!-- Reduced Motion Toggle -->
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-medium text-gray-900 dark:text-white">
              {{ $t('theme.respectReducedMotion') }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ $t('theme.respectReducedMotionDescription') }}
            </p>
          </div>
          <div class="flex items-center">
            <span class="text-sm text-gray-500 dark:text-gray-400 mr-2">
              {{ prefersReducedMotion ? $t('common.enabled') : $t('common.disabled') }}
            </span>
            <div :class="[
              'h-2 w-2 rounded-full',
              prefersReducedMotion ? 'bg-green-500' : 'bg-gray-300'
            ]"></div>
          </div>
        </div>

        <!-- High Contrast Toggle -->
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-medium text-gray-900 dark:text-white">
              {{ $t('theme.highContrast') }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ $t('theme.highContrastDescription') }}
            </p>
          </div>
          <button
            @click="toggleHighContrast"
            :class="[
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              highContrast ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
            ]"
          >
            <span
              :class="[
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                highContrast ? 'translate-x-6' : 'translate-x-1'
              ]"
            />
          </button>
        </div>

        <!-- Theme Transition Speed -->
        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            {{ $t('theme.transitionSpeed') }}
          </label>
          <select
            v-model="transitionSpeed"
            @change="updateTransitionSpeed"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
          >
            <option value="fast">{{ $t('theme.fast') }}</option>
            <option value="normal">{{ $t('theme.normal') }}</option>
            <option value="slow">{{ $t('theme.slow') }}</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import ThemeInfo from '@/components/ui/ThemeInfo.vue'
import type { Theme } from '@/types'
import {
  Sun,
  Moon,
  Monitor,
  Check,
  Info,
} from 'lucide-vue-next'

// Composables
const {
  currentTheme,
  effectiveTheme,
  setTheme,
  getThemeLabel,
  applyThemeWithTransition,
} = useTheme()

// Local state
const highContrast = ref(false)
const transitionSpeed = ref('normal')
const prefersReducedMotion = ref(false)

// Computed properties
const isDevelopment = computed(() => import.meta.env.DEV)

// Methods
const selectTheme = (theme: Theme) => {
  applyThemeWithTransition(theme)
}

const toggleHighContrast = () => {
  highContrast.value = !highContrast.value

  const root = document.documentElement
  if (highContrast.value) {
    root.classList.add('high-contrast')
  } else {
    root.classList.remove('high-contrast')
  }

  // Save preference
  localStorage.setItem('highContrast', String(highContrast.value))
}

const updateTransitionSpeed = () => {
  const root = document.documentElement

  const speeds = {
    fast: '0.1s',
    normal: '0.2s',
    slow: '0.4s'
  }

  root.style.setProperty('--theme-transition-duration', speeds[transitionSpeed.value as keyof typeof speeds])
  localStorage.setItem('transitionSpeed', transitionSpeed.value)
}

const loadPreferences = () => {
  // Load high contrast preference
  const savedHighContrast = localStorage.getItem('highContrast')
  if (savedHighContrast !== null) {
    highContrast.value = savedHighContrast === 'true'
    if (highContrast.value) {
      document.documentElement.classList.add('high-contrast')
    }
  }

  // Load transition speed preference
  const savedTransitionSpeed = localStorage.getItem('transitionSpeed')
  if (savedTransitionSpeed && ['fast', 'normal', 'slow'].includes(savedTransitionSpeed)) {
    transitionSpeed.value = savedTransitionSpeed
    updateTransitionSpeed()
  }

  // Check system preferences
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  prefersReducedMotion.value = reducedMotionQuery.matches

  reducedMotionQuery.addEventListener('change', (e) => {
    prefersReducedMotion.value = e.matches
  })
}

// Lifecycle
onMounted(() => {
  loadPreferences()
})
</script>
