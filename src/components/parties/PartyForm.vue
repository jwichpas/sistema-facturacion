<template>
  <div class="max-w-4xl mx-auto">
    <BaseForm
      :schema="partySchema"
      :initial-values="initialValues"
      :loading="loading"
      @submit="handleSubmit"
    >
      <template #default="{ values, errors }">
        <div class="space-y-6">
          <!-- Document Information -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Información del Documento
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormSelect
                name="doc_type"
                label="Tipo de Documento"
                :options="documentTypeOptions"
                required
                @update:model-value="(value) => handleDocTypeChange(String(value))"
              />

              <FormInput
                name="doc_number"
                label="Número de Documento"
                :placeholder="getDocumentPlaceholder(values.doc_type)"
                required
                @blur="() => handleDocumentValidation(values.doc_type, values.doc_number)"
              />
            </div>

            <!-- Document validation feedback -->
            <div v-if="documentValidation.message" class="mt-2">
              <div
                :class="[
                  'text-sm p-2 rounded',
                  documentValidation.isValid
                    ? 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20'
                    : 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
                ]"
              >
                {{ documentValidation.message }}
              </div>
            </div>
          </div>

          <!-- Personal/Company Information -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {{ isCompany(values.doc_type) ? 'Información de la Empresa' : 'Información Personal' }}
            </h3>

            <div v-if="isCompany(values.doc_type)" class="space-y-4">
              <!-- Company fields -->
              <FormInput
                name="razon_social"
                label="Razón Social"
                required
              />
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Natural person fields -->
              <FormInput
                name="nombres"
                label="Nombres"
                required
              />

              <FormInput
                name="apellido_paterno"
                label="Apellido Paterno"
                required
              />

              <FormInput
                name="apellido_materno"
                label="Apellido Materno"
              />
            </div>
          </div>

          <!-- Contact Information -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Información de Contacto
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                name="email"
                label="Email"
                type="email"
              />

              <FormInput
                name="phone"
                label="Teléfono"
                type="tel"
              />

              <div class="md:col-span-2">
                <FormTextarea
                  name="address"
                  label="Dirección"
                  :rows="3"
                />
              </div>
            </div>
          </div>

          <!-- Party Type -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Tipo de Relación Comercial
            </h3>

            <div class="space-y-3">
              <FormCheckbox
                name="is_customer"
                label="Es Cliente"
                description="Esta persona/empresa puede realizar compras"
              />

              <FormCheckbox
                name="is_supplier"
                label="Es Proveedor"
                description="Esta persona/empresa puede suministrar productos/servicios"
              />
            </div>

            <!-- Validation message for party type -->
            <div v-if="!values.is_customer && !values.is_supplier" class="mt-2">
              <p class="text-sm text-amber-600 dark:text-amber-400">
                Debe seleccionar al menos un tipo de relación comercial
              </p>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              @click="$emit('cancel')"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>

            <button
              type="submit"
              :disabled="loading || !isFormValid(values)"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Crear') }}
            </button>
          </div>
        </div>
      </template>
    </BaseForm>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import * as yup from 'yup'
import { BaseForm, FormInput, FormSelect, FormTextarea, FormCheckbox } from '@/components/forms'
import { usePartyStore } from '@/stores/party'
import { useAuthStore } from '@/stores/auth'
import type { Party } from '@/types'

interface Props {
  party?: Party | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  party: null,
  loading: false
})

const emit = defineEmits<{
  submit: [data: any]
  cancel: []
}>()

const partyStore = usePartyStore()

// Local state
const documentValidation = ref<{ isValid: boolean; message: string }>({
  isValid: false,
  message: ''
})

// Computed properties
const isEdit = computed(() => !!props.party)
const documentTypes = computed(() => partyStore.documentTypes)

const documentTypeOptions = computed(() =>
  documentTypes.value.map(dt => ({
    value: dt.code,
    label: dt.description
  }))
)

