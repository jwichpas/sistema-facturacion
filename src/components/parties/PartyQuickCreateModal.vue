<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        @click="$emit('close')"
      ></div>

      <!-- Modal panel -->
      <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <!-- Header -->
        <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
              Crear {{ partyTypeLabel }}
            </h3>
            <button
              @click="$emit('close')"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <!-- Document Type and Number -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de documento *
                </label>
                <select
                  v-model="form.doc_type"
                  @change="handleDocTypeChange"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleccionar...</option>
                  <option
                    v-for="docType in documentTypes"
                    :key="docType.code"
                    :value="docType.code"
                  >
                    {{ docType.description }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Número de documento *
                </label>
                <input
                  v-model="form.doc_number"
                  @blur="validateDocument"
                  type="text"
                  :placeholder="documentPlaceholder"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  :class="{ 'border-red-500': documentError }"
                  required
                />
                <p v-if="documentError" class="text-red-500 text-xs mt-1">
                  {{ documentError }}
                </p>
              </div>
            </div>

            <!-- Names for natural persons -->
            <div v-if="isNaturalPerson" class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Apellido paterno *
                  </label>
                  <input
                    v-model="form.apellido_paterno"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Apellido materno
                  </label>
                  <input
                    v-model="form.apellido_materno"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombres *
                </label>
                <input
                  v-model="form.nombres"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <!-- Company name for legal entities -->
            <div v-else>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Razón social *
              </label>
              <input
                v-model="form.razon_social"
                type="text"
                :value="initialSearch"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <!-- Contact information -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  v-model="form.email"
                  type="email"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Teléfono
                </label>
                <input
                  v-model="form.phone"
                  type="tel"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <!-- Address -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dirección
              </label>
              <textarea
                v-model="form.address"
                rows="2"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>

            <!-- Party type selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de contacto *
              </label>
              <div class="flex space-x-4">
                <label class="flex items-center">
                  <input
                    v-model="form.is_customer"
                    type="checkbox"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Cliente</span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="form.is_supplier"
                    type="checkbox"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Proveedor</span>
                </label>
              </div>
              <p v-if="partyTypeError" class="text-red-500 text-xs mt-1">
                {{ partyTypeError }}
              </p>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            @click="handleSubmit"
            :disabled="loading || !isFormValid"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div v-if="loading" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {{ loading ? 'Creando...' : 'Crear' }}
          </button>
          <button
            @click="$emit('close')"
            type="button"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { X } from 'lucide-vue-next'
import { usePartyStore } from '@/stores/party'
import { useAuthStore } from '@/stores/auth'
import type { Party } from '@/types'

interface Props {
  partyType?: 'customer' | 'supplier' | 'both'
  initialSearch?: string
}

interface Emits {
  (e: 'close'): void
  (e: 'created', party: Party): void
}

const props = withDefaults(defineProps<Props>(), {
  partyType: 'both',
  initialSearch: ''
})

const emit = defineEmits<Emits>()

// Stores
const partyStore = usePartyStore()
const authStore = useAuthStore()

// Refs
const loading = ref(false)
const documentError = ref('')
const partyTypeError = ref('')

// Form data
const form = ref({
  doc_type: '',
  doc_number: '',
  apellido_paterno: '',
  apellido_materno: '',
  nombres: '',
  razon_social: '',
  email: '',
  phone: '',
  address: '',
  is_customer: props.partyType === 'customer' || props.partyType === 'both',
  is_supplier: props.partyType === 'supplier' || props.partyType === 'both'
})

// Computed
const documentTypes = computed(() => partyStore.documentTypes)

const isNaturalPerson = computed(() => {
  return form.value.doc_type && form.value.doc_type !== '6' // RUC is for companies
})

const documentPlaceholder = computed(() => {
  const docType = partyStore.documentTypes.find(dt => dt.code === form.value.doc_type)
  if (docType?.length) {
    return `${docType.length} dígitos`
  }
  return 'Número de documento'
})

const partyTypeLabel = computed(() => {
  switch (props.partyType) {
    case 'customer': return 'cliente'
    case 'supplier': return 'proveedor'
    default: return 'contacto'
  }
})

const isFormValid = computed(() => {
  const hasDocumentInfo = form.value.doc_type && form.value.doc_number
  const hasName = isNaturalPerson.value
    ? (form.value.apellido_paterno && form.value.nombres)
    : form.value.razon_social
  const hasPartyType = form.value.is_customer || form.value.is_supplier

  return hasDocumentInfo && hasName && hasPartyType && !documentError.value && !partyTypeError.value
})

// Methods
const handleDocTypeChange = () => {
  form.value.doc_number = ''
  documentError.value = ''

  // Reset name fields when switching between natural person and company
  if (isNaturalPerson.value) {
    form.value.razon_social = ''
  } else {
    form.value.apellido_paterno = ''
    form.value.apellido_materno = ''
    form.value.nombres = ''

    // Pre-fill company name with initial search if available
    if (props.initialSearch && !form.value.razon_social) {
      form.value.razon_social = props.initialSearch
    }
  }
}

const validateDocument = () => {
  documentError.value = ''

  if (!form.value.doc_type || !form.value.doc_number) {
    return
  }

  const validation = partyStore.validateDocument(form.value.doc_type, form.value.doc_number)
  if (!validation.isValid) {
    documentError.value = validation.error || 'Documento no válido'
  }
}

const validatePartyType = () => {
  partyTypeError.value = ''

  if (!form.value.is_customer && !form.value.is_supplier) {
    partyTypeError.value = 'Debe seleccionar al menos un tipo (Cliente o Proveedor)'
  }
}

const handleSubmit = async () => {
  validateDocument()
  validatePartyType()

  if (!isFormValid.value) {
    return
  }

  if (!authStore.currentCompany?.id) {
    return
  }

  loading.value = true

  try {
    const partyData = {
      company_id: authStore.currentCompany.id,
      doc_type: form.value.doc_type,
      doc_number: form.value.doc_number.trim(),
      apellido_paterno: form.value.apellido_paterno?.trim() || null,
      apellido_materno: form.value.apellido_materno?.trim() || null,
      nombres: form.value.nombres?.trim() || null,
      razon_social: form.value.razon_social?.trim() || null,
      email: form.value.email?.trim() || null,
      phone: form.value.phone?.trim() || null,
      address: form.value.address?.trim() || null,
      is_customer: form.value.is_customer,
      is_supplier: form.value.is_supplier
    }

    const newParty = await partyStore.createParty(partyData)
    emit('created', newParty)
  } catch (error) {
    console.error('Error creating party:', error)
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('documento')) {
        documentError.value = error.message
      } else {
        // Show general error - in a real app you'd use a toast/notification
        alert('Error al crear el contacto: ' + error.message)
      }
    }
  } finally {
    loading.value = false
  }
}

// Initialize form with initial search value for company name
onMounted(() => {
  if (props.initialSearch && !isNaturalPerson.value) {
    form.value.razon_social = props.initialSearch
  }
})

// Watch for party type prop changes
watch(() => props.partyType, (newType) => {
  if (newType === 'customer') {
    form.value.is_customer = true
    form.value.is_supplier = false
  } else if (newType === 'supplier') {
    form.value.is_customer = false
    form.value.is_supplier = true
  }
})
</script>
