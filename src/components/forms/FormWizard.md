# FormWizard Component

A comprehensive multi-step form component for Vue 3 with TypeScript support, built for the ERP system.

## Features

- **Multi-step Navigation**: Step-by-step form progression with visual progress indicators
- **Form Validation**: Integration with VeeValidate and Yup for robust validation
- **Draft Saving**: Automatic and manual draft saving with localStorage persistence
- **Progress Tracking**: Visual progress bar and step completion indicators
- **Responsive Design**: Mobile-friendly layout with touch support
- **Accessibility**: Full keyboard navigation and screen reader support
- **Custom Validation**: Support for custom step validation logic
- **Optional Steps**: Steps can be marked as optional or skippable
- **State Management**: Comprehensive state management with exposed methods
- **Debug Mode**: Development-friendly debug information

## Basic Usage

```vue
<template>
  <FormWizard
    :steps="wizardSteps"
    :initial-values="initialData"
    submit-text="Create Product"
    @submit="handleSubmit"
    @step-change="handleStepChange"
  />
</template>

<script setup lang="ts">
import { FormWizard, type WizardStep } from '@/components/forms'
import * as yup from 'yup'

const wizardSteps: WizardStep[] = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Enter basic details',
    component: BasicInfoForm,
    schema: yup.object({
      name: yup.string().required('Name is required'),
      email: yup.string().email().required('Email is required')
    })
  },
  {
    id: 'preferences',
    title: 'Preferences',
    description: 'Set your preferences',
    component: PreferencesForm,
    schema: yup.object({
      theme: yup.string().required()
    }),
    optional: true
  }
]

const handleSubmit = (values: any) => {
  console.log('Form submitted:', values)
}

const handleStepChange = (stepIndex: number, stepId: string, direction: 'next' | 'previous') => {
  console.log(`Moved to step ${stepIndex} (${stepId}) going ${direction}`)
}
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `steps` | `WizardStep[]` | **Required** | Array of wizard steps configuration |
| `initialValues` | `Record<string, any>` | `{}` | Initial form values |
| `submitText` | `string` | `'Completar'` | Text for the final submit button |
| `showSaveDraft` | `boolean` | `true` | Show save draft button |
| `autoSaveDraft` | `boolean` | `true` | Enable automatic draft saving |
| `autoSaveInterval` | `number` | `30000` | Auto-save interval in milliseconds |
| `persistKey` | `string` | `undefined` | Key for localStorage persistence |
| `showDebugInfo` | `boolean` | `false` | Show debug information (dev mode only) |
| `validateOnStepChange` | `boolean` | `true` | Validate step before allowing navigation |

## WizardStep Interface

```typescript
interface WizardStep {
  id: string                                    // Unique step identifier
  title: string                                 // Step title
  description?: string                          // Optional step description
  component: any                                // Vue component for step content
  schema: ObjectSchema<any>                     // Yup validation schema
  props?: Record<string, any>                   // Props to pass to component
  validation?: (values: any) => boolean | string | string[]  // Custom validation
  canSkip?: boolean                             // Allow skipping this step
  optional?: boolean                            // Mark step as optional
}
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `submit` | `values: Record<string, any>` | Emitted when wizard is completed |
| `stepChange` | `stepIndex: number, stepId: string, direction: 'next' \| 'previous'` | Emitted when step changes |
| `draftSave` | `values: Record<string, any>` | Emitted when draft is saved |
| `draftLoad` | `values: Record<string, any>` | Emitted when draft is loaded |
| `cancel` | - | Emitted when wizard is cancelled |
| `stepValidation` | `stepIndex: number, isValid: boolean, errors: string[]` | Emitted on step validation |

## Exposed Methods

The component exposes several methods that can be called from parent components:

```typescript
// Navigation
nextStep(): void
previousStep(): void
goToStep(stepIndex: number): void

// Data management
saveDraft(): Promise<void>
loadDraft(): void
clearDraft(): void

// Validation
validateCurrentStep(): Promise<boolean>

// Data access
getCurrentStepValues(): any
getAllValues(): Record<string, any>

// State
currentStep: ComputedRef<number>
isValid: ComputedRef<boolean>
```

## Step Component Requirements

Step components should follow this pattern:

```vue
<template>
  <div class="space-y-4">
    <FormInput
      name="name"
      label="Name"
      required
    />
    <FormInput
      name="email"
      label="Email"
      type="email"
      required
    />
  </div>
</template>

<script setup lang="ts">
// Step components receive these props automatically:
interface StepProps {
  values: any        // Current step values
  errors: any        // Validation errors
  meta: any          // Form meta information
}

// Step components should emit this event when values change:
const emit = defineEmits<{
  'update:values': [values: any]
}>()
</script>
```

## Advanced Features

### Custom Validation

```typescript
const stepWithCustomValidation: WizardStep = {
  id: 'custom-validation',
  title: 'Custom Validation',
  component: MyComponent,
  schema: yup.object({}),
  validation: (values) => {
    if (values.password !== values.confirmPassword) {
      return 'Passwords do not match'
    }
    if (values.age < 18) {
      return ['Must be 18 or older', 'Parental consent required']
    }
    return true
  }
}
```

### Draft Persistence

```vue
<FormWizard
  :steps="steps"
  persist-key="user-registration"
  :auto-save-draft="true"
  :auto-save-interval="10000"
  @draft-save="handleDraftSave"
  @draft-load="handleDraftLoad"
/>
```

### Conditional Steps

```typescript
const conditionalStep: WizardStep = {
  id: 'optional-info',
  title: 'Additional Information',
  component: OptionalInfoForm,
  schema: yup.object({}),
  optional: true,
  canSkip: true
}
```

## Styling

The component uses Tailwind CSS classes and supports dark mode. Key CSS classes:

- `.step-enter-active`, `.step-leave-active` - Step transition animations
- `.fade-enter-active`, `.fade-leave-active` - Notification fade animations
- `.progress-bar` - Progress bar animation
- `.step-circle:hover` - Step circle hover effects

## Accessibility

The component includes comprehensive accessibility features:

- **Keyboard Navigation**: Full keyboard support with Tab, Enter, and arrow keys
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Focus Management**: Automatic focus management between steps
- **High Contrast**: Support for high contrast mode
- **Reduced Motion**: Respects user's motion preferences

## Best Practices

1. **Keep Steps Focused**: Each step should have a single, clear purpose
2. **Validate Early**: Use real-time validation to catch errors early
3. **Provide Clear Labels**: Use descriptive titles and descriptions
4. **Handle Errors Gracefully**: Show clear, actionable error messages
5. **Save Progress**: Enable draft saving for long forms
6. **Test Accessibility**: Ensure keyboard navigation and screen reader support
7. **Mobile First**: Design for mobile devices first
8. **Performance**: Use lazy loading for heavy step components

## Examples

See `FormWizardExample.vue` for a comprehensive example demonstrating all features including:

- Multi-step product creation form
- Custom validation logic
- Draft saving and loading
- Event handling
- Debug information
- Responsive design

## Testing

The component includes comprehensive tests covering:

- Step navigation
- Form validation
- Draft saving/loading
- Event emission
- Custom validation
- Accessibility features
- Error handling

Run tests with:
```bash
npm run test:unit -- src/components/forms/__tests__/FormWizard.test.ts
```