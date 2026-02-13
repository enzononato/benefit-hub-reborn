export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alert_comments: {
        Row: {
          alert_id: string
          content: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          alert_id: string
          content: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          alert_id?: string
          content?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_comments_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          asset_id: string
          created_at: string
          description: string | null
          id: string
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          status: Database["public"]["Enums"]["alert_status"]
          title: string
          unit_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          asset_id: string
          created_at?: string
          description?: string | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          status?: Database["public"]["Enums"]["alert_status"]
          title: string
          unit_id: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          asset_id?: string
          created_at?: string
          description?: string | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          status?: Database["public"]["Enums"]["alert_status"]
          title?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_status_history: {
        Row: {
          asset_id: string
          health: number | null
          id: string
          notes: string | null
          recorded_at: string
          status: Database["public"]["Enums"]["asset_status"]
        }
        Insert: {
          asset_id: string
          health?: number | null
          id?: string
          notes?: string | null
          recorded_at?: string
          status: Database["public"]["Enums"]["asset_status"]
        }
        Update: {
          asset_id?: string
          health?: number | null
          id?: string
          notes?: string | null
          recorded_at?: string
          status?: Database["public"]["Enums"]["asset_status"]
        }
        Relationships: [
          {
            foreignKeyName: "asset_status_history_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          created_at: string
          description: string | null
          health: number
          id: string
          ip_address: string | null
          last_check: string | null
          last_communication: string | null
          location: string | null
          name: string
          sla_target: number | null
          status: Database["public"]["Enums"]["asset_status"]
          type: Database["public"]["Enums"]["asset_type"]
          unit_id: string
          updated_at: string
          zabbix_host_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          health?: number
          id?: string
          ip_address?: string | null
          last_check?: string | null
          last_communication?: string | null
          location?: string | null
          name: string
          sla_target?: number | null
          status?: Database["public"]["Enums"]["asset_status"]
          type: Database["public"]["Enums"]["asset_type"]
          unit_id: string
          updated_at?: string
          zabbix_host_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          health?: number
          id?: string
          ip_address?: string | null
          last_check?: string | null
          last_communication?: string | null
          location?: string | null
          name?: string
          sla_target?: number | null
          status?: Database["public"]["Enums"]["asset_status"]
          type?: Database["public"]["Enums"]["asset_type"]
          unit_id?: string
          updated_at?: string
          zabbix_host_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          company_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          company_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      benefit_requests: {
        Row: {
          account_id: number | null
          approved_value: number | null
          attachment_file_name: string | null
          attachment_url: string | null
          benefit_type: Database["public"]["Enums"]["benefit_type"]
          closed_at: string | null
          closed_by: string | null
          closing_message: string | null
          conversation_id: number | null
          created_at: string
          details: string | null
          hr_notes: string | null
          hr_reviewed_at: string | null
          hr_reviewed_by: string | null
          hr_status: string | null
          id: string
          paid_installments: number | null
          pdf_file_name: string | null
          pdf_url: string | null
          protocol: string
          rejection_reason: string | null
          requested_value: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["benefit_status"]
          total_installments: number | null
          updated_at: string
          user_id: string
          whatsapp_jid: string | null
        }
        Insert: {
          account_id?: number | null
          approved_value?: number | null
          attachment_file_name?: string | null
          attachment_url?: string | null
          benefit_type: Database["public"]["Enums"]["benefit_type"]
          closed_at?: string | null
          closed_by?: string | null
          closing_message?: string | null
          conversation_id?: number | null
          created_at?: string
          details?: string | null
          hr_notes?: string | null
          hr_reviewed_at?: string | null
          hr_reviewed_by?: string | null
          hr_status?: string | null
          id?: string
          paid_installments?: number | null
          pdf_file_name?: string | null
          pdf_url?: string | null
          protocol: string
          rejection_reason?: string | null
          requested_value?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["benefit_status"]
          total_installments?: number | null
          updated_at?: string
          user_id: string
          whatsapp_jid?: string | null
        }
        Update: {
          account_id?: number | null
          approved_value?: number | null
          attachment_file_name?: string | null
          attachment_url?: string | null
          benefit_type?: Database["public"]["Enums"]["benefit_type"]
          closed_at?: string | null
          closed_by?: string | null
          closing_message?: string | null
          conversation_id?: number | null
          created_at?: string
          details?: string | null
          hr_notes?: string | null
          hr_reviewed_at?: string | null
          hr_reviewed_by?: string | null
          hr_status?: string | null
          id?: string
          paid_installments?: number | null
          pdf_file_name?: string | null
          pdf_url?: string | null
          protocol?: string
          rejection_reason?: string | null
          requested_value?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["benefit_status"]
          total_installments?: number | null
          updated_at?: string
          user_id?: string
          whatsapp_jid?: string | null
        }
        Relationships: []
      }
      collaborator_documents: {
        Row: {
          created_at: string
          document_name: string
          document_type: string
          expiration_date: string | null
          file_name: string
          file_url: string
          id: string
          notes: string | null
          profile_id: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_name: string
          document_type: string
          expiration_date?: string | null
          file_name: string
          file_url: string
          id?: string
          notes?: string | null
          profile_id: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_name?: string
          document_type?: string
          expiration_date?: string | null
          file_name?: string
          file_url?: string
          id?: string
          notes?: string | null
          profile_id?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaborator_documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          cnpj: string
          created_at: string | null
          email: string | null
          endereco: Json | null
          id: string
          limite_transacoes_mes: number | null
          logo_url: string | null
          nome_fantasia: string | null
          plano: string | null
          razao_social: string
          status: string | null
          telefone: string | null
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          cnpj: string
          created_at?: string | null
          email?: string | null
          endereco?: Json | null
          id?: string
          limite_transacoes_mes?: number | null
          logo_url?: string | null
          nome_fantasia?: string | null
          plano?: string | null
          razao_social: string
          status?: string | null
          telefone?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          cnpj?: string
          created_at?: string | null
          email?: string | null
          endereco?: Json | null
          id?: string
          limite_transacoes_mes?: number | null
          logo_url?: string | null
          nome_fantasia?: string | null
          plano?: string | null
          razao_social?: string
          status?: string | null
          telefone?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      company_pix_settings: {
        Row: {
          certificate_url: string | null
          client_id_encrypted: string | null
          client_secret_encrypted: string | null
          company_id: string
          created_at: string | null
          environment: string | null
          id: string
          is_active: boolean | null
          pix_key: string | null
          pix_key_type: string | null
          provider: string
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          certificate_url?: string | null
          client_id_encrypted?: string | null
          client_secret_encrypted?: string | null
          company_id: string
          created_at?: string | null
          environment?: string | null
          id?: string
          is_active?: boolean | null
          pix_key?: string | null
          pix_key_type?: string | null
          provider?: string
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          certificate_url?: string | null
          client_id_encrypted?: string | null
          client_secret_encrypted?: string | null
          company_id?: string
          created_at?: string | null
          environment?: string | null
          id?: string
          is_active?: boolean | null
          pix_key?: string | null
          pix_key_type?: string | null
          provider?: string
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_pix_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_limits: {
        Row: {
          benefit_type: string | null
          created_at: string
          id: string
          limit_amount: number
          partnership_id: string | null
          period_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          benefit_type?: string | null
          created_at?: string
          id?: string
          limit_amount?: number
          partnership_id?: string | null
          period_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          benefit_type?: string | null
          created_at?: string
          id?: string
          limit_amount?: number
          partnership_id?: string | null
          period_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_limits_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "partnerships"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          company_id: string
          created_at: string | null
          email: string | null
          endereco: Json | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          email?: string | null
          endereco?: Json | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          email?: string | null
          endereco?: Json | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_orders: {
        Row: {
          amount_cents: number
          assigned_at: string | null
          charge_id: string | null
          company_id: string
          created_at: string | null
          customer_id: string | null
          delivered_at: string | null
          delivery_address: Json | null
          description: string | null
          driver_id: string | null
          id: string
          notes: string | null
          paid_at: string | null
          payment_status: string | null
          reference_code: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount_cents: number
          assigned_at?: string | null
          charge_id?: string | null
          company_id: string
          created_at?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          delivery_address?: Json | null
          description?: string | null
          driver_id?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_status?: string | null
          reference_code?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_cents?: number
          assigned_at?: string | null
          charge_id?: string | null
          company_id?: string
          created_at?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          delivery_address?: Json | null
          description?: string | null
          driver_id?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_status?: string | null
          reference_code?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_orders_charge_id_fkey"
            columns: ["charge_id"]
            isOneToOne: false
            referencedRelation: "pix_charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_commissions: {
        Row: {
          amount_cents: number
          charge_id: string | null
          created_at: string | null
          driver_id: string
          id: string
          order_id: string | null
          paid_at: string | null
          status: string | null
        }
        Insert: {
          amount_cents: number
          charge_id?: string | null
          created_at?: string | null
          driver_id: string
          id?: string
          order_id?: string | null
          paid_at?: string | null
          status?: string | null
        }
        Update: {
          amount_cents?: number
          charge_id?: string | null
          created_at?: string | null
          driver_id?: string
          id?: string
          order_id?: string | null
          paid_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_commissions_charge_id_fkey"
            columns: ["charge_id"]
            isOneToOne: false
            referencedRelation: "pix_charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_commissions_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "delivery_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          codigo_promax: string | null
          comissao_tipo: string | null
          comissao_valor: number | null
          company_id: string
          cpf: string | null
          created_at: string | null
          email: string | null
          foto_url: string | null
          id: string
          mapa_atual: string | null
          mapa_data: string | null
          nome: string
          placa_veiculo: string | null
          status: string | null
          telefone: string | null
          tipo_veiculo: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          codigo_promax?: string | null
          comissao_tipo?: string | null
          comissao_valor?: number | null
          company_id: string
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          foto_url?: string | null
          id?: string
          mapa_atual?: string | null
          mapa_data?: string | null
          nome: string
          placa_veiculo?: string | null
          status?: string | null
          telefone?: string | null
          tipo_veiculo?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          codigo_promax?: string | null
          comissao_tipo?: string | null
          comissao_valor?: number | null
          company_id?: string
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          foto_url?: string | null
          id?: string
          mapa_atual?: string | null
          mapa_data?: string | null
          nome?: string
          placa_veiculo?: string | null
          status?: string | null
          telefone?: string | null
          tipo_veiculo?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drivers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      integration_settings: {
        Row: {
          config: Json | null
          connection_status: string | null
          created_at: string | null
          created_by: string | null
          id: string
          integration_type: string
          is_enabled: boolean | null
          last_sync: string | null
          room_id: string | null
          server_url: string | null
          sync_status: string | null
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          connection_status?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          integration_type: string
          is_enabled?: boolean | null
          last_sync?: string | null
          room_id?: string | null
          server_url?: string | null
          sync_status?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          connection_status?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          integration_type?: string
          is_enabled?: boolean | null
          last_sync?: string | null
          room_id?: string | null
          server_url?: string | null
          sync_status?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_settings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          brand: string | null
          created_at: string
          id: string
          model: string | null
          notes: string | null
          related_asset_id: string | null
          responsible_user: string | null
          sector: string | null
          serial_number: string | null
          status: Database["public"]["Enums"]["inventory_status"]
          type: Database["public"]["Enums"]["inventory_type"]
          unit_id: string
          updated_at: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          id?: string
          model?: string | null
          notes?: string | null
          related_asset_id?: string | null
          responsible_user?: string | null
          sector?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["inventory_status"]
          type: Database["public"]["Enums"]["inventory_type"]
          unit_id: string
          updated_at?: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          id?: string
          model?: string | null
          notes?: string | null
          related_asset_id?: string | null
          responsible_user?: string | null
          sector?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["inventory_status"]
          type?: Database["public"]["Enums"]["inventory_type"]
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_related_asset_id_fkey"
            columns: ["related_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      maintenance_schedules: {
        Row: {
          asset_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          scheduled_date: string
          started_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          asset_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          scheduled_date: string
          started_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          asset_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          scheduled_date?: string
          started_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_schedules_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      partnership_usage: {
        Row: {
          amount: number
          benefit_request_id: string | null
          created_at: string
          id: string
          notes: string | null
          partnership_id: string
          usage_date: string
          user_id: string
        }
        Insert: {
          amount: number
          benefit_request_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          partnership_id: string
          usage_date?: string
          user_id: string
        }
        Update: {
          amount?: number
          benefit_request_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          partnership_id?: string
          usage_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partnership_usage_benefit_request_id_fkey"
            columns: ["benefit_request_id"]
            isOneToOne: false
            referencedRelation: "benefit_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partnership_usage_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "partnerships"
            referencedColumns: ["id"]
          },
        ]
      }
      partnerships: {
        Row: {
          address: string | null
          city: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          state: string | null
          type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          state?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          state?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_receipts: {
        Row: {
          benefit_request_id: string
          file_name: string
          file_url: string
          id: string
          uploaded_at: string
        }
        Insert: {
          benefit_request_id: string
          file_name: string
          file_url: string
          id?: string
          uploaded_at?: string
        }
        Update: {
          benefit_request_id?: string
          file_name?: string
          file_url?: string
          id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_receipts_benefit_request_id_fkey"
            columns: ["benefit_request_id"]
            isOneToOne: false
            referencedRelation: "benefit_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      pix_charges: {
        Row: {
          amount_cents: number
          brcode: string | null
          created_at: string
          expires_at: string | null
          id: string
          order_id: string
          paid_at: string | null
          provider: string
          provider_charge_id: string | null
          qr_image_url: string | null
          status: string
          txid: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          brcode?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          order_id: string
          paid_at?: string | null
          provider?: string
          provider_charge_id?: string | null
          qr_image_url?: string | null
          status?: string
          txid: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          brcode?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          order_id?: string
          paid_at?: string | null
          provider?: string
          provider_charge_id?: string | null
          qr_image_url?: string | null
          status?: string
          txid?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pix_charges_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "pix_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pix_charges_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      pix_events: {
        Row: {
          event_type: string
          id: string
          payload: Json
          provider: string
          provider_charge_id: string | null
          received_at: string
          txid: string | null
          unit_id: string | null
        }
        Insert: {
          event_type: string
          id?: string
          payload: Json
          provider: string
          provider_charge_id?: string | null
          received_at?: string
          txid?: string | null
          unit_id?: string | null
        }
        Update: {
          event_type?: string
          id?: string
          payload?: Json
          provider?: string
          provider_charge_id?: string | null
          received_at?: string
          txid?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pix_events_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      pix_orders: {
        Row: {
          amount_cents: number
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          description: string | null
          driver_user_id: string | null
          id: string
          paid_at: string | null
          status: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          driver_user_id?: string | null
          id: string
          paid_at?: string | null
          status?: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          driver_user_id?: string | null
          id?: string
          paid_at?: string | null
          status?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pix_orders_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          admission_date: string | null
          avatar_url: string | null
          birthday: string | null
          codigo_empregador: string | null
          codigo_empresa: string | null
          cpf: string | null
          created_at: string
          credit_limit: number | null
          departamento: string | null
          email: string
          full_name: string
          gender: string | null
          id: string
          phone: string | null
          position: string | null
          status: string
          unit_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admission_date?: string | null
          avatar_url?: string | null
          birthday?: string | null
          codigo_empregador?: string | null
          codigo_empresa?: string | null
          cpf?: string | null
          created_at?: string
          credit_limit?: number | null
          departamento?: string | null
          email: string
          full_name: string
          gender?: string | null
          id?: string
          phone?: string | null
          position?: string | null
          status?: string
          unit_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admission_date?: string | null
          avatar_url?: string | null
          birthday?: string | null
          codigo_empregador?: string | null
          codigo_empresa?: string | null
          cpf?: string | null
          created_at?: string
          credit_limit?: number | null
          departamento?: string | null
          email?: string
          full_name?: string
          gender?: string | null
          id?: string
          phone?: string | null
          position?: string | null
          status?: string
          unit_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      request_messages: {
        Row: {
          benefit_request_id: string
          created_at: string
          id: string
          message: string
          sender_id: string
          sender_name: string | null
          sent_via: string | null
        }
        Insert: {
          benefit_request_id: string
          created_at?: string
          id?: string
          message: string
          sender_id: string
          sender_name?: string | null
          sent_via?: string | null
        }
        Update: {
          benefit_request_id?: string
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          sender_name?: string | null
          sent_via?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_messages_benefit_request_id_fkey"
            columns: ["benefit_request_id"]
            isOneToOne: false
            referencedRelation: "benefit_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_configs: {
        Row: {
          benefit_type: string
          created_at: string
          green_hours: number
          id: string
          time_unit: string
          updated_at: string
          yellow_hours: number
        }
        Insert: {
          benefit_type: string
          created_at?: string
          green_hours?: number
          id?: string
          time_unit?: string
          updated_at?: string
          yellow_hours?: number
        }
        Update: {
          benefit_type?: string
          created_at?: string
          green_hours?: number
          id?: string
          time_unit?: string
          updated_at?: string
          yellow_hours?: number
        }
        Relationships: []
      }
      system_config: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      units: {
        Row: {
          city: string | null
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          state: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          state?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_module_permissions: {
        Row: {
          created_at: string | null
          id: string
          module: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          module: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          module?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_unit_access: {
        Row: {
          created_at: string
          id: string
          unit_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          unit_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          unit_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_unit_access_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_audit_log: {
        Args: {
          p_action: string
          p_company_id: string
          p_entity_id?: string
          p_entity_type?: string
          p_new_data?: Json
          p_old_data?: Json
        }
        Returns: string
      }
      create_request_from_bot: {
        Args: {
          p_account_id?: number
          p_benefit_text?: string
          p_conversation_id?: number
          p_cpf: string
          p_name?: string
          p_protocol?: string
          p_whatsapp_jid?: string
        }
        Returns: Json
      }
      create_system_log: {
        Args: {
          p_action: string
          p_details?: Json
          p_entity_id?: string
          p_entity_type?: string
          p_user_id?: string
        }
        Returns: string
      }
      get_my_unit_id: { Args: never; Returns: string }
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      get_user_unit_ids: { Args: { _user_id: string }; Returns: string[] }
      has_company_access: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_unit_access: {
        Args: { _unit_id: string; _user_id: string }
        Returns: boolean
      }
      is_admin_or_gestor: { Args: never; Returns: boolean }
      is_company_admin: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_same_unit: { Args: { _user_id: string }; Returns: boolean }
      promote_user_to_admin: {
        Args: { user_email: string }
        Returns: undefined
      }
    }
    Enums: {
      alert_severity: "critical" | "warning" | "info"
      alert_status: "active" | "acknowledged" | "resolved"
      app_role:
        | "admin"
        | "gestor"
        | "colaborador"
        | "agente_dp"
        | "rh"
        | "platform_admin"
        | "company_admin"
        | "company_finance"
        | "driver"
      asset_status: "operational" | "warning" | "critical" | "maintenance"
      asset_type:
        | "server"
        | "switch"
        | "link"
        | "radio"
        | "firewall"
        | "nvr"
        | "nobreak"
      benefit_status: "aberta" | "em_analise" | "aprovada" | "recusada"
      benefit_type:
        | "alteracao_ferias"
        | "aviso_folga_falta"
        | "atestado"
        | "contracheque"
        | "abono_horas"
        | "alteracao_horario"
        | "outros"
        | "operacao_domingo"
        | "relatorio_ponto"
        | "autoescola"
        | "farmacia"
        | "oficina"
        | "vale_gas"
        | "papelaria"
        | "otica"
        | "plano_odontologico"
        | "plano_saude"
        | "vale_transporte"
        | "relato_anomalia"
        | "listagem_funcionarios"
        | "listagem_aniversariantes"
        | "listagem_dependentes"
        | "listagem_pdcs"
        | "informacoes_diversas"
        | "plantao_duvidas"
      inventory_status: "active" | "maintenance" | "disposed"
      inventory_type:
        | "pc"
        | "monitor"
        | "printer"
        | "camera"
        | "phone"
        | "nobreak_inventory"
        | "access_switch"
        | "other"
        | "catraca"
        | "notebook"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      alert_severity: ["critical", "warning", "info"],
      alert_status: ["active", "acknowledged", "resolved"],
      app_role: [
        "admin",
        "gestor",
        "colaborador",
        "agente_dp",
        "rh",
        "platform_admin",
        "company_admin",
        "company_finance",
        "driver",
      ],
      asset_status: ["operational", "warning", "critical", "maintenance"],
      asset_type: [
        "server",
        "switch",
        "link",
        "radio",
        "firewall",
        "nvr",
        "nobreak",
      ],
      benefit_status: ["aberta", "em_analise", "aprovada", "recusada"],
      benefit_type: [
        "alteracao_ferias",
        "aviso_folga_falta",
        "atestado",
        "contracheque",
        "abono_horas",
        "alteracao_horario",
        "outros",
        "operacao_domingo",
        "relatorio_ponto",
        "autoescola",
        "farmacia",
        "oficina",
        "vale_gas",
        "papelaria",
        "otica",
        "plano_odontologico",
        "plano_saude",
        "vale_transporte",
        "relato_anomalia",
        "listagem_funcionarios",
        "listagem_aniversariantes",
        "listagem_dependentes",
        "listagem_pdcs",
        "informacoes_diversas",
        "plantao_duvidas",
      ],
      inventory_status: ["active", "maintenance", "disposed"],
      inventory_type: [
        "pc",
        "monitor",
        "printer",
        "camera",
        "phone",
        "nobreak_inventory",
        "access_switch",
        "other",
        "catraca",
        "notebook",
      ],
    },
  },
} as const
