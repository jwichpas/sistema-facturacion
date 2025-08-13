<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
    <div class="flex items-center justify-between">
      <div class="space-y-1">
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ title }}</p>
        <div class="flex items-baseline gap-2">
          <h3 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ value }}</h3>
          <span
            v-if="delta !== undefined"
            :class="[
              'text-sm px-2 py-0.5 rounded-full',
              delta >= 0 ? 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30' : 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30'
            ]"
          >
            <span v-if="delta >= 0">▲</span>
            <span v-else>▼</span>
            {{ Math.abs(delta).toLocaleString(undefined, { maximumFractionDigits: 2 }) }}%
          </span>
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
interface Props {
  title: string
  value: string | number
  delta?: number
  subtitle?: string
}

defineProps<Props>()
</script>
