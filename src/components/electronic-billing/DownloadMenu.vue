<template>
  <div class="download-menu relative">
    <button @click="toggleMenu" :class="[
      'inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
      { 'opacity-50 cursor-not-allowed': !hasFiles }
    ]" :disabled="!hasFiles">
      <Download class="w-3 h-3 mr-1" />
      Descargar
      <ChevronDown class="w-3 h-3 ml-1" />
    </button>

    <!-- Dropdown Menu -->
    <div v-if="showMenu"
      class="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
      <div class="py-1">
        <button v-if="hasXml" @click="downloadXML" :disabled="downloading"
          class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50">
          <FileText class="w-4 h-4 mr-2 text-blue-500" />
          <span class="flex-1 text-left">XML Original</span>
          <Loader v-if="downloading === 'xml'" class="w-3 h-3 animate-spin" />
        </button>

        <button v-if="hasCdr" @click="downloadCDR" :disabled="downloading"
          class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50">
          <Shield class="w-4 h-4 mr-2 text-green-500" />
          <span class="flex-1 text-left">CDR de SUNAT</span>
          <Loader v-if="downloading === 'cdr'" class="w-3 h-3 animate-spin" />
        </button>

        <!-- Preview Options -->
        <div v-if="hasFiles" class="border-t border-gray-100 my-1"></div>

        <button
          v-if="hasXml"
          @click="previewXML"
          :disabled="downloading"
          class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          <Eye class="w-4 h-4 mr-2 text-blue-500" />
          <span class="flex-1 text-left">Ver XML</span>
        </button>

        <button
          v-if="hasCdr"
          @click="previewCDR"
          :disabled="downloading"
          class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          <Eye class="w-4 h-4 mr-2 text-green-500" />
          <span class="flex-1 text-left">Ver CDR</span>
        </button>

        <div v-if="hasXml && hasCdr" class="border-t border-gray-100 my-1"></div>

        <button v-if="hasXml && hasCdr" @click="downloadAll" :disabled="downloading"
          class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50">
          <Archive class="w-4 h-4 mr-2 text-purple-500" />
          <span class="flex-1 text-left">Descargar Todo</span>
          <Loader v-if="downloading === 'all'" class="w-3 h-3 animate-spin" />
        </button>

        <div v-if="hasFiles" class="border-t border-gray-100 my-1"></div>

        <div class="px-4 py-2 text-xs text-gray-500">
          <div class="flex items-center justify-between">
            <span>Archivos disponibles:</span>
            <span>{{ availableCount }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Backdrop -->
    <div v-if="showMenu" @click="closeMenu" class="fixed inset-0 z-40"></div>

    <!-- Preview Modal -->
    <FilePreviewModal
      v-if="showPreviewModal"
      :document-info="{
        id: documentId,
        series: series || '',
        number: number || 0,
        has_xml: hasXml,
        has_cdr: hasCdr,
        doc_type: docType || '',
        customer_name: '',
        total: 0,
        status: 'ACCEPTED',
        issue_date: '',
        created_at: '',
        updated_at: ''
      }"
      :initial-file-type="previewFileType"
      @close="showPreviewModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Download,
  ChevronDown,
  FileText,
  Shield,
  Archive,
  Loader,
  Eye
} from 'lucide-vue-next'
import { ElectronicBillingService } from '@/services/electronicBilling'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import FilePreviewModal from './FilePreviewModal.vue'

interface Props {
  documentId: string
  hasXml?: boolean
  hasCdr?: boolean
  docType?: string
  series?: string
  number?: number
}

const props = withDefaults(defineProps<Props>(), {
  hasXml: false,
  hasCdr: false
})

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const showMenu = ref(false)
const downloading = ref<'xml' | 'cdr' | 'all' | null>(null)
const showPreviewModal = ref(false)
const previewFileType = ref<'xml' | 'cdr'>('xml')

const hasFiles = computed(() => props.hasXml || props.hasCdr)
const availableCount = computed(() => {
  let count = 0
  if (props.hasXml) count++
  if (props.hasCdr) count++
  return count
})

function toggleMenu() {
  if (hasFiles.value) {
    showMenu.value = !showMenu.value
  }
}

function closeMenu() {
  showMenu.value = false
}

async function downloadXML() {
  if (!authStore.currentCompany?.id || downloading.value) return

  downloading.value = 'xml'
  try {
    const result = await ElectronicBillingService.downloadXML(
      authStore.currentCompany.id,
      props.documentId
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
  } finally {
    downloading.value = null
    closeMenu()
  }
}

async function downloadCDR() {
  if (!authStore.currentCompany?.id || downloading.value) return

  downloading.value = 'cdr'
  try {
    const result = await ElectronicBillingService.downloadCDR(
      authStore.currentCompany.id,
      props.documentId
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
  } finally {
    downloading.value = null
    closeMenu()
  }
}

async function downloadAll() {
  if (!authStore.currentCompany?.id || downloading.value) return

  downloading.value = 'all'
  try {
    const result = await ElectronicBillingService.downloadDocumentFiles(
      authStore.currentCompany.id,
      props.documentId
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
  } catch (error: unknown) {
    console.error('Error downloading files:', error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'Error al descargar archivos'
    })
  } finally {
    downloading.value = null
    closeMenu()
  }
}

// Close menu when clicking outside
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function handleClickOutside(event: Event) {
  const target = event.target as HTMLElement
  if (!target.closest('.download-menu')) {
    closeMenu()
  }
}

function previewXML() {
  previewFileType.value = 'xml'
  showPreviewModal.value = true
  closeMenu()
}

function previewCDR() {
  previewFileType.value = 'cdr'
  showPreviewModal.value = true
  closeMenu()
}
</script>
