export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'carrier' | 'broker' | 'shipper' | 'admin' | 'driver';
export type VerificationStatus = 'pending' | 'verified' | 'failed' | 'expired';
export type SubscriptionTier =
  | 'free'
  | 'carrier_pro'
  | 'broker_starter'
  | 'broker_growth'
  | 'shipper'
  | 'enterprise';
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'trialing';
export type InvoiceStatus = 'invoiced' | 'approved' | 'processing' | 'paid' | 'disputed' | 'void';
export type PaymentMethod = 'standard_net30' | 'quick_pay';
export type BidStatus = 'pending' | 'accepted' | 'declined' | 'countered' | 'expired' | 'cancelled';
export type DocumentType = 'bill_of_lading' | 'proof_of_delivery' | 'rate_confirmation' | 'other';
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
export type TruckStatus = 'available' | 'booked' | 'inactive';
export type EquipmentType =
  | 'van'
  | 'reefer'
  | 'flatbed'
  | 'step_deck'
  | 'lowboy'
  | 'tanker'
  | 'box_truck'
  | 'sprinter';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: UserRole;
          phone: string | null;
          avatar_url: string | null;
          onboarding_complete: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: UserRole;
          phone?: string | null;
          avatar_url?: string | null;
          onboarding_complete?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: UserRole;
          phone?: string | null;
          avatar_url?: string | null;
          onboarding_complete?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      companies: {
        Row: {
          id: string;
          owner_id: string;
          type: 'carrier' | 'broker' | 'shipper';
          name: string;
          mc_number: string | null;
          dot_number: string | null;
          broker_authority: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          logo_url: string | null;
          verified: boolean;
          rating: number | null;
          total_loads: number;
          on_time_percent: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          type: 'carrier' | 'broker' | 'shipper';
          name: string;
          mc_number?: string | null;
          dot_number?: string | null;
          broker_authority?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          logo_url?: string | null;
          verified?: boolean;
          rating?: number | null;
          total_loads?: number;
          on_time_percent?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          type?: 'carrier' | 'broker' | 'shipper';
          name?: string;
          mc_number?: string | null;
          dot_number?: string | null;
          broker_authority?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          logo_url?: string | null;
          verified?: boolean;
          rating?: number | null;
          total_loads?: number;
          on_time_percent?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      loads: {
        Row: {
          id: string;
          load_number: string;
          posted_by: string | null;
          company_id: string | null;
          company_name: string;
          origin_city: string;
          origin_state: string;
          origin_address: string | null;
          origin_zip: string | null;
          dest_city: string;
          dest_state: string;
          dest_address: string | null;
          dest_zip: string | null;
          pickup_date: string;
          delivery_date: string;
          equipment: EquipmentType;
          commodity: string;
          weight_lbs: number;
          rate_usd: number;
          rate_per_mile: number | null;
          total_miles: number | null;
          status: LoadStatus;
          bid_count: number;
          hazmat: boolean;
          temp_controlled: boolean;
          posted_at: string;
          broker_credit_score: number | null;
          assigned_driver_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          load_number: string;
          posted_by?: string | null;
          company_id?: string | null;
          company_name: string;
          origin_city: string;
          origin_state: string;
          origin_address?: string | null;
          origin_zip?: string | null;
          dest_city: string;
          dest_state: string;
          dest_address?: string | null;
          dest_zip?: string | null;
          pickup_date: string;
          delivery_date: string;
          equipment: EquipmentType;
          commodity: string;
          weight_lbs: number;
          rate_usd: number;
          rate_per_mile?: number | null;
          total_miles?: number | null;
          status?: LoadStatus;
          bid_count?: number;
          hazmat?: boolean;
          temp_controlled?: boolean;
          posted_at?: string;
          broker_credit_score?: number | null;
          assigned_driver_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          load_number?: string;
          posted_by?: string | null;
          company_id?: string | null;
          company_name?: string;
          origin_city?: string;
          origin_state?: string;
          origin_address?: string | null;
          origin_zip?: string | null;
          dest_city?: string;
          dest_state?: string;
          dest_address?: string | null;
          dest_zip?: string | null;
          pickup_date?: string;
          delivery_date?: string;
          equipment?: EquipmentType;
          commodity?: string;
          weight_lbs?: number;
          rate_usd?: number;
          rate_per_mile?: number | null;
          total_miles?: number | null;
          status?: LoadStatus;
          bid_count?: number;
          hazmat?: boolean;
          temp_controlled?: boolean;
          posted_at?: string;
          broker_credit_score?: number | null;
          assigned_driver_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      trucks: {
        Row: {
          id: string;
          posted_by: string | null;
          company_id: string | null;
          company_name: string;
          origin_city: string;
          origin_state: string;
          dest_city: string | null;
          dest_state: string | null;
          available_date: string;
          equipment: EquipmentType;
          length_ft: number | null;
          weight_capacity_lbs: number | null;
          driver_name: string | null;
          driver_phone: string | null;
          driver_id: string | null;
          status: TruckStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          posted_by?: string | null;
          company_id?: string | null;
          company_name: string;
          origin_city: string;
          origin_state: string;
          dest_city?: string | null;
          dest_state?: string | null;
          available_date: string;
          equipment: EquipmentType;
          length_ft?: number | null;
          weight_capacity_lbs?: number | null;
          driver_name?: string | null;
          driver_phone?: string | null;
          driver_id?: string | null;
          status?: TruckStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          posted_by?: string | null;
          company_id?: string | null;
          company_name?: string;
          origin_city?: string;
          origin_state?: string;
          dest_city?: string | null;
          dest_state?: string | null;
          available_date?: string;
          equipment?: EquipmentType;
          length_ft?: number | null;
          weight_capacity_lbs?: number | null;
          driver_name?: string | null;
          driver_phone?: string | null;
          driver_id?: string | null;
          status?: TruckStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          load_number: string | null;
          participant_a: string | null;
          participant_b: string | null;
          other_party: string;
          other_party_role: string;
          last_message: string | null;
          last_message_at: string;
          unread_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          load_number?: string | null;
          participant_a?: string | null;
          participant_b?: string | null;
          other_party: string;
          other_party_role: string;
          last_message?: string | null;
          last_message_at?: string;
          unread_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          load_number?: string | null;
          participant_a?: string | null;
          participant_b?: string | null;
          other_party?: string;
          other_party_role?: string;
          last_message?: string | null;
          last_message_at?: string;
          unread_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string | null;
          text: string;
          from_me: boolean;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id?: string | null;
          text: string;
          from_me?: boolean;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string | null;
          text?: string;
          from_me?: boolean;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      bids: {
        Row: {
          id: string;
          load_id: string;
          carrier_id: string;
          company_id: string | null;
          company_name: string;
          amount_usd: number;
          notes: string | null;
          status: BidStatus;
          parent_bid_id: string | null;
          round: number;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          load_id: string;
          carrier_id: string;
          company_id?: string | null;
          company_name?: string;
          amount_usd: number;
          notes?: string | null;
          status?: BidStatus;
          parent_bid_id?: string | null;
          round?: number;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: BidStatus;
          amount_usd?: number;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          load_id: string | null;
          company_id: string | null;
          uploaded_by: string;
          type: DocumentType;
          file_name: string;
          file_url: string;
          file_size_bytes: number | null;
          mime_type: string | null;
          signed_at: string | null;
          signature_url: string | null;
          signatory_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          load_id?: string | null;
          company_id?: string | null;
          uploaded_by: string;
          type: DocumentType;
          file_name: string;
          file_url: string;
          file_size_bytes?: number | null;
          mime_type?: string | null;
          signed_at?: string | null;
          signature_url?: string | null;
          signatory_name?: string | null;
          created_at?: string;
        };
        Update: {
          signed_at?: string | null;
          signature_url?: string | null;
          signatory_name?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          load_id: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body?: string | null;
          load_id?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          read?: boolean;
        };
        Relationships: [];
      };
      carrier_verifications: {
        Row: {
          id: string;
          company_id: string;
          mc_number: string | null;
          dot_number: string | null;
          fmcsa_status: string | null;
          fmcsa_verified_at: string | null;
          csa_score: number | null;
          safety_rating: string | null;
          insurance_carrier: string | null;
          insurance_policy: string | null;
          insurance_amount_usd: number | null;
          insurance_expires_at: string | null;
          insurance_cert_url: string | null;
          w9_url: string | null;
          w9_uploaded_at: string | null;
          status: VerificationStatus;
          verified_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          mc_number?: string | null;
          dot_number?: string | null;
          fmcsa_status?: string | null;
          fmcsa_verified_at?: string | null;
          csa_score?: number | null;
          safety_rating?: string | null;
          insurance_carrier?: string | null;
          insurance_policy?: string | null;
          insurance_amount_usd?: number | null;
          insurance_expires_at?: string | null;
          insurance_cert_url?: string | null;
          w9_url?: string | null;
          w9_uploaded_at?: string | null;
          status?: VerificationStatus;
          verified_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          mc_number?: string | null;
          dot_number?: string | null;
          fmcsa_status?: string | null;
          fmcsa_verified_at?: string | null;
          csa_score?: number | null;
          safety_rating?: string | null;
          insurance_carrier?: string | null;
          insurance_policy?: string | null;
          insurance_amount_usd?: number | null;
          insurance_expires_at?: string | null;
          insurance_cert_url?: string | null;
          w9_url?: string | null;
          w9_uploaded_at?: string | null;
          status?: VerificationStatus;
          verified_at?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      ratings: {
        Row: {
          id: string;
          load_id: string;
          rater_id: string;
          rated_company_id: string;
          overall: number;
          communication: number | null;
          reliability: number | null;
          professionalism: number | null;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          load_id: string;
          rater_id: string;
          rated_company_id: string;
          overall: number;
          communication?: number | null;
          reliability?: number | null;
          professionalism?: number | null;
          comment?: string | null;
          created_at?: string;
        };
        Update: { [_ in never]: never };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          company_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          tier: SubscriptionTier;
          status: SubscriptionStatus;
          current_period_start: string | null;
          current_period_end: string | null;
          trial_ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          tier?: SubscriptionTier;
          status?: SubscriptionStatus;
          current_period_start?: string | null;
          current_period_end?: string | null;
          trial_ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          tier?: SubscriptionTier;
          status?: SubscriptionStatus;
          current_period_start?: string | null;
          current_period_end?: string | null;
          trial_ends_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          load_id: string;
          broker_id: string;
          carrier_id: string;
          amount_usd: number;
          quick_pay_fee_usd: number | null;
          payment_method: PaymentMethod | null;
          stripe_payment_intent_id: string | null;
          stripe_transfer_id: string | null;
          status: InvoiceStatus;
          approved_at: string | null;
          paid_at: string | null;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          load_id: string;
          broker_id: string;
          carrier_id: string;
          amount_usd: number;
          quick_pay_fee_usd?: number | null;
          payment_method?: PaymentMethod | null;
          stripe_payment_intent_id?: string | null;
          stripe_transfer_id?: string | null;
          status?: InvoiceStatus;
          approved_at?: string | null;
          paid_at?: string | null;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          quick_pay_fee_usd?: number | null;
          payment_method?: PaymentMethod | null;
          stripe_payment_intent_id?: string | null;
          stripe_transfer_id?: string | null;
          status?: InvoiceStatus;
          approved_at?: string | null;
          paid_at?: string | null;
          due_date?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      location_pings: {
        Row: {
          id: string;
          load_number: string;
          driver_id: string | null;
          latitude: number;
          longitude: number;
          accuracy_m: number | null;
          heading_deg: number | null;
          speed_ms: number | null;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          load_number: string;
          driver_id?: string | null;
          latitude: number;
          longitude: number;
          accuracy_m?: number | null;
          heading_deg?: number | null;
          speed_ms?: number | null;
          recorded_at?: string;
        };
        Update: {
          accuracy_m?: number | null;
          heading_deg?: number | null;
          speed_ms?: number | null;
        };
        Relationships: [];
      };
      tracking_milestones: {
        Row: {
          id: string;
          load_number: string;
          label: string;
          location: string;
          milestone_timestamp: string | null;
          completed: boolean;
          current: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          load_number: string;
          label: string;
          location: string;
          milestone_timestamp?: string | null;
          completed?: boolean;
          current?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          load_number?: string;
          label?: string;
          location?: string;
          milestone_timestamp?: string | null;
          completed?: boolean;
          current?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      saved_searches: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          filters: Json;
          alert_enabled: boolean;
          last_alerted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          filters?: Json;
          alert_enabled?: boolean;
          last_alerted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          filters?: Json;
          alert_enabled?: boolean;
          last_alerted_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      rate_history: {
        Row: {
          id: string;
          lane_hash: string;
          origin_state: string;
          dest_state: string;
          equipment: string;
          rate_usd: number;
          total_miles: number | null;
          rate_per_mile: number | null;
          load_id: string | null;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          lane_hash: string;
          origin_state: string;
          dest_state: string;
          equipment: string;
          rate_usd: number;
          total_miles?: number | null;
          rate_per_mile?: number | null;
          load_id?: string | null;
          recorded_at?: string;
        };
        Update: {
          rate_usd?: number;
          total_miles?: number | null;
          rate_per_mile?: number | null;
        };
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          user_id: string;
          settings: Record<string, unknown>;
          phone_number: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          settings?: Record<string, unknown>;
          phone_number?: string | null;
          updated_at?: string;
        };
        Update: {
          settings?: Record<string, unknown>;
          phone_number?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      notification_queue: {
        Row: {
          id: string;
          type: string;
          recipient: string;
          subject: string | null;
          payload: Record<string, unknown>;
          status: string;
          attempts: number;
          max_attempts: number;
          next_retry_at: string;
          sent_at: string | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          recipient: string;
          subject?: string | null;
          payload?: Record<string, unknown>;
          status?: string;
          attempts?: number;
          max_attempts?: number;
          next_retry_at?: string;
          sent_at?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          status?: string;
          attempts?: number;
          next_retry_at?: string;
          sent_at?: string | null;
          error_message?: string | null;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      accept_bid: { Args: { bid_id: string }; Returns: void };
      book_now: { Args: { p_load_id: string }; Returns: void };
      increment_bid_count: { Args: { load_id: string }; Returns: void };
      enqueue_notification: {
        Args: {
          p_type: string;
          p_recipient: string;
          p_subject: string | null;
          p_payload: Record<string, unknown>;
        };
        Returns: string;
      };
      get_lane_stats: {
        Args: {
          p_origin_state: string;
          p_dest_state: string;
          p_equipment: string;
          p_days?: number;
        };
        Returns: {
          avg_rate_per_mile: number | null;
          min_rate_per_mile: number | null;
          max_rate_per_mile: number | null;
          sample_count: number;
          last_recorded_at: string | null;
        }[];
      };
      get_lane_trend: {
        Args: {
          p_origin_state: string;
          p_dest_state: string;
          p_equipment: string;
        };
        Returns: {
          day: string;
          avg_rate_per_mile: number;
        }[];
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

// Convenience row types
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type BidRow = Database['public']['Tables']['bids']['Row'];
export type DocumentRow = Database['public']['Tables']['documents']['Row'];
export type CompanyRow = Database['public']['Tables']['companies']['Row'];
export type LoadRow = Database['public']['Tables']['loads']['Row'];
export type TruckRow = Database['public']['Tables']['trucks']['Row'];
export type ConversationRow = Database['public']['Tables']['conversations']['Row'];
export type MessageRow = Database['public']['Tables']['messages']['Row'];
export type TrackingMilestoneRow = Database['public']['Tables']['tracking_milestones']['Row'];
export type CarrierVerificationRow = Database['public']['Tables']['carrier_verifications']['Row'];
export type RatingRow = Database['public']['Tables']['ratings']['Row'];
export type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row'];
export type InvoiceRow = Database['public']['Tables']['invoices']['Row'];
export type LocationPingRow = Database['public']['Tables']['location_pings']['Row'];
