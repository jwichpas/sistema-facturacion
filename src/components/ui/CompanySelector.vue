<template>
  <div class="relative">
    <!-- Company selector button -->
    <button
      @click="toggleDropdown"
      :disabled="loading || switchingCompany"
      class="flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
    >
      <Building2 class="mr-2 h-4 w-4" />
      <div class="flex flex-col items-start min-w-0">
        <span class="hidden sm:block truncate">
          {{
            currentCompany?.trade_name ||
            currentCompany?.legal_name ||
            $t('company.selectCompany')
          }}
        </span>
        <span v-if="currentCompany" class="hidden sm:block text-xs text-gray-500 dark:text-gray-400 truncate">
          {{ formatRUC(currentCompany.ruc) }}
        </span>
      </div>
      <div class="ml-2 flex items-center">
        <Loader2 v-if="switchingCompany" class="h-4 w-4 animate-spin" />
        <ChevronDown v-else class="h-4 w-4" />
      </div>
    </button>

    <!-- Company selector dropdown -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="showDropdown"
        ref="dropdownRef"
        class="absolute right-0 z-50 mt-2 w-80 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700"
      >
        <div class="p-2">
          <!-- Header -->
          <div class="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-600">
            <h3 class="text-sm font-medium text-gray-900 dark:text-white">
              {{ $t('company.selectCompany') }}
            </h3>
            <button
              @click="refreshCompanies"
              :disabled="loading"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
            >
              <RotateCw :class="['h-4 w-4', { 'animate-spin': loading }]" />
            </button>
          </div>

          <!-- Loading state -->
          <div v-if="loading" class="flex items-center justify-center py-8">
            <Loader2 class="h-6 w-6 animate-spin text-gray-400" />
            <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">
              {{ $t('company.loading') }}
            </span>
          </div>

          <!-- Error state -->
          <div v-else-if="error" class="p-3">
            <div class="flex items-center text-red-600 dark:text-red-400">
              <AlertCircle class="h-4 w-4 mr-2" />
              <span class="text-sm">{{ error }}</span>
            </div>
            <button
              @click="refreshCompanies"
              class="mt-2 text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              {{ $t('common.retry') }}
            </button>
          </div>

          <!-- Companies list -->
          <div v-else-if="availableCompanies.length > 0" class="max-h-80 overflow-y-auto">
            <div
              v-for="companyAccess in availableCompanies"
              :key="companyAccess.company.id"
              data-testid="company-item"
              @click="selectCompany(companyAccess.company)"
              :class="[
                'flex cursor-pointer items-start rounded-lg px-3 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                {
                  'bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-200':
                    companyAccess.company.id === currentCompany?.id,
                },
              ]"
            >
              <div class="flex-shrink-0 mr-3 mt-0.5">
                <div :class="[
                  'h-8 w-8 rounded-lg flex items-center justify-center',
                  companyAccess.company.id === currentCompany?.id
                    ? 'bg-indigo-100 dark:bg-indigo-800'
                    : 'bg-gray-100 dark:bg-gray-600'
                ]">
                  <Building2 :class="[
                    'h-4 w-4',
                    companyAccess.company.id === currentCompany?.id
                      ? 'text-indigo-600 dark:text-indigo-300'
                      : 'text-gray-600 dark:text-gray-300'
                  ]" />
                </div>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <p class="font-medium truncate">
                    {{ companyAccess.company.trade_name || companyAccess.company.legal_name }}
                  </p>
                  <Check
                    v-if="companyAccess.company.id === currentCompany?.id"
                    class="ml-2 h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0"
                  />
                </div>

                <div class="mt-1 space-y-1">
                  <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {{ $t('company.ruc') }}: {{ formatRUC(companyAccess.company.ruc) }}
                  </p>

                  <div class="flex items-center justify-between">
                    <span :class="[
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      getRoleBadgeClass(companyAccess.role)
                    ]">
                      {{ companyAccess.role }}
                    </span>

                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      {{ getCurrencySymbol(companyAccess.company.currency_code) }}
                    </span>
                  </div>
                </div>

                <!-- Company details (expanded for current company) -->
                <div v-if="companyAccess.company.id === currentCompany?.id && showCompanyDetails" class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <div class="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <p v-if="companyAccess.company.email">
                      <Mail class="inline h-3 w-3 mr-1" />
                      {{ companyAccess.company.email }}
                    </p>
                    <p v-if="companyAccess.company.phone">
                      <Phone class="inline h-3 w-3 mr-1" />
                      {{ companyAccess.company.phone }}
                    </p>
                    <p v-if="companyAccess.company.address">
                      <MapPin class="inline h-3 w-3 mr-1" />
                      {{ companyAccess.company.address }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-else class="py-8 text-center">
            <Building2 class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              {{ $t('company.noCompanies') }}
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ $t('company.noCompaniesDescription') }}
            </p>
          </div>

          <!-- Footer -->
          <div v-if="availableCompanies.length > 0" class="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
            <button
              @click="toggleCompanyDetails"
              class="w-full text-center text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 py-2"
            >
              {{ showCompanyDetails ? $t('company.hideDetails') : $t('company.showDetails') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { useCompanyStore } from '@/stores/company'
import { formatRUC, getCurrencySymbol } from '@/utils/company'
import type { Company } from '@/types'
import {
  Building2,
  ChevronDown,
  Check,
  Loader2,
  RotateCw,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
} from 'lucide-vue-next'

// Props
interface Props {
  showDetails?: boolean
  autoRefresh?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: true,
  autoRefresh: false
})

// Emits
const emit = defineEmits<{
  companyChanged: [company: Company]
  error: [error: string]
}>()

// Store
const companyStore = useCompanyStore()

// Local state
const showDropdown = ref(false)
const showCompanyDetails = ref(props.showDetails)
const dropdownRef = ref<HTMLElement>()

// Computed properties
const currentCompany = computed(() => companyStore.currentCompany)
const availableCompanies = computed(() => companyStore.availableCompanies)
const loading = computed(() => companyStore.loading)
const switchingCompany = computed(() => companyStore.switchingCompany)
const error = computed(() => companyStore.error)
const hasCompanies = computed(() => companyStore.hasCompanies)
const canSwitchCompany = computed(() => companyStore.canSwitchCompany)

// Methods
const toggleDropdown = () => {
  if (loading.value || switchingCompany.value) return
  showDropdown.value = !showDropdown.value
}

const closeDropdown = () => {
  showDropdown.value = false
}

const selectCompany = async (company: Company) => {
  if (company.id === currentCompany.value?.id) {
    closeDropdown()
    return
  }

  try {
    await companyStore.setCurrentCompany(company)
    emit('companyChanged', company)
    closeDropdown()
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error switching company'
    emit('error', errorMessage)
  }
}

const refreshCompanies = async () => {
  try {
    await companyStore.loadUserCompanies()
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error loading companies'
    emit('error', errorMessage)
  }
}

const toggleCompanyDetails = () => {
  showCompanyDetails.value = !showCompanyDetails.value
}

const getRoleBadgeClass = (role: string) => {
  const roleClasses = {
    'Super Admin': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'Admin': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'Manager': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'Seller': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Viewer': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }

  return roleClasses[role as keyof typeof roleClasses] || roleClasses['Viewer']
}

// Lifecycle
onMounted(() => {
  if (!hasCompanies.value && !loading.value) {
    refreshCompanies()
  }
})

// Auto-refresh companies when prop changes
watch(() => props.autoRefresh, (newValue) => {
  if (newValue) {
    refreshCompanies()
  }
})

// Clear error when dropdown closes
watch(showDropdown, (isOpen) => {
  if (!isOpen && error.value) {
    companyStore.clearError()
  }
})

// Click outside handling
onClickOutside(dropdownRef, () => {
  if (showDropdown.value) {
    closeDropdown()
  }
})
</script>
