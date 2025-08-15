<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Gestión de Marcas</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Administra las marcas de tus productos
        </p>
      </div>
      <BaseButton @click="showCreateForm = true">
        <Plus class="w-4 h-4 mr-2" />
        Nueva Marca
      </BaseButton>
    </div>

    <!-- Search and Filters -->
    <div class="flex flex-col md:flex-row gap-4">
      <div class="flex-1">
        <FormInput
          name="brand_search"
          placeholder="Buscar marcas por nombre o código..."
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
          name="status_filter"
          :model-value="statusFilter"
          :options="statusOptions"
          @update:model-value="statusFilter = String($event)"
        />
        <BaseButton variant="outline" @click="clearFilters">
          <X class="w-4 h-4 mr-1" />
          Limpiar
        </BaseButton>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <Tag class="h-8 w-8 text-blue-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Marcas</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ totalBrands }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <CheckCircle class="h-8 w-8 text-green-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Marcas Activas</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ activeBrands }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <Package class="h-8 w-8 text-purple-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Con Productos</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ brandsWithProducts }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-2 text-gray-600 dark:text-gray-400">Cargando marcas...</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredBrands.length === 0" class="text-center py-12">
      <Tag class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
        {{ searchQuery ? 'No se encontraron marcas' : 'No hay marcas' }}
      </h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ searchQuery ? `No hay marcas que coincidan con "${searchQuery}"` : 'Comienza creando tu primera marca.' }}
      </p>
      <div class="mt-6">
        <BaseButton @click="showCreateForm = true">
          <Plus class="w-4 h-4 mr-2" />
          Nueva Marca
        </BaseButton>
      </div>
    </div>

    <!-- Brands Table -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Marca
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Código
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Productos
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Fecha Creación
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            <tr
              v-for="brand in filteredBrands"
              :key="brand.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <Tag class="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {{ (brand as any).name }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-900 dark:text-gray-100 font-mono">
                  {{ (brand as any).code || '-' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-900 dark:text-gray-100">
                  {{ getBrandProductCount((brand as any).id) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    (brand as any).active
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  ]"
                >
                  {{ (brand as any).active ? 'Activa' : 'Inactiva' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ formatDate((brand as any).created_at) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="editBrand(brand as any)"
                    class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <Edit class="w-4 h-4" />
                  </button>
                  <button
                    @click="toggleBrandStatus(brand as any)"
                    :class="[
                      'hover:text-yellow-900 dark:hover:text-yellow-300',
                      (brand as any).active ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
                    ]"
                  >
                    <component :is="(brand as any).active ? EyeOff : Eye" class="w-4 h-4" />
                  </button>
                  <button
                    @click="deleteBrand(brand as any)"
                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    :disabled="getBrandProductCount((brand as any).id) > 0"
                    :title="getBrandProductCount((brand as any).id) > 0 ? 'No se puede eliminar una marca con productos' : 'Eliminar marca'"
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

    <!-- Create/Edit Brand Modal -->
    <div v-if="showCreateForm || editingBrand" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {{ editingBrand ? 'Editar Marca' : 'Nueva Marca' }}
            </h3>
            <button
              @click="closeForm"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X class="w-6 h-6" />
            </button>
          </div>

          <BaseForm
            :schema="brandSchema"
            :initial-values="formInitialValues"
            @submit="handleSubmit"
            @cancel="closeForm"
          >
            <div class="space-y-4">
              <FormInput
                name="name"
                label="Nombre de la Marca"
                placeholder="Ingrese el nombre de la marca"
                required
              />

              <FormInput
                name="code"
                label="Código"
                placeholder="Código único (opcional)"
                hint="Si no se especifica, se generará automáticamente"
              />

              <FormCheckbox
                name="active"
                label="Marca activa"
                description="Las marcas inactivas no aparecerán en los formularios"
              />
            </div>

            <div class="flex items-center justify-end gap-3 mt-6">
              <BaseButton variant="outline" @click="closeForm">
                Cancelar
              </BaseButton>
              <BaseButton type="submit" :loading="formLoading">
                {{ editingBrand ? 'Actualizar' : 'Crear' }} Marca
              </BaseButton>
            </div>
          </BaseForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { object, string, boolean } from 'yup'
import {
  Plus,
  Search,
  X,
  Tag,
  CheckCircle,
  Package,
  Edit,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseForm from '@/components/forms/BaseForm.vue'
import FormInput from '@/components/forms/FormInput.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import FormCheckbox from '@/components/forms/FormCheckbox.vue'
import { useProductStore } from '@/stores/product'
import { useAuthStore } from '@/stores/auth'
import type { Brand, BrandInsert, BrandUpdate } from '@/services/product'

// Stores
const productStore = useProductStore()
const authStore = useAuthStore()

// Component state
const showCreateForm = ref(false)
const editingBrand = ref<Brand | null>(null)
const formLoading = ref(false)
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')

// Search debounce
let searchTimeout: NodeJS.Timeout

// Form validation schema
const brandSchema = object({
  name: string().required('El nombre es requerido'),
  code: string().optional(),
  active: boolean().default(true)
})

// Computed properties
const filteredBrands = computed(() => {
  let brands = [...productStore.brands]

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    brands = brands.filter(brand =>
      brand.name.toLowerCase().includes(query) ||
      (brand.code && brand.code.toLowerCase().includes(query))
    )
  }

  // Apply status filter
  if (statusFilter.value !== '') {
    const isActive = statusFilter.value === 'true'
    brands = brands.filter(brand => (brand as any).active === isActive)
  }

  return brands.sort((a, b) => a.name.localeCompare(b.name))
})

const totalBrands = computed(() => productStore.brands.length)
const activeBrands = computed(() => productStore.brands.filter(b => b.active).length)
const brandsWithProducts = computed(() => {
  return productStore.brands.filter(brand =>
    productStore.products.some(product => product.brand_id === brand.id)
  ).length
})

const formInitialValues = computed(() => {
  if (editingBrand.value) {
    return {
      name: editingBrand.value.name,
      code: editingBrand.value.code || '',
      active: editingBrand.value.active
    }
  }
  return {
    name: '',
    code: '',
    active: true
  }
})

// Options
const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'true', label: 'Activas' },
  { value: 'false', label: 'Inactivas' }
]

// Methods
const handleSearch = (query: string | number) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    searchQuery.value = query
  }, 300)
}

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
}

