<template>
  <div class="category-selector-node">
    <!-- Category Node -->
    <div
      :class="[
        'flex items-center gap-2 p-2 rounded cursor-pointer transition-colors',
        isSelected
          ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700',
        !category.active && 'opacity-60'
      ]"
      @click="handleSelect"
    >
      <!-- Expand/Collapse Button -->
      <button
        v-if="children.length > 0"
        @click.stop="expanded = !expanded"
        class="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        <ChevronRight
          :class="[
            'w-3 h-3 text-gray-500 dark:text-gray-400 transition-transform',
            { 'rotate-90': expanded }
          ]"
        />
      </button>
      <div v-else class="w-4"></div>

      <!-- Category Icon and Name -->
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <Folder
          :class="[
            'w-4 h-4 flex-shrink-0',
            isSelected
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400'
          ]"
        />
        <span
          :class="[
            'text-sm truncate',
            isSelected
              ? 'font-medium text-blue-900 dark:text-blue-100'
              : 'text-gray-900 dark:text-gray-100',
            !category.active && 'line-through'
          ]"
        >
          {{ category.name }}
        </span>
        <span
          v-if="!category.active"
          class="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 rounded"
        >
          Inactiva
        </span>
      </div>

      <!-- Selection Indicator -->
      <div v-if="isSelected" class="flex-shrink-0">
        <Check class="w-4 h-4 text-blue-600 dark:text-blue-400" />
      </div>
    </div>

    <!-- Children (Subcategories) -->
    <div
      v-if="children.length > 0 && expanded"
      class="ml-4 mt-1 space-y-1 border-l border-gray-200 dark:border-gray-700 pl-2"
    >
      <CategorySelectorNode
        v-for="child in children"
        :key="child.id"
        :category="child"
        :children="getChildCategories(child.id)"
        :selected-id="selectedId"
        :all-categories="allCategories"
        @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronRight, Folder, Check } from 'lucide-vue-next'
import type { Category } from '@/services/product'

interface Props {
  category: Category
  children: Category[]
  selectedId?: string
  allCategories: Category[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  select: [categoryId: string]
}>()

// Component state
const expanded = ref(true)

// Computed properties
const isSelected = computed(() => props.selectedId === props.category.id)

// Methods
const getChildCategories = (parentId: string) => {
  return props.allCategories.filter(category => category.parent_id === parentId)
}

const handleSelect = () => {
  if (props.category.active) {
    emit('select', props.category.id)
  }
}
</script>

<style scoped>
.category-selector-node {
  position: relative;
}
</style>
