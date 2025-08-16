<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        @click="!processing && $emit('close')"
      ></div>

      <!-- Modal panel -->
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
              <Send class="h-6 w-6 text-blue-600" />
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 class="text-lg leading-6 font-medium text-gray-900">
                Reenvío Masivo de Documentos
              </h3>

              <div class="mt-4 space-y-4">
                <p class="text-sm text-gray-500">
                  Se reenviarán {{ selectedDocuments.length }} documentos pendientes a SUNAT.
                </p>

                <!-- Document List -->
                <div class="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                  <div class="divide-y divide-gray-200">
                    <div
                      v-for="doc in selectedDocuments"
                      :key="doc.id"
                      class="px-3 py-2 flex items-center justify-between text-sm"
                    >
                      <div>
                        <span class="font-medium">{{ getDocTypeText(doc.doc_type) }} {{ doc.series }}-{{ doc.number }}</span>
                        <span class="text-gray-500 ml-2">{{ doc.customer_name }}</span>
                      </div>
                      <div class="flex items-center">
                        <ElectronicDocumentStatus :status="doc.status" size="sm" />
                        <span v-if="processedDocuments[doc.id]" class="ml-2">
                          <CheckCircle v-if="processedDocuments[doc.id].success" class="w-4 h-4 text-green-500" />
                          <XCircle v-else class="w-4 h-4 text-red-500" />
                        </span>
                        <Loader v-else-if="currentProcessing === doc.id" class="w-4 h-4 text-blue-500 animate-spin ml-2" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Configuration -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Máx. intentos
                    </label>
                    <select
                      v-model="retryConfig.max_attempts"
                      :disabled="processing"
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:opacity-50"
                    >
                      <option :value="1">1 intento</option>
                      <option :value="2">2 intentos</option>
                      <option :value="3">3 intentos</option>
                      <option :value="5">5 intentos</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Espera (seg)
                    </label>
                    <select
                      v-model="retryConfig.delay_seconds"
                      :disabled="processing"
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:opacity-50"
                    >
                      <option :value="10">10 seg</option>
                      <option :value="30">30 seg</option>
                      <option :value="60">1 min</option>
                      <option :value="120">2 min</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Concurrencia
                    </label>
                    <select
                      v-model="retryConfig.max_concurrent"
                      :disabled="processing"
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:opacity-50"
                    >
                      <option :value="1">1 documento</option>
                      <option :value="2">2 documentos</option>
                      <option :value="3">3 documentos</option>
                      <option :value="5">5 documentos</option>
                    </select>
                  </div>
                </div>

                <!-- Progress -->
                <div v-if="processing" class="space-y-2">
                  <div class="flex items-center justify-between text-sm">
                    <span>Progreso: {{ processedCount }}/{{ selectedDocuments.length }}</span>
                    <span>{{ Math.round((processedCount / selectedDocuments.length) * 100) }}%</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div
                      class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      :style="{ width: `${(processedCount / selectedDocuments.length) * 100}%` }"
                    ></div>
                  </div>
                  <div class="text-xs text-gray-500">
                    Exitosos: {{ successCount }} | Fallidos: {{ failedCount }}
                  </div>
                </div>

                <!-- Results Summary -->
                <div v-if="completed" class="bg-gray-50 border border-gray-200 rounded-md p-3">
                  <h4 class="text-sm font-medium text-gray-900 mb-2">Resumen de Resultados</h4>
                  <div class="grid grid-cols-3 gap-4 text-sm">
                    <div class="text-center">
                      <div class="text-lg font-semibold text-gray-900">{{ processedCount }}</div>
                      <div class="text-gray-500">Procesados</div>
                    </div>
                    <div class="text-center">
                      <div class="text-lg font-semibold text-green-600">{{ successCount }}</div>
                      <div class="text-gray-500">Exitosos</div>
                    </div>
                    <div class="text-center">
                      <div class="text-lg font-semibold text-red-600">{{ failedCount }}</div>
                      <div class="text-gray-500">Fallidos</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            v-if="!completed"
            @click="startBulkRetry"
            :disabled="processing || selectedDocuments.length === 0"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
          >
            <Loader v-if="processing" class="w-4 h-4 mr-2 animate-spin" />
            <Send v-else class="w-4 h-4 mr-2" />
            {{ processing ? 'Procesando...' : 'Iniciar Reenvío' }}
          </button>

          <button
            v-if="completed"
            @click="$emit('close')"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
          >
            <CheckCircle class="w-4 h-4 mr-2" />
            Finalizar
          </button>

          <button
            @click="$emit('close')"
            :disabled="processing"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
          >
            {{ processing ? 'Cancelar' : 'Cerrar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { Send, CheckCircle, XCircle, Loader } from 'lucide-vue-next'
import { ElectronicBillingService } from '@/services/electronicBilling'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import ElectronicDocumentStatus from './ElectronicDocumentStatus.vue'
import type { ElectronicDocumentInfo } from '@/types'

interface Props {
  selectedDocuments: ElectronicDocumentInfo[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  completed: [results: any]
}>()

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const processing = ref(false)
const completed = ref(false)
const currentProcessing = ref('')
const processedDocuments = ref<Record<string, { success: boolean; error?: string }>>({})

const retryConfig = reactive({
  max_attempts: 3,
  delay_seconds: 30,
  backoff_multiplier: 2,
  max_concurrent: 2
})

const processedCount = computed(() => Object.keys(processedDocuments.value).length)
const successCount = computed(() =>
  Object.values(processedDocuments.value).filter(result => result.success).length
)
const failedCount = computed(() =>
  Object.values(processedDocuments.value).filter(result => !result.success).length
)

async function startBulkRetry() {
  if (!authStore.currentCompany?.id || props.selectedDocuments.length === 0) return

  processing.value = true
  processedDocuments.value = {}

  try {
    // Process documents in batches based on max_concurrent
    const batches = []
    for (let i = 0; i < props.selectedDocuments.length; i += retryConfig.max_concurrent) {
      batches.push(props.selectedDocuments.slice(i, i + retryConfig.max_concurrent))
    }

    for (const batch of batches) {
      // Process batch concurrently
      const promises = batch.map(async (doc) => {
        currentProcessing.value = doc.id

        try {
          const result = await ElectronicBillingService.retrySubmission(
            authStore.currentCompany!.id,
            doc.id,
            retryConfig
          )

          processedDocuments.value[doc.id] = {
            success: result.success,
            error: result.error
          }

          return result
        } catch (error: any) {
          processedDocuments.value[doc.id] = {
            success: false,
            error: error.message || 'Error desconocido'
          }
          return { success: false, error: error.message }
        }
      })

      await Promise.all(promises)

      // Small delay between batches to avoid overwhelming SUNAT
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    completed.value = true
    currentProcessing.value = ''

    // Show final notification
    const totalSuccess = successCount.value
    const totalFailed = failedCount.value

    notificationStore.addNotification({
      type: totalFailed === 0 ? 'success' : 'warning',
      title: 'Reenvío Masivo Completado',
      message: `Exitosos: ${totalSuccess}, Fallidos: ${totalFailed}`
    })

    emit('completed', {
      processed: processedCount.value,
      successful: totalSuccess,
      failed: totalFailed,
      results: processedDocuments.value
    })

  } catch (error: any) {
    console.error('Error in bulk retry:', error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error en Reenvío Masivo',
      message: error.message || 'Error durante el reenvío masivo'
    })
  } finally {
    processing.value = false
  }
}

function getDocTypeText(docType: string): string {
  const types: Record<string, string> = {
    '01': 'Factura',
    '03': 'Boleta',
    '07': 'Nota de Crédito',
    '08': 'Nota de Débito'
  }
  return types[docType] || docType
}
</script>

