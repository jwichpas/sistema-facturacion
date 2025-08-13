<template>
  <header class="bg-white shadow-sm dark:bg-gray-800">
    <div class="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
      <!-- Left section -->
      <div class="flex items-center">
        <!-- Mobile menu button -->
        <button
          v-if="isMobile"
          @click="uiStore.toggleSidebar"
          class="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white lg:hidden"
        >
          <Menu class="h-6 w-6" />
        </button>

        <!-- Page title -->
        <div class="ml-4 lg:ml-0">
          <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ pageTitle }}
          </h1>
          <p v-if="pageDescription" class="text-sm text-gray-500 dark:text-gray-400">
            {{ pageDescription }}
          </p>
        </div>
      </div>

      <!-- Right section -->
      <div class="flex items-center space-x-4">
        <!-- Global search -->
        <button
          @click="uiStore.openGlobalSearch"
          class="hidden rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 sm:flex sm:items-center sm:space-x-2"
        >
          <Search class="h-4 w-4" />
          <span>{{ $t('common.search') }}</span>
          <kbd
            class="ml-2 inline-flex items-center rounded border border-gray-200 px-1 font-sans text-xs text-gray-400 dark:border-gray-600 dark:text-gray-500"
          >
            ⌘K
          </kbd>
        </button>

        <!-- Mobile search button -->
        <button
          @click="uiStore.openGlobalSearch"
          class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white sm:hidden"
        >
          <Search class="h-5 w-5" />
        </button>

        <!-- Theme toggle -->
        <button
          @click="toggleTheme"
          class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
        >
          <Sun v-if="uiStore.theme === 'dark'" class="h-5 w-5" />
          <Moon v-else class="h-5 w-5" />
        </button>

        <!-- Notifications -->
        <div class="relative">
          <button
            @click="showNotifications = !showNotifications"
            class="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <Bell class="h-5 w-5" />
            <span
              v-if="uiStore.unreadNotificationCount > 0"
              class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white"
            >
              {{ uiStore.unreadNotificationCount > 9 ? '9+' : uiStore.unreadNotificationCount }}
            </span>
          </button>

          <!-- Notifications dropdown -->
          <div
            v-if="showNotifications"
            v-click-outside="() => (showNotifications = false)"
            class="absolute right-0 z-50 mt-2 w-80 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700"
          >
            <div class="p-4">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ $t('common.notifications') }}
                </h3>
                <button
                  v-if="uiStore.notifications.length > 0"
                  @click="uiStore.markAllNotificationsAsRead"
                  class="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  {{ $t('common.markAllAsRead') }}
                </button>
              </div>

              <div class="mt-4 max-h-64 overflow-y-auto">
                <div
                  v-if="uiStore.notifications.length === 0"
                  class="py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  {{ $t('common.noNotifications') }}
                </div>

                <div
                  v-for="notification in uiStore.notifications"
                  :key="notification.id"
                  :class="[
                    'mb-2 rounded-lg p-3 text-sm',
                    {
                      'bg-gray-50 dark:bg-gray-700': notification.read,
                      'bg-indigo-50 dark:bg-indigo-900/20': !notification.read,
                    },
                  ]"
                >
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <p class="font-medium text-gray-900 dark:text-white">
                        {{ notification.title }}
                      </p>
                      <p class="mt-1 text-gray-600 dark:text-gray-300">
                        {{ notification.message }}
                      </p>
                      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {{ formatDate(notification.timestamp) }}
                      </p>
                    </div>
                    <button
                      @click="uiStore.removeNotification(notification.id)"
                      class="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X class="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Company selector -->
        <div class="relative">
          <button
            @click="showCompanySelector = !showCompanySelector"
            class="flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            <Building2 class="mr-2 h-4 w-4" />
            <span class="hidden sm:block">
              {{
                authStore.currentCompany?.trade_name ||
                authStore.currentCompany?.legal_name ||
                $t('common.selectCompany')
              }}
            </span>
            <ChevronDown class="ml-2 h-4 w-4" />
          </button>

          <!-- Company selector dropdown -->
          <div
            v-if="showCompanySelector"
            v-click-outside="() => (showCompanySelector = false)"
            class="absolute right-0 z-50 mt-2 w-64 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700"
          >
            <div class="p-2">
              <div
                v-for="company in authStore.availableCompanies"
                :key="company.id"
                @click="selectCompany(company)"
                :class="[
                  'flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700',
                  {
                    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200':
                      company.id === authStore.currentCompany?.id,
                  },
                ]"
              >
                <Building2 class="mr-3 h-4 w-4" />
                <div class="flex-1 overflow-hidden">
                  <p class="truncate font-medium">
                    {{ company.trade_name || company.legal_name }}
                  </p>
                  <p class="truncate text-xs text-gray-500 dark:text-gray-400">
                    {{ company.ruc }}
                  </p>
                </div>
                <Check v-if="company.id === authStore.currentCompany?.id" class="ml-2 h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        <!-- User menu -->
        <div class="relative">
          <button
            @click="showUserMenu = !showUserMenu"
            class="flex items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-800"
          >
            <div class="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
              <span class="text-sm font-medium text-white">
                {{ userInitials }}
              </span>
            </div>
          </button>

          <!-- User menu dropdown -->
          <div
            v-if="showUserMenu"
            v-click-outside="() => (showUserMenu = false)"
            class="absolute right-0 z-50 mt-2 w-48 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700"
          >
            <div class="p-2">
              <router-link
                to="/profile"
                class="flex items-center rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                @click="showUserMenu = false"
              >
                <User class="mr-3 h-4 w-4" />
                {{ $t('nav.profile') }}
              </router-link>

              <router-link
                to="/settings"
                class="flex items-center rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                @click="showUserMenu = false"
              >
                <Settings class="mr-3 h-4 w-4" />
                {{ $t('nav.settings') }}
              </router-link>

              <hr class="my-2 border-gray-200 dark:border-gray-600" />

              <button
                @click="handleLogout"
                class="flex w-full items-center rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <LogOut class="mr-3 h-4 w-4" />
                {{ $t('auth.logout') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref, inject, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { formatDate } from '@/utils/format'
import type { Company } from '@/types'
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  Building2,
  ChevronDown,
  Check,
  User,
  Settings,
  LogOut,
  X,
} from 'lucide-vue-next'

const uiStore = useUIStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

// Mobile detection (injected from parent)
const isMobile = inject('isMobile', ref(false))

// Dropdown states
const showNotifications = ref(false)
const showCompanySelector = ref(false)
const showUserMenu = ref(false)

// Computed properties
const pageTitle = computed(() => {
  return (route.meta.title as string) || 'Sistema ERP'
})

const pageDescription = computed(() => {
  return route.meta.description as string
})

const userInitials = computed(() => {
  const name = authStore.user?.user_metadata?.full_name || authStore.user?.email || ''
  return name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

// Methods
const toggleTheme = () => {
  const currentTheme = uiStore.theme
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
  uiStore.setTheme(newTheme)
}

const selectCompany = async (company: Company) => {
  try {
    await authStore.setCurrentCompany(company)
    showCompanySelector.value = false

    // Refresh current page to update company context
    router.go(0)
  } catch (error) {
    console.error('Error selecting company:', error)
    uiStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'No se pudo cambiar de empresa. Inténtalo de nuevo.',
    })
  }
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Error logging out:', error)
    uiStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'No se pudo cerrar sesión. Inténtalo de nuevo.',
    })
  }
}

// Global search keyboard shortcut
const handleKeydown = (event: KeyboardEvent) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
    event.preventDefault()
    uiStore.openGlobalSearch()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>
