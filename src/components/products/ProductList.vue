<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Productos</h1>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Gestiona tu catálogo de productos
        </p>
      </div>
      <div class="flex items-center gap-2">
        <BaseButton variant="outline" @click="showFilters = !showFilters">
          <Filter class="w-4 h-4 mr-2" />
          Filtros
        </BaseButton>
        <BaseButton @click="$emit('create')">
          <Plus class="w-4 h-4 mr-2" />
          Nuevo Producto
        </BaseButton>
      </div>
    </div>

    <!-- Filters -->
    <ProductFilters
      v-if="showFilters"
      :filters="filters"
      :brands="brands"
      :categories="categories"
      @update:filters="$emit('update:filters', $event)"
    />

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <Package class="h-8 w-8 text-blue-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Productos</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ totalProducts }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <AlertTriangle class="h-8 w-8 text-yellow-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Stock Bajo</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ lowStockCount }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <XCircle class="h-8 w-8 text-red-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Sin Stock</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ outOfStockCount }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <CheckCircle class="h-8 w-8 text-green-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Activos</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ activeProductsCount }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Product Grid/Table Toggle -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-600 dark:text-gray-400">Vista:</span>
        <div class="flex rounded-lg border border-gray-200 dark:border-gray-700">
          <button
            :class="[
              'px-3 py-1 text-sm rounded-l-lg transition-colors',
              viewMode === 'grid'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            ]"
            @click="viewMode = 'grid'"
          >
            <Grid class="w-4 h-4" />
          </button>
          <button
            :class="[
              'px-3 py-1 text-sm rounded-r-lg transition-colors',
              viewMode === 'table'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            ]"
            @click="viewMode = 'table'"
          >
            <List class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div class="text-sm text-gray-600 dark:text-gray-400">
        {{ products.length }} productos encontrados
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-2 text-gray-600 dark:text-gray-400">Cargando productos...</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="products.length === 0" class="text-center py-12">
      <Package class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No hay productos</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Comienza creando tu primer producto.
      </p>
      <div class="mt-6">
        <BaseButton @click="$emit('create')">
          <Plus class="w-4 h-4 mr-2" />
          Nuevo Producto
        </BaseButton>
      </div>
    </div>

    <!-- Grid View -->
    <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <ProductCard
        v-for="product in products"
        :key="product.id"
        :product="product"
        @click="$emit('select', product)"
        @edit="$emit('edit', product)"
        @delete="$emit('delete', product)"
      />
    </div>

    <!-- Table View -->
    <DataTable
      v-else
      :columns="tableColumns"
      :data="products"
      :enable-row-selection="true"
      @row-click="$emit('select', $event)"
      @selection-change="$emit('selection-change', $event)"
    >
      <template #bulk-actions="{ selectedRows, clearSelection }">
        <div class="flex items-center gap-2">
          <BaseButton variant="outline" size="sm" @click="clearSelection">
            Limpiar ({{ selectedRows.length }})
          </BaseButton>
          <BaseButton variant="outline" size="sm" @click="$emit('bulk-delete', selectedRows)">
            <Trash2 class="w-4 h-4 mr-1" />
            Eliminar
          </BaseButton>
          <BaseButton variant="outline" size="sm" @click="$emit('bulk-export', selectedRows)">
            <Download class="w-4 h-4 mr-1" />
            Exportar
          </BaseButton>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, type PropType } from 'vue'
import {
  Package,
  Plus,
  Filter,
  Grid,
  List,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Trash2,
  Download
} from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import DataTable from '@/components/ui/DataTable.vue'
import ProductCard from './ProductCard.vue'
import ProductFilters from './ProductFilters.vue'
import type { ProductListItem, Brand, Category, ProductFilters as ProductFiltersType } from '@/services/product'
import type { ColumnDef } from '@tanstack/vue-table'

interface Props {
  products: ProductListItem[]
  brands: Brand[]
  categories: Category[]
  filters: ProductFiltersType
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  create: []
  select: [product: ProductListItem]
  edit: [product: ProductListItem]
  delete: [product: ProductListItem]
  'bulk-delete': [products: ProductListItem[]]
  'bulk-export': [products: ProductListItem[]]
  'selection-change': [products: ProductListItem[]]
  'update:filters': [filters: ProductFiltersType]
}>()

const showFilters = ref(false)
const viewMode = ref<'grid' | 'table'>('grid')

// Computed stats
const totalProducts = computed(() => props.products.length)
const lowStockCount = computed(() =>
  props.products.filter(p => (p.total_stock || 0) <= (p.min_stock || 0) && (p.total_stock || 0) > 0).length
)
const outOfStockCount = computed(() =>
  props.products.filter(p => (p.total_stock || 0) === 0).length
)
const activeProductsCount = computed(() =>
  props.products.filter(p => p.active).length
)

// Table columns
const tableColumns: ColumnDef<ProductListItem>[] = [
  {
    accessorKey: 'primary_image',
    header: 'Imagen',
    cell: ({ row }) => {
      const product = row.original
      return product.primary_image
        ? `<img src="${product.primary_image}" alt="${product.name}" class="w-10 h-10 rounded object-cover" />`
        : `<div class="w-10 h-10 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
             <Package class="w-5 h-5 text-gray-400" />
           </div>`
    },
    enableSorting: false,
    size: 80
  },
  {
    accessorKey: 'sku',
    header: 'SKU',
    cell: ({ row }) => `<span class="font-mono text-sm">${row.original.sku}</span>`
  },
  {
    accessorKey: 'name',
    header: 'Nombre',
    cell: ({ row }) => {
      const product = row.original
      return `<div>
        <div class="font-medium text-gray-900 dark:text-gray-100">${product.name}</div>
        ${product.brand_name ? `<div class="text-sm text-gray-500 dark:text-gray-400">${product.brand_name}</div>` : ''}
      </div>`
    }
  },
  {
    accessorKey: 'category_name',
    header: 'Categoría',
    cell: ({ row }) => row.original.category_name || '-'
  },
  {
    accessorKey: 'total_stock',
    header: 'Stock',
    cell: ({ row }) => {
      const product = row.original
      const stock = product.total_stock || 0
      const minStock = product.min_stock || 0

      let badgeClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      if (stock === 0) {
        badgeClass = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      } else if (stock <= minStock) {
        badgeClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      }

      return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}">
        ${stock}
      </span>`
    }
  },
  {
    accessorKey: 'active',
    header: 'Estado',
    cell: ({ row }) => {
      const isActive = row.original.active
      return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      }">
        ${isActive ? 'Activo' : 'Inactivo'}
      </span>`
    }
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => {
      const product = row.original
      return `<div class="flex items-center gap-2">
        <button class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300" onclick="editProduct('${product.id}')">
          Editar
        </button>
        <button class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300" onclick="deleteProduct('${product.id}')">
          Eliminar
        </button>
      </div>`
    },
    enableSorting: false,
    size: 120
  }
]
</script>
