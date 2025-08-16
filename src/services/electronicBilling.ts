import { supabase } from './supabase'
import type { Company, SalesDoc } from '@/types'
import type { Tables } from '@/types/database'

export interface ElectronicBillingConfig {
  sol_user?: string
  sol_pass?: string
  cert_path?: string
  client_id?: string
  client_secret?: string
  production: boolean
}

export interface ElectronicBillingStatus {
  has_config: boolean
  production_mode: boolean
  sol_user_configured: boolean
  cert_configured: boolean
  api_configured: boolean
}

export interface CertificateUploadResult {
  path: string
  url: string
  error?: string
}

// Greenter XML Generation Types
export interface GreenterInvoiceData {
  company: {
    ruc: string
    legal_name: string
    trade_name?: string
    address?: string
    ubigeo_code?: string
  }
  customer: {
    doc_type: string
    doc_number: string
    fullname: string
    address?: string
    email?: string
  }
  document: {
    doc_type: string
    series: string
    number: number
    issue_date: string
    currency_code: string
    exchange_rate?: number
  }
  items: Array<{
    description: string
    unit_code: string
    quantity: number
    unit_price: number
    discount_pct: number
    igv_affectation: string
    igv_amount: number
    total_line: number
  }>
  totals: {
    total_ope_gravadas: number
    total_ope_exoneradas: number
    total_ope_inafectas: number
    total_igv: number
    total_descuentos: number
    total: number
  }
}

// SUNAT Submission Types
export interface SunatSubmissionResult {
  success: boolean
  ticket?: string
  xml?: Uint8Array
  cdr?: Uint8Array
  hash?: string
  error?: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'ERROR'
  observations?: string[]
}

// Electronic Document Status
export type ElectronicDocumentStatus =
  | 'DRAFT'           // Borrador, no enviado
  | 'GENERATING'      // Generando XML
  | 'PENDING'         // XML generado, pendiente de envío
  | 'SUBMITTED'       // Enviado a SUNAT, esperando respuesta
  | 'ACCEPTED'        // Aceptado por SUNAT
  | 'REJECTED'        // Rechazado por SUNAT
  | 'ERROR'           // Error en el proceso
  | 'CANCELLED'       // Anulado

export interface ElectronicDocumentInfo {
  id: string
  doc_type: string
  series: string
  number: number
  issue_date: string
  customer_name: string
  total: number
  status: ElectronicDocumentStatus
  greenter_ticket?: string
  has_xml: boolean
  has_cdr: boolean
  error_message?: string
  observations?: string[]
  created_at: string
  updated_at: string
}

// Retry Configuration
export interface RetryConfig {
  max_attempts: number
  delay_seconds: number
  backoff_multiplier: number
}

/**
 * Servicio para gestión de facturación electrónica con integración Greenter
 */
export class ElectronicBillingService {

  // ========================================
  // XML GENERATION AND SUNAT SUBMISSION
  // ========================================

  /**
   * Generar XML de factura electrónica usando Greenter
   */
  static async generateInvoiceXML(
    companyId: string,
    salesDocId: string
  ): Promise<{ success: boolean; xml?: Uint8Array; hash?: string; error?: string }> {
    try {
      // Actualizar estado a "generando"
      await this.updateDocumentStatus(salesDocId, 'GENERATING')

      // Obtener datos del documento de venta con detalles
      const invoiceData = await this.getInvoiceDataForXML(companyId, salesDocId)
      if (!invoiceData) {
        throw new Error('No se pudo obtener los datos del documento')
      }

      // Validar configuración de facturación electrónica
      const config = await this.getCompanyBillingConfig(companyId)
      if (!config.has_config) {
        throw new Error('Configuración de facturación electrónica incompleta')
      }

      // Generar XML usando Greenter (simulado por ahora)
      const xmlResult = await this.callGreenterXMLGeneration(invoiceData, config)

      if (!xmlResult.success) {
        await this.updateDocumentStatus(salesDocId, 'ERROR', undefined, xmlResult.error)
        return { success: false, error: xmlResult.error }
      }

      // Guardar XML en la base de datos
      await this.saveGeneratedXML(salesDocId, xmlResult.xml!, xmlResult.hash!)

      // Actualizar estado a "pendiente"
      await this.updateDocumentStatus(salesDocId, 'PENDING')

      return {
        success: true,
        xml: xmlResult.xml,
        hash: xmlResult.hash
      }
    } catch (error: any) {
      console.error('Error generating XML:', error)
      await this.updateDocumentStatus(salesDocId, 'ERROR', undefined, error.message)
      return {
        success: false,
        error: error.message || 'Error al generar XML'
      }
    }
  }

