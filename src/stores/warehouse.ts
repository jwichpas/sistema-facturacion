import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import WarehouseService from '@/services/warehouse'
import type {
  WarehouseWithDetails,
  WarehouseZoneWithDetails,
  StockTransferWithDetails,
  VehicleWithDetails,
  DriverWithDetails,
  WarehouseFilters,
  WarehouseZoneFilters,
  StockTransferFilters,
  VehicleFilters,
  DriverFilters,
  StockTransferCreatePayload,
  WarehouseInsert,
  WarehouseUpdate,
  WarehouseZoneInsert,
  WarehouseZoneUpdate,
  VehicleInsert,
  VehicleUpdate,
  DriverInsert,
  DriverUpdate,
} from '@/services/warehouse'
import { useAuthStore } from './auth'

export const useWarehouseStore = defineStore('warehouse', () => {
  // State
  const warehouses = ref<WarehouseWithDetails[]>([])
  const warehouseZones = ref<WarehouseZoneWithDetails[]>([])
  const stockTransfers = ref<StockTransferWithDetails[]>([])
  const vehicles = ref<VehicleWithDetails[]>([])
  const drivers = ref<DriverWithDetails[]>([])

  const currentWarehouse = ref<WarehouseWithDetails | null>(null)
  const currentStockTransfer = ref<StockTransferWithDetails | null>(null)

  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const authStore = useAuthStore()

  const currentCompanyId = computed(() => authStore.currentCompany?.id)

  const activeWarehouses = computed(() =>
    warehouses.value.filter(w => !w.deleted_at)
  )

  const warehouseOptions = computed(() =>
    activeWarehouses.value.map(w => ({
      value: w.id,
      label: `${w.code} - ${w.name}`,
    }))
  )

  const vehicleOptions = computed(() =>
    vehicles.value.map(v => ({
      value: v.id,
      label: `${v.plate} - ${v.brand || ''} ${v.model || ''}`.trim(),
    }))
  )

  const driverOptions = computed(() =>
    drivers.value.map(d => ({
      value: d.id,
      label: `${d.license_number} - ${d.party?.fullname || ''}`,
    }))
  )

  const warehouseZonesByWarehouse = computed(() => {
    const grouped: Record<string, WarehouseZoneWithDetails[]> = {}
    warehouseZones.value.forEach(zone => {
      if (!grouped[zone.warehouse_id]) {
        grouped[zone.warehouse_id] = []
      }
      grouped[zone.warehouse_id].push(zone)
    })
    return grouped
  })

  // Actions
  const setError = (message: string | null) => {
    error.value = message
  }

  const clearError = () => {
    error.value = null
  }

  // Warehouse Management
  const fetchWarehouses = async (filters: WarehouseFilters = {}) => {
    if (!currentCompanyId.value) return

    try {
      loading.value = true
      clearError()
      warehouses.value = await WarehouseService.listWarehouses(currentCompanyId.value, filters)
    } catch (err: any) {
      setError(err.message || 'Error fetching warehouses')
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchWarehouse = async (id: string) => {
    if (!currentCompanyId.value) return null

    try {
      loading.value = true
      clearError()
      const warehouse = await WarehouseService.getWarehouse(currentCompanyId.value, id)
      currentWarehouse.value = warehouse
      return warehouse
    } catch (err: any) {
      setError(err.message || 'Error fetching warehouse')
      throw err
    } finally {
      loading.value = false
    }
  }

  const createWarehouse = async (payload: WarehouseInsert) => {
    if (!currentCompanyId.value) throw new Error('No company selected')

    try {
      loading.value = true
      clearError()
      const warehouse = await WarehouseService.createWarehouse({
        ...payload,
        company_id: currentCompanyId.value,
      })

      // Refresh warehouses list
      await fetchWarehouses()
      return warehouse
    } catch (err: any) {
      setError(err.message || 'Error creating warehouse')
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateWarehouse = async (id: string, payload: WarehouseUpdate) => {
    try {
      loading.value = true
      clearError()
      const warehouse = await WarehouseService.updateWarehouse(id, payload)

      // Update in local state
      const index = warehouses.value.findIndex(w => w.id === id)
      if (index !== -1) {
        warehouses.value[index] = { ...warehouses.value[index], ...warehouse }
      }

      // Update current warehouse if it's the same
      if (currentWarehouse.value?.id === id) {
        currentWarehouse.value = { ...currentWarehouse.value, ...warehouse }
      }

      return warehouse
    } catch (err: any) {
      setError(err.message || 'Error updating warehouse')
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteWarehouse = async (id: string) => {
    try {
      loading.value = true
      clearError()
      await WarehouseService.deleteWarehouse(id)

      // Remove from local state
      warehouses.value = warehouses.value.filter(w => w.id !== id)

      // Clear current warehouse if it's the same
      if (currentWarehouse.value?.id === id) {
        currentWarehouse.value = null
      }
    } catch (err: any) {
      setError(err.message || 'Error deleting warehouse')
      throw err
    } finally {
      loading.value = false
    }
  }

  // Warehouse Zone Management
  const fetchWarehouseZones = async (filters: WarehouseZoneFilters = {}) => {
    if (!currentCompanyId.value) return

    try {
      loading.value = true
      clearError()
      warehouseZones.value = await WarehouseService.listWarehouseZones(currentCompanyId.value, filters)
    } catch (err: any) {
      setError(err.message || 'Error fetching warehouse zones')
      throw err
    } finally {
      loading.value = false
    }
  }

  const createWarehouseZone = async (payload: WarehouseZoneInsert) => {
    if (!currentCompanyId.value) throw new Error('No company selected')

    try {
      loading.value = true
      clearError()
      const zone = await WarehouseService.createWarehouseZone({
        ...payload,
        company_id: currentCompanyId.value,
      })

      // Refresh zones list
      await fetchWarehouseZones({ warehouseId: payload.warehouse_id })
      return zone
    } catch (err: any) {
      setError(err.message || 'Error creating warehouse zone')
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateWarehouseZone = async (id: string, payload: WarehouseZoneUpdate) => {
    try {
      loading.value = true
      clearError()
      const zone = await WarehouseService.updateWarehouseZone(id, payload)

      // Update in local state
      const index = warehouseZones.value.findIndex(z => z.id === id)
      if (index !== -1) {
        warehouseZones.value[index] = { ...warehouseZones.value[index], ...zone }
      }

      return zone
    } catch (err: any) {
      setError(err.message || 'Error updating warehouse zone')
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteWarehouseZone = async (id: string) => {
    try {
      loading.value = true
      clearError()
      await WarehouseService.deleteWarehouseZone(id)

      // Remove from local state
      warehouseZones.value = warehouseZones.value.filter(z => z.id !== id)
    } catch (err: any) {
      setError(err.message || 'Error deleting warehouse zone')
      throw err
    } finally {
      loading.value = false
    }
  }

  // Stock Transfer Management
  const fetchStockTransfers = async (filters: StockTransferFilters = {}) => {
    if (!currentCompanyId.value) return

    try {
      loading.value = true
      clearError()
      stockTransfers.value = await WarehouseService.listStockTransfers(currentCompanyId.value, filters)
    } catch (err: any) {
      setError(err.message || 'Error fetching stock transfers')
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchStockTransfer = async (id: string) => {
    if (!currentCompanyId.value) return null

    try {
      loading.value = true
      clearError()
      const transfer = await WarehouseService.getStockTransfer(currentCompanyId.value, id)
      currentStockTransfer.value = transfer
      return transfer
    } catch (err: any) {
      setError(err.message || 'Error fetching stock transfer')
      throw err
    } finally {
      loading.value = false
    }
  }

  const createStockTransfer = async (payload: StockTransferCreatePayload) => {
    if (!currentCompanyId.value) throw new Error('No company selected')

    try {
      loading.value = true
      clearError()
      const transfer = await WarehouseService.createStockTransfer({
        ...payload,
        company_id: currentCompanyId.value,
      } as any)

      // Refresh transfers list
      await fetchStockTransfers()
      return transfer
    } catch (err: any) {
      setError(err.message || 'Error creating stock transfer')
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteStockTransfer = async (id: string) => {
    try {
      loading.value = true
      clearError()
      await WarehouseService.deleteStockTransfer(id)

      // Remove from local state
      stockTransfers.value = stockTransfers.value.filter(t => t.id !== id)

      // Clear current transfer if it's the same
      if (currentStockTransfer.value?.id === id) {
        currentStockTransfer.value = null
      }
    } catch (err: any) {
      setError(err.message || 'Error deleting stock transfer')
      throw err
    } finally {
      loading.value = false
    }
  }

  // Vehicle Management
  const fetchVehicles = async (filters: VehicleFilters = {}) => {
    if (!currentCompanyId.value) return

    try {
      loading.value = true
      clearError()
      vehicles.value = await WarehouseService.listVehicles(currentCompanyId.value, filters)
    } catch (err: any) {
      setError(err.message || 'Error fetching vehicles')
      throw err
    } finally {
      loading.value = false
    }
  }

  const createVehicle = async (payload: VehicleInsert) => {
    if (!currentCompanyId.value) throw new Error('No company selected')

    try {
      loading.value = true
      clearError()
      const vehicle = await WarehouseService.createVehicle({
        ...payload,
        company_id: currentCompanyId.value,
      })

      // Refresh vehicles list
      await fetchVehicles()
      return vehicle
    } catch (err: any) {
      setError(err.message || 'Error creating vehicle')
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateVehicle = async (id: string, payload: VehicleUpdate) => {
    try {
      loading.value = true
      clearError()
      const vehicle = await WarehouseService.updateVehicle(id, payload)

      // Update in local state
      const index = vehicles.value.findIndex(v => v.id === id)
      if (index !== -1) {
        vehicles.value[index] = { ...vehicles.value[index], ...vehicle }
      }

      return vehicle
    } catch (err: any) {
      setError(err.message || 'Error updating vehicle')
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteVehicle = async (id: string) => {
    try {
      loading.value = true
      clearError()
      await WarehouseService.deleteVehicle(id)

      // Remove from local state
      vehicles.value = vehicles.value.filter(v => v.id !== id)
    } catch (err: any) {
      setError(err.message || 'Error deleting vehicle')
      throw err
    } finally {
      loading.value = false
    }
  }

  // Driver Management
  const fetchDrivers = async (filters: DriverFilters = {}) => {
    if (!currentCompanyId.value) return

    try {
      loading.value = true
      clearError()
      drivers.value = await WarehouseService.listDrivers(currentCompanyId.value, filters)
    } catch (err: any) {
      setError(err.message || 'Error fetching drivers')
      throw err
    } finally {
      loading.value = false
    }
  }

  const createDriver = async (payload: DriverInsert) => {
    if (!currentCompanyId.value) throw new Error('No company selected')

    try {
      loading.value = true
      clearError()
      const driver = await WarehouseService.createDriver({
        ...payload,
        company_id: currentCompanyId.value,
      })

      // Refresh drivers list
      await fetchDrivers()
      return driver
    } catch (err: any) {
      setError(err.message || 'Error creating driver')
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateDriver = async (id: string, payload: DriverUpdate) => {
    try {
      loading.value = true
      clearError()
      const driver = await WarehouseService.updateDriver(id, payload)

      // Update in local state
      const index = drivers.value.findIndex(d => d.id === id)
      if (index !== -1) {
        drivers.value[index] = { ...drivers.value[index], ...driver }
      }

      return driver
    } catch (err: any) {
      setError(err.message || 'Error updating driver')
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteDriver = async (id: string) => {
    try {
      loading.value = true
      clearError()
      await WarehouseService.deleteDriver(id)

      // Remove from local state
      drivers.value = drivers.value.filter(d => d.id !== id)
    } catch (err: unknown) {
      setError(err.message || 'Error deleting driver')
      throw err
    } finally {
      loading.value = false
    }
  }

  // Utility Actions
  const reset = () => {
    warehouses.value = []
    warehouseZones.value = []
    stockTransfers.value = []
    vehicles.value = []
    drivers.value = []
    currentWarehouse.value = null
    currentStockTransfer.value = null
    loading.value = false
    error.value = null
  }

  const initializeWarehouseData = async () => {
    if (!currentCompanyId.value) return

    try {
      await Promise.all([
        fetchWarehouses(),
        fetchVehicles(),
        fetchDrivers(),
      ])
    } catch (err) {
      console.error('Error initializing warehouse data:', err)
    }
  }

  return {
    // State
    warehouses,
    warehouseZones,
    stockTransfers,
    vehicles,
    drivers,
    currentWarehouse,
    currentStockTransfer,
    loading,
    error,

    // Getters
    activeWarehouses,
    warehouseOptions,
    vehicleOptions,
    driverOptions,
    warehouseZonesByWarehouse,

    // Actions
    setError,
    clearError,

    // Warehouse Management
    fetchWarehouses,
    fetchWarehouse,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,

    // Zone Management
    fetchWarehouseZones,
    createWarehouseZone,
    updateWarehouseZone,
    deleteWarehouseZone,

    // Transfer Management
    fetchStockTransfers,
    fetchStockTransfer,
    createStockTransfer,
    deleteStockTransfer,

    // Vehicle Management
    fetchVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,

    // Driver Management
    fetchDrivers,
    createDriver,
    updateDriver,
    deleteDriver,

    // Utility
    reset,
    initializeWarehouseData,
  }
})
