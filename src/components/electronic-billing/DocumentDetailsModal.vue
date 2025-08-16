<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="$emit('close')"></div>

      <!-- Modal panel -->
      <div
        class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="flex items-start justify-between mb-4">
            <h3 class="text-lg leading-6 font-medium text-gray-900">
              Detalles del Documento Electrónico
            </h3>
            <button @click="$emit('close')"
              class="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <X class="h-6 w-6" />
            </button>
          </div>

          <div v-if="loading" class="text-center py-8">
            <Loader class="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p class="mt-2 text-sm text-gray-500">Cargando detalles...</p>
          </div>

          <div v-else-if="document" class="space-y-6">
            <!-- Document Header -->
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 class="text-sm font-medium text-gray-900 mb-2">Información del Documento</h4>
                  <dl class="space-y-1">
                    <div class="flex justify-between text-sm">
                      <dt class="text-gray-500">Tipo:</dt>
                      <dd class="font-medium">{{ getDocTypeText(document.doc_type) }}</dd>
                    </div>
                    <div class="flex justify-between text-sm">
                      <dt class="text-gray-500">Número:</dt>
                      <dd class="font-medium">{{ document.series }}-{{ document.number }}</dd>
                    </div>
                    <div class="flex justify-between text-sm">
                      <dt class="text-gray-500">Fecha:</dt>
                      <dd>{{ formatDate(document.issue_date) }}</dd>
                    </div>
                    <div class="flex justify-between text-sm">
                      <dt class="text-gray-500">Total:</dt>
                      <dd class="font-medium">{{ formatCurrency(document.total) }}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 class="text-sm font-medium text-gray-900 mb-2">Cliente</h4>
                  <dl class="space-y-1">
                    <div class="flex justify-between text-sm">
                      <dt class="text-gray-500">Nombre:</dt>
                      <dd class="font-medium">{{ document.customer_name }}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 class="text-sm font-medium text-gray-900 mb-2">Estado Electrónico</h4>
                  <div class="space-y-2">
                    <ElectronicDocumentStatus :status="document.status" :has-xml="document.has_xml"
                      :has-cdr="document.has_cdr" :show-actions="false" />
                    <div v-if="document.greenter_ticket" class="text-xs text-gray-500">
                      Ticket: {{ document.greenter_ticket }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Processing Timeline -->
            <div>
              <h4 class="text-sm font-medium text-gray-900 mb-3">Historial de Procesamiento</h4>
              <div class="flow-root">
                <ul class="-mb-8">
                  <li v-for="(event, index) in processingEvents" :key="index">
                    <div class="relative pb-8">
                      <span v-if="index !== processingEvents.length - 1"
                        class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"></span>
                      <div class="relative flex space-x-3">
                        <div>
                          <span :class="[
                            'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white',
                            getEventColor(event.type)
                          ]">
                            <component :is="getEventIcon(event.type)" class="h-4 w-4" />
                          </span>
                        </div>
                        <div class="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p class="text-sm text-gray-900">{{ event.description }}</p>
                            <p v-if="event.details" class="text-xs text-gray-500 mt-1">{{ event.details }}</p>
                          </div>
                          <div class="text-right text-sm whitespace-nowrap text-gray-500">
                            {{ formatDateTime(event.timestamp) }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Error Details -->
            <div v-if="document.error_message" class="bg-red-50 border border-red-200 rounded-lg p-4">
              <div class="flex">
                <AlertCircle class="h-5 w-5 text-red-400 flex-shrink-0" />
                <div class="ml-3">
                  <h4 class="text-sm font-medium text-red-800">Error de Procesamiento</h4>
                  <div class="mt-2 text-sm text-red-700">
                    <p>{{ document.error_message }}</p>
                  </div>
                  <div v-if="document.observations && document.observations.length > 0" class="mt-2">
                    <h5 class="text-xs font-medium text-red-800">Observaciones:</h5>
                    <ul class="list-disc list-inside text-xs text-red-700 mt-1">
                      <li v-for="obs in document.observations" :key="obs">{{ obs }}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <!-- XML and CDR Status -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-sm font-medium text-gray-900">XML Generado</h4>
                  <div class="flex items-center">
                    <div :class="[
                      'w-2 h-2 rounded-full mr-2',
                      document.has_xml ? 'bg-green-400' : 'bg-gray-300'
                    ]"></div>
                    <span class="text-xs text-gray-500">
                      {{ document.has_xml ? 'Disponible' : 'No disponible' }}
                    </span>
                  </div>
                </div>
                <div v-if="document.has_xml" class="space-y-2">
                  <button @click="downloadXML"
                    class="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <Download class="w-3 h-3 mr-1" />
                    Descargar XML
                  </button>
                </div>
              </div>

              <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-sm font-medium text-gray-900">CDR de SUNAT</h4>
                  <div class="flex items-center">
                    <div :class="[
                      'w-2 h-2 rounded-full mr-2',
                      document.has_cdr ? 'bg-green-400' : 'bg-gray-300'
                    ]"></div>
                    <span class="text-xs text-gray-500">
                      {{ document.has_cdr ? 'Disponible' : 'No disponible' }}
                    </span>
                  </div>
                </div>
                <div v-if="document.has_cdr" class="space-y-2">
                  <button @click="downloadCDR"
                    class="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <Download class="w-3 h-3 mr-1" />
                    Descargar CDR
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-8">
            <AlertCircle class="w-12 h-12 mx-auto text-red-400" />
            <p class="mt-2 text-sm text-gray-500">No se pudo cargar la información del documento</p>
          </div>
        </div>

        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button v-if="document && canRetry" @click="retryDocument" :disabled="retrying"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
            <Loader v-if="retrying" class="w-4 h-4 mr-2 animate-spin" />
            <RefreshCw v-else class="w-4 h-4 mr-2" />
            {{ retrying ? 'Reintentando...' : 'Reintentar' }}
          </button>

          <button v-if="document && document.greenter_ticket" @click="checkStatus" :disabled="checkingStatus"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
            <Search :class="['w-4 h-4 mr-2', checkingStatus && 'animate-spin']" />
            {{ checkingStatus ? 'Consultando...' : 'Consultar Estado' }}
          </button>

          <button @click="$emit('close')"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  X,
  Loader,
  AlertCircle,
  Download,
  RefreshCw,
  Search,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Send
} from 'lucide-vue-next'
import { ElectronicBillingService } from '@/services/electronicBilling'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import ElectronicDocumentStatus from './ElectronicDocumentStatus.vue'
import type { ElectronicDocumentInfo } from '@/types'

