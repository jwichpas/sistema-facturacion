<template>
  <div class="space-y-4">
    <!-- Scanner Controls -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
        Escáner de Códigos
      </h3>
      <div class="flex items-center gap-2">
        <BaseButton
          v-if="!isScanning"
          @click="startScanning"
          :disabled="!isSupported"
        >
          <Camera class="w-4 h-4 mr-2" />
          Iniciar Escáner
        </BaseButton>
        <BaseButton
          v-else
          variant="outline"
          @click="stopScanning"
        >
          <Square class="w-4 h-4 mr-2" />
          Detener
        </BaseButton>
      </div>
    </div>

    <!-- Support Warning -->
    <div v-if="!isSupported" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
      <div class="flex">
        <AlertTriangle class="h-5 w-5 text-yellow-400 flex-shrink-0" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Escáner no disponible
          </h3>
          <p class="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
            Tu navegador no soporta el acceso a la cámara o estás usando HTTP.
            Para usar el escáner, necesitas HTTPS o un navegador compatible.
          </p>
        </div>
      </div>
    </div>

    <!-- Camera View -->
    <div v-if="isScanning" class="relative">
      <div class="aspect-video bg-black rounded-lg overflow-hidden">
        <video
          ref="videoElement"
          class="w-full h-full object-cover"
          autoplay
          muted
          playsinline
        ></video>

        <!-- Scanning Overlay -->
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="relative">
            <!-- Scanning Frame -->
            <div class="w-64 h-32 border-2 border-white rounded-lg relative">
              <div class="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-red-500"></div>
              <div class="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-red-500"></div>
              <div class="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-red-500"></div>
              <div class="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-red-500"></div>

              <!-- Scanning Line -->
              <div class="absolute inset-x-0 top-1/2 h-0.5 bg-red-500 animate-pulse"></div>
            </div>

            <p class="text-white text-center mt-4 text-sm">
              Coloca el código de barras dentro del marco
            </p>
          </div>
        </div>
      </div>

      <!-- Scanner Status -->
      <div class="mt-4 text-center">
        <div class="flex items-center justify-center gap-2">
          <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span class="text-sm text-gray-600 dark:text-gray-400">
            Escaneando... {{ scanAttempts }} intentos
          </span>
        </div>
      </div>
    </div>

    <!-- Manual Input -->
    <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
        Entrada Manual
      </h4>
      <div class="flex gap-2">
        <FormInput
          name="manual_barcode"
          placeholder="Ingresa el código manualmente"
          v-model="manualCode"
          @keyup.enter="handleManualCode"
        />
        <BaseButton
          @click="handleManualCode"
          :disabled="!manualCode.trim()"
        >
          <Plus class="w-4 h-4 mr-1" />
          Agregar
        </BaseButton>
      </div>
    </div>

    <!-- Recent Scans -->
    <div v-if="recentScans.length > 0" class="space-y-2">
      <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100">
        Códigos Recientes
      </h4>
      <div class="space-y-2">
        <div
          v-for="(scan, index) in recentScans"
          :key="index"
          class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
        >
          <div class="flex items-center gap-3">
            <div class="flex-shrink-0">
              <QrCode class="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p class="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                {{ scan.code }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ scan.format }} • {{ formatTime(scan.timestamp) }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <BaseButton
              size="sm"
              variant="outline"
              @click="$emit('code-selected', scan.code)"
            >
              Usar
            </BaseButton>
            <button
              @click="removeRecentScan(index)"
              class="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Scanner Info -->
    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div class="flex">
        <Info class="h-5 w-5 text-blue-400 flex-shrink-0" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">
            Consejos para escanear
          </h3>
          <ul class="mt-1 text-sm text-blue-700 dark:text-blue-300 list-disc list-inside space-y-1">
            <li>Mantén el código de barras dentro del marco</li>
            <li>Asegúrate de tener buena iluminación</li>
            <li>Mantén la cámara estable</li>
            <li>El código debe estar enfocado y legible</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Camera, Square, QrCode, Plus, X, AlertTriangle, Info } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormInput from '@/components/forms/FormInput.vue'

