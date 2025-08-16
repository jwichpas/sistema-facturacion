<template>
  <div class="electronic-billing-dashboard space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">
        Facturación Electrónica
      </h1>
      <div class="flex items-center gap-3">
        <button
          @click="refreshData"
          :disabled="loading"
          class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <RefreshCw :class="['w-4 h-4 mr-2', { 'animate-spin': loading }]" />
          Actualizar
        </button>
        <router-link
          to="/electronic-billing/config"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Settings class="w-4 h-4 mr-2" />
          Configuración
        </router-link>
      </div>
    </div>

    <!-- Configuration Status Alert -->
    <div v-if="!billingStatus.has_config" class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
      <div class="flex">
        <AlertTriangle class="h-5 w-5 text-yellow-400 flex-shrink-0" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-yellow-800">
            Configuración Incompleta
          </h3>
          <div class="mt-2 text-sm text-yellow-700">
            <p>
              La facturación electrónica no está completamente configurada.
              <router-link to="/electronic-billing/config" class="font-medium underline">
                Complete la configuración
              </router-link>
              para comenzar a enviar documentos a SUNAT.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Statistics Overview -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Total Documents -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <FileText class="h-8 w-8 text-gray-400" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Total Documentos
                </dt>
                <dd class="flex items-baseline">
                  <div class="text-2xl font-semibold text-gray-900">
                    {{ summary.total_documents }}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- Accepted Documents -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <CheckCircle class="h-8 w-8 text-green-400" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Aceptados
                </dt>
                <dd class="flex items-baseline">
                  <div class="text-2xl font-semibold text-gray-900">
                    {{ summary.accepted }}
                  </div>
                  <div class="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                    {{ summary.acceptance_rate.toFixed(1) }}%
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- Pending Documents -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <Clock class="h-8 w-8 text-yellow-400" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Pendientes
                </dt>
                <dd class="flex items-baseline">
                  <div class="text-2xl font-semibold text-gray-900">
                    {{ summary.pending }}
                  </div>
                  <button
                    v-if="summary.pending > 0"
                    @click="processPendingDocuments"
                    class="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Procesar
                  </button>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- Errors -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <XCircle class="h-8 w-8 text-red-400" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Errores
                </dt>
                <dd class="flex items-baseline">
                  <div class="text-2xl font-semibold text-gray-900">
                    {{ summary.errors + summary.rejected }}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity and Errors -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent Documents -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
            Documentos Recientes
          </h3>

          <div v-if="recentDocuments.length > 0" class="space-y-3">
            <div
              v-for="doc in recentDocuments"
              :key="doc.id"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900">
                  {{ getDocTypeText(doc.doc_type) }} {{ doc.series }}-{{ doc.number }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ doc.customer_name }} • {{ formatCurrency(doc.total) }}
                </p>
              </div>
              <div class="ml-4 flex-shrink-0">
                <ElectronicDocumentStatus
                  :status="doc.status"
                  :has-xml="doc.has_xml"
                  :has-cdr="doc.has_cdr"
                />
              </div>
            </div>
          </div>

          <div v-else class="text-center py-6">
            <FileText class="w-12 h-12 mx-auto text-gray-400" />
            <p class="mt-2 text-sm text-gray-500">
              No hay documentos recientes
            </p>
          </div>

          <div class="mt-4">
            <router-link
              to="/electronic-billing/documents"
              class="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Ver todos los documentos →
            </router-link>
          </div>
        </div>
      </div>

      <!-- Recent Errors -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
            Errores Recientes
          </h3>

          <div v-if="summary.recent_errors.length > 0" class="space-y-3">
            <div
              v-for="error in summary.recent_errors"
              :key="error.id"
              class="p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <div class="flex items-start">
                <AlertCircle class="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div class="ml-2 flex-1 min-w-0">
                  <p class="text-sm font-medium text-red-800">
                    {{ getDocTypeText(error.doc_type) }} {{ error.series }}-{{ error.number }}
                  </p>
                  <p class="text-sm text-red-600 mt-1">
                    {{ error.error_message }}
                  </p>
                  <p class="text-xs text-red-500 mt-1">
                    {{ formatDate(error.created_at) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-6">
            <CheckCircle class="w-12 h-12 mx-auto text-green-400" />
            <p class="mt-2 text-sm text-gray-500">
              No hay errores recientes
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="bg-white shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
          Acciones Rápidas
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <router-link
            to="/sales/new"
            class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus class="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p class="text-sm font-medium text-gray-900">
                Nueva Factura
              </p>
              <p class="text-sm text-gray-500">
                Crear nueva factura electrónica
              </p>
            </div>
          </router-link>

          <router-link
            to="/electronic-billing/documents"
            class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText class="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p class="text-sm font-medium text-gray-900">
                Ver Documentos
              </p>
              <p class="text-sm text-gray-500">
                Gestionar documentos electrónicos
              </p>
            </div>
          </router-link>

          <button
            @click="testConnection"
            :disabled="!billingStatus.has_config || testing"
            class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap :class="['w-8 h-8 mr-3', testing ? 'text-yellow-500' : 'text-purple-500']" />
            <div>
              <p class="text-sm font-medium text-gray-900">
                {{ testing ? 'Probando...' : 'Probar Conexión' }}
              </p>
              <p class="text-sm text-gray-500">
                Verificar conexión con SUNAT
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  RefreshCw,
  Settings,
  AlertTriangle,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Plus,
  Zap
} from 'lucide-vue-next'
import { ElectronicBillingService } from '@/services/electronicBilling'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import ElectronicDocumentStatus from './ElectronicDocumentStatus.vue'
import type { ElectronicDocumentInfo, ElectronicBillingStatus } from '@/types'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const loading = ref(false)
const testing = ref(false)

const billingStatus = ref<ElectronicBillingStatus>({
  has_config: false,
  production_mode: false,
  sol_user_configured: false,
  cert_configured: false,
  api_configured: false
})

const summary = ref({
  total_documents: 0,
  accepted: 0,
  pending: 0,
  rejected: 0,
  errors: 0,
  acceptance_rate: 0,
  recent_errors: []
})

const recentDocuments = ref<ElectronicDocumentInfo[]>([])

onMounted(() => {
  loadDashboardData()
})

async function loadDashboardData() {
  if (!authStore.currentCompany?.id) return

  loading.value = true
  try {
    // Load billing status
    const status = await ElectronicBillingService.getBillingStatus(authStore.currentCompany.id)
    if (status) {
      billingStatus.value = status
    }

    // Load summary
    const summaryData = await ElectronicBillingService.getBillingSummary(authStore.currentCompany.id)
    summary.value = summaryData

    // Load recent documents
    const documents = await ElectronicBillingService.getElectronicDocuments(
      authStore.currentCompany.id,
      {}
    )
    recentDocuments.value = documents.slice(0, 5) // Show only 5 most recent

  } catch (error) {
    console.error('Error loading dashboard data:', error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'Error al cargar los datos del dashboard'
    })
  } finally {
    loading.value = false
  }
}

