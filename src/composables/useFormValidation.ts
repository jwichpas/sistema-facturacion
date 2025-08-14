import * as yup from 'yup'

/**
 * Common validation schemas and utilities for forms
 */

// Common field validations
export const validationRules = {
  required: (fieldName: string) => yup.string().required(`${fieldName} es requerido`),

  email: () => yup.string()
    .email('Formato de email inválido')
    .required('El email es requerido'),

  phone: () => yup.string()
    .matches(/^\+?[\d\s-()]+$/, 'Formato de teléfono inválido'),

  ruc: () => yup.string()
    .matches(/^\d{11}$/, 'El RUC debe tener 11 dígitos')
    .required('El RUC es requerido'),

  dni: () => yup.string()
    .matches(/^\d{8}$/, 'El DNI debe tener 8 dígitos')
    .required('El DNI es requerido'),

  password: () => yup.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una mayúscula, una minúscula y un número')
    .required('La contraseña es requerida'),

  confirmPassword: (passwordField: string = 'password') => yup.string()
    .oneOf([yup.ref(passwordField)], 'Las contraseñas no coinciden')
    .required('Confirma tu contraseña'),

  positiveNumber: (fieldName: string) => yup.number()
    .positive(`${fieldName} debe ser un número positivo`)
    .required(`${fieldName} es requerido`),

  currency: (fieldName: string) => yup.number()
    .min(0, `${fieldName} no puede ser negativo`)
    .required(`${fieldName} es requerido`),

  percentage: (fieldName: string) => yup.number()
    .min(0, `${fieldName} no puede ser menor a 0%`)
    .max(100, `${fieldName} no puede ser mayor a 100%`)
    .required(`${fieldName} es requerido`),

  date: (fieldName: string) => yup.date()
    .required(`${fieldName} es requerida`),

  futureDate: (fieldName: string) => yup.date()
    .min(new Date(), `${fieldName} debe ser una fecha futura`)
    .required(`${fieldName} es requerida`),

  pastDate: (fieldName: string) => yup.date()
    .max(new Date(), `${fieldName} debe ser una fecha pasada`)
    .required(`${fieldName} es requerida`),

  minLength: (fieldName: string, min: number) => yup.string()
    .min(min, `${fieldName} debe tener al menos ${min} caracteres`)
    .required(`${fieldName} es requerido`),

  maxLength: (fieldName: string, max: number) => yup.string()
    .max(max, `${fieldName} no puede tener más de ${max} caracteres`),

  alphanumeric: (fieldName: string) => yup.string()
    .matches(/^[a-zA-Z0-9]+$/, `${fieldName} solo puede contener letras y números`)
    .required(`${fieldName} es requerido`),

  sku: () => yup.string()
    .matches(/^[A-Z0-9-_]+$/, 'El SKU solo puede contener letras mayúsculas, números, guiones y guiones bajos')
    .min(3, 'El SKU debe tener al menos 3 caracteres')
    .max(20, 'El SKU no puede tener más de 20 caracteres')
    .required('El SKU es requerido'),

  barcode: () => yup.string()
    .matches(/^\d+$/, 'El código de barras solo puede contener números')
    .min(8, 'El código de barras debe tener al menos 8 dígitos')
    .max(14, 'El código de barras no puede tener más de 14 dígitos'),
}

