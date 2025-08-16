<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="!processing && $emit('close')">
      </div>

      <!-- Modal panel -->
      <div
        class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div
              class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
              <Download class="h-6 w-6 text-blue-600" />
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 class="text-lg leading-6 font-medium text-gray-900">
                Descarga Masiva de Documentos
              </h3>

              <div class="mt-4 space-y-4">
                <p class="text-sm text-gray-500">
                  Descarga archivos XML y CDR de {{ selectedDocuments.length }} documentos seleccionados.
                </p>

                <!-- Download Options -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Archivo
                    </label>
                    <select v-model="downloadOptions.fileType" :disabled="processing"
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:opacity-50">
                      <option value="both">XML + CDR</option>
                      <option value="xml">Solo XML</option>
                      <option value="cdr">Solo CDR</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Formato de Descarga
                    </label>
                    <select v-model="downloadOptions.format" :disabled="processing"
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:opacity-50">
                      <option value="zip">Archivo ZIP</option>
                      <option value="individual">Archivos Individuales</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Organización
                    </label>
                    <select v-model="downloadOptions.organization" :disabled="processing"
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:opacity-50">
                      <option value="flat">Todos en una carpeta</option>
                      <option value="by_date">Por fecha</option>
                      <option value="by_type">Por tipo de documento</option>
                    </select>
                  </div>
                </div>

                <!-- Document List Preview -->
                <div class="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                  <div class="divide-y divide-gray-200">
                    <div v-for="doc in selectedDocuments" :key="doc.id"
                      class="px-3 py-2 flex items-center justify-between text-sm">
                      <div class="flex items-center gap-3">
                        <div>
                          <span class="font-medium">{{ getDocTypeText(doc.doc_type) }} {{ doc.series }}-{{ doc.number
                            }}</span>
                          <span class="text-gray-500 ml-2">{{ doc.customer_name }}</span>
                        </div>
                        <div class="flex items-center gap-1">
                          <span v-if="doc.has_xml"
                            class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            XML
                          </span>
                          <span v-if="doc.has_cdr"
                            class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            CDR
                          </span>
                        </div>
                      </div>
                      <div class="flex items-center">
                        <span v-if="processedDocuments[doc.id]?.success" class="text-green-500">
                          <CheckCircle class="w-4 h-4" />
                        </span>
                        <span v-else-if="processedDocuments[doc.id]?.error" class="text-red-500">
                          <XCircle class="w-4 h-4" />
                        </span>
                        <Loader v-else-if="currentProcessing === doc.id" class="w-4 h-4 text-blue-500 animate-spin" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Progress -->
                <div v-if="processing" class="space-y-2">
                  <div class="flex items-center justify-between text-sm">
                    <span>Progreso: {{ processedCount }}/{{ selectedDocuments.length }}</span>
                    <span>{{ Math.round((processedCount / selectedDocuments.length) * 100) }}%</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      :style="{ width: `${(processedCount / selectedDocuments.length) * 100}%` }"></div>
                  </div>
                  <div class="text-xs text-gray-500">
                    Descargados: {{ successCount }} | Errores: {{ failedCount }}
                  </div>
                </div>

                <!-- Download Summary -->
                <div v-if="completed" class="bg-green-50 border border-green-200 rounded-md p-3">
                  <div class="flex">
                    <CheckCircle class="h-5 w-5 text-green-400 flex-shrink-0" />
                    <div class="ml-3">
                      <h4 class="text-sm font-medium text-green-800">Descarga Completada</h4>
                      <div class="mt-2 text-sm text-green-700">
                        <p>Se han descargado {{ successCount }} de {{ selectedDocuments.length }} documentos.</p>
                        <p v-if="downloadedFiles.length > 0" class="mt-1">
                          Archivos generados: {{ downloadedFiles.length }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Error Summary -->
                <div v-if="failedCount > 0 && completed" class="bg-red-50 border border-red-200 rounded-md p-3">
                  <div class="flex">
                    <AlertCircle class="h-5 w-5 text-red-400 flex-shrink-0" />
                    <div class="ml-3">
                      <h4 class="text-sm font-medium text-red-800">Errores en Descarga</h4>
                      <div class="mt-2 text-sm text-red-700">
                        <p>{{ failedCount }} documentos no pudieron ser descargados.</p>
                        <details class="mt-2">
                          <summary class="cursor-pointer font-medium">Ver detalles de errores</summary>
                          <ul class="list-disc list-inside mt-1 space-y-1">
                            <li v-for="(result, docId) in processedDocuments" :key="docId">
                              <span v-if="!result.success">
                                {{ getDocumentName(docId) }}: {{ result.error }}
                              </span>
                            </li>
                          </ul>
                        </details>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button v-if="!completed" @click="startBulkDownload" :disabled="processing || selectedDocuments.length === 0"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
            <Loader v-if="processing" class="w-4 h-4 mr-2 animate-spin" />
            <Download v-else class="w-4 h-4 mr-2" />
            {{ processing ? 'Descargando...' : 'Iniciar Descarga' }}
          </button>

          <button v-if="completed" @click="$emit('close')"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm">
            <CheckCircle class="w-4 h-4 mr-2" />
            Finalizar
          </button>

          <button @click="$emit('close')" :disabled="processing"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
            {{ processing ? 'Cancelar' : 'Cerrar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { Download, CheckCircle, XCircle, Loader, AlertCircle } from 'lucide-vue-next'
import { ElectronicBillingService } from '@/services/electronicBilling'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
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
const processedDocuments = ref<Record<string, { success: boolean; error?: string; files?: string[] }>>({})
const downloadedFiles = ref<string[]>([])

const downloadOptions = reactive({
  fileType: 'both' as 'both' | 'xml' | 'cdr',
  format: 'zip' as 'zip' | 'individual',
  organization: 'flat' as 'flat' | 'by_date' | 'by_type'
})

const processedCount = computed(() => Object.keys(processedDocuments.value).length)
const successCount = computed(() =>
  Object.values(processedDocuments.value).filter(result => result.success).length
)
const failedCount = computed(() =>
  Object.values(processedDocuments.value).filter(result => !result.success).length
)

async function startBulkDownload() {
  if (!authStore.currentCompany?.id || props.selectedDocuments.length === 0) return

  processing.value = true
  processedDocuments.value = {}
  downloadedFiles.value = []

  try {
    for (const doc of props.selectedDocuments) {
      currentProcessing.value = doc.id

      try {
        let result

        if (downloadOptions.fileType === 'both') {
          result = await ElectronicBillingService.downloadDocumentFiles(
            authStore.currentCompany.id,
            doc.id
          )
        } else if (downloadOptions.fileType === 'xml') {
          result = await ElectronicBillingService.downloadXML(
            authStore.currentCompany.id,
            doc.id
          )
        } else {
          result = await ElectronicBillingService.downloadCDR(
            authStore.currentCompany.id,
            doc.id
          )
        }

        if (result.success && result.blob && result.filename) {
          // Download the file
          ElectronicBillingService.downloadBlob(result.blob, result.filename)

          processedDocuments.value[doc.id] = {
            success: true,
            files: [result.filename]
          }

          downloadedFiles.value.push(result.filename)
        } else {
          processedDocuments.value[doc.id] = {
            success: false,
            error: result.error || 'Error desconocido'
          }
        }
      } catch (error: any) {
        processedDocuments.value[doc.id] = {
          success: false,
          error: error.message || 'Error desconocido'
        }
      }

      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    completed.value = true
    currentProcessing.value = ''

    // Show final notification
    const totalSuccess = successCount.value
    const totalFailed = failedCount.value

    notificationStore.addNotification({
      type: totalFailed === 0 ? 'success' : 'warning',
      title: 'Descarga Masiva Completada',
      message: `Descargados: ${totalSuccess}, Errores: ${totalFailed}`
    })

    emit('completed', {
      processed: processedCount.value,
      successful: totalSuccess,
      failed: totalFailed,
      files: downloadedFiles.value
    })

  } catch (error: any) {
    console.error('Error in bulk download:', error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error en Descarga Masiva',
      message: error.message || 'Error durante la descarga masiva'
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

function getDocumentName(docId: string): string {
  const doc = props.selectedDocuments.find(d => d.id === docId)
  return doc ? `${getDocTypeText(doc.doc_type)} ${doc.series}-${doc.number}` : docId
}
</script>
