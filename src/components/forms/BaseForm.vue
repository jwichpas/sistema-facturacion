<template>
  <form @submit="onSubmit" :class="formClasses">
    <slot :errors="errors" :values="values" :isSubmitting="isSubmitting" />

    <div v-if="showActions" class="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
      <BaseButton
        v-if="showCancel"
        type="button"
        variant="outline"
        @click="handleCancel"
        :disabled="isSubmitting"
      >
        {{ cancelText }}
      </BaseButton>

      <BaseButton
        type="submit"
        :loading="isSubmitting"
        :disabled="!meta.valid || isSubmitting"
      >
        {{ submitText }}
      </BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useForm } from 'vee-validate'
import type { ObjectSchema } from 'yup'
import BaseButton from '@/components/ui/BaseButton.vue'

interface Props {
  schema: ObjectSchema<any>
  initialValues?: Record<string, any>
  submitText?: string
  cancelText?: string
  showActions?: boolean
  showCancel?: boolean
  class?: string
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

const { handleSubmit, errors, values, meta, isSubmitting } = useForm({
  validationSchema: props.schema,
  initialValues: props.initialValues || {},
})

const formClasses = computed(() => {
  const baseClasses = ['space-y-6']
  if (props.class) {
    baseClasses.push(props.class)
  }
  return baseClasses.join(' ')
})

const onSubmit = handleSubmit(async (values) => {
  emit('submit', values)
})

const handleCancel = () => {
  emit('cancel')
}
</script>
