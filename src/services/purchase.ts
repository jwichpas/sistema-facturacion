import { supabase } from '@/services/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database'

export type PurchaseDoc = Tables<'purchase_docs'>
export type PurchaseDocInsert = TablesInsert<'purchase_docs'>
export type PurchaseDocUpdate = TablesUpdate<'purchase_docs'>
export type PurchaseDocItem = Tables<'purchase_doc_items'>
export type PurchaseDocItemInsert = TablesInsert<'purchase_doc_items'>
export type PurchaseDocItemUpdate = TablesUpdate<'purchase_doc_items'>

// Extended interfaces for better UX
export interface PurchaseDocWithDetails extends PurchaseDoc {
  supplier?: Pick<Tables<'parties'>, 'id' | 'fullname' | 'doc_type' | 'doc_number' | 'email' | 'phone'> | null
  items?: PurchaseDocItemWithDetails[]
}

export interface PurchaseDocItemWithDetails extends PurchaseDocItem {
  product?: Pick<Tables<'products'>, 'id' | 'name' | 'sku' | 'barcode' | 'unit_code'> | null
}

export interface PurchaseDocListItem extends PurchaseDoc {
  supplier_name?: string | null
  supplier_doc?: string | null
  items_count?: number
}

export interface PurchaseDocFilters {
  search?: string
  supplierId?: string | null
  docType?: string | null
  dateFrom?: string
  dateTo?: string
  status?: string | null
}

export interface PurchaseDocCreatePayload {
  doc: Omit<PurchaseDocInsert, 'id' | 'created_at' | 'updated_at'>
  items: Array<Omit<PurchaseDocItemInsert, 'id' | 'purchase_doc_id' | 'created_at'>>
}

export interface PurchaseDocUpdatePayload {
  doc: Partial<PurchaseDocUpdate>
  items?: Array<{
    id?: string
    action: 'create' | 'update' | 'delete'
    data?: Partial<PurchaseDocItemInsert>
  }>
}

// Tax calculation interfaces
export interface PurchaseTaxCalculation {
  subtotal: number
  igv_amount: number
  total: number
  total_ope_gravadas: number
  total_ope_exoneradas: number
  total_ope_inafectas: number
  total_descuentos: number
}

export interface PurchaseDocItemCalculation extends PurchaseDocItemInsert {
  subtotal: number
  discount_amount: number
  line_total_before_tax: number
  line_total_with_tax: number
}

export default class PurchaseService {
  // Purchase Document Management
  static async listPurchaseDocs(companyId: string, filters: PurchaseDocFilters = {}): Promise<PurchaseDocListItem[]> {
    let query = supabase
      .from('purchase_docs')
      .select(`
        *,
        parties!supplier_id(fullname, doc_type, doc_number),
        purchase_doc_items(id)
      `)
      .eq('company_id', companyId)

    if (filters.supplierId) {
      query = query.eq('supplier_id', filters.supplierId)
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

    if (filters.search && filters.search.trim() !== '') {
      const term = filters.search.trim()
      query = query.or(
        `series.ilike.%${term}%,number.ilike.%${term}%`
      )
    }

    const { data, error } = await query
      .order('issue_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error

    type JoinedPurchaseDoc = PurchaseDoc & {
      parties?: { fullname?: string; doc_type?: string; doc_number?: string } | null
      purchase_doc_items?: Array<{ id: string }>
    }

    return (data as JoinedPurchaseDoc[]).map((doc) => ({
      ...(doc as PurchaseDoc),
      supplier_name: doc.parties?.fullname ?? null,
      supplier_doc: doc.parties ? `${doc.parties.doc_type}-${doc.parties.doc_number}` : null,
      items_count: doc.purchase_doc_items?.length ?? 0,
    }))
  }

  static async getPurchaseDoc(companyId: string, id: string): Promise<PurchaseDoc | null> {
    const { data, error } = await supabase
      .from('purchase_docs')
      .select('*')
      .eq('company_id', companyId)
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  }

  static async getPurchaseDocWithDetails(companyId: string, id: string): Promise<PurchaseDocWithDetails | null> {
    const { data, error } = await supabase
      .from('purchase_docs')
      .select(`
        *,
        parties!supplier_id(id, fullname, doc_type, doc_number, email, phone),
        purchase_doc_items(
          *,
          products(id, name, sku, barcode, unit_code)
        )
      `)
      .eq('company_id', companyId)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as PurchaseDocWithDetails
  }

  static async createPurchaseDoc(payload: PurchaseDocCreatePayload): Promise<PurchaseDoc> {
    const { data: doc, error: docError } = await supabase
      .from('purchase_docs')
      .insert(payload.doc)
      .select('*')
      .single()

    if (docError) throw docError

    // Insert items
    if (payload.items.length > 0) {
      const itemsToInsert = payload.items.map(item => ({
        ...item,
        purchase_doc_id: doc.id,
        company_id: payload.doc.company_id
      }))

      const { error: itemsError } = await supabase
        .from('purchase_doc_items')
        .insert(itemsToInsert)

      if (itemsError) throw itemsError
    }

    return doc
  }

  static async updatePurchaseDoc(id: string, payload: PurchaseDocUpdatePayload): Promise<PurchaseDoc> {
    // Update document
    const { data: doc, error: docError } = await supabase
      .from('purchase_docs')
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
            .from('purchase_doc_items')
            .insert({
              ...itemUpdate.data,
              purchase_doc_id: id,
              company_id: doc.company_id
            })
          if (error) throw error
        } else if (itemUpdate.action === 'update' && itemUpdate.id && itemUpdate.data) {
          const { error } = await supabase
            .from('purchase_doc_items')
            .update(itemUpdate.data)
            .eq('id', itemUpdate.id)
          if (error) throw error
        } else if (itemUpdate.action === 'delete' && itemUpdate.id) {
          const { error } = await supabase
            .from('purchase_doc_items')
            .delete()
            .eq('id', itemUpdate.id)
          if (error) throw error
        }
      }
    }

