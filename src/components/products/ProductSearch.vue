<template>
  <div class="relative">
    <div class="relative">
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder"
        class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 pl-10 pr-4"
        @focus="showDropdown = true"
        @input="handleSearch"
        @keydown="handleKeydown"
      />
      <div class="absolute inset-y-0 left-0 flex items-center pl-3">
        <Search class="h-4 w-4 text-gray-400" />
      </div>
    </div>

    <!-- Dropdown -->
    <div
      v-if="showDropdown && (filteredProducts.length > 0 || loading || searchQuery.length > 0)"
      class="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-80 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none"
    >
      <!-- Loading -->
      <div v-if="loading" class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
        <div class="flex items-center">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          Buscando productos...
        </div>
      </div>

      <!-- No results -->
      <div v-else-if="searchQuery.length > 0 && filteredProducts.length === 0" class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
        No se encontraron productos
      </div>

      <!-- Products list -->
      <div
        v-for="(product, index) in filteredProducts"
        :key="product.id"
        :class="[
          'cursor-pointer select-none relative px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700',
          { 'bg-blue-100 dark:bg-blue-900': index === selectedIndex }
        ]"
        @click="selectProduct(product)"
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
            <div
              v-else
              class="w-10 h-10 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
            >
              <Package class="w-5 h-5 text-gray-400" />
            </div>
          </div>

          <!-- Product Info -->
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-gray-900 dark:text-white truncate">
              {{ product.name }}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400 truncate">
              SKU: {{ product.sku }}
              <span v-if="product.barcode" class="ml-2">
                | Código: {{ product.barcode }}
              </span>
            </div>
            <div v-if="product.brand_name || product.category_name" class="text-xs text-gray-400 dark:text-gray-500 truncate">
              <span v-if="product.brand_name">{{ product.brand_name }}</span>
              <span v-if="product.brand_name && product.category_name"> | </span>
              <span v-if="product.category_name">{{ product.category_name }}</span>
            </div>
          </div>

          <!-- Stock and Price -->
          <div class="flex-shrink-0 text-right">
            <div class="text-sm font-medium text-gray-900 dark:text-white">
              Stock: {{ product.total_stock || 0 }}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              <!-- Price would come from price list -->
              Precio: S/ 0.00
            </div>
            <div v-if="(product.total_stock || 0) <= (product.min_stock || 0)" class="text-xs text-amber-600 dark:text-amber-400">
              Stock bajo
            </div>
          </div>
        </div>
      </div>

      <!-- Show more results -->
      <div v-if="hasMoreResults" class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
        Mostrando {{ filteredProducts.length }} de {{ totalResults }} resultados
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useProductStore } from '@/stores/product'
import type { ProductListItem } from '@/services/product'
import { Search, Package } from 'lucide-vue-next'

// Props
interface Props {
  modelValue?: ProductListItem | null
  placeholder?: string
  filters?: Record<string, any>
  maxResults?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: 'Buscar producto por nombre, SKU o código...',
  filters: () => ({}),
  maxResults: 10
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [product: ProductListItem | null]
  'product-selected': [product: ProductListItem]
}>()

// Store
const productStore = useProductStore()

// Local state
const searchQuery = ref('')
const showDropdown = ref(false)
const selectedIndex = ref(-1)
const searchInput = ref<HTMLInputElement>()
const searchTimeout = ref<NodeJS.Timeout>()

// Computed
const loading = computed(() => productStore.loading)

const filteredProducts = computed(() => {
  if (!searchQuery.value.trim() || searchQuery.value.trim().length < 2) return []

  const query = searchQuery.value.toLowerCase().trim()

  return productStore.products
    .filter(product => {
      // Only show active products with stock
      if (!product.active || (product.total_stock || 0) <= 0) return false

      // Search in name, SKU, and barcode
      return (
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        (product.barcode && product.barcode.toLowerCase().includes(query))
      )
    })
    .slice(0, props.maxResults)
})

const totalResults = computed(() => {
  if (!searchQuery.value.trim() || searchQuery.value.trim().length < 2) return 0

  const query = searchQuery.value.toLowerCase().trim()

  return productStore.products.filter(product => {
    if (!product.active || (product.total_stock || 0) <= 0) return false

    return (
      product.name.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query) ||
      (product.barcode && product.barcode.toLowerCase().includes(query))
    )
  }).length
})

const hasMoreResults = computed(() => {
  return totalResults.value > props.maxResults
})

// Methods
const handleSearch = () => {
  selectedIndex.value = -1

  // Show dropdown if we have a query
  if (searchQuery.value.trim().length >= 2) {
    showDropdown.value = true
  } else {
    showDropdown.value = false
  }

  // Debounce search
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }

  searchTimeout.value = setTimeout(() => {
    if (searchQuery.value.trim().length >= 2) {
      // Trigger search in store if needed
      productStore.updateFilters({
        ...props.filters,
        search: searchQuery.value.trim()
      })
    }
  }, 300)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!showDropdown.value || filteredProducts.value.length === 0) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, filteredProducts.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
      break
    case 'Enter':
      event.preventDefault()
      if (selectedIndex.value >= 0 && selectedIndex.value < filteredProducts.value.length) {
        selectProduct(filteredProducts.value[selectedIndex.value])
      }
      break
    case 'Escape':
      event.preventDefault()
      hideDropdown()
      break
  }
}

const selectProduct = (product: ProductListItem) => {
  emit('update:modelValue', product)
  emit('product-selected', product)

  // Clear search and hide dropdown
  searchQuery.value = ''
  hideDropdown()

  // Focus back to search input for next search
  setTimeout(() => {
    searchInput.value?.focus()
  }, 100)
}

const hideDropdown = () => {
  showDropdown.value = false
  selectedIndex.value = -1
}

const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    hideDropdown()
  }
}

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    searchQuery.value = newValue.name
  } else {
    searchQuery.value = ''
  }
})

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)

  // Load products if not already loaded
  if (productStore.products.length === 0) {
    productStore.loadProducts()
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
})
</script>
