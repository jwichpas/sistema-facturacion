<template>
  <div class="space-y-6">
    <!-- Page Header with Search -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Productos</h1>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Gestiona tu catálogo de productos e inventario
        </p>
      </div>

      <div class="flex items-center gap-3">
        <div class="w-full lg:w-96">
          <ProductSearch
            :products="productStore.products"
            :is-searching="productStore.loading"
            @search="handleSearch"
            @product-selected="handleProductSelected"
            @create-product="handleCreateProduct"
            @quick-edit="handleEditProduct"
            @view-stock="handleViewStock"
            @open-scanner="showBarcodeScanner = true"
          />
        </div>
        <BaseButton @click="handleCreateProduct()">
          <Plus class="w-4 h-4 mr-2" />
          Nuevo
        </BaseButton>
      </div>
    </div>

    <!-- Product List -->
    <ProductList
      :products="productStore.filteredProducts"
      :brands="productStore.brands"
      :categories="productStore.categories"
      :filters="productStore.filters"
      :loading="productStore.loading"
      @create="handleCreateProduct"
      @select="handleProductSelected"
      @edit="handleEditProduct"
      @delete="handleDeleteProduct"
      @bulk-delete="handleBulkDelete"
      @bulk-export="handleBulkExport"
      @selection-change="selectedProducts = $event"
      @update:filters="productStore.updateFilters"
    />

    <!-- Product Form Modal -->
    <div v-if="showProductForm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-900 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {{ editingProduct ? 'Editar Producto' : 'Nuevo Producto' }}
            </h2>
            <button
              @click="closeProductForm"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X class="w-6 h-6" />
            </button>
          </div>

          <ProductForm
            :product="editingProduct"
            :brands="productStore.brands"
            :categories="productStore.categories"
            :loading="formLoading"
            @submit="handleProductSubmit"
            @cancel="closeProductForm"
            @scan-barcode="showBarcodeScanner = true"
            @create-brand="showBrandForm = true"
            @create-category="showCategoryForm = true"
            @upload-image="handleImageUpload"
            @delete-image="handleImageDelete"
            @set-primary-image="handleSetPrimaryImage"
            @delete-code="handleDeleteCode"
            @add-code="handleAddCode"
          />
        </div>
      </div>
    </div>

    <!-- Barcode Scanner Modal -->
    <div v-if="showBarcodeScanner" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Escáner de Códigos
            </h2>
            <button
              @click="showBarcodeScanner = false"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X class="w-6 h-6" />
            </button>
          </div>

          <BarcodeScanner
            @code-scanned="handleBarcodeScanned"
            @code-selected="handleBarcodeSelected"
          />
        </div>
      </div>
    </div>

    <!-- Stock Alerts -->
    <div v-if="productStore.hasStockAlerts" class="fixed bottom-4 right-4 z-40">
      <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 shadow-lg max-w-sm">
        <div class="flex items-start">
          <AlertTriangle class="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div class="ml-3">
            <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Alertas de Stock
            </h3>
            <p class="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
              {{ productStore.stockAlerts.length }} productos requieren atención
            </p>
            <div class="mt-2">
              <BaseButton
                size="sm"
                variant="outline"
                @click="showStockAlerts = true"
              >
                Ver Alertas
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stock Alerts Modal -->
    <div v-if="showStockAlerts" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-900 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Alertas de Stock
            </h2>
            <button
              @click="showStockAlerts = false"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X class="w-6 h-6" />
            </button>
          </div>

          <div class="space-y-4">
            <div
              v-for="alert in productStore.stockAlerts"
              :key="`${alert.product_id}-${alert.warehouse_id}`"
              class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div class="flex items-center gap-3">
                <div class="flex-shrink-0">
                  <AlertTriangle
                    :class="[
                      'h-5 w-5',
                      alert.alert_type === 'out_of_stock' ? 'text-red-500' : 'text-yellow-500'
                    ]"
                  />
                </div>
                <div>
                  <p class="font-medium text-gray-900 dark:text-gray-100">
                    {{ alert.product_name }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    SKU: {{ alert.product_sku }} • {{ alert.warehouse_name }}
                  </p>
                  <p class="text-sm">
                    <span :class="alert.alert_type === 'out_of_stock' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'">
                      Stock actual: {{ alert.current_stock }}
                    </span>
                    <span class="text-gray-500 dark:text-gray-400 ml-2">
                      (Mínimo: {{ alert.min_stock }})
                    </span>
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <BaseButton
                  size="sm"
                  variant="outline"
                  @click="handleViewProduct(alert.product_id)"
                >
                  Ver Producto
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Plus, X, AlertTriangle } from 'lucide-vue-next'
import { useProductStore } from '@/stores/product'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/ui/BaseButton.vue'
import ProductList from '@/components/products/ProductList.vue'
import ProductForm from '@/components/products/ProductForm.vue'
import ProductSearch from '@/components/products/ProductSearch.vue'
import BarcodeScanner from '@/components/products/BarcodeScanner.vue'
import type { ProductListItem, ProductWithDetails, ProductInsert, ProductUpdate } from '@/services/product'