    return doc
  }

  static async deletePurchaseDoc(id: string): Promise<void> {
    // Items will be deleted automatically due to cascade
    const { error } = await supabase.from('purchase_docs').delete().eq('id', id)
    if (error) throw error
  }

  // Document numbering
  static async getNextDocumentNumber(companyId: string, docType: string, series: string): Promise<number> {
    const { data, error } = await supabase
      .from('purchase_docs')
      .select('number')
      .eq('company_id', companyId)
      .eq('doc_type', docType)
      .eq('series', series)
      .order('number', { ascending: false })
      .limit(1)

    if (error) throw error

    // Parse the number field as it's stored as text in purchase_docs
    const lastNumberStr = data?.[0]?.number ?? '0'
    const lastNumber = parseInt(lastNumberStr, 10) || 0
    return lastNumber + 1
  }

  // Tax calculations according to SUNAT rules
  static calculateItemTax(item: {
    quantity: number
    unit_cost: number
    discount_pct?: number
    igv_affectation?: string
  }): PurchaseDocItemCalculation {
    const quantity = item.quantity || 0
    const unitCost = item.unit_cost || 0
    const discountPct = item.discount_pct || 0
    const igvAffectation = item.igv_affectation || '10'

    const subtotal = quantity * unitCost
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
      unit_cost: unitCost,
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

  static calculateDocumentTotals(items: PurchaseDocItemCalculation[]): PurchaseTaxCalculation {
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

  // Purchase analytics and reporting
  static async getPurchaseAnalytics(companyId: string, dateFrom: string, dateTo: string): Promise<{
    totalPurchases: number
    totalDocuments: number
    averageTicket: number
    purchasesByDocType: Array<{ doc_type: string; count: number; total: number }>
    purchasesByDay: Array<{ date: string; total: number; count: number }>
  }> {
    const { data, error } = await supabase
      .from('purchase_docs')
      .select('doc_type, issue_date, total')
      .eq('company_id', companyId)
      .gte('issue_date', dateFrom)
      .lte('issue_date', dateTo)

    if (error) throw error

    const totalPurchases = data.reduce((sum, doc) => sum + (doc.total || 0), 0)
    const totalDocuments = data.length
    const averageTicket = totalDocuments > 0 ? totalPurchases / totalDocuments : 0

    // Group by document type
    const purchasesByDocType = data.reduce((acc, doc) => {
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
    const purchasesByDay = data.reduce((acc, doc) => {
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
      totalPurchases,
      totalDocuments,
      averageTicket,
      purchasesByDocType,
      purchasesByDay: purchasesByDay.sort((a, b) => a.date.localeCompare(b.date))
    }
  }

  static async getTopSuppliers(companyId: string, dateFrom: string, dateTo: string, limit = 10): Promise<Array<{
    supplier_id: string
    supplier_name: string
    supplier_doc: string
    total_purchases: number
    documents_count: number
    last_purchase_date: string
  }>> {
    const { data, error } = await supabase
      .from('purchase_docs')
      .select(`
        supplier_id,
        total,
        issue_date,
        parties!supplier_id(fullname, doc_type, doc_number)
      `)
      .eq('company_id', companyId)
      .gte('issue_date', dateFrom)
      .lte('issue_date', dateTo)

    if (error) throw error

    type JoinedData = {
      supplier_id: string
      total: number
      issue_date: string
      parties: { fullname: string; doc_type: string; doc_number: string } | null
    }

    const supplierPurchases = (data as JoinedData[]).reduce((acc, doc) => {
      const supplierId = doc.supplier_id
      const existing = acc.get(supplierId)

      if (existing) {
        existing.total_purchases += doc.total || 0
        existing.documents_count += 1
        if (doc.issue_date > existing.last_purchase_date) {
          existing.last_purchase_date = doc.issue_date
        }
      } else {
        acc.set(supplierId, {
          supplier_id: supplierId,
          supplier_name: doc.parties?.fullname || '',
          supplier_doc: doc.parties ? `${doc.parties.doc_type}-${doc.parties.doc_number}` : '',
          total_purchases: doc.total || 0,
          documents_count: 1,
          last_purchase_date: doc.issue_date
        })
      }

      return acc
    }, new Map())

    return Array.from(supplierPurchases.values())
      .sort((a, b) => b.total_purchases - a.total_purchases)
      .slice(0, limit)
  }

  // Inventory integration - update stock on purchase receipt
  static async updateInventoryOnReceipt(purchaseDocId: string, warehouseId: string): Promise<void> {
    // Get purchase document with items
    const { data: purchaseDoc, error: docError } = await supabase
      .from('purchase_docs')
      .select(`
        *,
        purchase_doc_items(*)
      `)
      .eq('id', purchaseDocId)
      .single()

    if (docError) throw docError
    if (!purchaseDoc) throw new Error('Purchase document not found')

    // Create stock ledger entries for each item
    const stockEntries = (purchaseDoc.purchase_doc_items || []).map(item => ({
      company_id: purchaseDoc.company_id,
      warehouse_id: warehouseId,
      product_id: item.product_id,
      movement_date: purchaseDoc.issue_date,
      ref_doc_type: purchaseDoc.doc_type,
      ref_doc_series: purchaseDoc.series,
      ref_doc_number: purchaseDoc.number,
      operation_type: '02', // Compra
      qty_in: item.quantity,
      qty_out: 0,
      unit_cost_in: item.unit_cost,
      total_cost_in: item.total_line,
      source: 'purchase_doc',
      source_id: purchaseDocId
    }))

    if (stockEntries.length > 0) {
      const { error: stockError } = await supabase
        .from('stock_ledger')
        .insert(stockEntries)

      if (stockError) throw stockError

      // Update warehouse stock balances
      for (const entry of stockEntries) {
        const { error: balanceError } = await supabase.rpc('update_warehouse_stock_balance', {
          p_warehouse_id: entry.warehouse_id,
          p_product_id: entry.product_id,
          p_qty_change: entry.qty_in
        })

        if (balanceError) {
          console.error('Error updating warehouse stock balance:', balanceError)
          // Continue with other products even if one fails
        }
      }
    }
  }

  // Supplier integration helpers
  static async getPurchasesBySupplier(companyId: string, supplierId: string, dateFrom?: string, dateTo?: string): Promise<PurchaseDocListItem[]> {
    const filters: PurchaseDocFilters = { supplierId }
    if (dateFrom) filters.dateFrom = dateFrom
    if (dateTo) filters.dateTo = dateTo

    return this.listPurchaseDocs(companyId, filters)
  }

  static async getSupplierPurchaseSummary(companyId: string, supplierId: string): Promise<{
    total_amount: number
    documents_count: number
    last_purchase_date?: string
    average_ticket: number
  }> {
    const { data, error } = await supabase
      .from('purchase_docs')
      .select('total, issue_date')
      .eq('company_id', companyId)
      .eq('supplier_id', supplierId)

    if (error) throw error

    const totalAmount = data.reduce((sum, doc) => sum + (doc.total || 0), 0)
    const documentsCount = data.length
    const averageTicket = documentsCount > 0 ? totalAmount / documentsCount : 0
    const lastPurchaseDate = data.length > 0
      ? data.sort((a, b) => b.issue_date.localeCompare(a.issue_date))[0].issue_date
      : undefined

    return {
      total_amount: totalAmount,
      documents_count: documentsCount,
      last_purchase_date: lastPurchaseDate,
      average_ticket: averageTicket
    }
  }
}
