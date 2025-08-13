import * as yup from 'yup'

// Common validation schemas
export const commonSchemas = {
  email: yup.string().email('validation.email').required('validation.required'),
  password: yup.string().min(6, 'validation.min_length').required('validation.required'),
  required: yup.string().required('validation.required'),
  numeric: yup.number().typeError('validation.numeric').required('validation.required'),
  positiveNumber: yup.number().positive('validation.positive').required('validation.required'),
  ruc: yup
    .string()
    .matches(/^\d{11}$/, 'RUC debe tener 11 dígitos')
    .required('validation.required'),
  dni: yup
    .string()
    .matches(/^\d{8}$/, 'DNI debe tener 8 dígitos')
    .required('validation.required'),
}

// SUNAT document validation
export const sunatDocumentSchema = yup.object({
  doc_type: yup
    .string()
    .oneOf(['1', '6'], 'Tipo de documento inválido')
    .required('validation.required'),
  doc_number: yup
    .string()
    .when('doc_type', {
      is: '1', // DNI
      then: (schema) => schema.matches(/^\d{8}$/, 'DNI debe tener 8 dígitos'),
      otherwise: (schema) => schema.matches(/^\d{11}$/, 'RUC debe tener 11 dígitos'),
    })
    .required('validation.required'),
})

// Product validation schema
export const productSchema = yup.object({
  sku: yup.string().required('validation.required'),
  name: yup.string().required('validation.required'),
  unit_code: yup.string().required('validation.required'),
  min_stock: commonSchemas.positiveNumber,
  max_stock: commonSchemas.positiveNumber,
  weight_kg: commonSchemas.positiveNumber,
  width: commonSchemas.positiveNumber,
  height: commonSchemas.positiveNumber,
  length: commonSchemas.positiveNumber,
})

// Party (Customer/Supplier) validation schema
export const partySchema = yup.object({
  doc_type: yup.string().required('validation.required'),
  doc_number: yup.string().required('validation.required'),
  fullname: yup.string().required('validation.required'),
  email: yup.string().email('validation.email').nullable(),
  phone: yup.string().nullable(),
})

// Sales document validation schema
export const salesDocSchema = yup.object({
  customer_id: yup.string().required('validation.required'),
  doc_type: yup.string().required('validation.required'),
  series: yup.string().required('validation.required'),
  issue_date: yup.date().required('validation.required'),
  currency_code: yup.string().required('validation.required'),
  items: yup
    .array()
    .of(
      yup.object({
        product_id: yup.string().required('validation.required'),
        quantity: commonSchemas.positiveNumber,
        unit_price: commonSchemas.positiveNumber,
      }),
    )
    .min(1, 'Debe tener al menos un item'),
})

// Company validation schema
export const companySchema = yup.object({
  ruc: commonSchemas.ruc,
  legal_name: yup.string().required('validation.required'),
  trade_name: yup.string().nullable(),
  email: yup.string().email('validation.email').nullable(),
  currency_code: yup.string().required('validation.required'),
  valuation_method: yup.string().oneOf(['PROMEDIO_MOVIL', 'FIFO']).required('validation.required'),
})

// Warehouse validation schema
export const warehouseSchema = yup.object({
  code: yup.string().required('validation.required'),
  name: yup.string().required('validation.required'),
  width: commonSchemas.positiveNumber,
  height: commonSchemas.positiveNumber,
  length: commonSchemas.positiveNumber,
})

export default {
  commonSchemas,
  sunatDocumentSchema,
  productSchema,
  partySchema,
  salesDocSchema,
  companySchema,
  warehouseSchema,
}
