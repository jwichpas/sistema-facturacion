<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white dark:bg-gray-900 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Movimientos de Stock
            </h3>
            <p v-if="selectedProduct" class="text-sm text-gray-600 dark:text-gray-400">
              {{ selectedProduct.name }} ({{ selectedProduct.sku }})
            </p>
          </div>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex-1">
            <FormSelect
              name="operation_filter"
              :model-value="operationFilter"
              :options="operationOptions"
              @update:model-value="operationFilter = $event"
            />
          </div>
          <div class="flex-1">
            <FormInput
              name="date_from"
              type="date"
              label="Desde"
              :model-value="dateFrom"
              @update:model-value="dateFrom = $event"
            />
          </div>
          <div class="flex-1">
            <FormInput
              name="date_to"
              type="date"
              label="Hasta"
              :model-value="dateTo"
              @update:model-value="dateTo = $event"
            />
          </div>
          <div class="flex items-end">
            <BaseButton variant="outline" @click="clearFilters">
              <X class="w-4 h-4 mr-1" />
              Limpiar
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto">
        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span class="ml-2 text-gray-600 dark:text-gray-400">Cargando movimientos...</span>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredMovements.length === 0" class="text-center py-12">
          <Activity class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            No hay movimientos
          </h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No se encontraron movimientos para los filtros seleccionados.
          </p>
        </div>

        <!-- Movements List -->
        <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
          <div
            v-for="movement in filteredMovements"
            :key="movement.id"
            class="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <!-- Movement Type Icon -->
                <div
                  :class="[
                    'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                    getMovementTypeClass(movement)
                  ]"
                >
                  <component :is="getMovementIcon(movement)" class="w-5 h-5" />
                </div>

                <!-- Movement Details -->
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-gray-900 dark:text-gray-100">
                      {{ getMovementTypeLabel(movement) }}
                    </span>
                    <span
                      :class="[
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        getMovementBadgeClass(movement)
                      ]"
                    >
                      {{ getMovementDirection(movement) }}
                    </span>
                  </div>

                  <div class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <span>{{ formatDate(movement.movement_date) }}</span>
                    <span v-if="movement.ref_doc_type" class="ml-2">
                      • {{ movement.ref_doc_type }} {{ movement.ref_doc_series }}-{{ movement.ref_doc_number }}
                    </span>
                    <span v-if="movement.warehouse?.name" class="ml-2">
                      • {{ movement.warehouse.name }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Movement Quantities -->
              <div class="text-right">
                <div class="flex items-center gap-4">
                  <div v-if="movement.qty_in && movement.qty_in > 0" class="text-green-600 dark:text-green-400">
                    <span class="text-sm">+{{ movement.qty_in }}</span>
                    <span v-if="movement.unit_cost_in" class="text-xs ml-1">
                      ({{ formatCurrency(movement.unit_cost_in) }})
                    </span>
                  </div>

                  <div v-if="movement.qty_out && movement.qty_out > 0" class="text-red-600 dark:text-red-400">
                    <span class="text-sm">-{{ movement.qty_out }}</span>
                    <span v-if="movement.unit_cost_out" class="text-xs ml-1">
                      ({{ formatCurrency(movement.unit_cost_out) }})
                    </span>
                  </div>

                  <div class="text-gray-900 dark:text-gray-100">
                    <span class="text-sm font-medium">{{ movement.balance_qty }}</span>
                    <span class="text-xs text-gray-500 dark:text-gray-400 ml-1">saldo</span>
                  </div>
                </div>

                <div v-if="movement.balance_total_cost" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Valor: {{ formatCurrency(movement.balance_total_cost) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            {{ filteredMovements.length }} movimientos encontrados
          </div>
          <BaseButton @click="$emit('close')">
            Cerrar
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  X,
  Activity,
  ArrowUp,
  ArrowDown,
  Package,
  ShoppingCart,
  Truck,
  RotateCcw
} from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormInput from '@/components/forms/FormInput.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import { useProductStore } from '@/stores/product'
import type { StockMovement, ProductListItem } from '@/services/product'

interface Props {
  productId?: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

// Stores
const productStore = useProductStore()

// Component state
const loading = ref(false)
const movements = ref<StockMovement[]>([])
const operationFilter = ref('')
const dateFrom = ref('')
const dateTo = ref('')

// Computed properties
const selectedProduct = computed(() => {
  if (!props.productId) return null
  return productStore.products.find(p => p.id === props.productId) || null
})

const filteredMovements = computed(() => {
  let filtered = [...movements.value]

  if (operationFilter.value) {
    filtered = filtered.filter(m => m.operation_type === operationFilter.value)
  }

  if (dateFrom.value) {
    filtered = filtered.filter(m => m.movement_date >= dateFrom.value)
  }

  if (dateTo.value) {
    filtered = filtered.filter(m => m.movement_date <= dateTo.value)
  }

  return filtered.sort((a, b) =>
    new Date(b.movement_date).getTime() - new Date(a.movement_date).getTime()
  )
})

// Options
const operationOptions = [
  { value: '', label: 'Todos los tipos' },
  { value: 'PURCHASE', label: 'Compra' },
  { value: 'SALE', label: 'Venta' },
  { value: 'ADJUSTMENT', label: 'Ajuste' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'RETURN', label: 'Devolución' }
]

// Methods
const loadMovements = async () => {
  if (!props.productId) return

  loading.value = true
  try {
    await productStore.loadStockMovements()
    movements.value = productStore.stockMovements.filter(m => m.product_id === props.productId)
  } catch (error) {
    console.error('Error loading movements:', error)
  } finally {
    loading.value = false
  }
}

const clearFilters = () => {
  operationFilter.value = ''
  dateFrom.value = ''
  dateTo.value = ''
}

const getMovementIcon = (movement: StockMovement) => {
  switch (movement.operation_type) {
    case 'PURCHASE':
      return Truck
    case 'SALE':
      return ShoppingCart
    case 'ADJUSTMENT':
      return RotateCcw
    case 'TRANSFER':
      return Package
    default:
      return movement.qty_in && movement.qty_in > 0 ? ArrowUp : ArrowDown
  }
}

const getMovementTypeClass = (movement: StockMovement) => {
  const isInbound = movement.qty_in && movement.qty_in > 0
  return isInbound
    ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
    : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
}

const getMovementBadgeClass = (movement: StockMovement) => {
  const isInbound = movement.qty_in && movement.qty_in > 0
  return isInbound
    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
}

const getMovementTypeLabel = (movement: StockMovement) => {
  switch (movement.operation_type) {
    case 'PURCHASE':
      return 'Compra'
    case 'SALE':
      return 'Venta'
    case 'ADJUSTMENT':
      return 'Ajuste de Inventario'
    case 'TRANSFER':
      return 'Transferencia'
    case 'RETURN':
      return 'Devolución'
    default:
      return 'Movimiento'
  }
}

const getMovementDirection = (movement: StockMovement) => {
  return movement.qty_in && movement.qty_in > 0 ? 'Entrada' : 'Salida'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN'
  }).format(amount)
}

// Watchers
watch(() => props.productId, () => {
  if (props.productId) {
    loadMovements()
  }
}, { immediate: true })

// Lifecycle
onMounted(() => {
  if (props.productId) {
    loadMovements()
  }
})
</script>
