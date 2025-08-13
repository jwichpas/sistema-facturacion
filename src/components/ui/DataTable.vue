<template>
  <div class="space-y-4">
    <!-- Toolbar -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div class="flex items-center gap-2">
        <div v-if="enableRowSelection && selectedRowCount > 0" class="flex items-center gap-2">
          <slot name="bulk-actions" :selected-rows="selectedRows" :clear-selection="clearSelection">
            <BaseButton variant="outline" @click="clearSelection">
              Limpiar selección ({{ selectedRowCount }})
            </BaseButton>
          </slot>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <div v-if="enableGlobalFilter" class="relative">
          <input
            v-model="globalFilter"
            type="text"
            placeholder="Buscar..."
            class="block w-64 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:text-gray-100 dark:bg-gray-800"
          />
        </div>

    <div v-if="enableColumnVisibility" class="relative">
      <BaseButton variant="outline" @click="showColumnsMenu = !showColumnsMenu">Columnas</BaseButton>
          <div
        v-if="showColumnsMenu"
        ref="menuEl"
        class="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 z-10"
          >
            <div class="space-y-1 max-h-72 overflow-auto">
              <label
                v-for="column in table.getAllLeafColumns()"
                :key="column.id"
                class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <input
                  type="checkbox"
                  :checked="column.getIsVisible()"
                  :disabled="!column.getCanHide()"
                  @change="column.toggleVisibility()"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">{{ column.columnDef.header as string }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th v-if="enableRowSelection" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
              <input
                type="checkbox"
                :checked="table.getIsAllRowsSelected()"
                :indeterminate="table.getIsSomeRowsSelected()"
                @change="table.toggleAllRowsSelected()"
              />
            </th>
            <th
              v-for="header in table.getHeaderGroups()[0].headers"
              :key="header.id"
              :style="{ width: header.getSize() + 'px' }"
              class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 select-none"
            >
              <div class="flex items-center gap-1">
                <button
                  v-if="!header.isPlaceholder"
                  class="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100"
                  @click="header.column.getToggleSortingHandler()?.($event as any)"
                >
                  <span>
                    <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
                  </span>
                  <span class="text-gray-400">
                    <span v-if="header.column.getIsSorted() === 'asc'">▲</span>
                    <span v-else-if="header.column.getIsSorted() === 'desc'">▼</span>
                  </span>
                </button>
                <div
                  v-if="enableColumnResizing"
                  class="ml-auto w-1 h-5 cursor-col-resize select-none"
                  @mousedown="header.getResizeHandler()?.($event as any)"
                  @touchstart="header.getResizeHandler()?.($event as any)"
                />
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          <tr v-for="row in table.getRowModel().rows" :key="row.id" class="hover:bg-gray-50 dark:hover:bg-gray-800">
            <td v-if="enableRowSelection" class="px-3 py-2">
              <input type="checkbox" :checked="row.getIsSelected()" @change="row.toggleSelected()" />
            </td>
            <td v-for="cell in row.getVisibleCells()" :key="cell.id" class="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
              <div @click="onRowClick(row)" class="cursor-default">
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </div>
            </td>
          </tr>
          <tr v-if="table.getRowModel().rows.length === 0">
            <td :colspan="visibleColumnCount + (enableRowSelection ? 1 : 0)" class="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No hay datos para mostrar
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div class="text-sm text-gray-600 dark:text-gray-400">
        Mostrando
        <span class="font-medium">{{ pageStart + 1 }}</span>
        -
        <span class="font-medium">{{ pageEnd }}</span>
        de
        <span class="font-medium">{{ table.getFilteredRowModel().rows.length }}</span>
        resultados
      </div>

      <div class="flex items-center gap-2">
        <select v-model.number="pageSize" class="px-2 py-1 border rounded text-sm dark:bg-gray-800 dark:border-gray-700">
          <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }} por página</option>
        </select>
        <BaseButton variant="outline" :disabled="!table.getCanPreviousPage()" @click="table.previousPage()">Anterior</BaseButton>
        <BaseButton variant="outline" :disabled="!table.getCanNextPage()" @click="table.nextPage()">Siguiente</BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  FlexRender,
  type ColumnDef,
  type Row,
} from '@tanstack/vue-table'

interface Props {
  columns: ColumnDef<any, any>[]
  data: any[]
  pageSizeOptions?: number[]
  enableRowSelection?: boolean
  enableColumnVisibility?: boolean
  enableColumnResizing?: boolean
  enableGlobalFilter?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  pageSizeOptions: () => [10, 20, 50, 100],
  enableRowSelection: true,
  enableColumnVisibility: true,
  enableColumnResizing: true,
  enableGlobalFilter: true,
})

const emit = defineEmits<{
  (e: 'selectionChange', selectedRows: any[]): void
  (e: 'rowClick', row: any): void
}>()

const globalFilter = ref('')
const rowSelection = ref<Record<string, boolean>>({})
const columnVisibility = ref<Record<string, boolean>>({})
const pageSize = ref(props.pageSizeOptions[0])
const pageIndex = ref(0)
const showColumnsMenu = ref(false)

const table = useVueTable({
  get data() {
    return props.data
  },
  get columns() {
    return props.columns
  },
  state: {
    get rowSelection() {
      return rowSelection.value
    },
    get columnVisibility() {
      return columnVisibility.value
    },
    get globalFilter() {
      return globalFilter.value
    },
    get pagination() {
      return { pageSize: pageSize.value, pageIndex: pageIndex.value }
    },
  },
  enableRowSelection: props.enableRowSelection,
  onRowSelectionChange: updater => {
    if (typeof updater === 'function') {
      rowSelection.value = updater(rowSelection.value)
    } else {
      rowSelection.value = updater as any
    }
  },
  onColumnVisibilityChange: updater => {
    if (typeof updater === 'function') {
      columnVisibility.value = updater(columnVisibility.value)
    } else {
      columnVisibility.value = updater as any
    }
  },
  onGlobalFilterChange: updater => {
    if (typeof updater === 'function') {
      globalFilter.value = updater(globalFilter.value) as string
    } else {
      globalFilter.value = updater as string
    }
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  columnResizeMode: 'onChange',
})

const visibleColumnCount = computed(() => table.getVisibleLeafColumns().length)

const selectedRows = computed(() => table.getSelectedRowModel().rows.map(r => r.original))
const selectedRowCount = computed(() => table.getSelectedRowModel().rows.length)

watch(selectedRows, rows => emit('selectionChange', rows))

const pageStart = computed(() => table.getState().pagination.pageIndex * table.getState().pagination.pageSize)
const pageEnd = computed(() => Math.min(pageStart.value + table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length))

watch(pageSize, size => table.setPageSize(size))
watch(pageIndex, index => table.setPageIndex(index))

const clearSelection = () => {
  table.resetRowSelection()
}

const onRowClick = (row: Row<any>) => {
  emit('rowClick', row.original)
}

// Close columns menu on outside click
const menuEl = ref<HTMLElement | null>(null)
watch(showColumnsMenu, shown => {
  if (shown) {
    setTimeout(() => {
      const handler = (e: MouseEvent) => {
        const target = e.target as Node
        if (menuEl.value && !menuEl.value.contains(target)) {
          showColumnsMenu.value = false
          window.removeEventListener('click', handler)
        }
      }
      window.addEventListener('click', handler)
    })
  }
})
</script>
