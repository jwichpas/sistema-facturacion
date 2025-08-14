<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        @click="$emit('close')"
      ></div>

      <!-- Modal panel -->
      <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
        <!-- Header -->
        <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                Historial de Transacciones
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {{ party.fullname }} - {{ party.doc_type }} {{ party.doc_number }}
              </p>
            </div>
            <button
              @click="$emit('close')"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="bg-white dark:bg-gray-800 px-4 py-5 sm:p-6">
          <!-- Summary Cards -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div class="flex items-center">
                <TrendingUp class="w-8 h-8 text-green-600 dark:text-green-400" />
                <div class="ml-3">
                  <p class="text-sm font-medium text-green-600 dark:text-green-400">Total Ventas</p>
                  <p class="text-lg font-semibold text-green-900 dark:text-green-100">
                    {{ formatCurrency(transactionSummary?.total_sales || 0) }}
                  </p>
                </div>
              </div>
            </div>

            <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div class="flex items-center">
                <TrendingDown class="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <div class="ml-3">
                  <p class="text-sm font-medium text-blue-600 dark:text-blue-400">Total Compras</p>
                  <p class="text-lg font-semibold text-blue-900 dark:text-blue-100">
                    {{ formatCurrency(transactionSummary?.total_purchases || 0) }}
                  </p>
                </div>
              </div>
            </div>

            <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div class="flex items-center">
                <FileText class="w-8 h-8 text-purple-600 dark:text-purple-400" />
                <div class="ml-3">
                  <p class="text-sm font-medium text-purple-600 dark:text-purple-400">Documentos</p>
                  <p class="text-lg font-semibold text-purple-900 dark:text-purple-100">
                    {{ (transactionSummary?.sales_count || 0) + (transactionSummary?.purchases_count || 0) }}
                  </p>
                </div>
              </div>
            </div>

            <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div class="flex items-center">
                <Calendar class="w-8 h-8 text-gray-600 dark:text-gray-400" />
                <div class="ml-3">
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Última Transacción</p>
                  <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {{ formatLastTransactionDate() }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Filters -->
          <div class="flex flex-col sm:flex-row gap-4 mb-6">
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de documento
              </label>
              <select
                v-model="filters.documentType"
                @change="() => loadTransactions()"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los documentos</option>
                <option value="sales">Ventas</option>
                <option value="purchases">Compras</option>
              </select>
            </div>

            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha desde
              </label>
              <input
                v-model="filters.dateFrom"
                @change="() => loadTransactions()"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha hasta
              </label>
              <input
                v-model="filters.dateTo"
                @change="() => loadTransactions()"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <!-- Transactions Table -->
          <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <div v-if="loading" class="p-8 text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Cargando transacciones...</p>
            </div>

            <div v-else-if="transactions.length === 0" class="p-8 text-center">
              <FileText class="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p class="text-sm text-gray-500 dark:text-gray-400">
                No se encontraron transacciones para los filtros seleccionados
              </p>
            </div>

            <table v-else class="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Documento
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Monto
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr
                  v-for="transaction in transactions"
                  :key="transaction.id"
                  class="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {{ formatDate(transaction.date) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {{ transaction.document_number }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      :class="[
                        'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                        transaction.type === 'sale'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                      ]"
                    >
                      {{ transaction.type === 'sale' ? 'Venta' : 'Compra' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                    {{ formatCurrency(transaction.amount) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      :class="[
                        'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                        getStatusColor(transaction.status)
                      ]"
                    >
                      {{ getStatusLabel(transaction.status) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="transactions.length > 0" class="flex items-center justify-between mt-6">
            <div class="text-sm text-gray-700 dark:text-gray-300">
              Mostrando {{ transactions.length }} de {{ totalTransactions }} transacciones
            </div>
            <div class="flex space-x-2">
              <button
                @click="loadPreviousPage"
                :disabled="currentPage <= 1"
                class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Anterior
              </button>
              <button
                @click="loadNextPage"
                :disabled="!hasNextPage"
                class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { X, TrendingUp, TrendingDown, FileText, Calendar } from 'lucide-vue-next'
import { usePartyStore } from '@/stores/party'
import type { Party, PartyTransactionSummary } from '@/types'

interface Props {
  party: Party
}

interface Transaction {
  id: string
  date: string
  document_number: string
  type: 'sale' | 'purchase'
  amount: number
  status: string
}

interface TransactionFilters {
  documentType: string
  dateFrom: string
  dateTo: string
}

const props = defineProps<Props>()

// Store
const partyStore = usePartyStore()

// Refs
const loading = ref(false)
const transactionSummary = ref<PartyTransactionSummary | null>(null)
const transactions = ref<Transaction[]>([])
const totalTransactions = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

// Filters
const filters = ref<TransactionFilters>({
  documentType: '',
  dateFrom: '',
  dateTo: ''
})

// Computed
const hasNextPage = computed(() => {
  return transactions.value.length === pageSize.value
})

// Methods
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN'
  }).format(amount)
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const formatLastTransactionDate = (): string => {
  const lastSale = transactionSummary.value?.last_sale_date
  const lastPurchase = transactionSummary.value?.last_purchase_date

  let lastDate: string | undefined

  if (lastSale && lastPurchase) {
    lastDate = new Date(lastSale) > new Date(lastPurchase) ? lastSale : lastPurchase
  } else {
    lastDate = lastSale || lastPurchase
  }

  if (!lastDate) {
    return 'Sin transacciones'
  }

  return formatDate(lastDate)
}

const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'paid':
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  }
}

const getStatusLabel = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'paid': return 'Pagado'
    case 'completed': return 'Completado'
    case 'pending': return 'Pendiente'
    case 'cancelled': return 'Cancelado'
    default: return status
  }
}

const loadTransactionSummary = async () => {
  try {
    const summary = await partyStore.getPartyTransactionSummary(props.party.id)
    transactionSummary.value = summary
  } catch (error) {
    console.error('Error loading transaction summary:', error)
  }
}

const loadTransactions = async (page = 1) => {
  loading.value = true
  currentPage.value = page

  try {
    // This would be implemented when sales and purchase modules are available
    // For now, we'll show mock data to demonstrate the UI
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        date: '2024-01-15',
        document_number: 'F001-00001',
        type: 'sale',
        amount: 1250.00,
        status: 'paid'
      },
      {
        id: '2',
        date: '2024-01-10',
        document_number: 'B001-00005',
        type: 'sale',
        amount: 850.50,
        status: 'pending'
      },
      {
        id: '3',
        date: '2024-01-05',
        document_number: 'FC01-00012',
        type: 'purchase',
        amount: 2100.00,
        status: 'completed'
      }
    ]

    // Apply filters
    let filteredTransactions = [...mockTransactions]

    if (filters.value.documentType) {
      if (filters.value.documentType === 'sales') {
        filteredTransactions = filteredTransactions.filter(t => t.type === 'sale')
      } else if (filters.value.documentType === 'purchases') {
        filteredTransactions = filteredTransactions.filter(t => t.type === 'purchase')
      }
    }

    if (filters.value.dateFrom) {
      filteredTransactions = filteredTransactions.filter(t => t.date >= filters.value.dateFrom)
    }

    if (filters.value.dateTo) {
      filteredTransactions = filteredTransactions.filter(t => t.date <= filters.value.dateTo)
    }

    // Simulate pagination
    const startIndex = (page - 1) * pageSize.value
    const endIndex = startIndex + pageSize.value

    transactions.value = filteredTransactions.slice(startIndex, endIndex)
    totalTransactions.value = filteredTransactions.length

  } catch (error) {
    console.error('Error loading transactions:', error)
    transactions.value = []
  } finally {
    loading.value = false
  }
}

const loadPreviousPage = () => {
  if (currentPage.value > 1) {
    loadTransactions(currentPage.value - 1)
  }
}

const loadNextPage = () => {
  if (hasNextPage.value) {
    loadTransactions(currentPage.value + 1)
  }
}

// Initialize data
onMounted(async () => {
  await Promise.all([
    loadTransactionSummary(),
    loadTransactions()
  ])
})
</script>