// Stores
const productStore = useProductStore()
const authStore = useAuthStore()

// Component state
const showProductForm = ref(false)
const showBarcodeScanner = ref(false)
const showBrandForm = ref(false)
const showCategoryForm = ref(false)
const showStockAlerts = ref(false)
const editingProduct = ref<ProductWithDetails | null>(null)
const selectedProducts = ref<ProductListItem[]>([])
const formLoading = ref(false)
const pendingBarcodeValue = ref('')

// Lifecycle
onMounted(async () => {
  if (authStore.currentCompany?.id) {
    await Promise.all([
      productStore.loadProducts(),
      productStore.loadBrands(),
      productStore.loadCategories(),
      productStore.loadStockAlerts()
    ])
  }
})

// Handlers
const handleSearch = (query: string) => {
  productStore.updateFilters({ search: query })
}

const handleProductSelected = async (product: ProductListItem) => {
  try {
    await productStore.loadProduct(product.id)
    editingProduct.value = productStore.currentProduct
    showProductForm.value = true
  } catch (error) {
    console.error('Error loading product:', error)
    alert('Error al cargar el producto')
  }
}

const handleCreateProduct = (name?: string) => {
  editingProduct.value = null
  showProductForm.value = true

  // If creating from search, pre-fill the name
  if (name) {
    // This would be handled by the form's initial values
  }
}

const handleEditProduct = async (product: ProductListItem) => {
  await handleProductSelected(product)
}

const handleDeleteProduct = async (product: ProductListItem) => {
  if (confirm(`¿Estás seguro de que quieres eliminar el producto "${product.name}"?`)) {
    try {
      await productStore.deleteProduct(product.id)
      alert('Producto eliminado correctamente')
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Error al eliminar el producto')
    }
  }
}

const handleBulkDelete = async (products: ProductListItem[]) => {
  if (confirm(`¿Estás seguro de que quieres eliminar ${products.length} productos?`)) {
    try {
      for (const product of products) {
        await productStore.deleteProduct(product.id)
      }
      alert(`${products.length} productos eliminados correctamente`)
    } catch (error) {
      console.error('Error deleting products:', error)
      alert('Error al eliminar los productos')
    }
  }
}

const handleBulkExport = (products: ProductListItem[]) => {
  // Implement bulk export functionality
  console.log('Exporting products:', products)
  alert('Funcionalidad de exportación en desarrollo')
}

