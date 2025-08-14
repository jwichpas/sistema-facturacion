<template>
  <div class="relative">
    <div class="relative">
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder"
        class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
        @focus="showDropdown = true"
        @input="handleSearch"
        @keydown="handleKeydown"
      />
      <div class="absolute inset-y-0 right-0 flex items-center pr-3">
        <Search class="h-4 w-4 text-gray-400" />
      </div>
    </div>

    <!-- Dropdown -->
    <div
      v-if="showDropdown && (filteredProducts.length > 0 || loading || searchQuery.length > 0)"
      class="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none"
    >
      <!-- Loading -->
      <div v-if="loading" class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
        <div class="flex items-center">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          Buscando productos...
        </div>
      </div>

      <!-- No results -->
      <div v-else-if="searchQuery.length > 0 && filteredProducts.length === 0" class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
        No se encontraron productos
      </div>

      <!-- Products list -->
      <div
        v-for="(product, index) in filteredProducts"
        :key="product.id"
        :class="[
          'cursor-pointer select-none relative px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700',
          { 'bg-blue-100 dark:bg-blue-900': index === selectedIndex }
        ]"
        @click="selectProduct(product)"
      >
        <div class="flex items-center justify-between">
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
          <div class="ml-4 flex-shrink-0">
            <div class="text-sm font-medium text-gray-900 dark:text-white">
              Stock: {{ product.total_stock || 0 }}
            </div>
            <div v-if="product.primary_image" class="mt-1">
              <img
                :src="product.primary_image"
                :alt="product.name"
                class="h-8 w-8 rounded object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Show more results -->
      <div v-if="hasMoreResults" class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
        Mostrando {{ filteredProducts.length }} de {{ totalResults }} resultados
      </div>
    </div>

    <!-- Selected Product Display -->
    <div v-if="selectedProduct && !showDropdown" class="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
      <div class="flex items-center justify-between">
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-blue-900 dark:text-blue-200">
            {{ selectedProduct.name }}
          </div>
          <div class="text-sm text-blue-700 dark:text-blue-300">
            SKU: {{ selectedProduct.sku }} | Stock: {{ selectedProduct.total_stock || 0 }}
          </div>
        </div>
        <button
          @click="clearSelection"
          class="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useProductStore } from '@/stores/product'
import type { Product, ProductListItem } from '@/services/product'
import { Search, X } from 'lucide-vue-next'

// Props
interface Props {
  modelValue?: Product | null
  placeholder?: string
  filters?: Record<string, any>
  maxResults?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: 'Buscar producto...',
  filters: () => ({}),
  maxResults: 10
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [product: Product | null]
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
const selectedProduct = computed(() => props.modelValue)

const loading = computed(() => productStore.loading)

const filteredProducts = computed(() => {
  if (!searchQuery.value.trim()) return []

  return productStore.products
    .filter(product => {
      const query = searchQuery.value.toLowerCase()
      return (
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        (product.barcode && product.barcode.toLowerCase().includes(query))
      )
    })
    .slice(0, props.maxResults)
})

const totalResults = computed(() => {
  if (!searchQuery.value.trim()) return 0

  return productStore.products.filter(product => {
    const query = searchQuery.value.toLowerCase()
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
  // Convert ProductListItem to Product for compatibility
  const selectedProd: Product = {
    id: product.id,
    company_id: product.company_id,
    sku: product.sku,
    barcode: product.barcode,
    name: product.name,
    description: product.description,
    brand_id: product.brand_id,
    category_id: product.category_id,
    unit_code: product.unit_code,
    width: product.width,
    height: product.height,
    length: product.length,
    weight_kg: product.weight_kg,
    is_serialized: product.is_serialized,
    is_batch_controlled: product.is_batch_controlled,
    min_stock: product.min_stock,
    max_stock: product.max_stock,
    active: product.active,
    created_at: product.created_at,
    updated_at: product.updated_at,
    deleted_at: product.deleted_at
  }

  emit('update:modelValue', selectedProd)
  searchQuery.value = product.name
  hideDropdown()
}

const clearSelection = () => {
  emit('update:modelValue', null)
  searchQuery.value = ''
  showDropdown.value = false
  selectedIndex.value = -1
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

  // Initialize search query if product is already selected
  if (selectedProduct.value) {
    searchQuery.value = selectedProduct.value.name
  }

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
