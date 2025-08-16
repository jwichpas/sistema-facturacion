<template>
  <div class="electronic-document-list">
    <!-- Header with filters -->
    <div class="mb-6 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">
          Documentos Electrónicos
        </h2>
        <div class="flex items-center gap-2">
          <button
            @click="refreshDocuments"
            :disabled="loading"
            class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <RefreshCw :class="['w-4 h-4 mr-2', { 'animate-spin': loading }]" />
            Actualizar
          </button>
          <button
            @click="processPendingDocuments"
            :disabled="loading || pendingCount === 0"
            class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Send class="w-4 h-4 mr-2" />
            Procesar Pendientes ({{ pendingCount }})
          </button>
          <button
            @click="showBulkDownloadModal = true"
            :disabled="loading || documentsWithFiles.length === 0"
            class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Download class="w-4 h-4 mr-2" />
            Descarga Masiva ({{ documentsWithFiles.length }})
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            v-model="filters.status"
            @change="applyFilters"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Todos</option>
            <option value="DRAFT">Borrador</option>
            <option value="PENDING">Pendiente</option>
            <option value="ACCEPTED">Aceptado</option>
            <option value="REJECTED">Rechazado</option>
            <option value="ERROR">Error</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Documento
          </label>
          <select
            v-model="filters.docType"
            @change="applyFilters"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Todos</option>
            <option value="01">Factura</option>
            <option value="03">Boleta</option>
            <option value="07">Nota de Crédito</option>
            <option value="08">Nota de Débito</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Fecha Desde
          </label>
          <input
            v-model="filters.dateFrom"
            @change="applyFilters"
            type="date"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Fecha Hasta
          </label>
          <input
            v-model="filters.dateTo"
            @change="applyFilters"
            type="date"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <FileText class="h-6 w-6 text-gray-400" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Total
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {{ stats.total }}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <CheckCircle class="h-6 w-6 text-green-400" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Aceptados
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {{ stats.accepted }}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <Clock class="h-6 w-6 text-yellow-400" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Pendientes
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {{ stats.pending }}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <XCircle class="h-6 w-6 text-red-400" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Errores
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {{ stats.errors }}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <TrendingUp class="h-6 w-6 text-blue-400" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Tasa Éxito
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {{ stats.acceptance_rate.toFixed(1) }}%
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Documents Table -->
    <div class="bg-white shadow overflow-hidden sm:rounded-md">
      <div v-if="loading" class="p-6 text-center">
        <Loader class="w-6 h-6 animate-spin mx-auto text-gray-400" />
        <p class="mt-2 text-sm text-gray-500">Cargando documentos...</p>
      </div>

      <ul v-else-if="documents.length > 0" class="divide-y divide-gray-200">
        <li
          v-for="doc in documents"
          :key="doc.id"
          class="px-6 py-4 hover:bg-gray-50"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-4">
                <div>
                  <p class="text-sm font-medium text-gray-900">
                    {{ getDocTypeText(doc.doc_type) }} {{ doc.series }}-{{ doc.number }}
                  </p>
                  <p class="text-sm text-gray-500">
                    {{ doc.customer_name }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-medium text-gray-900">
                    {{ formatCurrency(doc.total) }}
                  </p>
                  <p class="text-sm text-gray-500">
                    {{ formatDate(doc.issue_date) }}
                  </p>
                </div>
              </div>
            </div>

            <div class="ml-4 flex-shrink-0">
              <div class="flex items-center gap-2">
                <ElectronicDocumentStatus
                  :status="doc.status"
                  :error-message="doc.error_message"
                  :observations="doc.observations"
                  :ticket="doc.greenter_ticket"
                  :has-xml="doc.has_xml"
                  :has-cdr="doc.has_cdr"
                  @retry="retryDocument(doc.id)"
                  @download-xml="downloadXML(doc.id)"
                  @download-cdr="downloadCDR(doc.id)"
                  @cancel="cancelDocument(doc.id)"
                />

                <DownloadMenu
                  v-if="doc.has_xml || doc.has_cdr"
                  :document-id="doc.id"
                  :has-xml="doc.has_xml"
                  :has-cdr="doc.has_cdr"
                  :doc-type="doc.doc_type"
                  :series="doc.series"
                  :number="doc.number"
                />
              </div>
            </div>
          </div>
        </li>
      </ul>

      <div v-else class="p-6 text-center">
        <FileText class="w-12 h-12 mx-auto text-gray-400" />
        <p class="mt-2 text-sm text-gray-500">
          No se encontraron documentos electrónicos
        </p>
      </div>
    </div>

    <!-- Retry Modal -->
    <RetryModal
      v-if="showRetryModal"
      :document-id="selectedDocumentId"
      @close="showRetryModal = false"
      @retry="handleRetry"
    />

    <!-- Cancel Modal -->
    <CancelModal
      v-if="showCancelModal"
      :document-id="selectedDocumentId"
      @close="showCancelModal = false"
      @cancel="handleCancel"
    />

    <!-- Bulk Download Modal -->
    <BulkDownloadModal
      v-if="showBulkDownloadModal"
      :selected-documents="documentsWithFiles"
      @close="showBulkDownloadModal = false"
      @completed="handleBulkDownloadCompleted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  RefreshCw,
  Send,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Loader,
  Download
} from 'lucide-vue-next'
import { ElectronicBillingService } from '@/services/electronicBilling'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import ElectronicDocumentStatus from './ElectronicDocumentStatus.vue'
import RetryModal from './RetryModal.vue'
import CancelModal from './CancelModal.vue'
import DownloadMenu from './DownloadMenu.vue'
import BulkDownloadModal from './BulkDownloadModal.vue'
import DownloadErrorModal from './DownloadErrorModal.vue'
import type { ElectronicDocumentInfo } from '@/types'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const loading = ref(false)
const documents = ref<ElectronicDocumentInfo[]>([])
const stats = ref({
  total: 0,
  accepted: 0,
  pending: 0,
  rejected: 0,
  errors: 0,
  acceptance_rate: 0,
  recent_errors: []
})

