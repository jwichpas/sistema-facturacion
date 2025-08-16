<template>
  <div class="electronic-billing-view">
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Facturación Electrónica</h1>
          <p class="mt-1 text-sm text-gray-500">
            Gestiona y monitorea tus documentos electrónicos con SUNAT
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button
            @click="activeTab = 'dashboard'"
            :class="[
              'px-4 py-2 text-sm font-medium rounded-md',
              activeTab === 'dashboard'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            ]"
          >
            Dashboard
          </button>
          <button
            @click="activeTab = 'pending'"
            :class="[
              'px-4 py-2 text-sm font-medium rounded-md relative',
              activeTab === 'pending'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            ]"
          >
            Pendientes
            <span
              v-if="pendingCount > 0"
              class="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full"
            >
              {{ pendingCount }}
            </span>
          </button>
          <button
            @click="activeTab = 'documents'"
            :class="[
              'px-4 py-2 text-sm font-medium rounded-md',
              activeTab === 'documents'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            ]"
          >
            Todos los Documentos
          </button>
          <button
            @click="activeTab = 'monitor'"
            :class="[
              'px-4 py-2 text-sm font-medium rounded-md relative',
              activeTab === 'monitor'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            ]"
          >
            Monitor
            <div
              v-if="activeDocumentsCount > 0"
              class="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"
            ></div>
          </button>
        </div>
      </div>
    </div>

    <!-- Configuration Alert -->
    <div v-if="!billingConfigured" class="mb-6">
      <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <AlertTriangle class="h-5 w-5 text-yellow-400" />
          </div>
          <div class="ml-3">
            <p class="text-sm text-yellow-700">
              La facturación electrónica no está configurada completamente.
              <router-link
                to="/electronic-billing/config"
                class="font-medium underline text-yellow-700 hover:text-yellow-600"
              >
                Configurar ahora
              </router-link>
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Dashboard Tab -->
      <div v-if="activeTab === 'dashboard'" class="space-y-6">
        <ElectronicBillingDashboard @refresh="handleRefresh" />
      </div>

      <!-- Pending Documents Tab -->
      <div v-if="activeTab === 'pending'" class="space-y-6">
        <PendingDocumentsManager @documents-updated="handleDocumentsUpdated" />
      </div>

      <!-- All Documents Tab -->
      <div v-if="activeTab === 'documents'" class="space-y-6">
        <ElectronicDocumentList @documents-updated="handleDocumentsUpdated" />
      </div>

      <!-- Monitor Tab -->
      <div v-if="activeTab === 'monitor'" class="space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Monitor Component -->
          <div class="lg:col-span-2">
            <DocumentStatusMonitor
              @document-updated="handleDocumentUpdated"
              @retry-requested="handleRetryRequested"
            />
          </div>

          <!-- Quick Stats Sidebar -->
          <div class="space-y-4">
            <!-- Quick Stats -->
            <div class="bg-white shadow rounded-lg p-4">
              <h3 class="text-sm font-medium text-gray-900 mb-3">Estadísticas Rápidas</h3>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">Pendientes:</span>
                  <span class="text-sm font-medium text-yellow-600">{{ stats.pending }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">Procesando:</span>
                  <span class="text-sm font-medium text-blue-600">{{ stats.processing }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">Errores:</span>
                  <span class="text-sm font-medium text-red-600">{{ stats.errors }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">Tasa éxito:</span>
                  <span class="text-sm font-medium text-green-600">{{ stats.successRate }}%</span>
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="bg-white shadow rounded-lg p-4">
              <h3 class="text-sm font-medium text-gray-900 mb-3">Acciones Rápidas</h3>
              <div class="space-y-2">
                <button
                  @click="processAllPending"
                  :disabled="stats.pending === 0 || processing"
                  class="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <Send class="w-4 h-4 mr-2" />
                  {{ processing ? 'Procesando...' : `Procesar Pendientes (${stats.pending})` }}
                </button>

                <button
                  @click="refreshAllData"
                  :disabled="refreshing"
                  class="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <RefreshCw :class="['w-4 h-4 mr-2', refreshing && 'animate-spin']" />
                  Actualizar Todo
                </button>
              </div>
            </div>

            <!-- Recent Activity -->
            <div class="bg-white shadow rounded-lg p-4">
              <h3 class="text-sm font-medium text-gray-900 mb-3">Actividad Reciente</h3>
              <div class="space-y-2">
                <div
                  v-for="activity in recentActivity"
                  :key="activity.id"
                  class="text-xs text-gray-500 p-2 bg-gray-50 rounded"
                >
                  <div class="font-medium">{{ activity.description }}</div>
                  <div class="text-gray-400">{{ formatRelativeTime(activity.timestamp) }}</div>
                </div>
                <div v-if="recentActivity.length === 0" class="text-xs text-gray-400 text-center py-2">
                  No hay actividad reciente
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Retry Modal -->
    <RetryModal
      v-if="showRetryModal"
      :document-id="selectedDocumentId"
      @close="showRetryModal = false"
      @retry="handleRetry"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { AlertTriangle, Send, RefreshCw } from 'lucide-vue-next'
import { ElectronicBillingService } from '@/services/electronicBilling'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import {
  ElectronicBillingDashboard,
  ElectronicDocumentList,
  PendingDocumentsManager,
  DocumentStatusMonitor,
  RetryModal
} from '@/components/electronic-billing'
import type { ElectronicDocumentInfo } from '@/types'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const activeTab = ref('dashboard')
const billingConfigured = ref(true)
const processing = ref(false)
const refreshing = ref(false)
const showRetryModal = ref(false)
const selectedDocumentId = ref('')

const stats = reactive({
  pending: 0,
  processing: 0,
  errors: 0,
  successRate: 0
})

const recentActivity = ref<Array<{
  id: string
  description: string
  timestamp: string
}>>([])

let refreshTimer: NodeJS.Timeout | null = null

const pendingCount = computed(() => stats.pending)
const activeDocumentsCount = computed(() => stats.processing)

onMounted(() => {
  loadInitialData()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})

async function loadInitialData() {
  if (!authStore.currentCompany?.id) return

  try {
    // Check billing configuration
    const billingStatus = await ElectronicBillingService.getBillingStatus(authStore.currentCompany.id)
    billingConfigured.value = billingStatus?.has_config || false

    // Load stats
    await loadStats()
  } catch (error) {
    console.error('Error loading initial data:', error)
  }
}

async function loadStats() {
  if (!authStore.currentCompany?.id) return

  try {
    const summary = await ElectronicBillingService.getElectronicDocumentStats(authStore.currentCompany.id)

    stats.pending = summary.by_status.PENDING + summary.by_status.DRAFT
    stats.processing = summary.by_status.GENERATING + summary.by_status.SUBMITTED
    stats.errors = summary.by_status.ERROR + summary.by_status.REJECTED
    stats.successRate = summary.total > 0
      ? Math.round((summary.by_status.ACCEPTED / summary.total) * 100)
      : 0

    // Load recent activity
    const documents = await ElectronicBillingService.getElectronicDocuments(
      authStore.currentCompany.id,
      {}
    )

    recentActivity.value = documents
      .slice(0, 5)
      .map(doc => ({
        id: doc.id,
        description: `${getDocTypeText(doc.doc_type)} ${doc.series}-${doc.number} - ${doc.status}`,
        timestamp: doc.updated_at
      }))

  } catch (error) {
    console.error('Error loading stats:', error)
  }
}

function startAutoRefresh() {
  refreshTimer = setInterval(() => {
    if (activeTab.value === 'monitor') {
      loadStats()
    }
  }, 30000) // Refresh every 30 seconds
}

function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

async function processAllPending() {
  if (!authStore.currentCompany?.id || stats.pending === 0) return

  processing.value = true
  try {
    // Get all pending documents
    const documents = await ElectronicBillingService.getElectronicDocuments(
      authStore.currentCompany.id,
      {}
    )

    const pendingDocs = documents
      .filter(doc => ['DRAFT', 'PENDING'].includes(doc.status))
      .map(doc => doc.id)

    if (pendingDocs.length === 0) return

    let successful = 0
    let failed = 0

    for (const docId of pendingDocs) {
      try {
        const result = await ElectronicBillingService.processElectronicDocument(
          authStore.currentCompany.id,
          docId
        )

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
      title: 'Procesamiento Completado',
      message: `Exitosos: ${successful}, Fallidos: ${failed}`
    })

    await loadStats()
  } catch (error) {
    console.error('Error processing pending documents:', error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'Error al procesar documentos pendientes'
    })
  } finally {
    processing.value = false
  }
}

async function refreshAllData() {
  refreshing.value = true
  try {
    await loadStats()
    notificationStore.addNotification({
      type: 'success',
      title: 'Datos Actualizados',
      message: 'Toda la información ha sido actualizada'
    })
  } catch (error) {
    console.error('Error refreshing data:', error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'Error al actualizar los datos'
    })
  } finally {
    refreshing.value = false
  }
}

function handleRefresh() {
  loadStats()
}

function handleDocumentsUpdated() {
  loadStats()
}

function handleDocumentUpdated(document: ElectronicDocumentInfo) {
  loadStats()

  // Add to recent activity
  recentActivity.value.unshift({
    id: document.id,
    description: `${getDocTypeText(document.doc_type)} ${document.series}-${document.number} - ${document.status}`,
    timestamp: new Date().toISOString()
  })

  // Keep only last 5 activities
  recentActivity.value = recentActivity.value.slice(0, 5)
}

function handleRetryRequested(documentId: string) {
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

    await loadStats()
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

function getDocTypeText(docType: string): string {
  const types: Record<string, string> = {
    '01': 'Factura',
    '03': 'Boleta',
    '07': 'Nota de Crédito',
    '08': 'Nota de Débito'
  }
  return types[docType] || docType
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date()
  const time = new Date(timestamp)
  const diffMs = now.getTime() - time.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Hace menos de 1 min'
  if (diffMins < 60) return `Hace ${diffMins} min`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `Hace ${diffHours}h`

  const diffDays = Math.floor(diffHours / 24)
  return `Hace ${diffDays}d`
}
</script>
