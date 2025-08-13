<template>
  <BaseForm
    :schema="generatedSchema"
    :initial-values="initialValues"
    :submit-text="submitText"
    :cancel-text="cancelText"
    :show-actions="showActions"
    :show-cancel="showCancel"
    :class="formClass"
    @submit="handleSubmit"
    @cancel="handleCancel"
  >
    <template #default="{ errors, values, isSubmitting }">
      <div class="space-y-6">
        <div
          v-for="field in visibleFields"
          :key="field.name"
          class="space-y-2"
        >
          <!-- Field Label -->
          <div class="space-y-1">
            <label
              :for="field.name"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {{ field.label }}
              <span v-if="field.required" class="text-red-500 ml-1">*</span>
            </label>
            <p
              v-if="field.description"
              class="text-xs text-gray-500 dark:text-gray-400 mt-1"
            >
              {{ field.description }}
            </p>
          </div>

          <!-- Dynamic Field Component -->
          <component
            :is="getFieldComponent(field.type)"
            :name="field.name"
            :type="field.inputType"
            :label="''"
            :placeholder="field.placeholder"
            :hint="field.hint"
            :disabled="field.disabled || isSubmitting"
            :readonly="field.readonly"
            :required="field.required"
            :autocomplete="field.autocomplete"
            :options="field.options"
            :min="field.min"
            :max="field.max"
            :step="field.step"
            :rows="field.rows"
            :accept="field.accept"
            :multiple="field.multiple"
            :min-date="field.minDate"
            :max-date="field.maxDate"
            :format="field.format"
            :validation="field.validation"
            :class="field.class"
          />

          <!-- Field-specific error display -->
          <p
            v-if="errors[field.name]"
            class="text-sm text-red-600 dark:text-red-400 mt-1"
          >
            {{ errors[field.name] }}
          </p>

          <!-- Conditional fields -->
          <div
            v-if="field.conditional && shouldShowConditional(field, values)"
            class="mt-4 ml-6 pl-4 border-l-2 border-gray-200 dark:border-gray-700"
          >
            <DynamicForm
              :fields="field.conditional.fields"
              :initial-values="getConditionalValues(field, values)"
              :submit-text="''"
              :show-actions="false"
              @submit="handleConditionalSubmit"
            />
          </div>
        </div>
      </div>
    </template>
  </BaseForm>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { object, string, number, boolean, date, mixed } from 'yup'
import BaseForm from './BaseForm.vue'
import FormInput from './FormInput.vue'
import FormSelect from './FormSelect.vue'
import FormTextarea from './FormTextarea.vue'
import FormDatePicker from './FormDatePicker.vue'
import FormCheckbox from './FormCheckbox.vue'

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

interface Props {
  fields: DynamicField[]
  initialValues?: Record<string, any>
  submitText?: string
  cancelText?: string
  showActions?: boolean
  showCancel?: boolean
  formClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  submitText: 'Guardar',
  cancelText: 'Cancelar',
  showActions: true,
  showCancel: true,
})

const emit = defineEmits<{
  submit: [values: any]
  cancel: []
}>()

// Field component mapping
const fieldComponents = {
  text: FormInput,
  email: FormInput,
  password: FormInput,
  number: FormInput,
  tel: FormInput,
  url: FormInput,
  search: FormInput,
  select: FormSelect,
  textarea: FormTextarea,
  date: FormDatePicker,
  checkbox: FormCheckbox,
  file: FormInput,
  radio: FormSelect,
}

// Computed
const visibleFields = computed(() => {
  return props.fields.filter(field => {
    // Check dependencies
    if (field.dependencies) {
      return field.dependencies.every(dep => {
        const value = props.initialValues?.[dep]
        return value !== undefined && value !== null && value !== ''
      })
    }
    return true
  })
})

const generatedSchema = computed(() => {
  const schemaFields: Record<string, any> = {}

  visibleFields.value.forEach(field => {
    let fieldSchema: any

    // Base schema based on field type
    switch (field.type) {
      case 'email':
        fieldSchema = string().email('Email inválido')
        break
      case 'number':
        fieldSchema = number().typeError('Debe ser un número')
        if (field.min !== undefined) fieldSchema = fieldSchema.min(field.min, `Mínimo ${field.min}`)
        if (field.max !== undefined) fieldSchema = fieldSchema.max(field.max, `Máximo ${field.max}`)
        break
      case 'date':
        fieldSchema = date().typeError('Fecha inválida')
        break
      case 'checkbox':
        fieldSchema = boolean()
        break
      case 'select':
        fieldSchema = mixed().oneOf(
          field.options?.map(opt => opt.value) || [],
          'Seleccione una opción válida'
        )
        break
      case 'file':
        fieldSchema = mixed()
        break
      default:
        fieldSchema = string()
    }

    // Add required validation
    if (field.required) {
      fieldSchema = fieldSchema.required(`${field.label} es requerido`)
    }

    // Add custom validation
    if (field.validation) {
      fieldSchema = fieldSchema.test('custom', field.validation.message || 'Validación fallida', field.validation.test)
    }

    schemaFields[field.name] = fieldSchema
  })

  return object(schemaFields)
})

// Methods
const getFieldComponent = (type: string) => {
  return fieldComponents[type as keyof typeof fieldComponents] || FormInput
}

const shouldShowConditional = (field: DynamicField, values: any): boolean => {
  if (!field.conditional) return false

  const { field: conditionField, value: conditionValue, operator = 'eq' } = field.conditional
  const actualValue = values[conditionField]

  switch (operator) {
    case 'eq':
      return actualValue === conditionValue
    case 'ne':
      return actualValue !== conditionValue
    case 'gt':
      return actualValue > conditionValue
    case 'lt':
      return actualValue < conditionValue
    case 'gte':
      return actualValue >= conditionValue
    case 'lte':
      return actualValue <= conditionValue
    case 'in':
      return Array.isArray(conditionValue) && conditionValue.includes(actualValue)
    case 'not_in':
      return Array.isArray(conditionValue) && !conditionValue.includes(actualValue)
    case 'contains':
      return String(actualValue).includes(String(conditionValue))
    case 'starts_with':
      return String(actualValue).startsWith(String(conditionValue))
    case 'ends_with':
      return String(actualValue).endsWith(String(conditionValue))
    default:
      return actualValue === conditionValue
  }
}

const getConditionalValues = (field: DynamicField, values: any): Record<string, any> => {
  if (!field.conditional) return {}

  const conditionalValues: Record<string, any> = {}
  field.conditional.fields.forEach(conditionalField => {
    conditionalValues[conditionalField.name] = values[conditionalField.name]
  })

  return conditionalValues
}

const handleSubmit = (values: any) => {
  emit('submit', values)
}

const handleCancel = () => {
  emit('cancel')
}

const handleConditionalSubmit = (values: any) => {
  // Handle conditional form submission if needed
  console.log('Conditional form submitted:', values)
}
</script>

