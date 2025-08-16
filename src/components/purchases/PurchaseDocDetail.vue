<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
          Documento de Compra
        </h1>
        <p v-if="purchaseDoc" class="text-sm text-gray-600 dark:text-gray-400">
          {{ purchaseDoc.series }}-{{ purchaseDoc.number }} • {{ getDocTypeLabel(purchaseDoc.doc_type) }}
        </p>
      </div>

      <div class="flex items-center space-x-3">
        <router-link
          to="/purchases"
          class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <ArrowLeft class="h-4 w-4 mr-2" />
          Volver
        </router-link>

        <router-link
          v-if="purchaseDoc"
          :to="`/purchases/${purchaseDoc.id}/edit`"
          class="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Pencil class="h-4 w-4 mr-2" />
          Editar
        </router-link>

        <button
          v-if="purchaseDoc && !inventoryUpdated"
          @click="updateInventory"
          :disabled="loading"
          class="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
        >
          <Check class="h-4 w-4 mr-2" />
          Actualizar Inventario
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="bg-white dark:bg-gray-800 shadow rounded-lg p-8">
      <div class="flex items-center justify-center">
        <RotateCcw class="animate-spin h-8 w-8 text-gray-400 mr-3" />
        <span class="text-gray-600 dark:text-gray-400">Cargando documento...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-white dark:bg-gray-800 shadow rounded-lg p-8">
      <div class="text-center text-red-600 dark:text-red-400">
        <AlertTriangle class="h-12 w-12 mx-auto mb-4" />
        <h3 class="text-lg font-medium mb-2">Error al cargar documento</h3>
        <p class="text-sm">{{ error }}</p>
      </div>
    </div>

    <!-- Document Details -->
    <div v-else-if="purchaseDoc" class="space-y-6">
      <!-- Document Information -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Información del Documento
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Tipo de Documento</dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ getDocTypeLabel(purchaseDoc.doc_type) }}</dd>
          </div>

          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Serie y Número</dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ purchaseDoc.series }}-{{ purchaseDoc.number }}</dd>
          </div>

          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de Emisión</dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ formatDate(purchaseDoc.issue_date) }}</dd>
          </div>

          <div v-if="purchaseDoc.arrival_date">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de Llegada</dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ formatDate(purchaseDoc.arrival_date) }}</dd>
          </div>

          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Moneda</dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ purchaseDoc.currency_code }}</dd>
          </div>

          <div v-if="purchaseDoc.exchange_rate">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Tipo de Cambio</dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ purchaseDoc.exchange_rate }}</dd>
          </div>
        </div>
      </div>

      <!-- Supplier Information -->
      <div v-if="purchaseDoc.supplier" class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Información del Proveedor
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Nombre/Razón Social</dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ purchaseDoc.supplier.fullname }}</dd>
          </div>

          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Documento</dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">
              {{ purchaseDoc.supplier.doc_type }}-{{ purchaseDoc.supplier.doc_number }}
            </dd>
          </div>

          <div v-if="purchaseDoc.supplier.email">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ purchaseDoc.supplier.email }}</dd>
          </div>

          <div v-if="purchaseDoc.supplier.phone">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Teléfono</dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ purchaseDoc.supplier.phone }}</dd>
          </div>
        </div>
      </div>

      <!-- Items -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Items del Documento
        </h3>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Producto
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cantidad
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Costo Unit.
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Descuento
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  IGV
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="item in purchaseDoc.items" :key="item.id">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div>
                      <div class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ item.product?.name || 'Producto no encontrado' }}
                      </div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">
                        SKU: {{ item.product?.sku || 'N/A' }}
                      </div>
                      <div v-if="item.description" class="text-sm text-gray-500 dark:text-gray-400">
                        {{ item.description }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ formatNumber(item.quantity) }}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {{ item.unit_code }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ formatCurrency(item.unit_cost) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ item.discount_pct }}%
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ formatCurrency(item.igv_amount || 0) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {{ formatCurrency(item.total_line) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Totals -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Totales
        </h3>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Op. Gravadas</dt>
            <dd class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              {{ formatCurrency(purchaseDoc.total_ope_gravadas || 0) }}
            </dd>
          </div>

          <div class="text-center">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Op. Exoneradas</dt>
            <dd class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              {{ formatCurrency(purchaseDoc.total_ope_exoneradas || 0) }}
            </dd>
          </div>

          <div class="text-center">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">IGV</dt>
            <dd class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              {{ formatCurrency(purchaseDoc.total_igv || 0) }}
            </dd>
          </div>

          <div class="text-center border-l border-gray-200 dark:border-gray-600">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Total</dt>
            <dd class="mt-1 text-xl font-bold text-gray-900 dark:text-white">
              {{ formatCurrency(purchaseDoc.total) }}
            </dd>
          </div>
        </div>
      </div>

      <!-- Inventory Update Status -->
      <div v-if="inventoryUpdated" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div class="flex items-center">
          <CheckCircle class="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
          <span class="text-sm text-green-800 dark:text-green-200">
            El inventario ha sido actualizado con los productos de este documento.
          </span>
        </div>
      </div>
    </div>

    <!-- Warehouse Selection Modal -->
    <div
      v-if="showWarehouseModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      @click="showWarehouseModal = false"
    >
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Seleccionar Almacén
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Selecciona el almacén donde se recibirán los productos:
          </p>

          <select
            v-model="selectedWarehouseId"
            class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm mb-4"
          >
            <option value="">Seleccionar almacén...</option>
            <option value="warehouse-1">Almacén Principal</option>
            <option value="warehouse-2">Almacén Secundario</option>
          </select>

          <div class="flex justify-end gap-3">
            <button
              @click="showWarehouseModal = false"
              class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Cancelar
            </button>
            <button
              @click="confirmInventoryUpdate"
              :disabled="!selectedWarehouseId || loading"
              class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Actualizar Inventario
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePurchaseStore } from '@/stores/purchase'
import {
  ArrowLeft,
  Pencil,
  Check,
  RotateCcw,
  AlertTriangle,
  CheckCircle
} from 'lucide-vue-next'

// Router
const route = useRoute()

// Store
const purchaseStore = usePurchaseStore()

// Reactive state
const loading = ref(false)
const inventoryUpdated = ref(false)
const showWarehouseModal = ref(false)
const selectedWarehouseId = ref('')

// Computed properties
const purchaseDoc = computed(() => purchaseStore.currentPurchaseDoc)
const error = computed(() => purchaseStore.error)

// Methods
const getDocTypeLabel = (docType: string): string => {
  const types: Record<string, string> = {
    '01': 'Factura',
    '03': 'Boleta',
    '07': 'Nota de Crédito',
    '08': 'Nota de Débito',
    '14': 'Recibo por Honorarios'
  }
  return types[docType] || docType
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-PE')
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2
  }).format(amount)
}

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

const updateInventory = () => {
  showWarehouseModal.value = true
}

const confirmInventoryUpdate = async () => {
  if (!selectedWarehouseId.value || !purchaseDoc.value) return

  loading.value = true

  try {
    const success = await purchaseStore.updateInventoryOnReceipt(
      purchaseDoc.value.id,
      selectedWarehouseId.value
    )

    if (success) {
      inventoryUpdated.value = true
      showWarehouseModal.value = false
    }
  } catch (error) {
    console.error('Error updating inventory:', error)
  } finally {
    loading.value = false
  }
}

// Load document on mount
onMounted(async () => {
  const documentId = route.params.id as string
  if (documentId) {
    await purchaseStore.loadPurchaseDoc(documentId)
  }
})
</script>
