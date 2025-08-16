<template>
  <div class="relative w-full h-full bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
    <!-- 3D Canvas Container -->
    <div ref="canvasContainer" class="w-full h-full"></div>

    <!-- Loading Overlay -->
    <div
      v-if="loading"
      class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    >
      <div class="text-white text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
        <p>Cargando visualización 3D...</p>
      </div>
    </div>

    <!-- Controls Panel -->
    <div class="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 space-y-3">
      <div>
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
          Controles
        </h4>
        <div class="space-y-2 text-xs text-gray-600 dark:text-gray-400">
          <p>• Click izquierdo + arrastrar: Rotar</p>
          <p>• Rueda del mouse: Zoom</p>
          <p>• Click derecho + arrastrar: Mover</p>
        </div>
      </div>

      <div class="border-t border-gray-200 dark:border-gray-600 pt-3">
        <label class="flex items-center space-x-2">
          <input
            v-model="showStockLevels"
            type="checkbox"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">
            Mostrar niveles de stock
          </span>
        </label>
      </div>

      <div>
        <label class="flex items-center space-x-2">
          <input
            v-model="showZoneLabels"
            type="checkbox"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">
            Mostrar etiquetas de zonas
          </span>
        </label>
      </div>

      <button
        @click="resetCamera"
        class="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Restablecer Vista
      </button>
    </div>

    <!-- Info Panel -->
    <div
      v-if="selectedZone"
      class="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-xs"
    >
      <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
        {{ selectedZone.name || selectedZone.code }}
      </h4>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-500 dark:text-gray-400">Código:</span>
          <span class="text-gray-900 dark:text-white">{{ selectedZone.code }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500 dark:text-gray-400">Dimensiones:</span>
          <span class="text-gray-900 dark:text-white">
            {{ selectedZone.width }}×{{ selectedZone.height }}×{{ selectedZone.length }}m
          </span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500 dark:text-gray-400">Volumen:</span>
          <span class="text-gray-900 dark:text-white">
            {{ (selectedZone.width * selectedZone.height * selectedZone.length).toFixed(2) }} m³
          </span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500 dark:text-gray-400">Capacidad:</span>
          <span class="text-gray-900 dark:text-white">
            {{ selectedZone.capacity_kg?.toFixed(0) || 0 }} kg
          </span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500 dark:text-gray-400">Utilización:</span>
          <span class="text-gray-900 dark:text-white">
            {{ selectedZone.utilization_percentage?.toFixed(0) || 0 }}%
          </span>
        </div>
      </div>
      <button
        @click="selectedZone = null"
        class="mt-3 w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
      >
        Cerrar
      </button>
    </div>

    <!-- Legend -->
    <div class="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
      <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
        Leyenda
      </h4>
      <div class="space-y-2">
        <div class="flex items-center space-x-2">
          <div class="w-4 h-4 bg-blue-500 rounded"></div>
          <span class="text-xs text-gray-600 dark:text-gray-400">Zona Normal</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-4 h-4 bg-yellow-500 rounded"></div>
          <span class="text-xs text-gray-600 dark:text-gray-400">Zona con Stock Medio</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-4 h-4 bg-red-500 rounded"></div>
          <span class="text-xs text-gray-600 dark:text-gray-400">Zona con Stock Alto</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-4 h-4 bg-gray-400 rounded"></div>
          <span class="text-xs text-gray-600 dark:text-gray-400">Zona Vacía</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as THREE from 'three'
import type { WarehouseWithDetails, WarehouseZoneWithDetails } from '@/services/warehouse'

interface Props {
  warehouse: WarehouseWithDetails | null
  zones?: WarehouseZoneWithDetails[]
}

const props = defineProps<Props>()

// State
const canvasContainer = ref<HTMLDivElement>()
const loading = ref(true)
const showStockLevels = ref(true)
const showZoneLabels = ref(true)
const selectedZone = ref<WarehouseZoneWithDetails | null>(null)

// Three.js objects
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: any // OrbitControls
let animationId: number
let raycaster: THREE.Raycaster
let mouse: THREE.Vector2

// Zone objects for interaction
const zoneObjects = new Map<THREE.Object3D, WarehouseZoneWithDetails>()

// Methods
const initThreeJS = async () => {
  if (!canvasContainer.value || !props.warehouse) return

  try {
    // Import OrbitControls dynamically
    const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js')

    // Scene setup
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f0f0)

    // Camera setup
    const container = canvasContainer.value
    const width = container.clientWidth
    const height = container.clientHeight

    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.set(
      props.warehouse.width * 1.5,
      props.warehouse.height * 2,
      props.warehouse.length * 1.5
    )

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)

    // Controls setup
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05

    // Raycaster for mouse interaction
    raycaster = new THREE.Raycaster()
    mouse = new THREE.Vector2()

    // Lighting
    setupLighting()

    // Create warehouse structure
    createWarehouseStructure()

    // Create zones
    createZones()

    // Add event listeners
    renderer.domElement.addEventListener('click', onMouseClick)
    window.addEventListener('resize', onWindowResize)

    // Start animation loop
    animate()

    loading.value = false
  } catch (error) {
    console.error('Error initializing 3D viewer:', error)
    loading.value = false
  }
}

