<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
    <div class="flex items-center justify-between mb-3">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ title }}</h3>
        <p v-if="subtitle" class="text-sm text-gray-500 dark:text-gray-400">{{ subtitle }}</p>
      </div>
      <slot name="actions" />
    </div>
    <VueApexCharts v-if="mounted" :type="type" :height="height" :options="options" :series="series" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

interface Props {
  title: string
  subtitle?: string
  type?: 'line' | 'bar' | 'area' | 'donut' | 'pie' | 'radar' | 'heatmap'
  height?: number | string
  options: any
  series: any
}

const props = withDefaults(defineProps<Props>(), {
  type: 'line',
  height: 300,
})

const mounted = ref(false)

onMounted(() => {
  mounted.value = true
})

// register locally via script setup
defineExpose({})
</script>