interface Props {
  documentId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  documentUpdated: [document: ElectronicDocumentInfo]
}>()

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const loading = ref(true)
const retrying = ref(false)
const checkingStatus = ref(false)
const document = ref<ElectronicDocumentInfo | null>(null)

const canRetry = computed(() =>
  document.value && ['ERROR', 'REJECTED', 'PENDING', 'DRAFT'].includes(document.value.status)
)

const processingEvents = computed(() => {
  if (!document.value) return []

  const events = []

  // Document creation
  events.push({
    type: 'created',
    description: 'Documento creado',
    timestamp: document.value.created_at,
    details: `${getDocTypeText(document.value.doc_type)} ${document.value.series}-${document.value.number}`
  })

  // XML generation
  if (document.value.has_xml) {
    events.push({
      type: 'xml_generated',
      description: 'XML generado',
      timestamp: document.value.updated_at,
      details: 'Documento convertido a formato UBL 2.1'
    })
  }

  // SUNAT submission
  if (document.value.greenter_ticket) {
    events.push({
      type: 'submitted',
      description: 'Enviado a SUNAT',
      timestamp: document.value.updated_at,
      details: `Ticket: ${document.value.greenter_ticket}`
    })
  }

  // CDR received
  if (document.value.has_cdr) {
    events.push({
      type: 'cdr_received',
      description: 'CDR recibido de SUNAT',
      timestamp: document.value.updated_at,
      details: 'Constancia de Recepción procesada'
    })
  }

  // Final status
  if (['ACCEPTED', 'REJECTED', 'ERROR'].includes(document.value.status)) {
    events.push({
      type: document.value.status.toLowerCase(),
      description: getStatusDescription(document.value.status),
      timestamp: document.value.updated_at,
      details: document.value.error_message || undefined
    })
  }

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
})

onMounted(() => {
  loadDocumentDetails()
})

async function loadDocumentDetails() {
  if (!authStore.currentCompany?.id) return

  loading.value = true
  try {
    const documents = await ElectronicBillingService.getElectronicDocuments(
      authStore.currentCompany.id,
      {}
    )

    document.value = documents.find(doc => doc.id === props.documentId) || null
  } catch (error) {
    console.error('Error loading document details:', error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'Error al cargar los detalles del documento'
    })
  } finally {
    loading.value = false
  }
}