const getBrandProductCount = (brandId: string) => {
  return productStore.products.filter(product => product.brand_id === brandId).length
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const editBrand = (brand: Brand) => {
  editingBrand.value = brand
  showCreateForm.value = false
}

const closeForm = () => {
  showCreateForm.value = false
  editingBrand.value = null
}

const handleSubmit = async (data: any) => {
  formLoading.value = true

  try {
    if (!authStore.currentCompany?.id) {
      throw new Error('No company selected')
    }

    const brandData = {
      name: data.name,
      code: data.code || null, // Convert empty string to null
      company_id: authStore.currentCompany.id
    }

    if (editingBrand.value) {
      await productStore.updateBrand(editingBrand.value.id, brandData as BrandUpdate)
      alert('Marca actualizada correctamente')
    } else {
      await productStore.createBrand(brandData as BrandInsert)
      alert('Marca creada correctamente')
    }

    closeForm()
  } catch (error) {
    console.error('Error saving brand:', error)
    alert('Error al guardar la marca')
  } finally {
    formLoading.value = false
  }
}

const toggleBrandStatus = async (brand: Brand) => {
  try {
    await productStore.updateBrand(brand.id, { active: !brand.active })
    alert(`Marca ${brand.active ? 'desactivada' : 'activada'} correctamente`)
  } catch (error) {
    console.error('Error toggling brand status:', error)
    alert('Error al cambiar el estado de la marca')
  }
}

const deleteBrand = async (brand: Brand) => {
  const productCount = getBrandProductCount(brand.id)

  if (productCount > 0) {
    alert(`No se puede eliminar la marca "${brand.name}" porque tiene ${productCount} producto(s) asociado(s).`)
    return
  }

  if (confirm(`¿Estás seguro de que quieres eliminar la marca "${brand.name}"?`)) {
    try {
      await productStore.deleteBrand(brand.id)
      alert('Marca eliminada correctamente')
    } catch (error) {
      console.error('Error deleting brand:', error)
      alert('Error al eliminar la marca')
    }
  }
}

// Lifecycle
onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      productStore.loadBrands(),
      productStore.loadProducts() // Needed for product count
    ])
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    loading.value = false
  }
})
</script>
