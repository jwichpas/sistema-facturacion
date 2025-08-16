<template>
  <div class="flex h-full flex-col">
    <!-- Logo and company info -->
    <div class="flex h-16 items-center justify-between px-4">
      <div
        :class="[
          'flex items-center transition-all duration-300',
          { 'justify-center': uiStore.sidebarCollapsed },
        ]"
      >
        <!-- Logo -->
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
          <span class="text-sm font-bold text-white">ERP</span>
        </div>

        <!-- Company name (hidden when collapsed) -->
        <div v-if="!uiStore.sidebarCollapsed" class="ml-3 flex flex-col overflow-hidden">
          <span class="truncate text-sm font-semibold text-gray-900 dark:text-white">
            {{
              authStore.currentCompany?.trade_name ||
              authStore.currentCompany?.legal_name ||
              'Sistema ERP'
            }}
          </span>
          <span class="truncate text-xs text-gray-500 dark:text-gray-400">
            {{ authStore.currentCompany?.ruc || 'Sin empresa' }}
          </span>
        </div>
      </div>

      <!-- Collapse button (desktop only) -->
      <button
        v-if="!isMobile"
        @click="uiStore.toggleSidebar"
        class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
      >
        <ChevronLeft
          :class="[
            'h-5 w-5 transition-transform duration-300',
            { 'rotate-180': uiStore.sidebarCollapsed },
          ]"
        />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 space-y-1 px-2 py-4">
      <template v-for="item in navigationItems" :key="item.id">
        <!-- Single navigation item -->
        <router-link
          v-if="!item.children && hasPermission(item.permissions)"
          :to="item.route!"
          :class="[
            'group flex items-center rounded-lg px-2 py-2 text-sm font-medium transition-colors duration-200',
            {
              'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200':
                isActiveRoute(item.route!),
              'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white':
                !isActiveRoute(item.route!),
              'justify-center': uiStore.sidebarCollapsed,
            },
          ]"
        >
          <component
            :is="item.icon"
            :class="[
              'h-5 w-5 flex-shrink-0',
              {
                'text-indigo-500 dark:text-indigo-300': isActiveRoute(item.route!),
                'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300':
                  !isActiveRoute(item.route!),
              },
            ]"
          />
          <span v-if="!uiStore.sidebarCollapsed" class="ml-3 truncate">
            {{ $t(item.label) }}
          </span>
        </router-link>

        <!-- Navigation group with children -->
        <div v-else-if="item.children && hasPermission(item.permissions)" class="space-y-1">
          <!-- Group header -->
          <button
            @click="toggleGroup(item.id)"
            :class="[
              'group flex w-full items-center rounded-lg px-2 py-2 text-left text-sm font-medium transition-colors duration-200',
              {
                'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white': true,
                'justify-center': uiStore.sidebarCollapsed,
              },
            ]"
          >
            <component
              :is="item.icon"
              class="h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300"
            />
            <span v-if="!uiStore.sidebarCollapsed" class="ml-3 flex-1 truncate">
              {{ $t(item.label) }}
            </span>
            <ChevronDown
              v-if="!uiStore.sidebarCollapsed"
              :class="[
                'ml-3 h-4 w-4 flex-shrink-0 transition-transform duration-200',
                { 'rotate-180': expandedGroups.has(item.id) },
              ]"
            />
          </button>

          <!-- Group children -->
          <div
            v-if="!uiStore.sidebarCollapsed && expandedGroups.has(item.id)"
            class="space-y-1 pl-6"
          >
            <router-link
              v-for="child in item.children"
              :key="child.id"
              :to="child.route!"
              :class="[
                'group flex items-center rounded-lg px-2 py-2 text-sm font-medium transition-colors duration-200',
                {
                  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200':
                    isActiveRoute(child.route!),
                  'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white':
                    !isActiveRoute(child.route!),
                },
              ]"
            >
              <component
                :is="child.icon"
                :class="[
                  'h-4 w-4 flex-shrink-0',
                  {
                    'text-indigo-500 dark:text-indigo-300': isActiveRoute(child.route!),
                    'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300':
                      !isActiveRoute(child.route!),
                  },
                ]"
              />
              <span class="ml-3 truncate">{{ $t(child.label) }}</span>
            </router-link>
          </div>
        </div>
      </template>
    </nav>

    <!-- User section -->
    <div class="border-t border-gray-200 p-4 dark:border-gray-700">
      <div :class="['flex items-center', { 'justify-center': uiStore.sidebarCollapsed }]">
        <div class="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
          <span class="text-sm font-medium text-white">
            {{ userInitials }}
          </span>
        </div>
        <div v-if="!uiStore.sidebarCollapsed" class="ml-3 flex-1 overflow-hidden">
          <p class="truncate text-sm font-medium text-gray-900 dark:text-white">
            {{ authStore.user?.user_metadata?.full_name || authStore.user?.email }}
          </p>
          <p class="truncate text-xs text-gray-500 dark:text-gray-400">
            {{ authStore.user?.email }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, inject } from 'vue'
