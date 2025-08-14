<template>
  <div class="category-tree-node">
    <!-- Category Node -->
    <div
      :class="[
        'flex items-center justify-between p-3 rounded-lg border transition-colors',
        category.active
          ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
          : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 opacity-75'
      ]"
    >
      <div class="flex items-center gap-3">
        <!-- Expand/Collapse Button -->
        <button
          v-if="children.length > 0"
          @click="expanded = !expanded"
          class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronRight
            :class="[
              'w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform',
              { 'rotate-90': expanded }
            ]"
          />
        </button>
        <div v-else class="w-6"></div>

        <!-- Category Icon and Info -->
        <div class="flex items-center gap-3">
          <div class="flex-shrink-0">
            <div
              :class="[
                'h-8 w-8 rounded-full flex items-center justify-center',
                category.active
                  ? 'bg-blue-100 dark:bg-blue-900'
                  : 'bg-gray-200 dark:bg-gray-600'
              ]"
            >
              <Folder
                :class="[
                  'h-4 w-4',
                  category.active
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400'
                ]"
              />
            </div>
          </div>

          <div>
            <div class="flex items-center gap-2">
              <h4
                :class="[
                  'font-medium',
                  category.active
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-400'
                ]"
              >
                {{ category.name }}
              </h4>
              <span
                :class="[
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  category.active
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                ]"
              >
                {{ category.active ? 'Activa' : 'Inactiva' }}
              </span>
            </div>

            <div class="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span class="font-mono">{{ category.code }}</span>
              <span>Nivel {{ category.level }}</span>
              <span>{{ productCount }} producto{{ productCount !== 1 ? 's' : '' }}</span>
              <span v-if="children.length > 0">{{ children.length }} subcategoría{{ children.length !== 1 ? 's' : '' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-1">
        <button
          @click="$emit('add-child', category)"
          class="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
          title="Agregar subcategoría"
        >
          <Plus class="w-4 h-4" />
        </button>

        <button
          @click="$emit('edit', category)"
          class="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          title="Editar categoría"
        >
          <Edit class="w-4 h-4" />
        </button>

        <button
          @click="$emit('toggle-status', category)"
          :class="[
            'p-2 rounded-lg transition-colors',
            category.active
              ? 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
              : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
          ]"
          :title="category.active ? 'Desactivar categoría' : 'Activar categoría'"
        >
          <component :is="category.active ? EyeOff : Eye" class="w-4 h-4" />
        </button>

        <button
          @click="$emit('delete', category)"
          :disabled="hasChildrenOrProducts"
          :class="[
            'p-2 rounded-lg transition-colors',
            hasChildrenOrProducts
              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
              : 'text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
          ]"
          :title="hasChildrenOrProducts ? 'No se puede eliminar una categoría con subcategorías o productos' : 'Eliminar categoría'"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Children (Subcategories) -->
    <div
      v-if="children.length > 0 && expanded"
      class="ml-6 mt-3 space-y-3 border-l-2 border-gray-200 dark:border-gray-700 pl-4"
    >
      <CategoryTreeNode
        v-for="child in children"
        :key="child.id"
        :category="child"
        :children="getChildCategories(child.id)"
        :all-categories="allCategories"
        :products="products"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
        @toggle-status="$emit('toggle-status', $event)"
        @add-child="$emit('add-child', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, type PropType } from 'vue'
import {
  ChevronRight,
  Folder,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-vue-next'
import type { Category, ProductListItem } from '@/services/product'

interface Props {
  category: Category
  children: Category[]
  allCategories: Category[]
  products: ProductListItem[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: [category: Category]
  delete: [category: Category]
  'toggle-status': [category: Category]
  'add-child': [category: Category]
}>()

// Component state
const expanded = ref(true)

// Computed properties
const productCount = computed(() => {
  return props.products.filter(product => product.category_id === props.category.id).length
})

const hasChildrenOrProducts = computed(() => {
  const hasChildren = props.children.length > 0
  const hasProducts = productCount.value > 0
  return hasChildren || hasProducts
})

// Methods
const getChildCategories = (parentId: string) => {
  return props.allCategories.filter(category => category.parent_id === parentId)
}
</script>

<style scoped>
.category-tree-node {
  position: relative;
}

/* Custom scrollbar for better tree visualization */
.category-tree-node::-webkit-scrollbar {
  width: 4px;
}

.category-tree-node::-webkit-scrollbar-track {
  background: transparent;
}

.category-tree-node::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 2px;
}

.category-tree-node::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}
</style>
