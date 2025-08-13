<template>
  <div class="min-h-screen flex">
    <!-- Left side - Login Form -->
    <div class="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
      <div class="mx-auto w-full max-w-sm lg:w-96">
        <LoginForm />
      </div>
    </div>

    <!-- Right side - Branding/Image -->
    <div class="hidden lg:block relative w-0 flex-1">
      <div class="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800">
        <div class="absolute inset-0 bg-black opacity-20"></div>
        <div class="relative h-full flex flex-col justify-center items-center text-white p-12">
          <!-- Logo -->
          <div class="mb-8">
            <div class="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
              <svg class="w-10 h-10 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </div>

          <!-- Title -->
          <h1 class="text-4xl font-bold text-center mb-4">
            {{ $t('app.name') }}
          </h1>

          <!-- Description -->
          <p class="text-xl text-center text-primary-100 mb-8 max-w-md">
            {{ $t('app.description') }}
          </p>

          <!-- Features -->
          <div class="space-y-4 max-w-md">
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <CheckCircle class="h-6 w-6 text-primary-200" />
              </div>
              <p class="text-primary-100">Gestión completa de inventario</p>
            </div>

            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <CheckCircle class="h-6 w-6 text-primary-200" />
              </div>
              <p class="text-primary-100">Facturación electrónica SUNAT</p>
            </div>

            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <CheckCircle class="h-6 w-6 text-primary-200" />
              </div>
              <p class="text-primary-100">Reportes y análisis en tiempo real</p>
            </div>

            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <CheckCircle class="h-6 w-6 text-primary-200" />
              </div>
              <p class="text-primary-100">Multi-empresa y multi-usuario</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import LoginForm from '@/components/auth/LoginForm.vue'
import { CheckCircle } from 'lucide-vue-next'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()

// Redirect if already authenticated
onMounted(() => {
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  }
})
</script>
