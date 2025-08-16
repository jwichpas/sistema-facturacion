<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        @click="$emit('close')"
      ></div>

      <!-- Modal panel -->
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <X class="h-6 w-6 text-red-600" />
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 class="text-lg leading-6 font-medium text-gray-900">
                Anular Documento Electrónico
              </h3>
              <div class="mt-4 space-y-4">
                <div class="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div class="flex">
                    <AlertTriangle class="h-5 w-5 text-yellow-400 flex-shrink-0" />
                    <div class="ml-3">
                      <h4 class="text-sm font-medium text-yellow-800">
                        Importante
                      </h4>
                      <div class="mt-1 text-sm text-yellow-700">
                        <p>
                          La anulación de un documento electrónico generará automáticamente una Nota de Crédito
                          que será enviada a SUNAT. Esta acción no se puede deshacer.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Motivo de anulación *
                  </label>
                  <select
                    v-model="selectedReason"
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  >
                    <option value="">Seleccione un motivo</option>
                    <option value="01">Anulación de la operación</option>
                    <option value="02">Anulación por error en el RUC</option>
                    <option value="03">Corrección por error en la descripción</option>
                    <option value="04">Descuento global</option>
                    <option value="05">Descuento por ítem</option>
                    <option value="06">Devolución total</option>
                    <option value="07">Devolución por ítem</option>
                    <option value="08">Bonificación</option>
                    <option value="09">Disminución en el valor</option>
                    <option value="10">Otros conceptos</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Descripción adicional
                  </label>
                  <textarea
                    v-model="additionalDescription"
                    rows="3"
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Ingrese una descripción adicional del motivo de anulación..."
                  ></textarea>
                </div>

                <div class="bg-red-50 border border-red-200 rounded-md p-3">
                  <div class="flex">
                    <AlertCircle class="h-5 w-5 text-red-400 flex-shrink-0" />
                    <div class="ml-3">
                      <h4 class="text-sm font-medium text-red-800">
                        Confirmación requerida
                      </h4>
                      <div class="mt-1 text-sm text-red-700">
                        <p>
                          ¿Está seguro que desea anular este documento? Esta acción generará una Nota de Crédito
                          y no se puede deshacer.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            @click="handleCancel"
            :disabled="!selectedReason || processing"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
          >
            <Loader v-if="processing" class="w-4 h-4 mr-2 animate-spin" />
            <X v-else class="w-4 h-4 mr-2" />
            {{ processing ? 'Procesando...' : 'Anular Documento' }}
          </button>
          <button
            @click="$emit('close')"
            :disabled="processing"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, AlertTriangle, AlertCircle, Loader } from 'lucide-vue-next'

interface Props {
  documentId: string
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
  cancel: [documentId: string, reason: string]
}>()

const processing = ref(false)
const selectedReason = ref('')
const additionalDescription = ref('')

const reasonTexts: Record<string, string> = {
  '01': 'Anulación de la operación',
  '02': 'Anulación por error en el RUC',
  '03': 'Corrección por error en la descripción',
  '04': 'Descuento global',
  '05': 'Descuento por ítem',
  '06': 'Devolución total',
  '07': 'Devolución por ítem',
  '08': 'Bonificación',
  '09': 'Disminución en el valor',
  '10': 'Otros conceptos'
}

const fullReason = computed(() => {
  let reason = reasonTexts[selectedReason.value] || selectedReason.value
  if (additionalDescription.value.trim()) {
    reason += ` - ${additionalDescription.value.trim()}`
  }
  return reason
})

async function handleCancel() {
  if (!selectedReason.value) return

  processing.value = true
  try {
    emit('cancel', props.documentId, fullReason.value)
  } finally {
    processing.value = false
  }
}
</script>
</template>
