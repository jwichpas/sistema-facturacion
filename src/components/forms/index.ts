// Form Components
export { default as BaseForm } from './BaseForm.vue'
export { default as FormInput } from './FormInput.vue'
export { default as FormSelect } from './FormSelect.vue'
export { default as FormTextarea } from './FormTextarea.vue'
export { default as FormDatePicker } from './FormDatePicker.vue'
export { default as FormCheckbox } from './FormCheckbox.vue'
export { default as FormWizard } from './FormWizard.vue'
export { default as DynamicForm } from './DynamicForm.vue'

// Form Types
export interface FormFieldOption {
  value: string | number
  label: string
}

export interface BaseFormProps {
  schema: any
  initialValues?: Record<string, any>
  submitText?: string
  cancelText?: string
  showActions?: boolean
  showCancel?: boolean
  class?: string
}

export interface WizardStep {
  id: string
  title: string
  description?: string
  component: any
  schema: any
  props?: Record<string, any>
  validation?: (values: any) => boolean | string
}

export interface DynamicField {
  name: string
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'select' | 'textarea' | 'date' | 'checkbox' | 'file' | 'radio'
  label: string
  description?: string
  placeholder?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  autocomplete?: string
  inputType?: string
  options?: Array<{ value: string | number; label: string }>
  min?: number
  max?: number
  step?: number
  rows?: number
  accept?: string
  multiple?: boolean
  minDate?: Date | string
  maxDate?: Date | string
  format?: string
  validation?: any
  class?: string
  conditional?: {
    field: string
    value: any
    operator?: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in' | 'contains' | 'starts_with' | 'ends_with'
    fields: DynamicField[]
  }
  dependencies?: string[]
}
