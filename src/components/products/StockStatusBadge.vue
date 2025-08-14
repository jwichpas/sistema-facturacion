<template>
  <span
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      badgeClasses
    ]"
  >
    <component :is="statusIcon" class="w-3 h-3 mr-1" />
    {{ statusText }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-vue-next'
import type { ProductListItem } from '@/services/product'

interface Props {
  product: ProductListItem
}

const props = defineProps<Props>()

// Computed properties
const currentStock = computed(() => props.product.total_stock || 0)
const minStock = computed(() => props.product.min_stock || 0)

const stockStatus = computed(() => {
  if (currentStock.value === 0) return 'out_of_stock'
  if (currentStock.value <= minStock.value) return 'low_stock'
  return 'normal'
})

const statusIcon = computed(() => {
  switch (stockStatus.value) {
    case 'out_of_stock':
      return XCircle
    case 'low_stock':
      return AlertTriangle
    default:
      return CheckCircle
  }
})

const statusText = computed(() => {
  switch (stockStatus.value) {
    case 'out_of_stock':
      return 'Sin Stock'
    case 'low_stock':
      return 'Stock Bajo'
    default:
      return 'Stock Normal'
  }
})

const badgeClasses = computed(() => {
  switch (stockStatus.value) {
    case 'out_of_stock':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'low_stock':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    default:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  }
})
</script>
