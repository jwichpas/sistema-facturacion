import { supabase } from '@/services/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database'

export type Warehouse = Tables<'warehouses'>
export type WarehouseInsert = TablesInsert<'warehouses'>
export type WarehouseUpdate = TablesUpdate<'warehouses'>
export type WarehouseZone = Tables<'warehouse_zones'>
export type WarehouseZoneInsert = TablesInsert<'warehouse_zones'>
export type WarehouseZoneUpdate = TablesUpdate<'warehouse_zones'>
export type StockTransfer = Tables<'stock_transfers'>
export type StockTransferInsert = TablesInsert<'stock_transfers'>
export type StockTransferUpdate = TablesUpdate<'stock_transfers'>
export type StockTransferItem = Tables<'stock_transfer_items'>
export type StockTransferItemInsert = TablesInsert<'stock_transfer_items'>
export type Vehicle = Tables<'vehicles'>
export type VehicleInsert = TablesInsert<'vehicles'>
export type VehicleUpdate = TablesUpdate<'vehicles'>
export type Driver = Tables<'drivers'>
export type DriverInsert = TablesInsert<'drivers'>
export type DriverUpdate = TablesUpdate<'drivers'>

// Extended interfaces for better UX
export interface WarehouseWithDetails extends Warehouse {
  branch?: Tables<'branches'> | null
  zones?: WarehouseZone[]
  total_volume?: number
  used_volume?: number
  utilization_percentage?: number
  total_capacity_kg?: number
  used_capacity_kg?: number
  capacity_utilization_percentage?: number
}

export interface WarehouseZoneWithDetails extends WarehouseZone {
  warehouse?: Pick<Warehouse, 'id' | 'name' | 'code'>
  used_volume?: number
  utilization_percentage?: number
  used_capacity_kg?: number
  capacity_utilization_percentage?: number
}

export interface StockTransferWithDetails extends StockTransfer {
  from_warehouse?: Pick<Warehouse, 'id' | 'name' | 'code'>
  to_warehouse?: Pick<Warehouse, 'id' | 'name' | 'code'>
  vehicle?: Vehicle | null
  driver?: (Driver & { party?: Tables<'parties'> }) | null
  items?: StockTransferItemWithDetails[]
  total_items?: number
  total_quantity?: number
}

export interface StockTransferItemWithDetails extends StockTransferItem {
  product?: Pick<Tables<'products'>, 'id' | 'name' | 'sku' | 'unit_code'>
}

export interface VehicleWithDetails extends Vehicle {
  provider_party?: Pick<Tables<'parties'>, 'id' | 'fullname' | 'doc_number'> | null
}

export interface DriverWithDetails extends Driver {
  party?: Pick<Tables<'parties'>, 'id' | 'fullname' | 'doc_number' | 'phone' | 'email'>
}

// Filter interfaces
export interface WarehouseFilters {
  search?: string
  branchId?: string | null
  active?: boolean
}

export interface WarehouseZoneFilters {
  search?: string
  warehouseId?: string
}

export interface StockTransferFilters {
  search?: string
  fromWarehouseId?: string
  toWarehouseId?: string
  vehicleId?: string
  driverId?: string
  dateFrom?: string
  dateTo?: string
  status?: string
}

export interface VehicleFilters {
  search?: string
  own?: boolean | null
  active?: boolean
}

export interface DriverFilters {
  search?: string
  active?: boolean
}

// Transfer creation payload
export interface StockTransferCreatePayload {
  from_warehouse_id: string
  to_warehouse_id: string
  transfer_date: string
  reason?: string
  modality?: string
  notes?: string
  vehicle_id?: string
  driver_id?: string
  items: Array<{
    product_id: string
    quantity: number
    unit_code: string
  }>
}

