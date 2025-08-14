<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Filtros</h3>
      <BaseButton variant="ghost" size="sm" @click="clearFilters">
        <X class="w-4 h-4 mr-1" />
        Limpiar
      </BaseButton>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Search -->
      <div>
        <FormInput
          name="search"
          label="Buscar"
          placeholder="Nombre, SKU o código..."
          :model-value="localFilters.search"
          @update:model-value="updateFilter('search', $event)"
        >
          <template #prefix>
            <Search class="h-4 w-4 text-gray-400" />
          </template>
        </FormInput>
      </div>

      <!-- Brand Filter -->
      <div>
        <FormSelect
          name="brand"
          label="Marca"
          placeholder="Todas las marcas"
          :model-value="localFilters.brandId || ''"
          :options="brandOptions"
          @update:model-value="updateFilter('brandId', $event || null)"
        />
      </div>

      <!-- Category Filter -->
      <div>
        <FormSelect
          name="category"
          label="Categoría"
          placeholder="Todas las categorías"
          :model-value="localFilters.categoryId || ''"
          :options="categoryOptions"
          @update:model-value="updateFilter('categoryId', $event || null)"
        />
      </div>

      <!-- Status Filter -->
      <div>
        <FormSelect
          name="status"
          label="Estado"
          :model-value="localFilters.active !== null ? (localFilters.active ? 'true' : 'false') : ''"
          :options="statusOptions"
          @update:model-value="updateFilter('active', $event === '' ? null : $event === 'true')"
        />
      </div>
    </div>

    <!-- Advanced Filters -->
    <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-4">
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            :checked="localFilters.lowStock"
            @change="updateFilter('lowStock', ($event.target as HTMLInputElement).checked)"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">Solo stock bajo</span>
        </label>

        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            :checked="localFilters.outOfStock"
            @change="updateFilter('outOfStock', ($event.target as HTMLInputElement).checked)"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">Solo sin stock</span>
        </label>
      </div>
    </div>

    <!-- Active Filters Summary -->
    <div v-if="activeFiltersCount > 0" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-sm text-gray-600 dark:text-gray-400">Filtros activos:</span>

        <span v-if="localFilters.search" class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
          Búsqueda: "{{ localFilters.search }}"
          <button @click="updateFilter('search', '')" class="hover:text-blue-600 dark:hover:text-blue-300">
            <X class="w-3 h-3" />
          </button>
        </span>

        <span v-if="localFilters.brandId" class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">
          Marca: {{ getBrandName(localFilters.brandId) }}
          <button @click="updateFilter('brandId', null)" class="hover:text-green-600 dark:hover:text-green-300">
            <X class="w-3 h-3" />
          </button>
        </span>

        <span v-if="localFilters.categoryId" class="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-xs">
          Categoría: {{ getCategoryName(localFilters.categoryId) }}
          <button @click="updateFilter('categoryId', null)" class="hover:text-purple-600 dark:hover:text-purple-300">
            <X class="w-3 h-3" />
          </button>
        </span>

        <span v-if="localFilters.active !== null" class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-full text-xs">
          Estado: {{ localFilters.active ? 'Activo' : 'Inactivo' }}
          <button @click="updateFilter('active', null)" class="hover:text-gray-600 dark:hover:text-gray-300">
            <X class="w-3 h-3" />
          </button>
        </span>

        <span v-if="localFilters.lowStock" class="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-xs">
          Stock bajo
          <button @click="updateFilter('lowStock', false)" class="hover:text-yellow-600 dark:hover:text-yellow-300">
            <X class="w-3 h-3" />
          </button>
        </span>

        <span v-if="localFilters.outOfStock" class="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-xs">
          Sin stock
          <button @click="updateFilter('outOfStock', false)" class="hover:text-red-600 dark:hover:text-red-300">
            <X class="w-3 h-3" />
          </button>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, type PropType } from 'vue'
import { Search, X } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormInput from '@/components/forms/FormInput.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import type { ProductFilters, Brand, Category } from '@/services/product'

interface Props {
  filters: ProductFilters
  brands: Brand[]
  categories: Category[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:filters': [filters: ProductFilters]
}>()

// Local filters state
const localFilters = ref<ProductFilters>({ ...props.filters })

// Watch for external filter changes
watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters }
}, { deep: true })

// Options for selects
const brandOptions = computed(() => [
  { value: '', label: 'Todas las marcas' },
  ...props.brands.map(brand => ({
    value: brand.id,
    label: brand.name
  }))
])

const categoryOptions = computed(() => [
  { value: '', label: 'Todas las categorías' },
  ...props.categories.map(category => ({
    value: category.id,
    label: category.name
  }))
])

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'true', label: 'Activos' },
  { value: 'false', label: 'Inactivos' }
]

// Active filters count
const activeFiltersCount = computed(() => {
  let count = 0
  if (localFilters.value.search) count++
  if (localFilters.value.brandId) count++
  if (localFilters.value.categoryId) count++
  if (localFilters.value.active !== null) count++
  if (localFilters.value.lowStock) count++
  if (localFilters.value.outOfStock) count++
  return count
})

// Helper functions
const getBrandName = (brandId: string) => {
  const brand = props.brands.find(b => b.id === brandId)
  return brand?.name || brandId
}

const getCategoryName = (categoryId: string) => {
  const category = props.categories.find(c => c.id === categoryId)
  return category?.name || categoryId
}

// Update filter function
const updateFilter = (key: keyof ProductFilters, value: any) => {
  localFilters.value = {
    ...localFilters.value,
    [key]: value
  }
  emit('update:filters', localFilters.value)
}

// Clear all filters
const clearFilters = () => {
  localFilters.value = {
    search: '',
    brandId: null,
    categoryId: null,
    active: null,
    lowStock: false,
    outOfStock: false
  }
  emit('update:filters', localFilters.value)
}
</script>
