<template>
  <div class="max-w-4xl mx-auto">
    <!-- Progress Indicator -->
    <div class="mb-8">
      <div class="flex items-center">
        <div
          v-for="(step, index) in steps"
          :key="step.id"
          class="flex items-center flex-1"
        >
          <!-- Step Circle -->
          <div class="flex items-center">
            <div
              :class="[
                'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200',
                getStepClasses(index)
              ]"
            >
              <CheckIcon
                v-if="index < currentStep"
                class="w-5 h-5 text-white"
              />
              <span
                v-else
                :class="[
                  'text-sm font-medium',
                  index === currentStep ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                ]"
              >
                {{ index + 1 }}
              </span>
            </div>

            <!-- Step Label -->
            <div class="ml-3 min-w-0">
              <p
                :class="[
                  'text-sm font-medium truncate',
                  index <= currentStep ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
                ]"
              >
                {{ step.title }}
              </p>
              <p
                v-if="step.description"
                :class="[
                  'text-xs truncate',
                  index <= currentStep ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'
                ]"
              >
                {{ step.description }}
              </p>
            </div>
          </div>

          <!-- Connector Line -->
          <div
            v-if="index < steps.length - 1"
            :class="[
              'flex-1 h-0.5 mx-4 transition-colors duration-200',
              index < currentStep ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
            ]"
          />
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="mt-4">
        <div class="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            class="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
            :style="{ width: `${progressPercentage}%` }"
          />
        </div>
        <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>{{ currentStep + 1 }} de {{ steps.length }}</span>
          <span>{{ Math.round(progressPercentage) }}% completado</span>
        </div>
      </div>
    </div>

    <!-- Step Content -->
    <div class="min-h-[400px]">
      <Transition
        name="step"
        mode="out-in"
      >
        <div
          :key="currentStep"
          class="space-y-6"
        >
          <div class="step-header">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {{ currentStepData.title }}
            </h3>
            <p
              v-if="currentStepData.description"
              class="text-sm text-gray-600 dark:text-gray-400 mt-1"
            >
              {{ currentStepData.description }}
            </p>
          </div>

          <!-- Step Validation Errors -->
          <div
            v-if="stepErrors.length > 0"
            class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div class="flex">
              <AlertCircleIcon class="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h4 class="text-sm font-medium text-red-800 dark:text-red-200">
                  Por favor corrige los siguientes errores:
                </h4>
                <ul class="mt-2 text-sm text-red-700 dark:text-red-300 list-disc list-inside">
                  <li v-for="error in stepErrors" :key="error">{{ error }}</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="step-form">
            <BaseForm
              ref="currentStepForm"
              :schema="currentStepData.schema"
              :initial-values="getStepValues(currentStepData.id)"
              :show-actions="false"
              @submit="handleStepSubmit"
              @cancel="handleStepCancel"
            >
              <template #default="{ values, errors, meta }">
                <component
                  :is="currentStepData.component"
                  v-bind="currentStepData.props || {}"
                  :values="values"
                  :errors="errors"
                  :meta="meta"
                  @update:values="updateStepValues"
                />
              </template>
            </BaseForm>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Navigation -->
    <div class="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
      <BaseButton
        v-if="currentStep > 0"
        type="button"
        variant="outline"
        @click="previousStep"
        :disabled="isSubmitting"
      >
        <ChevronLeftIcon class="w-4 h-4 mr-2" />
        Anterior
      </BaseButton>

      <div v-else class="flex-1" />

      <div class="flex space-x-3">
        <BaseButton
          v-if="showSaveDraft"
          type="button"
          variant="ghost"
          @click="saveDraft"
          :loading="isSavingDraft"
          :disabled="isSubmitting"
        >
          <SaveIcon class="w-4 h-4 mr-2" />
          Guardar Borrador
        </BaseButton>

        <BaseButton
          v-if="currentStep < steps.length - 1"
          type="button"
          @click="nextStep"
          :disabled="!canProceedToNextStep || isSubmitting"
        >
          Siguiente
          <ChevronRightIcon class="w-4 h-4 ml-2" />
        </BaseButton>

        <BaseButton
          v-else
          type="button"
          @click="completeWizard"
          :loading="isSubmitting"
          :disabled="!canCompleteWizard"
        >
          <CheckIcon class="w-4 h-4 mr-2" />
          {{ submitText }}
        </BaseButton>
      </div>
    </div>

    <!-- Draft Status -->
    <Transition name="fade">
      <div
        v-if="draftSaved"
        class="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
      >
        <div class="flex items-center">
          <CheckCircleIcon class="w-5 h-5 text-green-500 mr-2" />
          <span class="text-sm text-green-700 dark:text-green-300">
            Borrador guardado {{ lastSavedTime ? `a las ${lastSavedTime}` : 'automáticamente' }}
          </span>
        </div>
      </div>
    </Transition>

    <!-- Debug Info (development only) -->
    <div
      v-if="showDebugInfo && isDevelopment"
      class="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border"
    >
      <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Debug Info</h4>
      <pre class="text-xs text-gray-600 dark:text-gray-400">{{ debugInfo }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useForm } from 'vee-validate'
