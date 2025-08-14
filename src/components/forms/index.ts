// Form Components
export { default as BaseForm } from './BaseForm.vue'
export { default as FormInput } from './FormInput.vue'
export { default as FormTextarea } from './FormTextarea.vue'
export { default as FormSelect } from './FormSelect.vue'
export { default as FormCheckbox } from './FormCheckbox.vue'
export { default as FormDatePicker } from './FormDatePicker.vue'
export { default as FormFileUpload } from './FormFileUpload.vue'
export { default as FormWizard } from './FormWizard.vue'
export { default as FormWizardExample } from './FormWizardExample.vue'

// Form Types
export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

export interface FormFieldProps {
  name: string
  label?: string
  placeholder?: string
  hint?: string
  disabled?: boolean
  required?: boolean
}

export interface WizardStep {
  id: string
  title: string
  description?: string
  component: any
  schema: import('yup').ObjectSchema<any>
  props?: Record<string, any>
  validation?: (values: any) => boolean | string | string[]
  canSkip?: boolean
  optional?: boolean
}