const filters = reactive({
  status: '',
  docType: '',
  dateFrom: '',
  dateTo: ''
})

const showRetryModal = ref(false)
const showCancelModal = ref(false)
const selectedDocumentId = ref('')
const showBulkDownloadModal = ref(false)
const showDownloadErrorModal = ref(false)
const downloadError = ref({
  documentInfo: null as any,
  fileType: 'xml' as 'xml' | 'cdr',
  errorMessage: '',
  technicalDetails: ''
})

const pendingCount = computed(() => {
  return documents.value.filter(doc =>
    ['DRAFT', 'PENDING', 'GENERATING'].includes(doc.status)
  ).length
})

const documentsWithFiles = computed(() => {
  return documents.value.filter(doc => doc.has_xml || doc.has_cdr)
})

onMounted(() => {
  loadDocuments()
  loadStats()
})

async function loadDocuments() {
  if (!authStore.currentCompany?.id) return

  loading.value = true
  try {
    documents.value = await ElectronicBillingService.getElectronicDocuments(
      authStore.currentCompany.id,
      filters
    )
  } catch (error) {
    console.error('Error loading documents:', error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'Error al cargar documentos electrónicos'
    })
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  if (!authStore.currentCompany?.id) return

  try {
    const summary = await ElectronicBillingService.getBillingSummary(
      authStore.currentCompany.id,
      filters.dateFrom || undefined,
      filters.dateTo || undefined
    )
    stats.value = summary
  } catch (error) {
    console.error('Error loading stats:', error)
  }
}

function applyFilters() {
  loadDocuments()
  loadStats()
}

function refreshDocuments() {
  loadDocuments()
  loadStats()
}

async function processPendingDocuments() {
  if (!authStore.currentCompany?.id) return

  const pendingDocs = documents.value
    .filter(doc => ['DRAFT', 'PENDING', 'GENERATING'].includes(doc.status))
    .map(doc => doc.id)

  if (pendingDocs.length === 0) return

  loading.value = true
  let processed = 0
  let successful = 0
  let failed = 0

  try {
    // Process documents one by one with progress updates
    for (const docId of pendingDocs) {
      try {
        const result = await ElectronicBillingService.processElectronicDocument(
          authStore.currentCompany.id,
          docId
        )

        processed++
        if (result.success) {
          successful++
        } else {
          failed++
        }

        // Update progress notification
        notificationStore.addNotification({
          type: 'info',
          title: 'Procesando...',
          message: `Procesados: ${processed}/${pendingDocs.length} - Exitosos: ${successful}, Fallidos: ${failed}`,
          duration: 2000
        })

        // Refresh documents list periodically
        if (processed % 3 === 0) {
          await loadDocuments()
        }

      } catch (error) {
        console.error(`Error processing document ${docId}:`, error)
        processed++
        failed++
      }
    }

    notificationStore.addNotification({
      type: successful === processed ? 'success' : 'warning',
      title: 'Procesamiento Completado',
      message: `Total: ${processed}, Exitosos: ${successful}, Fallidos: ${failed}`
    })

    refreshDocuments()
  } catch (error) {
    console.error('Error processing documents:', error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'Error al procesar documentos pendientes'
    })
  } finally {
    loading.value = false
  }
}