import type { ObjectSchema } from 'yup'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseForm from './BaseForm.vue'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  CheckIcon,
  SaveIcon,
  AlertCircleIcon
} from 'lucide-vue-next'

export interface WizardStep {
  id: string
  title: string
  description?: string
  component: any
  schema: ObjectSchema<any>
  props?: Record<string, any>
  validation?: (values: any) => boolean | string | string[]
  canSkip?: boolean
  optional?: boolean
}

interface Props {
  steps: WizardStep[]
  initialValues?: Record<string, any>
  submitText?: string
  showSaveDraft?: boolean
  autoSaveDraft?: boolean
  autoSaveInterval?: number
  persistKey?: string
  showDebugInfo?: boolean
  validateOnStepChange?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  submitText: 'Completar',
  showSaveDraft: true,
  autoSaveDraft: true,
  autoSaveInterval: 30000, // 30 seconds
  showDebugInfo: false,
  validateOnStepChange: true,
})

const emit = defineEmits<{
  submit: [values: Record<string, any>]
  stepChange: [stepIndex: number, stepId: string, direction: 'next' | 'previous']
  draftSave: [values: Record<string, any>]
  draftLoad: [values: Record<string, any>]
  cancel: []
  stepValidation: [stepIndex: number, isValid: boolean, errors: string[]]
}>()

// State
const currentStep = ref(0)
const stepValues = ref<Record<string, any>>({})
const stepValidationState = ref<Record<string, boolean>>({})
const stepErrors = ref<string[]>([])
const isSubmitting = ref(false)
const isSavingDraft = ref(false)
const draftSaved = ref(false)
const lastSavedTime = ref<string>('')
const autoSaveTimer = ref<number | null>(null)
const currentStepForm = ref<InstanceType<typeof BaseForm> | null>(null)

// Environment detection
const isDevelopment = computed(() => import.meta.env.DEV)

// Computed
const currentStepData = computed(() => props.steps[currentStep.value])

const progressPercentage = computed(() => {
  return ((currentStep.value + 1) / props.steps.length) * 100
})

const canProceedToNextStep = computed(() => {
  const stepData = currentStepData.value
  if (!stepData) return false

  const stepId = stepData.id
  const stepValue = stepValues.value[stepId]

  // Check if step can be skipped
  if (stepData.canSkip) return true

  // Check if step is optional and has no data
  if (stepData.optional && (!stepValue || Object.keys(stepValue).length === 0)) {
    return true
  }

  // Check custom validation
  if (stepData.validation) {
    const validationResult = stepData.validation(stepValue)
    if (typeof validationResult === 'string') {
      stepErrors.value = [validationResult]
      return false
    }
    if (Array.isArray(validationResult)) {
      stepErrors.value = validationResult
      return false
    }
    if (!validationResult) {
      stepErrors.value = ['Este paso requiere información válida']
      return false
    }
  }

  // Check form validation state
  const isValid = stepValidationState.value[stepId] ?? false
  if (!isValid) {
    return false
  }

  stepErrors.value = []
  return true
})

const canCompleteWizard = computed(() => {
  // Check if all required steps are valid
  const allRequiredStepsValid = props.steps.every((step, index) => {
    if (step.optional || step.canSkip) return true
    return stepValidationState.value[step.id] ?? false
  })

  return allRequiredStepsValid && currentStep.value === props.steps.length - 1
})

