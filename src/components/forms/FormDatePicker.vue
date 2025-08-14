<template>
  <div class="space-y-1">
    <label
      v-if="label"
      :for="inputId"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>

    <div class="relative">
      <input
        :id="inputId"
        :name="name"
        type="date"
        :value="formattedValue"
        :min="min"
        :max="max"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :class="inputClasses"
        @input="handleChange"
        @blur="handleBlur"
        @focus="handleFocus"
      />

      <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    </div>

    <p v-if="errorMessage" class="text-sm text-red-600 dark:text-red-400">
      {{ errorMessage }}
    </p>

    <p v-else-if="hint" class="text-sm text-gray-500 dark:text-gray-400">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { useField } from 'vee-validate'
import { format, parseISO } from 'date-fns'

interface Props {
  name: string
  label?: string
  hint?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  min?: string
  max?: string
  modelValue?: string | Date
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  readonly: false,
  required: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | Date]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const inputId = useId()

// Use VeeValidate field
const {
  value,
  errorMessage,
  handleBlur,
  handleChange: veeHandleChange,
} = useField(props.name, undefined, {
  initialValue: props.modelValue,
})

const formattedValue = computed(() => {
  if (!value.value) return ''

  try {
    if (value.value instanceof Date) {
      return format(value.value, 'yyyy-MM-dd')
    }

    if (typeof value.value === 'string') {
      // If it's already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(value.value)) {
        return value.value
      }
      // Try to parse and format
      return format(parseISO(value.value), 'yyyy-MM-dd')
    }
  } catch (error) {
    console.warn('Invalid date format:', value.value)
  }

  return ''
})

const inputClasses = computed(() => {
  const baseClasses = [
    'block',
    'w-full',
    'px-3',
    'py-2',
    'pr-10',
    'border',
    'rounded-lg',
    'text-sm',
    'transition-colors',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-1',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'bg-white',
    'dark:bg-gray-800',
  ]

  const stateClasses = errorMessage.value
    ? [
        'border-red-300',
        'text-red-900',
        'focus:border-red-500',
        'focus:ring-red-500',
        'dark:border-red-600',
        'dark:text-red-100',
      ]
    : [
        'border-gray-300',
        'text-gray-900',
        'focus:border-blue-500',
        'focus:ring-blue-500',
        'dark:border-gray-600',
        'dark:text-gray-100',
      ]

  return [...baseClasses, ...stateClasses].join(' ')
})

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const newValue = target.value

  if (newValue) {
    try {
      const dateValue = parseISO(newValue)
      veeHandleChange(dateValue)
      emit('update:modelValue', dateValue)
    } catch (error) {
      veeHandleChange(newValue)
      emit('update:modelValue', newValue)
    }
  } else {
    veeHandleChange('')
    emit('update:modelValue', '')
  }
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}
</script>
