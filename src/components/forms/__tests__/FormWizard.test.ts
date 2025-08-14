import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import * as yup from 'yup'
import FormWizard from '../FormWizard.vue'
import type { WizardStep } from '../FormWizard.vue'

// Mock components
const MockStepComponent1 = {
  template: `
    <div>
      <input
        v-model="localValues.name"
        @input="$emit('update:values', localValues)"
        placeholder="Name"
      />
    </div>
  `,
  props: ['values', 'errors', 'meta'],
  emits: ['update:values'],
  data() {
    return {
      localValues: { name: this.values?.name || '' }
    }
  },
  watch: {
    values: {
      handler(newValues) {
        this.localValues = { ...newValues }
      },
      deep: true
    }
  }
}

const MockStepComponent2 = {
  template: `
    <div>
      <input
        v-model="localValues.email"
        @input="$emit('update:values', localValues)"
        placeholder="Email"
      />
    </div>
  `,
  props: ['values', 'errors', 'meta'],
  emits: ['update:values'],
  data() {
    return {
      localValues: { email: this.values?.email || '' }
    }
  },
  watch: {
    values: {
      handler(newValues) {
        this.localValues = { ...newValues }
      },
      deep: true
    }
  }
}

const createMockSteps = (): WizardStep[] => [
  {
    id: 'step1',
    title: 'Personal Info',
    description: 'Enter your personal information',
    component: MockStepComponent1,
    schema: yup.object({
      name: yup.string().required('Name is required')
    })
  },
  {
    id: 'step2',
    title: 'Contact Info',
    description: 'Enter your contact information',
    component: MockStepComponent2,
    schema: yup.object({
      email: yup.string().email('Invalid email').required('Email is required')
    })
  }
]

