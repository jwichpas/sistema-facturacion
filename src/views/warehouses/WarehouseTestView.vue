<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-6">Prueba de Funcionalidades de Warehouse</h1>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Warehouses -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold mb-4">Almacenes</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Gestión completa de almacenes y zonas
        </p>
        <router-link
          to="/warehouses"
          class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Ver Almacenes
        </router-link>
      </div>

      <!-- Stock Transfers -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold mb-4">Transferencias</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Transferencias de stock entre almacenes
        </p>
        <router-link
          to="/warehouses/transfers"
          class="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Ver Transferencias
        </router-link>
      </div>

      <!-- 3D Visualization -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold mb-4">Visualización 3D</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Vista tridimensional interactiva
        </p>
        <router-link
          to="/warehouses/visualization"
          class="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          Ver Visualización
        </router-link>
      </div>
    </div>

    <!-- Store Status -->
    <div class="mt-8 bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
      <h3 class="text-lg font-semibold mb-4">Estado del Store</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 class="font-medium mb-2">Almacenes cargados:</h4>
          <p class="text-gray-600 dark:text-gray-400">{{ warehouses.length }}</p>
        </div>
        <div>
          <h4 class="font-medium mb-2">Transferencias cargadas:</h4>
          <p class="text-gray-600 dark:text-gray-400">{{ stockTransfers.length }}</p>
        </div>
        <div>
          <h4 class="font-medium mb-2">Vehículos disponibles:</h4>
          <p class="text-gray-600 dark:text-gray-400">{{ vehicles.length }}</p>
        </div>
        <div>
          <h4 class="font-medium mb-2">Conductores disponibles:</h4>
          <p class="text-gray-600 dark:text-gray-400">{{ drivers.length }}</p>
        </div>
      </div>

      <div class="mt-4">
        <button
          @click="loadTestData"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Cargar Datos de Prueba
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useWarehouseStore } from '@/stores/warehouse'

const warehouseStore = useWarehouseStore()

// Computed
const warehouses = computed(() => warehouseStore.warehouses || [])
const stockTransfers = computed(() => warehouseStore.stockTransfers || [])
const vehicles = computed(() => warehouseStore.vehicles || [])
const drivers = computed(() => warehouseStore.drivers || [])

// Methods
const loadTestData = async () => {
  try {
    await warehouseStore.initializeWarehouseData()
  } catch (error) {
    console.error('Error loading warehouse data:', error)
  }
}

// Lifecycle
onMounted(() => {
  loadTestData()
})
</script>
