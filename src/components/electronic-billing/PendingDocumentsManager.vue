<template>
  <div class="pending-documents-manager">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">
          Documentos Pendientes
        </h2>
        <p class="text-sm text-gray-500 mt-1">
          Gestiona y reenvía documentos que requieren procesamiento
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="refreshDocuments"
          :disabled="loading"
          class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <RefreshCw :class="['w-4 h-4 mr-2', { 'animate-spin': loading }]" />
          Actualizar
        </button>
        <button
          @click="showBulkRetryModal = true"
          :disabled="selectedDocuments.length === 0"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <Send class="w-4 h-4 mr-2" />
          Reenviar Seleccionados ({{ selectedDocuments.length }})
        </button>
      </div>
    </div>

    <!-- Filters and Actions -->
    <div class="bg-white shadow rounded-lg mb-6">
      <div class="px-4 py-5 sm:p-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              v-model="filters.status"
              @change="applyFilters"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Todos los pendientes</option>
              <option value="DRAFT">Borrador</option>
              <option value="PENDING">Pendiente</option>
              <option value="ERROR">Con Error</option>
              <option value="REJECTED">Rechazado</option>
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
              <option value="01">Facturas</option>
              <option value="03">Boletas</option>
              <option value="07">Notas de Crédito</option>
              <option value="08">Notas de Débito</option>
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

        <!-- Bulk Actions -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <label class="flex items-center">
              <input
                type="checkbox"
                :checked="allSelected"
                @change="toggleSelectAll"
                class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span class="ml-2 text-sm text-gray-700">
                Seleccionar todos ({{ filteredDocuments.length }})
              </span>
            </label>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="processSelected('retry')"
              :disabled="selectedDocuments.length === 0 || processing"
              class="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <RefreshCw class="w-3 h-3 mr-1" />
              Reintentar
            </button>
            <button
              @click="processSelected('generate')"
              :disabled="selectedDocuments.length === 0 || processing"
              class="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <FileText class="w-3 h-3 mr-1" />
              Generar XML
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Documents List -->
    <div class="bg-white shadow overflow-hidden sm:rounded-md">
      <div v-if="loading" class="p-6 text-center">
        <Loader class="w-6 h-6 animate-spin mx-auto text-gray-400" />
        <p class="mt-2 text-sm text-gray-500">Cargando documentos pendientes...</p>
      </div>

      <ul v-else-if="filteredDocuments.length > 0" class="divide-y divide-gray-200">
        <li
          v-for="doc in filteredDocuments"
          :key="doc.id"
          :class="[
            'px-6 py-4 hover:bg-gray-50 transition-colors',
            selectedDocumentIds.includes(doc.id) && 'bg-blue-50'
          ]"
        >
          <div class="flex items-center">
            <!-- Selection checkbox -->
            <input
              type="checkbox"
              :checked="selectedDocumentIds.includes(doc.id)"
              @change="toggleDocumentSelection(doc.id)"
              class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-4"
            />

            <!-- Document info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
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

                <div class="flex items-center gap-3">
                  <!-- Status -->
                  <ElectronicDocumentStatus
                    :status="doc.status"
                    :error-message="doc.error_message"
                    :has-xml="doc.has_xml"
                    :has-cdr="doc.has_cdr"
                    :show-actions="false"
                  />

                  <!-- Last attempt info -->
                  <div v-if="doc.error_message" class="text-xs text-gray-500 max-w-xs">
                    <p class="truncate">{{ doc.error_message }}</p>
                    <p>{{ formatDate(doc.updated_at) }}</p>
                  </div>

                  <!-- Individual actions -->
                  <div class="flex items-center gap-1">
                    <button
                      @click="retryDocument(doc.id)"
                      :disabled="processing"
                      class="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      title="Reintentar documento"
                    >
                      <RefreshCw class="w-3 h-3" />
                    </button>

                    <button
                      v-if="doc.greenter_ticket"
                      @click="checkDocumentStatus(doc.id)"
                      :disabled="processing"
                      class="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      title="Consultar estado en SUNAT"
                    >
                      <Search class="w-3 h-3" />
                    </button>

                    <button
                      @click="viewDocumentDetails(doc.id)"
                      class="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      title="Ver detalles"
                    >
                      <Eye class="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </li>
      </ul>

      <div v-else class="p-6 text-center">
        <CheckCircle class="w-12 h-12 mx-auto text-green-400" />
        <p class="mt-2 text-sm text-gray-500">
          No hay documentos pendientes
        </p>
        <p class="text-xs text-gray-400 mt-1">
          Todos los documentos han sido procesados correctamente
        </p>
      </div>
    </div>

    <!-- Bulk Retry Modal -->
    <BulkRetryModal
      v-if="showBulkRetryModal"
      :selected-documents="selectedDocuments"
      @close="showBulkRetryModal = false"
      @completed="handleBulkRetryCompleted"
    />

    <!-- Document Details Modal -->
    <DocumentDetailsModal
      v-if="showDetailsModal"
      :document-id="selectedDocumentId"
      @close="showDetailsModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  RefreshCw,
  Send,
  FileText,
  Loader,
  CheckCircle,
  Search,
  Eye
} from 'lucide-vue-next'
import { ElectronicBillingService } from '@/services/electronicBilling'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import ElectronicDocumentStatus from './ElectronicDocumentStatus.vue'
import BulkRetryModal from './BulkRetryModal.vue'
import DocumentDetailsModal from './DocumentDetailsModal.vue'
import type { ElectronicDocumentInfo } from '@/types'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const loading = ref(false)
const processing = ref(false)
const documents = ref<ElectronicDocumentInfo[]>([])
const selectedDocumentIds = ref<string[]>([])
const showBulkRetryModal = ref(false)
const showDetailsModal = ref(false)
const selectedDocumentId = ref('')

