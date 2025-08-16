<template>
  <div v-if="salesDoc" class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ getDocTypeLabel(salesDoc.doc_type) }} {{ salesDoc.series }}-{{ salesDoc.number.toString().padStart(8,
                '0') }}
            </h1>
            <span :class="getStatusBadgeClass(salesDoc.greenter_status)">
              {{ getStatusLabel(salesDoc.greenter_status) }}
            </span>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Emitido el {{ formatDate(salesDoc.issue_date) }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button @click="$emit('edit', salesDoc.id)"
            class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
            <Edit class="w-4 h-4 mr-2" />
            Editar
          </button>
          <button @click="$emit('print', salesDoc.id)"
            class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
            <Printer class="w-4 h-4 mr-2" />
            Imprimir
          </button>
          <button v-if="canSendToSunat" @click="sendToSunat" :disabled="sending"
            class="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50">
            <Send class="w-4 h-4 mr-2" />
            {{ sending ? 'Enviando...' : 'Enviar a SUNAT' }}
          </button>
        </div>
      </div>

      <!-- Document Info Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Información del Documento
          </h3>
          <dl class="mt-2 space-y-1">
            <div>
              <dt class="text-sm text-gray-600 dark:text-gray-400">Tipo:</dt>
              <dd class="text-sm font-medium text-gray-900 dark:text-white">
                {{ getDocTypeLabel(salesDoc.doc_type) }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-gray-600 dark:text-gray-400">Serie-Número:</dt>
              <dd class="text-sm font-medium text-gray-900 dark:text-white">
                {{ salesDoc.series }}-{{ salesDoc.number.toString().padStart(8, '0') }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-gray-600 dark:text-gray-400">Fecha de Emisión:</dt>
              <dd class="text-sm font-medium text-gray-900 dark:text-white">
                {{ formatDate(salesDoc.issue_date) }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-gray-600 dark:text-gray-400">Moneda:</dt>
              <dd class="text-sm font-medium text-gray-900 dark:text-white">
                {{ salesDoc.currency_code }}
                <span v-if="salesDoc.exchange_rate" class="text-gray-500">
                  (T.C: {{ salesDoc.exchange_rate }})
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <div>
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Cliente
          </h3>
          <dl class="mt-2 space-y-1">
            <div>
              <dt class="text-sm text-gray-600 dark:text-gray-400">Nombre/Razón Social:</dt>
              <dd class="text-sm font-medium text-gray-900 dark:text-white">
                {{ salesDoc.customer?.fullname }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-gray-600 dark:text-gray-400">Documento:</dt>
              <dd class="text-sm font-medium text-gray-900 dark:text-white">
                {{ salesDoc.customer?.doc_type }}-{{ salesDoc.customer?.doc_number }}
              </dd>
            </div>
            <div v-if="salesDoc.customer?.email">
              <dt class="text-sm text-gray-600 dark:text-gray-400">Email:</dt>
              <dd class="text-sm font-medium text-gray-900 dark:text-white">
                {{ salesDoc.customer.email }}
              </dd>
            </div>
            <div v-if="salesDoc.customer?.phone">
              <dt class="text-sm text-gray-600 dark:text-gray-400">Teléfono:</dt>
              <dd class="text-sm font-medium text-gray-900 dark:text-white">
                {{ salesDoc.customer.phone }}
              </dd>
            </div>
          </dl>
        </div>

        <div>
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Facturación Electrónica
          </h3>
          <dl class="mt-2 space-y-1">
            <div>
              <dt class="text-sm text-gray-600 dark:text-gray-400">Estado:</dt>
              <dd class="text-sm font-medium">
                <span :class="getStatusBadgeClass(salesDoc.greenter_status)">
                  {{ getStatusLabel(salesDoc.greenter_status) }}
                </span>
              </dd>
            </div>
            <div v-if="salesDoc.greenter_ticket">
              <dt class="text-sm text-gray-600 dark:text-gray-400">Ticket:</dt>
              <dd class="text-sm font-medium text-gray-900 dark:text-white font-mono">
                {{ salesDoc.greenter_ticket }}
              </dd>
            </div>
            <div v-if="salesDoc.greenter_hash">
              <dt class="text-sm text-gray-600 dark:text-gray-400">Hash:</dt>
              <dd class="text-sm font-medium text-gray-900 dark:text-white font-mono text-xs">
                {{ salesDoc.greenter_hash.substring(0, 20) }}...
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>

    <!-- Items -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Items del Documento</h3>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Producto/Servicio
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Cantidad
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Precio Unit.
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Descuento
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                IGV
              </th>
              <th
                class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="item in salesDoc.items" :key="item.id">
              <td class="px-4 py-4">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ item.description }}
                </div>
                <div v-if="item.product?.sku" class="text-sm text-gray-500 dark:text-gray-400">
                  SKU: {{ item.product.sku }}
                </div>
              </td>
              <td class="px-4 py-4 text-center text-sm text-gray-900 dark:text-white">
                {{ formatNumber(item.quantity) }} {{ item.unit_code }}
              </td>
              <td class="px-4 py-4 text-center text-sm text-gray-900 dark:text-white">
                {{ formatCurrency(item.unit_price) }}
              </td>
              <td class="px-4 py-4 text-center text-sm text-gray-900 dark:text-white">
                {{ item.discount_pct || 0 }}%
              </td>
              <td class="px-4 py-4 text-center text-sm text-gray-900 dark:text-white">
                {{ formatCurrency(item.igv_amount || 0) }}
              </td>
              <td class="px-4 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                {{ formatCurrency(item.total_line) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Totals -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Totales</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Op. Gravadas:</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ formatCurrency(salesDoc.total_ope_gravadas || 0) }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Op. Exoneradas:</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ formatCurrency(salesDoc.total_ope_exoneradas || 0) }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Op. Inafectas:</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ formatCurrency(salesDoc.total_ope_inafectas || 0) }}
            </span>
          </div>
        </div>
        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">IGV (18%):</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ formatCurrency(salesDoc.total_igv || 0) }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Descuentos:</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ formatCurrency(salesDoc.total_descuentos || 0) }}
            </span>
          </div>
          <div class="border-t border-gray-200 dark:border-gray-700 pt-3">
            <div class="flex justify-between">
              <span class="text-lg font-medium text-gray-900 dark:text-white">Total:</span>
              <span class="text-lg font-bold text-gray-900 dark:text-white">
                {{ formatCurrency(salesDoc.total) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Notes -->
    <div v-if="salesDoc.notes" class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Observaciones</h3>
      <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
        {{ salesDoc.notes }}
      </p>
    </div>

    <!-- Electronic Invoicing Details -->
    <div v-if="salesDoc.greenter_status && salesDoc.greenter_status !== 'pending'"
      class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Detalles de Facturación Electrónica</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estado del Documento</h4>
          <div class="space-y-2">
            <div class="flex items-center">
              <span :class="getStatusBadgeClass(salesDoc.greenter_status)">
                {{ getStatusLabel(salesDoc.greenter_status) }}
              </span>
            </div>
            <div v-if="salesDoc.greenter_ticket" class="text-sm text-gray-600 dark:text-gray-400">
              Ticket: <span class="font-mono">{{ salesDoc.greenter_ticket }}</span>
            </div>
          </div>
        </div>
        <div class="space-y-2">
          <button v-if="salesDoc.greenter_xml" @click="downloadXML"
            class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
            <Download class="w-4 h-4 mr-2" />
            Descargar XML
          </button>
          <button v-if="salesDoc.greenter_cdr" @click="downloadCDR"
            class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 ml-2">
            <Download class="w-4 h-4 mr-2" />
            Descargar CDR
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Loading State -->
  <div v-else-if="loading" class="flex justify-center py-12">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>

  <!-- Error State -->
  <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
    <div class="flex">
      <AlertCircle class="h-5 w-5 text-red-400" />
      <div class="ml-3">
        <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
        <p class="mt-1 text-sm text-red-700 dark:text-red-300">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSalesStore } from '@/stores/sales'
import type { SalesDocWithDetails } from '@/services/sales'
import {
  Edit,
  Printer,
  Send,
  Download,
  AlertCircle
} from 'lucide-vue-next'

// Props
interface Props {
  salesDocId: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  edit: [id: string]
  print: [id: string]
}>()

// Store
const salesStore = useSalesStore()

// Local state
const sending = ref(false)

// Computed
const salesDoc = computed(() => salesStore.currentSalesDoc)
const loading = computed(() => salesStore.loading)
const error = computed(() => salesStore.error)

const canSendToSunat = computed(() => {
  return salesDoc.value &&
    ['01', '03', '07', '08'].includes(salesDoc.value.doc_type) &&
    (!salesDoc.value.greenter_status || salesDoc.value.greenter_status === 'pending')
})

// Methods
const getDocTypeLabel = (docType: string): string => {
  const types: Record<string, string> = {
    '01': 'Factura',
    '03': 'Boleta de Venta',
    '07': 'Nota de Crédito',
    '08': 'Nota de Débito'
  }
  return types[docType] || docType
}

const getStatusLabel = (status: string | null): string => {
  if (!status) return 'Pendiente'

  const statuses: Record<string, string> = {
    'pending': 'Pendiente',
    'sent': 'Enviado',
    'accepted': 'Aceptado',
    'rejected': 'Rechazado',
    'error': 'Error'
  }
  return statuses[status] || status
}

const getStatusBadgeClass = (status: string | null): string => {
  const baseClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'

  if (!status) return `${baseClass} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`

  const statusClasses: Record<string, string> = {
    'pending': `${baseClass} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`,
    'sent': `${baseClass} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`,
    'accepted': `${baseClass} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`,
    'rejected': `${baseClass} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`,
    'error': `${baseClass} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`
  }

  return statusClasses[status] || `${baseClass} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatCurrency = (amount: number): string => {
  const currency = salesDoc.value?.currency_code || 'PEN'
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(amount)
}

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6
  }).format(value)
}

const sendToSunat = async () => {
  if (!salesDoc.value) return

  sending.value = true
  try {
    // This would integrate with the electronic invoicing service
    // For now, we'll just update the status
    await salesStore.updateElectronicInvoicingStatus(
      salesDoc.value.id,
      'sent',
      `TICKET-${Date.now()}`,
      undefined,
      undefined,
      `HASH-${Date.now()}`
    )

    // Reload the document to get updated status
    await salesStore.loadSalesDoc(props.salesDocId)
  } catch (error) {
    console.error('Error sending to SUNAT:', error)
  } finally {
    sending.value = false
  }
}

const downloadXML = () => {
  if (!salesDoc.value?.greenter_xml) return

  const blob = new Blob([salesDoc.value.greenter_xml], { type: 'application/xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${salesDoc.value.series}-${salesDoc.value.number.toString().padStart(8, '0')}.xml`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const downloadCDR = () => {
  if (!salesDoc.value?.greenter_cdr) return

  const blob = new Blob([salesDoc.value.greenter_cdr], { type: 'application/zip' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `R-${salesDoc.value.series}-${salesDoc.value.number.toString().padStart(8, '0')}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Lifecycle
onMounted(async () => {
  await salesStore.loadSalesDoc(props.salesDocId)
})
</script>
