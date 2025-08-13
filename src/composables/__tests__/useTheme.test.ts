import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTheme } from '../useTheme'
import { useUIStore } from '@/stores/ui'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock matchMedia
const matchMediaMock = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: matchMediaMock,
})

// Mock document.documentElement
const mockDocumentElement = {
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn(),
  },
  style: {
    setProperty: vi.fn(),
    removeProperty: vi.fn(),
    colorScheme: '',
  },
}

Object.defineProperty(document, 'documentElement', {
  value: mockDocumentElement,
  writable: true,
})

describe('useTheme', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with system theme by default', () => {
    const { currentTheme, effectiveTheme } = useTheme()

    expect(currentTheme.value).toBe('system')
    expect(effectiveTheme.value).toBe('light') // matchMedia returns false by default
  })

  it('should detect dark mode when system preference is dark', () => {
    matchMediaMock.mockReturnValue({
      matches: true,
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const { isDark, effectiveTheme } = useTheme()

    expect(isDark.value).toBe(true)
    expect(effectiveTheme.value).toBe('dark')
  })

  it('should set theme correctly', () => {
    const { setTheme, currentTheme } = useTheme()

    setTheme('dark')
    expect(currentTheme.value).toBe('dark')

    setTheme('light')
    expect(currentTheme.value).toBe('light')
  })

  it('should toggle theme between light and dark', () => {
    const { toggleTheme, currentTheme, setTheme } = useTheme()

    setTheme('light')
    toggleTheme()
    expect(currentTheme.value).toBe('dark')

    toggleTheme()
    expect(currentTheme.value).toBe('light')
  })

  it('should provide correct theme labels', () => {
    const { getThemeLabel } = useTheme()

    expect(getThemeLabel('light')).toBe('Claro')
    expect(getThemeLabel('dark')).toBe('Oscuro')
    expect(getThemeLabel('system')).toBe('Sistema')
  })

  it('should provide correct theme icons', () => {
    const { getThemeIcon } = useTheme()

    expect(getThemeIcon('light')).toBe('Sun')
    expect(getThemeIcon('dark')).toBe('Moon')
    expect(getThemeIcon('system')).toBe('Monitor')
  })

  it('should validate themes correctly', () => {
    const { isValidTheme } = useTheme()

    expect(isValidTheme('light')).toBe(true)
    expect(isValidTheme('dark')).toBe(true)
    expect(isValidTheme('system')).toBe(true)
    expect(isValidTheme('invalid')).toBe(false)
  })

  it('should save and load theme preferences', () => {
    const { saveThemePreference, loadThemePreference } = useTheme()

    localStorageMock.getItem.mockReturnValue('dark')
    expect(loadThemePreference()).toBe('dark')

    saveThemePreference('light')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light')
  })

  it('should return system theme when invalid theme is stored', () => {
    const { loadThemePreference } = useTheme()

    localStorageMock.getItem.mockReturnValue('invalid')
    expect(loadThemePreference()).toBe('system')
  })

  it('should provide CSS custom property utilities', () => {
    const { setCSSCustomProperty, getCSSCustomProperty } = useTheme()

    // Mock getComputedStyle
    const mockGetComputedStyle = vi.fn().mockReturnValue({
      getPropertyValue: vi.fn().mockReturnValue('#ffffff')
    })
    Object.defineProperty(window, 'getComputedStyle', {
      value: mockGetComputedStyle
    })

    setCSSCustomProperty('--test-color', '#000000')
    expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith('--test-color', '#000000')

    const value = getCSSCustomProperty('--test-color')
    expect(value).toBe('#ffffff')
  })

  it('should provide color scheme utilities', () => {
    const { getColorScheme, setTheme } = useTheme()

    setTheme('light')
    expect(getColorScheme()).toBe('light')

    setTheme('dark')
    expect(getColorScheme()).toBe('dark')
  })

  it('should include all available themes', () => {
    const { availableThemes } = useTheme()

    expect(availableThemes).toEqual(['light', 'dark', 'system'])
  })

  it('should provide theme-specific methods', () => {
    const { setLightTheme, setDarkTheme, setSystemTheme, currentTheme } = useTheme()

    setLightTheme()
    expect(currentTheme.value).toBe('light')

    setDarkTheme()
    expect(currentTheme.value).toBe('dark')

    setSystemTheme()
    expect(currentTheme.value).toBe('system')
  })
})