  /**
   * Enviar documento a SUNAT
   */
  static async submitToSunat(
    companyId: string,
    salesDocId: string
  ): Promise<SunatSubmissionResult> {
    try {
      // Verificar que el documento tenga XML generado
      const doc = await this.getSalesDocumentById(salesDocId)
      if (!doc || !doc.greenter_xml) {
        throw new Error('El documento no tiene XML generado')
      }

      // Actualizar estado a "enviado"
      await this.updateDocumentStatus(salesDocId, 'SUBMITTED')

      // Obtener configuración de la empresa
      const config = await this.getCompanyBillingConfig(companyId)
      if (!config.has_config) {
        throw new Error('Configuración de facturación electrónica incompleta')
      }

      // Enviar a SUNAT usando Greenter (simulado por ahora)
      const submissionResult = await this.callGreenterSubmission(doc, config)

      // Actualizar estado según resultado
      if (submissionResult.success) {
        await this.updateDocumentStatus(
          salesDocId,
          submissionResult.status,
          submissionResult.ticket,
          undefined,
          submissionResult.observations
        )

        // Si hay CDR, guardarlo
        if (submissionResult.cdr) {
          await this.saveCDR(salesDocId, submissionResult.cdr)
        }
      } else {
        await this.updateDocumentStatus(
          salesDocId,
          'ERROR',
          undefined,
          submissionResult.error
        )
      }

      return submissionResult
    } catch (error: any) {
      console.error('Error submitting to SUNAT:', error)
      await this.updateDocumentStatus(salesDocId, 'ERROR', undefined, error.message)
      return {
        success: false,
        status: 'ERROR',
        error: error.message || 'Error al enviar a SUNAT'
      }
    }
  }

  /**
   * Consultar estado de documento en SUNAT usando ticket
   */
  static async checkSunatStatus(
    companyId: string,
    salesDocId: string
  ): Promise<SunatSubmissionResult> {
    try {
      const doc = await this.getSalesDocumentById(salesDocId)
      if (!doc || !doc.greenter_ticket) {
        throw new Error('El documento no tiene ticket de SUNAT')
      }

      const config = await this.getCompanyBillingConfig(companyId)
      if (!config.has_config) {
        throw new Error('Configuración de facturación electrónica incompleta')
      }

      // Consultar estado en SUNAT (simulado por ahora)
      const statusResult = await this.callGreenterStatusCheck(doc.greenter_ticket, config)

      // Actualizar estado según resultado
      if (statusResult.success) {
        await this.updateDocumentStatus(
          salesDocId,
          statusResult.status,
          doc.greenter_ticket,
          undefined,
          statusResult.observations
        )

        // Si hay CDR nuevo, guardarlo
        if (statusResult.cdr && !doc.greenter_cdr) {
          await this.saveCDR(salesDocId, statusResult.cdr)
        }
      }

      return statusResult
    } catch (error: any) {
      console.error('Error checking SUNAT status:', error)
      return {
        success: false,
        status: 'ERROR',
        error: error.message || 'Error al consultar estado en SUNAT'
      }
    }
  }

