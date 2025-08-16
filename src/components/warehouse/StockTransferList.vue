<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
          Transferencias de Stock
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gestiona las transferencias entre almacenes
        </p>
      </div>
      <button
        @click="showCreateModal = true"
        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Plus class="h-4 w-4 mr-2" />
        Nueva Transferencia
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Almacén Origen
          </label>
          <select
            v-model="filters.fromWarehouseId"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Todos los almacenes</option>
            <option
              v-for="warehouse in warehouseOptions"
              :key="warehouse.value"
              :value="warehouse.value"
            >
              {{ warehouse.label }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Almacén Destino
          </label>
          <select
            v-model="filters.toWarehouseId"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Todos los almacenes</option>
            <option
              v-for="warehouse in warehouseOptions"
              :key="warehouse.value"
              :value="warehouse.value"
            >
              {{ warehouse.label }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fecha Desde
          </label>
          <input
            v-model="filters.dateFrom"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fecha Hasta
          </label>
          <input
            v-model="filters.dateTo"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>
      <div class="mt-4 flex justify-end">
        <button
          @click="loadTransfers"
          :disabled="loading"
          class="px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
        >
          <Search class="h-4 w-4 mx-auto" />
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
      <div class="flex">
        <AlertTriangle class="h-5 w-5 text-red-400" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
            Error al cargar transferencias
          </h3>
          <p class="mt-1 text-sm text-red-700 dark:text-red-300">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Transfers Table -->
    <div v-else class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Fecha
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Origen → Destino
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Motivo
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Items
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Vehículo
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Conductor
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-if="stockTransfers.length === 0">
              <td colspan="7" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                No se encontraron transferencias
              </td>
            </tr>
            <tr
              v-for="transfer in stockTransfers"
              :key="transfer.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ formatDate(transfer.transfer_date) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">
                  {{ transfer.from_warehouse?.name }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                  <ArrowRight class="h-3 w-3 mx-1" />
                  {{ transfer.to_warehouse?.name }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ transfer.reason || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">
                  {{ transfer.total_items }} items
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ transfer.total_quantity }} unidades
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ transfer.vehicle?.plate || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ transfer.driver?.party?.fullname || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end space-x-2">
                  <button
                    @click="viewTransfer(transfer)"
                    class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <Eye class="h-4 w-4" />
                  </button>
                  <button
                    @click="deleteTransfer(transfer)"
                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Transfer Modal -->
    <StockTransferFormModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @saved="handleTransferSaved"
    />

    <!-- View Transfer Modal -->
    <StockTransferViewModal
      v-if="showViewModal"
      :transfer="selectedTransfer"
      @close="showViewModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useWarehouseStore } from '@/stores/warehouse'
import type { StockTransferWithDetails, StockTransferFilters } from '@/services/warehouse'
import {
  Plus,
  Search,
  AlertTriangle,
  ArrowRight,
  Eye,
  Trash2,
} from 'lucide-vue-next'
import StockTransferFormModal from './StockTransferFormModal.vue'
import StockTransferViewModal from './StockTransferViewModal.vue'

const warehouseStore = useWarehouseStore()

// State
const showCreateModal = ref(false)
const showViewModal = ref(false)
const selectedTransfer = ref<StockTransferWithDetails | null>(null)

const filters = reactive<StockTransferFilters>({
  fromWarehouseId: '',
  toWarehouseId: '',
  dateFrom: '',
  dateTo: '',
})

// Computed
const stockTransfers = computed(() => warehouseStore.stockTransfers || [])
const loading = computed(() => warehouseStore.loading)
const error = computed(() => warehouseStore.error)
const warehouseOptions = computed(() => warehouseStore.warehouseOptions || [])

// Methods
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-PE')
}

const loadTransfers = async () => {
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => value !== '')
  )
  await warehouseStore.fetchStockTransfers(cleanFilters)
}

const viewTransfer = async (transfer: StockTransferWithDetails) => {
  selectedTransfer.value = await warehouseStore.fetchStockTransfer(transfer.id)
  showViewModal.value = true
}

const deleteTransfer = async (transfer: StockTransferWithDetails) => {
  if (confirm(`¿Estás seguro de que deseas eliminar esta transferencia?`)) {
    try {
      await warehouseStore.deleteStockTransfer(transfer.id)
    } catch (error) {
      console.error('Error deleting transfer:', error)
    }
  }
}

const handleTransferSaved = () => {
  showCreateModal.value = false
  loadTransfers()
}

// Lifecycle
onMounted(async () => {
  await warehouseStore.initializeWarehouseData()
  loadTransfers()
})
</script>
