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
        <p class="text-center text-gray-500 dark:text-gray-400">
          Funcionalidad de selección de empresa en desarrollo...
        </p>

        <div class="mt-6">
          <router-link
            to="/dashboard"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Ir al Dashboard
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Placeholder component for company selection
</script>
