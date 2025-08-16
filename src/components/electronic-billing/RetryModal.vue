<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        @click="$emit('close')"
      ></div>

      <!-- Modal panel -->
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
              <RefreshCw class="h-6 w-6 text-yellow-600" />
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 class="text-lg leading-6 font-medium text-gray-900">
                Reintentar Envío a SUNAT
              </h3>
              <div class="mt-4 space-y-4">
                <p class="text-sm text-gray-500">
                  Configure los parámetros para reintentar el envío del documento electrónico.
                </p>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Número máximo de intentos
                  </label>
                  <select
                    v-model="retryConfig.max_attempts"
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option :value="1">1 intento</option>
                    <option :value="2">2 intentos</option>
                    <option :value="3">3 intentos</option>
                    <option :value="5">5 intentos</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Tiempo de espera entre intentos (segundos)
                  </label>
                  <select
                    v-model="retryConfig.delay_seconds"
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option :value="10">10 segundos</option>
                    <option :value="30">30 segundos</option>
                    <option :value="60">1 minuto</option>
                    <option :value="120">2 minutos</option>
                    <option :value="300">5 minutos</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Multiplicador de tiempo (backoff)
                  </label>
                  <select
                    v-model="retryConfig.backoff_multiplier"
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option :value="1">Sin incremento (1x)</option>
                    <option :value="1.5">Incremento moderado (1.5x)</option>
                    <option :value="2">Incremento doble (2x)</option>
                    <option :value="3">Incremento triple (3x)</option>
                  </select>
                </div>

                <div class="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div class="flex">
                    <Info class="h-5 w-5 text-blue-400 flex-shrink-0" />
                    <div class="ml-3">
                      <h4 class="text-sm font-medium text-blue-800">
                        Información sobre reintentos
                      </h4>
                      <div class="mt-1 text-sm text-blue-700">
                        <p>
                          Con la configuración actual, los intentos se realizarán con los siguientes intervalos:
                        </p>
                        <ul class="list-disc list-inside mt-2 space-y-1">
                          <li v-for="(delay, index) in calculatedDelays" :key="index">
                            Intento {{ index + 2 }}: {{ delay }} segundos
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            @click="handleRetry"
            :disabled="processing"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
          >
            <Loader v-if="processing" class="w-4 h-4 mr-2 animate-spin" />
            <RefreshCw v-else class="w-4 h-4 mr-2" />
            {{ processing ? 'Procesando...' : 'Reintentar' }}
          </button>
          <button
            @click="$emit('close')"
            :disabled="processing"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { RefreshCw, Info, Loader } from 'lucide-vue-next'

interface Props {
  documentId: string
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
  retry: [documentId: string, retryConfig: any]
}>()

const processing = ref(false)

const retryConfig = reactive({
  max_attempts: 3,
  delay_seconds: 30,
  backoff_multiplier: 2
})

const calculatedDelays = computed(() => {
  const delays = []
  for (let i = 1; i < retryConfig.max_attempts; i++) {
    const delay = retryConfig.delay_seconds * Math.pow(retryConfig.backoff_multiplier, i - 1)
    delays.push(delay)
  }
  return delays
})

async function handleRetry() {
  processing.value = true
  try {
    emit('retry', props.documentId, { ...retryConfig })
  } finally {
    processing.value = false
  }
}
</script>

