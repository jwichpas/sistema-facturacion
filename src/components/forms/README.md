# Componentes de Formularios - Sistema ERP

Este documento describe los componentes de formularios implementados para el Sistema ERP, que cumplen con los requisitos de la **Tarea 6**.

## Componentes Implementados

### 1. BaseForm
Componente base que proporciona la funcionalidad de formulario con validación usando VeeValidate y Yup.

**Características:**
- Integración con VeeValidate para validación
- Soporte para esquemas Yup
- Manejo de estados de envío
- Botones de acción configurables
- Emisión de eventos para submit y cancel

**Uso:**
```vue
<BaseForm
  :schema="validationSchema"
  :initial-values="formData"
  submit-text="Guardar"
  @submit="handleSubmit"
  @cancel="handleCancel"
>
  <template #default="{ errors, values, isSubmitting }">
    <!-- Campos del formulario -->
  </template>
</BaseForm>
```

### 2. FormWizard
Componente para formularios multi-paso con progreso visual y validación por paso.

**Características:**
- Indicador de progreso visual
- Validación por paso
- Guardado automático de borradores
- Navegación entre pasos
- Validación personalizada por paso
- Persistencia de datos entre pasos

**Uso:**
```vue
<FormWizard
  :steps="wizardSteps"
  :initial-values="wizardData"
  submit-text="Completar"
  @submit="handleWizardSubmit"
  @step-change="handleStepChange"
  @draft-save="handleDraftSave"
/>
```

**Configuración de pasos:**
```typescript
const wizardSteps: WizardStep[] = [
  {
    id: 'personal',
    title: 'Información Personal',
    description: 'Datos básicos del usuario',
    component: BaseForm,
    schema: object({
      firstName: string().required('El nombre es requerido'),
      lastName: string().required('El apellido es requerido'),
      email: email().required('El email es requerido')
    })
  }
  // ... más pasos
]
```

### 3. DynamicForm
Componente para generar formularios dinámicamente desde configuración JSON.

**Características:**
- Generación automática de formularios desde JSON
- Mapeo de tipos de campo a componentes
- Validación automática basada en tipo
- Campos condicionales
- Dependencias entre campos
- Validación personalizada

**Uso:**
```vue
<DynamicForm
  :fields="dynamicFields"
  :initial-values="formData"
  submit-text="Guardar"
  @submit="handleSubmit"
/>
```

**Configuración de campos:**
```typescript
const dynamicFields: DynamicField[] = [
  {
    name: 'productName',
    type: 'text',
    label: 'Nombre del Producto',
    placeholder: 'Ingrese el nombre',
    required: true
  },
  {
    name: 'category',
    type: 'select',
    label: 'Categoría',
    options: [
      { value: 'electronics', label: 'Electrónicos' },
      { value: 'clothing', label: 'Ropa' }
    ],
    required: true
  },
  {
    name: 'isDigital',
    type: 'checkbox',
    label: 'Producto Digital'
  },
  {
    name: 'downloadUrl',
    type: 'url',
    label: 'URL de Descarga',
    conditional: {
      field: 'isDigital',
      value: true,
      operator: 'eq',
      fields: [
        {
          name: 'downloadUrl',
          type: 'url',
          label: 'URL de Descarga',
          required: true
        }
      ]
    }
  }
]
```

## Componentes de Campo

### FormInput
Campo de entrada de texto con soporte para diferentes tipos.

**Tipos soportados:**
- text, email, password, number, tel, url, search

### FormSelect
Campo de selección con opciones predefinidas.

### FormTextarea
Campo de texto multilínea.

### FormDatePicker
Selector de fecha con validación.

### FormCheckbox
Campo de casilla de verificación.

## Tipos de Datos

### WizardStep
```typescript
interface WizardStep {
  id: string
  title: string
  description?: string
  component: any
  schema: any
  props?: Record<string, any>
  validation?: (values: any) => boolean | string
}
```

