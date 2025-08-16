<template>
  <div class="document-status-monitor">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-medium text-gray-900">
        Monitor de Estado en Tiempo Real
      </h3>
      <div class="flex items-center gap-2">
        <div class="flex items-center text-sm text-gray-500">
          <div :class="['w-2 h-2 rounded-full mr-2', isConnected ? 'bg-green-400' : 'bg-red-400']"></div>
          {{ isConnected ? 'Conectado' : 'Desconectado' }}
        </div>
        <button
          @click="toggleMonitoring"
          :class="[
            'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
            isMonitoring
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          ]"
        >
          <div :class="['w-2 h-2 rounded-full mr-2', isMonitoring ? 'bg-green-400' : 'bg-gray-400']"></div>
          {{ isMonitoring ? 'Monitoreando' : 'Pausado' }}
        </button>
      </div>
    </div>

    <!-- Active Documents -->
    <div v-if="activeDocuments.length > 0" class="space-y-3">
      <div
        v-for="doc in activeDocuments"
        :key="doc.id"
        class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3">
              <div>
                <p class="text-sm font-medium text-gray-900">
                  {{ getDocTypeText(doc.doc_type) }} {{ doc.series }}-{{ doc.number }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ doc.customer_name }}
                </p>
              </div>

              <!-- Status with animation -->
              <div class="flex items-center gap-2">
                <ElectronicDocumentStatus
                  :status="doc.status"
                  :has-xml="doc.has_xml"
                  :has-cdr="doc.has_cdr"
                  :show-actions="false"
                />

                <!-- Processing indicator -->
                <div v-if="isProcessingStatus(doc.status)" class="flex items-center text-xs text-blue-600">
                  <Loader class="w-3 h-3 mr-1 animate-spin" />
                  Procesando...
                </div>
              </div>
            </div>

            <!-- Progress bar for processing documents -->
            <div v-if="isProcessingStatus(doc.status)" class="mt-2">
              <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>{{ getStatusDescription(doc.status) }}</span>
                <span>{{ getElapsedTime(doc.updated_at) }}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-1">
                <div
                  class="bg-blue-600 h-1 rounded-full transition-all duration-1000"
                  :style="{ width: `${getProgressPercentage(doc.status)}%` }"
                ></div>
              </div>
            </div>

            <!-- Error details -->
            <div v-if="doc.status === 'ERROR' && doc.error_message" class="mt-2">
              <div class="bg-red-50 border border-red-200 rounded-md p-2">
                <div class="flex">
                  <AlertCircle class="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div class="ml-2">
                    <p class="text-xs text-red-800">{{ doc.error_message }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="ml-4 flex-shrink-0">
            <div class="flex items-center gap-2">
              <!-- Retry button for failed documents -->
              <button
                v-if="['ERROR', 'REJECTED'].includes(doc.status)"
                @click="retryDocument(doc.id)"
                class="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw class="w-3 h-3 mr-1" />
                Reintentar
              </button>

              <!-- Check status button -->
              <button
                v-if="doc.greenter_ticket && ['SUBMITTED', 'PENDING'].includes(doc.status)"
                @click="checkStatus(doc.id)"
                :disabled="checkingStatus[doc.id]"
                class="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Search :class="['w-3 h-3 mr-1', checkingStatus[doc.id] && 'animate-spin']" />
                Consultar
              </button>

              <!-- Remove from monitor -->
              <button
                @click="removeFromMonitor(doc.id)"
                class="inline-flex items-center px-2 py-1 text-xs leading-4 font-medium rounded text-gray-400 hover:text-gray-600"
              >
                <X class="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-8">
      <Clock class="w-12 h-12 mx-auto text-gray-400" />
      <p class="mt-2 text-sm text-gray-500">
        No hay documentos en proceso
      </p>
      <p class="text-xs text-gray-400 mt-1">
        Los documentos aparecerán aquí cuando estén siendo procesados
      </p>
    </div>

    <!-- Auto-refresh settings -->
    <div class="mt-4 pt-4 border-t border-gray-200">
      <div class="flex items-center justify-between text-sm">
        <span class="text-gray-500">Actualización automática:</span>
        <select
          v-model="refreshInterval"
          @change="updateRefreshInterval"
          class="text-xs border-gray-300 rounded focus:border-blue-500 focus:ring-blue-500"
        >
          <option :value="0">Desactivada</option>
          <option :value="5000">5 segundos</option>
          <option :value="10000">10 segundos</option>
          <option :value="30000">30 segundos</option>
          <option :value="60000">1 minuto</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import {
  Loader,
  AlertCircle,
  RefreshCw,
  Search,
  X,
  Clock
} from 'lucide-vue-next'
import { ElectronicBillingService } from '@/services/electronicBilling'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import ElectronicDocumentStatus from './ElectronicDocumentStatus.vue'
import type { ElectronicDocumentInfo } from '@/types'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const isMonitoring = ref(true)
const isConnected = ref(true)
const activeDocuments = ref<ElectronicDocumentInfo[]>([])
const checkingStatus = reactive<Record<string, boolean>>({})
const refreshInterval = ref(10000) // 10 seconds default
let refreshTimer: NodeJS.Timeout | null = null

const emit = defineEmits<{
  documentUpdated: [document: ElectronicDocumentInfo]
  retryRequested: [documentId: string]
}>()

onMounted(() => {
  loadActiveDocuments()
  startMonitoring()
})

onUnmounted(() => {
  stopMonitoring()
})

async function loadActiveDocuments() {
  if (!authStore.currentCompany?.id) return

  try {
    const documents = await ElectronicBillingService.getElectronicDocuments(
      authStore.currentCompany.id,
      {}
    )

    // Filter documents that are in active processing states
    activeDocuments.value = documents.filter(doc =>
      ['GENERATING', 'PENDING', 'SUBMITTED', 'ERROR', 'REJECTED'].includes(doc.status)
    )

    isConnected.value = true
  } catch (error) {
    console.error('Error loading active documents:', error)
    isConnected.value = false
  }
}

function startMonitoring() {
  if (refreshInterval.value > 0) {
    refreshTimer = setInterval(() => {
      if (isMonitoring.value) {
        loadActiveDocuments()
      }
    }, refreshInterval.value)
  }
}

function stopMonitoring() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

function toggleMonitoring() {
  isMonitoring.value = !isMonitoring.value
}

function updateRefreshInterval() {
  stopMonitoring()
  startMonitoring()
}

async function checkStatus(documentId: string) {
  if (!authStore.currentCompany?.id) return

  checkingStatus[documentId] = true

  try {
    const result = await ElectronicBillingService.checkSunatStatus(
      authStore.currentCompany.id,
      documentId
    )

    if (result.success) {
      // Refresh the document list to get updated status
      await loadActiveDocuments()

      notificationStore.addNotification({
        type: 'info',
        title: 'Estado Actualizado',
        message: `Estado del documento actualizado: ${result.status}`
      })
    } else {
      notificationStore.addNotification({
        type: 'error',
        title: 'Error al Consultar',
        message: result.error || 'Error al consultar el estado'
      })
    }
  } catch (error: any) {
    console.error('Error checking status:', error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'Error al consultar el estado del documento'
    })
  } finally {
    checkingStatus[documentId] = false
  }
}