  /**
   * Procesar documento completo: generar XML y enviar a SUNAT
   */
  static async processElectronicDocument(
    companyId: string,
    salesDocId: string
  ): Promise<SunatSubmissionResult> {
    try {
      // Paso 1: Generar XML
      const xmlResult = await this.generateInvoiceXML(companyId, salesDocId)
      if (!xmlResult.success) {
        return {
          success: false,
          status: 'ERROR',
          error: xmlResult.error
        }
      }

      // Paso 2: Enviar a SUNAT
      const submissionResult = await this.submitToSunat(companyId, salesDocId)
      return submissionResult
    } catch (error: any) {
      console.error('Error processing electronic document:', error)
      return {
        success: false,
        status: 'ERROR',
        error: error.message || 'Error al procesar documento electrónico'
      }
    }
  }

  /**
   * Reintentar envío de documento con configuración de reintentos
   */
  static async retrySubmission(
    companyId: string,
    salesDocId: string,
    retryConfig: RetryConfig = {
      max_attempts: 3,
      delay_seconds: 30,
      backoff_multiplier: 2
    }
  ): Promise<SunatSubmissionResult> {
    let lastError = ''

    for (let attempt = 1; attempt <= retryConfig.max_attempts; attempt++) {
      try {
        console.log(`Intento ${attempt}/${retryConfig.max_attempts} para documento ${salesDocId}`)

        const result = await this.submitToSunat(companyId, salesDocId)

        if (result.success) {
          return result
        }

        lastError = result.error || 'Error desconocido'

        // Si no es el último intento, esperar antes del siguiente
        if (attempt < retryConfig.max_attempts) {
          const delay = retryConfig.delay_seconds * Math.pow(retryConfig.backoff_multiplier, attempt - 1)
          await new Promise(resolve => setTimeout(resolve, delay * 1000))
        }
      } catch (error: any) {
        lastError = error.message
        console.error(`Error en intento ${attempt}:`, error)
      }
    }

    return {
      success: false,
      status: 'ERROR',
      error: `Falló después de ${retryConfig.max_attempts} intentos. Último error: ${lastError}`
    }
  }

  // ========================================
  // HELPER METHODS FOR DATA RETRIEVAL
  // ========================================

  /**
   * Obtener datos del documento de venta para generar XML
   */
  private static async getInvoiceDataForXML(
    companyId: string,
    salesDocId: string
  ): Promise<GreenterInvoiceData | null> {
    try {
      const { data, error } = await supabase
        .from('sales_docs')
        .select(`
          *,
          companies!inner(ruc, legal_name, trade_name, address, ubigeo_code),
          parties!customer_id(doc_type, doc_number, fullname, address, email),
          sales_doc_items(
            description,
            unit_code,
            quantity,
            unit_price,
            discount_pct,
            igv_affectation,
            igv_amount,
            total_line
          )
        `)
        .eq('id', salesDocId)
        .eq('company_id', companyId)
        .single()

      if (error || !data) {
        console.error('Error fetching invoice data:', error)
        return null
      }

      // Calcular totales
      const items = data.sales_doc_items || []
      const totals = this.calculateDocumentTotals(items)

      return {
        company: {
          ruc: data.companies.ruc,
          legal_name: data.companies.legal_name,
          trade_name: data.companies.trade_name,
          address: data.companies.address,
          ubigeo_code: data.companies.ubigeo_code
        },
        customer: {
          doc_type: data.parties.doc_type,
          doc_number: data.parties.doc_number,
          fullname: data.parties.fullname,
          address: data.parties.address,
          email: data.parties.email
        },
        document: {
          doc_type: data.doc_type,
          series: data.series,
          number: data.number,
          issue_date: data.issue_date,
          currency_code: data.currency_code,
          exchange_rate: data.exchange_rate
        },
        items: items.map(item => ({
          description: item.description || '',
          unit_code: item.unit_code,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_pct: item.discount_pct || 0,
          igv_affectation: item.igv_affectation || '10',
          igv_amount: item.igv_amount || 0,
          total_line: item.total_line
        })),
        totals
      }
    } catch (error) {
      console.error('Error in getInvoiceDataForXML:', error)
      return null
    }
  }