describe('FormWizard', () => {
  let wrapper: any

  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    })

    // Mock timers
    vi.useFakeTimers()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.useRealTimers()
  })

  it('renders correctly with steps', () => {
    const steps = createMockSteps()
    wrapper = mount(FormWizard, {
      props: { steps }
    })

    expect(wrapper.find('h3').text()).toBe('Personal Info')
    expect(wrapper.findAll('.w-10.h-10')).toHaveLength(2) // Step circles
  })

  it('shows progress indicator correctly', () => {
    const steps = createMockSteps()
    wrapper = mount(FormWizard, {
      props: { steps }
    })

    // Should show 50% progress on first step (1 of 2)
    const progressBar = wrapper.find('.bg-blue-500.h-2')
    expect(progressBar.attributes('style')).toContain('width: 50%')
  })

  it('navigates between steps', async () => {
    const steps = createMockSteps()
    wrapper = mount(FormWizard, {
      props: {
        steps,
        validateOnStepChange: false // Disable validation for this test
      }
    })

    // Initially on first step
    expect(wrapper.find('h3').text()).toBe('Personal Info')

    // Click next button
    const buttons = wrapper.findAll('button')
    const nextButton = buttons.find(btn => btn.text().includes('Siguiente'))
    await nextButton?.trigger('click')
    await nextTick()

    // Should be on second step
    expect(wrapper.find('h3').text()).toBe('Contact Info')

    // Click previous button
    const prevButton = buttons.find(btn => btn.text().includes('Anterior'))
    await prevButton?.trigger('click')
    await nextTick()

    // Should be back on first step
    expect(wrapper.find('h3').text()).toBe('Personal Info')
  })

  it('emits stepChange event when navigating', async () => {
    const steps = createMockSteps()
    wrapper = mount(FormWizard, {
      props: {
        steps,
        validateOnStepChange: false
      }
    })

    const buttons = wrapper.findAll('button')
    const nextButton = buttons.find(btn => btn.text().includes('Siguiente'))
    await nextButton?.trigger('click')

    expect(wrapper.emitted('stepChange')).toBeTruthy()
    expect(wrapper.emitted('stepChange')[0]).toEqual([1, 'step2', 'next'])
  })

  it('validates steps before proceeding', async () => {
    const steps = createMockSteps()
    wrapper = mount(FormWizard, {
      props: { steps }
    })

    // Try to go to next step without filling required field
    const buttons = wrapper.findAll('button')
    const nextButton = buttons.find(btn => btn.text().includes('Siguiente'))
    expect(nextButton?.attributes('disabled')).toBeDefined()
  })

  it('saves and loads drafts', async () => {
    const steps = createMockSteps()
    const persistKey = 'test-wizard'

    wrapper = mount(FormWizard, {
      props: {
        steps,
        persistKey,
        showSaveDraft: true
      }
    })

    // Mock localStorage data
    const mockDraftData = {
      values: { step1: { name: 'John Doe' } },
      currentStep: 0,
      timestamp: Date.now()
    }

    window.localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(mockDraftData))

    // Trigger draft load
    wrapper.vm.loadDraft()
    await nextTick()

    expect(wrapper.vm.getAllValues()).toEqual(mockDraftData.values)
  })

  it('auto-saves drafts when enabled', async () => {
    const steps = createMockSteps()
    wrapper = mount(FormWizard, {
      props: {
        steps,
        autoSaveDraft: true,
        autoSaveInterval: 1000,
        persistKey: 'test-wizard'
      }
    })

    // Simulate form input
    wrapper.vm.updateStepValues({ name: 'John Doe' })

    // Fast-forward timers
    vi.advanceTimersByTime(3000) // Wait for debounced save + auto-save
    await nextTick()

    expect(wrapper.emitted('draftSave')).toBeTruthy()
  })

  it('handles custom step validation', async () => {
    const stepsWithCustomValidation: WizardStep[] = [
      {
        id: 'step1',
        title: 'Custom Validation',
        component: MockStepComponent1,
        schema: yup.object({}),
        validation: (values) => {
          if (!values?.name || values.name.length < 3) {
            return 'Name must be at least 3 characters'
          }
          return true
        }
      }
    ]

    wrapper = mount(FormWizard, {
      props: { steps: stepsWithCustomValidation }
    })

    // Should show validation error
    wrapper.vm.updateStepValues({ name: 'Jo' })
    await wrapper.vm.validateCurrentStep()
    await nextTick()

    expect(wrapper.find('.text-red-800').exists()).toBe(true)
    expect(wrapper.text()).toContain('Name must be at least 3 characters')
  })

  it('handles optional and skippable steps', async () => {
    const stepsWithOptional: WizardStep[] = [
      {
        id: 'step1',
        title: 'Required Step',
        component: MockStepComponent1,
        schema: yup.object({
          name: yup.string().required()
        })
      },
      {
        id: 'step2',
        title: 'Optional Step',
        component: MockStepComponent2,
        schema: yup.object({}),
        optional: true
      },
      {
        id: 'step3',
        title: 'Skippable Step',
        component: MockStepComponent1,
        schema: yup.object({}),
        canSkip: true
      }
    ]

    wrapper = mount(FormWizard, {
      props: { steps: stepsWithOptional }
    })

    // Fill required step
    wrapper.vm.updateStepValues({ name: 'John Doe' })
    // Manually set validation state for testing
    wrapper.vm.stepValidationState['step1'] = true
    await nextTick()

    // Should be able to proceed through optional steps
    expect(wrapper.vm.canProceedToNextStep).toBe(true)
  })

  it('completes wizard and emits submit event', async () => {
    const steps = createMockSteps()
    wrapper = mount(FormWizard, {
      props: {
        steps,
        validateOnStepChange: false
      }
    })

    // Fill all steps
    wrapper.vm.updateStepValues({ name: 'John Doe' })
    await wrapper.vm.nextStep()

    wrapper.vm.updateStepValues({ email: 'john@example.com' })
    await nextTick()

    // Complete wizard
    const buttons = wrapper.findAll('button')
    const completeButton = buttons.find(btn => btn.text().includes('Completar'))
    await completeButton?.trigger('click')

    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')[0][0]).toEqual({
      step1: { name: 'John Doe' },
      step2: { email: 'john@example.com' }
    })
  })

  it('shows debug info in development mode', async () => {
    const steps = createMockSteps()

    // Mock development environment
    vi.stubGlobal('import.meta', { env: { DEV: true } })

    wrapper = mount(FormWizard, {
      props: {
        steps,
        showDebugInfo: true
      }
    })

    expect(wrapper.find('pre').exists()).toBe(true)
    expect(wrapper.text()).toContain('Debug Info')
  })

  it('handles form cancellation', async () => {
    const steps = createMockSteps()
    wrapper = mount(FormWizard, {
      props: { steps }
    })

    // Simulate cancel from form
    wrapper.vm.handleStepCancel()

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('exposes correct methods and properties', () => {
    const steps = createMockSteps()
    wrapper = mount(FormWizard, {
      props: { steps }
    })

    // Check exposed methods
    expect(typeof wrapper.vm.nextStep).toBe('function')
    expect(typeof wrapper.vm.previousStep).toBe('function')
    expect(typeof wrapper.vm.goToStep).toBe('function')
    expect(typeof wrapper.vm.saveDraft).toBe('function')
    expect(typeof wrapper.vm.loadDraft).toBe('function')
    expect(typeof wrapper.vm.clearDraft).toBe('function')
    expect(typeof wrapper.vm.validateCurrentStep).toBe('function')
    expect(typeof wrapper.vm.getCurrentStepValues).toBe('function')
    expect(typeof wrapper.vm.getAllValues).toBe('function')
  })
})
