<template>
  <div class="relative">
    <!-- Search Input -->
    <div class="relative">
      <FormInput
        name="product_search"
        placeholder="Buscar productos por nombre, SKU o código..."
        :model-value="searchQuery"
        @update:model-value="(value) => handleSearch(String(value))"
        @focus="showResults = true"
        @keydown.arrow-down.prevent="navigateResults(1)"
        @keydown.arrow-up.prevent="navigateResults(-1)"
        @keydown.enter.prevent="selectHighlightedResult"
        @keydown.escape="hideResults"
      >
        <template #prefix>
          <Search class="h-4 w-4 text-gray-400" />
        </template>
        <template #suffix>
          <div class="flex items-center gap-1">
            <button
              v-if="searchQuery"
              @click="clearSearch"
              class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Limpiar búsqueda"
            >
              <X class="h-4 w-4" />
            </button>
            <button
              @click="$emit('open-scanner')"
              class="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              title="Escanear código"
            >
              <QrCode class="h-4 w-4" />
            </button>
          </div>
        </template>
      </FormInput>
    </div>

    <!-- Search Results Dropdown -->
    <div
      v-if="showResults && (searchResults.length > 0 || isSearching || searchQuery)"
      class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
    >
      <!-- Loading State -->
      <div v-if="isSearching" class="p-4 text-center">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Buscando productos...</p>
      </div>

      <!-- No Results -->
      <div v-else-if="searchQuery && searchResults.length === 0" class="p-4 text-center">
        <Package class="h-8 w-8 text-gray-400 mx-auto" />
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          No se encontraron productos para "{{ searchQuery }}"
        </p>
        <BaseButton
          size="sm"
          variant="outline"
          class="mt-2"
          @click="$emit('create-product', searchQuery)"
        >
          <Plus class="w-4 h-4 mr-1" />
          Crear producto
        </BaseButton>
      </div>

      <!-- Search Results -->
      <div v-else class="py-2">
        <div
          v-for="(product, index) in searchResults"
          :key="product.id"
          :class="[
            'px-4 py-3 cursor-pointer transition-colors',
            index === highlightedIndex
              ? 'bg-blue-50 dark:bg-blue-900/20'
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
          ]"
          @click="selectProduct(product)"
          @mouseenter="highlightedIndex = index"
        >
          <div class="flex items-center gap-3">
            <!-- Product Image -->
            <div class="flex-shrink-0">
              <img
                v-if="product.primary_image"
                :src="product.primary_image"
                :alt="product.name"
                class="w-10 h-10 rounded object-cover"
              />
              <div v-else class="w-10 h-10 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <Package class="w-5 h-5 text-gray-400" />
              </div>
            </div>

            <!-- Product Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {{ highlightMatch(product.name, searchQuery) }}
                </p>
                <span
                  :class="[
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                    getStockBadgeClass(product)
                  ]"
                >
                  {{ product.total_stock || 0 }}
                </span>
              </div>

              <div class="flex items-center gap-4 mt-1">
                <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {{ highlightMatch(product.sku, searchQuery) }}
                </span>
                <span v-if="product.brand_name" class="text-xs text-gray-500 dark:text-gray-400">
                  {{ product.brand_name }}
                </span>
                <span v-if="product.barcode && product.barcode.toLowerCase().includes(searchQuery.toLowerCase())"
                      class="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {{ highlightMatch(product.barcode, searchQuery) }}
                </span>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="flex-shrink-0 flex items-center gap-1">
              <button
                @click.stop="$emit('quick-edit', product)"
                class="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                title="Edición rápida"
              >
                <Edit class="w-4 h-4" />
              </button>
              <button
                @click.stop="$emit('view-stock', product)"
                class="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                title="Ver stock"
              >
                <BarChart3 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Show More Results -->
        <div v-if="hasMoreResults" class="border-t border-gray-200 dark:border-gray-700 p-2">
          <button
            @click="loadMoreResults"
            class="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 py-2"
          >
            Ver más resultados ({{ totalResults - searchResults.length }} restantes)
          </button>
        </div>
      </div>
    </div>

    <!-- Recent Searches -->
    <div
      v-if="showResults && !searchQuery && recentSearches.length > 0"
      class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
    >
      <div class="p-3 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100">
            Búsquedas recientes
          </h4>
          <button
            @click="clearRecentSearches"
            class="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Limpiar
          </button>
        </div>
      </div>
      <div class="py-2">
        <button
          v-for="(search, index) in recentSearches"
          :key="index"
          @click="handleSearch(search)"
          class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <Clock class="w-4 h-4 text-gray-400" />
          {{ search }}
        </button>
      </div>
    </div>

    <!-- Backdrop -->
    <div
      v-if="showResults"
      class="fixed inset-0 z-40"
      @click="hideResults"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { Search, X, QrCode, Package, Plus, Edit, BarChart3, Clock } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormInput from '@/components/forms/FormInput.vue'
