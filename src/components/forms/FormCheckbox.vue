<template>
  <div class="space-y-1">
    <div class="flex items-start">
      <div class="flex items-center h-5">
        <input
          :id="checkboxId"
          :name="name"
          type="checkbox"
          :checked="value"
          :disabled="disabled"
          :required="required"
          :class="checkboxClasses"
          @change="handleChange"
          @blur="handleBlur"
          @focus="handleFocus"
        />
      </div>

      <div class="ml-3 text-sm">
        <label
          :for="checkboxId"
          class="font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
        >
          {{ label }}
          <span v-if="required" class="text-red-500 ml-1">*</span>
        </label>

        <p v-if="description" class="text-gray-500 dark:text-gray-400">
          {{ description }}
        </p>
      </div>
    </div>

    <p v-if="errorMessage" class="text-sm text-red-600 dark:text-red-400 ml-8">
      {{ errorMessage }}
    </p>

    <p v-else-if="hint" class="text-sm text-gray-500 dark:text-gray-400 ml-8">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { useField } from 'vee-validate'

interface Props {
  name: string
  label: string
  description?: string
  hint?: string
  disabled?: boolean
  required?: boolean
  modelValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  required: false,
  modelValue: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const checkboxId = useId()

// Use VeeValidate field
const {
  value,
  errorMessage,
  handleBlur,
  handleChange: veeHandleChange,
} = useField(props.name, undefined, {
  initialValue: props.modelValue,
  type: 'checkbox',
})

const checkboxClasses = computed(() => {
  const baseClasses = [
    'h-4',
    'w-4',
    'rounded',
    'border',
    'transition-colors',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-1',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'cursor-pointer',
  ]

  const stateClasses = errorMessage.value
    ? [
        'border-red-300',
        'text-red-600',
        'focus:ring-red-500',
        'dark:border-red-600',
      ]
    : [
        'border-gray-300',
        'text-blue-600',
        'focus:ring-blue-500',
        'dark:border-gray-600',
      ]

  return [...baseClasses, ...stateClasses].join(' ')
})

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const newValue = target.checked

  veeHandleChange(newValue)
  emit('update:modelValue', newValue)
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}
</script>
