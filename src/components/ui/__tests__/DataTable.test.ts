import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DataTable from '../DataTable.vue'
import type { ColumnDef } from '@tanstack/vue-table'

// Mock data for testing
const mockData = [
  { id: 1, name: 'Product A', price: 100, category: 'Electronics' },
  { id: 2, name: 'Product B', price: 200, category: 'Clothing' },
  { id: 3, name: 'Product C', price: 150, category: 'Electronics' },
]

const mockColumns: ColumnDef<any, any>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ getValue }) => `$${getValue()}`,
  },
  {
    accessorKey: 'category',
    header: 'Category',
  },
]

describe('DataTable', () => {
  it('renders table with data', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: mockColumns,
        data: mockData,
      },
    })

    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.text()).toContain('Product A')
    expect(wrapper.text()).toContain('Product B')
    expect(wrapper.text()).toContain('Product C')
  })

  it('displays column headers correctly', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: mockColumns,
        data: mockData,
      },
    })

    expect(wrapper.text()).toContain('Name')
    expect(wrapper.text()).toContain('Price')
    expect(wrapper.text()).toContain('Category')
  })

  it('shows global search input when enabled', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: mockColumns,
        data: mockData,
        enableGlobalFilter: true,
      },
    })

    const searchInput = wrapper.find('input[placeholder="Buscar..."]')
    expect(searchInput.exists()).toBe(true)
  })

  it('hides global search input when disabled', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: mockColumns,
        data: mockData,
        enableGlobalFilter: false,
      },
    })

    const searchInput = wrapper.find('input[placeholder="Buscar..."]')
    expect(searchInput.exists()).toBe(false)
  })

  it('shows row selection checkboxes when enabled', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: mockColumns,
        data: mockData,
        enableRowSelection: true,
      },
    })

    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    expect(checkboxes.length).toBeGreaterThan(0)
  })

  it('hides row selection checkboxes when disabled', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: mockColumns,
        data: mockData,
        enableRowSelection: false,
      },
    })

    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    expect(checkboxes.length).toBe(0)
  })

  it('shows column visibility controls when enabled', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: mockColumns,
        data: mockData,
        enableColumnVisibility: true,
      },
    })

    const columnsButton = wrapper.find('button')
    const buttons = wrapper.findAll('button')
    const columnsButtonExists = buttons.some(button => button.text().includes('Columnas'))
    expect(columnsButtonExists).toBe(true)
  })

  it('displays pagination controls', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: mockColumns,
        data: mockData,
      },
    })

    expect(wrapper.text()).toContain('Anterior')
    expect(wrapper.text()).toContain('Siguiente')
    expect(wrapper.text()).toContain('por página')
  })

  it('shows empty state when no data', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: mockColumns,
        data: [],
      },
    })

    expect(wrapper.text()).toContain('No hay datos para mostrar')
  })

  it('emits selectionChange event when rows are selected', async () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: mockColumns,
        data: mockData,
        enableRowSelection: true,
      },
    })

    // Find the first row checkbox (skip header checkbox)
    const rowCheckboxes = wrapper.findAll('tbody input[type="checkbox"]')
    if (rowCheckboxes.length > 0) {
      await rowCheckboxes[0].trigger('change')
      expect(wrapper.emitted('selectionChange')).toBeTruthy()
    }
  })

  it('emits rowClick event when row is clicked', async () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: mockColumns,
        data: mockData,
      },
    })

    // Find the div inside the cell that has the click handler
    const firstRowCellDiv = wrapper.find('tbody td div')
    await firstRowCellDiv.trigger('click')
    expect(wrapper.emitted('rowClick')).toBeTruthy()
  })

  it('displays correct pagination info', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: mockColumns,
        data: mockData,
        pageSizeOptions: [2, 5, 10],
      },
    })

    expect(wrapper.text()).toContain('Mostrando')
    expect(wrapper.text()).toContain('resultados')
  })

  it('allows changing page size', async () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: mockColumns,
        data: mockData,
        pageSizeOptions: [2, 5, 10],
      },
    })

    const pageSizeSelect = wrapper.find('select')
    expect(pageSizeSelect.exists()).toBe(true)

    // Check that options are present
    const options = wrapper.findAll('option')
    expect(options.length).toBe(3)
    expect(options[0].text()).toContain('2 por página')
    expect(options[1].text()).toContain('5 por página')
    expect(options[2].text()).toContain('10 por página')
  })
})