function refreshData() {
  loadDashboardData()
}

async function processPendingDocuments() {
  if (!authStore.currentCompany?.id || summary.value.pending === 0) return

  try {
    // Get pending document IDs
    const allDocuments = await ElectronicBillingService.getElectronicDocuments(
      authStore.currentCompany.id,
      { status: 'PENDING' }
    )

    const pendingIds = allDocuments.map(doc => doc.id)

    if (pendingIds.length === 0) return

    const result = await ElectronicBillingService.processBatch(
      authStore.currentCompany.id,
      pendingIds,
      { maxConcurrent: 3 }
    )

    notificationStore.addNotification({
      type: 'success',
      title: 'Procesamiento Completado',
      message: `Procesados: ${result.processed}, Exitosos: ${result.successful}, Fallidos: ${result.failed}`
    })

    // Refresh data
    refreshData()
  } catch (error) {
    console.error('Error processing pending documents:', error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'Error al procesar documentos pendientes'
    })
  }
}

async function testConnection() {
  if (!authStore.currentCompany?.id) return

  testing.value = true
  try {
    const result = await ElectronicBillingService.testConnection(authStore.currentCompany.id)

    if (result.success) {
      notificationStore.addNotification({
        type: 'success',
        title: 'Conexión Exitosa',
        message: result.message
      })
    } else {
      notificationStore.addNotification({
        type: 'error',
        title: 'Error de Conexión',
        message: result.message
      })
    }
  } catch (error: any) {
    console.error('Error testing connection:', error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'Error al probar la conexión'
    })
  } finally {
    testing.value = false
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
</script>
</template>