const debugInfo = computed(() => ({
  currentStep: currentStep.value,
  currentStepId: currentStepData.value?.id,
  stepValues: stepValues.value,
  stepValidationState: stepValidationState.value,
  canProceedToNextStep: canProceedToNextStep.value,
  canCompleteWizard: canCompleteWizard.value,
  stepErrors: stepErrors.value,
}))

// Methods
const getStepClasses = (index: number) => {
  if (index < currentStep.value) {
    return 'bg-green-500 border-green-500 shadow-md'
  }
  if (index === currentStep.value) {
    return 'bg-blue-500 border-blue-500 shadow-lg ring-2 ring-blue-200 dark:ring-blue-800'
  }
  return 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
}

const getStepValues = (stepId: string) => {
  return stepValues.value[stepId] || {}
}

const updateStepValues = (values: any) => {
  const stepId = currentStepData.value.id
  stepValues.value[stepId] = { ...values }

  // Trigger auto-save if enabled
  if (props.autoSaveDraft) {
    debouncedAutoSave()
  }
}

const validateCurrentStep = async (): Promise<boolean> => {
  const stepData = currentStepData.value
  if (!stepData) return false

  const stepId = stepData.id
  const stepValue = stepValues.value[stepId]

  try {
    // Validate using schema
    if (stepData.schema) {
      await stepData.schema.validate(stepValue, { abortEarly: false })
    }

    // Custom validation
    if (stepData.validation) {
      const validationResult = stepData.validation(stepValue)
      if (typeof validationResult === 'string') {
        stepErrors.value = [validationResult]
        return false
      }
      if (Array.isArray(validationResult)) {
        stepErrors.value = validationResult
        return false
      }
      if (!validationResult) {
        stepErrors.value = ['Validación fallida']
        return false
      }
    }

    stepValidationState.value[stepId] = true
    stepErrors.value = []
    emit('stepValidation', currentStep.value, true, [])
    return true
  } catch (error: any) {
    const errors = error.inner?.map((err: any) => err.message) || [error.message || 'Error de validación']
    stepErrors.value = errors
    stepValidationState.value[stepId] = false
    emit('stepValidation', currentStep.value, false, errors)
    return false
  }
}

const handleStepSubmit = (values: any) => {
  updateStepValues(values)
  if (currentStep.value < props.steps.length - 1) {
    nextStep()
  } else {
    completeWizard()
  }
}

const handleStepCancel = () => {
  emit('cancel')
}

const nextStep = async () => {
  if (props.validateOnStepChange) {
    const isValid = await validateCurrentStep()
    if (!isValid && !currentStepData.value.canSkip) {
      return
    }
  }

  if (currentStep.value < props.steps.length - 1) {
    currentStep.value++
    emit('stepChange', currentStep.value, props.steps[currentStep.value].id, 'next')
  }
}

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
    emit('stepChange', currentStep.value, props.steps[currentStep.value].id, 'previous')
  }
}

const goToStep = (stepIndex: number) => {
  if (stepIndex >= 0 && stepIndex < props.steps.length) {
    currentStep.value = stepIndex
    emit('stepChange', stepIndex, props.steps[stepIndex].id, stepIndex > currentStep.value ? 'next' : 'previous')
  }
}

const completeWizard = async () => {
  // Validate all steps before submitting
  let allValid = true
  const allErrors: string[] = []

  for (let i = 0; i < props.steps.length; i++) {
    const step = props.steps[i]
    if (step.optional || step.canSkip) continue

    const stepValue = stepValues.value[step.id]

    try {
      if (step.schema) {
        await step.schema.validate(stepValue, { abortEarly: false })
      }

      if (step.validation) {
        const validationResult = step.validation(stepValue)
        if (typeof validationResult === 'string') {
          allErrors.push(`${step.title}: ${validationResult}`)
          allValid = false
        } else if (Array.isArray(validationResult)) {
          allErrors.push(...validationResult.map(err => `${step.title}: ${err}`))
          allValid = false
        } else if (!validationResult) {
          allErrors.push(`${step.title}: Validación fallida`)
          allValid = false
        }
      }
    } catch (error: any) {
      const errors = error.inner?.map((err: any) => `${step.title}: ${err.message}`) || [`${step.title}: ${error.message}`]
      allErrors.push(...errors)
      allValid = false
    }
  }

  if (!allValid) {
    stepErrors.value = allErrors
    return
  }

  isSubmitting.value = true
  try {
    const allValues = { ...stepValues.value }
    emit('submit', allValues)
  } finally {
    isSubmitting.value = false
  }
}

