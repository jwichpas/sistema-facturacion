import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import * as yup from 'yup'
import BaseForm from '../BaseForm.vue'

describe('BaseForm', () => {
  const mockSchema = yup.object({
    name: yup.string().required('Name is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
  })

  const mockInitialValues = {
    name: '',
    email: '',
  }

  it('renders correctly with default props', () => {
    const wrapper = mount(BaseForm, {
      props: {
        schema: mockSchema,
        initialValues: mockInitialValues,
      },
      slots: {
        default: '<div>Form content</div>',
      },
    })

    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.text()).toContain('Form content')
  })

  it('shows action buttons by default', () => {
    const wrapper = mount(BaseForm, {
      props: {
        schema: mockSchema,
        initialValues: mockInitialValues,
      },
      slots: {
        default: '<div>Form content</div>',
      },
    })

    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    expect(wrapper.find('button[type="button"]').exists()).toBe(true)
  })

  it('hides action buttons when showActions is false', () => {
    const wrapper = mount(BaseForm, {
      props: {
        schema: mockSchema,
        initialValues: mockInitialValues,
        showActions: false,
      },
      slots: {
        default: '<div>Form content</div>',
      },
    })

    expect(wrapper.find('button[type="submit"]').exists()).toBe(false)
    expect(wrapper.find('button[type="button"]').exists()).toBe(false)
  })

  it('emits submit event when form is submitted', async () => {
    const wrapper = mount(BaseForm, {
      props: {
        schema: mockSchema,
        initialValues: { name: 'John', email: 'john@example.com' },
      },
      slots: {
        default: '<div>Form content</div>',
      },
    })

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeTruthy()
  })

  it('emits cancel event when cancel button is clicked', async () => {
    const wrapper = mount(BaseForm, {
      props: {
        schema: mockSchema,
        initialValues: mockInitialValues,
      },
      slots: {
        default: '<div>Form content</div>',
      },
    })

    await wrapper.find('button[type="button"]').trigger('click')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('applies custom CSS class', () => {
    const wrapper = mount(BaseForm, {
      props: {
        schema: mockSchema,
        initialValues: mockInitialValues,
        class: 'custom-form-class',
      },
      slots: {
        default: '<div>Form content</div>',
      },
    })

    expect(wrapper.find('form').classes()).toContain('custom-form-class')
  })

  it('displays custom button text', () => {
    const wrapper = mount(BaseForm, {
      props: {
        schema: mockSchema,
        initialValues: mockInitialValues,
        submitText: 'Save Changes',
        cancelText: 'Discard',
      },
      slots: {
        default: '<div>Form content</div>',
      },
    })

    expect(wrapper.find('button[type="submit"]').text()).toBe('Save Changes')
    expect(wrapper.find('button[type="button"]').text()).toBe('Discard')
  })
})
