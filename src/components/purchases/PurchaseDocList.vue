<template>
  <div class="space-y-6">
    <!-- Header with filters and actions -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
          Documentos de Compra
        </h1>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Gestiona facturas, boletas y otros documentos de compra
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="refreshData"
          :disabled="loading"
          class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <RotateCcw :class="['h-4 w-4 mr-2', { 'animate-spin': loading }]" />
          Actualizar
        </button>

        <router-link
          to="/purchases/new"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus class="h-4 w-4 mr-2" />
          Nuevo Documento
        </router-link>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Search -->
        <div>
          <label for="search" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Buscar
          </label>
          <input
            id="search"
            v-model="searchQuery"
            type="text"
            placeholder="Serie, número, proveedor..."
            class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <!-- Document Type -->
        <div>
          <label for="docType" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo de Documento
          </label>
          <select
            id="docType"
            v-model="selectedDocType"
            class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
          <label for="dateFrom" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Desde
          </label>
          <input
            id="dateFrom"
            v-model="dateFrom"
            type="date"
            class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <!-- Date To -->
        <div>
          <label for="dateTo" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Hasta
          </label>
          <input
            id="dateTo"
            v-model="dateTo"
            type="date"
            class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <!-- Filter Actions -->
      <div class="flex items-center justify-between mt-4">
        <button
          @click="clearFilters"
          class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          Limpiar filtros
        </button>

        <div class="text-sm text-gray-600 dark:text-gray-400">
          {{ filteredPurchaseDocs.length }} documento(s) encontrado(s)
        </div>
      </div>
    </div>

    <!-- Purchase Documents Table -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div v-if="loading" class="p-8 text-center">
        <div class="inline-flex items-center">
          <RotateCcw class="animate-spin h-5 w-5 mr-3 text-gray-400" />
          <span class="text-gray-600 dark:text-gray-400">Cargando documentos...</span>
        </div>
      </div>

      <div v-else-if="error" class="p-8 text-center">
        <div class="text-red-600 dark:text-red-400">
          <AlertTriangle class="h-8 w-8 mx-auto mb-2" />
          <p class="font-medium">Error al cargar documentos</p>
          <p class="text-sm mt-1">{{ error }}</p>
        </div>
      </div>

      <div v-else-if="isEmpty" class="p-8 text-center">
        <FileText class="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No hay documentos de compra
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Comienza creando tu primer documento de compra
        </p>
        <router-link
          to="/purchases/new"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus class="h-4 w-4 mr-2" />
          Crear Documento
        </router-link>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Documento
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Proveedor
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Fecha
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Total
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Items
              </th>
              <th scope="col" class="relative px-6 py-3">
                <span class="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="doc in filteredPurchaseDocs"
              :key="doc.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ doc.series }}-{{ doc.number }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ getDocTypeLabel(doc.doc_type) }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">
                  {{ doc.supplier_name || 'Sin nombre' }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ doc.supplier_doc }}
                </div>
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
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ doc.items_count }} item(s)
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end space-x-2">
                  <router-link
                    :to="`/purchases/${doc.id}`"
                    class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Ver
                  </router-link>
                  <router-link
                    :to="`/purchases/${doc.id}/edit`"
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    Editar
                  </router-link>
                  <button
                    @click="confirmDelete(doc)"
                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      @click="showDeleteModal = false"
    >
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3 text-center">
          <AlertTriangle class="mx-auto h-12 w-12 text-red-600" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mt-2">
            Confirmar eliminación
          </h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              ¿Estás seguro de que deseas eliminar el documento
              <strong>{{ documentToDelete?.series }}-{{ documentToDelete?.number }}</strong>?
              Esta acción no se puede deshacer.
            </p>
          </div>
          <div class="flex justify-center gap-3 mt-4">
            <button
              @click="showDeleteModal = false"
              class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Cancelar
            </button>
            <button
              @click="deleteDocument"
              :disabled="loading"
              class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { usePurchaseStore } from '@/stores/purchase'
import type { PurchaseDocListItem } from '@/services/purchase'
import {
  RotateCcw,
  Plus,
  FileText,
  AlertTriangle
} from 'lucide-vue-next'

// Store
const purchaseStore = usePurchaseStore()

// Reactive state
const searchQuery = ref('')
const selectedDocType = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const showDeleteModal = ref(false)
const documentToDelete = ref<PurchaseDocListItem | null>(null)

// Computed properties
const { purchaseDocs, loading, error, isEmpty } = purchaseStore
const filteredPurchaseDocs = computed(() => purchaseStore.filteredPurchaseDocs)

// Methods
const refreshData = async () => {
  await purchaseStore.loadPurchaseDocs(true)
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedDocType.value = ''
  dateFrom.value = ''
  dateTo.value = ''
  purchaseStore.clearFilters()
}

const confirmDelete = (doc: PurchaseDocListItem) => {
  documentToDelete.value = doc
  showDeleteModal.value = true
}

const deleteDocument = async () => {
  if (!documentToDelete.value) return

  const success = await purchaseStore.deletePurchaseDoc(documentToDelete.value.id)
  if (success) {
    showDeleteModal.value = false
    documentToDelete.value = null
  }
}

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

// Watch for filter changes
watch([searchQuery, selectedDocType, dateFrom, dateTo], () => {
  purchaseStore.setFilters({
    search: searchQuery.value,
    docType: selectedDocType.value || null,
    dateFrom: dateFrom.value || undefined,
    dateTo: dateTo.value || undefined
  })
})

// Load data on mount
onMounted(() => {
  purchaseStore.loadPurchaseDocs()
})
</script>
