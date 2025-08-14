<template>
  <div class="max-w-4xl mx-auto p-6 space-y-8">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
      Ejemplos de Componentes de Formulario
    </h1>

    <!-- BaseForm with Schema Validation Example -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        BaseForm con Validación de Schema
      </h2>

      <BaseForm
        :schema="validationSchema"
        :initial-values="initialValues"
        @submit="handleSubmit"
        @cancel="handleCancel"
      >
        <template #default="{ values, errors }">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              name="firstName"
              label="Nombre"
              placeholder="Ingresa tu nombre"
              required
            />

            <FormInput
              name="lastName"
              label="Apellido"
              placeholder="Ingresa tu apellido"
              required
            />

            <FormInput
              name="email"
              type="email"
              label="Correo Electrónico"
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
              placeholder="Selecciona un país"
              :options="countryOptions"
              required
            />

            <FormDatePicker
              name="birthDate"
              label="Fecha de Nacimiento"
              max="2006-01-01"
            />

            <div class="md:col-span-2">
              <FormTextarea
                name="bio"
                label="Biografía"
                placeholder="Cuéntanos sobre ti..."
                :rows="4"
              />
            </div>

            <div class="md:col-span-2">
              <FormFileUpload
                name="avatar"
                label="Foto de Perfil"
                accept="image/*"
                hint="Tamaño máximo: 5MB"
                :max-size="5 * 1024 * 1024"
              />
            </div>

            <div class="md:col-span-2">
              <FormCheckbox
                name="newsletter"
                label="Suscribirse al boletín"
                description="Recibe actualizaciones y noticias por correo electrónico"
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

          <!-- Debug Info -->
          <div v-if="showDebug" class="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Valores del Formulario (Debug):
            </h3>
            <pre class="text-xs text-gray-600 dark:text-gray-300 overflow-auto">{{ JSON.stringify(values, null, 2) }}</pre>

            <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 mt-4">
              Errores (Debug):
            </h3>
            <pre class="text-xs text-red-600 dark:text-red-400 overflow-auto">{{ JSON.stringify(errors, null, 2) }}</pre>
          </div>
        </template>
      </BaseForm>

      <div class="mt-4 flex justify-center">
        <button
          @click="showDebug = !showDebug"
          class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {{ showDebug ? 'Ocultar' : 'Mostrar' }} Información de Debug
        </button>
      </div>
    </div>

    <!-- Individual Components Example -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Componentes Individuales
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInput
          name="sample-text"
          label="Campo de Texto"
          placeholder="Texto de ejemplo"
          hint="Este es un campo de texto básico"
        />

        <FormInput
          name="sample-number"
          type="number"
          label="Campo Numérico"
          placeholder="123"
          hint="Solo números"
        />

        <FormSelect
          name="sample-select"
          label="Lista Desplegable"
          placeholder="Selecciona una opción"
          :options="sampleOptions"
        />

        <FormDatePicker
          name="sample-date"
          label="Selector de Fecha"
          hint="Selecciona una fecha"
        />

        <div class="md:col-span-2">
          <FormTextarea
            name="sample-textarea"
            label="Área de Texto"
            placeholder="Escribe un mensaje largo..."
            :rows="3"
          />
        </div>

        <div class="md:col-span-2">
          <FormFileUpload
            name="sample-files"
            label="Subida de Archivos Múltiples"
            multiple
            accept=".pdf,.doc,.docx,.txt"
            hint="Puedes seleccionar múltiples archivos"
          />
        </div>

        <FormCheckbox
          name="sample-checkbox"
          label="Casilla de Verificación"
          description="Esta es una casilla de verificación de ejemplo"
        />
      </div>
    </div>

    <!-- Form States Example -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Estados de Formulario
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Normal</h3>
          <FormInput
            name="normal"
            label="Campo Normal"
            placeholder="Estado normal"
          />
        </div>

        <div>
          <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Deshabilitado</h3>
          <FormInput
            name="disabled"
            label="Campo Deshabilitado"
            placeholder="No se puede editar"
            disabled
            model-value="Valor deshabilitado"
          />
        </div>

        <div>
          <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Solo Lectura</h3>
          <FormInput
            name="readonly"
            label="Campo de Solo Lectura"
            readonly
            model-value="Solo lectura"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import * as yup from 'yup'
import {
  BaseForm,
  FormInput,
  FormTextarea,
  FormSelect,
  FormCheckbox,
  FormDatePicker,
  FormFileUpload,
  type SelectOption
} from './index'

const showDebug = ref(false)

// Schema validation for BaseForm
const validationSchema = yup.object({
  firstName: yup.string().required('El nombre es requerido').min(2, 'Mínimo 2 caracteres'),
  lastName: yup.string().required('El apellido es requerido').min(2, 'Mínimo 2 caracteres'),
  email: yup.string().email('Email inválido').required('El email es requerido'),
  phone: yup.string().matches(/^\+?[\d\s-()]+$/, 'Formato de teléfono inválido'),
  country: yup.string().required('Selecciona un país'),
  birthDate: yup.date().max(new Date('2006-01-01'), 'Debes ser mayor de 18 años'),
  bio: yup.string().max(500, 'Máximo 500 caracteres'),
  avatar: yup.mixed(),
  newsletter: yup.boolean(),
  terms: yup.boolean().oneOf([true], 'Debes aceptar los términos y condiciones'),
})

const initialValues = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  country: '',
  birthDate: undefined as Date | undefined,
  bio: '',
  avatar: null,
  newsletter: false,
  terms: false,
})

const countryOptions: SelectOption[] = [
  { value: 'PE', label: 'Perú' },
  { value: 'CO', label: 'Colombia' },
  { value: 'MX', label: 'México' },
  { value: 'AR', label: 'Argentina' },
  { value: 'CL', label: 'Chile' },
  { value: 'US', label: 'Estados Unidos' },
  { value: 'ES', label: 'España' },
]

const sampleOptions: SelectOption[] = [
  { value: 'option1', label: 'Opción 1' },
  { value: 'option2', label: 'Opción 2' },
  { value: 'option3', label: 'Opción 3' },
  { value: 'disabled', label: 'Opción Deshabilitada', disabled: true },
]

const handleSubmit = async (values: Record<string, unknown>) => {
  console.log('Formulario enviado:', values)

  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 2000))

  alert('¡Formulario enviado correctamente! Revisa la consola para ver los datos.')
}

const handleCancel = () => {
  console.log('Formulario cancelado')
  alert('Formulario cancelado')
}
</script>
