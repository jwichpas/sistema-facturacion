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
              <AlertCircle class="h-6 w-6 text-red-600" />
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 class="text-lg leading-6 font-medium text-gray-900">
                Error al Descargar Archivo
              </h3>

              <div class="mt-4 space-y-4">
                <div class="bg-red-50 border border-red-200 rounded-md p-3">
                  <p class="text-sm text-red-800">
                    <strong>Error:</strong> {{ errorMessage }}
                  </p>
                </div>

                <div class="text-sm text-gray-600">
                  <p class="mb-2">
                    <strong>Documento:</strong> {{ documentInfo.series }}-{{ documentInfo.number }}
                  </p>
                  <p class="mb-2">
                    <strong>Tipo de archivo:</strong> {{ fileType.toUpperCase() }}
                  </p>
                </div>

                <!-- Possible Solutions -->
                <div class="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <h4 class="text-sm font-medium text-blue-900 mb-2">Posibles Soluciones:</h4>
                  <ul class="text-sm text-blue-800 space-y-1">
                    <li v-if="fileType === 'xml'">• Regenerar el XML del documento</li>
                    <li v-if="fileType === 'cdr'">• Consultar nuevamente el estado en SUNAT</li>
                    <li>• Verificar que el documento esté procesado correctamente</li>
                    <li>• Contactar al administrador del sistema</li>
                  </ul>
                </div>

                <!-- Error Details (if available) -->
                <details v-if="technicalDetails" class="text-xs text-gray-500">
                  <summary class="cursor-pointer font-medium">Detalles técnicos</summary>
                  <pre class="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">{{ technicalDetails }}</pre>
                </details>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <!-- Regenerate XML button (only for XML errors) -->
          <button
            v-if="fileType === 'xml' && canRegenerate"
            @click="regenerateXML"
            :disabled="regenerating"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
          >
            <Loader v-if="regenerating" class="w-4 h-4 mr-2 animate-spin" />
            <RefreshCw v-else class="w-4 h-4 mr-2" />
            {{ regenerating ? 'Regenerando...' : 'Regenerar XML' }}
          </button>

          <!-- Check SUNAT status button (only for CDR errors) -->
          <button
            v-if="fileType === 'cdr'"
            @click="checkSunatStatus"
            :disabled="checking"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
          >
            <Loader v-if="checking" class="w-4 h-4 mr-2 animate-spin" />
            <Search v-else class="w-4 h-4 mr-2" />
            {{ checking ? 'Consultando...' : 'Consultar SUNAT' }}
          </button>

          <!-- Retry download button -->
          <button
            @click="retryDownload"
            :disabled="retrying"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
          >
            <Loader v-if="retrying" class="w-4 h-4 mr-2 animate-spin" />
            <Download v-else class="w-4 h-4 mr-2" />
            {{ retrying ? 'Reintentando...' : 'Reintentar Descarga' }}
          </button>

          <button
            @click="$emit('close')"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  AlertCircle,
  RefreshCw,
  Search,
  Download,
  Loader
} from 'lucide-vue-next'
import { ElectronicBillingService } from '@/services/electronicBilling'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import type { ElectronicDocumentInfo } from '@/types'

interface Props {
  documentInfo: ElectronicDocumentInfo
  fileType: 'xml' | 'cdr'
  errorMessage: string
  technicalDetails?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  success: [fileType: 'xml' | 'cdr']
  retry: []
}>()

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const regenerating = ref(false)
const checking = ref(false)
const retrying = ref(false)

const canRegenerate = computed(() => {
  // Solo permitir regeneración para documentos que tienen datos básicos
  return props.documentInfo.status !== 'DRAFT'
})

async function regenerateXML() {
  if (!authStore.currentCompany?.id || regenerating.value) return

  regenerating.value = true
  try {
    const result = await ElectronicBillingService.regenerateXMLForDocument(
      authStore.currentCompany.id,
      props.documentInfo.id
    )

    if (result.success) {
      notificationStore.addNotification({
        type: 'success',
        title: 'XML Regenerado',
        message: 'El XML se ha regenerado correctamente'
      })

      emit('success', 'xml')
      emit('close')
    } else {
      notificationStore.addNotification({
        type: 'error',
        title: 'Error al Regenerar',
        message: result.error || 'Error al regenerar el XML'
      })
    }
  } catch (error: any) {
    console.error('Error regenerating XML:', error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'Error al regenerar el XML'
    })
  } finally {
    regenerating.value = false
  }
}

async function checkSunatStatus() {
  if (!authStore.currentCompany?.id || checking.value) return

  checking.value = true
  try {
    const result = await ElectronicBillingService.checkSunatStatus(
      authStore.currentCompany.id,
      props.documentInfo.id
    )

    if (result.success) {
      notificationStore.addNotification({
        type: 'success',
        title: 'Estado Actualizado',
        message: `Estado del documento: ${result.status}`
      })

      if (result.status === 'ACCEPTED') {
        emit('success', 'cdr')
      }
      emit('close')
    } else {
      notificationStore.addNotification({
        type: 'error',
        title: 'Error al Consultar',
        message: result.error || 'Error al consultar el estado'
      })
    }
  } catch (error: any) {
    console.error('Error checking SUNAT status:', error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'Error al consultar el estado en SUNAT'
    })
  } finally {
    checking.value = false
  }
}

async function retryDownload() {
  if (!authStore.currentCompany?.id || retrying.value) return

  retrying.value = true
  try {
    let result

    if (props.fileType === 'xml') {
      result = await ElectronicBillingService.downloadXML(
        authStore.currentCompany.id,
        props.documentInfo.id
      )
    } else {
      result = await ElectronicBillingService.downloadCDR(
        authStore.currentCompany.id,
        props.documentInfo.id
      )
    }

    if (result.success && result.blob && result.filename) {
      ElectronicBillingService.downloadBlob(result.blob, result.filename)
      notificationStore.addNotification({
        type: 'success',
        title: 'Descarga Exitosa',
        message: `Archivo descargado: ${result.filename}`
      })

      emit('success', props.fileType)
      emit('close')
    } else {
      notificationStore.addNotification({
        type: 'error',
        title: 'Error Persistente',
        message: result.error || 'El error persiste al descargar el archivo'
      })
    }
  } catch (error: any) {
    console.error('Error retrying download:', error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'Error al reintentar la descarga'
    })
  } finally {
    retrying.value = false
  }
}
</script>

