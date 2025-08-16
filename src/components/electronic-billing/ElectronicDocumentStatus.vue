<template>
  <div class="electronic-document-status">
    <!-- Status Badge -->
    <div class="flex items-center gap-2">
      <div
        :class="[
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          statusClasses[status]
        ]"
      >
        <component
          :is="statusIcon"
          class="w-3 h-3 mr-1"
        />
        {{ statusText }}
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-1">
        <button
          v-if="canRetry"
          @click="$emit('retry')"
          class="p-1 text-gray-400 hover:text-blue-600 transition-colors"
          title="Reintentar envío"
        >
          <RefreshCw class="w-4 h-4" />
        </button>

        <button
          v-if="hasXml"
          @click="$emit('download-xml')"
          class="p-1 text-gray-400 hover:text-green-600 transition-colors"
          title="Descargar XML"
        >
          <Download class="w-4 h-4" />
        </button>

        <button
          v-if="hasCdr"
          @click="$emit('download-cdr')"
          class="p-1 text-gray-400 hover:text-blue-600 transition-colors"
          title="Descargar CDR"
        >
          <FileText class="w-4 h-4" />
        </button>

        <button
          v-if="canCancel"
          @click="$emit('cancel')"
          class="p-1 text-gray-400 hover:text-red-600 transition-colors"
          title="Anular documento"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Error Message -->
    <div
      v-if="errorMessage"
      class="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700"
    >
      <div class="flex items-start gap-2">
        <AlertCircle class="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <p class="font-medium">Error:</p>
          <p>{{ errorMessage }}</p>
        </div>
      </div>
    </div>

    <!-- Observations -->
    <div
      v-if="observations && observations.length > 0"
      class="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700"
    >
      <div class="flex items-start gap-2">
        <AlertTriangle class="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <p class="font-medium">Observaciones:</p>
          <ul class="list-disc list-inside mt-1">
            <li v-for="obs in observations" :key="obs">{{ obs }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Ticket Info -->
    <div
      v-if="ticket"
      class="mt-2 text-xs text-gray-500"
    >
      Ticket SUNAT: {{ ticket }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  CheckCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Download,
  FileText,
  X,
  Loader
} from 'lucide-vue-next'
import type { ElectronicDocumentStatus } from '@/types'

interface Props {
  status: ElectronicDocumentStatus
  errorMessage?: string
  observations?: string[]
  ticket?: string
  hasXml?: boolean
  hasCdr?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  hasXml: false,
  hasCdr: false
})

defineEmits<{
  retry: []
  'download-xml': []
  'download-cdr': []
  cancel: []
}>()

const statusClasses = {
  DRAFT: 'bg-gray-100 text-gray-800',
  GENERATING: 'bg-blue-100 text-blue-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  SUBMITTED: 'bg-indigo-100 text-indigo-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  ERROR: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800'
}

const statusText = computed(() => {
  const texts = {
    DRAFT: 'Borrador',
    GENERATING: 'Generando XML',
    PENDING: 'Pendiente',
    SUBMITTED: 'Enviado',
    ACCEPTED: 'Aceptado',
    REJECTED: 'Rechazado',
    ERROR: 'Error',
    CANCELLED: 'Anulado'
  }
  return texts[props.status] || props.status
})

const statusIcon = computed(() => {
  const icons = {
    DRAFT: Clock,
    GENERATING: Loader,
    PENDING: Clock,
    SUBMITTED: Clock,
    ACCEPTED: CheckCircle,
    REJECTED: XCircle,
    ERROR: AlertCircle,
    CANCELLED: XCircle
  }
  return icons[props.status] || Clock
})

const canRetry = computed(() => {
  return ['ERROR', 'REJECTED'].includes(props.status)
})

const canCancel = computed(() => {
  return props.status === 'ACCEPTED'
})
</script>
</template>
