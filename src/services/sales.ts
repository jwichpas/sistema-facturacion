import { supabase } from '@/services/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database'

export type SalesDoc = Tables<'sales_docs'>
export type SalesDocInsert = TablesInsert<'sales_docs'>
export type SalesDocUpdate = TablesUpdate<'sales_docs'>
export type SalesDocItem = Tables<'sales_doc_items'>
export type SalesDocItemInsert = TablesInsert<'sales_doc_items'>
export type SalesDocItemUpdate = TablesUpdate<'sales_doc_items'>

// Extended interfaces for better UX
export interface SalesDocWithDetails extends SalesDoc {
  customer?: Pick<Tables<'parties'>, 'id' | 'fullname' | 'doc_type' | 'doc_number' | 'email' | 'phone'> | null
  branch?: Pick<Tables<'branches'>, 'id' | 'name' | 'code'> | null
  items?: SalesDocItemWithDetails[]
}

export interface SalesDocItemWithDetails extends SalesDocItem {
  product?: Pick<Tables<'products'>, 'id' | 'name' | 'sku' | 'barcode'> | null
}

export interface SalesDocListItem extends SalesDoc {
  customer_name?: string | null
  customer_doc?: string | null
  branch_name?: string | null
  items_count?: number
}

export interface SalesDocFilters {
  search?: string
  customerId?: string | null
  branchId?: string | null
  docType?: string | null
  dateFrom?: string
  dateTo?: string
  status?: string | null
}

export interface SalesDocCreatePayload {
  doc: Omit<SalesDocInsert, 'id' | 'created_at' | 'updated_at'>
  items: Array<Omit<SalesDocItemInsert, 'id' | 'sales_doc_id' | 'created_at'>>
}

export interface SalesDocUpdatePayload {
  doc: Partial<SalesDocUpdate>
  items?: Array<{
    id?: string
    action: 'create' | 'update' | 'delete'
    data?: Partial<SalesDocItemInsert>
  }>
}

// Tax calculation interfaces
export interface TaxCalculation {
  subtotal: number
  igv_amount: number
  total: number
  total_ope_gravadas: number
  total_ope_exoneradas: number
  total_ope_inafectas: number
  total_descuentos: number
}

export interface SalesDocItemCalculation extends SalesDocItemInsert {
  subtotal: number
  discount_amount: number
  line_total_before_tax: number
  line_total_with_tax: number
}

export default class SalesService {
  // Sales Document Management
  static async listSalesDocs(companyId: string, filters: SalesDocFilters = {}): Promise<SalesDocListItem[]> {
    let query = supabase
      .from('sales_docs')
      .select(`
        *,
        parties!customer_id(fullname, doc_type, doc_number),
        branches(name),
        sales_doc_items(id)
      `)
      .eq('company_id', companyId)

    if (filters.customerId) {
      query = query.eq('customer_id', filters.customerId)
    }

    if (filters.branchId) {
      query = query.eq('branch_id', filters.branchId)
    }

    if (filters.docType) {
      query = query.eq('doc_type', filters.docType)
    }

    if (filters.dateFrom) {
      query = query.gte('issue_date', filters.dateFrom)
    }

    if (filters.dateTo) {
      query = query.lte('issue_date', filters.dateTo)
    }

    if (filters.status) {
      query = query.eq('greenter_status', filters.status)
    }

    if (filters.search && filters.search.trim() !== '') {
      const term = filters.search.trim()
      query = query.or(
        `series.ilike.%${term}%,number::text.ilike.%${term}%,notes.ilike.%${term}%`
      )
    }

    const { data, error } = await query.order('issue_date', { ascending: false }).order('created_at', { ascending: false })
    if (error) throw error

    type JoinedSalesDoc = SalesDoc & {
      parties?: { fullname?: string; doc_type?: string; doc_number?: string } | null
      branches?: { name?: string } | null
      sales_doc_items?: Array<{ id: string }>
    }

    return (data as JoinedSalesDoc[]).map((doc) => ({
      ...(doc as SalesDoc),
      customer_name: doc.parties?.fullname ?? null,
      customer_doc: doc.parties ? `${doc.parties.doc_type}-${doc.parties.doc_number}` : null,
      branch_name: doc.branches?.name ?? null,
      items_count: doc.sales_doc_items?.length ?? 0,
    }))
  }

  static async getSalesDoc(companyId: string, id: string): Promise<SalesDoc | null> {
    const { data, error } = await supabase
      .from('sales_docs')
      .select('*')
      .eq('company_id', companyId)
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  }

