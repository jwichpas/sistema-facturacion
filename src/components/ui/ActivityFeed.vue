<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ title }}</h3>
      <slot name="actions" />
    </div>
    <ul class="divide-y divide-gray-200 dark:divide-gray-700">
      <li v-for="(item, idx) in items" :key="idx" class="py-3 flex items-start gap-3">
        <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm text-gray-600 dark:text-gray-300">
          {{ getInitials(item.actor || item.title) }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-gray-900 dark:text-gray-100">
            <span class="font-medium">{{ item.title }}</span>
            <span v-if="item.description" class="text-gray-600 dark:text-gray-400"> — {{ item.description }}</span>
          </p>
          <p v-if="item.meta" class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ item.meta }}</p>
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ item.time }}</div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
export interface FeedItem {
  title: string
  description?: string
  time: string
  meta?: string
  actor?: string
}

interface Props {
  title: string
  items: FeedItem[]
}

defineProps<Props>()

const getInitials = (text?: string) => {
  if (!text) return '·'
  const parts = text.trim().split(/\s+/)
  const letters = parts.slice(0, 2).map(p => p[0]?.toUpperCase()).join('')
  return letters || text[0]?.toUpperCase() || '·'
}
</script>
