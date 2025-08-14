<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Dashboard de Stock</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Resumen y métricas de inventario
        </p>
      </div>
      <div class="flex items-center gap-2">
        <FormSelect
          name="period_filter"
          :model-value="periodFilter"
          :options="periodOptions"
          @update:model-value="periodFilter = $event"
        />
        <BaseButton variant="outline" @click="refreshData">
          <RefreshCw class="w-4 h-4 mr-2" />
          Actualizar
        </BaseButton>
      </div>
    </div>

    <!-- Key Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Total Stock Value -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <DollarSign class="h-8 w-8 text-green-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Valor Total Stock</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {{ formatCurrency(totalStockValue) }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ totalProducts }} productos
            </p>
          </div>
        </div>
      </div>

      <!-- Stock Turnover -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <RotateCcw class="h-8 w-8 text-blue-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Rotación Stock</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {{ stockTurnover.toFixed(1) }}x
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Últimos 30 días
            </p>
          </div>
        </div>
      </div>

      <!-- Low Stock Items -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <AlertTriangle class="h-8 w-8 text-yellow-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Alertas Stock</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {{ lowStockCount + outOfStockCount }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ lowStockCount }} bajo, {{ outOfStockCount }} sin stock
            </p>
          </div>
        </div>
      </div>

      <!-- Stock Accuracy -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <Target class="h-8 w-8 text-purple-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Precisión Stock</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {{ stockAccuracy.toFixed(1) }}%
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Productos con stock correcto
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Stock Distribution Chart -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Distribución de Stock
        </h3>
        <div class="h-64 flex items-center justify-center">
          <div class="text-center">
            <BarChart3 class="h-16 w-16 text-gray-400 mx-auto mb-2" />
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Gráfico de distribución de stock por categorías
            </p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
              (Implementación pendiente)
            </p>
          </div>
        </div>
      </div>

      <!-- Stock Movement Trends -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Tendencias de Movimiento
        </h3>
        <div class="h-64 flex items-center justify-center">
          <div class="text-center">
            <TrendingUp class="h-16 w-16 text-gray-400 mx-auto mb-2" />
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Gráfico de tendencias de entrada y salida de stock
            </p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
              (Implementación pendiente)
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Products Tables -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Top Moving Products -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
            Productos Más Movidos
          </h3>
        </div>
        <div class="p-6">
          <div class="space-y-4">
            <div
              v-for="(product, index) in topMovingProducts"
              :key="product.id"
              class="flex items-center justify-between"
            >
              <div class="flex items-center gap-3">
                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <span class="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {{ index + 1 }}
                  </span>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {{ product.name }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ product.sku }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {{ product.total_stock || 0 }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  unidades
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Critical Stock Items -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
            Stock Crítico
          </h3>
        </div>
        <div class="p-6">
          <div class="space-y-4">
            <div
              v-for="product in criticalStockProducts"
              :key="product.id"
              class="flex items-center justify-between"
            >
              <div class="flex items-center gap-3">
                <div class="flex-shrink-0">
                  <component
                    :is="(product.total_stock || 0) === 0 ? XCircle : AlertTriangle"
                    :class="[
                      'w-5 h-5',
                      (product.total_stock || 0) === 0 ? 'text-red-500' : 'text-yellow-500'
                    ]"
                  />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {{ product.name }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ product.sku }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {{ product.total_stock || 0 }} / {{ product.min_stock || 0 }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  actual / mínimo
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  DollarSign,
  RotateCcw,
  AlertTriangle,
  Target,
  RefreshCw,
  BarChart3,
  TrendingUp,
  XCircle
} from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import { useProductStore } from '@/stores/product'

// Stores
const productStore = useProductStore()

// Component state
const periodFilter = ref('30d')

// Options
const periodOptions = [
  { value: '7d', label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: '90d', label: 'Últimos 90 días' },
  { value: '1y', label: 'Último año' }
]

// Computed properties
const totalProducts = computed(() => productStore.products.length)
const lowStockCount = computed(() => productStore.lowStockProducts.length)
const outOfStockCount = computed(() => productStore.outOfStockProducts.length)

const totalStockValue = computed(() => {
  // TODO: Calculate based on actual cost when available
  return 0
})

const stockTurnover = computed(() => {
  // TODO: Calculate based on actual movement data
  return 2.5
})

const stockAccuracy = computed(() => {
  const totalProducts = productStore.products.length
  if (totalProducts === 0) return 100

  // For now, assume 95% accuracy
  // TODO: Calculate based on actual stock verification data
  return 95.0
})

const topMovingProducts = computed(() => {
  return productStore.products
    .filter(p => p.active)
    .sort((a, b) => (b.total_stock || 0) - (a.total_stock || 0))
    .slice(0, 5)
})

const criticalStockProducts = computed(() => {
  return [
    ...productStore.outOfStockProducts,
    ...productStore.lowStockProducts
  ].slice(0, 5)
})

// Methods
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN'
  }).format(amount)
}

const refreshData = async () => {
  try {
    await Promise.all([
      productStore.loadProducts(),
      productStore.loadStockAlerts(),
      productStore.loadStockMovements()
    ])
  } catch (error) {
    console.error('Error refreshing dashboard data:', error)
  }
}

// Lifecycle
onMounted(async () => {
  await refreshData()
})
</script>
