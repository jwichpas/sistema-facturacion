<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Panel de Control</h1>
      <p class="text-gray-600 dark:text-gray-400">
        Bienvenido al sistema ERP, {{ authStore.userName }}
      </p>
    </div>

    <!-- Welcome Card -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div
            class="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center"
          >
            <CheckCircle class="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
        <div class="ml-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Sistema configurado correctamente
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            La autenticación y configuración inicial están funcionando.
          </p>
        </div>
      </div>
    </div>

    <!-- User Info -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Información del Usuario
        </h3>
        <dl class="space-y-2">
          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
            <dd class="text-sm text-gray-900 dark:text-white">{{ authStore.userEmail }}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Nombre</dt>
            <dd class="text-sm text-gray-900 dark:text-white">{{ authStore.userName }}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Rol</dt>
            <dd class="text-sm text-gray-900 dark:text-white">{{ userRole || 'No asignado' }}</dd>
          </div>
        </dl>
      </div>

      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Estado del Sistema</h3>
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-500 dark:text-gray-400">Autenticado</span>
            <span class="text-sm text-success-600 dark:text-success-400">✓ Sí</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-500 dark:text-gray-400">Empresa</span>
            <span class="text-sm text-gray-900 dark:text-white">
              {{ hasCompany ? 'Seleccionada' : 'No seleccionada' }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-500 dark:text-gray-400">Permisos</span>
            <span class="text-sm text-gray-900 dark:text-white"
              >{{ permissionCount }} permisos</span
            >
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Acciones Rápidas</h3>
        <div class="space-y-2">
          <button
            @click="$router.push('/products')"
            class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Ver Productos
          </button>
          <button
            @click="$router.push('/sales')"
            class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Nueva Venta
          </button>
          <button
            @click="$router.push('/reports')"
            class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Ver Reportes
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { CheckCircle } from 'lucide-vue-next'

const authStore = useAuthStore()

const userRole = computed(() => authStore.userRole as string | null)
const hasCompany = computed(() => authStore.hasCompany)
const permissionCount = computed(() => (authStore.userPermissions as string[]).length)
</script>