import { useRoute } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import {
  ChevronLeft,
  ChevronDown,
  Home,
  Package,
  ShoppingCart,
  ShoppingBag,
  Users,
  Warehouse,
  FileText,
  BarChart3,
  Settings,
  UserCheck,
  CreditCard,
  ArrowRightLeft,
  Box,
  Clock,
  Activity,
} from 'lucide-vue-next'

interface NavigationItem {
  id: string
  label: string
  icon: unknown
  route?: string
  children?: NavigationItem[]
  permissions?: string[]
}

const uiStore = useUIStore()
const authStore = useAuthStore()
const route = useRoute()

// Mobile detection (injected from parent)
const isMobile = inject('isMobile', ref(false))

// Expanded groups state
const expandedGroups = ref(new Set<string>(['dashboard', 'inventory']))

// Navigation items
const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'nav.dashboard',
    icon: Home,
    route: '/dashboard',
  },
  {
    id: 'inventory',
    label: 'nav.inventory',
    icon: Package,
    children: [
      {
        id: 'products',
        label: 'nav.products',
        icon: Package,
        route: '/products',
        permissions: ['products.read'],
      },
      {
        id: 'warehouses',
        label: 'nav.warehouses',
        icon: Warehouse,
        route: '/warehouses',
        permissions: ['warehouses.read'],
      },
      {
        id: 'stock-transfers',
        label: 'nav.stock_transfers',
        icon: ArrowRightLeft,
        route: '/warehouses/transfers',
        permissions: ['warehouses.read'],
      },
      {
        id: 'warehouse-visualization',
        label: 'nav.warehouse_visualization',
        icon: Box,
        route: '/warehouses/visualization',
        permissions: ['warehouses.read'],
      },
    ],
  },
  {
    id: 'sales',
    label: 'nav.sales',
    icon: ShoppingCart,
    children: [
      {
        id: 'sales-list',
        label: 'nav.sales_list',
        icon: ShoppingCart,
        route: '/sales',
        permissions: ['sales.read'],
      },
      {
        id: 'pos',
        label: 'nav.pos',
        icon: CreditCard,
        route: '/pos',
        permissions: ['sales.create'],
      },
    ],
  },
  {
    id: 'purchases',
    label: 'nav.purchases',
    icon: ShoppingBag,
    route: '/purchases',
    permissions: ['purchases.read'],
  },
  {
    id: 'parties',
    label: 'nav.parties',
    icon: Users,
    children: [
      {
        id: 'customers',
        label: 'nav.customers',
        icon: Users,
        route: '/customers',
        permissions: ['parties.read'],
      },
      {
        id: 'suppliers',
        label: 'nav.suppliers',
        icon: UserCheck,
        route: '/suppliers',
        permissions: ['parties.read'],
      },
    ],
  },
  {
    id: 'electronic-billing',
    label: 'nav.electronic_billing',
    icon: FileText,
    children: [
      {
        id: 'electronic-billing-dashboard',
        label: 'nav.electronic_billing_dashboard',
        icon: BarChart3,
        route: '/electronic-billing',
        permissions: ['electronic_billing.read'],
      },
      {
        id: 'electronic-billing-pending',
        label: 'nav.electronic_billing_pending',
        icon: Clock,
        route: '/electronic-billing/pending',
        permissions: ['electronic_billing.read'],
      },
      {
        id: 'electronic-billing-documents',
        label: 'nav.electronic_billing_documents',
        icon: FileText,
        route: '/electronic-billing/documents',
        permissions: ['electronic_billing.read'],
      },
      {
        id: 'electronic-billing-monitor',
        label: 'nav.electronic_billing_monitor',
        icon: Activity,
        route: '/electronic-billing/monitor',
        permissions: ['electronic_billing.read'],
      },
      {
        id: 'electronic-billing-config',
        label: 'nav.electronic_billing_config',
        icon: Settings,
        route: '/electronic-billing/config',
        permissions: ['electronic_billing.config'],
      },
    ],
  },
  {
    id: 'reports',
    label: 'nav.reports',
    icon: FileText,
    route: '/reports',
    permissions: ['reports.read'],
  },
  {
    id: 'analytics',
    label: 'nav.analytics',
    icon: BarChart3,
    route: '/analytics',
    permissions: ['analytics.read'],
  },
  {
    id: 'settings',
    label: 'nav.settings',
    icon: Settings,
    route: '/settings',
    permissions: ['settings.read'],
  },
]

// Computed properties
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
const toggleGroup = (groupId: string) => {
  if (expandedGroups.value.has(groupId)) {
    expandedGroups.value.delete(groupId)
  } else {
    expandedGroups.value.add(groupId)
  }
}

const isActiveRoute = (routePath: string) => {
  return route.path === routePath || route.path.startsWith(routePath + '/')
}

const hasPermission = (permissions?: string[]) => {
  if (!permissions || permissions.length === 0) return true

  // TODO: Implement actual permission checking
  // For now, return true to show all navigation items
  return true
}
</script>