### DynamicField
```typescript
interface DynamicField {
  name: string
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'select' | 'textarea' | 'date' | 'checkbox' | 'file' | 'radio'
  label: string
  description?: string
  placeholder?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  autocomplete?: string
  inputType?: string
  options?: Array<{ value: string | number; label: string }>
  min?: number
  max?: number
  step?: number
  rows?: number
  accept?: string
  multiple?: boolean
  minDate?: Date | string
  maxDate?: Date | string
  format?: string
  validation?: any
  class?: string
  conditional?: {
    field: string
    value: any
    operator?: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in' | 'contains' | 'starts_with' | 'ends_with'
    fields: DynamicField[]
  }
  dependencies?: string[]
}
```

## Características Avanzadas

### Validación Condicional
Los formularios dinámicos soportan validación condicional basada en valores de otros campos:

```typescript
{
  name: 'stock',
  type: 'number',
  label: 'Stock',
  conditional: {
    field: 'isDigital',
    value: false,
    operator: 'eq',
    fields: [
      {
        name: 'stock',
        type: 'number',
        label: 'Stock',
        required: true,
        min: 0
      }
    ]
  }
}
```

### Operadores de Condición
- `eq`: Igual a
- `ne`: No igual a
- `gt`: Mayor que
- `lt`: Menor que
- `gte`: Mayor o igual que
- `lte`: Menor o igual que
- `in`: Contenido en array
- `not_in`: No contenido en array
- `contains`: Contiene texto
- `starts_with`: Comienza con
- `ends_with`: Termina con

### Dependencias
Los campos pueden tener dependencias que determinan su visibilidad:

```typescript
{
  name: 'advancedOptions',
  type: 'textarea',
  label: 'Opciones Avanzadas',
  dependencies: ['category', 'isPremium']
}
```

## Ejemplos de Uso

### Formulario Básico
```vue
<BaseForm :schema="schema" @submit="handleSubmit">
  <template #default="{ errors, values, isSubmitting }">
    <FormInput
      name="firstName"
      label="Nombre"
      placeholder="Ingrese su nombre"
      required
    />
    <FormInput
      name="email"
      type="email"
      label="Email"
      placeholder="correo@ejemplo.com"
      required
    />
  </template>
</BaseForm>
```

### Formulario por Pasos
```vue
<FormWizard
  :steps="[
    {
      id: 'personal',
      title: 'Datos Personales',
      component: BaseForm,
      schema: personalSchema
    },
    {
      id: 'address',
      title: 'Dirección',
      component: BaseForm,
      schema: addressSchema
    }
  ]"
  @submit="handleWizardSubmit"
/>
```

### Formulario Dinámico
```vue
<DynamicForm
  :fields="[
    {
      name: 'name',
      type: 'text',
      label: 'Nombre',
      required: true
    },
    {
      name: 'type',
      type: 'select',
      label: 'Tipo',
      options: [
        { value: 'individual', label: 'Individual' },
        { value: 'company', label: 'Empresa' }
      ]
    }
  ]"
  @submit="handleSubmit"
/>
```

## Integración con el Sistema

Los componentes están diseñados para integrarse perfectamente con:

- **VeeValidate**: Para validación de formularios
- **Yup**: Para esquemas de validación
- **Tailwind CSS**: Para estilos
- **Vue 3 Composition API**: Para reactividad
- **TypeScript**: Para tipado seguro

## Pruebas

Para probar los componentes, visita la ruta `/form-test` en la aplicación, que muestra ejemplos completos de todos los tipos de formularios implementados.

## Requisitos Cumplidos

✅ **6.1 Create reusable form components with VeeValidate**
- BaseForm con integración VeeValidate
- Componentes de campo reutilizables
- Validación en tiempo real con display de errores

✅ **6.2 Implement form wizard component for multi-step forms**
- FormWizard con indicador de progreso
- Navegación entre pasos
- Validación por paso
- Guardado de borradores y persistencia de estado

✅ **6.3 Build dynamic form generator**
- DynamicForm para formularios JSON-driven
- Mapeo de tipos de campo
- Reglas de validación automáticas
- Campos condicionales y dependencias
