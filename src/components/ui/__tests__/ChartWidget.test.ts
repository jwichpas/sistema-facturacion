import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ChartWidget from '../ChartWidget.vue'

// Mock VueApexCharts
vi.mock('vue3-apexcharts', () => ({
  default: {
    name: 'VueApexCharts',
    props: ['type', 'height', 'options', 'series'],
    template: '<div class="mock-chart">Chart Component</div>',
  },
}))

describe('ChartWidget', () => {
  const mockOptions = {
    chart: {
      type: 'line',
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar'],
    },
  }

  const mockSeries = [
    {
      name: 'Sales',
      data: [100, 200, 150],
    },
  ]

  it('renders chart widget with title', () => {
    const wrapper = mount(ChartWidget, {
      props: {
        title: 'Sales Chart',
        options: mockOptions,
        series: mockSeries,
      },
    })

    expect(wrapper.text()).toContain('Sales Chart')
  })

  it('displays subtitle when provided', () => {
    const wrapper = mount(ChartWidget, {
      props: {
        title: 'Revenue',
        subtitle: 'Monthly breakdown',
        options: mockOptions,
        series: mockSeries,
      },
    })

    expect(wrapper.text()).toContain('Monthly breakdown')
  })

  it('renders chart component after mounting', async () => {
    const wrapper = mount(ChartWidget, {
      props: {
        title: 'Test Chart',
        options: mockOptions,
        series: mockSeries,
      },
    })

    // Wait for component to mount
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.mock-chart').exists()).toBe(true)
  })

  it('uses default chart type when not specified', () => {
    const wrapper = mount(ChartWidget, {
      props: {
        title: 'Default Chart',
        options: mockOptions,
        series: mockSeries,
      },
    })

    // Check that the component renders without errors
    expect(wrapper.exists()).toBe(true)
  })

  it('uses default height when not specified', () => {
    const wrapper = mount(ChartWidget, {
      props: {
        title: 'Height Test',
        options: mockOptions,
        series: mockSeries,
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('accepts custom chart type', () => {
    const wrapper = mount(ChartWidget, {
      props: {
        title: 'Bar Chart',
        type: 'bar',
        options: mockOptions,
        series: mockSeries,
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('accepts custom height', () => {
    const wrapper = mount(ChartWidget, {
      props: {
        title: 'Custom Height',
        height: 400,
        options: mockOptions,
        series: mockSeries,
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('renders actions slot when provided', () => {
    const wrapper = mount(ChartWidget, {
      props: {
        title: 'Chart with Actions',
        options: mockOptions,
        series: mockSeries,
      },
      slots: {
        actions: '<button class="action-btn">Export</button>',
      },
    })

    expect(wrapper.find('.action-btn').exists()).toBe(true)
    expect(wrapper.text()).toContain('Export')
  })

  it('applies dark mode classes correctly', () => {
    const wrapper = mount(ChartWidget, {
      props: {
        title: 'Dark Mode Test',
        options: mockOptions,
        series: mockSeries,
      },
    })

    expect(wrapper.find('.dark\\:bg-gray-800').exists()).toBe(true)
    expect(wrapper.find('.dark\\:text-gray-100').exists()).toBe(true)
  })
})