// Common schemas for ERP entities
export const schemas = {
  // User/Party schemas
  user: yup.object({
    firstName: validationRules.required('Nombre'),
    lastName: validationRules.required('Apellido'),
    email: validationRules.email(),
    phone: validationRules.phone(),
  }),

  customer: yup.object({
    docType: validationRules.required('Tipo de documento'),
    docNumber: yup.string().when('docType', {
      is: 'DNI',
      then: () => validationRules.dni(),
      otherwise: () => validationRules.ruc(),
    }),
    fullname: validationRules.required('Nombre completo'),
    email: validationRules.email().optional(),
    phone: validationRules.phone().optional(),
    address: yup.string().optional(),
  }),

  // Product schemas
  product: yup.object({
    sku: validationRules.sku(),
    name: validationRules.required('Nombre del producto'),
    description: yup.string().optional(),
    barcode: validationRules.barcode().optional(),
    unitCode: validationRules.required('Unidad de medida'),
    categoryId: validationRules.required('Categoría'),
    brandId: yup.string().optional(),
    minStock: validationRules.positiveNumber('Stock mínimo'),
    maxStock: validationRules.positiveNumber('Stock máximo'),
    weight: validationRules.positiveNumber('Peso'),
    width: validationRules.positiveNumber('Ancho'),
    height: validationRules.positiveNumber('Alto'),
    length: validationRules.positiveNumber('Largo'),
  }),

  category: yup.object({
    code: validationRules.alphanumeric('Código'),
    name: validationRules.required('Nombre de la categoría'),
    parentId: yup.string().optional(),
  }),

  brand: yup.object({
    code: validationRules.alphanumeric('Código'),
    name: validationRules.required('Nombre de la marca'),
  }),

  // Warehouse schemas
  warehouse: yup.object({
    code: validationRules.alphanumeric('Código'),
    name: validationRules.required('Nombre del almacén'),
    width: validationRules.positiveNumber('Ancho'),
    height: validationRules.positiveNumber('Alto'),
    length: validationRules.positiveNumber('Largo'),
    branchId: yup.string().optional(),
  }),

  // Sales document schemas
  salesDoc: yup.object({
    customerId: validationRules.required('Cliente'),
    docType: validationRules.required('Tipo de documento'),
    series: validationRules.required('Serie'),
    issueDate: validationRules.date('Fecha de emisión'),
    currencyCode: validationRules.required('Moneda'),
    exchangeRate: yup.number().when('currencyCode', {
      is: (val: string) => val !== 'PEN',
      then: () => validationRules.positiveNumber('Tipo de cambio'),
      otherwise: () => yup.number().optional(),
    }),
  }),

  // Company schemas
  company: yup.object({
    ruc: validationRules.ruc(),
    legalName: validationRules.required('Razón social'),
    tradeName: yup.string().optional(),
    email: validationRules.email().optional(),
    phone: validationRules.phone().optional(),
    address: yup.string().optional(),
    currencyCode: validationRules.required('Moneda'),
    valuationMethod: validationRules.required('Método de valuación'),
  }),
}

// Utility functions
export const useFormValidation = () => {
  /**
   * Validates a single field value against a schema
   */
  const validateField = async (schema: yup.AnySchema, value: any): Promise<string | null> => {
    try {
      await schema.validate(value)
      return null
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        return error.message
      }
      return 'Error de validación'
    }
  }

  /**
   * Validates an entire object against a schema
   */
  const validateObject = async (schema: yup.ObjectSchema<any>, values: any): Promise<Record<string, string> | null> => {
    try {
      await schema.validate(values, { abortEarly: false })
      return null
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const errors: Record<string, string> = {}
        error.inner.forEach((err) => {
          if (err.path) {
            errors[err.path] = err.message
          }
        })
        return errors
      }
      return { general: 'Error de validación' }
    }
  }

  /**
   * Creates a conditional validation based on another field
   */
  const createConditionalValidation = (
    condition: (values: any) => boolean,
    trueSchema: yup.AnySchema,
    falseSchema?: yup.AnySchema
  ) => {
    return yup.mixed().when('$values', {
      is: condition,
      then: () => trueSchema,
      otherwise: () => falseSchema || yup.mixed().optional(),
    })
  }

  /**
   * Creates a custom validation function
   */
  const createCustomValidation = (
    message: string,
    validator: (value: any) => boolean
  ) => {
    return yup.mixed().test('custom', message, validator)
  }

  return {
    validationRules,
    schemas,
    validateField,
    validateObject,
    createConditionalValidation,
    createCustomValidation,
  }
}
