<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Mobile sidebar overlay -->
    <div
      v-if="!uiStore.sidebarCollapsed && isMobile"
      class="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
      @click="uiStore.setSidebarCollapsed(true)"
    />

    <!-- Sidebar -->
    <div
      :class="[
        'fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out dark:bg-gray-800',
        {
          '-translate-x-full lg:translate-x-0': uiStore.sidebarCollapsed && isMobile,
          'translate-x-0': !uiStore.sidebarCollapsed || !isMobile,
          'lg:w-16': uiStore.sidebarCollapsed && !isMobile,
          'lg:w-64': !uiStore.sidebarCollapsed && !isMobile,
        },
      ]"
    >
      <AppSidebar />
    </div>

    <!-- Main content -->
    <div
      :class="[
        'transition-all duration-300 ease-in-out',
        {
          'lg:ml-16': uiStore.sidebarCollapsed,
          'lg:ml-64': !uiStore.sidebarCollapsed,
        },
      ]"
    >
      <!-- Top navigation -->
      <AppNavbar />

      <!-- Page content -->
      <main class="flex-1">
        <!-- Breadcrumbs -->
        <AppBreadcrumbs v-if="showBreadcrumbs" />

        <!-- Page content -->
        <div class="px-4 py-6 sm:px-6 lg:px-8">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useUIStore } from '@/stores/ui'
import AppSidebar from './AppSidebar.vue'
import AppNavbar from './AppNavbar.vue'
import AppBreadcrumbs from './AppBreadcrumbs.vue'

interface Props {
  showBreadcrumbs?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showBreadcrumbs: true,
})

const uiStore = useUIStore()

// Mobile detection
const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 1024

  // Auto-collapse sidebar on mobile
  if (isMobile.value && !uiStore.sidebarCollapsed) {
    uiStore.setSidebarCollapsed(true)
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>
