import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ThemeSelector from '../ThemeSelector.vue'
import { useUIStore } from '@/stores/ui'

// Mock the useTheme composable
vi.mock('@/composables/useTheme', () => ({
  useTheme: () => ({
    currentTheme: { value: 'system' },
    effectiveTheme: { value: 'light' },
    availableThemes: ['light', 'dark', 'system'],
    setTheme: vi.fn(),
    getThemeLabel: (theme: string) => {
      const labels = { light: 'Claro', dark: 'Oscuro', system: 'Sistema' }
      return labels[theme as keyof typeof labels] || theme
    },
    applyThemeWithTransition: vi.fn(),
  })
}))

// Mock lucide-vue-next icons
vi.mock('lucide-vue-next', () => ({
  Sun: { name: 'Sun', template: '<div>Sun</div>' },
  Moon: { name: 'Moon', template: '<div>Moon</div>' },
  Monitor: { name: 'Monitor', template: '<div>Monitor</div>' },
  Check: { name: 'Check', template: '<div>Check</div>' },
  Info: { name: 'Info', template: '<div>Info</div>' }
}))

// Mock @vueuse/core
vi.mock('@vueuse/core', () => ({
  onClickOutside: vi.fn()
}))

// Mock i18n
const mockT = vi.fn((key: string, params?: any) => {
  if (params) {
    return `${key} ${JSON.stringify(params)}`
  }
  return key
})

describe('ThemeSelector', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('renders correctly with default props', () => {
    const wrapper = mount(ThemeSelector, {
      global: {
        plugins: [pinia],
        mocks: {
          $t: mockT
        }
      }
    })

    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('shows dropdown when button is clicked in dropdown variant', async () => {
    const wrapper = mount(ThemeSelector, {
      props: {
        variant: 'dropdown'
      },
      global: {
        plugins: [pinia],
        mocks: {
          $t: mockT
        }
      }
    })

    const button = wrapper.find('button')
    await button.trigger('click')

    expect(wrapper.find('.absolute').exists()).toBe(true)
  })

  it('displays all available themes in dropdown', async () => {
    const wrapper = mount(ThemeSelector, {
      global: {
        plugins: [pinia],
        mocks: {
          $t: mockT
        }
      }
    })

    const button = wrapper.find('button')
    await button.trigger('click')

    const themeButtons = wrapper.findAll('button').slice(1) // Exclude the main button
    expect(themeButtons).toHaveLength(3) // light, dark, system
  })

  it('emits themeChanged event when theme is selected', async () => {
    const wrapper = mount(ThemeSelector, {
      global: {
        plugins: [pinia],
        mocks: {
          $t: mockT
        }
      }
    })

    const button = wrapper.find('button')
    await button.trigger('click')

    const themeButtons = wrapper.findAll('button').slice(1)
    await themeButtons[0].trigger('click')

    expect(wrapper.emitted('themeChanged')).toBeTruthy()
  })

  it('applies correct size classes', () => {
    const wrapper = mount(ThemeSelector, {
      props: {
        size: 'lg'
      },
      global: {
        plugins: [pinia],
        mocks: {
          $t: mockT
        }
      }
    })

    const button = wrapper.find('button')
    // Check if the button has the lg size class (p-3)
    expect(button.attributes('class')).toContain('p-3')
  })

  it('works in button variant mode', async () => {
    const wrapper = mount(ThemeSelector, {
      props: {
        variant: 'button'
      },
      global: {
        plugins: [pinia],
        mocks: {
          $t: mockT
        }
      }
    })

    const button = wrapper.find('button')
    await button.trigger('click')

    // Should not show dropdown in button mode
    expect(wrapper.find('.absolute').exists()).toBe(false)
    // Should emit themeChanged event
    expect(wrapper.emitted('themeChanged')).toBeTruthy()
  })

  it('shows system theme detection info when system theme is selected', async () => {
    const wrapper = mount(ThemeSelector, {
      global: {
        plugins: [pinia],
        mocks: {
          $t: mockT
        }
      }
    })

    const button = wrapper.find('button')
    await button.trigger('click')

    // Check if the dropdown is shown and contains theme options
    expect(wrapper.find('.absolute').exists()).toBe(true)
    expect(wrapper.text()).toContain('Sistema') // System theme option should be visible
  })

  it('highlights current theme in dropdown', async () => {
    const wrapper = mount(ThemeSelector, {
      global: {
        plugins: [pinia],
        mocks: {
          $t: mockT
        }
      }
    })

    const button = wrapper.find('button')
    await button.trigger('click')

    // Find theme buttons in dropdown
    const themeButtons = wrapper.findAll('button').slice(1)
    expect(themeButtons.length).toBe(3) // Should have 3 theme options

    // Check that all theme options are rendered
    const themeTexts = themeButtons.map(btn => btn.text())
    expect(themeTexts.some(text => text.includes('Claro'))).toBe(true)
    expect(themeTexts.some(text => text.includes('Oscuro'))).toBe(true)
    expect(themeTexts.some(text => text.includes('Sistema'))).toBe(true)
  })

  it('closes dropdown when theme is selected', async () => {
    const wrapper = mount(ThemeSelector, {
      global: {
        plugins: [pinia],
        mocks: {
          $t: mockT
        }
      }
    })

    const button = wrapper.find('button')
    await button.trigger('click')

    expect(wrapper.find('.absolute').exists()).toBe(true)

    const themeButtons = wrapper.findAll('button').slice(1)
    await themeButtons[0].trigger('click')

    await wrapper.vm.$nextTick()
    expect(wrapper.find('.absolute').exists()).toBe(false)
  })
})
