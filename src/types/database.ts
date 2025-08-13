// Database type definitions for Supabase
// This file should be generated from your Supabase schema using the CLI:
// npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          ruc: string
          legal_name: string
          trade_name: string | null
          email: string | null
          phone: string | null
          address: string | null
          ubigeo_code: string | null
          currency_code: string
          valuation_method: 'PROMEDIO_MOVIL' | 'FIFO'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ruc: string
          legal_name: string
          trade_name?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          ubigeo_code?: string | null
          currency_code: string
          valuation_method: 'PROMEDIO_MOVIL' | 'FIFO'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ruc?: string
          legal_name?: string
          trade_name?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          ubigeo_code?: string | null
          currency_code?: string
          valuation_method?: 'PROMEDIO_MOVIL' | 'FIFO'
          created_at?: string
          updated_at?: string
        }
      }
      user_companies: {
        Row: {
          id: string
          user_id: string
          company_id: string
          role: string
          permissions: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_id: string
          role: string
          permissions?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_id?: string
          role?: string
          permissions?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          company_id: string
          sku: string
          barcode: string | null
          name: string
          description: string | null
          brand_id: string | null
          category_id: string | null
          unit_code: string
          width: number
          height: number
          length: number
          weight_kg: number
          volume_m3: number
          is_serialized: boolean
          is_batch_controlled: boolean
          min_stock: number
          max_stock: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          sku: string
          barcode?: string | null
          name: string
          description?: string | null
          brand_id?: string | null
          category_id?: string | null
          unit_code: string
          width: number
          height: number
          length: number
          weight_kg: number
          volume_m3: number
          is_serialized?: boolean
          is_batch_controlled?: boolean
          min_stock: number
          max_stock: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          sku?: string
          barcode?: string | null
          name?: string
          description?: string | null
          brand_id?: string | null
          category_id?: string | null
          unit_code?: string
          width?: number
          height?: number
          length?: number
          weight_kg?: number
          volume_m3?: number
          is_serialized?: boolean
          is_batch_controlled?: boolean
          min_stock?: number
          max_stock?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      parties: {
        Row: {
          id: string
          company_id: string
          is_customer: boolean
          is_supplier: boolean
          doc_type: string
          doc_number: string
          apellido_paterno: string | null
          apellido_materno: string | null
          nombres: string | null
          razon_social: string | null
          fullname: string
          email: string | null
          phone: string | null
          address: string | null
          ubigeo_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          is_customer: boolean
          is_supplier: boolean
          doc_type: string
          doc_number: string
          apellido_paterno?: string | null
          apellido_materno?: string | null
          nombres?: string | null
          razon_social?: string | null
          fullname: string
          email?: string | null
          phone?: string | null
          address?: string | null
          ubigeo_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          is_customer?: boolean
          is_supplier?: boolean
          doc_type?: string
          doc_number?: string
          apellido_paterno?: string | null
          apellido_materno?: string | null
          nombres?: string | null
          razon_social?: string | null
          fullname?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          ubigeo_code?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
