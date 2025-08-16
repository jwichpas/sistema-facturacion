<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
          {{ isEditing ? 'Editar Documento de Compra' : 'Nuevo Documento de Compra' }}
        </h1>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ isEditing ? 'Modifica los datos del documento' : 'Registra un nuevo documento de compra' }}
        </p>
      </div>

      <router-link
        to="/purchases"
        class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <ArrowLeft class="h-4 w-4 mr-2" />
        Volver
      </router-link>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Document Information -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Información del Documento
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Document Type -->
          <div>
            <label for="docType" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Documento *
            </label>
            <select
              id="docType"
              v-model="form.doc_type"
              required
              class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Seleccionar...</option>
              <option value="01">Factura</option>
              <option value="03">Boleta</option>
              <option value="07">Nota de Crédito</option>
              <option value="08">Nota de Débito</option>
              <option value="14">Recibo por Honorarios</option>
            </select>
          </div>

          <!-- Series -->
          <div>
            <label for="series" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Serie *
            </label>
            <input
              id="series"
              v-model="form.series"
              type="text"
              required
              placeholder="F001"
              class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <!-- Number -->
          <div>
            <label for="number" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Número *
            </label>
            <input
              id="number"
              v-model="form.number"
              type="text"
              required
              placeholder="000001"
              class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <!-- Issue Date -->
          <div>
            <label for="issueDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha de Emisión *
            </label>
            <input
              id="issueDate"
              v-model="form.issue_date"
              type="date"
              required
              class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <!-- Arrival Date -->
          <div>
            <label for="arrivalDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha de Llegada
            </label>
            <input
              id="arrivalDate"
              v-model="form.arrival_date"
              type="date"
              class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <!-- Currency -->
          <div>
            <label for="currency" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Moneda *
            </label>
            <select
              id="currency"
              v-model="form.currency_code"
              required
              class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="PEN">Soles (PEN)</option>
              <option value="USD">Dólares (USD)</option>
              <option value="EUR">Euros (EUR)</option>
            </select>
          </div>
        </div>

        <!-- Exchange Rate (if not PEN) -->
        <div v-if="form.currency_code !== 'PEN'" class="mt-4">
          <label for="exchangeRate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo de Cambio
          </label>
          <input
            id="exchangeRate"
            v-model.number="form.exchange_rate"
            type="number"
            step="0.0001"
            min="0"
            placeholder="3.7500"
            class="block w-full max-w-xs rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <!-- Supplier Selection -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Proveedor
        </h3>

        <SupplierSelector
          v-model="form.supplier_id"
          :required="true"
          @supplier-selected="handleSupplierSelected"
        />
      </div>

      <!-- Items -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Items del Documento
          </h3>
          <button
            type="button"
            @click="addItem"
            class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
          >
            <Plus class="h-4 w-4 mr-2" />
            Agregar Item
          </button>
        </div>

        <div v-if="form.items.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
          <ShoppingCart class="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No hay items agregados</p>
          <p class="text-sm">Haz clic en "Agregar Item" para comenzar</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="(item, index) in form.items"
            :key="index"
            class="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
          >
            <div class="flex items-start justify-between mb-4">
              <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                Item {{ index + 1 }}
              </h4>
              <button
                type="button"
                @click="removeItem(index)"
                class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <!-- Product Selection -->
              <div class="lg:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Producto *
                </label>
                <ProductSelector
                  v-model="item.selectedProduct"
                  :required="true"
                  @update:modelValue="(product) => handleProductSelected(index, product)"
                />
              </div>

              <!-- Quantity -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cantidad *
                </label>
                <input
                  v-model.number="item.quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  @input="calculateItemTotals(index)"
                  class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <!-- Unit Cost -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Costo Unitario *
                </label>
                <input
                  v-model.number="item.unit_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  @input="calculateItemTotals(index)"
                  class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <!-- Discount -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descuento (%)
                </label>
                <input
                  v-model.number="item.discount_pct"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  @input="calculateItemTotals(index)"
                  class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <!-- IGV Affectation -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Afectación IGV
                </label>
                <select
                  v-model="item.igv_affectation"
                  @change="calculateItemTotals(index)"
                  class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="10">Gravado</option>
                  <option value="20">Exonerado</option>
                  <option value="30">Inafecto</option>
                </select>
              </div>

              <!-- Total Line -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Total Línea
                </label>
                <input
                  :value="formatCurrency(item.total_line || 0)"
                  readonly
                  class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 dark:text-white shadow-sm sm:text-sm"
                />
              </div>
            </div>

            <!-- Description -->
            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción
              </label>
              <textarea
                v-model="item.description"
                rows="2"
                class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Descripción adicional del producto..."
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Totals -->
      <div v-if="form.items.length > 0" class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Totales
        </h3>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Op. Gravadas
            </label>
            <input
              :value="formatCurrency(totals.total_ope_gravadas)"
              readonly
              class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 dark:text-white shadow-sm sm:text-sm"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Op. Exoneradas
            </label>
            <input
              :value="formatCurrency(totals.total_ope_exoneradas)"
              readonly
              class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 dark:text-white shadow-sm sm:text-sm"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              IGV
            </label>
            <input
              :value="formatCurrency(totals.igv_amount)"
              readonly
              class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 dark:text-white shadow-sm sm:text-sm"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Total
            </label>
            <input
              :value="formatCurrency(totals.total)"
              readonly
              class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 dark:text-white shadow-sm sm:text-sm font-bold"
            />
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end space-x-3">
        <router-link
          to="/purchases"
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Cancelar
        </router-link>

        <button
          type="submit"
          :disabled="loading || form.items.length === 0"
          class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <span v-if="loading">Guardando...</span>
          <span v-else>{{ isEditing ? 'Actualizar' : 'Crear' }} Documento</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePurchaseStore } from '@/stores/purchase'
