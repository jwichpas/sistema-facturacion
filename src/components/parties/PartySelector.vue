<template>
  <div class="relative">
    <!-- Main selector button/input -->
    <div class="relative">
      <button
        v-if="!isOpen && selectedParty"
        @click="toggleDropdown"
        class="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-left hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <div class="flex items-center space-x-2 flex-1 min-w-0">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <User class="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {{ selectedParty.fullname }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
              {{ selectedParty.doc_type }} - {{ selectedParty.doc_number }}
            </p>
          </div>
        </div>
        <ChevronDown class="w-4 h-4 text-gray-400" />
      </button>

      <div
        v-else
        class="relative"
      >
        <input
          ref="searchInput"
          v-model="searchQuery"
          @input="handleSearch"
          @focus="openDropdown"
          @keydown="handleKeydown"
          :placeholder="placeholder"
          class="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />

        <button
          v-if="searchQuery"
          @click="clearSearch"
          class="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X class="w-4 h-4" />
        </button>

        <button
          @click="toggleDropdown"
          class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <ChevronDown :class="{ 'rotate-180': isOpen }" class="w-4 h-4 transition-transform" />
        </button>
      </div>
    </div>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-80 overflow-hidden"
      >
        <!-- Loading state -->
        <div v-if="loading" class="p-4 text-center">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Buscando...</p>
        </div>

        <!-- No results -->
        <div v-else-if="searchResults.length === 0 && searchQuery" class="p-4 text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
            No se encontraron resultados para "{{ searchQuery }}"
          </p>
          <button
            @click="openCreateModal"
            class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus class="w-4 h-4 mr-1" />
            Crear nuevo
          </button>
        </div>

        <!-- Search results -->
        <div v-else class="max-h-64 overflow-y-auto">
          <div
            v-for="(party, index) in searchResults"
            :key="party.id"
            @click="selectParty(party)"
            @mouseenter="highlightedIndex = index"
            :class="[
              'px-4 py-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0',
              highlightedIndex === index
                ? 'bg-blue-50 dark:bg-blue-900/20'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
            ]"
          >
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <User class="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {{ party.fullname }}
                </p>
                <div class="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{{ party.doc_type }} - {{ party.doc_number }}</span>
                  <span v-if="party.is_customer && party.is_supplier">•</span>
                  <span v-if="party.is_customer" class="text-green-600 dark:text-green-400">Cliente</span>
                  <span v-if="party.is_supplier" class="text-blue-600 dark:text-blue-400">Proveedor</span>
                </div>
              </div>
              <div v-if="showTransactionSummary && transactionSummaries[party.id]" class="flex-shrink-0 text-right">
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ transactionSummaries[party.id].sales_count }} ventas
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ transactionSummaries[party.id].purchases_count }} compras
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick actions -->
        <div class="border-t border-gray-100 dark:border-gray-700 p-2">
          <button
            @click="openCreateModal"
            class="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
          >
            <Plus class="w-4 h-4 mr-2" />
            Crear nuevo {{ partyTypeLabel }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- Quick create modal -->
    <PartyQuickCreateModal
      v-if="showCreateModal"
      :party-type="partyType"
      :initial-search="searchQuery"
      @close="closeCreateModal"
      @created="handlePartyCreated"
    />

    <!-- Transaction history modal -->
    <PartyTransactionHistoryModal
      v-if="showTransactionModal && selectedParty"
      :party="selectedParty"
      @close="closeTransactionModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Search, ChevronDown, X, User, Plus } from 'lucide-vue-next'
import { usePartyStore } from '@/stores/party'
import type { PartyTransactionSummary } from '@/types'
import type { Party } from '@/services/party'
import PartyQuickCreateModal from './PartyQuickCreateModal.vue'
import PartyTransactionHistoryModal from './PartyTransactionHistoryModal.vue'

interface Props {
  modelValue?: Party | null
  partyType?: 'customer' | 'supplier' | 'both'
  placeholder?: string
  showTransactionSummary?: boolean
  disabled?: boolean
  required?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: Party | null): void
  (e: 'select', party: Party): void
  (e: 'create', party: Party): void
}

const props = withDefaults(defineProps<Props>(), {
  partyType: 'both',
  placeholder: 'Buscar cliente o proveedor...',
  showTransactionSummary: false,
  disabled: false,
  required: false
})

