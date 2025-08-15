<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Procesar Pago
          </h3>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- Order Summary -->
        <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Resumen del Pedido
          </h4>

          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Items:</span>
              <span>{{ cartItems.length }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Subtotal:</span>
              <span>{{ formatCurrency(cartTotals.subtotal) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">IGV (18%):</span>
              <span>{{ formatCurrency(cartTotals.igv_amount) }}</span>
            </div>
            <div class="flex justify-between font-semibold text-lg border-t border-gray-200 dark:border-gray-700 pt-2">
              <span>Total:</span>
              <span>{{ formatCurrency(cartTotals.total) }}</span>
            </div>
          </div>
        </div>

        <!-- Customer Info -->
        <div v-if="customer">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Cliente
          </h4>
          <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <div class="text-sm">
              <div class="font-medium">{{ customer.fullname }}</div>
              <div class="text-gray-600 dark:text-gray-400">
                {{ customer.doc_type }}: {{ customer.doc_number }}
              </div>
              <div v-if="customer.email" class="text-gray-600 dark:text-gray-400">
                {{ customer.email }}
              </div>
            </div>
          </div>
        </div>

        <!-- Document Type Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipo de Comprobante *
          </label>
          <select
            v-model="selectedDocType"
            class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Seleccionar tipo</option>
            <option value="03">Boleta de Venta</option>
            <option value="01">Factura</option>
          </select>
        </div>

        <!-- Series Selection -->
        <div v-if="selectedDocType">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Serie *
          </label>
          <select
            v-model="selectedSeries"
            class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Seleccionar serie</option>
            <option v-for="series in availableSeries" :key="series" :value="series">
              {{ series }}
            </option>
          </select>
        </div>

        <!-- Payment Method -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Método de Pago *
          </label>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="method in paymentMethods"
              :key="method.id"
              @click="selectedPaymentMethod = method.id"
              :class="[
                'p-4 rounded-lg border-2 text-left transition-colors',
                selectedPaymentMethod === method.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              ]"
            >
              <div class="flex items-center gap-3">
                <component :is="method.icon" class="w-6 h-6 text-gray-600 dark:text-gray-400" />
                <div>
                  <div class="font-medium text-gray-900 dark:text-white">
                    {{ method.name }}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {{ method.description }}
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Cash Payment Details -->
        <div v-if="selectedPaymentMethod === 'cash'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Monto Recibido
            </label>
            <input
              v-model.number="cashReceived"
              type="number"
              step="0.01"
              min="0"
              class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          <div v-if="cashReceived > 0" class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-blue-900 dark:text-blue-200">
                Cambio:
              </span>
              <span class="text-lg font-semibold text-blue-900 dark:text-blue-200">
                {{ formatCurrency(Math.max(0, cashReceived - cartTotals.total)) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Observaciones
          </label>
          <textarea
            v-model="notes"
            rows="3"
            class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Observaciones adicionales..."
          ></textarea>
        </div>

        <!-- Validation Errors -->
        <div v-if="validationErrors.length > 0" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div class="flex">
            <AlertCircle class="h-5 w-5 text-red-400 flex-shrink-0" />
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
                Errores de validación
              </h3>
              <ul class="mt-1 text-sm text-red-700 dark:text-red-300 list-disc list-inside">
                <li v-for="error in validationErrors" :key="error">{{ error }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
        <BaseButton
          @click="$emit('close')"
          variant="outline"
        >
          Cancelar
        </BaseButton>
        <BaseButton
          @click="processPayment"
          :disabled="!canProcessPayment || processing"
          :loading="processing"
        >
          <CreditCard class="w-4 h-4 mr-2" />
          {{ processing ? 'Procesando...' : 'Procesar Pago' }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSalesStore } from '@/stores/sales'
import type { SalesDocCreatePayload } from '@/services/sales'
import BaseButton from '@/components/ui/BaseButton.vue'
import {
  X,
  CreditCard,
  Banknote,
  Smartphone,
  AlertCircle
} from 'lucide-vue-next'

interface CartItem {
  id: string
  product: {
    id: string
    name: string
    sku: string
  }
  quantity: number
  unit_price: number
  discount_pct: number
  igv_affectation: string
}

interface CartTotals {
  subtotal: number
  igv_amount: number
  total: number
  total_ope_gravadas: number
  total_ope_exoneradas: number
  total_ope_inafectas: number
  total_descuentos: number
}

import type { Tables } from '@/types/database'

type Customer = Tables<'parties'>

interface Props {
  cartItems: CartItem[]
  cartTotals: CartTotals
  customer?: Customer | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'close': []
  'payment-completed': [salesDoc: unknown]
}>()

// Stores
const authStore = useAuthStore()
const salesStore = useSalesStore()

// Local state
const selectedDocType = ref('')
const selectedSeries = ref('')
const selectedPaymentMethod = ref('')
const cashReceived = ref(0)
const notes = ref('')
const processing = ref(false)
const validationErrors = ref<string[]>([])

// Payment methods
const paymentMethods = [
  {
    id: 'cash',
    name: 'Efectivo',
    description: 'Pago en efectivo',
    icon: Banknote
  },
  {
    id: 'card',
    name: 'Tarjeta',
    description: 'Débito/Crédito',
    icon: CreditCard
  },
  {
    id: 'transfer',
    name: 'Transferencia',
    description: 'Transferencia bancaria',
    icon: Smartphone
  }
]

// Computed
const availableSeries = computed(() => {
  // This should come from company configuration
  if (selectedDocType.value === '01') {
    return ['F001', 'F002']
  } else if (selectedDocType.value === '03') {
    return ['B001', 'B002']
  }
  return []
})

const canProcessPayment = computed(() => {
  const hasRequiredFields = selectedDocType.value && selectedSeries.value && selectedPaymentMethod.value
  const hasValidCash = selectedPaymentMethod.value !== 'cash' || cashReceived.value >= props.cartTotals.total
  return hasRequiredFields && hasValidCash && props.cartItems.length > 0
})

// Methods
const validatePayment = () => {
  const errors: string[] = []

  if (!selectedDocType.value) {
    errors.push('Debe seleccionar un tipo de comprobante')
  }

  if (!selectedSeries.value) {
    errors.push('Debe seleccionar una serie')
  }

  if (!selectedPaymentMethod.value) {
    errors.push('Debe seleccionar un método de pago')
  }

  if (selectedPaymentMethod.value === 'cash' && cashReceived.value < props.cartTotals.total) {
    errors.push('El monto recibido debe ser mayor o igual al total')
  }

  if (props.cartItems.length === 0) {
    errors.push('El carrito está vacío')
  }

  // Validate customer for invoices
  if (selectedDocType.value === '01' && !props.customer) {
    errors.push('Debe seleccionar un cliente para emitir factura')
  }

  validationErrors.value = errors
  return errors.length === 0
}

const processPayment = async () => {
  if (!validatePayment()) {
    return
  }

  processing.value = true

  try {
    // Get next document number
    const nextNumber = await salesStore.getNextDocumentNumber(selectedDocType.value, selectedSeries.value)
    if (!nextNumber) {
      throw new Error('No se pudo obtener el siguiente número de documento')
    }

    // Prepare sales document payload
    const payload: SalesDocCreatePayload = {
      doc: {
        company_id: authStore.currentCompany!.id,
        branch_id: null, // Default branch or get from user selection
        customer_id: props.customer?.id || '',
        doc_type: selectedDocType.value,
        series: selectedSeries.value,
        number: nextNumber,
        issue_date: new Date().toISOString().split('T')[0],
        currency_code: 'PEN',
        exchange_rate: 1,
        total: props.cartTotals.total,
        notes: notes.value || null,
        greenter_status: 'PENDING'
      },
      items: props.cartItems.map((item, index) => ({
        company_id: authStore.currentCompany!.id,
        line_number: index + 1,
        product_id: item.product.id,
        description: item.product.name,
        unit_code: 'NIU', // Default unit
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_pct: item.discount_pct,
        igv_affectation: item.igv_affectation,
        igv_amount: salesStore.calculateItemTax(item).igv_amount || 0,
        total_line: salesStore.calculateItemTax(item).line_total_with_tax || 0
      }))
    }

    // Create sales document
    const salesDoc = await salesStore.createSalesDoc(payload)
    if (!salesDoc) {
      throw new Error('Error al crear el documento de venta')
    }

    // Emit success
    emit('payment-completed', salesDoc)

  } catch (error) {
    console.error('Error processing payment:', error)
    validationErrors.value = [
      error instanceof Error ? error.message : 'Error al procesar el pago'
    ]
  } finally {
    processing.value = false
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN'
  }).format(amount)
}

// Lifecycle
onMounted(() => {
  // Set default values
  selectedDocType.value = '03' // Default to Boleta
  selectedPaymentMethod.value = 'cash' // Default to cash
  cashReceived.value = props.cartTotals.total // Default to exact amount
})
</script>
