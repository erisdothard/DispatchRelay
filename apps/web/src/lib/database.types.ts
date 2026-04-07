export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1';
  };
  public: {
    Tables: {
      accessorial_charges: {
        Row: {
          amount_usd: number;
          approved_at: string | null;
          approved_by: string | null;
          booking_id: string | null;
          created_at: string | null;
          created_by: string;
          id: string;
          load_id: string;
          notes: string | null;
          status: string;
          type: string;
          updated_at: string | null;
        };
        Insert: {
          amount_usd?: number;
          approved_at?: string | null;
          approved_by?: string | null;
          booking_id?: string | null;
          created_at?: string | null;
          created_by: string;
          id?: string;
          load_id: string;
          notes?: string | null;
          status?: string;
          type: string;
          updated_at?: string | null;
        };
        Update: {
          amount_usd?: number;
          approved_at?: string | null;
          approved_by?: string | null;
          booking_id?: string | null;
          created_at?: string | null;
          created_by?: string;
          id?: string;
          load_id?: string;
          notes?: string | null;
          status?: string;
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'accessorial_charges_approved_by_fkey';
            columns: ['approved_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'accessorial_charges_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'bids';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'accessorial_charges_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'accessorial_charges_load_id_fkey';
            columns: ['load_id'];
            isOneToOne: false;
            referencedRelation: 'loads';
            referencedColumns: ['id'];
          },
        ];
      };
      audit_log: {
        Row: {
          action: string;
          created_at: string | null;
          diff: Json | null;
          entity_id: string;
          entity_type: string;
          id: string;
          ip_address: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string | null;
          diff?: Json | null;
          entity_id: string;
          entity_type: string;
          id?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string | null;
          diff?: Json | null;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_log_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      bids: {
        Row: {
          amount_usd: number;
          carrier_id: string;
          company_id: string | null;
          company_name: string;
          created_at: string;
          expires_at: string;
          id: string;
          load_id: string;
          notes: string | null;
          parent_bid_id: string | null;
          round: number;
          signatory_name: string | null;
          signature_url: string | null;
          signed_at: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          amount_usd: number;
          carrier_id: string;
          company_id?: string | null;
          company_name?: string;
          created_at?: string;
          expires_at?: string;
          id?: string;
          load_id: string;
          notes?: string | null;
          parent_bid_id?: string | null;
          round?: number;
          signatory_name?: string | null;
          signature_url?: string | null;
          signed_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          amount_usd?: number;
          carrier_id?: string;
          company_id?: string | null;
          company_name?: string;
          created_at?: string;
          expires_at?: string;
          id?: string;
          load_id?: string;
          notes?: string | null;
          parent_bid_id?: string | null;
          round?: number;
          signatory_name?: string | null;
          signature_url?: string | null;
          signed_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bids_carrier_id_fkey';
            columns: ['carrier_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bids_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bids_load_id_fkey';
            columns: ['load_id'];
            isOneToOne: false;
            referencedRelation: 'loads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bids_parent_bid_id_fkey';
            columns: ['parent_bid_id'];
            isOneToOne: false;
            referencedRelation: 'bids';
            referencedColumns: ['id'];
          },
        ];
      };
      broker_payment_metrics: {
        Row: {
          avg_days_to_pay: number | null;
          company_id: string;
          on_time_pct: number | null;
          payment_count: number;
          total_paid_usd: number | null;
          updated_at: string | null;
        };
        Insert: {
          avg_days_to_pay?: number | null;
          company_id: string;
          on_time_pct?: number | null;
          payment_count?: number;
          total_paid_usd?: number | null;
          updated_at?: string | null;
        };
        Update: {
          avg_days_to_pay?: number | null;
          company_id?: string;
          on_time_pct?: number | null;
          payment_count?: number;
          total_paid_usd?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'broker_payment_metrics_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: true;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      carrier_preferences: {
        Row: {
          created_at: string | null;
          home_city: string | null;
          home_state: string | null;
          min_rate_per_mile: number | null;
          preferred_dest_states: string[] | null;
          preferred_equipment: string[] | null;
          preferred_origin_states: string[] | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          home_city?: string | null;
          home_state?: string | null;
          min_rate_per_mile?: number | null;
          preferred_dest_states?: string[] | null;
          preferred_equipment?: string[] | null;
          preferred_origin_states?: string[] | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          home_city?: string | null;
          home_state?: string | null;
          min_rate_per_mile?: number | null;
          preferred_dest_states?: string[] | null;
          preferred_equipment?: string[] | null;
          preferred_origin_states?: string[] | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'carrier_preferences_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      carrier_relationships: {
        Row: {
          carrier_id: string;
          company_id: string;
          created_at: string | null;
          created_by: string | null;
          id: string;
          notes: string | null;
          status: string;
        };
        Insert: {
          carrier_id: string;
          company_id: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          status?: string;
        };
        Update: {
          carrier_id?: string;
          company_id?: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'carrier_relationships_carrier_id_fkey';
            columns: ['carrier_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'carrier_relationships_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'carrier_relationships_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      carrier_verifications: {
        Row: {
          company_id: string;
          created_at: string;
          csa_score: number | null;
          dot_number: string | null;
          fmcsa_status: string | null;
          fmcsa_verified_at: string | null;
          id: string;
          insurance_amount_usd: number | null;
          insurance_carrier: string | null;
          insurance_cert_url: string | null;
          insurance_expires_at: string | null;
          insurance_expiry_date: string | null;
          insurance_policy: string | null;
          last_verified_at: string | null;
          mc_number: string | null;
          next_verify_at: string | null;
          notes: string | null;
          risk_factors: Json | null;
          risk_score: number | null;
          safety_rating: string | null;
          status: Database['public']['Enums']['verification_status'];
          updated_at: string;
          verified_at: string | null;
          w9_uploaded_at: string | null;
          w9_url: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          csa_score?: number | null;
          dot_number?: string | null;
          fmcsa_status?: string | null;
          fmcsa_verified_at?: string | null;
          id?: string;
          insurance_amount_usd?: number | null;
          insurance_carrier?: string | null;
          insurance_cert_url?: string | null;
          insurance_expires_at?: string | null;
          insurance_expiry_date?: string | null;
          insurance_policy?: string | null;
          last_verified_at?: string | null;
          mc_number?: string | null;
          next_verify_at?: string | null;
          notes?: string | null;
          risk_factors?: Json | null;
          risk_score?: number | null;
          safety_rating?: string | null;
          status?: Database['public']['Enums']['verification_status'];
          updated_at?: string;
          verified_at?: string | null;
          w9_uploaded_at?: string | null;
          w9_url?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          csa_score?: number | null;
          dot_number?: string | null;
          fmcsa_status?: string | null;
          fmcsa_verified_at?: string | null;
          id?: string;
          insurance_amount_usd?: number | null;
          insurance_carrier?: string | null;
          insurance_cert_url?: string | null;
          insurance_expires_at?: string | null;
          insurance_expiry_date?: string | null;
          insurance_policy?: string | null;
          last_verified_at?: string | null;
          mc_number?: string | null;
          next_verify_at?: string | null;
          notes?: string | null;
          risk_factors?: Json | null;
          risk_score?: number | null;
          safety_rating?: string | null;
          status?: Database['public']['Enums']['verification_status'];
          updated_at?: string;
          verified_at?: string | null;
          w9_uploaded_at?: string | null;
          w9_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'carrier_verifications_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      companies: {
        Row: {
          address: string | null;
          broker_authority: string | null;
          city: string | null;
          created_at: string;
          dot_number: string | null;
          email: string | null;
          id: string;
          logo_url: string | null;
          mc_number: string | null;
          name: string;
          on_time_percent: number | null;
          owner_id: string;
          phone: string | null;
          rating: number | null;
          state: string | null;
          total_loads: number;
          type: string;
          updated_at: string;
          verified: boolean;
          website: string | null;
          zip: string | null;
        };
        Insert: {
          address?: string | null;
          broker_authority?: string | null;
          city?: string | null;
          created_at?: string;
          dot_number?: string | null;
          email?: string | null;
          id?: string;
          logo_url?: string | null;
          mc_number?: string | null;
          name: string;
          on_time_percent?: number | null;
          owner_id: string;
          phone?: string | null;
          rating?: number | null;
          state?: string | null;
          total_loads?: number;
          type: string;
          updated_at?: string;
          verified?: boolean;
          website?: string | null;
          zip?: string | null;
        };
        Update: {
          address?: string | null;
          broker_authority?: string | null;
          city?: string | null;
          created_at?: string;
          dot_number?: string | null;
          email?: string | null;
          id?: string;
          logo_url?: string | null;
          mc_number?: string | null;
          name?: string;
          on_time_percent?: number | null;
          owner_id?: string;
          phone?: string | null;
          rating?: number | null;
          state?: string | null;
          total_loads?: number;
          type?: string;
          updated_at?: string;
          verified?: boolean;
          website?: string | null;
          zip?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'companies_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      company_invites: {
        Row: {
          accepted_at: string | null;
          company_id: string;
          created_at: string | null;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string | null;
          role: string;
          token: string;
        };
        Insert: {
          accepted_at?: string | null;
          company_id: string;
          created_at?: string | null;
          email: string;
          expires_at?: string;
          id?: string;
          invited_by?: string | null;
          role?: string;
          token?: string;
        };
        Update: {
          accepted_at?: string | null;
          company_id?: string;
          created_at?: string | null;
          email?: string;
          expires_at?: string;
          id?: string;
          invited_by?: string | null;
          role?: string;
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'company_invites_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'company_invites_invited_by_fkey';
            columns: ['invited_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      company_members: {
        Row: {
          company_id: string;
          created_at: string | null;
          id: string;
          invited_by: string | null;
          joined_at: string | null;
          role: string;
          user_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string | null;
          id?: string;
          invited_by?: string | null;
          joined_at?: string | null;
          role?: string;
          user_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string | null;
          id?: string;
          invited_by?: string | null;
          joined_at?: string | null;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'company_members_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'company_members_invited_by_fkey';
            columns: ['invited_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'company_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      conversations: {
        Row: {
          created_at: string;
          id: string;
          last_message: string | null;
          last_message_at: string;
          load_number: string | null;
          other_party: string;
          other_party_role: string;
          participant_a: string | null;
          participant_b: string | null;
          unread_count: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          last_message?: string | null;
          last_message_at?: string;
          load_number?: string | null;
          other_party: string;
          other_party_role: string;
          participant_a?: string | null;
          participant_b?: string | null;
          unread_count?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          last_message?: string | null;
          last_message_at?: string;
          load_number?: string | null;
          other_party?: string;
          other_party_role?: string;
          participant_a?: string | null;
          participant_b?: string | null;
          unread_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'conversations_participant_a_fkey';
            columns: ['participant_a'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversations_participant_b_fkey';
            columns: ['participant_b'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      documents: {
        Row: {
          bol_number: string | null;
          created_at: string;
          file_name: string;
          file_size: number | null;
          file_url: string;
          id: string;
          load_id: string | null;
          type: string;
          uploaded_by: string | null;
        };
        Insert: {
          bol_number?: string | null;
          created_at?: string;
          file_name: string;
          file_size?: number | null;
          file_url: string;
          id?: string;
          load_id?: string | null;
          type: string;
          uploaded_by?: string | null;
        };
        Update: {
          bol_number?: string | null;
          created_at?: string;
          file_name?: string;
          file_size?: number | null;
          file_url?: string;
          id?: string;
          load_id?: string | null;
          type?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'documents_load_id_fkey';
            columns: ['load_id'];
            isOneToOne: false;
            referencedRelation: 'loads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'documents_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      driver_incidents: {
        Row: {
          created_at: string | null;
          description: string | null;
          driver_id: string;
          id: string;
          incident_date: string;
          incident_type: string;
          lat: number | null;
          lng: number | null;
          load_number: string | null;
          location_text: string | null;
          photos: string[] | null;
          resolution_notes: string | null;
          resolved_at: string | null;
          severity: string;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          driver_id: string;
          id?: string;
          incident_date?: string;
          incident_type: string;
          lat?: number | null;
          lng?: number | null;
          load_number?: string | null;
          location_text?: string | null;
          photos?: string[] | null;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          severity?: string;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          driver_id?: string;
          id?: string;
          incident_date?: string;
          incident_type?: string;
          lat?: number | null;
          lng?: number | null;
          load_number?: string | null;
          location_text?: string | null;
          photos?: string[] | null;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          severity?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'driver_incidents_driver_id_fkey';
            columns: ['driver_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      factoring_requests: {
        Row: {
          approved_at: string | null;
          carrier_id: string;
          company_id: string | null;
          created_at: string | null;
          factor_partner: string | null;
          fee_percent: number;
          funded_at: string | null;
          id: string;
          invoice_amount: number;
          load_id: string | null;
          load_number: string | null;
          net_payout: number | null;
          notes: string | null;
          requested_at: string | null;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          approved_at?: string | null;
          carrier_id: string;
          company_id?: string | null;
          created_at?: string | null;
          factor_partner?: string | null;
          fee_percent?: number;
          funded_at?: string | null;
          id?: string;
          invoice_amount: number;
          load_id?: string | null;
          load_number?: string | null;
          net_payout?: number | null;
          notes?: string | null;
          requested_at?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          approved_at?: string | null;
          carrier_id?: string;
          company_id?: string | null;
          created_at?: string | null;
          factor_partner?: string | null;
          fee_percent?: number;
          funded_at?: string | null;
          id?: string;
          invoice_amount?: number;
          load_id?: string | null;
          load_number?: string | null;
          net_payout?: number | null;
          notes?: string | null;
          requested_at?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'factoring_requests_carrier_id_fkey';
            columns: ['carrier_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'factoring_requests_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'factoring_requests_load_id_fkey';
            columns: ['load_id'];
            isOneToOne: false;
            referencedRelation: 'loads';
            referencedColumns: ['id'];
          },
        ];
      };
      lane_benchmarks: {
        Row: {
          avg_rate_per_mile: number | null;
          created_at: string | null;
          dest_state: string;
          equipment: string;
          id: string;
          max_rate_per_mile: number | null;
          min_rate_per_mile: number | null;
          origin_state: string;
          sample_count: number;
          week_start: string;
        };
        Insert: {
          avg_rate_per_mile?: number | null;
          created_at?: string | null;
          dest_state: string;
          equipment: string;
          id?: string;
          max_rate_per_mile?: number | null;
          min_rate_per_mile?: number | null;
          origin_state: string;
          sample_count?: number;
          week_start: string;
        };
        Update: {
          avg_rate_per_mile?: number | null;
          created_at?: string | null;
          dest_state?: string;
          equipment?: string;
          id?: string;
          max_rate_per_mile?: number | null;
          min_rate_per_mile?: number | null;
          origin_state?: string;
          sample_count?: number;
          week_start?: string;
        };
        Relationships: [];
      };
      load_templates: {
        Row: {
          company_id: string | null;
          created_at: string | null;
          id: string;
          name: string;
          template_data: Json;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          company_id?: string | null;
          created_at?: string | null;
          id?: string;
          name: string;
          template_data?: Json;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          company_id?: string | null;
          created_at?: string | null;
          id?: string;
          name?: string;
          template_data?: Json;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'load_templates_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'load_templates_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      loads: {
        Row: {
          assigned_driver_id: string | null;
          assignee_id: string | null;
          bid_count: number;
          broker_credit_score: number | null;
          commodity: string;
          company_id: string | null;
          company_name: string;
          created_at: string;
          delivery_date: string;
          dest_address: string | null;
          dest_city: string;
          dest_state: string;
          dest_zip: string | null;
          equipment: string;
          freight_class: string | null;
          hazmat: boolean;
          id: string;
          load_number: string;
          origin_address: string | null;
          origin_city: string;
          origin_state: string;
          origin_zip: string | null;
          packaging_type: string | null;
          pickup_date: string;
          po_number: string | null;
          posted_at: string;
          posted_by: string | null;
          preferred_carriers_only: boolean;
          rate_per_mile: number | null;
          rate_usd: number;
          search_vector: unknown;
          second_driver_id: string | null;
          shipper_reference: string | null;
          status: string;
          temp_controlled: boolean;
          total_miles: number | null;
          weight_lbs: number;
        };
        Insert: {
          assigned_driver_id?: string | null;
          assignee_id?: string | null;
          bid_count?: number;
          broker_credit_score?: number | null;
          commodity: string;
          company_id?: string | null;
          company_name: string;
          created_at?: string;
          delivery_date: string;
          dest_address?: string | null;
          dest_city: string;
          dest_state: string;
          dest_zip?: string | null;
          equipment: string;
          freight_class?: string | null;
          hazmat?: boolean;
          id?: string;
          load_number: string;
          origin_address?: string | null;
          origin_city: string;
          origin_state: string;
          origin_zip?: string | null;
          packaging_type?: string | null;
          pickup_date: string;
          po_number?: string | null;
          posted_at?: string;
          posted_by?: string | null;
          preferred_carriers_only?: boolean;
          rate_per_mile?: number | null;
          rate_usd: number;
          search_vector?: unknown;
          second_driver_id?: string | null;
          shipper_reference?: string | null;
          status?: string;
          temp_controlled?: boolean;
          total_miles?: number | null;
          weight_lbs: number;
        };
        Update: {
          assigned_driver_id?: string | null;
          assignee_id?: string | null;
          bid_count?: number;
          broker_credit_score?: number | null;
          commodity?: string;
          company_id?: string | null;
          company_name?: string;
          created_at?: string;
          delivery_date?: string;
          dest_address?: string | null;
          dest_city?: string;
          dest_state?: string;
          dest_zip?: string | null;
          equipment?: string;
          freight_class?: string | null;
          hazmat?: boolean;
          id?: string;
          load_number?: string;
          origin_address?: string | null;
          origin_city?: string;
          origin_state?: string;
          origin_zip?: string | null;
          packaging_type?: string | null;
          pickup_date?: string;
          po_number?: string | null;
          posted_at?: string;
          posted_by?: string | null;
          preferred_carriers_only?: boolean;
          rate_per_mile?: number | null;
          rate_usd?: number;
          search_vector?: unknown;
          second_driver_id?: string | null;
          shipper_reference?: string | null;
          status?: string;
          temp_controlled?: boolean;
          total_miles?: number | null;
          weight_lbs?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'loads_assigned_driver_id_fkey';
            columns: ['assigned_driver_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loads_assignee_id_fkey';
            columns: ['assignee_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loads_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loads_posted_by_fkey';
            columns: ['posted_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loads_second_driver_id_fkey';
            columns: ['second_driver_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      location_pings: {
        Row: {
          accuracy_m: number | null;
          driver_id: string | null;
          heading_deg: number | null;
          id: string;
          latitude: number;
          load_number: string;
          longitude: number;
          recorded_at: string;
          speed_ms: number | null;
        };
        Insert: {
          accuracy_m?: number | null;
          driver_id?: string | null;
          heading_deg?: number | null;
          id?: string;
          latitude: number;
          load_number: string;
          longitude: number;
          recorded_at?: string;
          speed_ms?: number | null;
        };
        Update: {
          accuracy_m?: number | null;
          driver_id?: string | null;
          heading_deg?: number | null;
          id?: string;
          latitude?: number;
          load_number?: string;
          longitude?: number;
          recorded_at?: string;
          speed_ms?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'location_pings_driver_id_fkey';
            columns: ['driver_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      messages: {
        Row: {
          conversation_id: string;
          created_at: string;
          from_me: boolean;
          id: string;
          read: boolean;
          sender_id: string | null;
          text: string;
        };
        Insert: {
          conversation_id: string;
          created_at?: string;
          from_me?: boolean;
          id?: string;
          read?: boolean;
          sender_id?: string | null;
          text: string;
        };
        Update: {
          conversation_id?: string;
          created_at?: string;
          from_me?: boolean;
          id?: string;
          read?: boolean;
          sender_id?: string | null;
          text?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_preferences: {
        Row: {
          phone_number: string | null;
          settings: Json;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          phone_number?: string | null;
          settings?: Json;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          phone_number?: string | null;
          settings?: Json;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_preferences_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_queue: {
        Row: {
          attempts: number;
          created_at: string | null;
          error_message: string | null;
          id: string;
          max_attempts: number;
          next_retry_at: string | null;
          payload: Json;
          recipient: string;
          sent_at: string | null;
          status: string;
          subject: string | null;
          type: string;
        };
        Insert: {
          attempts?: number;
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          max_attempts?: number;
          next_retry_at?: string | null;
          payload?: Json;
          recipient: string;
          sent_at?: string | null;
          status?: string;
          subject?: string | null;
          type: string;
        };
        Update: {
          attempts?: number;
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          max_attempts?: number;
          next_retry_at?: string | null;
          payload?: Json;
          recipient?: string;
          sent_at?: string | null;
          status?: string;
          subject?: string | null;
          type?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          load_id: string | null;
          read: boolean;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          load_id?: string | null;
          read?: boolean;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          load_id?: string | null;
          read?: boolean;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_load_id_fkey';
            columns: ['load_id'];
            isOneToOne: false;
            referencedRelation: 'loads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          onboarding_complete: boolean;
          phone: string | null;
          role: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          onboarding_complete?: boolean;
          phone?: string | null;
          role?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          onboarding_complete?: boolean;
          phone?: string | null;
          role?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          auth: string;
          created_at: string | null;
          endpoint: string;
          id: string;
          last_used_at: string | null;
          p256dh: string;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          auth: string;
          created_at?: string | null;
          endpoint: string;
          id?: string;
          last_used_at?: string | null;
          p256dh: string;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          auth?: string;
          created_at?: string | null;
          endpoint?: string;
          id?: string;
          last_used_at?: string | null;
          p256dh?: string;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'push_subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      rate_history: {
        Row: {
          dest_state: string;
          equipment: string;
          id: string;
          lane_hash: string;
          load_id: string | null;
          origin_state: string;
          rate_per_mile: number | null;
          rate_usd: number;
          recorded_at: string | null;
          total_miles: number | null;
        };
        Insert: {
          dest_state: string;
          equipment: string;
          id?: string;
          lane_hash: string;
          load_id?: string | null;
          origin_state: string;
          rate_per_mile?: number | null;
          rate_usd: number;
          recorded_at?: string | null;
          total_miles?: number | null;
        };
        Update: {
          dest_state?: string;
          equipment?: string;
          id?: string;
          lane_hash?: string;
          load_id?: string | null;
          origin_state?: string;
          rate_per_mile?: number | null;
          rate_usd?: number;
          recorded_at?: string | null;
          total_miles?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'rate_history_load_id_fkey';
            columns: ['load_id'];
            isOneToOne: false;
            referencedRelation: 'loads';
            referencedColumns: ['id'];
          },
        ];
      };
      saved_searches: {
        Row: {
          alert_enabled: boolean;
          created_at: string | null;
          filters: Json;
          id: string;
          last_alerted_at: string | null;
          name: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          alert_enabled?: boolean;
          created_at?: string | null;
          filters?: Json;
          id?: string;
          last_alerted_at?: string | null;
          name: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          alert_enabled?: boolean;
          created_at?: string | null;
          filters?: Json;
          id?: string;
          last_alerted_at?: string | null;
          name?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'saved_searches_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      tracking_milestones: {
        Row: {
          completed: boolean;
          created_at: string;
          current: boolean;
          id: string;
          label: string;
          load_number: string;
          location: string;
          milestone_timestamp: string | null;
          sort_order: number;
        };
        Insert: {
          completed?: boolean;
          created_at?: string;
          current?: boolean;
          id?: string;
          label: string;
          load_number: string;
          location: string;
          milestone_timestamp?: string | null;
          sort_order?: number;
        };
        Update: {
          completed?: boolean;
          created_at?: string;
          current?: boolean;
          id?: string;
          label?: string;
          load_number?: string;
          location?: string;
          milestone_timestamp?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      trucks: {
        Row: {
          available_date: string;
          company_id: string | null;
          company_name: string;
          created_at: string;
          dest_city: string | null;
          dest_state: string | null;
          driver_id: string | null;
          driver_name: string | null;
          driver_phone: string | null;
          equipment: string;
          id: string;
          length_ft: number | null;
          origin_city: string;
          origin_state: string;
          posted_by: string | null;
          status: string;
          weight_capacity_lbs: number | null;
        };
        Insert: {
          available_date: string;
          company_id?: string | null;
          company_name: string;
          created_at?: string;
          dest_city?: string | null;
          dest_state?: string | null;
          driver_id?: string | null;
          driver_name?: string | null;
          driver_phone?: string | null;
          equipment: string;
          id?: string;
          length_ft?: number | null;
          origin_city: string;
          origin_state: string;
          posted_by?: string | null;
          status?: string;
          weight_capacity_lbs?: number | null;
        };
        Update: {
          available_date?: string;
          company_id?: string | null;
          company_name?: string;
          created_at?: string;
          dest_city?: string | null;
          dest_state?: string | null;
          driver_id?: string | null;
          driver_name?: string | null;
          driver_phone?: string | null;
          equipment?: string;
          id?: string;
          length_ft?: number | null;
          origin_city?: string;
          origin_state?: string;
          posted_by?: string | null;
          status?: string;
          weight_capacity_lbs?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'trucks_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'trucks_driver_id_fkey';
            columns: ['driver_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'trucks_posted_by_fkey';
            columns: ['posted_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      verification_schedule: {
        Row: {
          carrier_id: string;
          company_id: string;
          completed_at: string | null;
          created_at: string | null;
          id: string;
          result: Json | null;
          scheduled_at: string;
          trigger_reason: string | null;
        };
        Insert: {
          carrier_id: string;
          company_id: string;
          completed_at?: string | null;
          created_at?: string | null;
          id?: string;
          result?: Json | null;
          scheduled_at: string;
          trigger_reason?: string | null;
        };
        Update: {
          carrier_id?: string;
          company_id?: string;
          completed_at?: string | null;
          created_at?: string | null;
          id?: string;
          result?: Json | null;
          scheduled_at?: string;
          trigger_reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'verification_schedule_carrier_id_fkey';
            columns: ['carrier_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'verification_schedule_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      popular_lanes: {
        Row: {
          avg_rate_per_mile: number | null;
          dest_state: string | null;
          equipment: string | null;
          last_seen_at: string | null;
          load_count: number | null;
          max_rate_per_mile: number | null;
          min_rate_per_mile: number | null;
          origin_state: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      accept_bid: { Args: { bid_id: string }; Returns: undefined };
      accept_company_invite: { Args: { p_token: string }; Returns: undefined };
      book_now: { Args: { p_load_id: string }; Returns: undefined };
      enqueue_notification: {
        Args: {
          p_payload: Json;
          p_recipient: string;
          p_subject: string;
          p_type: string;
        };
        Returns: string;
      };
      get_lane_stats: {
        Args: {
          p_days?: number;
          p_dest_state: string;
          p_equipment: string;
          p_origin_state: string;
        };
        Returns: {
          avg_rate_per_mile: number;
          last_recorded_at: string;
          max_rate_per_mile: number;
          min_rate_per_mile: number;
          sample_count: number;
        }[];
      };
      get_lane_trend: {
        Args: {
          p_dest_state: string;
          p_equipment: string;
          p_origin_state: string;
        };
        Returns: {
          avg_rate_per_mile: number;
          day: string;
        }[];
      };
      get_my_company_ids: { Args: never; Returns: string[] };
      increment_bid_count: { Args: { load_id: string }; Returns: undefined };
      record_broker_payment: {
        Args: {
          p_amount_usd: number;
          p_company_id: string;
          p_days_to_pay: number;
          p_on_time: boolean;
        };
        Returns: undefined;
      };
      search_loads: {
        Args: {
          p_dest_state?: string;
          p_equipment?: string;
          p_origin_state?: string;
          p_page?: number;
          p_page_size?: number;
          p_query: string;
          p_status?: string;
        };
        Returns: {
          bid_count: number;
          commodity: string;
          company_name: string;
          dest_city: string;
          dest_state: string;
          equipment: string;
          id: string;
          load_number: string;
          origin_city: string;
          origin_state: string;
          pickup_date: string;
          posted_at: string;
          rank: number;
          rate_per_mile: number;
          rate_usd: number;
          status: string;
          total_miles: number;
        }[];
      };
      write_audit_log: {
        Args: {
          p_action: string;
          p_diff?: Json;
          p_entity_id: string;
          p_entity_type: string;
          p_ip?: string;
        };
        Returns: string;
      };
    };
    Enums: {
      verification_status: 'pending' | 'verified' | 'failed' | 'expired';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      verification_status: ['pending', 'verified', 'failed', 'expired'],
    },
  },
} as const;

// ── Helper Types ──────────────────────────────────────────────────────────────
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type CompanyRow = Database['public']['Tables']['companies']['Row'];
export type LoadRow = Database['public']['Tables']['loads']['Row'];
export type TruckRow = Database['public']['Tables']['trucks']['Row'];
export type BidRow = Database['public']['Tables']['bids']['Row'];
export type DocumentRow = Database['public']['Tables']['documents']['Row'];
export type CarrierVerificationRow = Database['public']['Tables']['carrier_verifications']['Row'];

// Placeholder types for tables not yet in schema
export type RatingRow = {
  id: string;
  created_at: string;
  load_id: string | null;
  rated_by: string;
  rated_entity_id: string;
  overall: number;
  communication: number | null;
  reliability: number | null;
  professionalism: number | null;
  comment: string | null;
};

export type InvoiceRow = {
  id: string;
  load_id: string;
  amount_usd: number;
  status: InvoiceStatus;
  created_at: string;
  due_date: string | null;
};

export type UserRole = 'carrier' | 'broker' | 'shipper' | 'admin' | 'driver';
export type EquipmentType =
  | 'van'
  | 'reefer'
  | 'flatbed'
  | 'step_deck'
  | 'lowboy'
  | 'tanker'
  | 'box_truck'
  | 'sprinter';
export type LoadStatus =
  | 'draft'
  | 'posted'
  | 'bid_received'
  | 'awarded'
  | 'dispatched'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'expired';
export type DocumentType = 'bill_of_lading' | 'proof_of_delivery' | 'rate_confirmation' | 'other';
export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type VerificationStatus = 'pending' | 'verified' | 'failed' | 'expired';
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
export type TruckStatus = 'available' | 'booked' | 'inactive';
