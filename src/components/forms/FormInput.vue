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
      <div
        v-if="$slots.prefix"
        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
      >
        <slot name="prefix" />
      </div>

      <input
        :id="inputId"
        :name="name"
        :type="type"
        :value="value"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :autocomplete="autocomplete"
        :class="inputClasses"
        @input="handleChange"
        @blur="handleBlur"
        @focus="handleFocus"
      />

      <div v-if="$slots.suffix" class="absolute inset-y-0 right-0 pr-3 flex items-center">
        <slot name="suffix" />
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
import { computed, useId, useSlots } from 'vue'
import { useField } from 'vee-validate'

interface Props {
  name: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date'
  label?: string
  placeholder?: string
  hint?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  autocomplete?: string
  modelValue?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  readonly: false,
  required: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
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

const inputClasses = computed(() => {
  const baseClasses = [
    'block',
    'w-full',
    'rounded-md',
    'bg-white/5',
    'px-3',
    'py-1.5',
    'text-base',
    'text-white',
    'placeholder:text-gray-500',
    'outline-1',
    '-outline-offset-1',
    'outline-white/10',
    'focus:outline-2',
    'focus:-outline-offset-2',
    'focus:outline-indigo-500',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'sm:text-sm/6',
  ]

  const stateClasses = errorMessage.value
    ? [
        'outline-red-500',
        'focus:outline-red-500',
        'text-red-100',
        'placeholder:text-red-300',
        'dark:outline-red-600',
      ]
    : [
        'border',
        'border-gray-300',
        'text-gray-900',
        'focus:border-blue-500',
        'focus:ring-blue-500',
        'dark:border-gray-600',
        'dark:text-gray-100',
        'dark:bg-gray-800',
      ]

  const paddingClasses: string[] = []
  if (useSlots().prefix) {
    paddingClasses.push('pl-10')
  }
  if (useSlots().suffix) {
    paddingClasses.push('pr-10')
  }

  return [...baseClasses, ...stateClasses, ...paddingClasses].join(' ')
})

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  let newValue: string | number = target.value

  if (props.type === 'number') {
    newValue = target.valueAsNumber || 0
  }

  veeHandleChange(newValue)
  emit('update:modelValue', newValue)
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}
</script>
