<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Imprimir Documento
        </h3>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X class="w-6 h-6" />
        </button>
      </div>

      <!-- Print Options -->
      <div class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Formato
            </label>
            <select
              v-model="printOptions.format"
              class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="a4">A4 (Carta)</option>
              <option value="thermal">Térmica 80mm</option>
              <option value="thermal-58">Térmica 58mm</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Copias
            </label>
            <input
              v-model.number="printOptions.copies"
              type="number"
              min="1"
              max="10"
              class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div class="flex items-end">
            <label class="flex items-center">
              <input
                v-model="printOptions.includeQR"
                type="checkbox"
                class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Incluir código QR
              </span>
            </label>
          </div>
        </div>
      </div>

      <!-- Preview -->
      <div class="mb-6">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vista Previa</h4>
        <div class="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900 max-h-96 overflow-y-auto">
          <div v-if="salesDoc" class="print-preview" :class="getPreviewClass()">
            <!-- Document Header -->
            <div class="text-center mb-4">
              <h1 class="text-lg font-bold">{{ companyName }}</h1>
              <p class="text-sm">RUC: {{ companyRuc }}</p>
              <p class="text-sm">{{ companyAddress }}</p>
              <div class="mt-2 p-2 border border-gray-400 inline-block">
                <p class="font-bold">{{ getDocTypeLabel(salesDoc.doc_type) }}</p>
                <p>{{ salesDoc.series }}-{{ salesDoc.number.toString().padStart(8, '0') }}</p>
              </div>
            </div>

            <!-- Customer Info -->
            <div class="mb-4 text-sm">
              <p><strong>Cliente:</strong> {{ salesDoc.customer?.fullname }}</p>
              <p><strong>{{ getDocTypeLabel(salesDoc.customer?.doc_type || '') }}:</strong> {{ salesDoc.customer?.doc_number }}</p>
              <p><strong>Fecha:</strong> {{ formatDate(salesDoc.issue_date) }}</p>
            </div>

            <!-- Items -->
            <div class="mb-4">
              <table class="w-full text-xs">
                <thead>
                  <tr class="border-b">
                    <th class="text-left py-1">Descripción</th>
                    <th class="text-center py-1">Cant.</th>
                    <th class="text-right py-1">P.Unit</th>
                    <th class="text-right py-1">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in salesDoc.items" :key="item.id" class="border-b">
                    <td class="py-1">{{ item.description }}</td>
                    <td class="text-center py-1">{{ formatNumber(item.quantity) }}</td>
                    <td class="text-right py-1">{{ formatCurrency(item.unit_price) }}</td>
                    <td class="text-right py-1">{{ formatCurrency(item.total_line + (item.igv_amount || 0)) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Totals -->
            <div class="text-sm space-y-1">
              <div class="flex justify-between">
                <span>Subtotal:</span>
                <span>{{ formatCurrency((salesDoc.total_ope_gravadas || 0) + (salesDoc.total_ope_exoneradas || 0) + (salesDoc.total_ope_inafectas || 0)) }}</span>
              </div>
              <div class="flex justify-between">
                <span>IGV (18%):</span>
                <span>{{ formatCurrency(salesDoc.total_igv || 0) }}</span>
              </div>
              <div class="flex justify-between font-bold border-t pt-1">
                <span>TOTAL:</span>
                <span>{{ formatCurrency(salesDoc.total) }}</span>
              </div>
            </div>

            <!-- QR Code placeholder -->
            <div v-if="printOptions.includeQR" class="text-center mt-4">
              <div class="inline-block w-16 h-16 bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs">
                QR
              </div>
              <p class="text-xs mt-1">Código QR</p>
            </div>

            <!-- Footer -->
            <div class="text-center text-xs mt-4">
              <p>Gracias por su compra</p>
              <p v-if="salesDoc.notes" class="mt-2">{{ salesDoc.notes }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-3">
        <button
          @click="$emit('close')"
          class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-base font-medium rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
        >
          Cancelar
        </button>
        <button
          @click="handlePrint"
          :disabled="printing"
          class="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {{ printing ? 'Imprimiendo...' : 'Imprimir' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSalesStore } from '@/stores/sales'
import { useAuthStore } from '@/stores/auth'
import { X } from 'lucide-vue-next'

// Props
interface Props {
  salesDocId: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
}>()

// Stores
const salesStore = useSalesStore()
const authStore = useAuthStore()

// Local state
const printing = ref(false)
const printOptions = ref({
  format: 'a4',
  copies: 1,
  includeQR: true
})

// Computed
const salesDoc = computed(() => salesStore.currentSalesDoc)
const companyName = computed(() => authStore.currentCompany?.legal_name || 'Mi Empresa')
const companyRuc = computed(() => authStore.currentCompany?.ruc || '12345678901')
const companyAddress = computed(() => authStore.currentCompany?.address || 'Dirección de la empresa')

// Methods
const getPreviewClass = () => {
  const classes = ['bg-white', 'text-black', 'p-4']

  if (printOptions.value.format === 'thermal' || printOptions.value.format === 'thermal-58') {
    classes.push('max-w-xs', 'mx-auto', 'text-sm')
  } else {
    classes.push('max-w-2xl', 'mx-auto')
  }

  return classes.join(' ')
}

const getDocTypeLabel = (docType: string): string => {
  const types: Record<string, string> = {
    '01': 'FACTURA ELECTRÓNICA',
    '03': 'BOLETA DE VENTA ELECTRÓNICA',
    '07': 'NOTA DE CRÉDITO ELECTRÓNICA',
    '08': 'NOTA DE DÉBITO ELECTRÓNICA',
    '1': 'DNI',
    '6': 'RUC',
    '7': 'Pasaporte'
  }
  return types[docType] || docType
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
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

const handlePrint = async () => {
  printing.value = true

  try {
    // Create a new window for printing
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      throw new Error('No se pudo abrir la ventana de impresión')
    }

    // Generate print content
    const printContent = generatePrintHTML()

    printWindow.document.write(printContent)
    printWindow.document.close()

    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print()
      printWindow.close()
    }

    emit('close')
  } catch (error) {
    console.error('Error printing document:', error)
    alert('Error al imprimir el documento')
  } finally {
    printing.value = false
  }
}

const generatePrintHTML = (): string => {
  if (!salesDoc.value) return ''

  const styles = `
    <style>
      @media print {
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
        .no-print { display: none; }
      }
      body { font-family: Arial, sans-serif; font-size: 12px; }
      .header { text-align: center; margin-bottom: 20px; }
      .doc-type { border: 2px solid #000; padding: 10px; display: inline-block; margin: 10px 0; }
      .customer-info { margin-bottom: 20px; }
      .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      .items-table th, .items-table td { border: 1px solid #000; padding: 5px; text-align: left; }
      .items-table th { background-color: #f0f0f0; }
      .totals { text-align: right; }
      .total-line { border-top: 2px solid #000; padding-top: 5px; font-weight: bold; }
      .footer { text-align: center; margin-top: 30px; }
      ${printOptions.value.format.includes('thermal') ? `
        body { width: ${printOptions.value.format === 'thermal-58' ? '58mm' : '80mm'}; font-size: 10px; }
        .items-table th, .items-table td { padding: 2px; font-size: 9px; }
      ` : ''}
    </style>
  `

  const itemsHTML = salesDoc.value.items?.map(item => `
    <tr>
      <td>${item.description}</td>
      <td style="text-align: center;">${formatNumber(item.quantity)}</td>
      <td style="text-align: right;">${formatCurrency(item.unit_price)}</td>
      <td style="text-align: right;">${formatCurrency(item.total_line + (item.igv_amount || 0))}</td>
    </tr>
  `).join('') || ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Imprimir ${salesDoc.value.series}-${salesDoc.value.number.toString().padStart(8, '0')}</title>
      ${styles}
    </head>
    <body>
      <div class="header">
        <h1>${companyName.value}</h1>
        <p>RUC: ${companyRuc.value}</p>
        <p>${companyAddress.value}</p>
        <div class="doc-type">
          <strong>${getDocTypeLabel(salesDoc.value.doc_type)}</strong><br>
          ${salesDoc.value.series}-${salesDoc.value.number.toString().padStart(8, '0')}
        </div>
      </div>

      <div class="customer-info">
        <p><strong>Cliente:</strong> ${salesDoc.value.customer?.fullname}</p>
        <p><strong>${getDocTypeLabel(salesDoc.value.customer?.doc_type || '')}:</strong> ${salesDoc.value.customer?.doc_number}</p>
        <p><strong>Fecha:</strong> ${formatDate(salesDoc.value.issue_date)}</p>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Descripción</th>
            <th>Cant.</th>
            <th>P.Unit</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <div class="totals">
        <p>Subtotal: ${formatCurrency((salesDoc.value.total_ope_gravadas || 0) + (salesDoc.value.total_ope_exoneradas || 0) + (salesDoc.value.total_ope_inafectas || 0))}</p>
        <p>IGV (18%): ${formatCurrency(salesDoc.value.total_igv || 0)}</p>
        <p class="total-line">TOTAL: ${formatCurrency(salesDoc.value.total)}</p>
      </div>

      ${printOptions.value.includeQR ? `
        <div class="footer">
          <p>Código QR: [QR Code placeholder]</p>
        </div>
      ` : ''}

      <div class="footer">
        <p>Gracias por su compra</p>
        ${salesDoc.value.notes ? `<p>${salesDoc.value.notes}</p>` : ''}
      </div>
    </body>
    </html>
  `
}

// Lifecycle
onMounted(async () => {
  if (!salesDoc.value || salesDoc.value.id !== props.salesDocId) {
    await salesStore.loadSalesDoc(props.salesDocId)
  }
})
</script>

<style scoped>
.print-preview {
  font-family: 'Courier New', monospace;
}
</style>
