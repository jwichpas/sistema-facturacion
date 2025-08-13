<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Panel de Control</h1>
      <p class="text-gray-600 dark:text-gray-400">
        Bienvenido al sistema ERP, {{ authStore.userName }}
      </p>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <KpiCard title="Ventas Hoy" :value="formatCurrency(12540.75)" :delta="12.4" subtitle="vs. ayer" />
      <KpiCard title="Pedidos" :value="128" :delta="-3.2" subtitle="últimas 24h" />
      <KpiCard title="Clientes Nuevos" :value="23" :delta="5.1" subtitle="últimas 24h" />
      <KpiCard title="Stock Bajo" :value="14" :delta="0" subtitle="con alerta" />
    </div>

    <!-- Charts and Feed -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <div class="lg:col-span-2">
        <ChartWidget
          title="Ventas (últimos 7 días)"
          subtitle="Tendencia diaria"
          type="area"
          :height="320"
          :options="salesChartOptions"
          :series="salesChartSeries"
        />
      </div>
      <div>
        <ActivityFeed title="Actividad Reciente" :items="recentActivity" />
      </div>
    </div>

    <!-- User Info and System Status -->
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
import { KpiCard, ChartWidget, ActivityFeed } from '@/components/ui'

const authStore = useAuthStore()

const userRole = computed(() => authStore.userRole as string | null)
const hasCompany = computed(() => authStore.hasCompany)
const permissionCount = computed(() => (authStore.userPermissions as string[]).length)

const formatCurrency = (value: number) =>
  value.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 })

const recentActivity = [
  { title: 'Nueva venta registrada', description: 'Factura F001-12345 por S/ 1,245.50', time: 'hace 5m', meta: 'POS Lima' },
  { title: 'Stock actualizado', description: 'Producto ABC-123 incrementó 50 und.', time: 'hace 20m', meta: 'Almacén Central' },
  { title: 'Cliente creado', description: 'Comercial Andina SAC', time: 'hace 1h', meta: 'Backoffice' },
]

const salesChartOptions = {
  chart: { id: 'sales-7d', toolbar: { show: false } },
  xaxis: {
    categories: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
  },
  theme: { mode: 'light' },
  dataLabels: { enabled: false },
  stroke: { width: 2, curve: 'smooth' },
}

const salesChartSeries = [
  { name: 'Ventas', data: [1200, 1800, 1600, 2200, 2800, 2400, 3000] },
]
</script>