const initialValues = computed(() => {
  if (props.party) {
    return {
      doc_type: props.party.doc_type,
      doc_number: props.party.doc_number,
      nombres: props.party.nombres || '',
      apellido_paterno: props.party.apellido_paterno || '',
      apellido_materno: props.party.apellido_materno || '',
      razon_social: props.party.razon_social || '',
      email: props.party.email || '',
      phone: props.party.phone || '',
      address: props.party.address || '',
      is_customer: props.party.is_customer,
      is_supplier: props.party.is_supplier
    }
  }

  return {
    doc_type: '',
    doc_number: '',
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    razon_social: '',
    email: '',
    phone: '',
    address: '',
    is_customer: false,
    is_supplier: false
  }
})

// Validation schema
const partySchema = yup.object({
  doc_type: yup.string().required('Tipo de documento es requerido'),
  doc_number: yup.string().required('Número de documento es requerido'),
  nombres: yup.string().when('doc_type', {
    is: (docType: string) => !isCompany(docType),
    then: (schema) => schema.required('Nombres son requeridos'),
    otherwise: (schema) => schema.notRequired()
  }),
  apellido_paterno: yup.string().when('doc_type', {
    is: (docType: string) => !isCompany(docType),
    then: (schema) => schema.required('Apellido paterno es requerido'),
    otherwise: (schema) => schema.notRequired()
  }),
  apellido_materno: yup.string(),
  razon_social: yup.string().when('doc_type', {
    is: (docType: string) => isCompany(docType),
    then: (schema) => schema.required('Razón social es requerida'),
    otherwise: (schema) => schema.notRequired()
  }),
  email: yup.string().email('Email no válido'),
  phone: yup.string(),
  address: yup.string(),
  is_customer: yup.boolean(),
  is_supplier: yup.boolean()
})

// Methods
const isCompany = (docType: string): boolean => {
  return docType === '6' // RUC
}

const getDocumentPlaceholder = (docType: string): string => {
  const documentType = documentTypes.value.find(dt => dt.code === docType)
  if (!documentType) return 'Ingrese el número'

  if (documentType.length) {
    return `${documentType.length} dígitos`
  }

  return `Ingrese ${documentType.description.toLowerCase()}`
}

const handleDocTypeChange = (docType: string) => {
  // Clear validation
  documentValidation.value = { isValid: false, message: '' }
}

const handleDocumentValidation = async (docType: string, docNumber: string) => {
  if (!docType || !docNumber) {
    documentValidation.value = { isValid: false, message: '' }
    return
  }

  const validation = partyStore.validateDocument(docType, docNumber)
  documentValidation.value = {
    isValid: validation.isValid,
    message: validation.error || (validation.isValid ? 'Documento válido' : '')
  }

  // Check for existing party with same document (only for new parties)
  if (validation.isValid && !isEdit.value) {
    try {
      const existingParty = await partyStore.findPartyByDocument(docType, docNumber)
      if (existingParty) {
        documentValidation.value = {
          isValid: false,
          message: 'Ya existe una persona/empresa con este número de documento'
        }
      }
    } catch (error) {
      console.error('Error checking existing party:', error)
    }
  }
}

const isFormValid = (values: any): boolean => {
  // Basic validation
  if (!values.doc_type || !values.doc_number) return false
  if (!values.is_customer && !values.is_supplier) return false

  // Document validation
  if (!documentValidation.value.isValid && documentValidation.value.message) return false

  // Name validation based on document type
  if (isCompany(values.doc_type)) {
    return !!values.razon_social?.trim()
  } else {
    return !!values.nombres?.trim() && !!values.apellido_paterno?.trim()
  }
}

const handleSubmit = async (values: unknown) => {
  if (!isFormValid(values)) return

  // Get auth store to access current company
  const authStore = useAuthStore()

  // Prepare data for submission
  const partyData = {
    ...values,
    company_id: authStore.currentCompany?.id
  }

  // Remove empty optional fields
  Object.keys(partyData).forEach(key => {
    if (partyData[key] === '' || partyData[key] === null) {
      delete partyData[key]
    }
  })

  emit('submit', partyData)
}

// Initialize document types
partyStore.loadDocumentTypes()
</script>
