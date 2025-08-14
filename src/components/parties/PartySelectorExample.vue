<template>
  <div class="max-w-4xl mx-auto p-6 space-y-8">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
        Ejemplos de Selector de Contactos
      </h2>

      <!-- Customer Selector -->
      <div class="space-y-4 mb-8">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
          Selector de Clientes
        </h3>
        <div class="max-w-md">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Seleccionar Cliente
          </label>
          <PartySelector
            v-model="selectedCustomer"
            party-type="customer"
            placeholder="Buscar cliente..."
            :show-transaction-summary="true"
            @select="handleCustomerSelect"
            @create="handleCustomerCreate"
          />
        </div>
        <div v-if="selectedCustomer" class="text-sm text-gray-600 dark:text-gray-400">
          Cliente seleccionado: {{ selectedCustomer.fullname }}
        </div>
      </div>

      <!-- Supplier Selector -->
      <div class="space-y-4 mb-8">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
          Selector de Proveedores
        </h3>
        <div class="max-w-md">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Seleccionar Proveedor
          </label>
          <PartySelector
            v-model="selectedSupplier"
            party-type="supplier"
            placeholder="Buscar proveedor..."
            :show-transaction-summary="true"
            @select="handleSupplierSelect"
            @create="handleSupplierCreate"
          />
        </div>
        <div v-if="selectedSupplier" class="text-sm text-gray-600 dark:text-gray-400">
          Proveedor seleccionado: {{ selectedSupplier.fullname }}
        </div>
      </div>

      <!-- General Party Selector -->
      <div class="space-y-4 mb-8">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
          Selector General (Clientes y Proveedores)
        </h3>
        <div class="max-w-md">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Seleccionar Contacto
          </label>
          <PartySelector
            v-model="selectedParty"
            party-type="both"
            placeholder="Buscar cliente o proveedor..."
            :show-transaction-summary="false"
            @select="handlePartySelect"
            @create="handlePartyCreate"
          />
        </div>
        <div v-if="selectedParty" class="text-sm text-gray-600 dark:text-gray-400">
          Contacto seleccionado: {{ selectedParty.fullname }}
          <span v-if="selectedParty.is_customer" class="ml-2 text-green-600">(Cliente)</span>
          <span v-if="selectedParty.is_supplier" class="ml-2 text-blue-600">(Proveedor)</span>
        </div>
      </div>

      <!-- Form Example -->
      <div class="space-y-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
          Ejemplo en Formulario
        </h3>
        <form @submit.prevent="handleFormSubmit" class="space-y-4 max-w-md">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cliente *
            </label>
            <PartySelector
              v-model="formData.customer"
              party-type="customer"
              placeholder="Seleccionar cliente..."
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              v-model="formData.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descripción del documento..."
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Monto
            </label>
            <input
              v-model="formData.amount"
              type="number"
              step="0.01"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
          </div>

          <button
            type="submit"
            :disabled="!formData.customer"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Crear Documento
          </button>
        </form>
      </div>

      <!-- Events Log -->
      <div class="space-y-4 mt-8">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
          Log de Eventos
        </h3>
        <div class="bg-gray-50 dark:bg-gray-700 rounded-md p-4 max-h-40 overflow-y-auto">
          <div v-if="eventLog.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
            No hay eventos registrados
          </div>
          <div
            v-for="(event, index) in eventLog"
            :key="index"
            class="text-sm text-gray-700 dark:text-gray-300 mb-1"
          >
            <span class="text-gray-500 dark:text-gray-400">{{ event.timestamp }}</span>
            - {{ event.message }}
          </div>
        </div>
        <button
          @click="clearEventLog"
          class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Limpiar log
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PartySelector from './PartySelector.vue'
import type { Party } from '@/types'

// Selected parties
const selectedCustomer = ref<Party | null>(null)
const selectedSupplier = ref<Party | null>(null)
const selectedParty = ref<Party | null>(null)

// Form data
const formData = ref({
  customer: null as Party | null,
  description: '',
  amount: 0
})

// Event log
const eventLog = ref<Array<{ timestamp: string; message: string }>>([])

// Methods
const addToEventLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString()
  eventLog.value.unshift({ timestamp, message })

  // Keep only last 20 events
  if (eventLog.value.length > 20) {
    eventLog.value = eventLog.value.slice(0, 20)
  }
}

const clearEventLog = () => {
  eventLog.value = []
}

// Event handlers
const handleCustomerSelect = (customer: Party) => {
  addToEventLog(`Cliente seleccionado: ${customer.fullname}`)
}

const handleCustomerCreate = (customer: Party) => {
  addToEventLog(`Nuevo cliente creado: ${customer.fullname}`)
}

const handleSupplierSelect = (supplier: Party) => {
  addToEventLog(`Proveedor seleccionado: ${supplier.fullname}`)
}

const handleSupplierCreate = (supplier: Party) => {
  addToEventLog(`Nuevo proveedor creado: ${supplier.fullname}`)
}

const handlePartySelect = (party: Party) => {
  const type = party.is_customer && party.is_supplier
    ? 'cliente/proveedor'
    : party.is_customer
      ? 'cliente'
      : 'proveedor'
  addToEventLog(`Contacto seleccionado: ${party.fullname} (${type})`)
}

const handlePartyCreate = (party: Party) => {
  const type = party.is_customer && party.is_supplier
    ? 'cliente/proveedor'
    : party.is_customer
      ? 'cliente'
      : 'proveedor'
  addToEventLog(`Nuevo contacto creado: ${party.fullname} (${type})`)
}

const handleFormSubmit = () => {
  if (!formData.value.customer) {
    addToEventLog('Error: Cliente es requerido')
    return
  }

  addToEventLog(`Formulario enviado - Cliente: ${formData.value.customer.fullname}, Monto: ${formData.value.amount}`)

  // Reset form
  formData.value = {
    customer: null,
    description: '',
    amount: 0
  }
}
</script>
