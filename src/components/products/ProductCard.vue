<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
    @click="$emit('click', product)"
  >
    <!-- Product Image -->
    <div class="aspect-square w-full overflow-hidden rounded-t-lg bg-gray-200 dark:bg-gray-700">
      <img
        v-if="product.primary_image"
        :src="product.primary_image"
        :alt="product.name"
        class="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-200"
      />
      <div v-else class="h-full w-full flex items-center justify-center">
        <Package class="h-16 w-16 text-gray-400" />
      </div>
    </div>

    <!-- Product Info -->
    <div class="p-4">
      <!-- Header -->
      <div class="flex items-start justify-between mb-2">
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {{ product.name }}
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {{ product.sku }}
          </p>
        </div>

        <!-- Status Badge -->
        <span
          :class="[
            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2',
            product.active
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
          ]"
        >
          {{ product.active ? 'Activo' : 'Inactivo' }}
        </span>
      </div>

      <!-- Brand and Category -->
      <div class="space-y-1 mb-3">
        <p v-if="product.brand_name" class="text-xs text-gray-600 dark:text-gray-400">
          <span class="font-medium">Marca:</span> {{ product.brand_name }}
        </p>
        <p v-if="product.category_name" class="text-xs text-gray-600 dark:text-gray-400">
          <span class="font-medium">Categoría:</span> {{ product.category_name }}
        </p>
      </div>

      <!-- Stock Info -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500 dark:text-gray-400">Stock:</span>
          <span
            :class="[
              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
              stockBadgeClass
            ]"
          >
            {{ product.total_stock || 0 }}
          </span>
        </div>

        <!-- Stock Status Icon -->
        <div class="flex items-center">
          <AlertTriangle
            v-if="isLowStock"
            class="h-4 w-4 text-yellow-500"
            title="Stock bajo"
          />
          <XCircle
            v-else-if="isOutOfStock"
            class="h-4 w-4 text-red-500"
            title="Sin stock"
          />
          <CheckCircle
            v-else
            class="h-4 w-4 text-green-500"
            title="Stock normal"
          />
        </div>
      </div>

      <!-- Barcode -->
      <div v-if="product.barcode" class="mb-3">
        <p class="text-xs text-gray-500 dark:text-gray-400">
          <span class="font-medium">Código:</span>
          <span class="font-mono">{{ product.barcode }}</span>
        </p>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-1">
          <button
            class="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Ver detalles"
            @click.stop="$emit('click', product)"
          >
            <Eye class="h-4 w-4" />
          </button>
          <button
            class="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            title="Editar"
            @click.stop="$emit('edit', product)"
          >
            <Edit class="h-4 w-4" />
          </button>
          <button
            class="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Eliminar"
            @click.stop="$emit('delete', product)"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </div>

        <!-- Quick Actions -->
        <div class="flex items-center gap-1">
          <button
            v-if="product.barcode"
            class="p-1 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            title="Escanear código"
            @click.stop="$emit('scan', product)"
          >
            <QrCode class="h-4 w-4" />
          </button>
          <button
            class="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            title="Ver stock"
            @click.stop="$emit('view-stock', product)"
          >
            <BarChart3 class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import {
  Package,
  Eye,
  Edit,
  Trash2,
  QrCode,
  BarChart3,
  AlertTriangle,
  XCircle,
  CheckCircle
} from 'lucide-vue-next'
import type { ProductListItem } from '@/services/product'

interface Props {
  product: ProductListItem
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [product: ProductListItem]
  edit: [product: ProductListItem]
  delete: [product: ProductListItem]
  scan: [product: ProductListItem]
  'view-stock': [product: ProductListItem]
}>()

// Stock status computed properties
const isOutOfStock = computed(() => (props.product.total_stock || 0) === 0)
const isLowStock = computed(() => {
  const stock = props.product.total_stock || 0
  const minStock = props.product.min_stock || 0
  return stock > 0 && stock <= minStock
})

const stockBadgeClass = computed(() => {
  if (isOutOfStock.value) {
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  } else if (isLowStock.value) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  } else {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  }
})
</script>
