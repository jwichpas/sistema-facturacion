<template>
  <div class="space-y-1">
    <label
      v-if="label"
      :for="textareaId"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>

    <textarea
      :id="textareaId"
      :name="name"
      :value="value"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :rows="rows"
      :class="textareaClasses"
      @input="handleChange"
      @blur="handleBlur"
      @focus="handleFocus"
    />

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

interface Props {
  name: string
  label?: string
  placeholder?: string
  hint?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  rows?: number
  modelValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  readonly: false,
  required: false,
  rows: 3,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const textareaId = useId()

// Use VeeValidate field
const {
  value,
  errorMessage,
  handleBlur,
  handleChange: veeHandleChange,
} = useField(props.name, undefined, {
  initialValue: props.modelValue,
})

const textareaClasses = computed(() => {
  const baseClasses = [
    'block',
    'w-full',
    'px-3',
    'py-2',
    'border',
    'rounded-lg',
    'text-sm',
    'transition-colors',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-1',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'placeholder:text-gray-400',
    'dark:placeholder:text-gray-500',
    'resize-vertical',
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
        'dark:bg-gray-800',
      ]

  return [...baseClasses, ...stateClasses].join(' ')
})

const handleChange = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  const newValue = target.value

  veeHandleChange(newValue)
  emit('update:modelValue', newValue)
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}
</script>