export default class WarehouseService {
  // Warehouse Management
  static async listWarehouses(companyId: string, filters: WarehouseFilters = {}): Promise<WarehouseWithDetails[]> {
    let query = supabase
      .from('warehouses')
      .select(`
        *,
        branches(id, name, code),
        warehouse_zones(*)
      `)
      .eq('company_id', companyId)
      .is('deleted_at', null)

    if (filters.branchId) {
      query = query.eq('branch_id', filters.branchId)
    }

    if (filters.search && filters.search.trim() !== '') {
      const term = filters.search.trim()
      query = query.or(`name.ilike.%${term}%,code.ilike.%${term}%`)
    }

    const { data, error } = await query.order('name')
    if (error) throw error

    return (data || []).map(warehouse => {
      const zones = warehouse.warehouse_zones as WarehouseZone[] || []
      const totalVolume = warehouse.width * warehouse.height * warehouse.length
      const totalCapacityKg = zones.reduce((sum, zone) => sum + (zone.capacity_kg || 0), 0)

      return {
        ...warehouse,
        zones,
        total_volume: totalVolume,
        total_capacity_kg: totalCapacityKg,
        // TODO: Calculate used volume and capacity from stock data
        used_volume: 0,
        utilization_percentage: 0,
        used_capacity_kg: 0,
        capacity_utilization_percentage: 0,
      }
    })
  }

  static async getWarehouse(companyId: string, id: string): Promise<WarehouseWithDetails | null> {
    const { data, error } = await supabase
      .from('warehouses')
      .select(`
        *,
        branches(id, name, code),
        warehouse_zones(*)
      `)
      .eq('company_id', companyId)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) throw error
    if (!data) return null

    const zones = data.warehouse_zones as WarehouseZone[] || []
    const totalVolume = data.width * data.height * data.length
    const totalCapacityKg = zones.reduce((sum, zone) => sum + (zone.capacity_kg || 0), 0)

