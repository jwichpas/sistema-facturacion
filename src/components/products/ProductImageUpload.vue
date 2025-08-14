<template>
  <div class="space-y-4">
    <!-- Upload Area -->
    <div
      class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
      :class="{ 'border-blue-500 dark:border-blue-400': isDragOver }"
      @drop="handleDrop"
      @dragover.prevent="isDragOver = true"
      @dragleave="isDragOver = false"
      @dragenter.prevent
    >
      <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/*"
        class="hidden"
        @change="handleFileSelect"
      />

      <div class="space-y-2">
        <ImageIcon class="mx-auto h-12 w-12 text-gray-400" />
        <div>
          <button
            type="button"
            class="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            @click="fileInput?.click()"
          >
            Seleccionar imágenes
          </button>
          <span class="text-gray-500 dark:text-gray-400"> o arrastra aquí</span>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          PNG, JPG, GIF hasta 10MB cada una
        </p>
      </div>
    </div>

    <!-- Upload Progress -->
    <div v-if="uploading" class="space-y-2">
      <div class="flex items-center justify-between text-sm">
        <span class="text-gray-600 dark:text-gray-400">Subiendo imágenes...</span>
        <span class="text-gray-600 dark:text-gray-400">{{ uploadProgress }}%</span>
      </div>
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          class="bg-blue-600 h-2 rounded-full transition-all duration-300"
          :style="{ width: `${uploadProgress}%` }"
        ></div>
      </div>
    </div>

    <!-- Image Grid -->
    <div v-if="images.length > 0" class="grid grid-cols-2 gap-4">
      <div
        v-for="image in images"
        :key="image.id"
        class="relative group aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden"
      >
        <!-- Image -->
        <img
          :src="getImageUrl(image.storage_path)"
          :alt="`Imagen del producto`"
          class="w-full h-full object-cover"
          @error="handleImageError"
        />

        <!-- Primary Badge -->
        <div
          v-if="image.is_primary"
          class="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full"
        >
          Principal
        </div>

        <!-- Actions Overlay -->
        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
          <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2">
            <button
              v-if="!image.is_primary"
              @click="$emit('set-primary', image.id)"
              class="p-2 bg-white dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Establecer como principal"
            >
              <Star class="w-4 h-4" />
            </button>

            <button
              @click="previewImage(image)"
              class="p-2 bg-white dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Vista previa"
            >
              <Eye class="w-4 h-4" />
            </button>

            <button
              @click="$emit('delete', image.id)"
              class="p-2 bg-white dark:bg-gray-800 rounded-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Eliminar"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-8">
      <ImageIcon class="mx-auto h-8 w-8 text-gray-400" />
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        No hay imágenes cargadas
      </p>
    </div>

    <!-- Image Preview Modal -->
    <div
      v-if="previewImageData"
      class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      @click="previewImageData = null"
    >
      <div class="relative max-w-4xl max-h-full p-4">
        <img
          :src="getImageUrl(previewImageData.storage_path)"
          :alt="'Vista previa'"
          class="max-w-full max-h-full object-contain rounded-lg"
        />

        <button
          @click="previewImageData = null"
          class="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
        >
          <X class="w-6 h-6" />
        </button>

        <div class="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
          {{ previewImageData.is_primary ? 'Imagen Principal' : 'Imagen Secundaria' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, type PropType } from 'vue'
import { ImageIcon, Star, Eye, Trash2, X } from 'lucide-vue-next'
import type { ProductImage } from '@/services/product'

interface Props {
  productId?: string
  images: ProductImage[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  upload: [file: File]
  delete: [imageId: string]
  'set-primary': [imageId: string]
}>()

const fileInput = ref<HTMLInputElement>()
const isDragOver = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const previewImageData = ref<ProductImage | null>(null)

// File handling
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    handleFiles(Array.from(target.files))
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false

  if (event.dataTransfer?.files) {
    handleFiles(Array.from(event.dataTransfer.files))
  }
}

const handleFiles = (files: File[]) => {
  // Filter only image files
  const imageFiles = files.filter(file => file.type.startsWith('image/'))

  if (imageFiles.length === 0) {
    alert('Por favor selecciona solo archivos de imagen')
    return
  }

  // Check file sizes (10MB limit)
  const oversizedFiles = imageFiles.filter(file => file.size > 10 * 1024 * 1024)
  if (oversizedFiles.length > 0) {
    alert('Algunos archivos son demasiado grandes. El límite es 10MB por imagen.')
    return
  }

  // Emit upload event for each file
  imageFiles.forEach(file => emit('upload', file))
}

// Image URL helper
const getImageUrl = (storagePath: string) => {
  // This would typically use Supabase Storage URL
  // For now, return the path as-is
  return storagePath
}

// Image error handling
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/placeholder-image.png' // Fallback image
}

// Preview functionality
const previewImage = (image: ProductImage) => {
  previewImageData.value = image
}

// Simulate upload progress (in real implementation, this would be handled by the parent component)
const simulateUpload = () => {
  uploading.value = true
  uploadProgress.value = 0

  const interval = setInterval(() => {
    uploadProgress.value += 10
    if (uploadProgress.value >= 100) {
      clearInterval(interval)
      uploading.value = false
      uploadProgress.value = 0
    }
  }, 200)
}
</script>
