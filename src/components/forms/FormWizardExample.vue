<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Form Wizard Example
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Demonstration of the FormWizard component with multi-step form functionality
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Wizard -->
      <div class="lg:col-span-2">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <FormWizard
            :steps="wizardSteps"
            :initial-values="initialValues"
            :show-save-draft="true"
            :auto-save-draft="true"
            :auto-save-interval="10000"
            :persist-key="'example-wizard'"
            :show-debug-info="showDebug"
            submit-text="Create Product"
            @submit="handleSubmit"
            @step-change="handleStepChange"
            @draft-save="handleDraftSave"
            @draft-load="handleDraftLoad"
            @cancel="handleCancel"
            @step-validation="handleStepValidation"
          />
        </div>
      </div>

      <!-- Controls & Info -->
      <div class="space-y-6">
        <!-- Controls -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Controls
          </h3>
          <div class="space-y-3">
            <label class="flex items-center">
              <input
                v-model="showDebug"
                type="checkbox"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Show Debug Info
              </span>
            </label>

            <button
              @click="resetWizard"
              class="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Reset Wizard
            </button>

            <button
              @click="loadSampleData"
              class="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Load Sample Data
            </button>
          </div>
        </div>

        <!-- Event Log -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Event Log
          </h3>
          <div class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="(event, index) in eventLog"
              :key="index"
              class="text-xs p-2 bg-gray-50 dark:bg-gray-700 rounded border-l-2"
              :class="getEventColor(event.type)"
            >
              <div class="font-medium">{{ event.type }}</div>
              <div class="text-gray-600 dark:text-gray-400">{{ event.timestamp }}</div>
              <pre v-if="event.data" class="mt-1 text-gray-700 dark:text-gray-300">{{ JSON.stringify(event.data, null, 2) }}</pre>
            </div>
          </div>
          <button
            @click="clearEventLog"
            class="mt-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear Log
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import * as yup from 'yup'
import FormWizard, { type WizardStep } from './FormWizard.vue'
import FormInput from './FormInput.vue'
import FormSelect from './FormSelect.vue'
import FormTextarea from './FormTextarea.vue'
import FormFileUpload from './FormFileUpload.vue'

// State
const showDebug = ref(false)
const eventLog = ref<Array<{ type: string; timestamp: string; data?: any }>>([])

// Sample initial values
const initialValues = ref({})

// Step Components
const BasicInfoStep = {
  template: `
    <div class="space-y-4">
      <FormInput
        name="name"
        label="Product Name"
        placeholder="Enter product name"
        required
      />
      <FormInput
        name="sku"
        label="SKU"
        placeholder="Enter product SKU"
        required
      />
      <FormSelect
        name="category"
        label="Category"
        :options="categoryOptions"
        placeholder="Select category"
        required
      />
      <FormTextarea
        name="description"
        label="Description"
        placeholder="Enter product description"
        rows="3"
      />
    </div>
  `,
  components: { FormInput, FormSelect, FormTextarea },
  data() {
    return {
      categoryOptions: [
        { value: 'electronics', label: 'Electronics' },
        { value: 'clothing', label: 'Clothing' },
        { value: 'books', label: 'Books' },
        { value: 'home', label: 'Home & Garden' },
      ]
    }
  }
}

const PricingStep = {
  template: `
    <div class="space-y-4">
      <FormInput
        name="price"
        label="Price"
        type="number"
        step="0.01"
        placeholder="0.00"
        required
      />
      <FormInput
        name="cost"
        label="Cost"
        type="number"
        step="0.01"
        placeholder="0.00"
      />
      <FormSelect
        name="currency"
        label="Currency"
        :options="currencyOptions"
        required
      />
      <FormInput
        name="taxRate"
        label="Tax Rate (%)"
        type="number"
        step="0.01"
        placeholder="0.00"
      />
    </div>
  `,
  components: { FormInput, FormSelect },
  data() {
    return {
      currencyOptions: [
        { value: 'PEN', label: 'Soles (PEN)' },
        { value: 'USD', label: 'US Dollar (USD)' },
        { value: 'EUR', label: 'Euro (EUR)' },
      ]
    }
  }
}

const InventoryStep = {
  template: `
    <div class="space-y-4">
      <FormInput
        name="initialStock"
        label="Initial Stock"
        type="number"
        placeholder="0"
        required
      />
      <FormInput
        name="minStock"
        label="Minimum Stock"
        type="number"
        placeholder="0"
      />
      <FormInput
        name="maxStock"
        label="Maximum Stock"
        type="number"
        placeholder="0"
      />
      <FormSelect
        name="unit"
        label="Unit of Measure"
        :options="unitOptions"
        required
      />
    </div>
  `,
  components: { FormInput, FormSelect },
  data() {
    return {
      unitOptions: [
        { value: 'NIU', label: 'Unit (NIU)' },
        { value: 'KGM', label: 'Kilogram (KGM)' },
        { value: 'MTR', label: 'Meter (MTR)' },
        { value: 'LTR', label: 'Liter (LTR)' },
      ]
    }
  }
}

