import { supabase } from './supabase'
import type { Company } from '@/types'

export interface CompanyAccess {
  company: Company
  role: string
  permissions: string[]
  isActive: boolean
}

/**
 * Servicio para manejo de empresas y multitenancy
 */
export class CompanyService {
  /**
   * Obtener todas las empresas a las que el usuario tiene acceso
   */
  static async getUserCompanies(): Promise<CompanyAccess[]> {
    try {
      const user = await supabase.auth.getUser()
      if (!user.data.user) {
        throw new Error('Usuario no autenticado')
      }

      console.log('Getting companies for user:', user.data.user.id)

      // Hacer una consulta simple primero para verificar que funcione
      const { data: userCompaniesData, error: userCompaniesError } = await supabase
        .from('user_companies')
        .select('*')
        .eq('user_id', user.data.user.id)
        .eq('is_active', true)

      if (userCompaniesError) {
        console.error('Error fetching user_companies:', userCompaniesError)
        throw userCompaniesError
      }

      console.log('User companies data:', userCompaniesData)

      if (!userCompaniesData || userCompaniesData.length === 0) {
        console.log('No companies found for user')
        return []
      }

      // Obtener las empresas
      const companyIds = userCompaniesData.map(uc => uc.company_id)
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .in('id', companyIds)

      if (companiesError) {
        console.error('Error fetching companies:', companiesError)
        throw companiesError
      }

      console.log('Companies data:', companiesData)

      // Obtener los roles
      const roleIds = userCompaniesData.map(uc => uc.role_id)
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .in('id', roleIds)

      if (rolesError) {
        console.error('Error fetching roles:', rolesError)
        throw rolesError
      }

      console.log('Roles data:', rolesData)

      // Combinar los datos
      const result: CompanyAccess[] = userCompaniesData.map(uc => {
        const company = companiesData?.find(c => c.id === uc.company_id)
        const role = rolesData?.find(r => r.id === uc.role_id)

        if (!company || !role) {
          console.warn('Missing company or role data for:', uc)
          return null
        }

        return {
          company: {
            id: company.id,
            ruc: company.ruc,
            legal_name: company.legal_name,
            trade_name: company.trade_name,
            email: company.email,
            phone: company.phone,
            address: company.address,
            ubigeo_code: company.ubigeo_code,
            currency_code: company.currency_code,
            valuation_method: company.valuation_method,
            created_at: company.created_at,
            updated_at: company.updated_at
          } as Company,
          role: role.name,
          permissions: Array.isArray(role.permissions) ? role.permissions : [],
          isActive: uc.is_active
        }
      }).filter(item => item !== null) as CompanyAccess[]

      console.log('Final result:', result)

      // Ordenar por nombre legal de la empresa
      return result.sort((a, b) => a.company.legal_name.localeCompare(b.company.legal_name))

    } catch (error) {
      console.error('Error in getUserCompanies:', error)
      throw error
    }
  }

  /**
   * Verificar si el usuario tiene acceso a una empresa específica
   */
  static async hasCompanyAccess(companyId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_companies')
      .select('id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking company access:', error)
      throw error
    }

