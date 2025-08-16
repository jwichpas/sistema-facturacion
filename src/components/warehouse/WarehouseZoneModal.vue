<template>
  <div class="fixed inset-0 z-50 overflow-y-auto bg-gray-950/75">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="relative inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="$emit('close')"></div>

      <span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

      <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
        <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6">
          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Gestión de Zonas - {{ warehouse?.name }}
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Código: {{ warehouse?.code }}
              </p>
            </div>
            <button
              @click="showZoneForm = true"
              class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus class="h-4 w-4 mr-1" />
              Nueva Zona
            </button>
          </div>

          <!-- Warehouse Info -->
          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span class="text-gray-500 dark:text-gray-400">Dimensiones:</span>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ warehouse?.width }}×{{ warehouse?.height }}×{{ warehouse?.length }}m
                </p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Volumen Total:</span>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ warehouse?.total_volume?.toFixed(2) }} m³
                </p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Zonas:</span>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ zones.length }}
                </p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Capacidad Total:</span>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ totalCapacity.toFixed(0) }} kg
                </p>
              </div>
            </div>
          </div>

          <!-- Zone Form -->
          <div v-if="showZoneForm" class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">
              {{ editingZone ? 'Editar Zona' : 'Nueva Zona' }}
            </h4>
            <form @submit.prevent="handleZoneSubmit" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Código *
                  </label>
                  <input
                    v-model="zoneForm.code"
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Ej: Z001"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre
                  </label>
                  <input
                    v-model="zoneForm.name"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Nombre de la zona"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ancho (m) *
                  </label>
                  <input
                    v-model.number="zoneForm.width"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Alto (m) *
                  </label>
                  <input
                    v-model.number="zoneForm.height"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Largo (m) *
                  </label>
                  <input
                    v-model.number="zoneForm.length"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Capacidad (kg)
                  </label>
                  <input
                    v-model.number="zoneForm.capacity_kg"
                    type="number"
                    min="0"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div v-if="zoneVolume > 0" class="bg-white dark:bg-gray-800 p-3 rounded-md border">
                <p class="text-sm text-gray-700 dark:text-gray-300">
                  Volumen de la zona: <strong>{{ zoneVolume.toFixed(2) }} m³</strong>
                </p>
              </div>

              <div class="flex justify-end space-x-3">
                <button
                  type="button"
                  @click="cancelZoneForm"
                  class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  :disabled="zoneLoading"
                  class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <span v-if="zoneLoading" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  {{ editingZone ? 'Actualizar' : 'Crear' }}
                </button>
              </div>
            </form>
          </div>

          <!-- Zones List -->
          <div class="space-y-4">
            <h4 class="text-md font-medium text-gray-900 dark:text-white">
              Zonas del Almacén
            </h4>

            <div v-if="loading" class="flex justify-center py-8">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>

            <div v-else-if="zones.length === 0" class="text-center py-8">
              <p class="text-gray-500 dark:text-gray-400">
                No hay zonas configuradas para este almacén
              </p>
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="zone in zones"
                :key="zone.id"
                class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4"
              >
                <div class="flex items-center justify-between mb-3">
                  <div>
                    <h5 class="font-medium text-gray-900 dark:text-white">
                      {{ zone.name || zone.code }}
                    </h5>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {{ zone.code }}
                    </p>
                  </div>
                  <div class="flex space-x-2">
                    <button
                      @click="editZone(zone)"
                      class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <Edit class="h-4 w-4" />
                    </button>
                    <button
                      @click="deleteZone(zone)"
                      class="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-500 dark:text-gray-400">Dimensiones:</span>
                    <span class="text-gray-900 dark:text-white">
                      {{ zone.width }}×{{ zone.height }}×{{ zone.length }}m
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500 dark:text-gray-400">Volumen:</span>
                    <span class="text-gray-900 dark:text-white">
                      {{ (zone.width * zone.height * zone.length).toFixed(2) }} m³
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500 dark:text-gray-400">Capacidad:</span>
                    <span class="text-gray-900 dark:text-white">
                      {{ zone.capacity_kg?.toFixed(0) || 0 }} kg
                    </span>
                  </div>
                </div>

                <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-500 dark:text-gray-400">Utilización:</span>
                    <div class="flex items-center space-x-2">
                      <div class="w-12 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                        <div
                          class="bg-green-600 h-1.5 rounded-full"
                          :style="{ width: `${zone.utilization_percentage || 0}%` }"
                        ></div>
                      </div>
                      <span class="text-sm text-gray-900 dark:text-white">
                        {{ zone.utilization_percentage?.toFixed(0) || 0 }}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            @click="$emit('close')"
            class="w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useWarehouseStore } from '@/stores/warehouse'