const MediaStep = {
  template: `
    <div class="space-y-4">
      <FormFileUpload
        name="images"
        label="Product Images"
        accept="image/*"
        multiple
        :max-files="5"
      />
      <FormInput
        name="barcode"
        label="Barcode"
        placeholder="Enter barcode"
      />
      <div class="text-sm text-gray-600 dark:text-gray-400">
        <p>This step is optional. You can skip it if you don't have images or barcode ready.</p>
      </div>
    </div>
  `,
  components: { FormFileUpload, FormInput }
}

// Wizard Steps Configuration
const wizardSteps = computed((): WizardStep[] => [
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Enter basic product details',
    component: BasicInfoStep,
    schema: yup.object({
      name: yup.string().required('Product name is required'),
      sku: yup.string().required('SKU is required'),
      category: yup.string().required('Category is required'),
      description: yup.string().optional(),
    }),
  },
  {
    id: 'pricing',
    title: 'Pricing',
    description: 'Set product pricing information',
    component: PricingStep,
    schema: yup.object({
      price: yup.number().positive('Price must be positive').required('Price is required'),
      cost: yup.number().positive('Cost must be positive').optional(),
      currency: yup.string().required('Currency is required'),
      taxRate: yup.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate cannot exceed 100%').optional(),
    }),
    validation: (values) => {
      if (values.cost && values.price && values.cost >= values.price) {
        return 'Cost should be less than the selling price'
      }
      return true
    }
  },
  {
    id: 'inventory',
    title: 'Inventory',
    description: 'Configure inventory settings',
    component: InventoryStep,
    schema: yup.object({
      initialStock: yup.number().min(0, 'Stock cannot be negative').required('Initial stock is required'),
      minStock: yup.number().min(0, 'Minimum stock cannot be negative').optional(),
      maxStock: yup.number().min(0, 'Maximum stock cannot be negative').optional(),
      unit: yup.string().required('Unit of measure is required'),
    }),
    validation: (values) => {
      const errors: string[] = []

      if (values.minStock && values.maxStock && values.minStock >= values.maxStock) {
        errors.push('Minimum stock should be less than maximum stock')
      }

      if (values.initialStock && values.maxStock && values.initialStock > values.maxStock) {
        errors.push('Initial stock cannot exceed maximum stock')
      }

      return errors.length > 0 ? errors : true
    }
  },
  {
    id: 'media',
    title: 'Media & Barcode',
    description: 'Upload images and set barcode',
    component: MediaStep,
    schema: yup.object({
      images: yup.array().optional(),
      barcode: yup.string().optional(),
    }),
    optional: true,
    canSkip: true,
  },
])

// Event Handlers
const handleSubmit = (values: any) => {
  logEvent('submit', values)
  alert('Product created successfully!')
}

const handleStepChange = (stepIndex: number, stepId: string, direction: 'next' | 'previous') => {
  logEvent('stepChange', { stepIndex, stepId, direction })
}

const handleDraftSave = (values: any) => {
  logEvent('draftSave', values)
}

const handleDraftLoad = (values: any) => {
  logEvent('draftLoad', values)
}

const handleCancel = () => {
  logEvent('cancel')
  if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
    resetWizard()
  }
}

const handleStepValidation = (stepIndex: number, isValid: boolean, errors: string[]) => {
  logEvent('stepValidation', { stepIndex, isValid, errors })
}

// Utility Functions
const logEvent = (type: string, data?: any) => {
  eventLog.value.unshift({
    type,
    timestamp: new Date().toLocaleTimeString(),
    data
  })

  // Keep only last 20 events
  if (eventLog.value.length > 20) {
    eventLog.value = eventLog.value.slice(0, 20)
  }
}

const getEventColor = (type: string) => {
  const colors = {
    submit: 'border-green-500',
    stepChange: 'border-blue-500',
    draftSave: 'border-yellow-500',
    draftLoad: 'border-purple-500',
    cancel: 'border-red-500',
    stepValidation: 'border-orange-500',
  }
  return colors[type as keyof typeof colors] || 'border-gray-500'
}

const clearEventLog = () => {
  eventLog.value = []
}

const resetWizard = () => {
  initialValues.value = {}
  // Clear localStorage draft
  localStorage.removeItem('wizard-draft-example-wizard')
  location.reload()
}

const loadSampleData = () => {
  initialValues.value = {
    'basic-info': {
      name: 'Sample Product',
      sku: 'SAMPLE-001',
      category: 'electronics',
      description: 'This is a sample product for demonstration purposes.'
    },
    'pricing': {
      price: 99.99,
      cost: 50.00,
      currency: 'PEN',
      taxRate: 18.00
    },
    'inventory': {
      initialStock: 100,
      minStock: 10,
      maxStock: 500,
      unit: 'NIU'
    }
  }
  location.reload()
}
</script>
