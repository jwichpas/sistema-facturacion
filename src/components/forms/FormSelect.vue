<template>
  <div class="space-y-1">
    <label
      v-if="label"
      :for="selectId"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>

    <div class="relative">
      <select
        :id="selectId"
        :name="name"
        :value="value"
        :disabled="disabled"
        :required="required"
        :class="selectClasses"
        @change="handleChange"
        @blur="handleBlur"
        @focus="handleFocus"
      >
        <option v-if="placeholder" value="" disabled>
          {{ placeholder }}
        </option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          :disabled="option.disabled"
        >
          {{ option.label }}
        </option>
      </select>

      <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
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

interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

interface Props {
  name: string
  label?: string
  placeholder?: string
  hint?: string
  disabled?: boolean
  required?: boolean
  options: SelectOption[]
  modelValue?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  required: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const selectId = useId()

// Use VeeValidate field
const {
  value,
  errorMessage,
  handleBlur,
  handleChange: veeHandleChange,
} = useField(props.name, undefined, {
  initialValue: props.modelValue,
})

const selectClasses = computed(() => {
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
    'appearance-none',
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
  const target = event.target as HTMLSelectElement
  const newValue = target.value

  veeHandleChange(newValue)
  emit('update:modelValue', newValue)
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}
</script>
