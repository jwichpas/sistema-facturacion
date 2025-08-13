<template>
  <div class="max-w-2xl mx-auto p-6">
    <h2 class="text-2xl font-bold mb-6">Form Components Example</h2>

    <BaseForm
      :schema="validationSchema"
      :initial-values="initialValues"
      @submit="handleSubmit"
      @cancel="handleCancel"
    >
      <template #default="{ errors, values, isSubmitting }">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            name="firstName"
            label="First Name"
            placeholder="Enter your first name"
            required
          />

          <FormInput
            name="lastName"
            label="Last Name"
            placeholder="Enter your last name"
            required
          />

          <FormInput
            name="email"
            type="email"
            label="Email"
            placeholder="Enter your email"
            required
          />

          <FormInput
            name="phone"
            type="tel"
            label="Phone"
            placeholder="Enter your phone number"
          />

          <FormSelect
            name="country"
            label="Country"
            placeholder="Select a country"
            :options="countryOptions"
            required
          />

          <FormDatePicker
            name="birthDate"
            label="Birth Date"
            hint="Select your date of birth"
          />
        </div>

        <FormTextarea
          name="bio"
          label="Biography"
          placeholder="Tell us about yourself"
          hint="Optional field"
          :rows="4"
        />

        <FormCheckbox
          name="newsletter"
          label="Subscribe to newsletter"
          description="Receive updates about new features and products"
        />

        <FormCheckbox
          name="terms"
          label="I agree to the terms and conditions"
          required
        />

        <!-- Debug info -->
        <div v-if="showDebug" class="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h3 class="font-semibold mb-2">Debug Info:</h3>
          <pre class="text-xs">{{ JSON.stringify({ values, errors }, null, 2) }}</pre>
        </div>
      </template>
    </BaseForm>

    <div class="mt-4 flex justify-center">
      <button
        @click="showDebug = !showDebug"
        class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        {{ showDebug ? 'Hide' : 'Show' }} Debug Info
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import * as yup from 'yup'
import {
  BaseForm,
  FormInput,
  FormSelect,
  FormTextarea,
  FormDatePicker,
  FormCheckbox,
} from './index'

const showDebug = ref(false)

const validationSchema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  phone: yup.string(),
  country: yup.string().required('Country is required'),
  birthDate: yup.date(),
  bio: yup.string(),
  newsletter: yup.boolean(),
  terms: yup.boolean().oneOf([true], 'You must accept the terms and conditions'),
})

const initialValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  country: '',
  birthDate: '',
  bio: '',
  newsletter: false,
  terms: false,
}

const countryOptions = [
  { value: 'pe', label: 'Peru' },
  { value: 'us', label: 'United States' },
  { value: 'mx', label: 'Mexico' },
  { value: 'ar', label: 'Argentina' },
  { value: 'br', label: 'Brazil' },
  { value: 'cl', label: 'Chile' },
]

const handleSubmit = async (values: any) => {
  console.log('Form submitted:', values)

  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 2000))

  alert('Form submitted successfully!')
}

const handleCancel = () => {
  console.log('Form cancelled')
}
</script>
