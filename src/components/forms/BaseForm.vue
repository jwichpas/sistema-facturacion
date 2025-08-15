<template>
  <form @submit="onSubmit" :class="formClasses">
    <slot :values="values" :errors="errors" :meta="meta" :is-submitting="isSubmitting" />

    <div v-if="showActions" class="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
      <button
        v-if="showCancel"
        type="button"
        :disabled="isSubmitting"
        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
        @click="handleCancel"
      >
        {{ cancelText }}
      </button>

      <button
        type="submit"
        :disabled="isSubmitting || !meta.valid"
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="isSubmitting" class="flex items-center">
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ submittingText }}
        </span>
        <span v-else>{{ submitText }}</span>
      </button>
    </div>
  </form>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { computed } from 'vue'
import { useForm } from 'vee-validate'
import type { ObjectSchema } from 'yup'

interface Props {
  schema?: ObjectSchema<T>
  initialValues?: Partial<T>
  showActions?: boolean
  showCancel?: boolean
  submitText?: string
  cancelText?: string
  submittingText?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true,
  showCancel: true,
  submitText: 'Guardar',
  cancelText: 'Cancelar',
  submittingText: 'Guardando...',
})

const emit = defineEmits<{
  submit: [values: T]
  cancel: []
}>()

// Initialize form with VeeValidate
const { handleSubmit, values, errors, meta, isSubmitting, resetForm } = useForm<T>({
  validationSchema: props.schema,
  initialValues: props.initialValues as any,
})

const formClasses = computed(() => {
  const baseClasses = ['space-y-6']
  if (props.class) {
    baseClasses.push(props.class)
  }
  return baseClasses.join(' ')
})

const onSubmit = handleSubmit(async (values) => {
  emit('submit', values as any as T)
})

const handleCancel = () => {
  emit('cancel')
}

// Expose form methods for parent components
defineExpose({
  resetForm,
  values,
  errors,
  meta,
  isSubmitting,
})
</script>
