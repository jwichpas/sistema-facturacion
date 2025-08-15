<template>
  <div class="space-y-4">
    <!-- Search and Filters -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar por nombre, documento, email..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              @input="debouncedSearch"
            />
          </div>
        </div>

        <div class="flex gap-2">
          <select
            v-model="selectedDocType"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            @change="applyFilters"
          >
            <option value="">Todos los documentos</option>
            <option
              v-for="docType in documentTypes"
              :key="docType.code"
              :value="docType.code"
            >
              {{ docType.description }}
            </option>
          </select>

          <select
            v-model="selectedType"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            @change="applyFilters"
          >
            <option value="">Todos</option>
            <option value="customer">Solo Clientes</option>
            <option value="supplier">Solo Proveedores</option>
          </select>

          <button
            @click="clearFilters"
            class="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            title="Limpiar filtros"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Results Summary -->
    <div class="flex justify-between items-center">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        {{ filteredParties.length }} {{ filteredParties.length === 1 ? 'resultado' : 'resultados' }}
      </p>

      <button
        @click="$emit('create')"
        class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <Plus class="h-4 w-4 mr-2" />
        Nuevo
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <div class="flex">
        <AlertCircle class="h-5 w-5 text-red-400 mr-2 mt-0.5" />
        <div>
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error al cargar datos</h3>
          <p class="text-sm text-red-700 dark:text-red-300 mt-1">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredParties.length === 0" class="text-center py-12">
      <Users class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
        {{ searchQuery || selectedDocType || selectedType ? 'No se encontraron resultados' : 'No hay registros' }}
      </h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ searchQuery || selectedDocType || selectedType
          ? 'Intenta ajustar los filtros de búsqueda'
          : 'Comienza agregando un nuevo cliente o proveedor'
        }}
      </p>
    </div>

    <!-- Party List -->
    <div v-else class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Información
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Documento
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Tipo
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Contacto
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="party in filteredParties"
              :key="party.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              @click="$emit('edit', party as any)"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      <User class="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ party.fullname || 'Sin nombre' }}
                    </div>
                    <div v-if="party.email" class="text-sm text-gray-500 dark:text-gray-400">
                      {{ party.email }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">{{ party.doc_number }}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ getDocumentTypeDescription(party.doc_type) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex space-x-1">
                  <span
                    v-if="party.is_customer"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  >
                    Cliente
                  </span>
                  <span
                    v-if="party.is_supplier"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    Proveedor
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                <div v-if="party.phone" class="flex items-center">
                  <Phone class="h-4 w-4 mr-1" />
                  {{ party.phone }}
                </div>
                <div v-if="party.address" class="flex items-center mt-1">
                  <MapPin class="h-4 w-4 mr-1" />
                  {{ party.address }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end space-x-2">
                  <button
                    @click.stop="$emit('edit', party as any)"
                    class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    title="Editar"
                  >
                    <Edit2 class="h-4 w-4" />
                  </button>
                  <button
                    @click.stop="$emit('view', party as any)"
                    class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                    title="Ver detalles"
                  >
                    <Eye class="h-4 w-4" />
                  </button>
                  <button
                    @click.stop="$emit('delete', party as any)"
                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    title="Eliminar"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { debounce } from 'lodash-es'
import {
  Search,
  Plus,
  X,
  Users,
  User,
  Phone,
  MapPin,
  Edit2,
  Eye,
  Trash2,
  AlertCircle
} from 'lucide-vue-next'
import { usePartyStore } from '@/stores/party'
import type { Party, DocumentType } from '@/types'

interface Props {
  type?: 'all' | 'customers' | 'suppliers'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'all'
})

const emit = defineEmits<{
  create: []
  select: [party: Party]
  edit: [party: Party]
  view: [party: Party]
  delete: [party: Party]
}>()

const partyStore = usePartyStore()

// Local state
const searchQuery = ref('')
const selectedDocType = ref('')
const selectedType = ref('')

// Computed properties
const filteredParties = computed(() => {
  let parties = partyStore.filteredParties

  // Apply type filter based on props
  if (props.type === 'customers') {
    parties = parties.filter(p => p.is_customer)
  } else if (props.type === 'suppliers') {
    parties = parties.filter(p => p.is_supplier)
  }

  return parties
})

const loading = computed(() => partyStore.loading)
const error = computed(() => partyStore.error)
const documentTypes = computed(() => partyStore.documentTypes)

// Methods
const getDocumentTypeDescription = (code: string): string => {
  const docType = documentTypes.value.find(dt => dt.code === code)
  return docType?.description || code
}

const applyFilters = () => {
  const filters: any = {}

  if (searchQuery.value.trim()) {
    filters.search = searchQuery.value.trim()
  }

  if (selectedDocType.value) {
    filters.docType = selectedDocType.value
  }

  if (selectedType.value === 'customer') {
    filters.isCustomer = true
  } else if (selectedType.value === 'supplier') {
    filters.isSupplier = true
  }

  partyStore.updateFilters(filters)
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedDocType.value = ''
  selectedType.value = ''
  partyStore.clearFilters()
}

const debouncedSearch = debounce(() => {
  applyFilters()
}, 300)

// Watch for search query changes
watch(searchQuery, () => {
  debouncedSearch()
})

// Initialize
onMounted(() => {
  if (!partyStore.hasParties) {
    partyStore.loadParties()
  }
})
</script>
