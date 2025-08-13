<template>
  <nav
    v-if="breadcrumbs.length > 0"
    class="border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800 sm:px-6 lg:px-8"
    aria-label="Breadcrumb"
  >
    <ol class="flex items-center space-x-2">
      <li
        v-for="(breadcrumb, index) in breadcrumbs"
        :key="breadcrumb.name"
        class="flex items-center"
      >
        <!-- Separator -->
        <ChevronRight v-if="index > 0" class="mr-2 h-4 w-4 flex-shrink-0 text-gray-400" />

        <!-- Breadcrumb item -->
        <div class="flex items-center">
          <!-- Home icon for first item -->
          <Home v-if="index === 0" class="mr-2 h-4 w-4 flex-shrink-0 text-gray-400" />

          <!-- Link or text -->
          <router-link
            v-if="breadcrumb.to && index < breadcrumbs.length - 1"
            :to="breadcrumb.to"
            class="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            {{ breadcrumb.name }}
          </router-link>

          <span
            v-else
            class="text-sm font-medium text-gray-900 dark:text-white"
            :aria-current="index === breadcrumbs.length - 1 ? 'page' : undefined"
          >
            {{ breadcrumb.name }}
          </span>
        </div>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Home, ChevronRight } from 'lucide-vue-next'

interface Breadcrumb {
  name: string
  to?: string
}

const route = useRoute()
const { t } = useI18n()

const breadcrumbs = computed(() => {
  const pathSegments = route.path.split('/').filter(Boolean)
  const breadcrumbs: Breadcrumb[] = []

  // Always start with home
  breadcrumbs.push({
    name: t('nav.dashboard'),
    to: '/dashboard',
  })

  // Build breadcrumbs from path segments
  let currentPath = ''

  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i]
    currentPath += `/${segment}`

    // Skip if this is the dashboard (already added as home)
    if (segment === 'dashboard') continue

    // Get breadcrumb name from route meta or translate key
    let name = segment

    // Try to get name from current route if it's the last segment
    if (i === pathSegments.length - 1 && route.meta.title) {
      name = route.meta.title as string
    } else {
      // Try to translate the segment
      const translationKey = `nav.${segment}`
      const translated = t(translationKey)
      if (translated !== translationKey) {
        name = translated
      } else {
        // Fallback: capitalize the segment
        name = segment.charAt(0).toUpperCase() + segment.slice(1)
      }
    }

    breadcrumbs.push({
      name,
      to: i === pathSegments.length - 1 ? undefined : currentPath,
    })
  }

  return breadcrumbs
})
</script>
