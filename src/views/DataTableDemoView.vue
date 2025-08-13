<template>
  <div class="max-w-6xl mx-auto p-6 space-y-6">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Demo de DataTable</h1>

    <DataTable
      :columns="columns"
      :data="rows"
      :page-size-options="[5,10,20]"
      @rowClick="onRowClick"
      @selectionChange="onSelectionChange"
    >
      <template #bulk-actions="{ selectedRows, clearSelection }">
        <BaseButton variant="outline" @click="clearSelection">Limpiar ({{ selectedRows.length }})</BaseButton>
        <BaseButton @click="deleteSelected(selectedRows)">Eliminar seleccionados</BaseButton>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { h, ref } from 'vue'
import { DataTable } from '@/components/ui'
import BaseButton from '@/components/ui/BaseButton.vue'
import type { ColumnDef } from '@tanstack/vue-table'

interface ProductRow {
  id: string
  name: string
  sku: string
  price: number
  stock: number
}

const columns: ColumnDef<ProductRow>[] = [
  {
    accessorKey: 'name',
    header: () => 'Producto',
    cell: info => info.getValue(),
  },
  {
    accessorKey: 'sku',
    header: () => 'SKU',
    cell: info => info.getValue(),
  },
  {
    accessorKey: 'price',
    header: () => 'Precio',
    cell: info => `S/ ${Number(info.getValue() as number).toFixed(2)}`,
  },
  {
    accessorKey: 'stock',
    header: () => 'Stock',
    cell: info => info.getValue(),
  },
]

const rows = ref<ProductRow[]>([
  { id: '1', name: 'Teclado Mecánico', sku: 'KB-001', price: 249.9, stock: 12 },
  { id: '2', name: 'Mouse Inalámbrico', sku: 'MS-101', price: 89.9, stock: 45 },
  { id: '3', name: 'Monitor 27" 4K', sku: 'MN-270', price: 1599.0, stock: 8 },
  { id: '4', name: 'Silla Ergonómica', sku: 'CH-900', price: 899.0, stock: 5 },
  { id: '5', name: 'Auriculares Bluetooth', sku: 'HP-550', price: 349.0, stock: 27 },
  { id: '6', name: 'Impresora Láser', sku: 'PR-300', price: 1299.0, stock: 3 },
])

const onRowClick = (row: ProductRow) => {
  console.log('row clicked', row)
}

const onSelectionChange = (rows: ProductRow[]) => {
  console.log('selection', rows)
}

const deleteSelected = (rows: ProductRow[]) => {
  alert(`Eliminar ${rows.length} elementos`)
}
</script>
