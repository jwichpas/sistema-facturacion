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
      <!-- Tree View Toggle -->
      <div class="flex items-center gap-2 mb-2">
        <button
          type="button"
          @click="showTree = !showTree"
          class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
        >
          <TreePine class="w-4 h-4" />
          {{ showTree ? 'Vista simple' : 'Vista árbol' }}
        </button>
      </div>

      <!-- Simple Select -->
      <select
        v-if="!showTree"
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
          v-for="option in flatOptions"
          :key="option.value"
          :value="option.value"
          :disabled="option.disabled"
        >
          {{ option.label }}
        </option>
      </select>

      <!-- Tree View -->
      <div
        v-else
        class="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800 max-h-64 overflow-y-auto"
      >
        <div v-if="!categories.length" class="text-center py-4 text-gray-500 dark:text-gray-400">
          No hay categorías disponibles
        </div>
        <CategorySelectorNode
          v-for="category in rootCategories"
          :key="category.id"
          :category="category"
          :children="getChildCategories(category.id)"
          :selected-id="value"
          :all-categories="categories"
          @select="handleTreeSelect"
        />
      </div>

      <!-- Selected Category Display -->
      <div v-if="selectedCategory && showTree" class="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Folder class="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span class="text-sm font-medium text-blue-800 dark:text-blue-200">
              {{ getCategoryPath(selectedCategory) }}
            </span>
          </div>
          <button
            type="button"
            @click="clearSelection"
            class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Dropdown arrow for select -->
      <div v-if="!showTree" class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
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
import { computed, useId, ref } from 'vue'
import { useField } from 'vee-validate'
import { TreePine, Folder, X } from 'lucide-vue-next'
import CategorySelectorNode from './CategorySelectorNode.vue'
import type { Category } from '@/services/product'

interface Props {
  name: string
  label?: string
  placeholder?: string
  hint?: string
  disabled?: boolean
  required?: boolean
  categories: Category[]
  modelValue?: string
  showInactive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  required: false,
  showInactive: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const selectId = useId()
const showTree = ref(false)

// Use VeeValidate field
const {
  value,
  errorMessage,
  handleBlur,
  handleChange: veeHandleChange,
} = useField(props.name, undefined, {
  initialValue: props.modelValue,
})

// Computed properties
const filteredCategories = computed(() => {
  return props.categories.filter(category =>
    props.showInactive || category.active
  )
})

const rootCategories = computed(() => {
  return filteredCategories.value.filter(category => !category.parent_id)
})

const selectedCategory = computed(() => {
  return filteredCategories.value.find(cat => cat.id === value.value)
})

const flatOptions = computed(() => {
  const options = [{ value: '', label: props.placeholder || 'Seleccionar categoría' }]

  const addCategoryOptions = (categories: Category[], level = 0) => {
    categories
      .filter(cat => !cat.parent_id && level === 0 || cat.parent_id && level > 0)
      .forEach(category => {
        options.push({
          value: category.id,
          label: `${'—'.repeat(level)} ${category.name}`,
          disabled: !category.active
        })

        // Add children
        const children = filteredCategories.value.filter(c => c.parent_id === category.id)
        if (children.length > 0) {
          addCategoryOptions(children, level + 1)
        }
      })
  }

  addCategoryOptions(rootCategories.value)
  return options
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

// Methods
const getChildCategories = (parentId: string) => {
  return filteredCategories.value.filter(category => category.parent_id === parentId)
}

const getCategoryPath = (category: Category): string => {
  const path = [category.name]
  let current = category

  while (current.parent_id) {
    const parent = filteredCategories.value.find(c => c.id === current.parent_id)
    if (parent) {
      path.unshift(parent.name)
      current = parent
    } else {
      break
    }
  }

  return path.join(' > ')
}

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const newValue = target.value

  veeHandleChange(newValue)
  emit('update:modelValue', newValue)
}

const handleTreeSelect = (categoryId: string) => {
  veeHandleChange(categoryId)
  emit('update:modelValue', categoryId)
}

const clearSelection = () => {
  veeHandleChange('')
  emit('update:modelValue', '')
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}
</script>
