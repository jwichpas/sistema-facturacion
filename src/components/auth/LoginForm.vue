<template>
  <div class="w-full max-w-md mx-auto">
    <div class="bg-white dark:bg-gray-800 shadow-lg rounded-lg px-8 py-6">
      <!-- Header -->
      <div class="text-center mb-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ $t('auth.welcome_back') }}
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {{ $t('auth.please_sign_in') }}
        </p>
      </div>

      <!-- Error Alert -->
      <div
        v-if="error"
        class="mb-4 p-3 rounded-lg bg-error-50 border border-error-200 dark:bg-error-900/20 dark:border-error-800"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <AlertTriangle class="h-5 w-5 text-error-400" />
          </div>
          <div class="ml-3">
            <p class="text-sm text-error-800 dark:text-error-200">
              {{ error }}
            </p>
          </div>
        </div>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleSubmit">
        <div class="space-y-4">
          <!-- Email Field -->
          <BaseInput
            v-model="form.email"
            type="email"
            :label="$t('auth.email')"
            :placeholder="$t('auth.email')"
            :error="errors.email"
            :disabled="loading"
            required
            autocomplete="email"
          >
            <template #prefix>
              <Mail class="h-5 w-5 text-gray-400" />
            </template>
          </BaseInput>

          <!-- Password Field -->
          <BaseInput
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            :label="$t('auth.password')"
            :placeholder="$t('auth.password')"
            :error="errors.password"
            :disabled="loading"
            required
            autocomplete="current-password"
          >
            <template #prefix>
              <Lock class="h-5 w-5 text-gray-400" />
            </template>
            <template #suffix>
              <button
                type="button"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                @click="showPassword = !showPassword"
              >
                <Eye v-if="!showPassword" class="h-5 w-5" />
                <EyeOff v-else class="h-5 w-5" />
              </button>
            </template>
          </BaseInput>

          <!-- Remember Me & Forgot Password -->
          <div class="flex items-center justify-between">
            <BaseCheckbox
              v-model="form.remember"
              :label="$t('auth.remember_me')"
              :disabled="loading"
            />

            <router-link
              to="/forgot-password"
              class="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              {{ $t('auth.forgot_password') }}
            </router-link>
          </div>

          <!-- Submit Button -->
          <BaseButton
            type="submit"
            variant="primary"
            size="lg"
            :loading="loading"
            :loading-text="$t('common.loading')"
            :disabled="!isFormValid"
            full-width
          >
            {{ $t('auth.sign_in') }}
          </BaseButton>
        </div>
      </form>

      <!-- Sign Up Link -->
      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          ¿No tienes una cuenta?
          <router-link
            to="/register"
            class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
          >
            {{ $t('auth.sign_up') }}
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCheckbox from '@/components/ui/BaseCheckbox.vue'
import { Mail, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-vue-next'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const uiStore = useUIStore()

// Form state
const form = reactive({
  email: '',
  password: '',
  remember: false,
})

const errors = reactive({
  email: '',
  password: '',
})

const showPassword = ref(false)
const loading = computed(() => authStore.loading as boolean)
const error = computed(() => authStore.error as string | null)

// Form validation
const isFormValid = computed(() => {
  return form.email.trim() !== '' && form.password !== '' && !errors.email && !errors.password
})

// Validation functions
const validateEmail = (email: string): string => {
  if (!email.trim()) {
    return t('validation.required')
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.trim())) {
    return t('validation.email')
  }

  return ''
}

const validatePassword = (password: string): string => {
  if (!password) {
    return t('validation.required')
  }

  if (password.length < 6) {
    return t('validation.min_length', { min: 6 })
  }

  return ''
}

// Real-time validation
const validateField = (field: keyof typeof form) => {
  switch (field) {
    case 'email':
      errors.email = validateEmail(form.email)
      break
    case 'password':
      errors.password = validatePassword(form.password)
      break
  }
}

// Handle form submission
const handleSubmit = async () => {
  // Clear previous errors
  authStore.clearError()
  errors.email = ''
  errors.password = ''

  // Validate all fields
  errors.email = validateEmail(form.email)
  errors.password = validatePassword(form.password)

  // Check if form is valid
  if (errors.email || errors.password) {
    return
  }

  try {
    await authStore.signIn({
      email: form.email,
      password: form.password,
      remember: form.remember,
    })

    // Show success notification
    uiStore.addNotification({
      type: 'success',
      title: 'Bienvenido',
      message: `Hola ${authStore.userName}, has iniciado sesión correctamente.`,
    })

    // Redirect to dashboard or intended route
    const redirectTo = router.currentRoute.value.query.redirect as string
    await router.push(redirectTo || '/dashboard')
  } catch (err) {
    // Error is handled by the store and displayed in the template
    console.error('Login error:', err)
  }
}

// Handle input blur for validation
const handleBlur = (field: keyof typeof form) => {
  validateField(field)
}
</script>
