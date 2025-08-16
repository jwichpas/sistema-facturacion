import { supabase } from '@/services/supabase'
import type { Database } from '@/types/database'
import type { Party, PartyContact, PartyWithDetails, PartyFilters, DocumentType } from '@/types'
import {
  transformPartyFromDB,
  transformPartiesFromDB,
  transformPartyContactFromDB,
  transformPartyToDB
} from '@/utils/typeTransformers'

// Database types for internal use
type DbParty = Database['public']['Tables']['parties']['Row']
type DbPartyContact = Database['public']['Tables']['party_contacts']['Row']

export type PartyInsert = Database['public']['Tables']['parties']['Insert']
export type PartyUpdate = Database['public']['Tables']['parties']['Update']
export type PartyContactInsert = Database['public']['Tables']['party_contacts']['Insert']
export type PartyContactUpdate = Database['public']['Tables']['party_contacts']['Update']

// SUNAT Document Types - Catálogo 06
const SUNAT_DOCUMENT_TYPES: DocumentType[] = [
  { code: '0', description: 'DOC.TRIB.NO.DOM.SIN.RUC', is_active: true },
  { code: '1', description: 'DNI', length: 8, validation_pattern: '^[0-9]{8}$', is_active: true },
  { code: '4', description: 'CARNET DE EXTRANJERIA', is_active: true },
  { code: '6', description: 'RUC', length: 11, validation_pattern: '^[0-9]{11}$', is_active: true },
  { code: '7', description: 'PASAPORTE', is_active: true },
  { code: 'A', description: 'CED. DIPLOMATICA DE IDENTIDAD', is_active: true },
  { code: 'B', description: 'DOC.IDENT.PAIS.RESIDENCIA-NO.D', is_active: true }
]

export interface PartyListItem extends Party {
  document_type_description?: string
  contacts_count?: number
  total_sales?: number
  total_purchases?: number
  last_transaction_date?: string
}

export interface PartyTransactionSummary {
  party_id: string
  total_sales: number
  total_purchases: number
  last_sale_date?: string
  last_purchase_date?: string
  sales_count: number
  purchases_count: number
}

export default class PartyService {
  // Document validation utilities
  static getDocumentTypes(): DocumentType[] {
    return SUNAT_DOCUMENT_TYPES.filter(dt => dt.is_active)
  }

  static getDocumentType(code: string): DocumentType | null {
    return SUNAT_DOCUMENT_TYPES.find(dt => dt.code === code) || null
  }

  static validateDocumentNumber(docType: string, docNumber: string): { isValid: boolean; error?: string } {
    const documentType = this.getDocumentType(docType)

    if (!documentType) {
      return { isValid: false, error: 'Tipo de documento no válido' }
    }

    if (!docNumber || docNumber.trim() === '') {
      return { isValid: false, error: 'Número de documento es requerido' }
    }

    const cleanNumber = docNumber.trim()

    // Check length if specified
    if (documentType.length && cleanNumber.length !== documentType.length) {
      return {
        isValid: false,
        error: `${documentType.description} debe tener ${documentType.length} dígitos`
      }
    }

    // Check pattern if specified
    if (documentType.validation_pattern) {
      const regex = new RegExp(documentType.validation_pattern)
      if (!regex.test(cleanNumber)) {
        return {
          isValid: false,
          error: `Formato de ${documentType.description} no válido`
        }
      }
    }

    // Additional RUC validation
    if (docType === '6') {
      return this.validateRUC(cleanNumber)
    }

    // Additional DNI validation
    if (docType === '1') {
      return this.validateDNI(cleanNumber)
    }

    return { isValid: true }
  }

  private static validateRUC(ruc: string): { isValid: boolean; error?: string } {
    if (ruc.length !== 11) {
      return { isValid: false, error: 'RUC debe tener 11 dígitos' }
    }

    // Basic RUC validation algorithm
    const digits = ruc.split('').map(Number)
    const factors = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]

    let sum = 0
    for (let i = 0; i < 10; i++) {
      sum += digits[i] * factors[i]
    }

    const remainder = sum % 11
    const checkDigit = remainder < 2 ? remainder : 11 - remainder

    if (digits[10] !== checkDigit) {
      return { isValid: false, error: 'RUC no válido (dígito verificador incorrecto)' }
    }

