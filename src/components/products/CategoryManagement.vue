<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Gestión de Categorías</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Administra las categorías de tus productos con estructura jerárquica
        </p>
      </div>
      <BaseButton @click="showCreateForm = true">
        <Plus class="w-4 h-4 mr-2" />
        Nueva Categoría
      </BaseButton>
    </div>

    <!-- Search and Filters -->
    <div class="flex flex-col md:flex-row gap-4">
      <div class="flex-1">
        <FormInput
          name="category_search"
          placeholder="Buscar categorías por nombre o código..."
          :model-value="searchQuery"
          @update:model-value="handleSearch"
        >
          <template #prefix>
            <Search class="h-4 w-4 text-gray-400" />
          </template>
        </FormInput>
      </div>
      <div class="flex items-center gap-2">
        <FormSelect
          name="level_filter"
          :model-value="levelFilter"
          :options="levelOptions"
          @update:model-value="levelFilter = $event"
        />
        <FormSelect
          name="status_filter"
          :model-value="statusFilter"
          :options="statusOptions"
          @update:model-value="statusFilter = $event"
        />
        <BaseButton variant="outline" @click="clearFilters">
          <X class="w-4 h-4 mr-1" />
          Limpiar
        </BaseButton>
      </div>
    </div>

    <!-- View Toggle -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-600 dark:text-gray-400">Vista:</span>
        <div class="flex rounded-lg border border-gray-200 dark:border-gray-700">
          <button
            :class="[
              'px-3 py-1 text-sm rounded-l-lg transition-colors',
              viewMode === 'tree'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            ]"
            @click="viewMode = 'tree'"
          >
            <TreePine class="w-4 h-4" />
          </button>
          <button
            :class="[
              'px-3 py-1 text-sm rounded-r-lg transition-colors',
              viewMode === 'table'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            ]"
            @click="viewMode = 'table'"
          >
            <List class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        <span>Total: {{ totalCategories }}</span>
        <span>Activas: {{ activeCategories }}</span>
        <span>Con productos: {{ categoriesWithProducts }}</span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-2 text-gray-600 dark:text-gray-400">Cargando categorías...</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredCategories.length === 0" class="text-center py-12">
      <Folder class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
        {{ searchQuery ? 'No se encontraron categorías' : 'No hay categorías' }}
      </h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ searchQuery ? `No hay categorías que coincidan con "${searchQuery}"` : 'Comienza creando tu primera categoría.' }}
      </p>
      <div class="mt-6">
        <BaseButton @click="showCreateForm = true">
          <Plus class="w-4 h-4 mr-2" />
          Nueva Categoría
        </BaseButton>
      </div>
    </div>

    <!-- Tree View -->
    <div v-else-if="viewMode === 'tree'" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <CategoryTreeNode
        v-for="category in rootCategories"
        :key="category.id"
        :category="category"
        :children="getChildCategories(category.id)"
        :all-categories="filteredCategories"
        :products="productStore.products"
        @edit="editCategory"
        @delete="deleteCategory"
        @toggle-status="toggleCategoryStatus"
        @add-child="addChildCategory"
      />
    </div>

    <!-- Table View -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Categoría
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Código
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Nivel
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Padre
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Productos
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            <tr
              v-for="category in filteredCategories"
              :key="category.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <Folder class="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {{ '—'.repeat(category.level) }} {{ category.name }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-900 dark:text-gray-100 font-mono">
                  {{ category.code }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-900 dark:text-gray-100">
                  {{ category.level }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  {{ getParentCategoryName(category.parent_id) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-900 dark:text-gray-100">
                  {{ getCategoryProductCount(category.id) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    category.active
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  ]"
                >
                  {{ category.active ? 'Activa' : 'Inactiva' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="addChildCategory(category)"
                    class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                    title="Agregar subcategoría"
                  >
                    <Plus class="w-4 h-4" />
                  </button>
                  <button
                    @click="editCategory(category)"
                    class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <Edit class="w-4 h-4" />
                  </button>
                  <button
                    @click="toggleCategoryStatus(category)"
                    :class="[
                      'hover:text-yellow-900 dark:hover:text-yellow-300',
                      category.active ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
                    ]"
                  >
                    <component :is="category.active ? EyeOff : Eye" class="w-4 h-4" />
                  </button>
                  <button
                    @click="deleteCategory(category)"
                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    :disabled="hasChildrenOrProducts(category)"
                    :title="hasChildrenOrProducts(category) ? 'No se puede eliminar una categoría con subcategorías o productos' : 'Eliminar categoría'"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create/Edit Category Modal -->
    <div v-if="showCreateForm || editingCategory" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {{ editingCategory ? 'Editar Categoría' : (parentCategory ? `Nueva Subcategoría de "${parentCategory.name}"` : 'Nueva Categoría') }}
            </h3>
            <button
              @click="closeForm"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X class="w-6 h-6" />
            </button>
          </div>

          <BaseForm
            :schema="categorySchema"
            :initial-values="formInitialValues"
            @submit="handleSubmit"
            @cancel="closeForm"
          >
            <div class="space-y-4">
              <FormInput
                name="name"
                label="Nombre de la Categoría"
                placeholder="Ingrese el nombre de la categoría"
                required
              />

              <FormInput
                name="code"
                label="Código"
                placeholder="Código único"
                required
              />

              <FormSelect
                v-if="!parentCategory && !editingCategory"
                name="parent_id"
                label="Categoría Padre"
                placeholder="Seleccionar categoría padre (opcional)"
                :options="parentCategoryOptions"
              />

              <div v-if="parentCategory" class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p class="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Categoría padre:</strong> {{ parentCategory.name }}
                </p>
              </div>

              <FormCheckbox
                name="active"
                label="Categoría activa"
                description="Las categorías inactivas no aparecerán en los formularios"
              />
            </div>

            <div class="flex items-center justify-end gap-3 mt-6">
              <BaseButton variant="outline" @click="closeForm">
                Cancelar
              </BaseButton>
              <BaseButton type="submit" :loading="formLoading">
                {{ editingCategory ? 'Actualizar' : 'Crear' }} Categoría
              </BaseButton>
            </div>
          </BaseForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { object, string, boolean } from 'yup'
import {
  Plus,
  Search,
  X,
  Folder,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  TreePine,
  List
} from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseForm from '@/components/forms/BaseForm.vue'
import FormInput from '@/components/forms/FormInput.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import FormCheckbox from '@/components/forms/FormCheckbox.vue'
import CategoryTreeNode from './CategoryTreeNode.vue'
import { useProductStore } from '@/stores/product'
import { useAuthStore } from '@/stores/auth'
import type { Category, CategoryInsert, CategoryUpdate } from '@/services/product'

// Stores
const productStore = useProductStore()
const authStore = useAuthStore()

// Component state
const showCreateForm = ref(false)
const editingCategory = ref<Category | null>(null)
const parentCategory = ref<Category | null>(null)
const formLoading = ref(false)
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const levelFilter = ref('')
const viewMode = ref<'tree' | 'table'>('tree')

// Search debounce
let searchTimeout: NodeJS.Timeout

// Form validation schema
const categorySchema = object({
  name: string().required('El nombre es requerido'),
  code: string().required('El código es requerido'),
  parent_id: string().optional(),
  active: boolean().default(true)
})

// Computed properties
const filteredCategories = computed(() => {
  let categories = [...productStore.categories]

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    categories = categories.filter(category =>
      category.name.toLowerCase().includes(query) ||
      category.code.toLowerCase().includes(query)
    )
  }

  // Apply status filter
  if (statusFilter.value !== '') {
    const isActive = statusFilter.value === 'true'
    categories = categories.filter(category => category.active === isActive)
  }

  // Apply level filter
  if (levelFilter.value !== '') {
    const level = parseInt(levelFilter.value)
    categories = categories.filter(category => category.level === level)
  }

  return categories.sort((a, b) => {
    // Sort by level first, then by name
    if (a.level !== b.level) {
      return a.level - b.level
    }
    return a.name.localeCompare(b.name)
  })
})

const rootCategories = computed(() => {
  return filteredCategories.value.filter(category => !category.parent_id)
})

const totalCategories = computed(() => productStore.categories.length)
const activeCategories = computed(() => productStore.categories.filter(c => c.active).length)
const categoriesWithProducts = computed(() => {
  return productStore.categories.filter(category =>
    productStore.products.some(product => product.category_id === category.id)
  ).length
})

const formInitialValues = computed(() => {
  if (editingCategory.value) {
    return {
      name: editingCategory.value.name,
      code: editingCategory.value.code,
      parent_id: editingCategory.value.parent_id || '',
      active: editingCategory.value.active
    }
  }
  return {
    name: '',
    code: '',
    parent_id: parentCategory.value?.id || '',
    active: true
  }
})

const parentCategoryOptions = computed(() => [
  { value: '', label: 'Sin categoría padre (raíz)' },
  ...productStore.categories
    .filter(cat => cat.active && (!editingCategory.value || cat.id !== editingCategory.value.id))
    .map(category => ({
      value: category.id,
      label: `${'—'.repeat(category.level)} ${category.name}`
    }))
])

// Options
const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'true', label: 'Activas' },
  { value: 'false', label: 'Inactivas' }
]

const levelOptions = computed(() => {
  const levels = [...new Set(productStore.categories.map(c => c.level))].sort()
  return [
    { value: '', label: 'Todos los niveles' },
    ...levels.map(level => ({
      value: level.toString(),
      label: `Nivel ${level}`
    }))
  ]
})

// Methods
const handleSearch = (query: string) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    searchQuery.value = query
  }, 300)
}

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  levelFilter.value = ''
}

