<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
          Sin Empresas Disponibles
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          No tienes acceso a ninguna empresa en el sistema
        </p>
      </div>

      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <p class="text-center text-gray-500 dark:text-gray-400 mb-4">
          Contacta al administrador del sistema para obtener acceso a una empresa.
        </p>

        <div class="mt-6">
          <button
            @click="$router.push('/login')"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Volver al Login
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Placeholder component for no companies available
</script>
