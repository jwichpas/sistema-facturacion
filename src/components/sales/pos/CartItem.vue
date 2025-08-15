<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
    <div class="flex items-start gap-3">
      <!-- Product Image -->
      <div class="flex-shrink-0">
        <img
          v-if="item.product.primary_image"
          :src="item.product.primary_image"
          :alt="item.product.name"
          class="w-12 h-12 rounded object-cover"
        />
        <div
          v-else
          class="w-12 h-12 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
        >
          <Package class="w-6 h-6 text-gray-400" />
        </div>
      </div>

      <!-- Product Info -->
      <div class="flex-1 min-w-0">
        <h4 class="text-sm font-medium text-gray-900 dark:text-white truncate">
          {{ item.product.name }}
        </h4>
        <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
          SKU: {{ item.product.sku }}
        </p>

        <!-- Price Input -->
        <div class="mt-2">
          <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Precio Unitario
          </label>
          <input
            :value="item.unit_price"
            @input="updatePrice"
            type="number"
            step="0.01"
            min="0"
            class="w-full text-sm rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>

        <!-- Quantity and Controls -->
        <div class="mt-3 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <button
              @click="decreaseQuantity"
              :disabled="item.quantity <= 1"
              class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Minus class="w-4 h-4" />
            </button>

            <input
              :value="item.quantity"
              @input="updateQuantity"
              type="number"
              min="1"
              class="w-16 text-center text-sm rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500"
            />

            <button
              @click="increaseQuantity"
              :disabled="item.quantity >= (item.product.total_stock || 0)"
              class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Plus class="w-4 h-4" />
            </button>
          </div>

          <button
            @click="$emit('remove', item.id)"
            class="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>

        <!-- Discount -->
        <div class="mt-2">
          <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Descuento (%)
          </label>
          <input
            :value="item.discount_pct"
            @input="updateDiscount"
            type="number"
            step="0.1"
            min="0"
            max="100"
            class="w-full text-sm rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500"
            placeholder="0"
          />
        </div>

        <!-- Line Total -->
        <div class="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-600 dark:text-gray-400">
              Subtotal:
            </span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ formatCurrency(lineSubtotal) }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-600 dark:text-gray-400">
              IGV:
            </span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ formatCurrency(lineIgv) }}
            </span>
          </div>
          <div class="flex justify-between items-center font-semibold">
            <span class="text-sm text-gray-900 dark:text-white">
              Total:
            </span>
            <span class="text-sm text-gray-900 dark:text-white">
              {{ formatCurrency(lineTotal) }}
            </span>
          </div>
        </div>

        <!-- Stock Warning -->
        <div v-if="item.quantity > (item.product.total_stock || 0)" class="mt-2">
          <div class="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle class="w-3 h-3" />
            <span>Stock insuficiente ({{ item.product.total_stock || 0 }} disponible)</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Package, Minus, Plus, Trash2, AlertTriangle } from 'lucide-vue-next'

interface CartItem {
  id: string
  product: {
    id: string
    name: string
    sku: string
    total_stock?: number
    primary_image?: string | null
  }
  quantity: number
  unit_price: number
  discount_pct: number
  igv_affectation: string
}

interface Props {
  item: CartItem
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update-quantity': [itemId: string, quantity: number]
  'remove': [itemId: string]
}>()

// Computed
const lineSubtotal = computed(() => {
  return props.item.quantity * props.item.unit_price
})

const lineDiscount = computed(() => {
  return lineSubtotal.value * (props.item.discount_pct / 100)
})

const lineBeforeTax = computed(() => {
  return lineSubtotal.value - lineDiscount.value
})

const lineIgv = computed(() => {
  // Only apply IGV if affectation is '10' (taxable)
  return props.item.igv_affectation === '10' ? lineBeforeTax.value * 0.18 : 0
})

const lineTotal = computed(() => {
  return lineBeforeTax.value + lineIgv.value
})

// Methods
const updateQuantity = (event: Event) => {
  const target = event.target as HTMLInputElement
  const quantity = parseInt(target.value) || 1
  emit('update-quantity', props.item.id, Math.max(1, quantity))
}

const increaseQuantity = () => {
  const maxStock = props.item.product.total_stock || 0
  if (props.item.quantity < maxStock) {
    emit('update-quantity', props.item.id, props.item.quantity + 1)
  }
}

const decreaseQuantity = () => {
  if (props.item.quantity > 1) {
    emit('update-quantity', props.item.id, props.item.quantity - 1)
  }
}

const updatePrice = (event: Event) => {
  const target = event.target as HTMLInputElement
  const price = parseFloat(target.value) || 0
  // Update the item directly since we're not emitting this event
  props.item.unit_price = Math.max(0, price)
}

const updateDiscount = (event: Event) => {
  const target = event.target as HTMLInputElement
  const discount = parseFloat(target.value) || 0
  // Update the item directly since we're not emitting this event
  props.item.discount_pct = Math.max(0, Math.min(100, discount))
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN'
  }).format(amount)
}
</script>
