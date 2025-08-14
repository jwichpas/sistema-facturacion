<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
    <div class="flex items-center justify-between">
      <div class="space-y-1">
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ title }}</p>
        <div class="flex items-baseline gap-2">
          <h3 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ value }}</h3>
          <TrendIndicator
            v-if="delta !== undefined"
            :value="delta"
            format="percentage"
          />
        </div>
        <p v-if="subtitle" class="text-xs text-gray-500 dark:text-gray-400">{{ subtitle }}</p>
      </div>
      <div class="flex-shrink-0">
        <slot name="icon">
          <div class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-300">
            <span class="text-lg">☆</span>
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import TrendIndicator from './TrendIndicator.vue'

interface Props {
  title: string
  value: string | number
  delta?: number
  subtitle?: string
}

defineProps<Props>()
</script>