import type { ProductListItem } from '@/services/product'

interface Props {
  products: ProductListItem[]
  isSearching?: boolean
  maxResults?: number
}

const props = withDefaults(defineProps<Props>(), {
  isSearching: false,
  maxResults: 10
})

const emit = defineEmits<{
  search: [query: string]
  'product-selected': [product: ProductListItem]
  'create-product': [name: string]
  'quick-edit': [product: ProductListItem]
  'view-stock': [product: ProductListItem]
  'open-scanner': []
}>()

// Search state
const searchQuery = ref('')
const showResults = ref(false)
const highlightedIndex = ref(-1)
const recentSearches = ref<string[]>([])

// Debounced search
let searchTimeout: NodeJS.Timeout

// Computed properties
const searchResults = computed(() => {
  if (!searchQuery.value.trim()) return []

  const query = searchQuery.value.toLowerCase().trim()
  const filtered = props.products.filter(product =>
    product.name.toLowerCase().includes(query) ||
    product.sku.toLowerCase().includes(query) ||
    (product.barcode && product.barcode.toLowerCase().includes(query)) ||
    (product.brand_name && product.brand_name.toLowerCase().includes(query))
  )

  return filtered.slice(0, props.maxResults)
})

const totalResults = computed(() => {
  if (!searchQuery.value.trim()) return 0

  const query = searchQuery.value.toLowerCase().trim()
  return props.products.filter(product =>
    product.name.toLowerCase().includes(query) ||
    product.sku.toLowerCase().includes(query) ||
    (product.barcode && product.barcode.toLowerCase().includes(query)) ||
    (product.brand_name && product.brand_name.toLowerCase().includes(query))
  ).length
})

const hasMoreResults = computed(() => totalResults.value > searchResults.value.length)

// Methods
const handleSearch = (query: string) => {
  searchQuery.value = query
  highlightedIndex.value = -1

  // Debounce search
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    if (query.trim()) {
      emit('search', query.trim())
      addToRecentSearches(query.trim())
    }
  }, 300)
}

const clearSearch = () => {
  searchQuery.value = ''
  showResults.value = false
  highlightedIndex.value = -1
}

const hideResults = () => {
  showResults.value = false
  highlightedIndex.value = -1
}

const navigateResults = (direction: number) => {
  if (searchResults.value.length === 0) return

  const newIndex = highlightedIndex.value + direction

  if (newIndex < 0) {
    highlightedIndex.value = searchResults.value.length - 1
  } else if (newIndex >= searchResults.value.length) {
    highlightedIndex.value = 0
  } else {
    highlightedIndex.value = newIndex
  }
}

const selectHighlightedResult = () => {
  if (highlightedIndex.value >= 0 && searchResults.value[highlightedIndex.value]) {
    selectProduct(searchResults.value[highlightedIndex.value])
  }
}

const selectProduct = (product: ProductListItem) => {
  emit('product-selected', product)
  hideResults()
}

const loadMoreResults = () => {
  // In a real implementation, this would load more results from the server
  // For now, we'll just show all results
  console.log('Load more results')
}

const getStockBadgeClass = (product: ProductListItem) => {
  const stock = product.total_stock || 0
  const minStock = product.min_stock || 0

  if (stock === 0) {
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  } else if (stock <= minStock) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  } else {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  }
}

const highlightMatch = (text: string, query: string) => {
  if (!query.trim()) return text

  const regex = new RegExp(`(${query.trim()})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>')
}

// Recent searches management
const addToRecentSearches = (query: string) => {
  const searches = recentSearches.value.filter(s => s !== query)
  searches.unshift(query)
  recentSearches.value = searches.slice(0, 5)
  saveRecentSearches()
}

const clearRecentSearches = () => {
  recentSearches.value = []
  saveRecentSearches()
}

const saveRecentSearches = () => {
  try {
    localStorage.setItem('product_recent_searches', JSON.stringify(recentSearches.value))
  } catch (error) {
    console.error('Error saving recent searches:', error)
  }
}

const loadRecentSearches = () => {
  try {
    const saved = localStorage.getItem('product_recent_searches')
    if (saved) {
      recentSearches.value = JSON.parse(saved)
    }
  } catch (error) {
    console.error('Error loading recent searches:', error)
  }
}

// Lifecycle
onMounted(() => {
  loadRecentSearches()
})

// Watch for external search query changes
watch(() => props.products, () => {
  // Reset highlighted index when products change
  highlightedIndex.value = -1
})
</script>

<style scoped>
:deep(mark) {
  background-color: rgb(254 240 138);
  padding: 0.125rem;
  border-radius: 0.25rem;
}

:deep(.dark mark) {
  background-color: rgb(133 77 14);
}
</style>
