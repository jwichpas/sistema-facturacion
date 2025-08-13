<template>
  <div class="max-w-4xl mx-auto">
    <!-- Progress Indicator -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div
          v-for="(step, index) in steps"
          :key="step.id"
          class="flex items-center"
        >
          <!-- Step Circle -->
          <div
            :class="[
              'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
              getStepClasses(index)
            ]"
          >
            <span
              v-if="index < currentStep"
              class="text-white text-sm font-medium"
            >
              ✓
            </span>
            <span
              v-else
              :class="[
                'text-sm font-medium',
                index === currentStep ? 'text-white' : 'text-gray-500'
              ]"
            >
              {{ index + 1 }}
            </span>
          </div>

          <!-- Step Label -->
          <div class="ml-3">
            <p
              :class="[
                'text-sm font-medium',
                index <= currentStep ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500'
              ]"
            >
              {{ step.title }}
            </p>
            <p
              v-if="step.description"
              :class="[
                'text-xs',
                index <= currentStep ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400'
              ]"
            >
              {{ step.description }}
            </p>
          </div>

          <!-- Connector Line -->
          <div
            v-if="index < steps.length - 1"
            :class="[
              'flex-1 h-0.5 mx-4 transition-colors',
              index < currentStep ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
            ]"
          />
        </div>
      </div>
    </div>

    <!-- Step Content -->
    <div class="min-h-[400px]">
      <div
        v-for="(step, index) in steps"
        :key="step.id"
        v-show="index === currentStep"
        class="space-y-6"
      >
        <div class="step-header">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {{ step.title }}
          </h3>
          <p
            v-if="step.description"
            class="text-sm text-gray-600 dark:text-gray-400 mt-1"
          >
            {{ step.description }}
          </p>
        </div>

        <div class="step-form">
          <component
            :is="step.component"
            v-bind="step.props || {}"
            :schema="step.schema"
            :initial-values="getStepValues(step.id)"
            :show-actions="false"
            @submit="handleStepSubmit"
            @cancel="handleStepCancel"
          />
        </div>
      </div>
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
          variant="outline"
          @click="saveDraft"
          :loading="isSavingDraft"
        >
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
          {{ submitText }}
        </BaseButton>
      </div>
    </div>

    <!-- Draft Status -->
    <div
      v-if="draftSaved"
      class="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
    >
      <div class="flex items-center">
        <CheckCircleIcon class="w-5 h-5 text-green-500 mr-2" />
        <span class="text-sm text-green-700 dark:text-green-300">
          Borrador guardado automáticamente
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useForm } from 'vee-validate'
import type { ObjectSchema } from 'yup'
import BaseButton from '@/components/ui/BaseButton.vue'
import { ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon } from 'lucide-vue-next'

interface WizardStep {
  id: string
  title: string
  description?: string
  component: any
  schema: ObjectSchema<any>
  props?: Record<string, any>
  validation?: (values: any) => boolean | string
}

interface Props {
  steps: WizardStep[]
  initialValues?: Record<string, any>
  submitText?: string
  showSaveDraft?: boolean
  autoSaveDraft?: boolean
  autoSaveInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  submitText: 'Completar',
  showSaveDraft: true,
  autoSaveDraft: true,
  autoSaveInterval: 30000, // 30 seconds
})

const emit = defineEmits<{
  submit: [values: any]
  stepChange: [stepIndex: number, stepId: string]
  draftSave: [values: any]
  cancel: []
}>()

// State
const currentStep = ref(0)
const stepValues = ref<Record<string, any>>({})
const isSubmitting = ref(false)
const isSavingDraft = ref(false)
const draftSaved = ref(false)
const autoSaveTimer = ref<number | null>(null)

// Form validation for current step
const { meta: currentStepMeta } = useForm({
  validationSchema: computed(() => props.steps[currentStep.value]?.schema),
})

// Computed
const canProceedToNextStep = computed(() => {
  const currentStepData = props.steps[currentStep.value]
  if (!currentStepData) return false

  // Check if current step has custom validation
  if (currentStepData.validation) {
    const validationResult = currentStepData.validation(stepValues.value[currentStepData.id])
    if (typeof validationResult === 'string') return false
    if (!validationResult) return false
  }

  return currentStepMeta.value.valid
})

const canCompleteWizard = computed(() => {
  return canProceedToNextStep.value && currentStep.value === props.steps.length - 1
})

// Methods
const getStepClasses = (index: number) => {
  if (index < currentStep.value) {
    return 'bg-blue-500 border-blue-500'
  }
  if (index === currentStep.value) {
    return 'bg-blue-500 border-blue-500'
  }
  return 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
}

const getStepValues = (stepId: string) => {
  return stepValues.value[stepId] || {}
}

const handleStepSubmit = (values: any) => {
  const currentStepData = props.steps[currentStep.value]
  stepValues.value[currentStepData.id] = values

  if (currentStep.value < props.steps.length - 1) {
    nextStep()
  } else {
    completeWizard()
  }
}

const handleStepCancel = () => {
  emit('cancel')
}

const nextStep = () => {
  if (currentStep.value < props.steps.length - 1) {
    currentStep.value++
    emit('stepChange', currentStep.value, props.steps[currentStep.value].id)
  }
}

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
    emit('stepChange', currentStep.value, props.steps[currentStep.value].id)
  }
}

const completeWizard = async () => {
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
    emit('draftSave', allValues)
    draftSaved.value = true
    setTimeout(() => {
      draftSaved.value = false
    }, 3000)
  } finally {
    isSavingDraft.value = false
  }
}

const autoSaveDraft = () => {
  if (props.autoSaveDraft && Object.keys(stepValues.value).length > 0) {
    saveDraft()
  }
}

// Lifecycle
onMounted(() => {
  // Initialize with initial values
  if (props.initialValues) {
    stepValues.value = { ...props.initialValues }
  }

  // Set up auto-save timer
  if (props.autoSaveDraft) {
    autoSaveTimer.value = window.setInterval(autoSaveDraft, props.autoSaveInterval)
  }
})

onUnmounted(() => {
  if (autoSaveTimer.value) {
    clearInterval(autoSaveTimer.value)
  }
})
</script>