const getChildCategories = (parentId: string) => {
  return filteredCategories.value.filter(category => category.parent_id === parentId)
}

const getParentCategoryName = (parentId: string | null) => {
  if (!parentId) return '-'
  const parent = productStore.categories.find(c => c.id === parentId)
  return parent?.name || '-'
}

const getCategoryProductCount = (categoryId: string) => {
  return productStore.products.filter(product => product.category_id === categoryId).length
}

const hasChildrenOrProducts = (category: Category) => {
  const hasChildren = productStore.categories.some(c => c.parent_id === category.id)
  const hasProducts = getCategoryProductCount(category.id) > 0
  return hasChildren || hasProducts
}

const editCategory = (category: Category) => {
  editingCategory.value = category
  parentCategory.value = null
  showCreateForm.value = false
}

const addChildCategory = (parent: Category) => {
  parentCategory.value = parent
  editingCategory.value = null
  showCreateForm.value = false
}

const closeForm = () => {
  showCreateForm.value = false
  editingCategory.value = null
  parentCategory.value = null
}

const handleSubmit = async (data: any) => {
  formLoading.value = true

  try {
    if (!authStore.currentCompany?.id) {
      throw new Error('No company selected')
    }

    // Calculate level based on parent
    let level = 0
    if (data.parent_id) {
      const parent = productStore.categories.find(c => c.id === data.parent_id)
      level = parent ? parent.level + 1 : 0
    }

    const categoryData = {
      ...data,
      company_id: authStore.currentCompany.id,
      parent_id: data.parent_id || null,
      level
    }

    if (editingCategory.value) {
      await productStore.updateCategory(editingCategory.value.id, categoryData as CategoryUpdate)
      alert('Categoría actualizada correctamente')
    } else {
      await productStore.createCategory(categoryData as CategoryInsert)
      alert('Categoría creada correctamente')
    }

    closeForm()
  } catch (error) {
    console.error('Error saving category:', error)
    alert('Error al guardar la categoría')
  } finally {
    formLoading.value = false
  }
}

const toggleCategoryStatus = async (category: Category) => {
  try {
    await productStore.updateCategory(category.id, { active: !category.active })
    alert(`Categoría ${category.active ? 'desactivada' : 'activada'} correctamente`)
  } catch (error) {
    console.error('Error toggling category status:', error)
    alert('Error al cambiar el estado de la categoría')
  }
}

const deleteCategory = async (category: Category) => {
  if (hasChildrenOrProducts(category)) {
    alert(`No se puede eliminar la categoría "${category.name}" porque tiene subcategorías o productos asociados.`)
    return
  }

  if (confirm(`¿Estás seguro de que quieres eliminar la categoría "${category.name}"?`)) {
    try {
      await productStore.deleteCategory(category.id)
      alert('Categoría eliminada correctamente')
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Error al eliminar la categoría')
    }
  }
}

// Lifecycle
onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      productStore.loadCategories(),
      productStore.loadProducts() // Needed for product count
    ])
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    loading.value = false
  }
})
</script>