const setupLighting = () => {
  // Ambient light
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
  scene.add(ambientLight)

  // Directional light (sun)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(50, 50, 50)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  directionalLight.shadow.camera.near = 0.5
  directionalLight.shadow.camera.far = 500
  scene.add(directionalLight)

  // Point light for better illumination
  const pointLight = new THREE.PointLight(0xffffff, 0.5)
  pointLight.position.set(0, props.warehouse!.height, 0)
  scene.add(pointLight)
}

const createWarehouseStructure = () => {
  if (!props.warehouse) return

  const { width, height, length } = props.warehouse

  // Floor
  const floorGeometry = new THREE.PlaneGeometry(width, length)
  const floorMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc })
  const floor = new THREE.Mesh(floorGeometry, floorMaterial)
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)

  // Walls (wireframe)
  const wallMaterial = new THREE.LineBasicMaterial({ color: 0x666666 })

  // Create wall edges
  const edges = [
    // Bottom edges
    [0, 0, 0, width, 0, 0],
    [width, 0, 0, width, 0, length],
    [width, 0, length, 0, 0, length],
    [0, 0, length, 0, 0, 0],
    // Top edges
    [0, height, 0, width, height, 0],
    [width, height, 0, width, height, length],
    [width, height, length, 0, height, length],
    [0, height, length, 0, height, 0],
    // Vertical edges
    [0, 0, 0, 0, height, 0],
    [width, 0, 0, width, height, 0],
    [width, 0, length, width, height, length],
    [0, 0, length, 0, height, length],
  ]

  edges.forEach(([x1, y1, z1, x2, y2, z2]) => {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x1, y1, z1),
      new THREE.Vector3(x2, y2, z2),
    ])
    const line = new THREE.Line(geometry, wallMaterial)
    scene.add(line)
  })

  // Grid helper on floor
  const gridHelper = new THREE.GridHelper(Math.max(width, length), 10, 0x888888, 0xaaaaaa)
  gridHelper.position.y = 0.01 // Slightly above floor to avoid z-fighting
  scene.add(gridHelper)
}

const createZones = () => {
  if (!props.zones) return

  zoneObjects.clear()

  props.zones.forEach((zone, index) => {
    const zoneGroup = new THREE.Group()

    // Zone box
    const geometry = new THREE.BoxGeometry(zone.width, zone.height, zone.length)

    // Color based on utilization
    let color = 0x3b82f6 // Blue (normal)
    const utilization = zone.utilization_percentage || 0

    if (utilization > 80) {
      color = 0xef4444 // Red (high)
    } else if (utilization > 50) {
      color = 0xf59e0b // Yellow (medium)
    } else if (utilization === 0) {
      color = 0x9ca3af // Gray (empty)
    }

    const material = new THREE.MeshLambertMaterial({
      color,
      transparent: true,
      opacity: 0.7,
    })

    const zoneMesh = new THREE.Mesh(geometry, material)

    // Position zone (simplified positioning - in real implementation, you'd use actual coordinates)
    const cols = Math.ceil(Math.sqrt(props.zones!.length))
    const row = Math.floor(index / cols)
    const col = index % cols

    zoneMesh.position.set(
      (col * zone.width) + (zone.width / 2),
      zone.height / 2,
      (row * zone.length) + (zone.length / 2)
    )

    zoneMesh.castShadow = true
    zoneMesh.receiveShadow = true

    // Zone outline
    const edges = new THREE.EdgesGeometry(geometry)
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 })
    const wireframe = new THREE.LineSegments(edges, edgeMaterial)
    wireframe.position.copy(zoneMesh.position)

    zoneGroup.add(zoneMesh)
    zoneGroup.add(wireframe)

    // Zone label (if enabled)
    if (showZoneLabels.value) {
      createZoneLabel(zone, zoneMesh.position, zoneGroup)
    }

    // Stock level indicator (if enabled and has stock)
    if (showStockLevels.value && utilization > 0) {
      createStockIndicator(zone, zoneMesh.position, zoneGroup)
    }

    scene.add(zoneGroup)
    zoneObjects.set(zoneMesh, zone)
  })
}

