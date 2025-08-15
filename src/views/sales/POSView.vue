<template>
  <div class="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
    <!-- POS Header -->
    <div class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button
            @click="$router.push('/sales')"
            class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft class="w-5 h-5" />
          </button>
          <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
            Punto de Venta
          </h1>
        </div>

        <div class="flex items-center gap-3">
          <!-- Current User -->
          <div class="text-sm text-gray-600 dark:text-gray-400">
            {{ authStore.user?.email }}
          </div>

          <!-- Current Company -->
          <div class="text-sm font-medium text-gray-900 dark:text-white">
            {{ authStore.currentCompany?.trade_name || authStore.currentCompany?.legal_name }}
          </div>

          <!-- Clock -->
          <div class="text-sm font-mono text-gray-600 dark:text-gray-400">
            {{ currentTime }}
          </div>
        </div>
      </div>
    </div>

    <!-- Main POS Content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left Panel - Product Selection -->
      <div class="flex-1 flex flex-col bg-white dark:bg-gray-800">
        <!-- Product Search and Categories -->
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex gap-4 mb-4">
            <!-- Search Bar -->
            <div class="flex-1">
              <ProductSearch
                v-model="selectedProduct"
                placeholder="Buscar producto por nombre, SKU o código..."
                @product-selected="addProductToCart"
                class="w-full"
              />
            </div>

            <!-- Barcode Scanner Button -->
            <BaseButton
              @click="showBarcodeScanner = true"
              variant="outline"
              class="flex-shrink-0"
            >
              <QrCode class="w-4 h-4 mr-2" />
              Escanear
            </BaseButton>
          </div>

          <!-- Category Filter -->
          <div class="flex gap-2 overflow-x-auto pb-2">
            <button
              @click="selectedCategoryId = null"
              :class="[
                'px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap',
                selectedCategoryId === null
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              ]"
            >
              Todos
            </button>
            <button
              v-for="category in categories"
              :key="category.id"
              @click="selectedCategoryId = category.id"
              :class="[
                'px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap',
                selectedCategoryId === category.id
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              ]"
            >
              {{ category.name }}
            </button>
          </div>
        </div>

        <!-- Product Grid -->
        <div class="flex-1 overflow-y-auto p-4">
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <ProductCard
              v-for="product in filteredProducts"
              :key="product.id"
              :product="product"
              @click="addProductToCart(product)"
              class="cursor-pointer hover:shadow-lg transition-shadow"
            />
          </div>

          <!-- Empty State -->
          <div v-if="filteredProducts.length === 0" class="text-center py-12">
            <Package class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-500 dark:text-gray-400">
              No se encontraron productos
            </p>
          </div>
        </div>
      </div>

      <!-- Right Panel - Cart and Checkout -->
      <div class="w-96 bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col">
        <!-- Cart Header -->
        <div class="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Carrito
            </h2>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ cartItems.length }} items
              </span>
              <BaseButton
                v-if="cartItems.length > 0"
                @click="clearCart"
                variant="outline"
                size="sm"
              >
                <Trash2 class="w-4 h-4" />
              </BaseButton>
            </div>
          </div>
        </div>

        <!-- Cart Items -->
        <div class="flex-1 overflow-y-auto">
          <div v-if="cartItems.length === 0" class="p-8 text-center">
            <ShoppingCart class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-500 dark:text-gray-400">
              El carrito está vacío
            </p>
            <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Agrega productos para comenzar
            </p>
          </div>

          <div v-else class="p-4 space-y-3">
            <CartItem
              v-for="item in cartItems"
              :key="item.id"
              :item="item"
              @update-quantity="updateCartItemQuantity"
              @remove="removeFromCart"
            />
          </div>
        </div>

        <!-- Cart Summary -->
        <div v-if="cartItems.length > 0" class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
          <!-- Totals -->
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">Subtotal:</span>
              <span class="font-medium">{{ formatCurrency(cartTotals.subtotal) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">IGV (18%):</span>
              <span class="font-medium">{{ formatCurrency(cartTotals.igv_amount) }}</span>
            </div>
            <div class="flex justify-between text-lg font-semibold border-t border-gray-200 dark:border-gray-700 pt-2">
              <span>Total:</span>
              <span>{{ formatCurrency(cartTotals.total) }}</span>
            </div>
          </div>

          <!-- Customer Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cliente
            </label>
            <PartySelector
              v-model="selectedCustomer"
              :filters="{ is_customer: true }"
              placeholder="Seleccionar cliente..."
            />
          </div>

          <!-- Payment Button -->
          <BaseButton
            @click="showPaymentModal = true"
            class="w-full"
            size="lg"
            :disabled="cartItems.length === 0"
          >
            <CreditCard class="w-5 h-5 mr-2" />
            Procesar Pago
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Barcode Scanner Modal -->
    <div
      v-if="showBarcodeScanner"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Escáner de Códigos
            </h3>
            <button
              @click="showBarcodeScanner = false"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X class="w-6 h-6" />
            </button>
          </div>

          <BarcodeScanner
            @code-scanned="handleBarcodeScanned"
            @code-selected="handleBarcodeScanned"
          />
        </div>
      </div>
    </div>

    <!-- Payment Modal -->
    <PaymentModal
      v-if="showPaymentModal"
      :cart-items="cartItems"
      :cart-totals="cartTotals"
      :customer="selectedCustomer"
      @close="showPaymentModal = false"
      @payment-completed="handlePaymentCompleted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProductStore } from '@/stores/product'
import { useSalesStore } from '@/stores/sales'
import type { Product, ProductListItem } from '@/services/product'
import type { Tables } from '@/types/database'

type Party = Tables<'parties'>
import ProductSearch from '@/components/products/ProductSearch.vue'
import ProductCard from '@/components/products/ProductCard.vue'
import BarcodeScanner from '@/components/products/BarcodeScanner.vue'
import PartySelector from '@/components/parties/PartySelector.vue'
import CartItem from '@/components/sales/pos/CartItem.vue'
import PaymentModal from '@/components/sales/pos/PaymentModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import {
  ArrowLeft,
  QrCode,
  Package,
  ShoppingCart,
  Trash2,
  CreditCard,
  X
} from 'lucide-vue-next'

// Stores
const authStore = useAuthStore()
const productStore = useProductStore()
const salesStore = useSalesStore()
const router = useRouter()

// Local state
const selectedProduct = ref<Product | null>(null)
const selectedCategoryId = ref<string | null>(null)
const selectedCustomer = ref<Party | null>(null)
const showBarcodeScanner = ref(false)
const showPaymentModal = ref(false)
const currentTime = ref('')

// Cart state
interface CartItem {
  id: string
  product: ProductListItem
  quantity: number
  unit_price: number
  discount_pct: number
  igv_affectation: string
}

const cartItems = ref<CartItem[]>([])

// Computed
const categories = computed(() => productStore.categories)
const products = computed(() => productStore.products)

const filteredProducts = computed(() => {
  let filtered = products.value

  if (selectedCategoryId.value) {
    filtered = filtered.filter(p => p.category_id === selectedCategoryId.value)
  }

  // Only show active products with stock
  return filtered.filter(p => p.active && (p.total_stock || 0) > 0)
})

const cartTotals = computed(() => {
  return salesStore.calculateDocumentTotals(
    cartItems.value.map(item => salesStore.calculateItemTax({
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_pct: item.discount_pct,
      igv_affectation: item.igv_affectation
    }))
  )
})

// Methods
const addProductToCart = (product: ProductListItem) => {
  const existingItem = cartItems.value.find(item => item.product.id === product.id)

  if (existingItem) {
    existingItem.quantity += 1
  } else {
    cartItems.value.push({
      id: `cart-${Date.now()}-${product.id}`,
      product,
      quantity: 1,
      unit_price: 0, // This should come from price list or be set by user
      discount_pct: 0,
      igv_affectation: '10' // Default to taxable
    })
  }
}

const updateCartItemQuantity = (itemId: string, quantity: number) => {
  const item = cartItems.value.find(i => i.id === itemId)
  if (item) {
    if (quantity <= 0) {
      removeFromCart(itemId)
    } else {
      item.quantity = quantity
    }
  }
}

const removeFromCart = (itemId: string) => {
  const index = cartItems.value.findIndex(i => i.id === itemId)
  if (index !== -1) {
    cartItems.value.splice(index, 1)
  }
}

const clearCart = () => {
  cartItems.value = []
  selectedCustomer.value = null
}

const handleBarcodeScanned = async (code: string) => {
  showBarcodeScanner.value = false

  // Find product by barcode
  const product = await productStore.findProductByCode(code)
  if (product) {
    // Convert to ProductListItem format
    const productListItem: ProductListItem = {
      ...product,
      brand_name: null,
      category_name: null,
      total_stock: 0, // This should be fetched from warehouse_stock
      primary_image: null
    }
    addProductToCart(productListItem)
  } else {
    alert(`No se encontró un producto con el código: ${code}`)
  }
}

const handlePaymentCompleted = (salesDoc: unknown) => {
  // Clear cart and show success message
  clearCart()
  showPaymentModal.value = false

  // Navigate to sales document detail
  router.push(`/sales`)
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN'
  }).format(amount)
}

const updateTime = () => {
  currentTime.value = new Date().toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Lifecycle
onMounted(async () => {
  // Load initial data
  await Promise.all([
    productStore.loadProducts(),
    productStore.loadCategories()
  ])

  // Start clock
  updateTime()
  const timeInterval = setInterval(updateTime, 1000)

  // Cleanup on unmount
  onUnmounted(() => {
    clearInterval(timeInterval)
  })
})
</script>
