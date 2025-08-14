import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import KpiCard from '../KpiCard.vue'

describe('KpiCard', () => {
  it('renders basic KPI card with title and value', () => {
    const wrapper = mount(KpiCard, {
      props: {
        title: 'Total Sales',
        value: '$12,345',
      },
    })

    expect(wrapper.text()).toContain('Total Sales')
    expect(wrapper.text()).toContain('$12,345')
  })

  it('displays positive delta with green styling', () => {
    const wrapper = mount(KpiCard, {
      props: {
        title: 'Revenue',
        value: '$50,000',
        delta: 15.5,
      },
    })

    expect(wrapper.text()).toContain('15.5%')

    const deltaElement = wrapper.find('.text-green-600')
    expect(deltaElement.exists()).toBe(true)
  })

  it('displays negative delta with red styling', () => {
    const wrapper = mount(KpiCard, {
      props: {
        title: 'Expenses',
        value: '$25,000',
        delta: -8.2,
      },
    })

    expect(wrapper.text()).toContain('8.2%')

    const deltaElement = wrapper.find('.text-red-600')
    expect(deltaElement.exists()).toBe(true)
  })

  it('displays subtitle when provided', () => {
    const wrapper = mount(KpiCard, {
      props: {
        title: 'Active Users',
        value: '1,234',
        subtitle: 'vs last month',
      },
    })

    expect(wrapper.text()).toContain('vs last month')
  })

  it('renders custom icon slot', () => {
    const wrapper = mount(KpiCard, {
      props: {
        title: 'Orders',
        value: '456',
      },
      slots: {
        icon: '<div class="custom-icon">📦</div>',
      },
    })

    expect(wrapper.find('.custom-icon').exists()).toBe(true)
    expect(wrapper.text()).toContain('📦')
  })

  it('renders default icon when no slot provided', () => {
    const wrapper = mount(KpiCard, {
      props: {
        title: 'Default',
        value: '123',
      },
    })

    expect(wrapper.text()).toContain('☆')
  })

  it('handles numeric values correctly', () => {
    const wrapper = mount(KpiCard, {
      props: {
        title: 'Count',
        value: 42,
        delta: 0,
      },
    })

    expect(wrapper.text()).toContain('42')
    expect(wrapper.text()).toContain('0.0%')
  })

  it('applies dark mode classes correctly', () => {
    const wrapper = mount(KpiCard, {
      props: {
        title: 'Test',
        value: '100',
      },
    })

    expect(wrapper.find('.dark\\:bg-gray-800').exists()).toBe(true)
    expect(wrapper.find('.dark\\:text-gray-100').exists()).toBe(true)
  })
})
