<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
          Almacenes
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gestiona los almacenes y sus configuraciones
        </p>
      </div>
      <button
        @click="showCreateModal = true"
        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Plus class="h-4 w-4 mr-2" />
        Nuevo Almacén
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Buscar
          </label>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Buscar por nombre o código..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sucursal
          </label>
          <select
            v-model="filters.branchId"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Todas las sucursales</option>
            <!-- TODO: Add branch options -->
          </select>
        </div>
        <div class="flex items-end">
          <button
            @click="loadWarehouses"
            :disabled="loading"
            class="w-full px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
          >
            <Search class="h-4 w-4 mx-auto" />
          </button>
        </div>
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
            Error al cargar almacenes
          </h3>
          <p class="mt-1 text-sm text-red-700 dark:text-red-300">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Warehouses Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="warehouse in warehouses"
        :key="warehouse.id"
        class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
      >
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <Warehouse class="h-8 w-8 text-blue-600" />
              <div class="ml-3">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                  {{ warehouse.name }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ warehouse.code }}
                </p>
              </div>
            </div>
            <div class="flex space-x-2">
              <button
                @click="editWarehouse(warehouse)"
                class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <Edit class="h-4 w-4" />
              </button>
              <button
                @click="deleteWarehouse(warehouse)"
                class="p-2 text-gray-400 hover:text-red-600"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">Dimensiones:</span>
              <span class="text-gray-900 dark:text-white">
                {{ warehouse.width }}×{{ warehouse.height }}×{{ warehouse.length }}m
              </span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">Volumen:</span>
              <span class="text-gray-900 dark:text-white">
                {{ warehouse.total_volume?.toFixed(2) }} m³
              </span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">Zonas:</span>
              <span class="text-gray-900 dark:text-white">
                {{ warehouse.zones?.length || 0 }}
              </span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">Capacidad:</span>
              <span class="text-gray-900 dark:text-white">
                {{ warehouse.total_capacity_kg?.toFixed(0) || 0 }} kg
              </span>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-500 dark:text-gray-400">Utilización:</span>
              <div class="flex items-center space-x-2">
                <div class="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    class="bg-blue-600 h-2 rounded-full"
                    :style="{ width: `${warehouse.utilization_percentage || 0}%` }"
                  ></div>
                </div>
                <span class="text-sm text-gray-900 dark:text-white">
                  {{ warehouse.utilization_percentage?.toFixed(0) || 0 }}%
                </span>
              </div>
            </div>
          </div>

          <div class="mt-4 flex space-x-2">
            <button
              @click="viewWarehouse(warehouse)"
              class="flex-1 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40"
            >
              Ver Detalles
            </button>
            <button
              @click="manageZones(warehouse)"
              class="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Gestionar Zonas
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <WarehouseFormModal
      v-if="showCreateModal || showEditModal"
      :warehouse="selectedWarehouse"
      :is-edit="showEditModal"
      @close="closeModals"
      @saved="handleWarehouseSaved"
    />

    <!-- Zone Management Modal -->
    <WarehouseZoneModal
      v-if="showZoneModal"
      :warehouse="selectedWarehouse"
      @close="showZoneModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { useWarehouseStore } from '@/stores/warehouse'
import type { WarehouseWithDetails, WarehouseFilters } from '@/services/warehouse'
import {
  Plus,
  Warehouse,
  Edit,
  Trash2,
  Search,
  AlertTriangle,
} from 'lucide-vue-next'
import WarehouseFormModal from './WarehouseFormModal.vue'
import WarehouseZoneModal from './WarehouseZoneModal.vue'

const warehouseStore = useWarehouseStore()

// State
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showZoneModal = ref(false)
const selectedWarehouse = ref<WarehouseWithDetails | null>(null)

const filters = reactive<WarehouseFilters>({
  search: '',
  branchId: null,
})

// Computed
const warehouses = computed(() => warehouseStore.warehouses || [])
const loading = computed(() => warehouseStore.loading)
const error = computed(() => warehouseStore.error)

// Methods
const loadWarehouses = async () => {
  await warehouseStore.fetchWarehouses(filters)
}

const editWarehouse = (warehouse: WarehouseWithDetails) => {
  selectedWarehouse.value = warehouse
  showEditModal.value = true
}

const deleteWarehouse = async (warehouse: WarehouseWithDetails) => {
  if (confirm(`¿Estás seguro de que deseas eliminar el almacén "${warehouse.name}"?`)) {
    try {
      await warehouseStore.deleteWarehouse(warehouse.id)
    } catch (error) {
      console.error('Error deleting warehouse:', error)
    }
  }
}

const viewWarehouse = (warehouse: WarehouseWithDetails) => {
  // TODO: Navigate to warehouse detail view
  console.log('View warehouse:', warehouse)
}

const manageZones = (warehouse: WarehouseWithDetails) => {
  selectedWarehouse.value = warehouse
  showZoneModal.value = true
}

const closeModals = () => {
  showCreateModal.value = false
  showEditModal.value = false
  selectedWarehouse.value = null
}

const handleWarehouseSaved = () => {
  closeModals()
  loadWarehouses()
}

// Watchers
watch(
  () => filters.search,
  () => {
    if (!filters.search || filters.search.length === 0 || filters.search.length >= 3) {
      loadWarehouses()
    }
  },
  { flush: 'post' }
)

// Lifecycle
onMounted(() => {
  loadWarehouses()
})
</script>