interface ScanResult {
  code: string
  format: string
  timestamp: Date
}

const emit = defineEmits<{
  'code-scanned': [code: string, format: string]
  'code-selected': [code: string]
}>()

// Scanner state
const isSupported = ref(false)
const isScanning = ref(false)
const videoElement = ref<HTMLVideoElement>()
const stream = ref<MediaStream | null>(null)
const scanAttempts = ref(0)
const manualCode = ref('')
const recentScans = ref<ScanResult[]>([])

// Check if barcode scanning is supported
onMounted(() => {
  checkSupport()
  loadRecentScans()
})

onUnmounted(() => {
  stopScanning()
})

const checkSupport = () => {
  // Check for camera access and modern browser features
  isSupported.value = !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    (window as any).BarcodeDetector
  )

  // Fallback check for older browsers
  if (!isSupported.value && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
    // We can at least access the camera, even if BarcodeDetector is not available
    // In a real implementation, you'd use a library like QuaggaJS or ZXing
    isSupported.value = true
  }
}

const startScanning = async () => {
  try {
    stream.value = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment', // Use back camera if available
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    })

    if (videoElement.value) {
      videoElement.value.srcObject = stream.value
      isScanning.value = true
      scanAttempts.value = 0

      // Start scanning process
      startBarcodeDetection()
    }
  } catch (error) {
    console.error('Error accessing camera:', error)
    alert('No se pudo acceder a la cámara. Verifica los permisos.')
  }
}

const stopScanning = () => {
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop())
    stream.value = null
  }
  isScanning.value = false
  scanAttempts.value = 0
}

const startBarcodeDetection = () => {
  if (!isScanning.value || !videoElement.value) return

  // In a real implementation, you would use:
  // 1. BarcodeDetector API (if available)
  // 2. QuaggaJS library
  // 3. ZXing library
  // 4. Or another barcode scanning library

  // For this demo, we'll simulate scanning
  const scanInterval = setInterval(() => {
    if (!isScanning.value) {
      clearInterval(scanInterval)
      return
    }

    scanAttempts.value++

    // Simulate finding a barcode after some attempts
    if (scanAttempts.value > 10 && Math.random() > 0.7) {
      const mockBarcode = generateMockBarcode()
      handleBarcodeDetected(mockBarcode, 'EAN-13')
      clearInterval(scanInterval)
    }
  }, 500)
}

const generateMockBarcode = () => {
  // Generate a mock EAN-13 barcode for demo purposes
  return '123456789012' + Math.floor(Math.random() * 10)
}

const handleBarcodeDetected = (code: string, format: string) => {
  const scanResult: ScanResult = {
    code,
    format,
    timestamp: new Date()
  }

  // Add to recent scans
  recentScans.value.unshift(scanResult)
  if (recentScans.value.length > 5) {
    recentScans.value = recentScans.value.slice(0, 5)
  }

  // Save to localStorage
  saveRecentScans()

  // Emit the scanned code
  emit('code-scanned', code, format)

  // Stop scanning
  stopScanning()
}

const handleManualCode = () => {
  if (manualCode.value.trim()) {
    handleBarcodeDetected(manualCode.value.trim(), 'MANUAL')
    manualCode.value = ''
  }
}

const removeRecentScan = (index: number) => {
  recentScans.value.splice(index, 1)
  saveRecentScans()
}

const formatTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Persistence
const saveRecentScans = () => {
  try {
    localStorage.setItem('barcode_recent_scans', JSON.stringify(recentScans.value))
  } catch (error) {
    console.error('Error saving recent scans:', error)
  }
}

const loadRecentScans = () => {
  try {
    const saved = localStorage.getItem('barcode_recent_scans')
    if (saved) {
      const parsed = JSON.parse(saved)
      recentScans.value = parsed.map((scan: unknown) => ({
        ...scan,
        timestamp: new Date(scan.timestamp)
      }))
    }
  } catch (error) {
    console.error('Error loading recent scans:', error)
  }
}
</script>
