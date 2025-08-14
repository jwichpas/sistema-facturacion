import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import FormInput from '../FormInput.vue'

// Mock VeeValidate
vi.mock('vee-validate', () => ({
  useField: () => ({
    value: ref(''),
    errorMessage: ref(''),
    handleBlur: vi.fn(),
    handleChange: vi.fn(),
  }),
}))

describe('FormInput', () => {
  it('renders correctly with required props', () => {
    const wrapper = mount(FormInput, {
      props: {
        name: 'test-input',
        label: 'Test Label',
      },
    })

    expect(wrapper.find('input').exists()).toBe(true)
    expect(wrapper.find('label').text()).toContain('Test Label')
  })

  it('shows required asterisk when required prop is true', () => {
    const wrapper = mount(FormInput, {
      props: {
        name: 'test-input',
        label: 'Test Label',
        required: true,
      },
    })

    expect(wrapper.find('label').text()).toContain('*')
  })

  it('applies correct input type', () => {
    const wrapper = mount(FormInput, {
      props: {
        name: 'test-input',
        type: 'email',
      },
    })

    expect(wrapper.find('input').attributes('type')).toBe('email')
  })

  it('shows placeholder text', () => {
    const wrapper = mount(FormInput, {
      props: {
        name: 'test-input',
        placeholder: 'Enter your text',
      },
    })

    expect(wrapper.find('input').attributes('placeholder')).toBe('Enter your text')
  })

  it('shows hint text when provided', () => {
    const wrapper = mount(FormInput, {
      props: {
        name: 'test-input',
        hint: 'This is a helpful hint',
      },
    })

    expect(wrapper.text()).toContain('This is a helpful hint')
  })

  it('disables input when disabled prop is true', () => {
    const wrapper = mount(FormInput, {
      props: {
        name: 'test-input',
        disabled: true,
      },
    })

    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
  })

  it('makes input readonly when readonly prop is true', () => {
    const wrapper = mount(FormInput, {
      props: {
        name: 'test-input',
        readonly: true,
      },
    })

    expect(wrapper.find('input').attributes('readonly')).toBeDefined()
  })

  it('emits update:modelValue when input changes', async () => {
    const wrapper = mount(FormInput, {
      props: {
        name: 'test-input',
      },
    })

    await wrapper.find('input').setValue('new value')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('emits focus event when input is focused', async () => {
    const wrapper = mount(FormInput, {
      props: {
        name: 'test-input',
      },
    })

    await wrapper.find('input').trigger('focus')

    expect(wrapper.emitted('focus')).toBeTruthy()
  })

  it('emits blur event when input loses focus', async () => {
    const wrapper = mount(FormInput, {
      props: {
        name: 'test-input',
      },
    })

    await wrapper.find('input').trigger('blur')

    expect(wrapper.emitted('blur')).toBeTruthy()
  })
})