  /**
   * Obtener documento de venta por ID
   */
  private static async getSalesDocumentById(salesDocId: string): Promise<Tables<'sales_docs'> | null> {
    try {
      const { data, error } = await supabase
        .from('sales_docs')
        .select('*')
        .eq('id', salesDocId)
        .single()

      if (error) {
        console.error('Error fetching sales document:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getSalesDocumentById:', error)
      return null
    }
  }

  /**
   * Obtener configuración de facturación electrónica de la empresa
   */
  private static async getCompanyBillingConfig(companyId: string): Promise<ElectronicBillingStatus & {
    sol_user?: string
    cert_path?: string
    production?: boolean
  }> {
    try {
      const status = await this.getBillingStatus(companyId)

      if (!status) {
        return {
          has_config: false,
          production_mode: false,
          sol_user_configured: false,
          cert_configured: false,
          api_configured: false
        }
      }

      // Obtener datos adicionales de configuración
      const { data: company, error } = await supabase
        .from('companies')
        .select('sol_user, cert_path, production')
        .eq('id', companyId)
        .single()

      if (error) {
        console.error('Error fetching company config:', error)
        return status
      }

      return {
        ...status,
        sol_user: company.sol_user,
        cert_path: company.cert_path,
        production: company.production
      }
    } catch (error) {
      console.error('Error in getCompanyBillingConfig:', error)
      return {
        has_config: false,
        production_mode: false,
        sol_user_configured: false,
        cert_configured: false,
        api_configured: false
      }
    }
  }

  /**
   * Calcular totales del documento según reglas SUNAT
   */
  private static calculateDocumentTotals(items: any[]): {
    total_ope_gravadas: number
    total_ope_exoneradas: number
    total_ope_inafectas: number
    total_igv: number
    total_descuentos: number
    total: number
  } {
    let totalOpeGravadas = 0
    let totalOpeExoneradas = 0
    let totalOpeInafectas = 0
    let totalIgv = 0
    let totalDescuentos = 0

    for (const item of items) {
      const lineTotal = item.total_line || 0
      const igvAmount = item.igv_amount || 0
      const discountAmount = (item.quantity * item.unit_price * (item.discount_pct || 0)) / 100

      totalDescuentos += discountAmount

      // Clasificar por tipo de afectación IGV
      if (item.igv_affectation === '10') {
        totalOpeGravadas += lineTotal
        totalIgv += igvAmount
      } else if (item.igv_affectation === '20') {
        totalOpeExoneradas += lineTotal
      } else {
        totalOpeInafectas += lineTotal
      }
    }

    const total = totalOpeGravadas + totalOpeExoneradas + totalOpeInafectas + totalIgv

    return {
      total_ope_gravadas: totalOpeGravadas,
      total_ope_exoneradas: totalOpeExoneradas,
      total_ope_inafectas: totalOpeInafectas,
      total_igv: totalIgv,
      total_descuentos: totalDescuentos,
      total
    }
  }

  // ========================================
  // GREENTER INTEGRATION METHODS
  // ========================================

  /**
   * Llamar a Greenter para generar XML (simulado por ahora)
   */
  private static async callGreenterXMLGeneration(
    invoiceData: GreenterInvoiceData,
    config: any
  ): Promise<{ success: boolean; xml?: Uint8Array; hash?: string; error?: string }> {
    try {
      // En un entorno real, aquí se llamaría a la librería Greenter
      // Por ahora, simulamos la generación del XML

      console.log('Generating XML with Greenter for:', {
        company: invoiceData.company.ruc,
        document: `${invoiceData.document.series}-${invoiceData.document.number}`,
        environment: config.production ? 'PRODUCTION' : 'BETA'
      })

      // Simular tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Generar XML simulado
      const xmlContent = this.generateSimulatedXML(invoiceData)
      const xmlBytes = new TextEncoder().encode(xmlContent)

      // Generar hash simulado
      const hash = await this.generateXMLHash(xmlBytes)

      return {
        success: true,
        xml: xmlBytes,
        hash
      }
    } catch (error: any) {
      console.error('Error in Greenter XML generation:', error)
      return {
        success: false,
        error: error.message || 'Error al generar XML con Greenter'
      }
    }
  }

  /**
   * Llamar a Greenter para enviar a SUNAT (simulado por ahora)
   */
  private static async callGreenterSubmission(
    doc: Tables<'sales_docs'>,
    config: any
  ): Promise<SunatSubmissionResult> {
    try {
      console.log('Submitting to SUNAT with Greenter:', {
        document: `${doc.series}-${doc.number}`,
        environment: config.production ? 'PRODUCTION' : 'BETA'
      })

      // Simular tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Simular respuesta de SUNAT
      const isSuccess = Math.random() > 0.1 // 90% de éxito simulado

      if (isSuccess) {
        const ticket = `T${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const cdrContent = this.generateSimulatedCDR(doc)
        const cdrBytes = new TextEncoder().encode(cdrContent)

        return {
          success: true,
          status: 'ACCEPTED',
          ticket,
          cdr: cdrBytes,
          observations: []
        }
      } else {
        return {
          success: false,
          status: 'REJECTED',
          error: 'Documento rechazado por SUNAT (simulado)',
          observations: ['Error de validación simulado']
        }
      }
    } catch (error: any) {
      console.error('Error in Greenter submission:', error)
      return {
        success: false,
        status: 'ERROR',
        error: error.message || 'Error al enviar con Greenter'
      }
    }
  }

  /**
   * Consultar estado en SUNAT usando ticket (simulado por ahora)
   */
  private static async callGreenterStatusCheck(
    ticket: string,
    config: any
  ): Promise<SunatSubmissionResult> {
    try {
      console.log('Checking SUNAT status with Greenter:', {
        ticket,
        environment: config.production ? 'PRODUCTION' : 'BETA'
      })

      // Simular tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Simular respuesta de consulta
      const statuses: ElectronicDocumentStatus[] = ['ACCEPTED', 'PENDING', 'REJECTED']
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]

      return {
        success: true,
        status: randomStatus,
        ticket,
        observations: randomStatus === 'REJECTED' ? ['Documento rechazado en consulta'] : []
      }
    } catch (error: any) {
      console.error('Error in Greenter status check:', error)
      return {
        success: false,
        status: 'ERROR',
        error: error.message || 'Error al consultar estado con Greenter'
      }
    }
  }

  // ========================================
  // DATABASE UPDATE METHODS
  // ========================================

  /**
   * Actualizar estado del documento electrónico
   */
  private static async updateDocumentStatus(
    salesDocId: string,
    status: ElectronicDocumentStatus,
    ticket?: string,
    errorMessage?: string,
    observations?: string[]
  ): Promise<void> {
    try {
      const updates: any = {
        greenter_status: status,
        updated_at: new Date().toISOString()
      }

      if (ticket) updates.greenter_ticket = ticket
      if (errorMessage) updates.error_message = errorMessage
      if (observations) updates.observations = observations

      const { error } = await supabase
        .from('sales_docs')
        .update(updates)
        .eq('id', salesDocId)

      if (error) {
        console.error('Error updating document status:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in updateDocumentStatus:', error)
      throw error
    }
  }

  /**
   * Guardar XML generado en la base de datos
   */
  private static async saveGeneratedXML(
    salesDocId: string,
    xml: Uint8Array,
    hash: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('sales_docs')
        .update({
          greenter_xml: xml,
          greenter_hash: hash,
          updated_at: new Date().toISOString()
        })
        .eq('id', salesDocId)

      if (error) {
        console.error('Error saving XML:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in saveGeneratedXML:', error)
      throw error
    }
  }

  /**
   * Guardar CDR en la base de datos
   */
  private static async saveCDR(salesDocId: string, cdr: Uint8Array): Promise<void> {
    try {
      const { error } = await supabase
        .from('sales_docs')
        .update({
          greenter_cdr: cdr,
          updated_at: new Date().toISOString()
        })
        .eq('id', salesDocId)

      if (error) {
        console.error('Error saving CDR:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in saveCDR:', error)
      throw error
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Generar XML simulado para pruebas
   */
  private static generateSimulatedXML(invoiceData: GreenterInvoiceData): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <cbc:ID>${invoiceData.document.series}-${invoiceData.document.number}</cbc:ID>
  <cbc:IssueDate>${invoiceData.document.issue_date}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>${invoiceData.document.doc_type}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${invoiceData.document.currency_code}</cbc:DocumentCurrencyCode>

  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="6">${invoiceData.company.ruc}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${invoiceData.company.legal_name}</cbc:Name>
      </cac:PartyName>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="${invoiceData.customer.doc_type}">${invoiceData.customer.doc_number}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${invoiceData.customer.fullname}</cbc:Name>
      </cac:PartyName>
    </cac:Party>
  </cac:AccountingCustomerParty>

  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${invoiceData.document.currency_code}">${invoiceData.totals.total_ope_gravadas}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${invoiceData.document.currency_code}">${invoiceData.totals.total_ope_gravadas}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${invoiceData.document.currency_code}">${invoiceData.totals.total}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${invoiceData.document.currency_code}">${invoiceData.totals.total}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`
  }

  /**
   * Generar CDR simulado para pruebas
   */
  private static generateSimulatedCDR(doc: Tables<'sales_docs'>): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<ApplicationResponse xmlns="urn:oasis:names:specification:ubl:schema:xsd:ApplicationResponse-2">
  <cbc:ResponseDate>${new Date().toISOString().split('T')[0]}</cbc:ResponseDate>
  <cbc:ResponseTime>${new Date().toISOString().split('T')[1].split('.')[0]}</cbc:ResponseTime>
  <cac:DocumentResponse>
    <cac:Response>
      <cbc:ResponseCode>0</cbc:ResponseCode>
      <cbc:Description>La Factura numero ${doc.series}-${doc.number}, ha sido aceptada</cbc:Description>
    </cac:Response>
    <cac:DocumentReference>
      <cbc:ID>${doc.series}-${doc.number}</cbc:ID>
    </cac:DocumentReference>
  </cac:DocumentResponse>
</ApplicationResponse>`
  }

  /**
   * Generar hash del XML
   */
  private static async generateXMLHash(xmlBytes: Uint8Array): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', xmlBytes)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // ========================================
  // DOCUMENT MANAGEMENT METHODS
  // ========================================

  /**
   * Obtener lista de documentos electrónicos con estado
   */
  static async getElectronicDocuments(
    companyId: string,
    filters: {
      dateFrom?: string
      dateTo?: string
      status?: ElectronicDocumentStatus
      docType?: string
    } = {}
  ): Promise<ElectronicDocumentInfo[]> {
    try {
      let query = supabase
        .from('sales_docs')
        .select(`
          id,
          doc_type,
          series,
          number,
          issue_date,
          total,
          greenter_status,
          greenter_ticket,
          greenter_xml,
          greenter_cdr,
          error_message,
          observations,
          created_at,
          updated_at,
          parties!customer_id(fullname)
        `)
        .eq('company_id', companyId)

      if (filters.dateFrom) {
        query = query.gte('issue_date', filters.dateFrom)
      }

      if (filters.dateTo) {
        query = query.lte('issue_date', filters.dateTo)
      }

      if (filters.status) {
        query = query.eq('greenter_status', filters.status)
      }

      if (filters.docType) {
        query = query.eq('doc_type', filters.docType)
      }

      const { data, error } = await query
        .order('issue_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map((doc: any) => ({
        id: doc.id,
        doc_type: doc.doc_type,
        series: doc.series,
        number: doc.number,
        issue_date: doc.issue_date,
        customer_name: doc.parties?.fullname || '',
        total: doc.total,
        status: (doc.greenter_status as ElectronicDocumentStatus) || 'DRAFT',
        greenter_ticket: doc.greenter_ticket,
        has_xml: !!doc.greenter_xml,
        has_cdr: !!doc.greenter_cdr,
        error_message: doc.error_message,
        observations: doc.observations,
        created_at: doc.created_at,
        updated_at: doc.updated_at
      }))
    } catch (error) {
      console.error('Error getting electronic documents:', error)
      return []
    }
  }

  /**
   * Obtener estadísticas de documentos electrónicos
   */
  static async getElectronicDocumentStats(companyId: string): Promise<{
    total: number
    by_status: Record<ElectronicDocumentStatus, number>
    pending_submission: number
    errors: number
  }> {
    try {
      const { data, error } = await supabase
        .from('sales_docs')
        .select('greenter_status')
        .eq('company_id', companyId)

      if (error) throw error

      const stats = {
        total: data.length,
        by_status: {} as Record<ElectronicDocumentStatus, number>,
        pending_submission: 0,
        errors: 0
      }

      // Inicializar contadores
      const statuses: ElectronicDocumentStatus[] = [
        'DRAFT', 'GENERATING', 'PENDING', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'ERROR', 'CANCELLED'
      ]

      statuses.forEach(status => {
        stats.by_status[status] = 0
      })

      // Contar por estado
      data.forEach((doc: any) => {
        const status = (doc.greenter_status as ElectronicDocumentStatus) || 'DRAFT'
        stats.by_status[status]++

        if (status === 'PENDING' || status === 'GENERATING') {
          stats.pending_submission++
        }

        if (status === 'ERROR' || status === 'REJECTED') {
          stats.errors++
        }
      })

      return stats
    } catch (error) {
      console.error('Error getting electronic document stats:', error)
      return {
        total: 0,
        by_status: {} as Record<ElectronicDocumentStatus, number>,
        pending_submission: 0,
        errors: 0
      }
    }
  }

  /**
   * Obtener estado de configuración de facturación electrónica
   */
  static async getBillingStatus(companyId: string): Promise<ElectronicBillingStatus | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_electronic_billing_status', { p_company_id: companyId })
        .single()

      if (error) {
        console.error('Error getting billing status:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in getBillingStatus:', error)
      return null
    }
  }

  /**
   * Configurar facturación electrónica para una empresa
   */
  static async configureElectronicBilling(
    companyId: string,
    config: ElectronicBillingConfig
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validar configuración
      if (!config.sol_user?.trim()) {
        throw new Error('Usuario SOL es requerido')
      }

      if (!config.cert_path?.trim()) {
        throw new Error('Certificado digital es requerido')
      }

      const { error } = await supabase
        .from('companies')
        .update({
          sol_user: config.sol_user,
          sol_pass: config.sol_pass, // Se almacena encriptado en el trigger
          cert_path: config.cert_path,
          client_id: config.client_id,
          client_secret: config.client_secret,
          production: config.production
        })
        .eq('id', companyId)

      if (error) {
        console.error('Error configuring electronic billing:', error)
        throw error
      }

      return { success: true }
    } catch (error: any) {
      console.error('Error in configureElectronicBilling:', error)
      return {
        success: false,
        error: error.message || 'Error al configurar facturación electrónica'
      }
    }
  }

  /**
   * Subir certificado digital al storage
   */
  static async uploadCertificate(
    companyId: string,
    file: File
  ): Promise<CertificateUploadResult> {
    try {
      // Validar tipo de archivo
      const allowedTypes = ['.cer', '.p12', '.pfx']
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

      if (!allowedTypes.includes(fileExtension)) {
        throw new Error('Tipo de archivo no válido. Se permiten: .cer, .p12, .pfx')
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('El archivo no puede superar los 5MB')
      }

      // Generar nombre único para el archivo
      const timestamp = Date.now()
      const fileName = `certificates/${companyId}/${timestamp}_${file.name}`

      // Subir archivo al storage
      const { data, error } = await supabase.storage
        .from('company-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Error uploading certificate:', error)
        throw error
      }

      // Obtener URL pública del archivo
      const { data: urlData } = supabase.storage
        .from('company-documents')
        .getPublicUrl(data.path)

      return {
        path: data.path,
        url: urlData.publicUrl
      }
    } catch (error: any) {
      console.error('Error in uploadCertificate:', error)
      return {
        path: '',
        url: '',
        error: error.message || 'Error al subir certificado'
      }
    }
  }

  /**
   * Eliminar certificado del storage
   */
  static async removeCertificate(certPath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from('company-documents')
        .remove([certPath])

      if (error) {
        console.error('Error removing certificate:', error)
        throw error
      }

      return true
    } catch (error) {
      console.error('Error in removeCertificate:', error)
      return false
    }
  }

  /**
   * Validar configuración de facturación electrónica
   */
  static async validateConfiguration(companyId: string): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }> {
    try {
      const errors: string[] = []
      const warnings: string[] = []

      // Obtener datos de la empresa
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('ruc, sol_user, cert_path, production')
        .eq('id', companyId)
        .single()

      if (companyError || !company) {
        errors.push('No se pudo obtener datos de la empresa')
        return { valid: false, errors, warnings }
      }

      // Validar RUC
      if (!company.ruc || company.ruc.length !== 11) {
        errors.push('RUC debe tener 11 dígitos')
      }

      // Validar usuario SOL
      if (!company.sol_user?.trim()) {
        errors.push('Usuario SOL es requerido')
      } else if (!company.sol_user.includes(company.ruc)) {
        warnings.push('El usuario SOL debería contener el RUC de la empresa')
      }

      // Validar certificado
      if (!company.cert_path?.trim()) {
        errors.push('Certificado digital es requerido')
      }

      // Validar ambiente de producción
      if (company.production) {
        warnings.push('Configurado para ambiente de PRODUCCIÓN. Verificar que todos los datos sean correctos.')
      } else {
        warnings.push('Configurado para ambiente de PRUEBAS/BETA.')
      }

      const valid = errors.length === 0

      return { valid, errors, warnings }
    } catch (error) {
      console.error('Error in validateConfiguration:', error)
      return {
        valid: false,
        errors: ['Error al validar configuración'],
        warnings: []
      }
    }
  }

  /**
   * Cambiar ambiente de facturación (producción/pruebas)
   */
  static async switchEnvironment(
    companyId: string,
    production: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ production })
        .eq('id', companyId)

      if (error) {
        console.error('Error switching environment:', error)
        throw error
      }

      return { success: true }
    } catch (error: any) {
      console.error('Error in switchEnvironment:', error)
      return {
        success: false,
        error: error.message || 'Error al cambiar ambiente de facturación'
      }
    }
  }

  /**
   * Verificar conexión con SUNAT (simulado)
   */
  static async testConnection(companyId: string): Promise<{
    success: boolean
    message: string
    environment: 'production' | 'beta'
  }> {
    try {
      // Obtener configuración
      const status = await this.getBillingStatus(companyId)

      if (!status?.has_config) {
        return {
          success: false,
          message: 'Configuración de facturación electrónica incompleta',
          environment: 'beta'
        }
      }

      // En un entorno real, aquí se haría una prueba de conexión real con SUNAT
      // Por ahora, simulamos la validación
      const environment = status.production_mode ? 'production' : 'beta'

      return {
        success: true,
        message: `Conexión exitosa con SUNAT (${environment.toUpperCase()})`,
        environment
      }
    } catch (error: any) {
      console.error('Error in testConnection:', error)
      return {
        success: false,
        message: error.message || 'Error al probar conexión con SUNAT',
        environment: 'beta'
      }
    }
  }
}

export default ElectronicBillingService
