<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Monitoreo de Stock</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Supervisa los niveles de inventario y movimientos de stock
        </p>
      </div>
      <div class="flex items-center gap-2">
        <BaseButton variant="outline" @click="refreshData">
          <RefreshCw class="w-4 h-4 mr-2" />
          Actualizar
        </BaseButton>
        <BaseButton variant="outline" @click="showStockMovements = true">
          <Activity class="w-4 h-4 mr-2" />
          Movimientos
        </BaseButton>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col md:flex-row gap-4">
      <div class="flex-1">
        <FormInput
          name="stock_search"
          placeholder="Buscar productos por nombre o SKU..."
          :model-value="searchQuery"
          @update:model-value="handleSearch"
        >
          <template #prefix>
            <Search class="h-4 w-4 text-gray-400" />
          </template>
        </FormInput>
      </div>
      <div class="flex items-center gap-2">
        <FormSelect
          name="warehouse_filter"
          :model-value="warehouseFilter"
          :options="warehouseOptions"
          @update:model-value="warehouseFilter = $event"
        />
        <FormSelect
          name="alert_filter"
          :model-value="alertFilter"
          :options="alertOptions"
          @update:model-value="alertFilter = $event"
        />
        <BaseButton variant="outline" @click="clearFilters">
          <X class="w-4 h-4 mr-1" />
          Limpiar
        </BaseButton>
      </div>
    </div>

    <!-- Stock Overview Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <Package class="h-8 w-8 text-blue-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Productos</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ totalProducts }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <AlertTriangle class="h-8 w-8 text-yellow-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Stock Bajo</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ lowStockCount }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <XCircle class="h-8 w-8 text-red-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Sin Stock</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ outOfStockCount }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <DollarSign class="h-8 w-8 text-green-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Valor Total</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ formatCurrency(totalStockValue) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Stock Alerts -->
    <div v-if="filteredAlerts.length > 0" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Alertas de Stock</h3>
      </div>
      <div class="p-6">
        <div class="space-y-4">
          <StockAlert
            v-for="alert in filteredAlerts.slice(0, 5)"
            :key="`${alert.product_id}-${alert.warehouse_id}`"
            :alert="alert"
            @view-product="$emit('view-product', $event)"
            @view-movements="viewProductMovements"
          />
          <div v-if="filteredAlerts.length > 5" class="text-center">
            <BaseButton variant="outline" @click="showAllAlerts = true">
              Ver todas las alertas ({{ filteredAlerts.length - 5 }} más)
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-2 text-gray-600 dark:text-gray-400">Cargando datos de stock...</span>
    </div>

    <!-- Stock Levels Table -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Niveles de Stock</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Producto
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                SKU
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Stock Actual
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Stock Mínimo
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Valor Stock
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            <tr
              v-for="product in filteredProducts"
              :key="product.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <img
                      v-if="product.primary_image"
                      :src="product.primary_image"
                      :alt="product.name"
                      class="h-10 w-10 rounded object-cover"
                    />
                    <div v-else class="h-10 w-10 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <Package class="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {{ product.name }}
                    </div>
                    <div v-if="product.brand_name" class="text-sm text-gray-500 dark:text-gray-400">
                      {{ product.brand_name }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-900 dark:text-gray-100 font-mono">
                  {{ product.sku }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {{ product.total_stock || 0 }}
                  </span>
                  <StockLevelIndicator :product="product" />
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ product.min_stock || 0 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {{ formatCurrency(calculateStockValue(product)) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <StockStatusBadge :product="product" />
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="viewProductMovements(product.id)"
                    class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    title="Ver movimientos"
                  >
                    <Activity class="w-4 h-4" />
                  </button>
                  <button
                    @click="$emit('view-product', product.id)"
                    class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                    title="Ver producto"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Stock Movements Modal -->
    <StockMovementsModal
      v-if="showStockMovements"
      :product-id="selectedProductId"
      @close="showStockMovements = false"
    />

    <!-- All Alerts Modal -->
    <div v-if="showAllAlerts" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-900 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Todas las Alertas de Stock
            </h3>
            <button
              @click="showAllAlerts = false"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X class="w-6 h-6" />
            </button>
          </div>

          <div class="space-y-4">
            <StockAlert
              v-for="alert in filteredAlerts"
              :key="`${alert.product_id}-${alert.warehouse_id}`"
              :alert="alert"
              @view-product="$emit('view-product', $event)"
              @view-movements="viewProductMovements"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Search,
  X,
  Package,
  AlertTriangle,
  XCircle,
  DollarSign,
  RefreshCw,
  Activity,
  Eye
} from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormInput from '@/components/forms/FormInput.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import StockAlert from './StockAlert.vue'
import StockLevelIndicator from './StockLevelIndicator.vue'
import StockStatusBadge from './StockStatusBadge.vue'
import StockMovementsModal from './StockMovementsModal.vue'
import { useProductStore } from '@/stores/product'
import { useAuthStore } from '@/stores/auth'
import type { ProductListItem, StockAlert as StockAlertType } from '@/services/product'

// Stores
const productStore = useProductStore()
const authStore = useAuthStore()

// Component state
const loading = ref(false)
const searchQuery = ref('')
const warehouseFilter = ref('')
const alertFilter = ref('')
const showStockMovements = ref(false)
const showAllAlerts = ref(false)
const selectedProductId = ref<string | null>(null)

// Search debounce
let searchTimeout: NodeJS.Timeout

const emit = defineEmits<{
  'view-product': [productId: string]
}>()

// Computed properties
const filteredProducts = computed(() => {
  let products = [...productStore.products]

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    products = products.filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query)
    )
  }

  // Apply alert filter
  if (alertFilter.value) {
    if (alertFilter.value === 'low_stock') {
      products = products.filter(p =>
        (p.total_stock || 0) <= (p.min_stock || 0) && (p.total_stock || 0) > 0
      )
    } else if (alertFilter.value === 'out_of_stock') {
      products = products.filter(p => (p.total_stock || 0) === 0)
    }
  }

  return products.sort((a, b) => {
    // Sort by stock status (alerts first)
    const aStock = a.total_stock || 0
    const aMin = a.min_stock || 0
    const bStock = b.total_stock || 0
    const bMin = b.min_stock || 0

    const aAlert = aStock === 0 ? 2 : (aStock <= aMin ? 1 : 0)
    const bAlert = bStock === 0 ? 2 : (bStock <= bMin ? 1 : 0)

    if (aAlert !== bAlert) {
      return bAlert - aAlert // Higher alert level first
    }

    return a.name.localeCompare(b.name)
  })
})