import { useAuthStore } from '@/stores/auth'
import SupplierSelector from '@/components/parties/SupplierSelector.vue'
import ProductSelector from '@/components/products/ProductSelector.vue'
import type { PurchaseDocCreatePayload, PurchaseDocItemCalculation } from '@/services/purchase'
import type { Product } from '@/services/product'
import type { Party } from '@/services/party'
import {
  ArrowLeft,
  Plus,
  Trash2,
  ShoppingCart
} from 'lucide-vue-next'

// Router
const route = useRoute()
const router = useRouter()

// Store
const purchaseStore = usePurchaseStore()
const authStore = useAuthStore()

// Reactive state
const loading = ref(false)
const isEditing = computed(() => !!route.params.id)

// Form data
const form = ref({
  doc_type: '',
  series: '',
  number: '',
  issue_date: new Date().toISOString().split('T')[0],
  arrival_date: '',
  currency_code: 'PEN',
  exchange_rate: null as number | null,
  supplier_id: '',
  op_type: '01',
  items: [] as Array<{
    product_id: string
    selectedProduct: Product | null
    description: string
    unit_code: string
    quantity: number
    unit_cost: number
    discount_pct: number
    igv_affectation: string
    igv_amount: number
    isc_amount: number
    total_line: number
  }>
})

// Computed totals
const totals = computed(() => {
  const calculatedItems = form.value.items.map(item =>
    purchaseStore.calculateItemTax(item)
  )
  return purchaseStore.calculateDocumentTotals(calculatedItems)
})

// Methods
const addItem = () => {
  form.value.items.push({
    product_id: '',
    selectedProduct: null,
    description: '',
    unit_code: 'NIU',
    quantity: 1,
    unit_cost: 0,
    discount_pct: 0,
    igv_affectation: '10',
    igv_amount: 0,
    isc_amount: 0,
    total_line: 0
  })
}

