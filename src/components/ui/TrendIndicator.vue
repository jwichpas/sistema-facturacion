<template>
  <div class="inline-flex items-center gap-1">
    <component
      :is="trendIcon"
      :class="[
        'w-4 h-4',
        trendColorClass
      ]"
    />
    <span :class="['text-sm font-medium', trendColorClass]">
      {{ formattedValue }}
    </span>
    <span v-if="label" class="text-xs text-gray-500 dark:text-gray-400">
      {{ label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TrendingUp, TrendingDown, Minus } from 'lucide-vue-next'

interface Props {
  value: number
  format?: 'percentage' | 'number' | 'currency'
  currency?: string
  label?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  format: 'percentage',
  currency: 'PEN',
  showIcon: true,
  size: 'md',
})

const trendIcon = computed(() => {
  if (!props.showIcon) return null

  if (props.value > 0) return TrendingUp
  if (props.value < 0) return TrendingDown
  return Minus
})

const trendColorClass = computed(() => {
  if (props.value > 0) {
    return 'text-green-600 dark:text-green-400'
  } else if (props.value < 0) {
    return 'text-red-600 dark:text-red-400'
  } else {
    return 'text-gray-500 dark:text-gray-400'
  }
})

const formattedValue = computed(() => {
  const absValue = Math.abs(props.value)

  switch (props.format) {
    case 'percentage':
      return `${absValue.toFixed(1)}%`
    case 'currency':
      return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: props.currency,
      }).format(absValue)
    case 'number':
      return absValue.toLocaleString()
    default:
      return absValue.toString()
  }
})
</script>
