<template>
  <div class="container mx-auto px-4 py-6">
    <!-- List View -->
    <SalesDocList
      v-if="currentView === 'list'"
      @create="showCreateForm"
      @view="showDetail"
      @edit="showEditForm"
      @print="handlePrint"
    />

    <!-- Create Form -->
    <SalesDocForm
      v-else-if="currentView === 'create'"
      @success="handleCreateSuccess"
      @cancel="showList"
    />

    <!-- Edit Form -->
    <SalesDocForm
      v-else-if="currentView === 'edit'"
      :sales-doc="selectedSalesDoc"
      @success="handleEditSuccess"
      @cancel="showList"
    />

    <!-- Detail View -->
    <SalesDocDetail
      v-else-if="currentView === 'detail'"
      :sales-doc-id="selectedSalesDocId"
      @edit="showEditForm"
      @print="handlePrint"
    />

    <!-- Back Button (for non-list views) -->
    <div v-if="currentView !== 'list'" class="fixed bottom-6 left-6">
      <button
        @click="showList"
        class="inline-flex items-center px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
      >
        <ArrowLeft class="w-4 h-4 mr-2" />
        Volver
      </button>
    </div>

    <!-- Print Modal -->
    <PrintModal
      v-if="showPrintModal"
      :sales-doc-id="selectedSalesDocId"
      @close="closePrintModal"
    />

    <!-- Success Toast -->
    <div
      v-if="showSuccessToast"
      class="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50"
    >
      <div class="flex items-center">
        <CheckCircle class="w-5 h-5 mr-2" />
        <span>{{ successMessage }}</span>
        <button
          @click="hideSuccessToast"
          class="ml-4 text-green-700 hover:text-green-900"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSalesStore } from '@/stores/sales'
import type { SalesDoc, SalesDocWithDetails } from '@/services/sales'
import SalesDocList from '@/components/sales/SalesDocList.vue'
import SalesDocForm from '@/components/sales/SalesDocForm.vue'
import SalesDocDetail from '@/components/sales/SalesDocDetail.vue'
import PrintModal from '@/components/sales/PrintModal.vue'
import { ArrowLeft, CheckCircle, X } from 'lucide-vue-next'

// Store
const salesStore = useSalesStore()

// Local state
type ViewType = 'list' | 'create' | 'edit' | 'detail'

const currentView = ref<ViewType>('list')
const selectedSalesDocId = ref<string>('')
const selectedSalesDoc = ref<SalesDocWithDetails | null>(null)
const showPrintModal = ref(false)
const showSuccessToast = ref(false)
const successMessage = ref('')

// Methods
const showList = () => {
  currentView.value = 'list'
  selectedSalesDocId.value = ''
  selectedSalesDoc.value = null
}

const showCreateForm = () => {
  currentView.value = 'create'
  selectedSalesDoc.value = null
}

const showEditForm = async (id: string) => {
  selectedSalesDocId.value = id

  // Load the document details for editing
  const doc = await salesStore.loadSalesDoc(id)
  if (doc) {
    selectedSalesDoc.value = doc
    currentView.value = 'edit'
  }
}

const showDetail = (id: string) => {
  selectedSalesDocId.value = id
  currentView.value = 'detail'
}

const handleCreateSuccess = (doc: SalesDoc) => {
  showSuccessMessage(`Documento ${doc.series}-${doc.number.toString().padStart(8, '0')} creado exitosamente`)
  showList()
}

const handleEditSuccess = (doc: SalesDoc) => {
  showSuccessMessage(`Documento ${doc.series}-${doc.number.toString().padStart(8, '0')} actualizado exitosamente`)
  showList()
}

const handlePrint = (id: string) => {
  selectedSalesDocId.value = id
  showPrintModal.value = true
}

const closePrintModal = () => {
  showPrintModal.value = false
  selectedSalesDocId.value = ''
}

const showSuccessMessage = (message: string) => {
  successMessage.value = message
  showSuccessToast.value = true

  // Auto-hide after 5 seconds
  setTimeout(() => {
    hideSuccessToast()
  }, 5000)
}

const hideSuccessToast = () => {
  showSuccessToast.value = false
  successMessage.value = ''
}

// Lifecycle
onMounted(() => {
  // Initialize the sales store if needed
  if (salesStore.isEmpty) {
    salesStore.loadSalesDocs()
  }
})
</script>
