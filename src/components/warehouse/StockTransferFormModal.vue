<template>
  <div class="fixed inset-0 z-50 overflow-y-auto bg-black/75">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="relative inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="$emit('close')"></div>

      <span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

      <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
        <form @submit.prevent="handleSubmit">
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6">
            <div class="mb-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Nueva Transferencia de Stock
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Transfiere productos entre almacenes
              </p>
            </div>

            <div class="space-y-6">
              <!-- Transfer Details -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Almacén Origen *
                  </label>
                  <select
                    v-model="form.from_warehouse_id"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Seleccionar almacén</option>
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
                    Almacén Destino *
                  </label>
                  <select
                    v-model="form.to_warehouse_id"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Seleccionar almacén</option>
                    <option
                      v-for="warehouse in availableDestinationWarehouses"
                      :key="warehouse.value"
                      :value="warehouse.value"
                    >
                      {{ warehouse.label }}
                    </option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha de Transferencia *
                  </label>
                  <input
                    v-model="form.transfer_date"
                    type="date"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Motivo
                  </label>
                  <input
                    v-model="form.reason"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Motivo de la transferencia"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Modalidad
                  </label>
                  <select
                    v-model="form.modality"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Seleccionar modalidad</option>
                    <option value="TRANSPORTE_PUBLICO">Transporte Público</option>
                    <option value="TRANSPORTE_PRIVADO">Transporte Privado</option>
                    <option value="TRASLADO_INTERNO">Traslado Interno</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vehículo
                  </label>
                  <select
                    v-model="form.vehicle_id"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Sin vehículo específico</option>
                    <option
                      v-for="vehicle in vehicleOptions"
                      :key="vehicle.value"
                      :value="vehicle.value"
                    >
                      {{ vehicle.label }}
                    </option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Conductor
                  </label>
                  <select
                    v-model="form.driver_id"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Sin conductor específico</option>
                    <option
                      v-for="driver in driverOptions"
                      :key="driver.value"
                      :value="driver.value"
                    >
                      {{ driver.label }}
                    </option>
                  </select>
                </div>

                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notas
                  </label>
                  <textarea
                    v-model="form.notes"
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Notas adicionales sobre la transferencia"
                  ></textarea>
                </div>
              </div>

              <!-- Transfer Items -->
              <div>
                <div class="flex items-center justify-between mb-4">
                  <h4 class="text-md font-medium text-gray-900 dark:text-white">
                    Productos a Transferir
                  </h4>
                  <button
                    type="button"
                    @click="addItem"
                    class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-900 dark:text-blue-200"
                  >
                    <Plus class="h-4 w-4 mr-1" />
                    Agregar Producto
                  </button>
                </div>

                <div v-if="form.items.length === 0" class="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <p class="text-gray-500 dark:text-gray-400">
                    No hay productos agregados. Haz clic en "Agregar Producto" para comenzar.
                  </p>
                </div>

                <div v-else class="space-y-4">
                  <div
                    v-for="(item, index) in form.items"
                    :key="index"
                    class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                  >
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Producto *
                        </label>
                        <ProductSelector
                          v-model="item.product_id"
                          :warehouse-id="form.from_warehouse_id"
                          @update:model-value="updateItemProduct(index, $event)"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Cantidad *
                        </label>
                        <input
                          v-model.number="item.quantity"
                          type="number"
                          min="0.01"
                          step="0.01"
                          required
                          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div class="flex items-end">
                        <button
                          type="button"
                          @click="removeItem(index)"
                          class="w-full px-3 py-2 border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                        >
                          <Trash2 class="h-4 w-4 mx-auto" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              :disabled="loading || !canSubmit"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              <span v-if="loading" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
              Crear Transferencia
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useWarehouseStore } from '@/stores/warehouse'
import type { StockTransferCreatePayload } from '@/services/warehouse'
import {
  Plus,
  Trash2,
} from 'lucide-vue-next'
import ProductSelector from '@/components/common/ProductSelector.vue'

interface Emits {
  (e: 'close'): void
  (e: 'saved'): void
}

const emit = defineEmits<Emits>()

const warehouseStore = useWarehouseStore()

// State
const loading = ref(false)

const form = reactive<StockTransferCreatePayload>({
  from_warehouse_id: '',
  to_warehouse_id: '',
  transfer_date: new Date().toISOString().split('T')[0],
  reason: '',
  modality: '',
  notes: '',
  vehicle_id: '',
  driver_id: '',
  items: [],
})

// Computed
const warehouseOptions = computed(() => warehouseStore.warehouseOptions || [])
const vehicleOptions = computed(() => warehouseStore.vehicleOptions || [])
const driverOptions = computed(() => warehouseStore.driverOptions || [])

const availableDestinationWarehouses = computed(() =>
  warehouseOptions.value.filter(w => w.value !== form.from_warehouse_id)
)

const canSubmit = computed(() =>
  form.from_warehouse_id &&
  form.to_warehouse_id &&
  form.transfer_date &&
  form.items.length > 0 &&
  form.items.every(item => item.product_id && item.quantity > 0)
)

// Methods
const addItem = () => {
  form.items.push({
    product_id: '',
    quantity: 1,
    unit_code: 'NIU', // Default unit
  })
}

const removeItem = (index: number) => {
  form.items.splice(index, 1)
}

const updateItemProduct = (index: number, productId: string) => {
  form.items[index].product_id = productId
  // TODO: Get product unit code and set it
}

const handleSubmit = async () => {
  try {
    loading.value = true

    // Clean up form data
    const transferData: StockTransferCreatePayload = {
      from_warehouse_id: form.from_warehouse_id,
      to_warehouse_id: form.to_warehouse_id,
      transfer_date: form.transfer_date,
      reason: form.reason || undefined,
      modality: form.modality || undefined,
      notes: form.notes || undefined,
      vehicle_id: form.vehicle_id || undefined,
      driver_id: form.driver_id || undefined,
      items: form.items.filter(item => item.product_id && item.quantity > 0),
    }

    await warehouseStore.createStockTransfer(transferData)
    emit('saved')
  } catch (error) {
    console.error('Error creating transfer:', error)
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await warehouseStore.initializeWarehouseData()

  // Add initial item
  if (form.items.length === 0) {
    addItem()
  }
})
</script>