import { useAuthStore } from '@/stores/auth'
import type { WarehouseWithDetails, WarehouseZoneWithDetails, WarehouseZoneInsert, WarehouseZoneUpdate } from '@/services/warehouse'
import {
  Plus,
  Edit,
  Trash2,
} from 'lucide-vue-next'

interface Props {
  warehouse: WarehouseWithDetails | null
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const warehouseStore = useWarehouseStore()
const authStore = useAuthStore()

// State
const showZoneForm = ref(false)
const zoneLoading = ref(false)
const editingZone = ref<WarehouseZoneWithDetails | null>(null)

const zoneForm = reactive({
  code: '',
  name: '',
  width: 0,
  height: 0,
  length: 0,
  capacity_kg: null as number | null,
})

// Computed
const warehouseZones = computed(() => warehouseStore.warehouseZones || [])
const loading = computed(() => warehouseStore.loading)

const zones = computed(() =>
  warehouseZones.value.filter(zone => zone.warehouse_id === props.warehouse?.id)
)

const totalCapacity = computed(() =>
  zones.value.reduce((sum, zone) => sum + (zone.capacity_kg || 0), 0)
)

const zoneVolume = computed(() => {
  return zoneForm.width * zoneForm.height * zoneForm.length
})

// Methods
const loadZones = async () => {
  if (props.warehouse) {
    await warehouseStore.fetchWarehouseZones({ warehouseId: props.warehouse.id })
  }
}

const resetZoneForm = () => {
  zoneForm.code = ''
  zoneForm.name = ''
  zoneForm.width = 0
  zoneForm.height = 0
  zoneForm.length = 0
  zoneForm.capacity_kg = null
  editingZone.value = null
}

const editZone = (zone: WarehouseZoneWithDetails) => {
  editingZone.value = zone
  zoneForm.code = zone.code
  zoneForm.name = zone.name || ''
  zoneForm.width = zone.width
  zoneForm.height = zone.height
  zoneForm.length = zone.length
  zoneForm.capacity_kg = zone.capacity_kg
  showZoneForm.value = true
}

const cancelZoneForm = () => {
  showZoneForm.value = false
  resetZoneForm()
}

const handleZoneSubmit = async () => {
  if (!props.warehouse) return

  try {
    zoneLoading.value = true

    if (editingZone.value) {
      const updateData: WarehouseZoneUpdate = {
        code: zoneForm.code,
        name: zoneForm.name || null,
        width: zoneForm.width,
        height: zoneForm.height,
        length: zoneForm.length,
        capacity_kg: zoneForm.capacity_kg,
      }
      await warehouseStore.updateWarehouseZone(editingZone.value.id, updateData)
    } else {
      const createData: WarehouseZoneInsert = {
        company_id: authStore.currentCompany?.id || '',
        warehouse_id: props.warehouse.id,
        code: zoneForm.code,
        name: zoneForm.name || null,
        width: zoneForm.width,
        height: zoneForm.height,
        length: zoneForm.length,
        capacity_kg: zoneForm.capacity_kg,
      }
      await warehouseStore.createWarehouseZone(createData)
    }

    showZoneForm.value = false
    resetZoneForm()
    await loadZones()
  } catch (error) {
    console.error('Error saving zone:', error)
  } finally {
    zoneLoading.value = false
  }
}

const deleteZone = async (zone: WarehouseZoneWithDetails) => {
  if (confirm(`¿Estás seguro de que deseas eliminar la zona "${zone.name || zone.code}"?`)) {
    try {
      await warehouseStore.deleteWarehouseZone(zone.id)
      await loadZones()
    } catch (error) {
      console.error('Error deleting zone:', error)
    }
  }
}

// Lifecycle
onMounted(() => {
  loadZones()
})
</script>
