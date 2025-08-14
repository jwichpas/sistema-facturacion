<template>
  <div class="space-y-1">
    <label
      v-if="label"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>

    <div
      :class="dropzoneClasses"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
    >
      <input
        :id="inputId"
        ref="fileInput"
        :name="name"
        type="file"
        :accept="accept"
        :multiple="multiple"
        :disabled="disabled"
        :required="required"
        class="sr-only"
        @change="handleFileSelect"
        @blur="handleBlur"
        @focus="handleFocus"
      />

      <div v-if="!files.length" class="text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <div class="mt-4">
          <label :for="inputId" class="cursor-pointer">
            <span class="mt-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ multiple ? 'Seleccionar archivos' : 'Seleccionar archivo' }}
            </span>
            <span class="mt-1 block text-xs text-gray-500 dark:text-gray-400">
              o arrastra {{ multiple ? 'los archivos' : 'el archivo' }} aquí
            </span>
          </label>
        </div>
        <p v-if="accept" class="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Tipos permitidos: {{ accept }}
        </p>
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="(file, index) in files"
          :key="index"
          class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
        >
          <div class="flex items-center space-x-2">
            <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ file.name }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatFileSize(file.size) }}</p>
            </div>
          </div>
          <button
            type="button"
            class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            @click="removeFile(index)"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          class="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          @click="openFileDialog"
        >
          {{ multiple ? 'Agregar más archivos' : 'Cambiar archivo' }}
        </button>
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
import { computed, ref, useId } from 'vue'
import { useField } from 'vee-validate'

interface Props {
  name: string
  label?: string
  hint?: string
  disabled?: boolean
  required?: boolean
  accept?: string
  multiple?: boolean
  maxSize?: number // in bytes
  modelValue?: File | File[]
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  required: false,
  multiple: false,
  maxSize: 10 * 1024 * 1024, // 10MB default
})

const emit = defineEmits<{
  'update:modelValue': [value: File | File[]]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const inputId = useId()
const fileInput = ref<HTMLInputElement>()
const isDragOver = ref(false)

// Use VeeValidate field
const {
  value,
  errorMessage,
  handleBlur,
  handleChange: veeHandleChange,
} = useField(props.name, undefined, {
  initialValue: props.modelValue,
})

const files = computed(() => {
  if (!value.value) return []
  return Array.isArray(value.value) ? value.value : [value.value]
})

const dropzoneClasses = computed(() => {
  const baseClasses = [
    'mt-1',
    'flex',
    'justify-center',
    'px-6',
    'pt-5',
    'pb-6',
    'border-2',
    'border-dashed',
    'rounded-lg',
    'transition-colors',
  ]

  if (props.disabled) {
    baseClasses.push('opacity-50', 'cursor-not-allowed')
  } else {
    baseClasses.push('cursor-pointer')
  }

  if (isDragOver.value) {
    baseClasses.push('border-blue-400', 'bg-blue-50', 'dark:bg-blue-900/20')
  } else if (errorMessage.value) {
    baseClasses.push('border-red-300', 'dark:border-red-600')
  } else {
    baseClasses.push('border-gray-300', 'dark:border-gray-600', 'hover:border-gray-400', 'dark:hover:border-gray-500')
  }

  return baseClasses.join(' ')
})

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const selectedFiles = Array.from(target.files || [])
  processFiles(selectedFiles)
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false

  if (props.disabled) return

  const droppedFiles = Array.from(event.dataTransfer?.files || [])
  processFiles(droppedFiles)
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
}

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault()
  if (!props.disabled) {
    isDragOver.value = true
  }
}

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
}

const processFiles = (newFiles: File[]) => {
  // Validate file size
  const validFiles = newFiles.filter(file => {
    if (file.size > props.maxSize) {
      console.warn(`File ${file.name} exceeds maximum size of ${formatFileSize(props.maxSize)}`)
      return false
    }
    return true
  })

  if (validFiles.length === 0) return

  let updatedFiles: File | File[]

  if (props.multiple) {
    const currentFiles = Array.isArray(value.value) ? value.value : []
    updatedFiles = [...currentFiles, ...validFiles]
  } else {
    updatedFiles = validFiles[0]
  }

  veeHandleChange(updatedFiles)
  emit('update:modelValue', updatedFiles)
}

const removeFile = (index: number) => {
  if (props.multiple && Array.isArray(value.value)) {
    const updatedFiles = value.value.filter((_, i) => i !== index)
    const newValue = updatedFiles.length > 0 ? updatedFiles : []
    veeHandleChange(newValue)
    emit('update:modelValue', newValue as File[])
  } else {
    veeHandleChange(null)
    emit('update:modelValue', null as any)
  }
}

const openFileDialog = () => {
  fileInput.value?.click()
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}
</script>
