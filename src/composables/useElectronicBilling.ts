import { ref, computed } from 'vue'
import { ElectronicBillingService } from '@/services/electronicBilling'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import type {
  ElectronicDocumentInfo,
  ElectronicBillingStatus,
  ElectronicDocumentStatus,
  SunatSubmissionResult
} from '@/types'

export function useElectronicBilling() {
  const authStore = useAuthStore()
  const notificationStore = useNotificationStore()

  const loading = ref(false)
  const processing = ref(false)
  const documents = ref<ElectronicDocumentInfo[]>([])
  const billingStatus = ref<ElectronicBillingStatus>({
    has_config: false,
    production_mode: false,
    sol_user_configured: false,
    cert_configured: false,
    api_configured: false
  })

  const stats = ref({
    total: 0,
    by_status: {} as Record<ElectronicDocumentStatus, number>,
    pending_submission: 0,
    errors: 0
  })

  // Computed properties
  const isConfigured = computed(() => billingStatus.value.has_config)
  const pendingCount = computed(() => stats.value.pending_submission)
  const errorCount = computed(() => stats.value.errors)
  const hasErrors = computed(() => errorCount.value > 0)

  // Load billing status
  async function loadBillingStatus() {
    if (!authStore.currentCompany?.id) return

    try {
      const status = await ElectronicBillingService.getBillingStatus(authStore.currentCompany.id)
      if (status) {
        billingStatus.value = status
      }
    } catch (error) {
      console.error('Error loading billing status:', error)
    }
  }

  // Load documents
  async function loadDocuments(filters: any = {}) {
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

  // Load statistics
  async function loadStats() {
    if (!authStore.currentCompany?.id) return

    try {
      const documentStats = await ElectronicBillingService.getElectronicDocumentStats(
        authStore.currentCompany.id
      )
      stats.value = documentStats
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  // Process single document
  async function processDocument(documentId: string): Promise<SunatSubmissionResult> {
    if (!authStore.currentCompany?.id) {
      throw new Error('No hay empresa seleccionada')
    }

    processing.value = true
    try {
      const result = await ElectronicBillingService.processElectronicDocument(
        authStore.currentCompany.id,
        documentId
      )

      if (result.success) {
        notificationStore.addNotification({
          type: 'success',
          title: 'Documento Procesado',
          message: 'El documento se procesó correctamente'
        })
      } else {
        notificationStore.addNotification({
          type: 'error',
          title: 'Error al Procesar',
          message: result.error || 'Error al procesar el documento'
        })
      }

      return result
    } catch (error: any) {
      console.error('Error processing document:', error)
      notificationStore.addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Error al procesar el documento'
      })
      throw error
    } finally {
      processing.value = false
    }
  }

  // Retry document submission
  async function retryDocument(documentId: string, retryConfig?: any): Promise<SunatSubmissionResult> {
    if (!authStore.currentCompany?.id) {
      throw new Error('No hay empresa seleccionada')
    }

    processing.value = true
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

      return result
    } catch (error: any) {
      console.error('Error retrying document:', error)
      notificationStore.addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Error al reintentar el documento'
      })
      throw error
    } finally {
      processing.value = false
    }
  }

  // Cancel document
  async function cancelDocument(documentId: string, reason: string) {
    if (!authStore.currentCompany?.id) return

    processing.value = true
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

      return result
    } catch (error: any) {
      console.error('Error cancelling document:', error)
      notificationStore.addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Error al cancelar el documento'
      })
      throw error
    } finally {
      processing.value = false
    }
  }

  // Process batch of documents
  async function processBatch(documentIds: string[], options: any = {}) {
    if (!authStore.currentCompany?.id) return

    processing.value = true
    try {
      const result = await ElectronicBillingService.processBatch(
        authStore.currentCompany.id,
        documentIds,
        options
      )

      notificationStore.addNotification({
        type: 'success',
        title: 'Procesamiento Completado',
        message: `Procesados: ${result.processed}, Exitosos: ${result.successful}, Fallidos: ${result.failed}`
      })

      return result
    } catch (error: any) {
      console.error('Error processing batch:', error)
      notificationStore.addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Error al procesar lote de documentos'
      })
      throw error
    } finally {
      processing.value = false
    }
  }

  // Check document status
  async function checkDocumentStatus(documentId: string) {
    if (!authStore.currentCompany?.id) return

    try {
      const result = await ElectronicBillingService.checkSunatStatus(
        authStore.currentCompany.id,
        documentId
      )

      return result
    } catch (error: any) {
      console.error('Error checking document status:', error)
      notificationStore.addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Error al consultar estado del documento'
      })
      throw error
    }
  }

  // Test connection to SUNAT
  async function testConnection() {
    if (!authStore.currentCompany?.id) return

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

      return result
    } catch (error: any) {
      console.error('Error testing connection:', error)
      notificationStore.addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Error al probar la conexión'
      })
      throw error
    }
  }

  // Validate configuration
  async function validateConfiguration() {
    if (!authStore.currentCompany?.id) return

    try {
      const result = await ElectronicBillingService.validateConfiguration(authStore.currentCompany.id)
      return result
    } catch (error: any) {
      console.error('Error validating configuration:', error)
      notificationStore.addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Error al validar la configuración'
      })
      throw error
    }
  }

  // Refresh all data
  async function refreshAll() {
    await Promise.all([
      loadBillingStatus(),
      loadDocuments(),
      loadStats()
    ])
  }

  // Utility functions
  function getStatusColor(status: ElectronicDocumentStatus): string {
    const colors = {
      DRAFT: 'gray',
      GENERATING: 'blue',
      PENDING: 'yellow',
      SUBMITTED: 'indigo',
      ACCEPTED: 'green',
      REJECTED: 'red',
      ERROR: 'red',
      CANCELLED: 'gray'
    }
    return colors[status] || 'gray'
  }

  function getStatusText(status: ElectronicDocumentStatus): string {
    const texts = {
      DRAFT: 'Borrador',
      GENERATING: 'Generando XML',
      PENDING: 'Pendiente',
      SUBMITTED: 'Enviado',
      ACCEPTED: 'Aceptado',
      REJECTED: 'Rechazado',
      ERROR: 'Error',
      CANCELLED: 'Anulado'
    }
    return texts[status] || status
  }

  function canRetry(status: ElectronicDocumentStatus): boolean {
    return ['ERROR', 'REJECTED'].includes(status)
  }

  function canCancel(status: ElectronicDocumentStatus): boolean {
    return status === 'ACCEPTED'
  }

  return {
    // State
    loading,
    processing,
    documents,
    billingStatus,
    stats,

    // Computed
    isConfigured,
    pendingCount,
    errorCount,
    hasErrors,

    // Methods
    loadBillingStatus,
    loadDocuments,
    loadStats,
    processDocument,
    retryDocument,
    cancelDocument,
    processBatch,
    checkDocumentStatus,
    testConnection,
    validateConfiguration,
    refreshAll,

    // Utilities
    getStatusColor,
    getStatusText,
    canRetry,
    canCancel
  }
}