const createZoneLabel = (zone: WarehouseZoneWithDetails, position: THREE.Vector3, group: THREE.Group) => {
  // Create a simple text sprite (in a real implementation, you might use a more sophisticated text rendering)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')!
  canvas.width = 256
  canvas.height = 64

  context.fillStyle = 'rgba(255, 255, 255, 0.9)'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = 'black'
  context.font = '20px Arial'
  context.textAlign = 'center'
  context.fillText(zone.name || zone.code, canvas.width / 2, 40)

  const texture = new THREE.CanvasTexture(canvas)
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture })
  const sprite = new THREE.Sprite(spriteMaterial)

  sprite.position.set(position.x, position.y + zone.height / 2 + 1, position.z)
  sprite.scale.set(2, 0.5, 1)

  group.add(sprite)
}

const createStockIndicator = (zone: WarehouseZoneWithDetails, position: THREE.Vector3, group: THREE.Group) => {
  const utilization = (zone.utilization_percentage || 0) / 100
  const indicatorHeight = zone.height * utilization

  const geometry = new THREE.BoxGeometry(0.2, indicatorHeight, 0.2)
  const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 })
  const indicator = new THREE.Mesh(geometry, material)

  indicator.position.set(
    position.x + zone.width / 2 + 0.5,
    indicatorHeight / 2,
    position.z
  )

  group.add(indicator)
}

const onMouseClick = (event: MouseEvent) => {
  if (!canvasContainer.value) return

  const rect = canvasContainer.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(Array.from(zoneObjects.keys()))

  if (intersects.length > 0) {
    const clickedObject = intersects[0].object
    const zone = zoneObjects.get(clickedObject)
    if (zone) {
      selectedZone.value = zone
    }
  } else {
    selectedZone.value = null
  }
}

const onWindowResize = () => {
  if (!canvasContainer.value) return

  const width = canvasContainer.value.clientWidth
  const height = canvasContainer.value.clientHeight

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

const animate = () => {
  animationId = requestAnimationFrame(animate)

  if (controls) {
    controls.update()
  }

  renderer.render(scene, camera)
}

const resetCamera = () => {
  if (!props.warehouse) return

  camera.position.set(
    props.warehouse.width * 1.5,
    props.warehouse.height * 2,
    props.warehouse.length * 1.5
  )

  if (controls) {
    controls.target.set(
      props.warehouse.width / 2,
      0,
      props.warehouse.length / 2
    )
    controls.update()
  }
}

const cleanup = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }

  if (renderer) {
    renderer.domElement.removeEventListener('click', onMouseClick)
    if (canvasContainer.value && renderer.domElement.parentNode === canvasContainer.value) {
      canvasContainer.value.removeChild(renderer.domElement)
    }
    renderer.dispose()
  }

  window.removeEventListener('resize', onWindowResize)

  // Clean up Three.js objects
  if (scene) {
    scene.clear()
  }
}

// Watchers
watch(
  () => [props.warehouse, props.zones],
  () => {
    if (props.warehouse) {
      nextTick(() => {
        cleanup()
        initThreeJS()
      })
    }
  },
  { deep: true }
)

watch(showZoneLabels, () => {
  // Recreate zones to show/hide labels
  if (scene) {
    // Remove existing zone objects
    const objectsToRemove: THREE.Object3D[] = []
    scene.traverse((child) => {
      if (child.type === 'Group' && zoneObjects.has(child.children[0] as THREE.Mesh)) {
        objectsToRemove.push(child)
      }
    })
    objectsToRemove.forEach(obj => scene.remove(obj))

    // Recreate zones
    createZones()
  }
})

watch(showStockLevels, () => {
  // Recreate zones to show/hide stock indicators
  if (scene) {
    // Remove existing zone objects
    const objectsToRemove: THREE.Object3D[] = []
    scene.traverse((child) => {
      if (child.type === 'Group' && zoneObjects.has(child.children[0] as THREE.Mesh)) {
        objectsToRemove.push(child)
      }
    })
    objectsToRemove.forEach(obj => scene.remove(obj))

    // Recreate zones
    createZones()
  }
})

// Lifecycle
onMounted(() => {
  if (props.warehouse) {
    initThreeJS()
  }
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
/* Ensure the container takes full space */
.relative {
  min-height: 400px;
}
</style>
