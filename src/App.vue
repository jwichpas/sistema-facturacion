<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/layout/AppLayout.vue'

const route = useRoute()
const authStore = useAuthStore()

// Routes that should not use the main layout
const noLayoutRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/select-company',
  '/no-companies',
  '/403',
  '/404',
  '/500',
]

const shouldUseLayout = computed(() => {
  return (
    authStore.isAuthenticated && authStore.currentCompany && !noLayoutRoutes.includes(route.path)
  )
})
</script>

<template>
  <AppLayout v-if="shouldUseLayout">
    <RouterView />
  </AppLayout>
  <RouterView v-else />
</template>