function retryDocument(documentId: string) {
  emit('retryRequested', documentId)
}

function removeFromMonitor(documentId: string) {
  activeDocuments.value = activeDocuments.value.filter(doc => doc.id !== documentId)
}

function isProcessingStatus(status: string): boolean {
  return ['GENERATING', 'PENDING', 'SUBMITTED'].includes(status)
}

function getStatusDescription(status: string): string {
  const descriptions: Record<string, string> = {
    'GENERATING': 'Generando XML...',
    'PENDING': 'Esperando envío...',
    'SUBMITTED': 'Enviado a SUNAT...',
    'ERROR': 'Error en procesamiento',
    'REJECTED': 'Rechazado por SUNAT'
  }
  return descriptions[status] || status
}

function getProgressPercentage(status: string): number {
  const progress: Record<string, number> = {
    'GENERATING': 25,
    'PENDING': 50,
    'SUBMITTED': 75,
    'ACCEPTED': 100,
    'ERROR': 0,
    'REJECTED': 0
  }
  return progress[status] || 0
}

function getElapsedTime(updatedAt: string): string {
  const now = new Date()
  const updated = new Date(updatedAt)
  const diffMs = now.getTime() - updated.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Hace menos de 1 min'
  if (diffMins < 60) return `Hace ${diffMins} min`

  const diffHours = Math.floor(diffMins / 60)
  return `Hace ${diffHours}h ${diffMins % 60}min`
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

