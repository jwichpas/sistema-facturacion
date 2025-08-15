<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        Contactos
      </h3>
      <button
        @click="showCreateModal = true"
        class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Plus class="h-4 w-4 mr-1" />
        Agregar Contacto
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="contacts.length === 0" class="text-center py-8">
      <Users class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay contactos</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Agrega contactos para esta persona/empresa
      </p>
    </div>

    <!-- Contacts List -->
    <div v-else class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
      <ul class="divide-y divide-gray-200 dark:divide-gray-700">
        <li
          v-for="contact in contacts"
          :key="contact.id"
          class="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <User class="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </div>
              </div>
              <div class="ml-4">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ contact.name || 'Sin nombre' }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <div v-if="contact.email" class="flex items-center">
                    <Mail class="h-3 w-3 mr-1" />
                    {{ contact.email }}
                  </div>
                  <div v-if="contact.phone" class="flex items-center">
                    <Phone class="h-3 w-3 mr-1" />
                    {{ contact.phone }}
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center space-x-2">
              <button
                @click="editContact(contact)"
                class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                title="Editar contacto"
              >
                <Edit2 class="h-4 w-4" />
              </button>
              <button
                @click="deleteContact(contact)"
                class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                title="Eliminar contacto"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>

          <div v-if="contact.notes" class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {{ contact.notes }}
          </div>
        </li>
      </ul>
    </div>

    <!-- Create/Edit Contact Modal -->
    <div
      v-if="showCreateModal || showEditModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      @click="closeModals"
    >
      <div
        class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800"
        @click.stop
      >
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ showEditModal ? 'Editar Contacto' : 'Nuevo Contacto' }}
          </h3>

          <BaseForm
            :schema="contactSchema"
            :initial-values="contactFormValues"
            :loading="submitting"
            @submit="handleContactSubmit"
          >
            <template #default="{ errors }">
              <div class="space-y-4">
                <FormInput
                  name="name"
                  label="Nombre"
                  placeholder="Nombre del contacto"
                />

                <FormInput
                  name="email"
                  label="Email"
                  type="email"
                  placeholder="email@ejemplo.com"
                />

                <FormInput
                  name="phone"
                  label="Teléfono"
                  type="tel"
                  placeholder="Número de teléfono"
                />

                <FormTextarea
                  name="notes"
                  label="Notas"
                  placeholder="Notas adicionales sobre el contacto"
                  :rows="3"
                />
              </div>

              <div class="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  @click="closeModals"
                  class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  :disabled="submitting"
                  class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {{ submitting ? 'Guardando...' : (showEditModal ? 'Actualizar' : 'Crear') }}
                </button>
              </div>
            </template>
          </BaseForm>
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
            Eliminar Contacto
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
            ¿Estás seguro de que deseas eliminar este contacto? Esta acción no se puede deshacer.
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
import { ref, computed, watch } from 'vue'
import * as yup from 'yup'
import {
  Plus,
  Users,
  User,
  Mail,
  Phone,
  Edit2,
  Trash2,
  AlertTriangle
} from 'lucide-vue-next'
import { BaseForm, FormInput, FormTextarea } from '@/components/forms'
import { usePartyStore } from '@/stores/party'
import { useAuthStore } from '@/stores/auth'
import type { PartyContact } from '@/types'

interface Props {
  partyId: string
}

const props = defineProps<Props>()

const partyStore = usePartyStore()

// Local state
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const submitting = ref(false)
const editingContact = ref<PartyContact | null>(null)
const deletingContact = ref<PartyContact | null>(null)

// Computed properties
const loading = computed(() => partyStore.loading)
const contacts = computed(() => partyStore.contacts)

const contactFormValues = computed(() => {
  if (editingContact.value) {
    return {
      name: editingContact.value.name || '',
      email: editingContact.value.email || '',
      phone: editingContact.value.phone || '',
      notes: editingContact.value.notes || ''
    }
  }

  return {
    name: '',
    email: '',
    phone: '',
    notes: ''
  }
})

// Validation schema
const contactSchema = yup.object({
  name: yup.string(),
  email: yup.string().email('Email no válido'),
  phone: yup.string(),
  notes: yup.string()
})

// Methods
const editContact = (contact: PartyContact) => {
  editingContact.value = contact
  showEditModal.value = true
}

const deleteContact = (contact: PartyContact) => {
  deletingContact.value = contact
  showDeleteModal.value = true
}

const closeModals = () => {
  showCreateModal.value = false
  showEditModal.value = false
  editingContact.value = null
}

const handleContactSubmit = async (values: unknown) => {
  submitting.value = true

  try {
    if (showEditModal.value && editingContact.value) {
      // Update existing contact
      await partyStore.updateContact(editingContact.value.id, values as Partial<PartyContact>)
    } else {
      // Create new contact
      // Get auth store to access current company
      const authStore = useAuthStore()

      if (authStore.currentCompany?.id) {
        await partyStore.createContact({
          ...(values as Record<string, any>),
          party_id: props.partyId,
          company_id: authStore.currentCompany.id
        })
      }
    }

    closeModals()
  } catch (error) {
    console.error('Error saving contact:', error)
    // Handle error (could show toast notification)
  } finally {
    submitting.value = false
  }
}

const confirmDelete = async () => {
  if (!deletingContact.value) return

  submitting.value = true

  try {
    await partyStore.deleteContact(deletingContact.value.id)
    showDeleteModal.value = false
    deletingContact.value = null
  } catch (error) {
    console.error('Error deleting contact:', error)
    // Handle error (could show toast notification)
  } finally {
    submitting.value = false
  }
}

// Watch for party changes to load contacts
watch(
  () => props.partyId,
  (newPartyId) => {
    if (newPartyId) {
      partyStore.loadContacts(newPartyId)
    }
  },
  { immediate: true }
)
</script>
