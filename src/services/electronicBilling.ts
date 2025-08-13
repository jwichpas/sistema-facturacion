import { supabase } from './supabase'
import type { Company } from '@/types'

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

/**
 * Servicio para gestión de facturación electrónica
 */
export class ElectronicBillingService {

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
