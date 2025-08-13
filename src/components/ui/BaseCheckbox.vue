<template>
  <div class="flex items-start">
    <div class="flex items-center h-5">
      <input
        :id="checkboxId"
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        :class="checkboxClasses"
        @change="handleChange"
      />
    </div>
    <div class="ml-3 text-sm">
      <label
        :for="checkboxId"
        class="font-medium text-gray-700 dark:text-gray-300"
        :class="{ 'cursor-not-allowed opacity-50': disabled }"
      >
        {{ label }}
      </label>
      <p v-if="description" class="text-gray-500 dark:text-gray-400">
        {{ description }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'

interface Props {
  modelValue?: boolean
  label: string
  description?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const checkboxId = useId()

const checkboxClasses = computed(() =>
  [
    'h-4',
    'w-4',
    'text-primary-600',
    'border-gray-300',
    'rounded',
    'focus:ring-primary-500',
    'focus:ring-2',
    'focus:ring-offset-1',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'dark:border-gray-600',
    'dark:bg-gray-800',
    'dark:focus:ring-offset-gray-800',
  ].join(' '),
)

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.checked)
}
</script>
