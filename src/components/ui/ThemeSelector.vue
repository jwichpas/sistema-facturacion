<template>
  <div class="relative">
    <!-- Theme selector button -->
    <button
      @click="toggleDropdown"
      :title="$t('theme.currentTheme', { theme: getThemeLabel(currentTheme) })"
      :class="[
        'flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors',
        buttonSizeClass
      ]"
    >
      <component
        :is="getThemeIconComponent(effectiveTheme)"
        :class="iconSizeClass"
      />
    </button>

    <!-- Theme selector dropdown -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="showDropdown"
        ref="dropdownRef"
        class="absolute right-0 z-50 mt-2 w-48 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700"
      >
        <div class="p-2">
          <!-- Header -->
          <div class="px-3 py-2 border-b border-gray-200 dark:border-gray-600">
            <h3 class="text-sm font-medium text-gray-900 dark:text-white">
              {{ $t('theme.selectTheme') }}
            </h3>
          </div>

          <!-- Theme options -->
          <div class="mt-2 space-y-1">
            <button
              v-for="theme in availableThemes"
              :key="theme"
              @click="selectTheme(theme)"
              :class="[
                'flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors',
                {
                  'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-200':
                    theme === currentTheme,
                  'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700':
                    theme !== currentTheme,
                },
              ]"
            >
              <component
                :is="getThemeIconComponent(theme)"
                class="mr-3 h-4 w-4"
              />
              <span class="flex-1 text-left">{{ getThemeLabel(theme) }}</span>
              <Check
                v-if="theme === currentTheme"
                class="ml-2 h-4 w-4"
              />
            </button>
          </div>

          <!-- Current effective theme info -->
          <div v-if="currentTheme === 'system'" class="mt-2 px-3 py-2 border-t border-gray-200 dark:border-gray-600">
            <div class="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <Info class="mr-2 h-3 w-3" />
              <span>
                {{ $t('theme.systemDetected', { theme: getThemeLabel(effectiveTheme) }) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { useTheme } from '@/composables/useTheme'
import type { Theme } from '@/types'
import {
  Sun,
  Moon,
  Monitor,
  Check,
  Info,
} from 'lucide-vue-next'

// Props
interface Props {
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  variant?: 'button' | 'dropdown'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showLabel: false,
  variant: 'dropdown'
})

// Emits
const emit = defineEmits<{
  themeChanged: [theme: Theme]
}>()

// Composables
const {
  currentTheme,
  effectiveTheme,
  availableThemes,
  setTheme,
  getThemeLabel,
  applyThemeWithTransition,
} = useTheme()

// Local state
const showDropdown = ref(false)
const dropdownRef = ref<HTMLElement>()

// Computed properties
const buttonSizeClass = computed(() => {
  const sizes = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  }
  return sizes[props.size]
})

const iconSizeClass = computed(() => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }
  return sizes[props.size]
})

// Methods
const toggleDropdown = () => {
  if (props.variant === 'dropdown') {
    showDropdown.value = !showDropdown.value
  } else {
    // Simple button mode - cycle through themes
    const currentIndex = availableThemes.indexOf(currentTheme.value)
    const nextIndex = (currentIndex + 1) % availableThemes.length
    const nextTheme = availableThemes[nextIndex]
    selectTheme(nextTheme)
  }
}

const closeDropdown = () => {
  showDropdown.value = false
}

const selectTheme = (theme: Theme) => {
  applyThemeWithTransition(theme)
  emit('themeChanged', theme)
  closeDropdown()
}

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

// Click outside handling
onClickOutside(dropdownRef, () => {
  if (showDropdown.value) {
    closeDropdown()
  }
})
</script>