const saveDraft = async () => {
  isSavingDraft.value = true
  try {
    const allValues = { ...stepValues.value }

    // Save to localStorage if persistKey is provided
    if (props.persistKey) {
      localStorage.setItem(`wizard-draft-${props.persistKey}`, JSON.stringify({
        values: allValues,
        currentStep: currentStep.value,
        timestamp: Date.now()
      }))
    }

    emit('draftSave', allValues)
    draftSaved.value = true
    lastSavedTime.value = new Date().toLocaleTimeString()

    setTimeout(() => {
      draftSaved.value = false
    }, 3000)
  } finally {
    isSavingDraft.value = false
  }
}

const loadDraft = () => {
  if (!props.persistKey) return

  try {
    const saved = localStorage.getItem(`wizard-draft-${props.persistKey}`)
    if (saved) {
      const { values, currentStep: savedStep, timestamp } = JSON.parse(saved)

      // Check if draft is not too old (24 hours)
      const isRecent = Date.now() - timestamp < 24 * 60 * 60 * 1000

      if (isRecent) {
        stepValues.value = values
        currentStep.value = savedStep
        emit('draftLoad', values)
      }
    }
  } catch (error) {
    console.warn('Failed to load draft:', error)
  }
}

const clearDraft = () => {
  if (props.persistKey) {
    localStorage.removeItem(`wizard-draft-${props.persistKey}`)
  }
}

// Debounced auto-save
let autoSaveTimeout: number | null = null
const debouncedAutoSave = () => {
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout)
  }
  autoSaveTimeout = window.setTimeout(() => {
    if (Object.keys(stepValues.value).length > 0) {
      saveDraft()
    }
  }, 2000) // 2 second debounce
}

// Watch for step changes to clear errors
watch(currentStep, () => {
  stepErrors.value = []
  nextTick(() => {
    // Focus first input in new step
    const firstInput = document.querySelector('.step-form input, .step-form select, .step-form textarea') as HTMLElement
    if (firstInput) {
      firstInput.focus()
    }
  })
})

// Lifecycle
onMounted(() => {
  // Load draft if available
  loadDraft()

  // Initialize with initial values
  if (props.initialValues) {
    stepValues.value = { ...props.initialValues, ...stepValues.value }
  }

  // Set up auto-save timer
  if (props.autoSaveDraft) {
    autoSaveTimer.value = window.setInterval(() => {
      if (Object.keys(stepValues.value).length > 0) {
        saveDraft()
      }
    }, props.autoSaveInterval)
  }
})

onUnmounted(() => {
  if (autoSaveTimer.value) {
    clearInterval(autoSaveTimer.value)
  }
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout)
  }
})

// Expose methods for parent components
defineExpose({
  nextStep,
  previousStep,
  goToStep,
  saveDraft,
  loadDraft,
  clearDraft,
  validateCurrentStep,
  getCurrentStepValues: () => getStepValues(currentStepData.value.id),
  getAllValues: () => ({ ...stepValues.value }),
  currentStep: computed(() => currentStep.value),
  isValid: canCompleteWizard,
})
</script>

<style scoped>
/* Step transitions */
.step-enter-active,
.step-leave-active {
  transition: all 0.3s ease;
}

.step-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.step-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Fade transition for notifications */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Progress bar animation */
.progress-bar {
  transition: width 0.3s ease-out;
}

/* Step circle hover effects */
.step-circle:hover {
  transform: scale(1.05);
}

/* Focus styles for accessibility */
.step-form :deep(input:focus),
.step-form :deep(select:focus),
.step-form :deep(textarea:focus) {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .step-header h3 {
    font-size: 1rem;
  }

  .step-circle {
    width: 2rem;
    height: 2rem;
  }

  .step-label {
    font-size: 0.75rem;
  }
}
</style>