  static async getSalesDocWithDetails(companyId: string, id: string): Promise<SalesDocWithDetails | null> {
    const { data, error } = await supabase
      .from('sales_docs')
      .select(`
        *,
        parties!customer_id(id, fullname, doc_type, doc_number, email, phone),
        branches(id, name, code),
        sales_doc_items(
          *,
          products(id, name, sku, barcode)
        )
      `)
      .eq('company_id', companyId)
      .eq('id', id)
      .single()

    if (error) throw error

    // Transform the data to match the expected interface
    const transformedData = {
      ...data,
      customer: data.parties,
      branch: data.branches,
      items: data.sales_doc_items?.map((item: any) => ({
        ...item,
        product: item.products // Transform products to product
      }))
    }

    // Remove the original properties to avoid confusion
    delete transformedData.parties
    delete transformedData.branches
    delete transformedData.sales_doc_items

    return transformedData as SalesDocWithDetails
  }

  static async createSalesDoc(payload: SalesDocCreatePayload): Promise<SalesDoc> {
    const { data: doc, error: docError } = await supabase
      .from('sales_docs')
      .insert(payload.doc)
      .select('*')
      .single()

    if (docError) throw docError

    // Insert items
    if (payload.items.length > 0) {
      const itemsToInsert = payload.items.map(item => ({
        ...item,
        sales_doc_id: doc.id,
        company_id: payload.doc.company_id
      }))

      const { error: itemsError } = await supabase
        .from('sales_doc_items')
        .insert(itemsToInsert)

      if (itemsError) throw itemsError
    }

    return doc
  }

  static async updateSalesDoc(id: string, payload: SalesDocUpdatePayload): Promise<SalesDoc> {
    // Update document
    const { data: doc, error: docError } = await supabase
      .from('sales_docs')
      .update(payload.doc)
      .eq('id', id)
      .select('*')
      .single()

    if (docError) throw docError

    // Handle items updates if provided
    if (payload.items) {
      for (const itemUpdate of payload.items) {
        if (itemUpdate.action === 'create' && itemUpdate.data) {
          const { error } = await supabase
            .from('sales_doc_items')
            .insert({
              ...itemUpdate.data,
              sales_doc_id: id,
              company_id: doc.company_id
            })
          if (error) throw error
        } else if (itemUpdate.action === 'update' && itemUpdate.id && itemUpdate.data) {
          const { error } = await supabase
            .from('sales_doc_items')
            .update(itemUpdate.data)
            .eq('id', itemUpdate.id)
          if (error) throw error
        } else if (itemUpdate.action === 'delete' && itemUpdate.id) {
          const { error } = await supabase
            .from('sales_doc_items')
            .delete()
            .eq('id', itemUpdate.id)
          if (error) throw error
        }
      }
    }

    return doc
  }

  static async deleteSalesDoc(id: string): Promise<void> {
    // Items will be deleted automatically due to cascade
    const { error } = await supabase.from('sales_docs').delete().eq('id', id)
    if (error) throw error
  }

  // Document numbering
  static async getNextDocumentNumber(companyId: string, docType: string, series: string): Promise<number> {
    const { data, error } = await supabase
      .from('sales_docs')
      .select('number')
      .eq('company_id', companyId)
      .eq('doc_type', docType)
      .eq('series', series)
      .order('number', { ascending: false })
      .limit(1)

    if (error) throw error

    const lastNumber = data?.[0]?.number ?? 0
    return lastNumber + 1
  }

  // Tax calculations according to SUNAT rules
  static calculateItemTax(item: {
    quantity: number
    unit_price: number
    discount_pct?: number
    igv_affectation?: string
  }): SalesDocItemCalculation {
    const quantity = item.quantity || 0
    const unitPrice = item.unit_price || 0
    const discountPct = item.discount_pct || 0
    const igvAffectation = item.igv_affectation || '10'

    const subtotal = quantity * unitPrice
    const discountAmount = subtotal * (discountPct / 100)
    const lineTotal = subtotal - discountAmount

    let igvAmount = 0
    let lineTotalWithTax = lineTotal

    // IGV calculation based on affectation code
    if (igvAffectation === '10') { // Gravado - Operación Onerosa
      igvAmount = lineTotal * 0.18 // 18% IGV
      lineTotalWithTax = lineTotal + igvAmount
    }
    // Other affectation codes (exonerated, unaffected) don't add IGV

    return {
      ...item,
      quantity,
      unit_price: unitPrice,
      discount_pct: discountPct,
      igv_affectation: igvAffectation,
      igv_amount: igvAmount,
      total_line: lineTotal,
      subtotal,
      discount_amount: discountAmount,
      line_total_before_tax: lineTotal,
      line_total_with_tax: lineTotalWithTax
    }
  }

