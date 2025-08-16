<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        @click="$emit('close')"
      ></div>

      <!-- Modal panel -->
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h3 class="text-lg leading-6 font-medium text-gray-900">
                Previsualización de Archivo
              </h3>
              <p class="text-sm text-gray-500 mt-1">
                {{ documentInfo.series }}-{{ documentInfo.number }} - {{ fileType.toUpperCase() }}
              </p>
            </div>
            <button
              @click="$emit('close')"
              class="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <X class="h-6 w-6" />
            </button>
          </div>

          <!-- File Type Tabs -->
          <div class="border-b border-gray-200 mb-4">
            <nav class="-mb-px flex space-x-8">
              <button
                v-if="documentInfo.has_xml"
                @click="switchFileType('xml')"
                :class="[
                  'py-2 px-1 border-b-2 font-medium text-sm',
                  fileType === 'xml'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                ]"
              >
                <FileText class="w-4 h-4 inline mr-2" />
                XML Original
              </button>
              <button
                v-if="documentInfo.has_cdr"
                @click="switchFileType('cdr')"
                :class="[
                  'py-2 px-1 border-b-2 font-medium text-sm',
                  fileType === 'cdr'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                ]"
              >
                <Shield class="w-4 h-4 inline mr-2" />
                CDR de SUNAT
              </button>
            </nav>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="text-center py-8">
            <Loader class="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p class="mt-2 text-sm text-gray-500">Cargando archivo...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="text-center py-8">
            <AlertCircle class="w-12 h-12 mx-auto text-red-400" />
            <p class="mt-2 text-sm text-red-600">{{ error }}</p>
            <button
              @click="loadFileContent"
              class="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw class="w-4 h-4 mr-2" />
              Reintentar
            </button>
          </div>

          <!-- File Content -->
          <div v-else-if="fileContent" class="space-y-4">
            <!-- Toolbar -->
            <div class="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg">
              <div class="flex items-center gap-4">
                <span class="text-sm font-medium text-gray-700">
                  {{ fileType === 'xml' ? 'XML Original' : 'CDR de SUNAT' }}
                </span>
                <span class="text-xs text-gray-500">
                  {{ formatFileSize(fileContent.length) }}
                </span>
              </div>

              <div class="flex items-center gap-2">
                <button
                  @click="copyToClipboard"
                  class="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Copy class="w-3 h-3 mr-1" />
                  Copiar
                </button>

                <button
                  @click="downloadFile"
                  class="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download class="w-3 h-3 mr-1" />
                  Descargar
                </button>

                <button
                  @click="toggleFormat"
                  class="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Code class="w-3 h-3 mr-1" />
                  {{ isFormatted ? 'Sin formato' : 'Formatear' }}
                </button>
              </div>
            </div>

            <!-- Content Display -->
            <div class="relative">
              <pre
                class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-sm font-mono"
                :class="{ 'whitespace-pre-wrap': isFormatted }"
              ><code v-html="highlightedContent"></code></pre>

              <!-- Copy Success Indicator -->
              <div
                v-if="showCopySuccess"
                class="absolute top-2 right-2 bg-green-100 text-green-800 px-2 py-1 rounded text-xs"
              >
                ¡Copiado!
              </div>
            </div>

            <!-- XML Structure Info -->
            <div v-if="fileType === 'xml' && xmlInfo" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 class="text-sm font-medium text-blue-900 mb-2">Información del XML</h4>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span class="text-blue-700 font-medium">Tipo:</span>
                  <span class="text-blue-800 ml-1">{{ xmlInfo.documentType }}</span>
                </div>
                <div>
                  <span class="text-blue-700 font-medium">Moneda:</span>
                  <span class="text-blue-800 ml-1">{{ xmlInfo.currency }}</span>
                </div>
                <div>
                  <span class="text-blue-700 font-medium">Total:</span>
                  <span class="text-blue-800 ml-1">{{ xmlInfo.total }}</span>
                </div>
                <div>
                  <span class="text-blue-700 font-medium">Fecha:</span>
                  <span class="text-blue-800 ml-1">{{ xmlInfo.issueDate }}</span>
                </div>
              </div>
            </div>

            <!-- CDR Response Info -->
            <div v-if="fileType === 'cdr' && cdrInfo" class="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 class="text-sm font-medium text-green-900 mb-2">Respuesta de SUNAT</h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span class="text-green-700 font-medium">Código:</span>
                  <span class="text-green-800 ml-1">{{ cdrInfo.responseCode }}</span>
                </div>
                <div>
                  <span class="text-green-700 font-medium">Estado:</span>
                  <span class="text-green-800 ml-1">{{ cdrInfo.description }}</span>
                </div>
                <div>
                  <span class="text-green-700 font-medium">Fecha:</span>
                  <span class="text-green-800 ml-1">{{ cdrInfo.responseDate }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            @click="downloadFile"
            :disabled="!fileContent"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
          >
            <Download class="w-4 h-4 mr-2" />
            Descargar Archivo
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
import { ref, computed, onMounted, watch } from 'vue'
import {
  X,
  FileText,
  Shield,
  Loader,
  AlertCircle,
  RefreshCw,
  Copy,
  Download,
  Code
} from 'lucide-vue-next'
import { ElectronicBillingService } from '@/services/electronicBilling'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import type { ElectronicDocumentInfo } from '@/types'

interface Props {
  documentInfo: ElectronicDocumentInfo
  initialFileType?: 'xml' | 'cdr'
}

const props = withDefaults(defineProps<Props>(), {
  initialFileType: 'xml'
})

const emit = defineEmits<{
  close: []
}>()

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const loading = ref(false)
const error = ref('')
const fileContent = ref('')
const fileType = ref<'xml' | 'cdr'>(props.initialFileType)
const isFormatted = ref(true)
const showCopySuccess = ref(false)

const xmlInfo = ref<{
  documentType: string
  currency: string
  total: string
  issueDate: string
} | null>(null)

const cdrInfo = ref<{
  responseCode: string
  description: string
  responseDate: string
} | null>(null)

const highlightedContent = computed(() => {
  if (!fileContent.value) return ''

  let content = fileContent.value

  if (isFormatted.value) {
    // Basic XML syntax highlighting
    content = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/(&lt;\/?[^&gt;]+&gt;)/g, '<span class="text-blue-300">$1</span>')
      .replace(/(&lt;!--.*?--&gt;)/gs, '<span class="text-gray-400">$1</span>')
      .replace(/(="[^"]*")/g, '<span class="text-green-300">$1</span>')
  }

  return content
})

onMounted(() => {
  // Set initial file type based on availability
  if (props.initialFileType === 'cdr' && !props.documentInfo.has_cdr) {
    fileType.value = 'xml'
  } else if (props.initialFileType === 'xml' && !props.documentInfo.has_xml) {
    fileType.value = 'cdr'
  }

  loadFileContent()
})

watch(fileType, () => {
  loadFileContent()
})

async function loadFileContent() {
  if (!authStore.currentCompany?.id) return

  loading.value = true
  error.value = ''
  fileContent.value = ''
  xmlInfo.value = null
  cdrInfo.value = null

  try {
    let result

    if (fileType.value === 'xml') {
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

    if (result.success && result.blob) {
      const text = await result.blob.text()
      fileContent.value = text

      // Parse XML info
      if (fileType.value === 'xml') {
        parseXmlInfo(text)
      } else {
        parseCdrInfo(text)
      }
    } else {
      error.value = result.error || 'Error al cargar el archivo'
    }
  } catch (err: any) {
    console.error('Error loading file content:', err)
    error.value = err.message || 'Error al cargar el archivo'
  } finally {
    loading.value = false
  }
}

function parseXmlInfo(xmlContent: string) {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlContent, 'text/xml')

    xmlInfo.value = {
      documentType: doc.querySelector('InvoiceTypeCode')?.textContent || 'N/A',
      currency: doc.querySelector('DocumentCurrencyCode')?.textContent || 'N/A',
      total: doc.querySelector('PayableAmount')?.textContent || 'N/A',
      issueDate: doc.querySelector('IssueDate')?.textContent || 'N/A'
    }
  } catch (err) {
    console.error('Error parsing XML info:', err)
  }
}

function parseCdrInfo(cdrContent: string) {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(cdrContent, 'text/xml')

    cdrInfo.value = {
      responseCode: doc.querySelector('ResponseCode')?.textContent || 'N/A',
      description: doc.querySelector('Description')?.textContent || 'N/A',
      responseDate: doc.querySelector('ResponseDate')?.textContent || 'N/A'
    }
  } catch (err) {
    console.error('Error parsing CDR info:', err)
  }
}

function switchFileType(type: 'xml' | 'cdr') {
  fileType.value = type
}

function toggleFormat() {
  isFormatted.value = !isFormatted.value
}

async function copyToClipboard() {
  if (!fileContent.value) return

  try {
    await navigator.clipboard.writeText(fileContent.value)
    showCopySuccess.value = true
    setTimeout(() => {
      showCopySuccess.value = false
    }, 2000)
  } catch (err) {
    console.error('Error copying to clipboard:', err)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'No se pudo copiar al portapapeles'
    })
  }
}

async function downloadFile() {
  if (!authStore.currentCompany?.id || !fileContent.value) return

  try {
    let result

    if (fileType.value === 'xml') {
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
    }
  } catch (error: any) {
    console.error('Error downloading file:', error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'Error al descargar el archivo'
    })
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

