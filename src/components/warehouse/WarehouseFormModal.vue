<template>
  <div class="fixed inset-0 z-50 overflow-y-auto bg-black/75">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="relative inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="$emit('close')"></div>

      <span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

      <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <form @submit.prevent="handleSubmit">
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                  {{ isEdit ? 'Editar Almacén' : 'Nuevo Almacén' }}
                </h3>

                <div class="space-y-4">
                  <!-- Code -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Código *
                    </label>
                    <input
                      v-model="form.code"
                      type="text"
                      required
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Ej: ALM001"
                    />
                  </div>

                  <!-- Name -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre *
                    </label>
                    <input
                      v-model="form.name"
                      type="text"
                      required
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Nombre del almacén"
                    />
                  </div>

                  <!-- Branch -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sucursal
                    </label>
                    <select
                      v-model="form.branch_id"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Sin sucursal específica</option>
                      <!-- TODO: Add branch options -->
                    </select>
                  </div>

                  <!-- Dimensions -->
                  <div class="grid grid-cols-3 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Ancho (m) *
                      </label>
                      <input
                        v-model.number="form.width"
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
                        v-model.number="form.height"
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
                        v-model.number="form.length"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <!-- Volume Display -->
                  <div v-if="calculatedVolume > 0" class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                    <p class="text-sm text-blue-700 dark:text-blue-300">
                      Volumen total: <strong>{{ calculatedVolume.toFixed(2) }} m³</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              :disabled="loading"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              <span v-if="loading" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
              {{ isEdit ? 'Actualizar' : 'Crear' }}
            </button>
            <button
              type="button"
              @click="$emit('close')"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useWarehouseStore } from '@/stores/warehouse'
import { useAuthStore } from '@/stores/auth'
import type { WarehouseWithDetails, WarehouseInsert, WarehouseUpdate } from '@/services/warehouse'

interface Props {
  warehouse?: WarehouseWithDetails | null
  isEdit?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'saved'): void
}

const props = withDefaults(defineProps<Props>(), {
  warehouse: null,
  isEdit: false,
})

const emit = defineEmits<Emits>()

const warehouseStore = useWarehouseStore()
const authStore = useAuthStore()

// State
const loading = ref(false)

const form = reactive({
  code: '',
  name: '',
  branch_id: null as string | null,
  width: 0,
  height: 0,
  length: 0,
})

// Computed
const calculatedVolume = computed(() => {
  return form.width * form.height * form.length
})

// Methods
const initializeForm = () => {
  if (props.warehouse && props.isEdit) {
    form.code = props.warehouse.code
    form.name = props.warehouse.name
    form.branch_id = props.warehouse.branch_id
    form.width = props.warehouse.width
    form.height = props.warehouse.height
    form.length = props.warehouse.length
  } else {
    // Reset form for new warehouse
    form.code = ''
    form.name = ''
    form.branch_id = null
    form.width = 0
    form.height = 0
    form.length = 0
  }
}

const handleSubmit = async () => {
  try {
    loading.value = true

    if (props.isEdit && props.warehouse) {
      const updateData: WarehouseUpdate = {
        code: form.code,
        name: form.name,
        branch_id: form.branch_id,
        width: form.width,
        height: form.height,
        length: form.length,
      }
      await warehouseStore.updateWarehouse(props.warehouse.id, updateData)
    } else {
      const createData: WarehouseInsert = {
        company_id: authStore.currentCompany?.id || '',
        code: form.code,
        name: form.name,
        branch_id: form.branch_id,
        width: form.width,
        height: form.height,
        length: form.length,
      }
      await warehouseStore.createWarehouse(createData)
    }

    emit('saved')
  } catch (error) {
    console.error('Error saving warehouse:', error)
  } finally {
    loading.value = false
  }
}

// Watchers
watch(
  () => props.warehouse,
  () => {
    initializeForm()
  },
  { immediate: true }
)

// Initialize form on mount
initializeForm()
</script>
