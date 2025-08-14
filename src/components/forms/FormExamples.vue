<template>
  <div class="max-w-6xl mx-auto p-6 space-y-12">
    <!-- Basic Form Example -->
    <div class="space-y-4">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Formulario Básico
      </h2>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <BaseForm
          :schema="basicFormSchema"
          :initial-values="basicFormValues"
          submit-text="Enviar"
          @submit="handleBasicFormSubmit"
          @cancel="handleBasicFormCancel"
        >
          <template #default="{ errors, values, isSubmitting }">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                name="firstName"
                label="Nombre"
                placeholder="Ingrese su nombre"
                required
              />
              <FormInput
                name="lastName"
                label="Apellido"
                placeholder="Ingrese su apellido"
                required
              />
              <FormInput
                name="email"
                type="email"
                label="Email"
                placeholder="correo@ejemplo.com"
                required
              />
              <FormInput
                name="phone"
                type="tel"
                label="Teléfono"
                placeholder="+51 999 999 999"
              />
              <FormSelect
                name="country"
                label="País"
                :options="countryOptions"
                placeholder="Seleccione un país"
                required
              />
              <FormDatePicker
                name="birthDate"
                label="Fecha de Nacimiento"
                placeholder="Seleccione fecha"
              />
              <div class="md:col-span-2">
                <FormTextarea
                  name="comments"
                  label="Comentarios"
                  placeholder="Escriba sus comentarios aquí..."
                  :rows="4"
                />
              </div>
              <div class="md:col-span-2">
                <FormCheckbox
                  name="terms"
                  label="Acepto los términos y condiciones"
                  required
                />
              </div>
            </div>
          </template>
        </BaseForm>
      </div>
    </div>

    <!-- Additional Form Components Example -->
    <div class="space-y-4">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Componentes Adicionales
      </h2>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            name="sample-disabled"
            label="Campo Deshabilitado"
            placeholder="No se puede editar"
            model-value="Valor deshabilitado"
            disabled
          />
          <FormInput
            name="sample-readonly"
            label="Campo de Solo Lectura"
            model-value="Solo lectura"
            readonly
          />
        </div>
      </div>
    </div>

    <!-- Results Display -->
    <div v-if="formResults" class="space-y-4">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Resultados de Formularios
      </h2>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <pre class="bg-gray-100 dark:bg-gray-900 p-4 rounded text-sm overflow-auto">{{ JSON.stringify(formResults, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { object, string, number, boolean, date } from 'yup'
import {
  BaseForm,
  FormInput,
  FormSelect,
  FormTextarea,
  FormDatePicker,
  FormCheckbox,
  type SelectOption
} from './index'

// Basic Form Schema
const basicFormSchema = object({
  firstName: string().required('El nombre es requerido'),
  lastName: string().required('El apellido es requerido'),
  email: string().email('Email inválido').required('El email es requerido'),
  phone: string(),
  country: string().required('El país es requerido'),
  birthDate: date(),
  comments: string(),
  terms: boolean().oneOf([true], 'Debe aceptar los términos')
})

const basicFormValues = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  country: '',
  birthDate: undefined,
  comments: '',
  terms: false
})

const countryOptions: SelectOption[] = [
  { value: 'PE', label: 'Perú' },
  { value: 'MX', label: 'México' },
  { value: 'CO', label: 'Colombia' },
  { value: 'AR', label: 'Argentina' },
  { value: 'CL', label: 'Chile' }
]



// Results
const formResults = ref<any>(null)

// Event Handlers
const handleBasicFormSubmit = (values: any) => {
  console.log('Basic form submitted:', values)
  formResults.value = { type: 'basic', data: values }
}

const handleBasicFormCancel = () => {
  console.log('Basic form cancelled')
}


</script>