    return {
      ...data,
      zones,
      total_volume: totalVolume,
      total_capacity_kg: totalCapacityKg,
      used_volume: 0,
      utilization_percentage: 0,
      used_capacity_kg: 0,
      capacity_utilization_percentage: 0,
    }
  }

  static async createWarehouse(payload: WarehouseInsert): Promise<Warehouse> {
    const { data, error } = await supabase
      .from('warehouses')
      .insert(payload)
      .select('*')
      .single()
    if (error) throw error
    return data
  }

  static async updateWarehouse(id: string, payload: WarehouseUpdate): Promise<Warehouse> {
    const { data, error } = await supabase
      .from('warehouses')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data
  }

  static async deleteWarehouse(id: string): Promise<void> {
    const { error } = await supabase
      .from('warehouses')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  }

  // Warehouse Zone Management
  static async listWarehouseZones(companyId: string, filters: WarehouseZoneFilters = {}): Promise<WarehouseZoneWithDetails[]> {
    let query = supabase
      .from('warehouse_zones')
      .select(`
        *,
        warehouses(id, name, code)
      `)
      .eq('company_id', companyId)
      .is('deleted_at', null)

    if (filters.warehouseId) {
      query = query.eq('warehouse_id', filters.warehouseId)
    }

    if (filters.search && filters.search.trim() !== '') {
      const term = filters.search.trim()
      query = query.or(`name.ilike.%${term}%,code.ilike.%${term}%`)
    }

    const { data, error } = await query.order('code')
    if (error) throw error

    return (data || []).map(zone => ({
      ...zone,
      used_volume: 0,
      utilization_percentage: 0,
      used_capacity_kg: 0,
      capacity_utilization_percentage: 0,
    }))
  }

  static async getWarehouseZone(companyId: string, id: string): Promise<WarehouseZoneWithDetails | null> {
    const { data, error } = await supabase
      .from('warehouse_zones')
      .select(`
        *,
        warehouses(id, name, code)
      `)
      .eq('company_id', companyId)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) throw error
    if (!data) return null

    return {
      ...data,
      used_volume: 0,
      utilization_percentage: 0,
      used_capacity_kg: 0,
      capacity_utilization_percentage: 0,
    }
  }

  static async createWarehouseZone(payload: WarehouseZoneInsert): Promise<WarehouseZone> {
    const { data, error } = await supabase
      .from('warehouse_zones')
      .insert(payload)
      .select('*')
      .single()
    if (error) throw error
    return data
  }

  static async updateWarehouseZone(id: string, payload: WarehouseZoneUpdate): Promise<WarehouseZone> {
    const { data, error } = await supabase
      .from('warehouse_zones')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data
  }

  static async deleteWarehouseZone(id: string): Promise<void> {
    const { error } = await supabase
      .from('warehouse_zones')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  }

  // Stock Transfer Management
  static async listStockTransfers(companyId: string, filters: StockTransferFilters = {}): Promise<StockTransferWithDetails[]> {
    let query = supabase
      .from('stock_transfers')
      .select(`
        *,
        from_warehouse:warehouses!stock_transfers_from_warehouse_id_fkey(id, name, code),
        to_warehouse:warehouses!stock_transfers_to_warehouse_id_fkey(id, name, code),
        vehicles(*),
        drivers(*, parties(*))
      `)
      .eq('company_id', companyId)

    if (filters.fromWarehouseId) {
      query = query.eq('from_warehouse_id', filters.fromWarehouseId)
    }

    if (filters.toWarehouseId) {
      query = query.eq('to_warehouse_id', filters.toWarehouseId)
    }

    if (filters.vehicleId) {
      query = query.eq('vehicle_id', filters.vehicleId)
    }

    if (filters.driverId) {
      query = query.eq('driver_id', filters.driverId)
    }

    if (filters.dateFrom) {
      query = query.gte('transfer_date', filters.dateFrom)
    }

    if (filters.dateTo) {
      query = query.lte('transfer_date', filters.dateTo)
    }

    const { data, error } = await query
      .order('transfer_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error

    // Get transfer items count for each transfer
    const transferIds = (data || []).map(t => t.id)
    let itemCounts: Record<string, { count: number; quantity: number }> = {}

    if (transferIds.length > 0) {
      const { data: itemsData, error: itemsError } = await supabase
        .from('stock_transfer_items')
        .select('transfer_id, quantity')
        .in('transfer_id', transferIds)

      if (!itemsError && itemsData) {
        itemCounts = itemsData.reduce((acc, item) => {
          if (!acc[item.transfer_id]) {
            acc[item.transfer_id] = { count: 0, quantity: 0 }
          }
          acc[item.transfer_id].count++
          acc[item.transfer_id].quantity += item.quantity
          return acc
        }, {} as Record<string, { count: number; quantity: number }>)
      }
    }

    return (data || []).map(transfer => ({
      ...transfer,
      total_items: itemCounts[transfer.id]?.count || 0,
      total_quantity: itemCounts[transfer.id]?.quantity || 0,
    }))
  }

  static async getStockTransfer(companyId: string, id: string): Promise<StockTransferWithDetails | null> {
    const { data, error } = await supabase
      .from('stock_transfers')
      .select(`
        *,
        from_warehouse:warehouses!stock_transfers_from_warehouse_id_fkey(id, name, code),
        to_warehouse:warehouses!stock_transfers_to_warehouse_id_fkey(id, name, code),
        vehicles(*),
        drivers(*, parties(*))
      `)
      .eq('company_id', companyId)
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) return null

    // Get transfer items
    const { data: itemsData, error: itemsError } = await supabase
      .from('stock_transfer_items')
      .select(`
        *,
        products(id, name, sku, unit_code)
      `)
      .eq('transfer_id', id)
      .order('created_at')

    const items = itemsError ? [] : (itemsData || [])
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)

    return {
      ...data,
      items,
      total_items: items.length,
      total_quantity: totalQuantity,
    }
  }

  static async createStockTransfer(payload: StockTransferCreatePayload): Promise<StockTransfer> {
    const { items, ...transferData } = payload

    // Create the transfer
    const { data: transfer, error: transferError } = await supabase
      .from('stock_transfers')
      .insert(transferData)
      .select('*')
      .single()

    if (transferError) throw transferError

    // Create transfer items
    const transferItems = items.map(item => ({
      ...item,
      transfer_id: transfer.id,
      company_id: transfer.company_id,
    }))

    const { error: itemsError } = await supabase
      .from('stock_transfer_items')
      .insert(transferItems)

    if (itemsError) {
      // Rollback transfer creation if items fail
      await supabase.from('stock_transfers').delete().eq('id', transfer.id)
      throw itemsError
    }

    return transfer
  }

  static async updateStockTransfer(id: string, payload: StockTransferUpdate): Promise<StockTransfer> {
    const { data, error } = await supabase
      .from('stock_transfers')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data
  }

  static async deleteStockTransfer(id: string): Promise<void> {
    // Delete transfer items first
    await supabase.from('stock_transfer_items').delete().eq('transfer_id', id)

    // Delete transfer
    const { error } = await supabase.from('stock_transfers').delete().eq('id', id)
    if (error) throw error
  }

  // Vehicle Management
  static async listVehicles(companyId: string, filters: VehicleFilters = {}): Promise<VehicleWithDetails[]> {
    let query = supabase
      .from('vehicles')
      .select(`
        *,
        provider_party:parties(id, fullname, doc_number)
      `)
      .eq('company_id', companyId)

    if (filters.own !== null && filters.own !== undefined) {
      query = query.eq('own', filters.own)
    }

    if (filters.search && filters.search.trim() !== '') {
      const term = filters.search.trim()
      query = query.or(`plate.ilike.%${term}%,brand.ilike.%${term}%,model.ilike.%${term}%`)
    }

    const { data, error } = await query.order('plate')
    if (error) throw error
    return data || []
  }

  static async getVehicle(companyId: string, id: string): Promise<VehicleWithDetails | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        provider_party:parties(id, fullname, doc_number)
      `)
      .eq('company_id', companyId)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  static async createVehicle(payload: VehicleInsert): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .insert(payload)
      .select('*')
      .single()
    if (error) throw error
    return data
  }

  static async updateVehicle(id: string, payload: VehicleUpdate): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data
  }

  static async deleteVehicle(id: string): Promise<void> {
    const { error } = await supabase.from('vehicles').delete().eq('id', id)
    if (error) throw error
  }

  // Driver Management
  static async listDrivers(companyId: string, filters: DriverFilters = {}): Promise<DriverWithDetails[]> {
    let query = supabase
      .from('drivers')
      .select(`
        *,
        parties(id, fullname, doc_number, phone, email)
      `)
      .eq('company_id', companyId)

    if (filters.search && filters.search.trim() !== '') {
      const term = filters.search.trim()
      query = query.or(`license_number.ilike.%${term}%`)
    }

    const { data, error } = await query.order('license_number')
    if (error) throw error
    return data || []
  }

  static async getDriver(companyId: string, id: string): Promise<DriverWithDetails | null> {
    const { data, error } = await supabase
      .from('drivers')
      .select(`
        *,
        parties(id, fullname, doc_number, phone, email)
      `)
      .eq('company_id', companyId)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  static async createDriver(payload: DriverInsert): Promise<Driver> {
    const { data, error } = await supabase
      .from('drivers')
      .insert(payload)
      .select('*')
      .single()
    if (error) throw error
    return data
  }

  static async updateDriver(id: string, payload: DriverUpdate): Promise<Driver> {
    const { data, error } = await supabase
      .from('drivers')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data
  }

  static async deleteDriver(id: string): Promise<void> {
    const { error } = await supabase.from('drivers').delete().eq('id', id)
    if (error) throw error
  }

  // Capacity and Utilization Calculations
  static async calculateWarehouseUtilization(warehouseId: string): Promise<{
    volume_utilization: number
    capacity_utilization: number
  }> {
    // This would require complex calculations based on product dimensions and stock levels
    // For now, return placeholder values
    return {
      volume_utilization: 0,
      capacity_utilization: 0,
    }
  }

  static async calculateZoneUtilization(zoneId: string): Promise<{
    volume_utilization: number
    capacity_utilization: number
  }> {
    // This would require complex calculations based on product dimensions and stock levels
    // For now, return placeholder values
    return {
      volume_utilization: 0,
      capacity_utilization: 0,
    }
  }
}