const filteredAlerts = computed(() => {
  return productStore.stockAlerts.filter(alert => {
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase().trim()
      return alert.product_name.toLowerCase().includes(query) ||
             alert.product_sku.toLowerCase().includes(query)
    }
    return true
  })
})

const totalProducts = computed(() => productStore.products.length)
const lowStockCount = computed(() => productStore.lowStockProducts.length)
const outOfStockCount = computed(() => productStore.outOfStockProducts.length)

const totalStockValue = computed(() => {
  return productStore.products.reduce((total, product) => {
    return total + calculateStockValue(product)
  }, 0)
})

// Options
const warehouseOptions = computed(() => [
  { value: '', label: 'Todos los almacenes' },
  // TODO: Add actual warehouses when available
])

const alertOptions = [
  { value: '', label: 'Todas las alertas' },
  { value: 'low_stock', label: 'Solo stock bajo' },
  { value: 'out_of_stock', label: 'Solo sin stock' }
]

// Methods
const handleSearch = (query: string) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    searchQuery.value = query
  }, 300)
}

const clearFilters = () => {
  searchQuery.value = ''
  warehouseFilter.value = ''
  alertFilter.value = ''
}

const calculateStockValue = (product: ProductListItem): number => {
  // TODO: Calculate based on actual cost when available
  // For now, return 0 as we don't have cost data
  return 0
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN'
  }).format(amount)
}

const viewProductMovements = (productId: string) => {
  selectedProductId.value = productId
  showStockMovements.value = true
}

const refreshData = async () => {
  loading.value = true
  try {
    await Promise.all([
      productStore.loadProducts(),
      productStore.loadStockAlerts()
    ])
  } catch (error) {
    console.error('Error refreshing data:', error)
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      productStore.loadProducts(),
      productStore.loadStockAlerts()
    ])
  } catch (error) {
    console.error('Error loading stock data:', error)
  } finally {
    loading.value = false
  }
})
</script>
