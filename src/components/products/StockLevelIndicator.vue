<template>
  <div class="flex items-center gap-1">
    <!-- Stock Level Bar -->
    <div class="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        :class="[
          'h-full transition-all duration-300 rounded-full',
          stockLevelColor
        ]"
        :style="{ width: `${stockPercentage}%` }"
      ></div>
    </div>

    <!-- Stock Level Icon -->
    <component
      :is="stockIcon"
      :class="[
        'w-4 h-4',
        stockIconColor
      ]"
      :title="stockStatusText"
    />
  </div>
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
const maxStock = computed(() => props.product.max_stock || minStock.value * 2 || 100)

const stockPercentage = computed(() => {
  if (maxStock.value === 0) return 0
  return Math.min(100, Math.max(0, (currentStock.value / maxStock.value) * 100))
})

const stockStatus = computed(() => {
  if (currentStock.value === 0) return 'out_of_stock'
  if (currentStock.value <= minStock.value) return 'low_stock'
  return 'normal'
})

const stockIcon = computed(() => {
  switch (stockStatus.value) {
    case 'out_of_stock':
      return XCircle
    case 'low_stock':
      return AlertTriangle
    default:
      return CheckCircle
  }
})

const stockIconColor = computed(() => {
  switch (stockStatus.value) {
    case 'out_of_stock':
      return 'text-red-500'
    case 'low_stock':
      return 'text-yellow-500'
    default:
      return 'text-green-500'
  }
})

const stockLevelColor = computed(() => {
  switch (stockStatus.value) {
    case 'out_of_stock':
      return 'bg-red-500'
    case 'low_stock':
      return 'bg-yellow-500'
    default:
      return 'bg-green-500'
  }
})

const stockStatusText = computed(() => {
  switch (stockStatus.value) {
    case 'out_of_stock':
      return 'Sin stock'
    case 'low_stock':
      return `Stock bajo (${currentStock.value}/${minStock.value})`
    default:
      return `Stock normal (${currentStock.value})`
  }
})
</script>
