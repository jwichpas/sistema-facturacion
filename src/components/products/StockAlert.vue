<template>
  <div
    :class="[
      'flex items-center justify-between p-4 rounded-lg border transition-colors',
      alertTypeClass
    ]"
  >
    <div class="flex items-center gap-3">
      <div class="flex-shrink-0">
        <component
          :is="alertIcon"
          :class="[
            'h-5 w-5',
            alert.alert_type === 'out_of_stock' ? 'text-red-500' : 'text-yellow-500'
          ]"
        />
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <h4 class="font-medium text-gray-900 dark:text-gray-100 truncate">
            {{ alert.product_name }}
          </h4>
          <span
            :class="[
              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
              alert.alert_type === 'out_of_stock'
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            ]"
          >
            {{ alertTypeLabel }}
          </span>
        </div>

        <div class="mt-1 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span class="font-mono">SKU: {{ alert.product_sku }}</span>
          <span>{{ alert.warehouse_name }}</span>
          <span>
            Stock:
            <span
              :class="[
                'font-medium',
                alert.alert_type === 'out_of_stock'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-yellow-600 dark:text-yellow-400'
              ]"
            >
              {{ alert.current_stock }}
            </span>
            / {{ alert.min_stock }} mínimo
          </span>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2 ml-4">
      <BaseButton
        size="sm"
        variant="outline"
        @click="$emit('view-movements', alert.product_id)"
      >
        <Activity class="w-4 h-4 mr-1" />
        Movimientos
      </BaseButton>

      <BaseButton
        size="sm"
        @click="$emit('view-product', alert.product_id)"
      >
        <Eye class="w-4 h-4 mr-1" />
        Ver Producto
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, XCircle, Activity, Eye } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import type { StockAlert } from '@/services/product'

interface Props {
  alert: StockAlert
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'view-product': [productId: string]
  'view-movements': [productId: string]
}>()

// Computed properties
const alertIcon = computed(() => {
  return props.alert.alert_type === 'out_of_stock' ? XCircle : AlertTriangle
})

const alertTypeLabel = computed(() => {
  return props.alert.alert_type === 'out_of_stock' ? 'Sin Stock' : 'Stock Bajo'
})

const alertTypeClass = computed(() => {
  if (props.alert.alert_type === 'out_of_stock') {
    return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
  } else {
    return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10'
  }
})
</script>