    return { isValid: true }
  }

  private static validateDNI(dni: string): { isValid: boolean; error?: string } {
    if (dni.length !== 8) {
      return { isValid: false, error: 'DNI debe tener 8 dígitos' }
    }

    // Check if all digits are the same (invalid DNI)
    if (/^(\d)\1{7}$/.test(dni)) {
      return { isValid: false, error: 'DNI no válido' }
    }

    return { isValid: true }
  }

  // Fullname computation logic
  static computeFullname(party: Partial<Party>): string {
    // For companies (RUC), use razon_social
    if (party.doc_type === '6' && party.razon_social) {
      return party.razon_social.trim()
    }

    // For natural persons, combine names
    if (party.nombres || party.apellido_paterno || party.apellido_materno) {
      const parts = [
        party.apellido_paterno?.trim(),
        party.apellido_materno?.trim(),
        party.nombres?.trim()
      ].filter(Boolean)

      if (parts.length > 0) {
        return parts.join(' ')
      }
    }

    // Fallback to razon_social if available
    if (party.razon_social) {
      return party.razon_social.trim()
    }

    // Last resort: use document number
    return party.doc_number || 'Sin nombre'
  }

  // Party CRUD operations
  static async listParties(companyId: string, filters: PartyFilters = {}): Promise<PartyListItem[]> {
    let query = supabase
      .from('parties')
      .select('*')
      .eq('company_id', companyId)

    // Apply filters
    if (filters.isCustomer !== undefined) {
      query = query.eq('is_customer', filters.isCustomer)
    }

    if (filters.isSupplier !== undefined) {
      query = query.eq('is_supplier', filters.isSupplier)
    }

    if (filters.docType) {
      query = query.eq('doc_type', filters.docType)
    }

    if (filters.search && filters.search.trim() !== '') {
      const term = filters.search.trim()
      query = query.or(
        `fullname.ilike.%${term}%,doc_number.ilike.%${term}%,email.ilike.%${term}%,razon_social.ilike.%${term}%`
      )
    }

    const { data, error } = await query.order('fullname')
    if (error) throw error

    // Transform database types to application types and enhance with additional data
    const parties: PartyListItem[] = (data || []).map(dbParty => {
      const party = transformPartyFromDB(dbParty)
      const docType = this.getDocumentType(party.doc_type)
      return {
        ...party,
        document_type_description: docType?.description || party.doc_type,
        contacts_count: 0, // Will be populated separately if needed
        total_sales: 0,
        total_purchases: 0
      }
    })

    return parties
  }

  static async getParty(companyId: string, id: string): Promise<Party | null> {
    const { data, error } = await supabase
      .from('parties')
      .select('*')
      .eq('company_id', companyId)
      .eq('id', id)
      .single()

    if (error) throw error
    return data ? transformPartyFromDB(data) : null
  }

  static async getPartyWithDetails(companyId: string, id: string): Promise<PartyWithDetails | null> {
    const { data, error } = await supabase
      .from('parties')
      .select(`
        *,
        party_contacts(*)
      `)
      .eq('company_id', companyId)
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) return null

    const party = transformPartyFromDB(data)
    const docType = this.getDocumentType(party.doc_type)

    return {
      ...party,
      document_type_description: docType?.description || party.doc_type,
      contacts: (data.party_contacts || []).map((contact: DbPartyContact) => transformPartyContactFromDB(contact))
    }
  }

  static async createParty(payload: Omit<PartyInsert, 'fullname'>): Promise<Party> {
    // Validate document
    const validation = this.validateDocumentNumber(payload.doc_type, payload.doc_number)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    // Check for duplicate document number in the same company
    const { data: existing } = await supabase
      .from('parties')
      .select('id')
      .eq('company_id', payload.company_id)
      .eq('doc_type', payload.doc_type)
      .eq('doc_number', payload.doc_number)
      .single()

    if (existing) {
      throw new Error('Ya existe una persona/empresa con este número de documento')
    }

    // Compute fullname
    const fullname = this.computeFullname(payload)

    const { data, error } = await supabase
      .from('parties')
      .insert({ ...payload, fullname })
      .select('*')
      .single()

    if (error) throw error
    return transformPartyFromDB(data)
  }

  static async updateParty(id: string, payload: Omit<PartyUpdate, 'fullname'>): Promise<Party> {
    // If document info is being updated, validate it
    if (payload.doc_type || payload.doc_number) {
      // Get current party data to merge with updates
      const { data: currentParty } = await supabase
        .from('parties')
        .select('*')
        .eq('id', id)
        .single()

      if (currentParty) {
        const docType = payload.doc_type || currentParty.doc_type
        const docNumber = payload.doc_number || currentParty.doc_number

        const validation = this.validateDocumentNumber(docType, docNumber)
        if (!validation.isValid) {
          throw new Error(validation.error)
        }

        // Check for duplicate document number (excluding current record)
        const { data: existing } = await supabase
          .from('parties')
          .select('id')
          .eq('company_id', currentParty.company_id)
          .eq('doc_type', docType)
          .eq('doc_number', docNumber)
          .neq('id', id)
          .single()

        if (existing) {
          throw new Error('Ya existe una persona/empresa con este número de documento')
        }
      }
    }

    // Get updated data to compute fullname
    const { data: currentData } = await supabase
      .from('parties')
      .select('*')
      .eq('id', id)
      .single()

    if (!currentData) {
      throw new Error('Registro no encontrado')
    }

    const updatedData = { ...currentData, ...payload }
    const fullname = this.computeFullname(updatedData)

    const { data, error } = await supabase
      .from('parties')
      .update({ ...payload, fullname })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return transformPartyFromDB(data)
  }

  static async deleteParty(id: string): Promise<void> {
    const { error } = await supabase.from('parties').delete().eq('id', id)
    if (error) throw error
  }

  // Contact management
  static async listContacts(partyId: string): Promise<PartyContact[]> {
    const { data, error } = await supabase
      .from('party_contacts')
      .select('*')
      .eq('party_id', partyId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(transformPartyContactFromDB)
  }

  static async createContact(payload: PartyContactInsert): Promise<PartyContact> {
    const { data, error } = await supabase
      .from('party_contacts')
      .insert(payload)
      .select('*')
      .single()

    if (error) throw error
    return transformPartyContactFromDB(data)
  }

  static async updateContact(id: string, payload: PartyContactUpdate): Promise<PartyContact> {
    const { data, error } = await supabase
      .from('party_contacts')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return transformPartyContactFromDB(data)
  }

  static async deleteContact(id: string): Promise<void> {
    // Soft delete
    const { error } = await supabase
      .from('party_contacts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
  }

  // Search and lookup utilities
  static async searchParties(companyId: string, query: string, type?: 'customer' | 'supplier'): Promise<PartyListItem[]> {
    const filters: PartyFilters = { search: query }

    if (type === 'customer') {
      filters.isCustomer = true
    } else if (type === 'supplier') {
      filters.isSupplier = true
    }

    return this.listParties(companyId, filters)
  }

  static async findPartyByDocument(companyId: string, docType: string, docNumber: string): Promise<Party | null> {
    const { data, error } = await supabase
      .from('parties')
      .select('*')
      .eq('company_id', companyId)
      .eq('doc_type', docType)
      .eq('doc_number', docNumber)
      .single()

    if (error) return null
    return data ? transformPartyFromDB(data) : null
  }

  // Transaction history (placeholder - would integrate with sales/purchase modules)
  static async getPartyTransactionSummary(companyId: string, partyId: string): Promise<PartyTransactionSummary> {
    // This would be implemented when sales and purchase modules are available
    // For now, return empty summary
    return {
      party_id: partyId,
      total_sales: 0,
      total_purchases: 0,
      sales_count: 0,
      purchases_count: 0
    }
  }

  // Bulk operations
  static async getPartiesByIds(companyId: string, ids: string[]): Promise<Party[]> {
    if (ids.length === 0) return []

    const { data, error } = await supabase
      .from('parties')
      .select('*')
      .eq('company_id', companyId)
      .in('id', ids)

    if (error) throw error
    return transformPartiesFromDB(data || [])
  }

  static async getCustomers(companyId: string, filters: Omit<PartyFilters, 'isCustomer'> = {}): Promise<PartyListItem[]> {
    return this.listParties(companyId, { ...filters, isCustomer: true })
  }

  static async getSuppliers(companyId: string, filters: Omit<PartyFilters, 'isSupplier'> = {}): Promise<PartyListItem[]> {
    return this.listParties(companyId, { ...filters, isSupplier: true })
  }
}
