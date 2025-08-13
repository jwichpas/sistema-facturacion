<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
          Seleccionar Empresa
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Selecciona la empresa con la que deseas trabajar
        </p>
      </div>

      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <!-- Loading state -->
        <div v-if="authStore.loading" class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p class="mt-4 text-gray-500 dark:text-gray-400">Cargando empresas...</p>
        </div>

        <!-- Error state -->
        <div v-else-if="authStore.error" class="text-center">
          <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p class="text-sm text-red-600 dark:text-red-400">{{ authStore.error }}</p>
          </div>
          <button
            @click="loadCompanies"
            class="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Reintentar
          </button>
        </div>

        <!-- No companies state -->
        <div v-else-if="!authStore.availableCompanies || authStore.availableCompanies.length === 0" class="text-center">
          <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
            <p class="text-sm text-yellow-600 dark:text-yellow-400">
              No tienes empresas asignadas. Contacta al administrador del sistema.
            </p>
          </div>
        </div>

        <!-- Companies list -->
        <div v-else class="space-y-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Empresas disponibles ({{ authStore.availableCompanies.length }})
          </h3>

          <div class="space-y-3">
            <div
              v-for="companyAccess in authStore.availableCompanies"
              :key="companyAccess.company.id"
              class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              @click="selectCompany(companyAccess.company)"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ companyAccess.company.trade_name || companyAccess.company.legal_name }}
                  </h4>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    RUC: {{ companyAccess.company.ruc }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Rol: {{ companyAccess.role }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ companyAccess.company.legal_name }}
                  </p>
                </div>
                <div class="ml-4">
                  <svg
                    class="h-5 w-5 text-gray-400 dark:text-gray-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Debug info (solo en desarrollo) -->
        <div v-if="isDevelopment" class="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <h4 class="text-sm font-bold text-gray-900 dark:text-white mb-2">Debug Info:</h4>
          <pre class="text-xs text-gray-600 dark:text-gray-300 overflow-auto">{{ debugInfo }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { Company } from '@/types'

const router = useRouter()
const authStore = useAuthStore()

const isDevelopment = computed(() => import.meta.env.MODE === 'development')

const debugInfo = computed(() => ({
  user: authStore.user?.id,
  companiesCount: authStore.availableCompanies?.length || 0,
  currentCompany: authStore.currentCompany?.id,
  loading: authStore.loading,
  error: authStore.error,
  availableCompanies: authStore.availableCompanies?.map(ca => ({
    companyId: ca.company.id,
    companyName: ca.company.legal_name,
    role: ca.role,
    isActive: ca.isActive
  }))
}))

const loadCompanies = async () => {
  try {
    await authStore.loadUserCompanies()
  } catch (error) {
    console.error('Error loading companies:', error)
  }
}

const selectCompany = async (company: Company) => {
  try {
    await authStore.setCurrentCompany(company)

    // Redirigir al dashboard después de seleccionar la empresa
    router.push('/dashboard')
  } catch (error) {
    console.error('Error selecting company:', error)
  }
}

onMounted(async () => {
  // Si ya hay una empresa seleccionada, redirigir al dashboard
  if (authStore.currentCompany) {
    router.push('/dashboard')
    return
  }

  // Si no hay empresas cargadas, cargarlas
  if (!authStore.availableCompanies || authStore.availableCompanies.length === 0) {
    await loadCompanies()
  }

  // Si después de cargar solo hay una empresa, seleccionarla automáticamente
  if (authStore.availableCompanies?.length === 1) {
    await selectCompany(authStore.availableCompanies[0].company)
  }
})
</script>
