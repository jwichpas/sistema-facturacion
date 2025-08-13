<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-gray-900 dark:text-white">404</h1>
      <p class="text-xl text-gray-600 dark:text-gray-400 mt-4">Página No Encontrada</p>
      <p class="text-gray-500 dark:text-gray-500 mt-2">La página que buscas no existe</p>
      <router-link
        to="/dashboard"
        class="mt-6 inline-block bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
      >
        Volver al Dashboard
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
// 404 Not Found error page
</script>
