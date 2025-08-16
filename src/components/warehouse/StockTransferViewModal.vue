<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="$emit('close')"></div>

      <span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

      <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
        <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6">
          <div v-if="transfer">
            <!-- Header -->
            <div class="mb-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Detalle de Transferencia
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Información completa de la transferencia de stock
              </p>
            </div>

            <!-- Transfer Information -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Información General
                  </h4>
                  <dl class="space-y-2">
                    <div class="flex justify-between">
                      <dt class="text-sm text-gray-500 dark:text-gray-400">Fecha:</dt>
                      <dd class="text-sm text-gray-900 dark:text-white">
                        {{ formatDate(transfer.transfer_date) }}
                      </dd>
                    </div>
                    <div class="flex justify-between">
                      <dt class="text-sm text-gray-500 dark:text-gray-400">Motivo:</dt>
                      <dd class="text-sm text-gray-900 dark:text-white">
                        {{ transfer.reason || '-' }}
                      </dd>
                    </div>
                    <div class="flex justify-between">
                      <dt class="text-sm text-gray-500 dark:text-gray-400">Modalidad:</dt>
                      <dd class="text-sm text-gray-900 dark:text-white">
                        {{ transfer.modality || '-' }}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Almacenes
                  </h4>
                  <div class="space-y-3">
                    <div class="flex items-center">
                      <div class="flex-1">
                        <p class="text-sm font-medium text-gray-900 dark:text-white">
                          Origen
                        </p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                          {{ transfer.from_warehouse?.name }}
                        </p>
                      </div>
                    </div>
                    <div class="flex justify-center">
                      <ArrowDown class="h-5 w-5 text-gray-400" />
                    </div>
                    <div class="flex items-center">
                      <div class="flex-1">
                        <p class="text-sm font-medium text-gray-900 dark:text-white">
                          Destino
                        </p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                          {{ transfer.to_warehouse?.name }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="transfer.vehicle || transfer.driver" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transporte
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div v-if="transfer.vehicle">
                    <dt class="text-sm text-gray-500 dark:text-gray-400">Vehículo:</dt>
                    <dd class="text-sm text-gray-900 dark:text-white">
                      {{ transfer.vehicle.plate }}
                      <span v-if="transfer.vehicle.brand || transfer.vehicle.model">
                        - {{ transfer.vehicle.brand }} {{ transfer.vehicle.model }}
                      </span>
                    </dd>
                  </div>
                  <div v-if="transfer.driver">
                    <dt class="text-sm text-gray-500 dark:text-gray-400">Conductor:</dt>
                    <dd class="text-sm text-gray-900 dark:text-white">
                      {{ transfer.driver.party?.fullname }}
                      <span class="text-gray-500 dark:text-gray-400">
                        ({{ transfer.driver.license_number }})
                      </span>
                    </dd>
                  </div>
                </div>
              </div>

              <div v-if="transfer.notes" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notas
                </h4>
                <p class="text-sm text-gray-900 dark:text-white">
                  {{ transfer.notes }}
                </p>
              </div>
            </div>

            <!-- Transfer Items -->
            <div>
              <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">
                Productos Transferidos
              </h4>

              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead class="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Producto
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        SKU
                      </th>
                      <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Unidad
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    <tr
                      v-for="item in transfer.items"
                      :key="item.id"
                      class="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                          {{ item.product?.name }}
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {{ item.product?.sku }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                        {{ formatNumber(item.quantity) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {{ item.unit_code }}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot class="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <td colspan="2" class="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        Total
                      </td>
                      <td class="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white text-right">
                        {{ formatNumber(transfer.total_quantity || 0) }}
                      </td>
                      <td class="px-6 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {{ transfer.total_items }} items
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <div v-else class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
import type { StockTransferWithDetails } from '@/services/warehouse'
import { ArrowDown } from 'lucide-vue-next'

interface Props {
  transfer: StockTransferWithDetails | null
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Methods
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}
</script>
