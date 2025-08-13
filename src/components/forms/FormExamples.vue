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

    <!-- Form Wizard Example -->
    <div class="space-y-4">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Formulario por Pasos (Wizard)
      </h2>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <FormWizard
          :steps="wizardSteps"
          :initial-values="wizardValues"
          submit-text="Crear Cuenta"
          @submit="handleWizardSubmit"
          @step-change="handleWizardStepChange"
          @draft-save="handleWizardDraftSave"
          @cancel="handleWizardCancel"
        />
      </div>
    </div>

    <!-- Dynamic Form Example -->
    <div class="space-y-4">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Formulario Dinámico
      </h2>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <DynamicForm
          :fields="dynamicFormFields"
          :initial-values="dynamicFormValues"
          submit-text="Guardar Producto"
          @submit="handleDynamicFormSubmit"
          @cancel="handleDynamicFormCancel"
        />
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
  FormWizard,
  DynamicForm,
  type FormFieldOption,
  type WizardStep,
  type DynamicField
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
  birthDate: null,
  comments: '',
  terms: false
})

const countryOptions: FormFieldOption[] = [
  { value: 'PE', label: 'Perú' },
  { value: 'MX', label: 'México' },
  { value: 'CO', label: 'Colombia' },
  { value: 'AR', label: 'Argentina' },
  { value: 'CL', label: 'Chile' }
]

// Wizard Steps
const wizardSteps: WizardStep[] = [
  {
    id: 'personal',
    title: 'Información Personal',
    description: 'Datos básicos del usuario',
    component: BaseForm,
    schema: object({
      firstName: string().required('El nombre es requerido'),
      lastName: string().required('El apellido es requerido'),
      email: string().email('Email inválido').required('El email es requerido'),
      phone: string()
    })
  },
  {
    id: 'address',
    title: 'Dirección',
    description: 'Información de ubicación',
    component: BaseForm,
    schema: object({
      street: string().required('La calle es requerida'),
      city: string().required('La ciudad es requerida'),
      state: string().required('El estado es requerido'),
      zipCode: string().required('El código postal es requerido')
    })
  },
  {
    id: 'preferences',
    title: 'Preferencias',
    description: 'Configuración de la cuenta',
    component: BaseForm,
    schema: object({
      newsletter: boolean(),
      notifications: boolean(),
      language: string().required('El idioma es requerido'),
      timezone: string().required('La zona horaria es requerida')
    })
  }
]

const wizardValues = ref({
  personal: {
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  },
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: ''
  },
  preferences: {
    newsletter: false,
    notifications: true,
    language: 'es',
    timezone: 'America/Lima'
  }
})

// Dynamic Form Fields
const dynamicFormFields: DynamicField[] = [
  {
    name: 'name',
    type: 'text',
    label: 'Nombre del Producto',
    placeholder: 'Ingrese el nombre del producto',
    required: true
  },
  {
    name: 'category',
    type: 'select',
    label: 'Categoría',
    placeholder: 'Seleccione una categoría',
    required: true,
    options: [
      { value: 'electronics', label: 'Electrónicos' },
      { value: 'clothing', label: 'Ropa' },
      { value: 'books', label: 'Libros' },
      { value: 'other', label: 'Otros' }
    ]
  },
  {
    name: 'price',
    type: 'number',
    label: 'Precio',
    placeholder: '0.00',
    required: true,
    min: 0,
    step: 0.01
  },
  {
    name: 'description',
    type: 'textarea',
    label: 'Descripción',
    placeholder: 'Descripción del producto...',
    rows: 4
  },
  {
    name: 'isDigital',
    type: 'checkbox',
    label: 'Producto Digital',
    description: 'Marque si es un producto digital (software, ebook, etc.)'
  },
  {
    name: 'downloadUrl',
    type: 'url',
    label: 'URL de Descarga',
    placeholder: 'https://ejemplo.com/descarga',
    conditional: {
      field: 'isDigital',
      value: true,
      operator: 'eq',
      fields: [
        {
          name: 'downloadUrl',
          type: 'url',
          label: 'URL de Descarga',
          placeholder: 'https://ejemplo.com/descarga',
          required: true
        }
      ]
    }
  },
  {
    name: 'stock',
    type: 'number',
    label: 'Stock Disponible',
    placeholder: '0',
    min: 0,
    conditional: {
      field: 'isDigital',
      value: false,
      operator: 'eq',
      fields: [
        {
          name: 'stock',
          type: 'number',
          label: 'Stock Disponible',
          placeholder: '0',
          min: 0,
          required: true
        }
      ]
    }
  },
  {
    name: 'releaseDate',
    type: 'date',
    label: 'Fecha de Lanzamiento',
    placeholder: 'Seleccione fecha'
  }
]

const dynamicFormValues = ref({
  name: '',
  category: '',
  price: '',
  description: '',
  isDigital: false,
  downloadUrl: '',
  stock: '',
  releaseDate: null
})

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

const handleWizardSubmit = (values: any) => {
  console.log('Wizard submitted:', values)
  formResults.value = { type: 'wizard', data: values }
}

const handleWizardStepChange = (stepIndex: number, stepId: string) => {
  console.log('Wizard step changed:', stepIndex, stepId)
}

const handleWizardDraftSave = (values: any) => {
  console.log('Wizard draft saved:', values)
}

const handleWizardCancel = () => {
  console.log('Wizard cancelled')
}

const handleDynamicFormSubmit = (values: any) => {
  console.log('Dynamic form submitted:', values)
  formResults.value = { type: 'dynamic', data: values }
}

const handleDynamicFormCancel = () => {
  console.log('Dynamic form cancelled')
}
</script>
