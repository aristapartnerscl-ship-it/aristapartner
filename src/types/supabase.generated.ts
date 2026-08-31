// -----------------------------------------------------------------------------
// Auto-generated Supabase types for the linked Arista Partners project.
// Do not edit manually. Regenerate with: npm run types:supabase
// -----------------------------------------------------------------------------

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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          action_path: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          message: string | null
          notification_type: string
          read_at: string | null
          recipient_id: string
          title: string
        }
        Insert: {
          action_path?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message?: string | null
          notification_type: string
          read_at?: string | null
          recipient_id: string
          title: string
        }
        Update: {
          action_path?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message?: string | null
          notification_type?: string
          read_at?: string | null
          recipient_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          is_active?: boolean
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      commercial_agreements: {
        Row: {
          agreement_code: string
          agreement_status: string
          archived_at: string | null
          archived_by: string | null
          attribution_end: string | null
          attribution_start: string | null
          commission_type: string | null
          commission_value: number | null
          compensation_model: string
          contact_id: string | null
          counterparty_type: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          id: string
          management_fee: number | null
          notes: string | null
          opportunity_id: string
          payer_type: string | null
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          agreement_code?: string
          agreement_status?: string
          archived_at?: string | null
          archived_by?: string | null
          attribution_end?: string | null
          attribution_start?: string | null
          commission_type?: string | null
          commission_value?: number | null
          compensation_model: string
          contact_id?: string | null
          counterparty_type?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          id?: string
          management_fee?: number | null
          notes?: string | null
          opportunity_id: string
          payer_type?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          agreement_code?: string
          agreement_status?: string
          archived_at?: string | null
          archived_by?: string | null
          attribution_end?: string | null
          attribution_start?: string | null
          commission_type?: string | null
          commission_value?: number | null
          compensation_model?: string
          contact_id?: string | null
          counterparty_type?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          id?: string
          management_fee?: number | null
          notes?: string | null
          opportunity_id?: string
          payer_type?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commercial_agreements_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_agreements_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_agreements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_agreements_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_agreements_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_proposal_documents: {
        Row: {
          document_type: string
          file_name: string
          generated_at: string
          generated_by: string
          id: string
          proposal_id: string
          version_id: string
        }
        Insert: {
          document_type?: string
          file_name: string
          generated_at?: string
          generated_by: string
          id?: string
          proposal_id: string
          version_id: string
        }
        Update: {
          document_type?: string
          file_name?: string
          generated_at?: string
          generated_by?: string
          id?: string
          proposal_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commercial_proposal_documents_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_proposal_documents_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "commercial_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_proposal_documents_version_fk"
            columns: ["version_id", "proposal_id"]
            isOneToOne: false
            referencedRelation: "commercial_proposal_versions"
            referencedColumns: ["id", "proposal_id"]
          },
        ]
      }
      commercial_proposal_versions: {
        Row: {
          client_notes: string | null
          created_at: string
          created_by: string
          currency: string | null
          description: string | null
          id: string
          proposal_id: string
          snapshot_data: Json
          subtotal: number
          tax_amount: number
          tax_percentage: number
          title: string
          total_amount: number
          valid_until: string | null
          version_number: number
        }
        Insert: {
          client_notes?: string | null
          created_at?: string
          created_by: string
          currency?: string | null
          description?: string | null
          id?: string
          proposal_id: string
          snapshot_data: Json
          subtotal: number
          tax_amount: number
          tax_percentage: number
          title: string
          total_amount: number
          valid_until?: string | null
          version_number: number
        }
        Update: {
          client_notes?: string | null
          created_at?: string
          created_by?: string
          currency?: string | null
          description?: string | null
          id?: string
          proposal_id?: string
          snapshot_data?: Json
          subtotal?: number
          tax_amount?: number
          tax_percentage?: number
          title?: string
          total_amount?: number
          valid_until?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "commercial_proposal_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_proposal_versions_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "commercial_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_proposals: {
        Row: {
          accepted_at: string | null
          archived_at: string | null
          archived_by: string | null
          client_notes: string | null
          created_at: string
          created_by: string
          currency: string | null
          description: string | null
          id: string
          internal_notes: string | null
          opportunity_id: string
          proposal_code: string
          rejected_at: string | null
          sent_at: string | null
          status: string
          subtotal: number
          tax_amount: number | null
          tax_percentage: number
          title: string
          total_amount: number | null
          updated_at: string
          valid_until: string | null
          viewed_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          archived_at?: string | null
          archived_by?: string | null
          client_notes?: string | null
          created_at?: string
          created_by: string
          currency?: string | null
          description?: string | null
          id?: string
          internal_notes?: string | null
          opportunity_id: string
          proposal_code?: string
          rejected_at?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_percentage?: number
          title: string
          total_amount?: number | null
          updated_at?: string
          valid_until?: string | null
          viewed_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          archived_at?: string | null
          archived_by?: string | null
          client_notes?: string | null
          created_at?: string
          created_by?: string
          currency?: string | null
          description?: string | null
          id?: string
          internal_notes?: string | null
          opportunity_id?: string
          proposal_code?: string
          rejected_at?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_percentage?: number
          title?: string
          total_amount?: number | null
          updated_at?: string
          valid_until?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commercial_proposals_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_proposals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_proposals_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          city: string | null
          company_name: string | null
          contact_type: string
          country: string | null
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string | null
          id: string
          notes: string | null
          phone: string | null
          position: string | null
          region: string | null
          social_media: string | null
          source: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          city?: string | null
          company_name?: string | null
          contact_type: string
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          region?: string | null
          social_media?: string | null
          source?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          city?: string | null
          company_name?: string | null
          contact_type?: string
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          region?: string | null
          social_media?: string | null
          source?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          consent_contact: boolean
          consent_marketing: boolean
          converted_entity_id: string | null
          converted_entity_type: string | null
          id: string
          payload: Json
          privacy_version: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_ip_hash: string | null
          status: string
          submission_type: string
          submitted_at: string
          user_agent: string | null
        }
        Insert: {
          consent_contact?: boolean
          consent_marketing?: boolean
          converted_entity_id?: string | null
          converted_entity_type?: string | null
          id?: string
          payload: Json
          privacy_version?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_ip_hash?: string | null
          status?: string
          submission_type: string
          submitted_at?: string
          user_agent?: string | null
        }
        Update: {
          consent_contact?: boolean
          consent_marketing?: boolean
          converted_entity_id?: string | null
          converted_entity_type?: string | null
          id?: string
          payload?: Json
          privacy_version?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_ip_hash?: string | null
          status?: string
          submission_type?: string
          submitted_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          assigned_to: string | null
          contact_id: string | null
          converted_opportunity_id: string | null
          created_at: string
          id: string
          internal_notes: string | null
          message: string
          preferred_contact_method: string | null
          reason: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          contact_id?: string | null
          converted_opportunity_id?: string | null
          created_at?: string
          id?: string
          internal_notes?: string | null
          message: string
          preferred_contact_method?: string | null
          reason?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          contact_id?: string | null
          converted_opportunity_id?: string | null
          created_at?: string
          id?: string
          internal_notes?: string | null
          message?: string
          preferred_contact_method?: string | null
          reason?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_converted_opportunity_fk"
            columns: ["converted_opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          assigned_to: string | null
          city: string | null
          contact_id: string | null
          country: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          description: string | null
          estimated_value: number | null
          expected_date: string | null
          id: string
          internal_notes: string | null
          opportunity_type: string
          priority: string
          reference_code: string
          region: string | null
          rejection_reason: string | null
          source: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          city?: string | null
          contact_id?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          estimated_value?: number | null
          expected_date?: string | null
          id?: string
          internal_notes?: string | null
          opportunity_type: string
          priority?: string
          reference_code: string
          region?: string | null
          rejection_reason?: string | null
          source?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          city?: string | null
          contact_id?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          estimated_value?: number | null
          expected_date?: string | null
          id?: string
          internal_notes?: string | null
          opportunity_type?: string
          priority?: string
          reference_code?: string
          region?: string | null
          rejection_reason?: string | null
          source?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_activities: {
        Row: {
          activity_type: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          next_action_at: string | null
          occurred_at: string
          opportunity_id: string
          title: string
        }
        Insert: {
          activity_type: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          next_action_at?: string | null
          occurred_at?: string
          opportunity_id: string
          title: string
        }
        Update: {
          activity_type?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          next_action_at?: string | null
          occurred_at?: string
          opportunity_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_activities_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_suppliers: {
        Row: {
          created_at: string
          currency: string | null
          id: string
          notes: string | null
          opportunity_id: string
          proposed_amount: number | null
          status: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          id?: string
          notes?: string | null
          opportunity_id: string
          proposed_amount?: number | null
          status?: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          id?: string
          notes?: string | null
          opportunity_id?: string
          proposed_amount?: number | null
          status?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_suppliers_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          address_line: string | null
          city_region: string | null
          country_code: string
          created_at: string
          created_by: string | null
          default_attribution_days: number
          default_commission_type: string | null
          default_commission_value: number | null
          default_currency: string
          default_follow_up_days: number
          default_opportunity_priority: string
          display_name: string
          legal_name: string | null
          locale: string
          public_email: string | null
          public_phone: string | null
          singleton_key: string
          tax_identifier: string | null
          timezone: string
          updated_at: string
          updated_by: string | null
          website_url: string | null
        }
        Insert: {
          address_line?: string | null
          city_region?: string | null
          country_code?: string
          created_at?: string
          created_by?: string | null
          default_attribution_days?: number
          default_commission_type?: string | null
          default_commission_value?: number | null
          default_currency?: string
          default_follow_up_days?: number
          default_opportunity_priority?: string
          display_name?: string
          legal_name?: string | null
          locale?: string
          public_email?: string | null
          public_phone?: string | null
          singleton_key?: string
          tax_identifier?: string | null
          timezone?: string
          updated_at?: string
          updated_by?: string | null
          website_url?: string | null
        }
        Update: {
          address_line?: string | null
          city_region?: string | null
          country_code?: string
          created_at?: string
          created_by?: string | null
          default_attribution_days?: number
          default_commission_type?: string | null
          default_commission_value?: number | null
          default_currency?: string
          default_follow_up_days?: number
          default_opportunity_priority?: string
          display_name?: string
          legal_name?: string | null
          locale?: string
          public_email?: string | null
          public_phone?: string | null
          singleton_key?: string
          tax_identifier?: string | null
          timezone?: string
          updated_at?: string
          updated_by?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prospect_activities: {
        Row: {
          activity_type: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          next_action_at: string | null
          next_action_type: string | null
          notes: string | null
          occurred_at: string
          outcome: string | null
          prospect_id: string
          subject: string
        }
        Insert: {
          activity_type: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          next_action_at?: string | null
          next_action_type?: string | null
          notes?: string | null
          occurred_at?: string
          outcome?: string | null
          prospect_id: string
          subject: string
        }
        Update: {
          activity_type?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          next_action_at?: string | null
          next_action_type?: string | null
          notes?: string | null
          occurred_at?: string
          outcome?: string | null
          prospect_id?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospect_activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_activities_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      prospects: {
        Row: {
          assigned_to: string | null
          city_region: string | null
          commercial_origin: string | null
          company_name: string | null
          contact_attempts: number
          converted_at: string | null
          converted_contact_id: string | null
          converted_opportunity_id: string | null
          country: string | null
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string | null
          id: string
          last_contact_at: string | null
          lead_temperature: string
          next_action_at: string | null
          next_action_type: string | null
          notes: string | null
          phone: string | null
          preferred_contact_method: string | null
          priority: string
          product_or_service: string | null
          prospect_type: string
          role_or_activity: string | null
          social_network: string | null
          source: string | null
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          assigned_to?: string | null
          city_region?: string | null
          commercial_origin?: string | null
          company_name?: string | null
          contact_attempts?: number
          converted_at?: string | null
          converted_contact_id?: string | null
          converted_opportunity_id?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          last_contact_at?: string | null
          lead_temperature?: string
          next_action_at?: string | null
          next_action_type?: string | null
          notes?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          priority?: string
          product_or_service?: string | null
          prospect_type: string
          role_or_activity?: string | null
          social_network?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          assigned_to?: string | null
          city_region?: string | null
          commercial_origin?: string | null
          company_name?: string | null
          contact_attempts?: number
          converted_at?: string | null
          converted_contact_id?: string | null
          converted_opportunity_id?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          last_contact_at?: string | null
          lead_temperature?: string
          next_action_at?: string | null
          next_action_type?: string | null
          notes?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          priority?: string
          product_or_service?: string | null
          prospect_type?: string
          role_or_activity?: string | null
          social_network?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospects_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospects_converted_contact_id_fkey"
            columns: ["converted_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospects_converted_opportunity_id_fkey"
            columns: ["converted_opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          business_name: string
          categories: string[]
          commercial_terms: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          geographic_coverage: string | null
          id: string
          internal_notes: string | null
          issues_invoice: boolean | null
          legal_name: string | null
          minimum_order: number | null
          minimum_order_currency: string | null
          status: string
          supply_capacity: string | null
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          business_name: string
          categories?: string[]
          commercial_terms?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          geographic_coverage?: string | null
          id?: string
          internal_notes?: string | null
          issues_invoice?: boolean | null
          legal_name?: string | null
          minimum_order?: number | null
          minimum_order_currency?: string | null
          status?: string
          supply_capacity?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          business_name?: string
          categories?: string[]
          commercial_terms?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          geographic_coverage?: string | null
          id?: string
          internal_notes?: string | null
          issues_invoice?: boolean | null
          legal_name?: string | null
          minimum_order?: number | null
          minimum_order_currency?: string | null
          status?: string
          supply_capacity?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      convert_buy_submission_atomic: {
        Args: {
          p_city?: string
          p_contact_city?: string
          p_contact_company_name?: string
          p_contact_country?: string
          p_contact_email?: string
          p_contact_full_name?: string
          p_contact_notes?: string
          p_contact_phone?: string
          p_contact_position?: string
          p_contact_region?: string
          p_contact_social_media?: string
          p_contact_type?: string
          p_contact_website?: string
          p_country?: string
          p_currency?: string
          p_description?: string
          p_estimated_value?: number
          p_existing_contact_id?: string
          p_expected_date?: string
          p_internal_notes?: string
          p_region?: string
          p_submission_id: string
          p_title?: string
        }
        Returns: {
          already_converted: boolean
          contact_id: string
          entity_id: string
          entity_type: string
          submission_id: string
          visible_identifier: string
        }[]
      }
      convert_contact_submission_atomic: {
        Args: {
          p_contact_city?: string
          p_contact_company_name?: string
          p_contact_country?: string
          p_contact_email?: string
          p_contact_full_name?: string
          p_contact_notes?: string
          p_contact_phone?: string
          p_contact_position?: string
          p_contact_region?: string
          p_contact_social_media?: string
          p_contact_type?: string
          p_contact_website?: string
          p_existing_contact_id?: string
          p_internal_notes?: string
          p_message?: string
          p_preferred_contact_method?: string
          p_reason?: string
          p_subject?: string
          p_submission_id: string
        }
        Returns: {
          already_converted: boolean
          contact_id: string
          entity_id: string
          entity_type: string
          submission_id: string
          visible_identifier: string
        }[]
      }
      convert_inquiry_to_opportunity_atomic: {
        Args: {
          p_city?: string
          p_country?: string
          p_currency?: string
          p_description?: string
          p_estimated_value?: number
          p_expected_date?: string
          p_inquiry_id: string
          p_internal_notes?: string
          p_opportunity_type: string
          p_region?: string
          p_title: string
        }
        Returns: {
          already_converted: boolean
          inquiry_id: string
          opportunity_id: string
          reference_code: string
        }[]
      }
      convert_prospect_to_opportunity: {
        Args: {
          p_city?: string
          p_contact_city?: string
          p_contact_company_name?: string
          p_contact_country?: string
          p_contact_email?: string
          p_contact_full_name?: string
          p_contact_notes?: string
          p_contact_phone?: string
          p_contact_position?: string
          p_contact_region?: string
          p_contact_social_media?: string
          p_contact_type?: string
          p_contact_website?: string
          p_country?: string
          p_currency?: string
          p_description?: string
          p_estimated_value?: number
          p_existing_contact_id?: string
          p_expected_date?: string
          p_internal_notes?: string
          p_opportunity_type: string
          p_prospect_id: string
          p_region?: string
          p_title: string
        }
        Returns: {
          already_converted: boolean
          contact_id: string
          opportunity_id: string
          prospect_id: string
          reference_code: string
        }[]
      }
      convert_sell_submission_atomic: {
        Args: {
          p_city?: string
          p_contact_city?: string
          p_contact_company_name?: string
          p_contact_country?: string
          p_contact_email?: string
          p_contact_full_name?: string
          p_contact_notes?: string
          p_contact_phone?: string
          p_contact_position?: string
          p_contact_region?: string
          p_contact_social_media?: string
          p_contact_type?: string
          p_contact_website?: string
          p_country?: string
          p_currency?: string
          p_description?: string
          p_estimated_value?: number
          p_existing_contact_id?: string
          p_expected_date?: string
          p_internal_notes?: string
          p_region?: string
          p_submission_id: string
          p_title?: string
        }
        Returns: {
          already_converted: boolean
          contact_id: string
          entity_id: string
          entity_type: string
          submission_id: string
          visible_identifier: string
        }[]
      }
      convert_supplier_submission_atomic: {
        Args: {
          p_business_name?: string
          p_categories?: string[]
          p_commercial_terms?: string
          p_contact_city?: string
          p_contact_company_name?: string
          p_contact_country?: string
          p_contact_email?: string
          p_contact_full_name?: string
          p_contact_notes?: string
          p_contact_phone?: string
          p_contact_position?: string
          p_contact_region?: string
          p_contact_social_media?: string
          p_contact_type?: string
          p_contact_website?: string
          p_description?: string
          p_existing_contact_id?: string
          p_geographic_coverage?: string
          p_internal_notes?: string
          p_issues_invoice?: boolean
          p_legal_name?: string
          p_minimum_order?: number
          p_minimum_order_currency?: string
          p_submission_id: string
          p_supply_capacity?: string
          p_tax_id?: string
        }
        Returns: {
          already_converted: boolean
          contact_id: string
          entity_id: string
          entity_type: string
          submission_id: string
          visible_identifier: string
        }[]
      }
      create_commercial_proposal_version: {
        Args: { p_proposal_id: string }
        Returns: {
          client_notes: string | null
          created_at: string
          created_by: string
          currency: string | null
          description: string | null
          id: string
          proposal_id: string
          snapshot_data: Json
          subtotal: number
          tax_amount: number
          tax_percentage: number
          title: string
          total_amount: number
          valid_until: string | null
          version_number: number
        }
        SetofOptions: {
          from: "*"
          to: "commercial_proposal_versions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_prospect_activity_atomic: {
        Args: {
          p_activity_type: string
          p_next_action_at?: string
          p_next_action_type?: string
          p_notes?: string
          p_occurred_at?: string
          p_outcome?: string
          p_prospect_id: string
          p_status?: string
          p_subject?: string
        }
        Returns: {
          activity_type: string
          completed_at: string
          created_at: string
          created_by: string
          id: string
          next_action_at: string
          next_action_type: string
          notes: string
          occurred_at: string
          outcome: string
          prospect_id: string
          subject: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
