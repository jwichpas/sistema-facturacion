<template>
  <div class="space-y-6">
    <BaseForm
      :schema="productSchema"
      :initial-values="initialValues"
      @submit="handleSubmit"
      @cancel="$emit('cancel')"
    >
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Product Information -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Basic Information -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Información Básica
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                name="name"
                label="Nombre del Producto"
                placeholder="Ingrese el nombre del producto"
                required
              />

              <FormInput
                name="sku"
                label="SKU"
                placeholder="Código único del producto"
                required
              />

              <FormInput
                name="barcode"
                label="Código de Barras"
                placeholder="EAN, UPC, etc."
              >
                <template #suffix>
                  <button
                    type="button"
                    @click="$emit('scan-barcode')"
                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Escanear código"
                  >
                    <QrCode class="h-4 w-4" />
                  </button>
                </template>
              </FormInput>

              <FormSelect
                name="unit_code"
                label="Unidad de Medida"
                :options="unitOptions"
                required
              />
            </div>

            <div class="mt-4">
              <FormTextarea
                name="description"
                label="Descripción"
                placeholder="Descripción detallada del producto"
                :rows="3"
              />
            </div>
          </div>

          <!-- Classification -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Clasificación
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormSelect
                  name="brand_id"
                  label="Marca"
                  placeholder="Seleccionar marca"
                  :options="brandOptions"
                />
                <div class="mt-2">
                  <BaseButton
                    variant="ghost"
                    size="sm"
                    @click="$emit('create-brand')"
                  >
                    <Plus class="w-4 h-4 mr-1" />
                    Nueva Marca
                  </BaseButton>
                </div>
              </div>

              <div>
                <FormSelect
                  name="category_id"
                  label="Categoría"
                  placeholder="Seleccionar categoría"
                  :options="categoryOptions"
                />
                <div class="mt-2">
                  <BaseButton
                    variant="ghost"
                    size="sm"
                    @click="$emit('create-category')"
                  >
                    <Plus class="w-4 h-4 mr-1" />
                    Nueva Categoría
                  </BaseButton>
                </div>
              </div>
            </div>
          </div>

          <!-- Physical Properties -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Propiedades Físicas
            </h3>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormInput
                name="width"
                label="Ancho (cm)"
                type="number"
                placeholder="0"
                min="0"
                step="0.01"
              />

              <FormInput
                name="height"
                label="Alto (cm)"
                type="number"
                placeholder="0"
                min="0"
                step="0.01"
              />

              <FormInput
                name="length"
                label="Largo (cm)"
                type="number"
                placeholder="0"
                min="0"
                step="0.01"
              />

              <FormInput
                name="weight_kg"
                label="Peso (kg)"
                type="number"
                placeholder="0"
                min="0"
                step="0.001"
              />
            </div>
          </div>

          <!-- Stock Configuration -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Configuración de Stock
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                name="min_stock"
                label="Stock Mínimo"
                type="number"
                placeholder="0"
                min="0"
                hint="Cantidad mínima antes de generar alerta"
              />

              <FormInput
                name="max_stock"
                label="Stock Máximo"
                type="number"
                placeholder="0"
                min="0"
                hint="Cantidad máxima recomendada"
              />
            </div>

            <div class="mt-4 space-y-3">
              <label class="flex items-center gap-2">
                <FormCheckbox name="is_serialized" label="Producto serializado" />
                <span class="text-sm text-gray-700 dark:text-gray-300">
                  Producto serializado (requiere número de serie)
                </span>
              </label>

              <label class="flex items-center gap-2">
                <FormCheckbox name="is_batch_controlled" label="Control por lotes" />
                <span class="text-sm text-gray-700 dark:text-gray-300">
                  Control por lotes (requiere número de lote)
                </span>
              </label>

              <label class="flex items-center gap-2">
                <FormCheckbox name="active" label="Producto activo" />
                <span class="text-sm text-gray-700 dark:text-gray-300">
                  Producto activo
                </span>
              </label>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Product Images -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Imágenes
            </h3>

            <ProductImageUpload
              :product-id="product?.id"
              :images="product?.images || []"
              @upload="$emit('upload-image', $event)"
              @delete="$emit('delete-image', $event)"
              @set-primary="$emit('set-primary-image', $event)"
            />
          </div>

          <!-- Product Codes -->
          <div v-if="product?.id" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
                Códigos Alternativos
              </h3>
              <BaseButton
                variant="ghost"
                size="sm"
                @click="showAddCodeModal = true"
              >
                <Plus class="w-4 h-4 mr-1" />
                Agregar
              </BaseButton>
            </div>

            <div class="space-y-2">
              <div
                v-for="code in product.codes"
                :key="code.id"
                class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <div>
                  <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {{ code.code_type }}
                  </span>
                  <p class="font-mono text-sm">{{ code.code_value }}</p>
                </div>
                <button
                  @click="$emit('delete-code', code.id)"
                  class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>

              <p v-if="!product.codes?.length" class="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No hay códigos alternativos
              </p>
            </div>
          </div>

          <!-- Stock Summary -->
          <div v-if="product?.stock_by_warehouse?.length" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Stock por Almacén
            </h3>

            <div class="space-y-2">
              <div
                v-for="stock in product.stock_by_warehouse"
                :key="stock.warehouse_id"
                class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <span class="text-sm text-gray-700 dark:text-gray-300">
                  {{ stock.warehouse_name }}
                </span>
                <span class="font-medium">{{ stock.balance_qty }}</span>
              </div>

              <div class="pt-2 border-t border-gray-200 dark:border-gray-600">
                <div class="flex items-center justify-between font-medium">
                  <span>Total</span>
                  <span>{{ product.total_stock || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <BaseButton variant="outline" @click="$emit('cancel')">
          Cancelar
        </BaseButton>
        <BaseButton type="submit" :loading="loading">
          {{ product ? 'Actualizar' : 'Crear' }} Producto
        </BaseButton>
      </div>
    </BaseForm>

    <!-- Add Code Modal -->
    <div v-if="showAddCodeModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Agregar Código Alternativo
        </h3>

        <div class="space-y-4">
          <FormSelect
            name="code_type"
            label="Tipo de Código"
            v-model="newCode.type"
            :options="codeTypeOptions"
            required
          />

          <FormInput
            name="code_value"
            label="Valor del Código"
            v-model="newCode.value"
            placeholder="Ingrese el código"
            required
          />
        </div>

        <div class="flex items-center justify-end gap-3 mt-6">
          <BaseButton variant="outline" @click="showAddCodeModal = false">
            Cancelar
          </BaseButton>
          <BaseButton @click="addCode">
            Agregar
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, type PropType } from 'vue'
import { object, string, number, boolean } from 'yup'
import { Plus, QrCode, Trash2 } from 'lucide-vue-next'
import BaseForm from '@/components/forms/BaseForm.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormInput from '@/components/forms/FormInput.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import FormTextarea from '@/components/forms/FormTextarea.vue'
import FormCheckbox from '@/components/forms/FormCheckbox.vue'
import ProductImageUpload from './ProductImageUpload.vue'
import type { ProductWithDetails, Brand, Category, ProductInsert, ProductUpdate } from '@/services/product'

interface Props {
  product?: ProductWithDetails | null
  brands: Brand[]
  categories: Category[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  submit: [data: ProductInsert | ProductUpdate]
  cancel: []
  'scan-barcode': []
  'create-brand': []
  'create-category': []
  'upload-image': [file: File]
  'delete-image': [imageId: string]
  'set-primary-image': [imageId: string]
  'delete-code': [codeId: string]
  'add-code': [type: string, value: string]
}>()

// Form validation schema
const productSchema = object({
  name: string().required('El nombre es requerido'),
  sku: string().required('El SKU es requerido'),
  barcode: string().optional(),
  description: string().optional(),
  brand_id: string().optional(),
  category_id: string().optional(),
  unit_code: string().required('La unidad de medida es requerida'),
  width: number().min(0, 'El ancho debe ser mayor o igual a 0').required(),
  height: number().min(0, 'El alto debe ser mayor o igual a 0').required(),
  length: number().min(0, 'El largo debe ser mayor o igual a 0').required(),
  weight_kg: number().min(0, 'El peso debe ser mayor o igual a 0').required(),
  min_stock: number().min(0, 'El stock mínimo debe ser mayor o igual a 0').required(),
  max_stock: number().min(0, 'El stock máximo debe ser mayor o igual a 0').required(),
  is_serialized: boolean().default(false),
  is_batch_controlled: boolean().default(false),
  active: boolean().default(true)
})

// Initial form values
const initialValues = computed(() => {
  if (props.product) {
    return {
      name: props.product.name,
      sku: props.product.sku,
      barcode: props.product.barcode || '',
      description: props.product.description || '',
      brand_id: props.product.brand_id || '',
      category_id: props.product.category_id || '',
      unit_code: props.product.unit_code,
      width: props.product.width,
      height: props.product.height,
      length: props.product.length,
      weight_kg: props.product.weight_kg,
      min_stock: props.product.min_stock,
      max_stock: props.product.max_stock,
      is_serialized: props.product.is_serialized,
      is_batch_controlled: props.product.is_batch_controlled,
      active: props.product.active
    }
  }

  return {
    name: '',
    sku: '',
    barcode: '',
    description: '',
    brand_id: '',
    category_id: '',
    unit_code: 'NIU', // Default unit
    width: 0,
    height: 0,
    length: 0,
    weight_kg: 0,
    min_stock: 0,
    max_stock: 0,
    is_serialized: false,
    is_batch_controlled: false,
    active: true
  }
})

// Select options
const brandOptions = computed(() => [
  { value: '', label: 'Sin marca' },
  ...props.brands.map(brand => ({
    value: brand.id,
    label: brand.name
  }))
])

const categoryOptions = computed(() => [
  { value: '', label: 'Sin categoría' },
  ...props.categories.map(category => ({
    value: category.id,
    label: category.name
  }))
])

const unitOptions = [
  { value: 'NIU', label: 'Unidad' },
  { value: 'KGM', label: 'Kilogramo' },
  { value: 'GRM', label: 'Gramo' },
  { value: 'LTR', label: 'Litro' },
  { value: 'MLT', label: 'Mililitro' },
  { value: 'MTR', label: 'Metro' },
  { value: 'CMT', label: 'Centímetro' },
  { value: 'MTK', label: 'Metro cuadrado' },
  { value: 'MTQ', label: 'Metro cúbico' },
  { value: 'CJA', label: 'Caja' },
  { value: 'PQT', label: 'Paquete' },
  { value: 'DOC', label: 'Docena' },
  { value: 'CEN', label: 'Ciento' },
  { value: 'MLL', label: 'Millar' }
]

const codeTypeOptions = [
  { value: 'EAN', label: 'EAN' },
  { value: 'UPC', label: 'UPC' },
  { value: 'SKU', label: 'SKU Alternativo' },
  { value: 'INTERNAL', label: 'Código Interno' },
  { value: 'SUPPLIER', label: 'Código Proveedor' }
]

// Add code modal
const showAddCodeModal = ref(false)
const newCode = ref({
  type: '',
  value: ''
})

const addCode = () => {
  if (newCode.value.type && newCode.value.value) {
    emit('add-code', newCode.value.type, newCode.value.value)
    newCode.value = { type: '', value: '' }
    showAddCodeModal.value = false
  }
}

// Form submission
const handleSubmit = (data: unknown) => {
  // Calculate volume
  const volume_m3 = (data.width * data.height * data.length) / 1000000 // Convert cm³ to m³

  const formData = {
    ...data,
    volume_m3,
    // Remove empty strings for optional fields
    barcode: data.barcode || null,
    description: data.description || null,
    brand_id: data.brand_id || null,
    category_id: data.category_id || null
  }

  emit('submit', formData)
}
</script>
