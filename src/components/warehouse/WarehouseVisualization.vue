<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
          Visualización 3D de Almacenes
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Vista tridimensional interactiva de los almacenes y sus zonas
        </p>
      </div>
    </div>

    <!-- Warehouse Selector -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Seleccionar Almacén
          </label>
          <select v-model="selectedWarehouseId"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
            <option value="">Seleccionar almacén</option>
            <option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
              {{ warehouse.code }} - {{ warehouse.name }}
            </option>
          </select>
        </div>



        <div v-if="selectedWarehouse" class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Información del Almacén
          </label>
          <div class="bg-gray-50 dark:bg-gray-700 rounded-md p-3">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span class="text-gray-500 dark:text-gray-400">Dimensiones:</span>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ selectedWarehouse.width }}×{{ selectedWarehouse.height }}×{{ selectedWarehouse.length }}m
                </p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Volumen:</span>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ selectedWarehouse.total_volume?.toFixed(2) }} m³
                </p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Zonas:</span>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ warehouseZones.length }}
                </p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Utilización:</span>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ selectedWarehouse.utilization_percentage?.toFixed(0) || 0 }}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3D Viewer -->
    <div v-if="selectedWarehouse" class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div class="h-96 md:h-[600px]">
        <WarehouseViewer3D :warehouse="selectedWarehouse" :zones="warehouseZones" />
      </div>
    </div>

    <!-- No Warehouse Selected -->
    <div v-else class="bg-white dark:bg-gray-800 shadow rounded-lg p-8">
      <div class="text-center">
        <Warehouse class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          No hay almacén seleccionado
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Selecciona un almacén para ver su visualización 3D
        </p>


      </div>
    </div>

    <!-- Zone Statistics -->
    <div v-if="selectedWarehouse && warehouseZones.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-md flex items-center justify-center">
              <Box class="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Zonas</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">
              {{ warehouseZones.length }}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-md flex items-center justify-center">
              <Scale class="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Capacidad Total</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">
              {{ totalCapacity.toFixed(0) }} kg
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-md flex items-center justify-center">
              <BarChart3 class="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Utilización Promedio</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">
              {{ averageUtilization.toFixed(0) }}%
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-md flex items-center justify-center">
              <AlertTriangle class="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Zonas Críticas</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">
              {{ criticalZones }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Zone List -->
    <div v-if="selectedWarehouse && warehouseZones.length > 0" class="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
          Zonas del Almacén
        </h3>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Zona
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Dimensiones
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Volumen
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Capacidad
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Utilización
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="zone in warehouseZones" :key="zone.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ zone.name || zone.code }}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {{ zone.code }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ zone.width }}×{{ zone.height }}×{{ zone.length }}m
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ (zone.width * zone.height * zone.length).toFixed(2) }} m³
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ zone.capacity_kg?.toFixed(0) || 0 }} kg
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-1 mr-2">
                      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div class="h-2 rounded-full" :class="{
                          'bg-red-600': (zone.utilization_percentage || 0) > 80,
                          'bg-yellow-600': (zone.utilization_percentage || 0) > 50 && (zone.utilization_percentage || 0) <= 80,
                          'bg-blue-600': (zone.utilization_percentage || 0) <= 50 && (zone.utilization_percentage || 0) > 0,
                          'bg-gray-400': (zone.utilization_percentage || 0) === 0
                        }" :style="{ width: `${zone.utilization_percentage || 0}%` }"></div>
                      </div>
                    </div>
                    <span class="text-sm text-gray-900 dark:text-white">
                      {{ zone.utilization_percentage?.toFixed(0) || 0 }}%
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useWarehouseStore } from '@/stores/warehouse'
import type { WarehouseWithDetails, WarehouseZoneWithDetails } from '@/services/warehouse'
import {
  Warehouse,
  Box,
  Scale,
  BarChart3,
  AlertTriangle,
} from 'lucide-vue-next'
import WarehouseViewer3D from './WarehouseViewer3D.vue'

const warehouseStore = useWarehouseStore()

// State
const selectedWarehouseId = ref('')

// Computed - Access store properties directly for better reactivity
const warehouses = computed(() => warehouseStore.warehouses || [])
const allWarehouseZones = computed(() => warehouseStore.warehouseZones || [])
const loading = computed(() => warehouseStore.loading)
const error = computed(() => warehouseStore.error)

const selectedWarehouse = computed(() => {
  if (!warehouses.value.length || !selectedWarehouseId.value) return null
  return warehouses.value.find(w => w.id === selectedWarehouseId.value) || null
})

const warehouseZones = computed(() => {
  if (!allWarehouseZones.value || !selectedWarehouseId.value) return []
  return allWarehouseZones.value.filter(zone => zone.warehouse_id === selectedWarehouseId.value)
})

const totalCapacity = computed(() => {
  if (!warehouseZones.value) return 0
  return warehouseZones.value.reduce((sum, zone) => sum + (zone.capacity_kg || 0), 0)
})

const averageUtilization = computed(() => {
  if (!warehouseZones.value || warehouseZones.value.length === 0) return 0
  const total = warehouseZones.value.reduce((sum, zone) => sum + (zone.utilization_percentage || 0), 0)
  return total / warehouseZones.value.length
})

const criticalZones = computed(() => {
  if (!warehouseZones.value) return 0
  return warehouseZones.value.filter(zone => (zone.utilization_percentage || 0) > 80).length
})

// Methods
const loadData = async () => {
  try {
    await warehouseStore.initializeWarehouseData()
  } catch (error) {
    console.error('Error loading warehouse data:', error)
  }
}

// Watchers
watch(selectedWarehouseId, async (newId) => {
  if (newId) {
    try {
      await warehouseStore.fetchWarehouseZones({ warehouseId: newId })
    } catch (error) {
      console.error('Error loading warehouse zones:', error)
    }
  }
})

// Lifecycle
onMounted(async () => {
  await loadData()
})
</script>