async function retryDocument() {
  if (!authStore.currentCompany?.id || !document.value) return

  retrying.value = true
  try {
    const result = await ElectronicBillingService.retrySubmission(
      authStore.currentCompany.id,
      document.value.id
    )

    if (result.success) {
      notificationStore.addNotification({
        type: 'success',
        title: 'Reintento Exitoso',
        message: 'El documento se procesó correctamente'
      })

      // Reload document details
      await loadDocumentDetails()

      if (document.value) {
        emit('documentUpdated', document.value)
      }
    } else {
      notificationStore.addNotification({
        type: 'error',
        title: 'Error en Reintento',
        message: result.error || 'Error al reintentar el documento'
      })
    }
  } catch (error) {
    console.error('Error retrying document:', error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'Error al reintentar el documento'
    })
  } finally {
    retrying.value = false
  }
}

async function checkStatus() {
  if (!authStore.currentCompany?.id || !document.value) return

  checkingStatus.value = true
  try {
    const result = await ElectronicBillingService.checkSunatStatus(
      authStore.currentCompany.id,
      document.value.id
    )

    notificationStore.addNotification({
      type: result.success ? 'info' : 'error',
      title: 'Consulta de Estado',
      message: result.success
        ? `Estado actualizado: ${result.status}`
        : result.error || 'Error al consultar estado'
    })

    if (result.success) {
      await loadDocumentDetails()

      if (document.value) {
        emit('documentUpdated', document.value)
      }
    }
  } catch (error) {
    console.error('Error checking status:', error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'Error al consultar el estado'
    })
  } finally {
    checkingStatus.value = false
  }
}

async function downloadXML() {
  if (!authStore.currentCompany?.id || !document.value) return

  try {
    const result = await ElectronicBillingService.downloadXML(
      authStore.currentCompany.id,
      document.value.id
    )

    if (result.success && result.blob && result.filename) {
      ElectronicBillingService.downloadBlob(result.blob, result.filename)
      notificationStore.addNotification({
        type: 'success',
        title: 'Descarga Exitosa',
        message: `XML descargado: ${result.filename}`
      })
    } else {
      notificationStore.addNotification({
        type: 'error',
        title: 'Error de Descarga',
        message: result.error || 'Error al descargar XML'
      })
    }
  } catch (error: any) {
    console.error('Error downloading XML:', error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'Error al descargar XML'
    })
  }
}

async function downloadCDR() {
  if (!authStore.currentCompany?.id || !document.value) return

  try {
    const result = await ElectronicBillingService.downloadCDR(
      authStore.currentCompany.id,
      document.value.id
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
  } catch (error: any) {
    console.error('Error downloading CDR:', error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'Error al descargar CDR'
    })
  }
}

async function downloadAllFiles() {
  if (!authStore.currentCompany?.id || !document.value) return

  try {
    const result = await ElectronicBillingService.downloadDocumentFiles(
      authStore.currentCompany.id,
      document.value.id
    )

    if (result.success && result.blob && result.filename) {
      ElectronicBillingService.downloadBlob(result.blob, result.filename)
      notificationStore.addNotification({
        type: 'success',
        title: 'Descarga Exitosa',
        message: `Archivos descargados: ${result.filename}`
      })
    } else {
      notificationStore.addNotification({
        type: 'error',
        title: 'Error de Descarga',
        message: result.error || 'Error al descargar archivos'
      })
    }
  } catch (error: any) {
    console.error('Error downloading files:', error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'Error al descargar archivos'
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

function getStatusDescription(status: string): string {
  const descriptions: Record<string, string> = {
    'ACCEPTED': 'Aceptado por SUNAT',
    'REJECTED': 'Rechazado por SUNAT',
    'ERROR': 'Error en procesamiento'
  }
  return descriptions[status] || status
}

function getEventColor(type: string): string {
  const colors: Record<string, string> = {
    'created': 'bg-gray-400',
    'xml_generated': 'bg-blue-500',
    'submitted': 'bg-yellow-500',
    'cdr_received': 'bg-purple-500',
    'accepted': 'bg-green-500',
    'rejected': 'bg-red-500',
    'error': 'bg-red-500'
  }
  return colors[type] || 'bg-gray-400'
}

function getEventIcon(type: string) {
  const icons: Record<string, any> = {
    'created': FileText,
    'xml_generated': FileText,
    'submitted': Send,
    'cdr_received': Download,
    'accepted': CheckCircle,
    'rejected': XCircle,
    'error': AlertCircle
  }
  return icons[type] || Clock
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

function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('es-PE')
}
</script>
