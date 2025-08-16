<template>
  <div class="electronic-billing-config">
    <div class="bg-white shadow sm:rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
          Configuración de Facturación Electrónica
        </h3>

        <!-- Status Overview -->
        <div class="mb-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="flex items-center p-3 rounded-lg border" :class="status.has_config ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'">
              <CheckCircle v-if="status.has_config" class="w-5 h-5 text-green-500 mr-2" />
              <XCircle v-else class="w-5 h-5 text-red-500 mr-2" />
              <div>
                <p class="text-sm font-medium" :class="status.has_config ? 'text-green-800' : 'text-red-800'">
                  Configuración
                </p>
                <p class="text-xs" :class="status.has_config ? 'text-green-600' : 'text-red-600'">
                  {{ status.has_config ? 'Completa' : 'Incompleta' }}
                </p>
              </div>
            </div>

            <div class="flex items-center p-3 rounded-lg border" :class="status.sol_user_configured ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'">
              <CheckCircle v-if="status.sol_user_configured" class="w-5 h-5 text-green-500 mr-2" />
              <AlertCircle v-else class="w-5 h-5 text-yellow-500 mr-2" />
              <div>
                <p class="text-sm font-medium" :class="status.sol_user_configured ? 'text-green-800' : 'text-yellow-800'">
                  Usuario SOL
                </p>
                <p class="text-xs" :class="status.sol_user_configured ? 'text-green-600' : 'text-yellow-600'">
                  {{ status.sol_user_configured ? 'Configurado' : 'Pendiente' }}
                </p>
              </div>
            </div>

            <div class="flex items-center p-3 rounded-lg border" :class="status.cert_configured ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'">
              <CheckCircle v-if="status.cert_configured" class="w-5 h-5 text-green-500 mr-2" />
              <AlertCircle v-else class="w-5 h-5 text-yellow-500 mr-2" />
              <div>
                <p class="text-sm font-medium" :class="status.cert_configured ? 'text-green-800' : 'text-yellow-800'">
                  Certificado
                </p>
                <p class="text-xs" :class="status.cert_configured ? 'text-green-600' : 'text-yellow-600'">
                  {{ status.cert_configured ? 'Configurado' : 'Pendiente' }}
                </p>
              </div>
            </div>

            <div class="flex items-center p-3 rounded-lg border" :class="status.production_mode ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'">
              <AlertTriangle v-if="status.production_mode" class="w-5 h-5 text-red-500 mr-2" />
              <Info v-else class="w-5 h-5 text-blue-500 mr-2" />
              <div>
                <p class="text-sm font-medium" :class="status.production_mode ? 'text-red-800' : 'text-blue-800'">
                  Ambiente
                </p>
                <p class="text-xs" :class="status.production_mode ? 'text-red-600' : 'text-blue-600'">
                  {{ status.production_mode ? 'Producción' : 'Beta/Pruebas' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Configuration Form -->
        <form @submit.prevent="saveConfiguration" class="space-y-6">
          <!-- SOL Credentials -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Usuario SOL *
              </label>
              <input
                v-model="config.sol_user"
                type="text"
                required
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Ej: 20123456789MODDATOS"
              />
              <p class="mt-1 text-xs text-gray-500">
                Usuario de SUNAT Operaciones en Línea
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Contraseña SOL *
              </label>
              <div class="relative">
                <input
                  v-model="config.sol_pass"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm pr-10"
                  placeholder="Contraseña SOL"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <Eye v-if="!showPassword" class="h-4 w-4 text-gray-400" />
                  <EyeOff v-else class="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          <!-- Certificate Upload -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Certificado Digital *
            </label>
            <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div class="space-y-1 text-center">
                <Upload class="mx-auto h-12 w-12 text-gray-400" />
                <div class="flex text-sm text-gray-600">
                  <label class="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Subir certificado</span>
                    <input
                      ref="certificateInput"
                      type="file"
                      accept=".p12,.pfx"
                      @change="handleCertificateUpload"
                      class="sr-only"
                    />
                  </label>
                  <p class="pl-1">o arrastrar y soltar</p>
                </div>
                <p class="text-xs text-gray-500">
                  Archivos .p12 o .pfx hasta 5MB
                </p>
              </div>
            </div>

            <div v-if="certificateFile" class="mt-2 flex items-center text-sm text-gray-600">
              <FileText class="w-4 h-4 mr-2" />
              {{ certificateFile.name }}
              <button
                type="button"
                @click="removeCertificate"
                class="ml-2 text-red-600 hover:text-red-800"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <div v-if="status.cert_configured && !certificateFile" class="mt-2 flex items-center justify-between text-sm text-green-600">
              <div class="flex items-center">
                <CheckCircle class="w-4 h-4 mr-2" />
                Certificado configurado
              </div>
              <button
                type="button"
                @click="downloadCertificate"
                class="text-blue-600 hover:text-blue-800"
              >
                Descargar
              </button>
            </div>
          </div>

          <!-- API Credentials (Optional) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Client ID (Opcional)
              </label>
              <input
                v-model="config.client_id"
                type="text"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="ID del cliente para APIs"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Client Secret (Opcional)
              </label>
              <input
                v-model="config.client_secret"
                type="password"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Secret del cliente para APIs"
              />
            </div>
          </div>

          <!-- Environment Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Ambiente de Trabajo
            </label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  v-model="config.production"
                  :value="false"
                  type="radio"
                  class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                />
                <span class="ml-2 text-sm text-gray-700">
                  Beta/Pruebas (Recomendado para configuración inicial)
                </span>
              </label>
              <label class="flex items-center">
                <input
                  v-model="config.production"
                  :value="true"
                  type="radio"
                  class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                />
                <span class="ml-2 text-sm text-gray-700">
                  Producción (Solo cuando esté completamente configurado)
                </span>
              </label>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-between pt-4 border-t border-gray-200">
            <div class="flex items-center gap-4">
              <button
                type="button"
                @click="testConnection"
                :disabled="!canTest || testing"
                class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Loader v-if="testing" class="w-4 h-4 mr-2 animate-spin" />
                <Zap v-else class="w-4 h-4 mr-2" />
                {{ testing ? 'Probando...' : 'Probar Conexión' }}
              </button>

              <button
                type="button"
                @click="validateConfiguration"
                :disabled="validating"
                class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Loader v-if="validating" class="w-4 h-4 mr-2 animate-spin" />
                <Shield v-else class="w-4 h-4 mr-2" />
                {{ validating ? 'Validando...' : 'Validar Configuración' }}
              </button>
            </div>

            <button
              type="submit"
              :disabled="saving"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Loader v-if="saving" class="w-4 h-4 mr-2 animate-spin" />
              <Save v-else class="w-4 h-4 mr-2" />
              {{ saving ? 'Guardando...' : 'Guardar Configuración' }}
            </button>
          </div>
        </form>

        <!-- Validation Results -->
        <div v-if="validationResults" class="mt-6 space-y-4">
          <div v-if="validationResults.errors.length > 0" class="bg-red-50 border border-red-200 rounded-md p-4">
            <div class="flex">
              <AlertCircle class="h-5 w-5 text-red-400 flex-shrink-0" />
              <div class="ml-3">
                <h4 class="text-sm font-medium text-red-800">
                  Errores de Configuración
                </h4>
                <ul class="mt-2 text-sm text-red-700 list-disc list-inside">
                  <li v-for="error in validationResults.errors" :key="error">
                    {{ error }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div v-if="validationResults.warnings.length > 0" class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div class="flex">
              <AlertTriangle class="h-5 w-5 text-yellow-400 flex-shrink-0" />
              <div class="ml-3">
                <h4 class="text-sm font-medium text-yellow-800">
                  Advertencias
                </h4>
                <ul class="mt-2 text-sm text-yellow-700 list-disc list-inside">
                  <li v-for="warning in validationResults.warnings" :key="warning">
                    {{ warning }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div v-if="validationResults.valid" class="bg-green-50 border border-green-200 rounded-md p-4">
            <div class="flex">
              <CheckCircle class="h-5 w-5 text-green-400 flex-shrink-0" />
              <div class="ml-3">
                <h4 class="text-sm font-medium text-green-800">
                  Configuración Válida
                </h4>
                <p class="mt-2 text-sm text-green-700">
                  La configuración de facturación electrónica es válida y está lista para usar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Eye,
  EyeOff,
  Upload,
  FileText,
  X,
  Zap,
  Shield,
  Save,
  Loader
} from 'lucide-vue-next'
import { ElectronicBillingService } from '@/services/electronicBilling'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import type { ElectronicBillingConfig, ElectronicBillingStatus } from '@/types'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const showPassword = ref(false)
const saving = ref(false)
const testing = ref(false)
const validating = ref(false)
const certificateFile = ref<File | null>(null)
const certificateInput = ref<HTMLInputElement>()

const config = reactive<ElectronicBillingConfig>({
  sol_user: '',
  sol_pass: '',
  cert_path: '',
  client_id: '',
  client_secret: '',
  production: false
})

const status = ref<ElectronicBillingStatus>({
  has_config: false,
  production_mode: false,
  sol_user_configured: false,
  cert_configured: false,
  api_configured: false
})

const validationResults = ref<{
  valid: boolean
  errors: string[]
  warnings: string[]
} | null>(null)

const canTest = computed(() => {
  return config.sol_user.trim() && config.sol_pass.trim() && (status.value.cert_configured || certificateFile.value)
})

onMounted(() => {
  loadConfiguration()
})

async function loadConfiguration() {
  if (!authStore.currentCompany?.id) return

  try {
    const billingStatus = await ElectronicBillingService.getBillingStatus(authStore.currentCompany.id)
    if (billingStatus) {
      status.value = billingStatus
    }

    // Load existing configuration
    // This would typically come from the company data
    // For now, we'll leave the form empty for user input
  } catch (error) {
    console.error('Error loading configuration:', error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'Error al cargar la configuración'
    })
  }
}

async function saveConfiguration() {
  if (!authStore.currentCompany?.id) return

  saving.value = true
  try {
    // Upload certificate if provided
    if (certificateFile.value) {
      const uploadResult = await ElectronicBillingService.uploadCertificate(
        authStore.currentCompany.id,
        certificateFile.value
      )

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Error al subir certificado')
      }

      config.cert_path = uploadResult.path || ''
    }

    // Save configuration
    const result = await ElectronicBillingService.configureElectronicBilling(
      authStore.currentCompany.id,
      config
    )

    if (result.success) {
      notificationStore.addNotification({
        type: 'success',
        title: 'Configuración Guardada',
        message: 'La configuración de facturación electrónica se guardó correctamente'
      })

      // Reload status
      await loadConfiguration()
    } else {
      throw new Error(result.error || 'Error al guardar configuración')
    }
  } catch (error: any) {
    console.error('Error saving configuration:', error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: error.message || 'Error al guardar la configuración'
    })
  } finally {
    saving.value = false
  }
}

