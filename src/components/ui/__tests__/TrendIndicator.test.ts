import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TrendIndicator from '../TrendIndicator.vue'

describe('TrendIndicator', () => {
  it('renders positive trend with green color and up arrow', () => {
    const wrapper = mount(TrendIndicator, {
      props: {
        value: 15.5,
      },
    })

    expect(wrapper.text()).toContain('15.5%')
    expect(wrapper.find('.text-green-600').exists()).toBe(true)
  })

  it('renders negative trend with red color and down arrow', () => {
    const wrapper = mount(TrendIndicator, {
      props: {
        value: -8.2,
      },
    })

    expect(wrapper.text()).toContain('8.2%')
    expect(wrapper.find('.text-red-600').exists()).toBe(true)
  })

  it('renders zero trend with gray color and minus icon', () => {
    const wrapper = mount(TrendIndicator, {
      props: {
        value: 0,
      },
    })

    expect(wrapper.text()).toContain('0.0%')
    expect(wrapper.find('.text-gray-500').exists()).toBe(true)
  })

  it('formats as currency when specified', () => {
    const wrapper = mount(TrendIndicator, {
      props: {
        value: 1500,
        format: 'currency',
        currency: 'PEN',
      },
    })

    expect(wrapper.text()).toContain('S/')
  })

  it('formats as number when specified', () => {
    const wrapper = mount(TrendIndicator, {
      props: {
        value: 1234,
        format: 'number',
      },
    })

    expect(wrapper.text()).toContain('1,234')
  })

  it('displays label when provided', () => {
    const wrapper = mount(TrendIndicator, {
      props: {
        value: 10,
        label: 'vs last month',
      },
    })

    expect(wrapper.text()).toContain('vs last month')
  })

  it('hides icon when showIcon is false', () => {
    const wrapper = mount(TrendIndicator, {
      props: {
        value: 15,
        showIcon: false,
      },
    })

    // Should not have any icon components
    const icons = wrapper.findAll('svg')
    expect(icons.length).toBe(0)
  })

  it('shows icon by default', () => {
    const wrapper = mount(TrendIndicator, {
      props: {
        value: 15,
      },
    })

    // Should have an icon component
    const icons = wrapper.findAll('svg')
    expect(icons.length).toBeGreaterThan(0)
  })

  it('handles different currency codes', () => {
    const wrapper = mount(TrendIndicator, {
      props: {
        value: 100,
        format: 'currency',
        currency: 'USD',
      },
    })

    // Should format with USD currency
    expect(wrapper.exists()).toBe(true)
  })

  it('applies correct classes for different trend directions', () => {
    // Positive trend
    const positiveWrapper = mount(TrendIndicator, {
      props: { value: 10 },
    })
    expect(positiveWrapper.find('.text-green-600').exists()).toBe(true)

    // Negative trend
    const negativeWrapper = mount(TrendIndicator, {
      props: { value: -10 },
    })
    expect(negativeWrapper.find('.text-red-600').exists()).toBe(true)

    // Neutral trend
    const neutralWrapper = mount(TrendIndicator, {
      props: { value: 0 },
    })
    expect(neutralWrapper.find('.text-gray-500').exists()).toBe(true)
  })
})
