<template>
  <div class="relative">
    <!-- Search Input -->
    <div class="relative">
      <input ref="searchInput" v-model="searchQuery" type="text" :placeholder="placeholder" :required="required"
        class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm pr-10"
        @focus="showDropdown = true" @input="handleSearch" @keydown="handleKeydown" />

      <!-- Search Icon -->
      <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <Search class="h-4 w-4 text-gray-400" />
      </div>
    </div>

    <!-- Dropdown -->
    <div v-if="showDropdown"
      class="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
      <!-- Loading -->
      <div v-if="loading" class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
        <div class="flex items-center">
          <RotateCcw class="animate-spin h-4 w-4 mr-2" />
          Buscando proveedores...
        </div>
      </div>

      <!-- No results -->
      <div v-else-if="filteredSuppliers.length === 0 && searchQuery"
        class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
        No se encontraron proveedores
      </div>

      <!-- Create new supplier option -->
      <div v-if="searchQuery && !loading && filteredSuppliers.length === 0"
        class="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
        @click="showCreateModal = true">
        <div class="flex items-center">
          <Plus class="h-4 w-4 mr-2" />
          Crear nuevo proveedor "{{ searchQuery }}"
        </div>
      </div>

      <!-- Supplier list -->
      <div v-for="(supplier, index) in filteredSuppliers" :key="supplier.id" :class="[
        'px-4 py-2 cursor-pointer',
        index === selectedIndex ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
      ]" @click="selectSupplier(supplier)">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-medium text-gray-900 dark:text-white">
              {{ supplier.fullname || 'Sin nombre' }}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              {{ supplier.doc_type }}-{{ supplier.doc_number }}
            </div>
            <div v-if="supplier.email" class="text-xs text-gray-400 dark:text-gray-500">
              {{ supplier.email }}
            </div>
          </div>

          <!-- Supplier type badge -->
          <div class="flex items-center space-x-1">
            <span v-if="supplier.is_supplier"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Proveedor
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected supplier display -->
    <div v-if="selectedSupplier && !showDropdown" class="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm font-medium text-gray-900 dark:text-white">
            {{ selectedSupplier.fullname }}
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400">
            {{ selectedSupplier.doc_type }}-{{ selectedSupplier.doc_number }}
          </div>
        </div>

        <button type="button" @click="clearSelection"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <X class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Create Supplier Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      @click="showCreateModal = false">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Crear Nuevo Proveedor
          </h3>

          <form @submit.prevent="createSupplier" class="space-y-4">
            <!-- Document Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Documento *
              </label>
              <select v-model="newSupplier.doc_type" required
                class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                <option value="">Seleccionar...</option>
                <option value="1">DNI</option>
                <option value="6">RUC</option>
                <option value="4">Carnet de Extranjería</option>
                <option value="7">Pasaporte</option>
              </select>
            </div>

            <!-- Document Number -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Número de Documento *
              </label>
              <input v-model="newSupplier.doc_number" type="text" required
                class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>

            <!-- Name fields based on document type -->
            <div v-if="newSupplier.doc_type === '6'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Razón Social *
              </label>
              <input v-model="newSupplier.razon_social" type="text" required
                class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>

            <div v-else class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombres *
                </label>
                <input v-model="newSupplier.nombres" type="text" required
                  class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Apellido Paterno *
                </label>
                <input v-model="newSupplier.apellido_paterno" type="text" required
                  class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Apellido Materno
                </label>
                <input v-model="newSupplier.apellido_materno" type="text"
                  class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
              </div>
            </div>

            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input v-model="newSupplier.email" type="email"
                class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>

            <!-- Phone -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Teléfono
              </label>
              <input v-model="newSupplier.phone" type="tel"
                class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3 mt-6">
              <button type="button" @click="showCreateModal = false"
                class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-400 dark:hover:bg-gray-500">
                Cancelar
              </button>
              <button type="submit" :disabled="creatingSupplier"
                class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50">
                {{ creatingSupplier ? 'Creando...' : 'Crear Proveedor' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { usePartyStore } from '@/stores/party'
import { useAuthStore } from '@/stores/auth'
import type { Party } from '@/types'
import {
  Search,
  RotateCcw,
  Plus,
  X
} from 'lucide-vue-next'

// Props
interface Props {
  modelValue?: string
  placeholder?: string
  required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Buscar proveedor...',
  required: false
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'supplier-selected': [supplier: Party]
}>()

// Store
const partyStore = usePartyStore()
const authStore = useAuthStore()

// Reactive state
const searchInput = ref<HTMLInputElement>()
const searchQuery = ref('')
const showDropdown = ref(false)
const selectedIndex = ref(-1)
const loading = ref(false)
const showCreateModal = ref(false)
const creatingSupplier = ref(false)

// Selected supplier
const selectedSupplier = ref<Party | null>(null)

// New supplier form
const newSupplier = ref({
  doc_type: '',
  doc_number: '',
  nombres: '',
  apellido_paterno: '',
  apellido_materno: '',
  razon_social: '',
  email: '',
  phone: ''
})

// Suppliers list
const suppliers = ref<Party[]>([])

// Computed
const filteredSuppliers = computed(() => {
  if (!searchQuery.value) return suppliers.value.slice(0, 10)

  const query = searchQuery.value.toLowerCase()
  return suppliers.value.filter(supplier =>
    supplier.fullname?.toLowerCase().includes(query) ||
    supplier.doc_number.includes(query) ||
    supplier.email?.toLowerCase().includes(query) ||
    supplier.razon_social?.toLowerCase().includes(query)
  ).slice(0, 10)
})

// Methods
const handleSearch = async () => {
  if (searchQuery.value.length < 2) {
    suppliers.value = []
    return
  }

  loading.value = true

  try {
    const results = await partyStore.searchParties(searchQuery.value, 'supplier')
    suppliers.value = results
  } catch (error) {
    console.error('Error searching suppliers:', error)
    suppliers.value = []
  } finally {
    loading.value = false
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!showDropdown.value) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, filteredSuppliers.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
      break
    case 'Enter':
      event.preventDefault()
      if (selectedIndex.value >= 0 && filteredSuppliers.value[selectedIndex.value]) {
        selectSupplier(filteredSuppliers.value[selectedIndex.value])
      }
      break
    case 'Escape':
      showDropdown.value = false
      selectedIndex.value = -1
      break
  }
}

const selectSupplier = (supplier: Party) => {
  selectedSupplier.value = supplier
  searchQuery.value = supplier.fullname || ''
  showDropdown.value = false
  selectedIndex.value = -1

  emit('update:modelValue', supplier.id)
  emit('supplier-selected', supplier)
}

const clearSelection = () => {
  selectedSupplier.value = null
  searchQuery.value = ''
  emit('update:modelValue', '')
}

const createSupplier = async () => {
  creatingSupplier.value = true

  try {
    const companyId = authStore.currentCompany?.id
    if (!companyId) {
      throw new Error('No company selected')
    }

    const supplier = await partyStore.createParty({
      ...newSupplier.value,
      is_supplier: true,
      is_customer: false,
      company_id: companyId
    })

    if (supplier) {
      selectSupplier(supplier)
      showCreateModal.value = false

      // Reset form
      newSupplier.value = {
        doc_type: '',
        doc_number: '',
        nombres: '',
        apellido_paterno: '',
        apellido_materno: '',
        razon_social: '',
        email: '',
        phone: ''
      }
    }
  } catch (error) {
    console.error('Error creating supplier:', error)
  } finally {
    creatingSupplier.value = false
  }
}

// Handle clicks outside to close dropdown
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    showDropdown.value = false
    selectedIndex.value = -1
  }
}

// Load initial suppliers
const loadSuppliers = async () => {
  loading.value = true

  try {
    await partyStore.loadSuppliers()
    suppliers.value = partyStore.suppliersOnly.slice(0, 20) // Limit initial load
  } catch (error) {
    console.error('Error loading suppliers:', error)
  } finally {
    loading.value = false
  }
}

// Watch for modelValue changes (external updates)
watch(() => props.modelValue, async (newValue) => {
  if (newValue && !selectedSupplier.value) {
    // Load supplier by ID
    try {
      await partyStore.loadParty(newValue)
      const supplier = partyStore.currentParty
      if (supplier) {
        selectedSupplier.value = supplier
        searchQuery.value = supplier.fullname || ''
      }
    } catch (error) {
      console.error('Error loading supplier:', error)
    }
  } else if (!newValue) {
    clearSelection()
  }
})

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  loadSuppliers()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