const emit = defineEmits<Emits>()

// Store
const partyStore = usePartyStore()

// Refs
const searchInput = ref<HTMLInputElement>()
const isOpen = ref(false)
const searchQuery = ref('')
const loading = ref(false)
const highlightedIndex = ref(-1)
const showCreateModal = ref(false)
const showTransactionModal = ref(false)
const searchResults = ref<any[]>([])
const transactionSummaries = ref<Record<string, PartyTransactionSummary>>({})

// Computed
const selectedParty = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value || null)
})

const partyTypeLabel = computed(() => {
  switch (props.partyType) {
    case 'customer': return 'cliente'
    case 'supplier': return 'proveedor'
    default: return 'contacto'
  }
})

// Methods
const toggleDropdown = () => {
  if (props.disabled) return

  if (isOpen.value) {
    closeDropdown()
  } else {
    openDropdown()
  }
}

const openDropdown = async () => {
  isOpen.value = true
  highlightedIndex.value = -1

  await nextTick()
  searchInput.value?.focus()

  // Load initial results if no search query
  if (!searchQuery.value) {
    await loadInitialResults()
  }
}

const closeDropdown = () => {
  isOpen.value = false
  highlightedIndex.value = -1
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  searchInput.value?.focus()
}

const loadInitialResults = async () => {
  loading.value = true
  try {
    let results: any[] = []

    switch (props.partyType) {
      case 'customer':
        results = partyStore.customersOnly.slice(0, 10)
        break
      case 'supplier':
        results = partyStore.suppliersOnly.slice(0, 10)
        break
      default:
        results = partyStore.parties.slice(0, 10)
    }

    searchResults.value = results

    if (props.showTransactionSummary) {
      await loadTransactionSummaries(results)
    }
  } catch (error) {
    console.error('Error loading initial results:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    await loadInitialResults()
    return
  }

  loading.value = true
  try {
    const results = await partyStore.searchParties(
      searchQuery.value,
      props.partyType === 'both' ? undefined : props.partyType
    )

    searchResults.value = results.slice(0, 20) // Limit results

    if (props.showTransactionSummary) {
      await loadTransactionSummaries(results)
    }
  } catch (error) {
    console.error('Error searching parties:', error)
    searchResults.value = []
  } finally {
    loading.value = false
  }
}

const loadTransactionSummaries = async (parties: any[]) => {
  const summaries: Record<string, PartyTransactionSummary> = {}

  await Promise.all(
    parties.map(async (party) => {
      try {
        const summary = await partyStore.getPartyTransactionSummary(party.id)
        if (summary) {
          summaries[party.id] = summary
        }
      } catch (error) {
        console.error(`Error loading transaction summary for party ${party.id}:`, error)
      }
    })
  )

  transactionSummaries.value = summaries
}

const selectParty = (party: any) => {
  selectedParty.value = party
  emit('select', party)
  closeDropdown()
  searchQuery.value = ''
}

const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      if (highlightedIndex.value < searchResults.value.length - 1) {
        highlightedIndex.value++
      }
      break
    case 'ArrowUp':
      event.preventDefault()
      if (highlightedIndex.value > 0) {
        highlightedIndex.value--
      }
      break
    case 'Enter':
      event.preventDefault()
      if (highlightedIndex.value >= 0 && searchResults.value[highlightedIndex.value]) {
        selectParty(searchResults.value[highlightedIndex.value])
      } else if (searchQuery.value && searchResults.value.length === 0) {
        openCreateModal()
      }
      break
    case 'Escape':
      event.preventDefault()
      closeDropdown()
      break
  }
}

const openCreateModal = () => {
  showCreateModal.value = true
  closeDropdown()
}

const closeCreateModal = () => {
  showCreateModal.value = false
}

const handlePartyCreated = (party: Party) => {
  selectedParty.value = party
  emit('create', party)
  emit('select', party)
  closeCreateModal()
}

const openTransactionModal = () => {
  showTransactionModal.value = true
}

const closeTransactionModal = () => {
  showTransactionModal.value = false
}

// Click outside handler
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    closeDropdown()
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Watch for external changes to clear search
watch(() => props.modelValue, (newValue) => {
  if (!newValue) {
    searchQuery.value = ''
  }
})
</script>
