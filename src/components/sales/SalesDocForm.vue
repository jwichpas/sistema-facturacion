<template>
  <div class="max-w-6xl mx-auto">
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Header -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ isEditing ? 'Editar Documento' : 'Nuevo Documento de Venta' }}
            </h2>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ isEditing ? 'Modifica los datos del documento' : 'Completa la información para crear el documento' }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="$emit('cancel')"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="loading || !isFormValid"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <span v-if="loading" class="flex items-center">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </span>
              <span v-else>
                {{ isEditing ? 'Actualizar' : 'Crear Documento' }}
              </span>
            </button>
          </div>
        </div>

        <!-- Document Header Information -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Document Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Documento *
            </label>
            <select
              v-model="form.doc_type"
              :disabled="isEditing"
              class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Seleccionar...</option>
              <option value="01">Factura</option>
              <option value="03">Boleta de Venta</option>
              <option value="07">Nota de Crédito</option>
              <option value="08">Nota de Débito</option>
            </select>
          </div>

          <!-- Series -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Serie *
            </label>
            <input
              v-model="form.series"
              :disabled="isEditing"
              type="text"
              placeholder="F001, B001, etc."
              class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <!-- Number -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Número *
            </label>
            <input
              v-model.number="form.number"
              :disabled="isEditing"
              type="number"
              min="1"
              class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <!-- Issue Date -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha de Emisión *
            </label>
            <input
              v-model="form.issue_date"
              type="date"
              class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <!-- Currency -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Moneda *
            </label>
            <select
              v-model="form.currency_code"
              class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="PEN">Soles (PEN)</option>
              <option value="USD">Dólares (USD)</option>
            </select>
          </div>

          <!-- Exchange Rate -->
          <div v-if="form.currency_code === 'USD'">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Cambio
            </label>
            <input
              v-model.number="form.exchange_rate"
              type="number"
              step="0.001"
              min="0"
              placeholder="3.750"
              class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <!-- Customer Selection -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Cliente</h3>
        <PartySelector
          v-model="selectedCustomer"
          :filters="{ is_customer: true }"
          placeholder="Buscar cliente..."
          @update:model-value="handleCustomerChange"
        />
      </div>

      <!-- Document Items -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">Items del Documento</h3>
          <button
            type="button"
            @click="addItem"
            class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
          >
            <Plus class="w-4 h-4 mr-2" />
            Agregar Item
          </button>
        </div>

        <!-- Items Table -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Producto
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cantidad
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Precio Unit.
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Descuento %
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  IGV
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total
                </th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="(item, index) in form.items" :key="index">
                <td class="px-4 py-4">
                  <ProductSelector
                    v-model="item.selectedProduct"
                    @update:model-value="(product) => handleProductChange(index, product)"
                    placeholder="Buscar producto..."
                    class="min-w-[200px]"
                  />
                  <input
                    v-if="!item.selectedProduct"
                    v-model="item.description"
                    type="text"
                    placeholder="Descripción del producto"
                    class="mt-2 w-full text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </td>
                <td class="px-4 py-4">
                  <input
                    v-model.number="item.quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-20 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    @input="calculateItemTotal(index)"
                  />
                </td>
                <td class="px-4 py-4">
                  <input
                    v-model.number="item.unit_price"
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-24 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    @input="calculateItemTotal(index)"
                  />
                </td>
                <td class="px-4 py-4">
                  <input
                    v-model.number="item.discount_pct"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    class="w-20 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    @input="calculateItemTotal(index)"
                  />
                </td>
                <td class="px-4 py-4">
                  <select
                    v-model="item.igv_affectation"
                    class="w-24 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    @change="calculateItemTotal(index)"
                  >
                    <option value="10">Gravado</option>
                    <option value="20">Exonerado</option>
                    <option value="30">Inafecto</option>
                  </select>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ formatCurrency(item.calculatedTotal || 0) }}
                  </div>
                </td>
                <td class="px-4 py-4 text-right">
                  <button
                    type="button"
                    @click="removeItem(index)"
                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Add Item Button (when no items) -->
        <div v-if="form.items.length === 0" class="text-center py-8">
          <Package class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay items</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Agrega productos o servicios al documento.
          </p>
          <div class="mt-6">
            <button
              type="button"
              @click="addItem"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus class="w-4 h-4 mr-2" />
              Agregar Primer Item
            </button>
          </div>
        </div>
      </div>

      <!-- Document Totals -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Totales del Documento</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Subtotal:</span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {{ formatCurrency(documentTotals.subtotal) }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Op. Gravadas:</span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {{ formatCurrency(documentTotals.total_ope_gravadas) }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Op. Exoneradas:</span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {{ formatCurrency(documentTotals.total_ope_exoneradas) }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Op. Inafectas:</span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {{ formatCurrency(documentTotals.total_ope_inafectas) }}
              </span>
            </div>
          </div>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">IGV (18%):</span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {{ formatCurrency(documentTotals.igv_amount) }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Descuentos:</span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {{ formatCurrency(documentTotals.total_descuentos) }}
              </span>
            </div>
            <div class="border-t border-gray-200 dark:border-gray-700 pt-3">
              <div class="flex justify-between">
                <span class="text-lg font-medium text-gray-900 dark:text-white">Total:</span>
                <span class="text-lg font-bold text-gray-900 dark:text-white">
                  {{ formatCurrency(documentTotals.total) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Observaciones</h3>
        <textarea
          v-model="form.notes"
          rows="3"
          placeholder="Observaciones adicionales del documento..."
          class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
        ></textarea>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useSalesStore } from '@/stores/sales'
import { useProductStore } from '@/stores/product'
import { usePartyStore } from '@/stores/party'
import { useAuthStore } from '@/stores/auth'
import type { SalesDocCreatePayload, SalesDocWithDetails } from '@/services/sales'
import type { Product } from '@/services/product'
import type { Party } from '@/services/party'
import PartySelector from '@/components/parties/PartySelector.vue'
import ProductSelector from '@/components/products/ProductSelector.vue'
import { Plus, Trash2, Package } from 'lucide-vue-next'

// Props
interface Props {
  salesDoc?: SalesDocWithDetails | null
}

const props = withDefaults(defineProps<Props>(), {
  salesDoc: null
})

// Emits
const emit = defineEmits<{
  success: [doc: any]
  cancel: []
}>()

// Stores
const salesStore = useSalesStore()
const productStore = useProductStore()
const partyStore = usePartyStore()
const authStore = useAuthStore()

// Local state
const loading = ref(false)
const selectedCustomer = ref<Party | null>(null)

// Form data
interface FormItem {
  selectedProduct?: Product | null
  product_id?: string
  description?: string
  unit_code: string
  quantity: number
  unit_price: number
  discount_pct: number
  igv_affectation: string
  calculatedTotal?: number
}

const form = ref({
  doc_type: '',
  series: '',
  number: 1,
  issue_date: new Date().toISOString().split('T')[0],
  currency_code: 'PEN',
  exchange_rate: null as number | null,
  customer_id: '',
  notes: '',
  items: [] as FormItem[]
})

// Computed
const isEditing = computed(() => !!props.salesDoc)

const isFormValid = computed(() => {
  return form.value.doc_type &&
         form.value.series &&
         form.value.number &&
         form.value.issue_date &&
         form.value.currency_code &&
         selectedCustomer.value &&
         form.value.items.length > 0 &&
         form.value.items.every(item =>
           (item.product_id || item.description) &&
           item.quantity > 0 &&
           item.unit_price >= 0
         )
})

const documentTotals = computed(() => {
  const calculatedItems = form.value.items.map(item =>
    salesStore.calculateItemTax({
      quantity: item.quantity || 0,
      unit_price: item.unit_price || 0,
      discount_pct: item.discount_pct || 0,
      igv_affectation: item.igv_affectation || '10'
    })
  )

  return salesStore.calculateDocumentTotals(calculatedItems)
})

// Methods
const addItem = () => {
  form.value.items.push({
    selectedProduct: null,
    product_id: '',
    description: '',
    unit_code: 'NIU',
    quantity: 1,
    unit_price: 0,
    discount_pct: 0,
    igv_affectation: '10',
    calculatedTotal: 0
  })
}

const removeItem = (index: number) => {
  form.value.items.splice(index, 1)
}

const handleProductChange = (index: number, product: Product | null) => {
  const item = form.value.items[index]
  if (product) {
    item.selectedProduct = product
    item.product_id = product.id
    item.description = product.name
    item.unit_code = product.unit_code
    // You could set a default price from price lists here
  } else {
    item.selectedProduct = null
    item.product_id = ''
    item.description = ''
  }
  calculateItemTotal(index)
}

const handleCustomerChange = (customer: Party | null) => {
  selectedCustomer.value = customer
  form.value.customer_id = customer?.id || ''
}

const calculateItemTotal = (index: number) => {
  const item = form.value.items[index]
  const calculated = salesStore.calculateItemTax({
    quantity: item.quantity || 0,
    unit_price: item.unit_price || 0,
    discount_pct: item.discount_pct || 0,
    igv_affectation: item.igv_affectation || '10'
  })
  item.calculatedTotal = calculated.line_total_with_tax
}

const getNextNumber = async () => {
  if (form.value.doc_type && form.value.series) {
    const nextNumber = await salesStore.getNextDocumentNumber(form.value.doc_type, form.value.series)
    if (nextNumber) {
      form.value.number = nextNumber
    }
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  loading.value = true

  try {
    const payload: SalesDocCreatePayload = {
      doc: {
        company_id: authStore.currentCompany?.id || '',
        doc_type: form.value.doc_type,
        series: form.value.series,
        number: form.value.number,
        issue_date: form.value.issue_date,
        currency_code: form.value.currency_code,
        exchange_rate: form.value.exchange_rate,
        customer_id: form.value.customer_id,
        notes: form.value.notes,
        // Add calculated totals
        total_ope_gravadas: documentTotals.value.total_ope_gravadas,
        total_ope_exoneradas: documentTotals.value.total_ope_exoneradas,
        total_ope_inafectas: documentTotals.value.total_ope_inafectas,
        total_igv: documentTotals.value.igv_amount,
        total_descuentos: documentTotals.value.total_descuentos,
        total: documentTotals.value.total
      },
      items: form.value.items.map(item => {
        const calculated = salesStore.calculateItemTax({
          quantity: item.quantity || 0,
          unit_price: item.unit_price || 0,
          discount_pct: item.discount_pct || 0,
          igv_affectation: item.igv_affectation || '10'
        })

        return {
          company_id: authStore.currentCompany?.id || '',
          product_id: item.product_id || '',
          description: item.description || '',
          unit_code: item.unit_code,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_pct: item.discount_pct || 0,
          igv_affectation: item.igv_affectation,
          igv_amount: calculated.igv_amount,
          total_line: calculated.total_line
        }
      })
    }

    const result = await salesStore.createSalesDoc(payload)
    if (result) {
      emit('success', result)
    }
  } catch (error) {
    console.error('Error saving sales document:', error)
  } finally {
    loading.value = false
  }
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: form.value.currency_code || 'PEN',
    minimumFractionDigits: 2
  }).format(amount)
}

// Initialize form
const initializeForm = () => {
  if (props.salesDoc) {
    // Load existing document data
    const doc = props.salesDoc
    form.value = {
      doc_type: doc.doc_type,
      series: doc.series,
      number: doc.number,
      issue_date: doc.issue_date,
      currency_code: doc.currency_code,
      exchange_rate: doc.exchange_rate,
      customer_id: doc.customer_id,
      notes: doc.notes || '',
      items: doc.items?.map(item => ({
        selectedProduct: item.product || null,
        product_id: item.product_id,
        description: item.description || '',
        unit_code: item.unit_code,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_pct: item.discount_pct || 0,
        igv_affectation: item.igv_affectation || '10'
      })) || []
    }
    selectedCustomer.value = doc.customer || null
  } else {
    // Initialize with default values
    addItem() // Add first item
  }
}

// Watch for document type and series changes to get next number
watch([() => form.value.doc_type, () => form.value.series], () => {
  if (!isEditing.value) {
    getNextNumber()
  }
})

// Lifecycle
onMounted(() => {
  initializeForm()
})
</script>
