<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Dashboard Components</h2>
      <p class="text-gray-600 dark:text-gray-400">
        Comprehensive examples of KPI cards, chart widgets, and activity feeds for dashboard interfaces.
      </p>
    </div>

    <!-- KPI Cards Grid -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">KPI Cards</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Revenue"
          :value="formatCurrency(totalRevenue)"
          :delta="revenueGrowth"
          subtitle="vs last month"
        >
          <template #icon>
            <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-300">
              <DollarSign class="w-5 h-5" />
            </div>
          </template>
        </KpiCard>

        <KpiCard
          title="Total Orders"
          :value="totalOrders.toLocaleString()"
          :delta="ordersGrowth"
          subtitle="this month"
        >
          <template #icon>
            <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-300">
              <ShoppingCart class="w-5 h-5" />
            </div>
          </template>
        </KpiCard>

        <KpiCard
          title="Active Customers"
          :value="activeCustomers.toLocaleString()"
          :delta="customersGrowth"
          subtitle="registered users"
        >
          <template #icon>
            <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-300">
              <Users class="w-5 h-5" />
            </div>
          </template>
        </KpiCard>

        <KpiCard
          title="Inventory Value"
          :value="formatCurrency(inventoryValue)"
          :delta="inventoryGrowth"
          subtitle="total stock value"
        >
          <template #icon>
            <div class="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-300">
              <Package class="w-5 h-5" />
            </div>
          </template>
        </KpiCard>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Chart Widgets</h3>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Sales Trend Chart -->
        <ChartWidget
          title="Sales Trend"
          subtitle="Monthly sales performance"
          type="line"
          :height="300"
          :options="salesChartOptions"
          :series="salesChartSeries"
        >
          <template #actions>
            <BaseButton variant="outline" size="sm" @click="exportSalesData">
              <Download class="w-4 h-4 mr-1" />
              Export
            </BaseButton>
          </template>
        </ChartWidget>

        <!-- Revenue by Category -->
        <ChartWidget
          title="Revenue by Category"
          subtitle="Product category breakdown"
          type="donut"
          :height="300"
          :options="categoryChartOptions"
          :series="categoryChartSeries"
        >
          <template #actions>
            <BaseButton variant="outline" size="sm" @click="viewCategoryDetails">
              <Eye class="w-4 h-4 mr-1" />
              Details
            </BaseButton>
          </template>
        </ChartWidget>

        <!-- Inventory Levels -->
        <ChartWidget
          title="Inventory Levels"
          subtitle="Stock levels by warehouse"
          type="bar"
          :height="300"
          :options="inventoryChartOptions"
          :series="inventoryChartSeries"
        >
          <template #actions>
            <BaseButton variant="outline" size="sm" @click="manageInventory">
              <Settings class="w-4 h-4 mr-1" />
              Manage
            </BaseButton>
          </template>
        </ChartWidget>

        <!-- Customer Growth -->
        <ChartWidget
          title="Customer Growth"
          subtitle="New customers over time"
          type="area"
          :height="300"
          :options="customerGrowthOptions"
          :series="customerGrowthSeries"
        >
          <template #actions>
            <BaseButton variant="outline" size="sm" @click="viewCustomerAnalytics">
              <TrendingUp class="w-4 h-4 mr-1" />
              Analytics
            </BaseButton>
          </template>
        </ChartWidget>
      </div>
    </div>

    <!-- Activity Feeds Section -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Activity Feeds</h3>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recent Sales Activity -->
        <ActivityFeed
          title="Recent Sales"
          :items="recentSalesActivity"
        >
          <template #actions>
            <BaseButton variant="outline" size="sm" @click="viewAllSales">
              View All
            </BaseButton>
          </template>
        </ActivityFeed>

        <!-- System Activity -->
        <ActivityFeed
          title="System Activity"
          :items="systemActivity"
        >
          <template #actions>
            <BaseButton variant="outline" size="sm" @click="viewSystemLogs">
              View Logs
            </BaseButton>
          </template>
        </ActivityFeed>
      </div>
    </div>

    <!-- Combined Dashboard Layout -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Complete Dashboard Layout</h3>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Chart Area -->
        <div class="lg:col-span-2">
          <ChartWidget
            title="Sales Performance Dashboard"
            subtitle="Comprehensive sales metrics and trends"
            type="line"
            :height="400"
            :options="performanceChartOptions"
            :series="performanceChartSeries"
          />
        </div>

        <!-- Sidebar with KPIs and Activity -->
        <div class="space-y-6">
          <!-- Quick Stats -->
          <div class="space-y-4">
            <KpiCard
              title="Today's Sales"
              :value="formatCurrency(todaySales)"
              :delta="todayGrowth"
              subtitle="vs yesterday"
            />
            <KpiCard
              title="Pending Orders"
              :value="pendingOrders.toString()"
              subtitle="awaiting processing"
            />
          </div>

          <!-- Recent Activity -->
          <ActivityFeed
            title="Latest Updates"
            :items="latestActivity.slice(0, 5)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { KpiCard, ChartWidget, ActivityFeed } from '@/components/ui'
import BaseButton from '@/components/ui/BaseButton.vue'
import type { FeedItem } from '@/components/ui/ActivityFeed.vue'
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Download,
  Eye,
  Settings,
  TrendingUp,
} from 'lucide-vue-next'