const handleProductSubmit = async (data: ProductInsert | ProductUpdate) => {
  formLoading.value = true

  try {
    if (!authStore.currentCompany?.id) {
      throw new Error('No company selected')
    }

    const productData = {
      ...data,
      company_id: authStore.currentCompany.id
    }

    if (editingProduct.value) {
      await productStore.updateProduct(editingProduct.value.id, productData as ProductUpdate)
      alert('Producto actualizado correctamente')
    } else {
      await productStore.createProduct(productData as ProductInsert)
      alert('Producto creado correctamente')
    }

    closeProductForm()
  } catch (error) {
    console.error('Error saving product:', error)
    alert('Error al guardar el producto')
  } finally {
    formLoading.value = false
  }
}

const closeProductForm = () => {
  showProductForm.value = false
  editingProduct.value = null
  pendingBarcodeValue.value = ''
}

const handleBarcodeScanned = (code: string, format: string) => {
  pendingBarcodeValue.value = code
  showBarcodeScanner.value = false

  // If we're in the product form, set the barcode value
  if (showProductForm.value) {
    // This would be handled by the form component
    alert(`Código escaneado: ${code} (${format})`)
  } else {
    // Search for existing product with this barcode
    handleSearch(code)
  }
}

const handleBarcodeSelected = (code: string) => {
  handleBarcodeScanned(code, 'SELECTED')
}

const handleViewStock = (product: ProductListItem) => {
  // Implement stock view functionality
  console.log('View stock for product:', product)
  alert('Vista de stock en desarrollo')
}

const handleViewProduct = async (productId: string) => {
  try {
    await productStore.loadProduct(productId)
    editingProduct.value = productStore.currentProduct
    showProductForm.value = true
    showStockAlerts.value = false
  } catch (error) {
    console.error('Error loading product:', error)
    alert('Error al cargar el producto')
  }
}

// Image handling
const handleImageUpload = async (files: File[]) => {
  if (!editingProduct.value) return

  try {
    // In a real implementation, you would upload to Supabase Storage
    for (const file of files) {
      const storagePath = `products/${editingProduct.value.id}/${file.name}`
      await productStore.addProductImage(editingProduct.value.id, storagePath, false)
    }

    // Reload product to get updated images
    await productStore.loadProduct(editingProduct.value.id)
    editingProduct.value = productStore.currentProduct
  } catch (error) {
    console.error('Error uploading images:', error)
    alert('Error al subir las imágenes')
  }
}

const handleImageDelete = async (imageId: string) => {
  try {
    await productStore.removeProductImage(imageId)

    // Reload product to get updated images
    if (editingProduct.value) {
      await productStore.loadProduct(editingProduct.value.id)
      editingProduct.value = productStore.currentProduct
    }
  } catch (error) {
    console.error('Error deleting image:', error)
    alert('Error al eliminar la imagen')
  }
}

const handleSetPrimaryImage = async (imageId: string) => {
  try {
    await productStore.setPrimaryImage(imageId)

    // Reload product to get updated images
    if (editingProduct.value) {
      await productStore.loadProduct(editingProduct.value.id)
      editingProduct.value = productStore.currentProduct
    }
  } catch (error) {
    console.error('Error setting primary image:', error)
    alert('Error al establecer imagen principal')
  }
}

// Product code handling
const handleAddCode = async (type: string, value: string) => {
  if (!editingProduct.value) return

  try {
    await productStore.addProductCode(editingProduct.value.id, type, value)

    // Reload product to get updated codes
    await productStore.loadProduct(editingProduct.value.id)
    editingProduct.value = productStore.currentProduct
  } catch (error) {
    console.error('Error adding product code:', error)
    alert('Error al agregar el código')
  }
}

const handleDeleteCode = async (codeId: string) => {
  try {
    await productStore.removeProductCode(codeId)

    // Reload product to get updated codes
    if (editingProduct.value) {
      await productStore.loadProduct(editingProduct.value.id)
      editingProduct.value = productStore.currentProduct
    }
  } catch (error) {
    console.error('Error deleting product code:', error)
    alert('Error al eliminar el código')
  }
}
</script>