function retryDocument(documentId: string) {
  selectedDocumentId.value = documentId
  showRetryModal.value = true
}

async function handleRetry(documentId: string, retryConfig: any) {
  if (!authStore.currentCompany?.id) return

  try {
    const result = await ElectronicBillingService.retrySubmission(
      authStore.currentCompany.id,
      documentId,
      retryConfig
    )

    if (result.success) {
      notificationStore.addNotification({
        type: 'success',
        title: 'Reintento Exitoso',
        message: 'El documento se procesó correctamente'
      })
    } else {
      notificationStore.addNotification({
        type: 'error',
        title: 'Error en Reintento',
        message: result.error || 'Error al reintentar el documento'
      })
    }

    refreshDocuments()
  } catch (error) {
    console.error('Error retrying document:', error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'Error al reintentar el documento'
    })
  }

  showRetryModal.value = false
}

function cancelDocument(documentId: string) {
  selectedDocumentId.value = documentId
  showCancelModal.value = true
}

async function handleCancel(documentId: string, reason: string) {
  if (!authStore.currentCompany?.id) return

  try {
    const result = await ElectronicBillingService.cancelElectronicDocument(
      authStore.currentCompany.id,
      documentId,
      reason
    )

    if (result.success) {
      notificationStore.addNotification({
        type: 'success',
        title: 'Documento Cancelado',
        message: 'El documento se canceló correctamente'
      })
    } else {
      notificationStore.addNotification({
        type: 'error',
        title: 'Error al Cancelar',
        message: result.error || 'Error al cancelar el documento'
      })
    }

    refreshDocuments()
  } catch (error) {
    console.error('Error cancelling document:', error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'Error al cancelar el documento'
    })
  }

  showCancelModal.value = false
}

async function downloadXML(documentId: string) {
  if (!authStore.currentCompany?.id) return

  try {
    const result = await ElectronicBillingService.downloadXML(
      authStore.currentCompany.id,
      documentId
    )

    if (result.success && result.blob && result.filename) {
      ElectronicBillingService.downloadBlob(result.blob, result.filename)
      notificationStore.addNotification({
        type: 'success',
        title: 'Descarga Exitosa',
        message: `XML descargado: ${result.filename}`
      })
    } else {
      // Mostrar modal de error con opciones de recuperación
      const doc = documents.value.find(d => d.id === documentId)
      if (doc) {
        downloadError.value = {
          documentInfo: doc,
          fileType: 'xml',
          errorMessage: result.error || 'Error al descargar XML',
          technicalDetails: ''
        }
        showDownloadErrorModal.value = true
      } else {
        notificationStore.addNotification({
          type: 'error',
          title: 'Error de Descarga',
          message: result.error || 'Error al descargar XML'
        })
      }
    }
  } catch (error: any) {
    console.error('Error downloading XML:', error)

    // Mostrar modal de error con detalles técnicos
    const doc = documents.value.find(d => d.id === documentId)
    if (doc) {
      downloadError.value = {
        documentInfo: doc,
        fileType: 'xml',
        errorMessage: 'Error técnico al descargar XML',
        technicalDetails: error.message || error.toString()
      }
      showDownloadErrorModal.value = true
    } else {
      notificationStore.addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error al descargar XML'
      })
    }
  }
}

async function downloadCDR(documentId: string) {
  if (!authStore.currentCompany?.id) return

  try {
    const result = await ElectronicBillingService.downloadCDR(
      authStore.currentCompany.id,
      documentId
    )

    if (result.success && result.blob && result.filename) {
      ElectronicBillingService.downloadBlob(result.blob, result.filename)
      notificationStore.addNotification({
        type: 'success',
        title: 'Descarga Exitosa',
        message: `CDR descargado: ${result.filename}`
      })
    } else {
      notificationStore.addNotification({
        type: 'error',
        title: 'Error de Descarga',
        message: result.error || 'Error al descargar CDR'
      })
    }
  } catch (error: unknown) {
    console.error('Error downloading CDR:', error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'Error al descargar CDR'
    })
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN'
  }).format(amount)
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-PE')
}

function handleBulkDownloadCompleted(results: unknown) {
  showBulkDownloadModal.value = false

  notificationStore.addNotification({
    type: 'success',
    title: 'Descarga Masiva Completada',
    message: `Se descargaron ${results.successful} de ${results.processed} archivos`
  })
}
</script>
