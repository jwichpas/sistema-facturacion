<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Clientes y Proveedores
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        Gestiona la información de clientes y proveedores
      </p>
    </div>

    <!-- Main Content -->
    <div v-if="currentView === 'list'">
      <PartyList
        @create="showCreateForm"
        @select="viewParty"
        @edit="editParty"
        @view="viewParty"
        @delete="deleteParty"
      />
    </div>

    <!-- Create/Edit Form -->
    <div v-else-if="currentView === 'form'">
      <div class="mb-6">
        <button
          @click="goBack"
          class="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          <ArrowLeft class="h-4 w-4 mr-1" />
          Volver a la lista
        </button>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">
            {{ selectedParty ? 'Editar' : 'Nuevo' }} {{ getPartyTypeLabel() }}
          </h2>
        </div>

        <div class="p-6">
          <PartyForm
            :party="selectedParty"
            :loading="submitting"
            @submit="handleSubmit"
            @cancel="goBack"
          />
        </div>
      </div>
    </div>

    <!-- Party Details View -->
    <div v-else-if="currentView === 'details'">
      <div class="mb-6">
        <button
          @click="goBack"
          class="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          <ArrowLeft class="h-4 w-4 mr-1" />
          Volver a la lista
        </button>
      </div>

      <div v-if="selectedParty" class="space-y-6">
        <!-- Party Information Card -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex justify-between items-center">
              <h2 class="text-lg font-medium text-gray-900 dark:text-white">
                {{ selectedParty.fullname || 'Sin nombre' }}
              </h2>
              <div class="flex space-x-2">
                <button
                  @click="editParty(selectedParty)"
                  class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <Edit2 class="h-4 w-4 mr-1" />
                  Editar
                </button>
              </div>
            </div>
          </div>

          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Document Information -->
              <div>
                <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Información del Documento
                </h3>
                <dl class="space-y-2">
                  <div>
                    <dt class="text-sm text-gray-500 dark:text-gray-400">Tipo</dt>
                    <dd class="text-sm text-gray-900 dark:text-white">
                      {{ getDocumentTypeDescription(selectedParty.doc_type) }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm text-gray-500 dark:text-gray-400">Número</dt>
                    <dd class="text-sm text-gray-900 dark:text-white">
                      {{ selectedParty.doc_number }}
                    </dd>
                  </div>
                </dl>
              </div>

              <!-- Contact Information -->
              <div>
                <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Información de Contacto
                </h3>
                <dl class="space-y-2">
                  <div v-if="selectedParty.email">
                    <dt class="text-sm text-gray-500 dark:text-gray-400">Email</dt>
                    <dd class="text-sm text-gray-900 dark:text-white">
                      {{ selectedParty.email }}
                    </dd>
                  </div>
                  <div v-if="selectedParty.phone">
                    <dt class="text-sm text-gray-500 dark:text-gray-400">Teléfono</dt>
                    <dd class="text-sm text-gray-900 dark:text-white">
                      {{ selectedParty.phone }}
                    </dd>
                  </div>
                  <div v-if="selectedParty.address">
                    <dt class="text-sm text-gray-500 dark:text-gray-400">Dirección</dt>
                    <dd class="text-sm text-gray-900 dark:text-white">
                      {{ selectedParty.address }}
                    </dd>
                  </div>
                </dl>
              </div>

              <!-- Party Type -->
              <div>
                <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Tipo de Relación
                </h3>
                <div class="flex space-x-2">
                  <span
                    v-if="selectedParty.is_customer"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  >
                    Cliente
                  </span>
                  <span
                    v-if="selectedParty.is_supplier"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    Proveedor
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Contacts Management -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              Contactos
            </h3>
          </div>
          <div class="p-6">
            <ContactManagement :party-id="selectedParty.id" />
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      @click="showDeleteModal = false"
    >
      <div
        class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800"
        @click.stop
      >
        <div class="mt-3 text-center">
          <AlertTriangle class="mx-auto h-12 w-12 text-red-400" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mt-2">
            Eliminar {{ getPartyTypeLabel() }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
            ¿Estás seguro de que deseas eliminar a "{{ partyToDelete?.fullname }}"?
            Esta acción no se puede deshacer.
          </p>

          <div class="flex justify-center space-x-3 mt-6">
            <button
              @click="showDeleteModal = false"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              @click="confirmDelete"
              :disabled="submitting"
              class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {{ submitting ? 'Eliminando...' : 'Eliminar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowLeft, Edit2, AlertTriangle } from 'lucide-vue-next'
import { PartyList, PartyForm, ContactManagement } from '@/components/parties'
import { usePartyStore } from '@/stores/party'
import type { Party } from '@/types'

const partyStore = usePartyStore()

// Local state
const currentView = ref<'list' | 'form' | 'details'>('list')
const selectedParty = ref<Party | null>(null)
const submitting = ref(false)
const showDeleteModal = ref(false)
const partyToDelete = ref<Party | null>(null)

// Computed properties
const documentTypes = computed(() => partyStore.documentTypes)

// Methods
const getDocumentTypeDescription = (code: string): string => {
  const docType = documentTypes.value.find(dt => dt.code === code)
  return docType?.description || code
}

const getPartyTypeLabel = (): string => {
  if (!selectedParty.value && !partyToDelete.value) return 'Registro'

  const party = selectedParty.value || partyToDelete.value
  if (!party) return 'Registro'

  if (party.is_customer && party.is_supplier) return 'Cliente/Proveedor'
  if (party.is_customer) return 'Cliente'
  if (party.is_supplier) return 'Proveedor'
  return 'Registro'
}

const showCreateForm = () => {
  selectedParty.value = null
  currentView.value = 'form'
}

const editParty = (party: Party) => {
  selectedParty.value = party
  currentView.value = 'form'
}

const viewParty = async (party: Party) => {
  // Load full party details with contacts
  await partyStore.loadParty(party.id)
  selectedParty.value = partyStore.currentParty
  currentView.value = 'details'
}

const deleteParty = (party: Party) => {
  partyToDelete.value = party
  showDeleteModal.value = true
}

const goBack = () => {
  selectedParty.value = null
  currentView.value = 'list'
}

const handleSubmit = async (data: any) => {
  submitting.value = true

  try {
    if (selectedParty.value) {
      // Update existing party
      await partyStore.updateParty(selectedParty.value.id, data)
    } else {
      // Create new party
      await partyStore.createParty(data)
    }

    goBack()
  } catch (error) {
    console.error('Error saving party:', error)
    // Handle error (could show toast notification)
  } finally {
    submitting.value = false
  }
}

const confirmDelete = async () => {
  if (!partyToDelete.value) return

  submitting.value = true

  try {
    await partyStore.deleteParty(partyToDelete.value.id)
    showDeleteModal.value = false
    partyToDelete.value = null
  } catch (error) {
    console.error('Error deleting party:', error)
    // Handle error (could show toast notification)
  } finally {
    submitting.value = false
  }
}
</script>
