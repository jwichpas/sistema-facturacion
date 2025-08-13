import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CompanySelector from '../CompanySelector.vue'
import { useCompanyStore } from '@/stores/company'
import type { Company } from '@/types'

// Mock the company store
vi.mock('@/stores/company')

// Mock the utils
vi.mock('@/utils/company', () => ({
  formatRUC: (ruc: string) => `${ruc.slice(0, 2)}-${ruc.slice(2, 10)}-${ruc.slice(10)}`,
  getCurrencySymbol: (currency: string) => currency === 'PEN' ? 'S/' : '$'
}))

// Mock lucide-vue-next icons
vi.mock('lucide-vue-next', () => ({
  Building2: { name: 'Building2', template: '<div>Building2</div>' },
  ChevronDown: { name: 'ChevronDown', template: '<div>ChevronDown</div>' },
  Check: { name: 'Check', template: '<div>Check</div>' },
  Loader2: { name: 'Loader2', template: '<div>Loader2</div>' },
  RotateCw: { name: 'RotateCw', template: '<div>RotateCw</div>' },
  AlertCircle: { name: 'AlertCircle', template: '<div>AlertCircle</div>' },
  Mail: { name: 'Mail', template: '<div>Mail</div>' },
  Phone: { name: 'Phone', template: '<div>Phone</div>' },
  MapPin: { name: 'MapPin', template: '<div>MapPin</div>' }
}))

// Mock @vueuse/core
vi.mock('@vueuse/core', () => ({
  onClickOutside: vi.fn()
}))

// Mock i18n
const mockT = vi.fn((key: string) => key)
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: mockT
  })
}))

describe('CompanySelector', () => {
  let pinia: ReturnType<typeof createPinia>
  let mockCompanyStore: any

  const mockCompany1: Company = {
    id: '1',
    ruc: '20123456789',
    legal_name: 'Test Company 1',
    trade_name: 'Test Co 1',
    currency_code: 'PEN',
    valuation_method: 'PROMEDIO_MOVIL',
    production: false,
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  }

  const mockCompany2: Company = {
    id: '2',
    ruc: '20987654321',
    legal_name: 'Test Company 2',
    trade_name: 'Test Co 2',
    currency_code: 'USD',
    valuation_method: 'FIFO',
    production: false,
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  }

  const mockCompanyAccess = [
    {
      company: mockCompany1,
      role: 'Admin',
      permissions: ['*'],
      isActive: true
    },
    {
      company: mockCompany2,
      role: 'Manager',
      permissions: ['products.view', 'sales.view'],
      isActive: true
    }
  ]

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)

    mockCompanyStore = {
      currentCompany: mockCompany1,
      availableCompanies: mockCompanyAccess,
      loading: false,
      switchingCompany: false,
      error: null,
      hasCompanies: true,
      canSwitchCompany: true,
      setCurrentCompany: vi.fn(),
      loadUserCompanies: vi.fn(),
      clearError: vi.fn()
    }

    vi.mocked(useCompanyStore).mockReturnValue(mockCompanyStore)
  })

  it('renders correctly with current company', () => {
    const wrapper = mount(CompanySelector, {
      global: {
        plugins: [pinia],
        mocks: {
          $t: mockT
        }
      }
    })

    expect(wrapper.find('button').text()).toContain('Test Co 1')
  })

  it('shows dropdown when button is clicked', async () => {
    const wrapper = mount(CompanySelector, {
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

  it('displays available companies in dropdown', async () => {
    const wrapper = mount(CompanySelector, {
      global: {
        plugins: [pinia],
        mocks: {
          $t: mockT
        }
      }
    })

    const button = wrapper.find('button')
    await button.trigger('click')

    const companyItems = wrapper.findAll('[data-testid="company-item"]')
    expect(companyItems).toHaveLength(2)
  })

  it('calls setCurrentCompany when a different company is selected', async () => {
    const wrapper = mount(CompanySelector, {
      global: {
        plugins: [pinia],
        mocks: {
          $t: mockT
        }
      }
    })

    const button = wrapper.find('button')
    await button.trigger('click')

    // Find and click the second company
    const companyItems = wrapper.findAll('[data-testid="company-item"]')
    await companyItems[1].trigger('click')

    expect(mockCompanyStore.setCurrentCompany).toHaveBeenCalledWith(mockCompany2)
  })

  it('emits companyChanged event when company is switched', async () => {
    const wrapper = mount(CompanySelector, {
      global: {
        plugins: [pinia],
        mocks: {
          $t: mockT
        }
      }
    })

    const button = wrapper.find('button')
    await button.trigger('click')

    const companyItems = wrapper.findAll('[data-testid="company-item"]')
    await companyItems[1].trigger('click')

    expect(wrapper.emitted('companyChanged')).toBeTruthy()
    expect(wrapper.emitted('companyChanged')?.[0]).toEqual([mockCompany2])
  })

  it('shows loading state', () => {
    mockCompanyStore.loading = true

    const wrapper = mount(CompanySelector, {
      global: {
        plugins: [pinia],
        mocks: {
          $t: mockT
        }
      }
    })

    const button = wrapper.find('button')
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('shows error state', async () => {
    mockCompanyStore.error = 'Test error message'

    const wrapper = mount(CompanySelector, {
      global: {
        plugins: [pinia],
        mocks: {
          $t: mockT
        }
      }
    })

    const button = wrapper.find('button')
    await button.trigger('click')

    expect(wrapper.text()).toContain('Test error message')
  })

  it('shows empty state when no companies available', async () => {
    mockCompanyStore.availableCompanies = []
    mockCompanyStore.hasCompanies = false

    const wrapper = mount(CompanySelector, {
      global: {
        plugins: [pinia],
        mocks: {
          $t: mockT
        }
      }
    })

    const button = wrapper.find('button')
    await button.trigger('click')

    expect(wrapper.text()).toContain('company.noCompanies')
  })
})
