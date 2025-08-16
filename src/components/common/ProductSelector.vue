<template>
  <div class="relative">
    <select
      :value="modelValue"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
    >
      <option value="">Seleccionar producto</option>
      <option
        v-for="product in products"
        :key="product.id"
        :value="product.id"
      >
        {{ product.sku }} - {{ product.name }}
        <span v-if="warehouseId && product.total_stock !== undefined">
          (Stock: {{ product.total_stock }})
        </span>
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useProductStore } from '@/stores/product'
import type { ProductListItem } from '@/services/product'

interface Props {
  modelValue: string
  warehouseId?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const productStore = useProductStore()

// State
const products = ref<ProductListItem[]>([])

// Methods
const loadProducts = async () => {
  try {
    await productStore.fetchProducts({ active: true })
    products.value = productStore.products
  } catch (error) {
    console.error('Error loading products:', error)
  }
}

// Watchers
watch(
  () => props.warehouseId,
  () => {
    // TODO: Filter products by warehouse stock when warehouseId changes
    loadProducts()
  }
)

// Lifecycle
onMounted(() => {
  loadProducts()
})
</script>