const removeItem = (index: number) => {
  form.value.items.splice(index, 1)
}

const handleSupplierSelected = (supplier: Party) => {
  // Additional logic when supplier is selected
  console.log('Supplier selected:', supplier)
}

const handleProductSelected = (index: number, product: Product | null) => {
  const item = form.value.items[index]
  if (item && product) {
    item.selectedProduct = product
    item.product_id = product.id
    item.description = product.name
    item.unit_code = product.unit_code
    calculateItemTotals(index)
  } else if (item && !product) {
    // Clear selection
    item.selectedProduct = null
    item.product_id = ''
    item.description = ''
    item.unit_code = 'NIU'
  }
}

const calculateItemTotals = (index: number) => {
  const item = form.value.items[index]
  if (!item) return

  const calculated = purchaseStore.calculateItemTax(item)

  // Update the item with calculated values
  item.igv_amount = calculated.igv_amount || 0
  item.total_line = calculated.total_line || 0
}

const handleSubmit = async () => {
  loading.value = true

  try {
    const payload: PurchaseDocCreatePayload = {
      doc: {
        company_id: '', // Will be set by the store
        supplier_id: form.value.supplier_id,
        doc_type: form.value.doc_type,
        series: form.value.series,
        number: form.value.number,
        issue_date: form.value.issue_date,
        arrival_date: form.value.arrival_date || null,
        currency_code: form.value.currency_code,
        exchange_rate: form.value.exchange_rate,
        op_type: form.value.op_type,
        total_ope_gravadas: totals.value.total_ope_gravadas,
        total_ope_exoneradas: totals.value.total_ope_exoneradas,
        total_ope_inafectas: totals.value.total_ope_inafectas,
        total_igv: totals.value.igv_amount,
        total_isc: 0,
        total_descuentos: totals.value.total_descuentos,
        total_otros_cargos: 0,
        total: totals.value.total
      },
      items: form.value.items.map(item => ({
        company_id: authStore.currentCompany?.id || '',
        product_id: item.product_id,
        description: item.description,
        unit_code: item.unit_code,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        discount_pct: item.discount_pct,
        igv_affectation: item.igv_affectation,
        igv_amount: item.igv_amount,
        isc_amount: item.isc_amount,
        total_line: item.total_line
      }))
    }

    if (isEditing.value) {
      await purchaseStore.updatePurchaseDoc(route.params.id as string, { doc: payload.doc, items: payload.items.map(item => ({ action: 'create' as const, data: item })) })
    } else {
      await purchaseStore.createPurchaseDoc(payload)
    }

    router.push('/purchases')
  } catch (error) {
    console.error('Error saving purchase document:', error)
  } finally {
    loading.value = false
  }
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2
  }).format(amount)
}

// Load document data if editing
onMounted(async () => {
  if (isEditing.value) {
    const doc = await purchaseStore.loadPurchaseDoc(route.params.id as string)
    if (doc) {
      form.value = {
        doc_type: doc.doc_type,
        series: doc.series,
        number: doc.number,
        issue_date: doc.issue_date,
        arrival_date: doc.arrival_date || '',
        currency_code: doc.currency_code,
        exchange_rate: doc.exchange_rate,
        supplier_id: doc.supplier_id,
        op_type: doc.op_type || '01',
        items: (doc.items || []).map(item => ({
          product_id: item.product_id,
          selectedProduct: item.product || null,
          description: item.description || '',
          unit_code: item.unit_code,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          discount_pct: item.discount_pct,
          igv_affectation: item.igv_affectation,
          igv_amount: item.igv_amount,
          isc_amount: item.isc_amount,
          total_line: item.total_line
        }))
      }
    }
  }
})

// Watch for currency changes to show/hide exchange rate
watch(() => form.value.currency_code, (newCurrency) => {
  if (newCurrency === 'PEN') {
    form.value.exchange_rate = null
  }
})
</script>