async function testConnection() {
  if (!authStore.currentCompany?.id) return

  testing.value = true
  try {
    const result = await ElectronicBillingService.testConnection(authStore.currentCompany.id)

    if (result.success) {
      notificationStore.addNotification({
        type: 'success',
        title: 'Conexión Exitosa',
        message: result.message
      })
    } else {
      notificationStore.addNotification({
        type: 'error',
        title: 'Error de Conexión',
        message: result.message
      })
    }
  } catch (error: any) {
    console.error('Error testing connection:', error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'Error al probar la conexión'
    })
  } finally {
    testing.value = false
  }
}

async function validateConfiguration() {
  if (!authStore.currentCompany?.id) return

  validating.value = true
  try {
    const result = await ElectronicBillingService.validateConfiguration(authStore.currentCompany.id)
    validationResults.value = result

    if (result.valid) {
      notificationStore.addNotification({
        type: 'success',
        title: 'Validación Exitosa',
        message: 'La configuración es válida'
      })
    }
  } catch (error: any) {
    console.error('Error validating configuration:', error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'Error al validar la configuración'
    })
  } finally {
    validating.value = false
  }
}

function handleCertificateUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    // Validate file type
    if (!file.name.endsWith('.p12') && !file.name.endsWith('.pfx')) {
      notificationStore.addNotification({
        type: 'error',
        title: 'Archivo Inválido',
        message: 'El certificado debe ser un archivo .p12 o .pfx'
      })
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      notificationStore.addNotification({
        type: 'error',
        title: 'Archivo Muy Grande',
        message: 'El archivo del certificado no puede exceder 5MB'
      })
      return
    }

    certificateFile.value = file
  }
}

function removeCertificate() {
  certificateFile.value = null
  if (certificateInput.value) {
    certificateInput.value.value = ''
  }
}

async function downloadCertificate() {
  if (!authStore.currentCompany?.id) return

  try {
    const url = await ElectronicBillingService.getCertificateUrl(authStore.currentCompany.id)
    if (url) {
      window.open(url, '_blank')
    } else {
      notificationStore.addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudo obtener el enlace de descarga del certificado'
      })
    }
  } catch (error) {
    console.error('Error downloading certificate:', error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Error',
      message: 'Error al descargar el certificado'
    })
  }
}
</script>
</template>