  static calculateDocumentTotals(items: SalesDocItemCalculation[]): TaxCalculation {
    let totalOpeGravadas = 0
    let totalOpeExoneradas = 0
    let totalOpeInafectas = 0
    let totalIgv = 0
    let totalDescuentos = 0

    for (const item of items) {
      const lineTotal = item.line_total_before_tax
      const igvAmount = item.igv_amount || 0
      const discountAmount = item.discount_amount || 0

      totalDescuentos += discountAmount

      // Classify by IGV affectation
      if (item.igv_affectation === '10') {
        totalOpeGravadas += lineTotal
        totalIgv += igvAmount
      } else if (item.igv_affectation === '20') {
        totalOpeExoneradas += lineTotal
      } else {
        totalOpeInafectas += lineTotal
      }
    }

    const subtotal = totalOpeGravadas + totalOpeExoneradas + totalOpeInafectas
    const total = subtotal + totalIgv

    return {
      subtotal,
      igv_amount: totalIgv,
      total,
      total_ope_gravadas: totalOpeGravadas,
      total_ope_exoneradas: totalOpeExoneradas,
      total_ope_inafectas: totalOpeInafectas,
      total_descuentos: totalDescuentos
    }
  }

  // Electronic invoicing status management
  static async updateElectronicInvoicingStatus(
    id: string,
    status: string,
    ticket?: string,
    xml?: Uint8Array,
    cdr?: Uint8Array,
    hash?: string
  ): Promise<void> {
    const updates: Partial<SalesDocUpdate> = {
      greenter_status: status,
      updated_at: new Date().toISOString()
    }

    if (ticket) updates.greenter_ticket = ticket
    if (xml) updates.greenter_xml = xml
    if (cdr) updates.greenter_cdr = cdr
    if (hash) updates.greenter_hash = hash

    const { error } = await supabase
      .from('sales_docs')
      .update(updates)
      .eq('id', id)

    if (error) throw error
  }

  // Sales analytics and reporting
  static async getSalesAnalytics(companyId: string, dateFrom: string, dateTo: string): Promise<{
    totalSales: number
    totalDocuments: number
    averageTicket: number
    salesByDocType: Array<{ doc_type: string; count: number; total: number }>
    salesByDay: Array<{ date: string; total: number; count: number }>
  }> {
    const { data, error } = await supabase
      .from('sales_docs')
      .select('doc_type, issue_date, total')
      .eq('company_id', companyId)
      .gte('issue_date', dateFrom)
      .lte('issue_date', dateTo)

    if (error) throw error

    const totalSales = data.reduce((sum, doc) => sum + (doc.total || 0), 0)
    const totalDocuments = data.length
    const averageTicket = totalDocuments > 0 ? totalSales / totalDocuments : 0

    // Group by document type
    const salesByDocType = data.reduce((acc, doc) => {
      const existing = acc.find(item => item.doc_type === doc.doc_type)
      if (existing) {
        existing.count += 1
        existing.total += doc.total || 0
      } else {
        acc.push({
          doc_type: doc.doc_type,
          count: 1,
          total: doc.total || 0
        })
      }
      return acc
    }, [] as Array<{ doc_type: string; count: number; total: number }>)

    // Group by day
    const salesByDay = data.reduce((acc, doc) => {
      const date = doc.issue_date
      const existing = acc.find(item => item.date === date)
      if (existing) {
        existing.count += 1
        existing.total += doc.total || 0
      } else {
        acc.push({
          date,
          count: 1,
          total: doc.total || 0
        })
      }
      return acc
    }, [] as Array<{ date: string; total: number; count: number }>)

    return {
      totalSales,
      totalDocuments,
      averageTicket,
      salesByDocType,
      salesByDay: salesByDay.sort((a, b) => a.date.localeCompare(b.date))
    }
  }

  static async getTopCustomers(companyId: string, dateFrom: string, dateTo: string, limit = 10): Promise<Array<{
    customer_id: string
    customer_name: string
    customer_doc: string
    total_sales: number
    documents_count: number
    last_sale_date: string
  }>> {
    const { data, error } = await supabase
      .from('sales_docs')
      .select(`
        customer_id,
        total,
        issue_date,
        parties!customer_id(fullname, doc_type, doc_number)
      `)
      .eq('company_id', companyId)
      .gte('issue_date', dateFrom)
      .lte('issue_date', dateTo)

    if (error) throw error

    type JoinedData = {
      customer_id: string
      total: number
      issue_date: string
      parties: { fullname: string; doc_type: string; doc_number: string } | null
    }

    const customerSales = (data as JoinedData[]).reduce((acc, doc) => {
      const customerId = doc.customer_id
      const existing = acc.get(customerId)

      if (existing) {
        existing.total_sales += doc.total || 0
        existing.documents_count += 1
        if (doc.issue_date > existing.last_sale_date) {
          existing.last_sale_date = doc.issue_date
        }
      } else {
        acc.set(customerId, {
          customer_id: customerId,
          customer_name: doc.parties?.fullname || '',
          customer_doc: doc.parties ? `${doc.parties.doc_type}-${doc.parties.doc_number}` : '',
          total_sales: doc.total || 0,
          documents_count: 1,
          last_sale_date: doc.issue_date
        })
      }

      return acc
    }, new Map())

    return Array.from(customerSales.values())
      .sort((a, b) => b.total_sales - a.total_sales)
      .slice(0, limit)
  }
}