// Sample data
const totalRevenue = ref(125000)
const revenueGrowth = ref(12.5)
const totalOrders = ref(1234)
const ordersGrowth = ref(8.3)
const activeCustomers = ref(5678)
const customersGrowth = ref(-2.1)
const inventoryValue = ref(89000)
const inventoryGrowth = ref(5.7)
const todaySales = ref(8500)
const todayGrowth = ref(15.2)
const pendingOrders = ref(23)

// Chart configurations
const salesChartOptions = {
  chart: {
    type: 'line',
    toolbar: { show: false },
  },
  colors: ['#3B82F6', '#10B981'],
  stroke: {
    curve: 'smooth',
    width: 3,
  },
  xaxis: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  },
  yaxis: {
    labels: {
      formatter: (value: number) => `$${value.toLocaleString()}`,
    },
  },
  tooltip: {
    y: {
      formatter: (value: number) => `$${value.toLocaleString()}`,
    },
  },
}

const salesChartSeries = [
  {
    name: 'Revenue',
    data: [12000, 15000, 18000, 22000, 19000, 25000],
  },
  {
    name: 'Profit',
    data: [3000, 4500, 5400, 6600, 5700, 7500],
  },
]

const categoryChartOptions = {
  chart: {
    type: 'donut',
  },
  colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
  labels: ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books'],
  legend: {
    position: 'bottom',
  },
  tooltip: {
    y: {
      formatter: (value: number) => `$${value.toLocaleString()}`,
    },
  },
}

const categoryChartSeries = [45000, 32000, 28000, 15000, 5000]

const inventoryChartOptions = {
  chart: {
    type: 'bar',
    toolbar: { show: false },
  },
  colors: ['#10B981'],
  xaxis: {
    categories: ['Main Warehouse', 'Secondary', 'Retail Store', 'Online'],
  },
  yaxis: {
    labels: {
      formatter: (value: number) => value.toLocaleString(),
    },
  },
  tooltip: {
    y: {
      formatter: (value: number) => `${value.toLocaleString()} items`,
    },
  },
}

const inventoryChartSeries = [
  {
    name: 'Stock Level',
    data: [1250, 890, 450, 320],
  },
]

const customerGrowthOptions = {
  chart: {
    type: 'area',
    toolbar: { show: false },
  },
  colors: ['#8B5CF6'],
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.7,
      opacityTo: 0.3,
    },
  },
  stroke: {
    curve: 'smooth',
    width: 2,
  },
  xaxis: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  },
}

const customerGrowthSeries = [
  {
    name: 'New Customers',
    data: [45, 52, 38, 65, 49, 72],
  },
]

const performanceChartOptions = {
  chart: {
    type: 'line',
    toolbar: { show: false },
  },
  colors: ['#3B82F6', '#10B981', '#F59E0B'],
  stroke: {
    curve: 'smooth',
    width: 3,
  },
  xaxis: {
    categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
  },
  yaxis: {
    labels: {
      formatter: (value: number) => `$${value.toLocaleString()}`,
    },
  },
}

const performanceChartSeries = [
  {
    name: 'Sales',
    data: [25000, 28000, 32000, 35000],
  },
  {
    name: 'Profit',
    data: [7500, 8400, 9600, 10500],
  },
  {
    name: 'Expenses',
    data: [17500, 19600, 22400, 24500],
  },
]

// Activity feed data
const recentSalesActivity: FeedItem[] = [
  {
    title: 'New order #12345',
    description: 'ACME Corp - $1,500.00',
    time: '2 minutes ago',
    meta: 'Factura F001-00001234',
    actor: 'Maria Garcia',
  },
  {
    title: 'Payment received',
    description: 'Invoice #12340 - $850.00',
    time: '15 minutes ago',
    meta: 'Bank transfer',
    actor: 'System',
  },
  {
    title: 'Order shipped',
    description: 'Order #12338 to Lima',
    time: '1 hour ago',
    meta: 'Courier: DHL',
    actor: 'Carlos Rodriguez',
  },
  {
    title: 'Refund processed',
    description: 'Order #12330 - $125.00',
    time: '2 hours ago',
    meta: 'Credit card refund',
    actor: 'Ana Lopez',
  },
]

const systemActivity: FeedItem[] = [
  {
    title: 'Database backup completed',
    time: '30 minutes ago',
    meta: 'Automated backup',
  },
  {
    title: 'Low stock alert',
    description: 'iPhone 15 Pro - 3 units remaining',
    time: '1 hour ago',
    meta: 'Inventory alert',
  },
  {
    title: 'User login',
    description: 'admin@company.com',
    time: '2 hours ago',
    meta: 'Authentication',
    actor: 'Admin User',
  },
  {
    title: 'Report generated',
    description: 'Monthly sales report',
    time: '3 hours ago',
    meta: 'Scheduled task',
  },
]

const latestActivity = computed(() => [
  ...recentSalesActivity,
  ...systemActivity,
].sort((a, b) => {
  // Simple time sorting (in real app, use proper date comparison)
  const timeA = a.time.includes('minute') ? 1 : a.time.includes('hour') ? 2 : 3
  const timeB = b.time.includes('minute') ? 1 : b.time.includes('hour') ? 2 : 3
  return timeA - timeB
}))

// Utility functions
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(value)
}

// Event handlers
const exportSalesData = () => {
  console.log('Exporting sales data...')
}

const viewCategoryDetails = () => {
  console.log('Viewing category details...')
}

const manageInventory = () => {
  console.log('Managing inventory...')
}

const viewCustomerAnalytics = () => {
  console.log('Viewing customer analytics...')
}

const viewAllSales = () => {
  console.log('Viewing all sales...')
}

const viewSystemLogs = () => {
  console.log('Viewing system logs...')
}
</script>