    return !!data
  }

  /**
   * Verificar si el usuario tiene un permiso específico en una empresa
   */
  static async hasPermission(permission: string, companyId?: string): Promise<boolean> {
    const query = supabase
      .from('user_companies')
      .select(`
        roles!inner (
          permissions
        )
      `)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .eq('is_active', true)

    if (companyId) {
      query.eq('company_id', companyId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error checking permission:', error)
      throw error
    }

    return (data || []).some((item: any) =>
      item.roles &&
      item.roles.permissions &&
      Array.isArray(item.roles.permissions) &&
      item.roles.permissions.includes(permission)
    )
  }

  /**
   * Obtener datos de una empresa específica (solo si el usuario tiene acceso)
   */
  static async getCompany(companyId: string): Promise<Company | null> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        return null
      }
      console.error('Error fetching company:', error)
      throw error
    }

    return {
      id: data.id,
      ruc: data.ruc,
      legal_name: data.legal_name,
      trade_name: data.trade_name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      ubigeo_code: data.ubigeo_code,
      currency_code: data.currency_code,
      valuation_method: data.valuation_method,
      created_at: data.created_at,
      updated_at: data.updated_at
    } as Company
  }

  /**
   * Obtener productos de una empresa (respeta las políticas RLS)
   */
  static async getCompanyProducts(companyId: string, options: {
    limit?: number
    offset?: number
    search?: string
    categoryId?: string
    isActive?: boolean
  } = {}) {
    const {
      limit = 50,
      offset = 0,
      search = '',
      categoryId,
      isActive = true
    } = options

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId)
      .eq('active', isActive)
      .order('name')
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`)
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching company products:', error)
      throw error
    }

    return {
      data: data || [],
      count: count || 0,
      hasMore: count ? offset + limit < count : false
    }
  }

  /**
   * Obtener almacenes de una empresa
   */
  static async getCompanyWarehouses(companyId: string) {
    const { data, error } = await supabase
      .from('warehouses')
      .select(`
        *,
        branch:branches(*)
      `)
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('name')

    if (error) {
      console.error('Error fetching company warehouses:', error)
      throw error
    }

    return data || []
  }

  /**
   * Obtener sucursales de una empresa
   */
  static async getCompanyBranches(companyId: string) {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('name')

    if (error) {
      console.error('Error fetching company branches:', error)
      throw error
    }

    return data || []
  }

  /**
   * Obtener terceros (clientes/proveedores) de una empresa
   */
  static async getCompanyParties(companyId: string, options: {
    type?: 'customer' | 'supplier'
    limit?: number
    offset?: number
    search?: string
  } = {}) {
    const { type, limit = 50, offset = 0, search = '' } = options

    let query = supabase
      .from('parties')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('fullname')
      .range(offset, offset + limit - 1)

    if (type === 'customer') {
      query = query.eq('is_customer', true)
    } else if (type === 'supplier') {
      query = query.eq('is_supplier', true)
    }

    if (search) {
      query = query.or(`fullname.ilike.%${search}%,doc_number.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching company parties:', error)
      throw error
    }

    return {
      data: data || [],
      count: count || 0,
      hasMore: count ? offset + limit < count : false
    }
  }

  /**
   * Función auxiliar para validar acceso a empresa antes de operaciones
   */
  static async validateCompanyAccess(companyId: string): Promise<void> {
    const hasAccess = await this.hasCompanyAccess(companyId)
    if (!hasAccess) {
      throw new Error(`No tienes acceso a la empresa ${companyId}`)
    }
  }

  /**
   * Función auxiliar para validar permisos antes de operaciones
   */
  static async validatePermission(permission: string, companyId?: string): Promise<void> {
    const hasPermission = await this.hasPermission(permission, companyId)
    if (!hasPermission) {
      throw new Error(`No tienes el permiso ${permission} ${companyId ? `en la empresa ${companyId}` : ''}`)
    }
  }

  /**
   * Obtener estadísticas básicas de una empresa
   */
  static async getCompanyStats(companyId: string) {
    try {
      // Ejecutar consultas en paralelo para mejor rendimiento
      const [
        productsResult,
        customersResult,
        suppliersResult,
        warehousesResult,
        salesDocsResult
      ] = await Promise.all([
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('active', true),

        supabase
          .from('parties')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('is_customer', true)
          .is('deleted_at', null),

        supabase
          .from('parties')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('is_supplier', true)
          .is('deleted_at', null),

        supabase
          .from('warehouses')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .is('deleted_at', null),

        supabase
          .from('sales_docs')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .gte('issue_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
      ])

      return {
        products: productsResult.count || 0,
        customers: customersResult.count || 0,
        suppliers: suppliersResult.count || 0,
        warehouses: warehousesResult.count || 0,
        salesThisMonth: salesDocsResult.count || 0
      }
    } catch (error) {
      console.error('Error fetching company stats:', error)
      throw error
    }
  }

  /**
   * Validar RUC peruano
   */
  static validateRUC(ruc: string): boolean {
    if (!ruc || ruc.length !== 11) return false

    // Verificar que solo contenga números
    if (!/^\d{11}$/.test(ruc)) return false

    // Algoritmo de validación de RUC
    const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
    let sum = 0

    for (let i = 0; i < 10; i++) {
      sum += parseInt(ruc[i]) * weights[i]
    }

    const remainder = sum % 11
    const checkDigit = remainder < 2 ? remainder : 11 - remainder

    return checkDigit === parseInt(ruc[10])
  }

  /**
   * Obtener información de ubigeo
   */
  static async getUbigeoInfo(ubigeoCode: string) {
    if (!ubigeoCode || ubigeoCode.length !== 6) return null

    const { data, error } = await supabase
      .from('sunat.ubigeo')
      .select('*')
      .eq('code', ubigeoCode)
      .single()

    if (error) {
      console.error('Error fetching ubigeo info:', error)
      return null
    }

    return data
  }

  /**
   * Buscar ubigeos por texto
   */
  static async searchUbigeo(searchText: string, limit = 10) {
    if (!searchText || searchText.length < 3) return []

    const { data, error } = await supabase
      .from('sunat.ubigeo')
      .select('*')
      .or(`departamento.ilike.%${searchText}%,provincia.ilike.%${searchText}%,distrito.ilike.%${searchText}%`)
      .limit(limit)
      .order('departamento, provincia, distrito')

    if (error) {
      console.error('Error searching ubigeo:', error)
      return []
    }

    return data || []
  }
}

export default CompanyService
