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
            @click="handleNotificationToggle"
            class="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <Bell class="h-5 w-5" />
            <span
              v-if="notificationsStore.unreadCount.value > 0"
              class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white"
            >
              {{ notificationsStore.unreadCount.value > 9 ? '9+' : notificationsStore.unreadCount.value }}
            </span>
          </button>

          <!-- Notifications dropdown -->
          <div
            v-if="showNotifications"
            class="absolute right-0 z-50 mt-2 w-96 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700"
          >
            <div class="p-4">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ $t('notifications.title') }}
                </h3>
                <div class="flex items-center space-x-2">
                  <button
                    @click="handleMarkAllAsRead"
                    class="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                  >
                    {{ $t('notifications.markAllAsRead') }}
                  </button>
                  <button
                    @click="handleRefreshNotifications"
                    class="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    🔄
                  </button>
                </div>
              </div>

              <div class="max-h-80 overflow-y-auto">
                <!-- Real notifications from database -->
                <div v-if="notificationsStore.notifications.value.length > 0" class="space-y-2">
                  <div
                    v-for="notification in notificationsStore.notifications.value"
                    :key="(notification as unknown as Notification).id"
                    @click="handleNotificationClick(notification as unknown as Notification)"
                    :class="[
                      'flex items-start space-x-3 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer',
                      {
                        'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500': !(notification as unknown as Notification).read_at,
                        'opacity-70': (notification as unknown as Notification).read_at
                      }
                    ]"
                  >
                    <div class="flex-shrink-0">
                      <div :class="[
                        'h-8 w-8 rounded-full flex items-center justify-center',
                        getNotificationIconStyle((notification as unknown as Notification).type)
                      ]">
                        <Bell class="h-4 w-4" :class="getNotificationIconColor((notification as unknown as Notification).type)" />
                      </div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <p class="text-sm font-medium text-gray-900 dark:text-white">
                          {{ (notification as unknown as Notification).title }}
                        </p>
                        <span
                          v-if="!(notification as unknown as Notification).read_at"
                          :class="['h-2 w-2 rounded-full', getNotificationDotColor((notification as unknown as Notification).type)]"
                        ></span>
                      </div>
                      <p class="text-sm text-gray-500 dark:text-gray-400">
                        {{ (notification as unknown as Notification).message }}
                      </p>
                      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {{ notificationsStore.formatRelativeTime((notification as unknown as Notification).created_at) }}
                      </p>
                    </div>
                    <div class="flex-shrink-0">
                      <button
                        @click.stop="handleDeleteNotification((notification as unknown as Notification).id)"
                        class="text-gray-400 hover:text-gray-600"
                      >
                        <span class="sr-only">Cerrar</span>
                        ×
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Empty state -->
                <div v-else class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  {{ $t('notifications.empty') }}
                </div>
              </div>

              <div class="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
                <button
                  @click="showNotifications = false"
                  class="w-full text-center text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  {{ $t('notifications.viewAll') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Company selector -->
        <CompanySelector
          @company-changed="handleCompanyChanged"
          @error="handleCompanySelectorError"
        />

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
import { useNotifications } from '@/composables/useNotifications'
import CompanySelector from '@/components/ui/CompanySelector.vue'
import type { Company } from '@/types'

// Define notification type for better TypeScript support
interface Notification {
  id: string
  title: string
  message: string
  type: string
  read_at: string | null
  created_at: string
}
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  User,
  Settings,
  LogOut,
} from 'lucide-vue-next'

const uiStore = useUIStore()
const authStore = useAuthStore()
const notificationsStore = useNotifications()
const route = useRoute()
const router = useRouter()

// Mobile detection (injected from parent)
const isMobile = inject('isMobile', ref(false))

// Dropdown states
const showNotifications = ref(false)
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

const handleCompanyChanged = (company: Company) => {
  // Refresh current page to update company context
  router.go(0)
}

const handleCompanySelectorError = (error: string) => {
  uiStore.addNotification({
    type: 'error',
    title: 'Error',
    message: error,
  })
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

// Notification methods
const handleNotificationToggle = () => {
  console.log('Notification button clicked, current state:', showNotifications.value)
  showNotifications.value = !showNotifications.value
  console.log('New state:', showNotifications.value)
}

const handleMarkAllAsRead = async () => {
  console.log('Mark all as read clicked')
  await notificationsStore.markAllAsRead()
  showNotifications.value = false
}

const handleRefreshNotifications = async () => {
  console.log('Refresh notifications clicked')
  await notificationsStore.loadNotifications()
}

const handleNotificationClick = async (notification: Notification) => {
  if (!notification.read_at) {
    await notificationsStore.markAsRead(notification.id)
  }
  // Here you could add navigation logic based on notification type/data
}

const handleDeleteNotification = async (notificationId: string) => {
  await notificationsStore.deleteNotification(notificationId)
}

// Helper functions for notification styling
const getNotificationIconStyle = (type: string) => {
  const styles = {
    info: 'bg-blue-100',
    warning: 'bg-yellow-100',
    success: 'bg-green-100',
    error: 'bg-red-100'
  }
  return styles[type as keyof typeof styles] || styles.info
}

const getNotificationIconColor = (type: string) => {
  const colors = {
    info: 'text-blue-600',
    warning: 'text-yellow-600',
    success: 'text-green-600',
    error: 'text-red-600'
  }
  return colors[type as keyof typeof colors] || colors.info
}

const getNotificationDotColor = (type: string) => {
  const colors = {
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
    success: 'bg-green-500',
    error: 'bg-red-500'
  }
  return colors[type as keyof typeof colors] || colors.info
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