const filters = reactive({
  status: '',
  docType: '',
  dateFrom: '',
  dateTo: ''
})

const filteredDocuments = computed(() => {
  let filtered = documents.value.filter(doc =>
    ['DRAFT', 'PENDING', 'ERROR', 'REJECTED', 'GENERATING'].includes(doc.status)
  )

  if (filters.status) {
    filtered = filtered.filter(doc => doc.status === filters.status)
  }

  if (filters.docType) {
    filtered = filtered.filter(doc => doc.doc_type === filters.docType)
  }

  if (filters.dateFrom) {
    filtered = filtered.filter(doc => doc.issue_date >= filters.dateFrom)
  }

  if (filters.dateTo) {
    filtered = filtered.filter(doc => doc.issue_date <= filters.dateTo)
  }

  return filtered
})

const selectedDocuments = computed(() =>
  filteredDocuments.value.filter(doc => selectedDocumentIds.value.includes(doc.id))
)

const allSelected = computed(() =>
  filteredDocuments.value.length > 0 &&
  filteredDocuments.value.every(doc => selectedDocumentIds.value.includes(doc.id))
)

onMounted(() => {
  loadDocuments()
})

async function loadDocuments() {
  if (!authStore.currentCompany?.id) return

  loading.value = true
  try {
    documents.value = await ElectronicBillingService.getElectronicDocuments(
      authStore.currentCompany.id,
      {}
    )
  } catch (error) {
    console.error('Error loading documents:', error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'Error al cargar documentos pendientes'
    })
  } finally {
    loading.value = false
  }
}

function refreshDocuments() {
  selectedDocumentIds.value = []
  loadDocuments()
}

function applyFilters() {
  selectedDocumentIds.value = []
}

function toggleSelectAll() {
  if (allSelected.value) {
    selectedDocumentIds.value = []
  } else {
    selectedDocumentIds.value = filteredDocuments.value.map(doc => doc.id)
  }
}

function toggleDocumentSelection(documentId: string) {
  const index = selectedDocumentIds.value.indexOf(documentId)
  if (index > -1) {
    selectedDocumentIds.value.splice(index, 1)
  } else {
    selectedDocumentIds.value.push(documentId)
  }
}

async function processSelected(action: 'retry' | 'generate') {
  if (!authStore.currentCompany?.id || selectedDocuments.value.length === 0) return

  processing.value = true
  let successful = 0
  let failed = 0

  try {
    for (const doc of selectedDocuments.value) {
      try {
        let result
        if (action === 'retry') {
          result = await ElectronicBillingService.retrySubmission(
            authStore.currentCompany.id,
            doc.id
          )
        } else {
          result = await ElectronicBillingService.generateInvoiceXML(
            authStore.currentCompany.id,
            doc.id
          )
        }

        if (result.success) {
          successful++
        } else {
          failed++
        }
      } catch (error) {
        failed++
      }
    }

    notificationStore.addNotification({
      type: failed === 0 ? 'success' : 'warning',
      title: `${action === 'retry' ? 'Reintento' : 'Generación'} Completado`,
      message: `Exitosos: ${successful}, Fallidos: ${failed}`
    })

    selectedDocumentIds.value = []
    refreshDocuments()
  } catch (error) {
    console.error(`Error in ${action}:`, error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: `Error durante ${action === 'retry' ? 'el reintento' : 'la generación'}`
    })
  } finally {
    processing.value = false
  }
}

async function retryDocument(documentId: string) {
  if (!authStore.currentCompany?.id) return

  processing.value = true
  try {
    const result = await ElectronicBillingService.retrySubmission(
      authStore.currentCompany.id,
      documentId
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
  } finally {
    processing.value = false
  }
}

async function checkDocumentStatus(documentId: string) {
  if (!authStore.currentCompany?.id) return

  processing.value = true
  try {
    const result = await ElectronicBillingService.checkSunatStatus(
      authStore.currentCompany.id,
      documentId
    )

    notificationStore.addNotification({
      type: result.success ? 'info' : 'error',
      title: 'Consulta de Estado',
      message: result.success
        ? `Estado actualizado: ${result.status}`
        : result.error || 'Error al consultar estado'
    })

    if (result.success) {
      refreshDocuments()
    }
  } catch (error) {
    console.error('Error checking status:', error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'Error al consultar el estado'
    })
  } finally {
    processing.value = false
  }
}

function viewDocumentDetails(documentId: string) {
  selectedDocumentId.value = documentId
  showDetailsModal.value = true
}

function handleBulkRetryCompleted(results: any) {
  showBulkRetryModal.value = false
  selectedDocumentIds.value = []
  refreshDocuments()
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
</script>
