<template>
  <div class="space-y-4">
    <!-- Header with filters and actions -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div class="flex-1">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          Documentos de Venta
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Gestiona facturas, boletas y notas de crédito
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="refreshData"
          :disabled="loading"
          class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <RefreshCw :class="['w-4 h-4 mr-2', { 'animate-spin': loading }]" />
          Actualizar
        </button>
        <button
          @click="$emit('create')"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus class="w-4 h-4 mr-2" />
          Nuevo Documento
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Search -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Buscar
          </label>
          <div class="relative">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              v-model="localFilters.search"
              type="text"
              placeholder="Serie, número, cliente..."
              class="pl-10 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <!-- Document Type -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo de Documento
          </label>
          <select
            v-model="localFilters.docType"
            class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            <option value="01">Factura</option>
            <option value="03">Boleta</option>
            <option value="07">Nota de Crédito</option>
            <option value="08">Nota de Débito</option>
          </select>
        </div>

        <!-- Date From -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fecha Desde
          </label>
          <input
            v-model="localFilters.dateFrom"
            type="date"
            class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <!-- Date To -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fecha Hasta
          </label>
          <input
            v-model="localFilters.dateTo"
            type="date"
            class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div class="flex justify-end mt-4 gap-2">
        <button
          @click="clearFilters"
          class="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Limpiar
        </button>
        <button
          @click="applyFilters"
          class="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
        >
          Aplicar Filtros
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-8">
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

    <!-- Empty State -->
    <div v-else-if="isEmpty" class="text-center py-12">
      <FileText class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay documentos</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Comienza creando tu primer documento de venta.
      </p>
      <div class="mt-6">
        <button
          @click="$emit('create')"
          class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus class="w-4 h-4 mr-2" />
          Nuevo Documento
        </button>
      </div>
    </div>

    <!-- Documents Table -->
    <div v-else class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Documento
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Cliente
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Fecha
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Total
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="doc in filteredSalesDocs"
              :key="doc.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {{ getDocTypeLabel(doc.doc_type) }}
                    </span>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ doc.series }}-{{ doc.number.toString().padStart(8, '0') }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ doc.items_count }} {{ doc.items_count === 1 ? 'item' : 'items' }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">{{ doc.customer_name }}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">{{ doc.customer_doc }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ formatDate(doc.issue_date) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ formatCurrency(doc.total) }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ doc.currency_code }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getStatusBadgeClass(doc.greenter_status)">
                  {{ getStatusLabel(doc.greenter_status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="$emit('view', doc.id)"
                    class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    title="Ver detalles"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <button
                    @click="$emit('edit', doc.id)"
                    class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                    title="Editar"
                  >
                    <Edit class="w-4 h-4" />
                  </button>
                  <button
                    @click="$emit('print', doc.id)"
                    class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                    title="Imprimir"
                  >
                    <Printer class="w-4 h-4" />
                  </button>
                  <button
                    @click="confirmDelete(doc)"
                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    title="Eliminar"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="!isEmpty && !loading" class="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6 rounded-b-lg">
      <div class="flex-1 flex justify-between sm:hidden">
        <button
          @click="previousPage"
          :disabled="pagination.page <= 1"
          class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          Anterior
        </button>
        <button
          @click="nextPage"
          :disabled="pagination.page >= totalPages"
          class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
      <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-gray-700 dark:text-gray-300">
            Mostrando
            <span class="font-medium">{{ startItem }}</span>
            a
            <span class="font-medium">{{ endItem }}</span>
            de
            <span class="font-medium">{{ pagination.total }}</span>
            resultados
          </p>
        </div>
        <div>
          <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              @click="previousPage"
              :disabled="pagination.page <= 1"
              class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <ChevronLeft class="h-5 w-5" />
            </button>
            <button
              @click="nextPage"
              :disabled="pagination.page >= totalPages"
              class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <ChevronRight class="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3 text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
            <AlertTriangle class="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mt-2">Eliminar Documento</h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              ¿Estás seguro de que deseas eliminar el documento {{ docToDelete?.series }}-{{ docToDelete?.number.toString().padStart(8, '0') }}?
              Esta acción no se puede deshacer.
            </p>
          </div>
          <div class="items-center px-4 py-3">
            <button
              @click="deleteDocument"
              class="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              Eliminar
            </button>
            <button
              @click="cancelDelete"
              class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-base font-medium rounded-md w-24 hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useSalesStore } from '@/stores/sales'
import type { SalesDocListItem, SalesDocFilters } from '@/services/sales'
import {
  Plus,
  Search,
  RefreshCw,
  Eye,
  Edit,
  Printer,
  Trash2,
  FileText,
  AlertCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next'

// Emits
const emit = defineEmits<{
  create: []
  view: [id: string]
  edit: [id: string]
  print: [id: string]
}>()

// Store
const salesStore = useSalesStore()

// Local state
const localFilters = ref<SalesDocFilters>({})
const showDeleteModal = ref(false)
const docToDelete = ref<SalesDocListItem | null>(null)

// Computed
const {
  salesDocs,
  loading,
  error,
  isEmpty,
  filteredSalesDocs,
  pagination,
  totalPages
} = salesStore

const startItem = computed(() => {
  return (pagination.page - 1) * pagination.limit + 1
})

const endItem = computed(() => {
  return Math.min(pagination.page * pagination.limit, pagination.total)
})

// Methods
const refreshData = () => {
  salesStore.loadSalesDocs(true)
}

const applyFilters = () => {
  salesStore.setFilters(localFilters.value)
  salesStore.loadSalesDocs(true)
}

const clearFilters = () => {
  localFilters.value = {}
  salesStore.clearFilters()
  salesStore.loadSalesDocs(true)
}

const previousPage = () => {
  if (pagination.page > 1) {
    salesStore.setPagination(pagination.page - 1)
  }
}

const nextPage = () => {
  if (pagination.page < totalPages) {
    salesStore.setPagination(pagination.page + 1)
  }
}

const confirmDelete = (doc: SalesDocListItem) => {
  docToDelete.value = doc
  showDeleteModal.value = true
}

const deleteDocument = async () => {
  if (docToDelete.value) {
    await salesStore.deleteSalesDoc(docToDelete.value.id)
    cancelDelete()
  }
}

const cancelDelete = () => {
  docToDelete.value = null
  showDeleteModal.value = false
}

const getDocTypeLabel = (docType: string): string => {
  const types: Record<string, string> = {
    '01': 'Factura',
    '03': 'Boleta',
    '07': 'N. Crédito',
    '08': 'N. Débito'
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
    month: '2-digit',
    day: '2-digit'
  })
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2
  }).format(amount)
}

// Lifecycle
onMounted(() => {
  if (isEmpty) {
    refreshData()
  }
})

// Watch for filter changes
watch(localFilters, () => {
  // Auto-apply filters after a delay
  // This could be debounced for better UX
}, { deep: true })
</script>
