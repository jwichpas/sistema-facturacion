<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">DataTable Examples</h2>
      <p class="text-gray-600 dark:text-gray-400">
        Comprehensive examples of the DataTable component with various features enabled.
      </p>
    </div>

    <!-- Basic Table -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Basic Product Table</h3>
      <DataTable
        :columns="productColumns"
        :data="products"
        :enable-row-selection="true"
        :enable-column-visibility="true"
        :enable-column-resizing="true"
        :enable-global-filter="true"
        @selection-change="onSelectionChange"
        @row-click="onRowClick"
      >
        <template #bulk-actions="{ selectedRows, clearSelection }">
          <div class="flex items-center gap-2">
            <BaseButton variant="outline" @click="clearSelection">
              Limpiar ({{ selectedRows.length }})
            </BaseButton>
            <BaseButton variant="primary" @click="bulkDelete(selectedRows)">
              Eliminar seleccionados
            </BaseButton>
            <BaseButton variant="secondary" @click="bulkExport(selectedRows)">
              Exportar seleccionados
            </BaseButton>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Sales Table -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Sales Documents Table</h3>
      <DataTable
        :columns="salesColumns"
        :data="salesDocuments"
        :page-size-options="[5, 10, 25]"
        :enable-row-selection="false"
        :enable-column-visibility="true"
        :enable-global-filter="true"
        @row-click="onSalesRowClick"
      />
    </div>

    <!-- Inventory Table -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Inventory Stock Table</h3>
      <DataTable
        :columns="inventoryColumns"
        :data="inventory"
        :page-size-options="[10, 20, 50]"
        :enable-row-selection="true"
        :enable-column-resizing="false"
        @selection-change="onInventorySelection"
      />
    </div>

    <!-- Selection Info -->
    <div v-if="selectedProducts.length > 0" class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
      <h4 class="font-medium text-blue-900 dark:text-blue-100 mb-2">Selected Products:</h4>
      <ul class="text-sm text-blue-800 dark:text-blue-200">
        <li v-for="product in selectedProducts" :key="product.id">
          {{ product.name }} - ${{ product.price }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { DataTable } from '@/components/ui'
import BaseButton from '@/components/ui/BaseButton.vue'
import type { ColumnDef } from '@tanstack/vue-table'

// Sample data
const products = ref([
  { id: 1, sku: 'PROD-001', name: 'Laptop Dell XPS 13', price: 1299.99, category: 'Electronics', stock: 15, active: true },
  { id: 2, sku: 'PROD-002', name: 'iPhone 15 Pro', price: 999.99, category: 'Electronics', stock: 8, active: true },
  { id: 3, sku: 'PROD-003', name: 'Nike Air Max', price: 129.99, category: 'Footwear', stock: 25, active: true },
  { id: 4, sku: 'PROD-004', name: 'Samsung Monitor 27"', price: 299.99, category: 'Electronics', stock: 12, active: false },
  { id: 5, sku: 'PROD-005', name: 'Adidas T-Shirt', price: 29.99, category: 'Clothing', stock: 50, active: true },
])

const salesDocuments = ref([
  { id: 1, docType: 'Factura', series: 'F001', number: '00001234', customer: 'ACME Corp', total: 1500.00, date: '2024-01-15', status: 'Pagado' },
  { id: 2, docType: 'Boleta', series: 'B001', number: '00005678', customer: 'Juan Pérez', total: 250.50, date: '2024-01-14', status: 'Pendiente' },
  { id: 3, docType: 'Factura', series: 'F001', number: '00001235', customer: 'Tech Solutions', total: 3200.00, date: '2024-01-13', status: 'Pagado' },
])

const inventory = ref([
  { id: 1, product: 'Laptop Dell XPS 13', warehouse: 'Almacén Principal', stock: 15, reserved: 2, available: 13, minStock: 5 },
  { id: 2, product: 'iPhone 15 Pro', warehouse: 'Almacén Principal', stock: 8, reserved: 1, available: 7, minStock: 3 },
  { id: 3, product: 'Nike Air Max', warehouse: 'Almacén Secundario', stock: 25, reserved: 0, available: 25, minStock: 10 },
])

const selectedProducts = ref<any[]>([])

// Product columns
const productColumns: ColumnDef<any, any>[] = [
  {
    accessorKey: 'sku',
    header: 'SKU',
    size: 120,
  },
  {
    accessorKey: 'name',
    header: 'Nombre',
    size: 250,
  },
  {
    accessorKey: 'category',
    header: 'Categoría',
    size: 120,
  },
  {
    accessorKey: 'price',
    header: 'Precio',
    size: 100,
    cell: ({ getValue }) => `$${getValue().toFixed(2)}`,
  },
  {
    accessorKey: 'stock',
    header: 'Stock',
    size: 80,
    cell: ({ getValue }) => {
      const stock = getValue() as number
      return `<span class="${stock < 10 ? 'text-red-600 font-medium' : 'text-gray-900 dark:text-gray-100'}">${stock}</span>`
    },
  },
  {
    accessorKey: 'active',
    header: 'Estado',
    size: 100,
    cell: ({ getValue }) => {
      const active = getValue() as boolean
      return `<span class="px-2 py-1 text-xs rounded-full ${
        active
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      }">${active ? 'Activo' : 'Inactivo'}</span>`
    },
  },
]

// Sales columns
const salesColumns: ColumnDef<any, any>[] = [
  {
    accessorKey: 'docType',
    header: 'Tipo',
    size: 80,
  },
  {
    accessorKey: 'series',
    header: 'Serie',
    size: 80,
  },
  {
    accessorKey: 'number',
    header: 'Número',
    size: 100,
  },
  {
    accessorKey: 'customer',
    header: 'Cliente',
    size: 200,
  },
  {
    accessorKey: 'date',
    header: 'Fecha',
    size: 100,
    cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString('es-PE'),
  },
  {
    accessorKey: 'total',
    header: 'Total',
    size: 100,
    cell: ({ getValue }) => `S/ ${getValue().toFixed(2)}`,
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    size: 100,
    cell: ({ getValue }) => {
      const status = getValue() as string
      return `<span class="px-2 py-1 text-xs rounded-full ${
        status === 'Pagado'
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      }">${status}</span>`
    },
  },
]

// Inventory columns
const inventoryColumns: ColumnDef<any, any>[] = [
  {
    accessorKey: 'product',
    header: 'Producto',
    size: 250,
  },
  {
    accessorKey: 'warehouse',
    header: 'Almacén',
    size: 150,
  },
  {
    accessorKey: 'stock',
    header: 'Stock Total',
    size: 100,
  },
  {
    accessorKey: 'reserved',
    header: 'Reservado',
    size: 100,
  },
  {
    accessorKey: 'available',
    header: 'Disponible',
    size: 100,
    cell: ({ getValue, row }) => {
      const available = getValue() as number
      const minStock = row.original.minStock
      return `<span class="${available <= minStock ? 'text-red-600 font-medium' : 'text-gray-900 dark:text-gray-100'}">${available}</span>`
    },
  },
  {
    accessorKey: 'minStock',
    header: 'Stock Mín.',
    size: 100,
  },
]

// Event handlers
const onSelectionChange = (rows: any[]) => {
  selectedProducts.value = rows
  console.log('Selected products:', rows)
}

const onRowClick = (row: any) => {
  console.log('Product clicked:', row)
}

const onSalesRowClick = (row: any) => {
  console.log('Sales document clicked:', row)
}

const onInventorySelection = (rows: any[]) => {
  console.log('Inventory selection:', rows)
}

const bulkDelete = (rows: any[]) => {
  console.log('Bulk delete:', rows)
  // Implement bulk delete logic
}

const bulkExport = (rows: any[]) => {
  console.log('Bulk export:', rows)
  // Implement bulk export logic
}
</script>
