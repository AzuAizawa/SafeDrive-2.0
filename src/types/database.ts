export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          first_name: string | null
          middle_name: string | null
          last_name: string | null
          phone: string | null
          address: string | null
          birthday: string | null
          driver_license: string | null
          national_id: string | null
          verified_status: string
          role: string
          is_lister: boolean | null
          rejection_reason: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          first_name?: string | null
          middle_name?: string | null
          last_name?: string | null
          phone?: string | null
          address?: string | null
          birthday?: string | null
          driver_license?: string | null
          national_id?: string | null
          verified_status?: string
          role?: string
          is_lister?: boolean | null
          rejection_reason?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          first_name?: string | null
          middle_name?: string | null
          last_name?: string | null
          phone?: string | null
          address?: string | null
          birthday?: string | null
          driver_license?: string | null
          national_id?: string | null
          verified_status?: string
          role?: string
          is_lister?: boolean | null
          rejection_reason?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      verification_images: {
        Row: {
          id: string
          user_id: string
          image_type: string
          storage_path: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          image_type: string
          storage_path: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          image_type?: string
          storage_path?: string
          created_at?: string
        }
        Relationships: [{ foreignKeyName: "verification_images_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
      car_brands: {
        Row: { id: string; name: string; created_at: string }
        Insert: { id?: string; name: string; created_at?: string }
        Update: { id?: string; name?: string; created_at?: string }
        Relationships: []
      }
      car_models: {
        Row: { id: string; brand_id: string; name: string; body_type: string; seats: number; fuel_type: string; created_at: string }
        Insert: { id?: string; brand_id: string; name: string; body_type: string; seats?: number; fuel_type: string; created_at?: string }
        Update: { id?: string; brand_id?: string; name?: string; body_type?: string; seats?: number; fuel_type?: string; created_at?: string }
        Relationships: [{ foreignKeyName: "car_models_brand_id_fkey"; columns: ["brand_id"]; isOneToOne: false; referencedRelation: "car_brands"; referencedColumns: ["id"] }]
      }
      cars: {
        Row: {
          id: string; owner_id: string; model_id: string; plate_number: string
          mileage: number | null; price_per_day: number; location: string | null
          additional_info: string | null; contact_number: string | null
          status: string; rejection_reason: string | null
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; owner_id: string; model_id: string; plate_number: string
          mileage?: number | null; price_per_day: number; location?: string | null
          additional_info?: string | null; contact_number?: string | null
          status?: string; rejection_reason?: string | null
          created_at?: string; updated_at?: string
        }
        Update: {
          id?: string; owner_id?: string; model_id?: string; plate_number?: string
          mileage?: number | null; price_per_day?: number; location?: string | null
          additional_info?: string | null; contact_number?: string | null
          status?: string; rejection_reason?: string | null
          created_at?: string; updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "cars_model_id_fkey"; columns: ["model_id"]; isOneToOne: false; referencedRelation: "car_models"; referencedColumns: ["id"] },
          { foreignKeyName: "cars_owner_id_fkey"; columns: ["owner_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      car_images: {
        Row: { id: string; car_id: string; storage_path: string; is_primary: boolean | null; created_at: string }
        Insert: { id?: string; car_id: string; storage_path: string; is_primary?: boolean | null; created_at?: string }
        Update: { id?: string; car_id?: string; storage_path?: string; is_primary?: boolean | null; created_at?: string }
        Relationships: [{ foreignKeyName: "car_images_car_id_fkey"; columns: ["car_id"]; isOneToOne: false; referencedRelation: "cars"; referencedColumns: ["id"] }]
      }
      car_documents: {
        Row: { id: string; car_id: string; document_type: string; storage_path: string; created_at: string }
        Insert: { id?: string; car_id: string; document_type: string; storage_path: string; created_at?: string }
        Update: { id?: string; car_id?: string; document_type?: string; storage_path?: string; created_at?: string }
        Relationships: [{ foreignKeyName: "car_documents_car_id_fkey"; columns: ["car_id"]; isOneToOne: false; referencedRelation: "cars"; referencedColumns: ["id"] }]
      }
      bookings: {
        Row: {
          id: string; car_id: string; renter_id: string; owner_id: string
          start_date: string; end_date: string; total_days: number
          base_price: number; commission: number; total_price: number
          downpayment_amount: number; balance_amount: number
          status: string
          owner_response_deadline: string | null; payment_deadline: string | null
          paymongo_checkout_id: string | null; paymongo_balance_checkout_id: string | null
          renter_completed: boolean | null; owner_completed: boolean | null
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; car_id: string; renter_id: string; owner_id: string
          start_date: string; end_date: string; total_days: number
          base_price: number; commission: number; total_price: number
          downpayment_amount: number; balance_amount: number
          status?: string
          owner_response_deadline?: string | null; payment_deadline?: string | null
          paymongo_checkout_id?: string | null; paymongo_balance_checkout_id?: string | null
          renter_completed?: boolean | null; owner_completed?: boolean | null
          created_at?: string; updated_at?: string
        }
        Update: {
          id?: string; car_id?: string; renter_id?: string; owner_id?: string
          start_date?: string; end_date?: string; total_days?: number
          base_price?: number; commission?: number; total_price?: number
          downpayment_amount?: number; balance_amount?: number
          status?: string
          owner_response_deadline?: string | null; payment_deadline?: string | null
          paymongo_checkout_id?: string | null; paymongo_balance_checkout_id?: string | null
          renter_completed?: boolean | null; owner_completed?: boolean | null
          created_at?: string; updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "bookings_car_id_fkey"; columns: ["car_id"]; isOneToOne: false; referencedRelation: "cars"; referencedColumns: ["id"] },
          { foreignKeyName: "bookings_renter_id_fkey"; columns: ["renter_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "bookings_owner_id_fkey"; columns: ["owner_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      payments: {
        Row: {
          id: string; booking_id: string; amount: number
          payment_type: string; status: string
          transaction_id: string | null; payment_method: string | null
          notes: string | null; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; booking_id: string; amount: number
          payment_type: string; status?: string
          transaction_id?: string | null; payment_method?: string | null
          notes?: string | null; created_at?: string; updated_at?: string
        }
        Update: {
          id?: string; booking_id?: string; amount?: number
          payment_type?: string; status?: string
          transaction_id?: string | null; payment_method?: string | null
          notes?: string | null; created_at?: string; updated_at?: string
        }
        Relationships: [{ foreignKeyName: "payments_booking_id_fkey"; columns: ["booking_id"]; isOneToOne: false; referencedRelation: "bookings"; referencedColumns: ["id"] }]
      }
      audit_log: {
        Row: { id: string; user_id: string | null; action: string; entity_type: string | null; entity_id: string | null; details: Json | null; created_at: string }
        Insert: { id?: string; user_id?: string | null; action: string; entity_type?: string | null; entity_id?: string | null; details?: Json | null; created_at?: string }
        Update: { id?: string; user_id?: string | null; action?: string; entity_type?: string | null; entity_id?: string | null; details?: Json | null; created_at?: string }
        Relationships: [{ foreignKeyName: "audit_log_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
      subscriptions: {
        Row: { id: string; user_id: string; plan_type: string; additional_slots: number; start_date: string; end_date: string | null; status: string; created_at: string }
        Insert: { id?: string; user_id: string; plan_type?: string; additional_slots?: number; start_date?: string; end_date?: string | null; status?: string; created_at?: string }
        Update: { id?: string; user_id?: string; plan_type?: string; additional_slots?: number; start_date?: string; end_date?: string | null; status?: string; created_at?: string }
        Relationships: [{ foreignKeyName: "subscriptions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
      notifications: {
        Row: { id: string; user_id: string; title: string; message: string; type: string; read: boolean | null; link: string | null; created_at: string | null }
        Insert: { id?: string; user_id: string; title: string; message: string; type?: string; read?: boolean | null; link?: string | null; created_at?: string | null }
        Update: { id?: string; user_id?: string; title?: string; message?: string; type?: string; read?: boolean | null; link?: string | null; created_at?: string | null }
        Relationships: [{ foreignKeyName: "notifications_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      expire_timed_out_bookings: { Args: never; Returns: undefined }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

// Convenience type aliases
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Car = Database['public']['Tables']['cars']['Row']
export type CarBrand = Database['public']['Tables']['car_brands']['Row']
export type CarModel = Database['public']['Tables']['car_models']['Row']
export type CarImage = Database['public']['Tables']['car_images']['Row']
export type CarDocument = Database['public']['Tables']['car_documents']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type AuditLog = Database['public']['Tables']['audit_log']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type VerificationImage = Database['public']['Tables']['verification_images']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']

// Extended types with joins
export interface CarWithDetails extends Car {
  car_models: CarModel & { car_brands: CarBrand }
  car_images: CarImage[]
  car_documents?: CarDocument[]
  profiles: Pick<Profile, 'full_name' | 'phone' | 'email'>
}

export interface BookingWithDetails extends Booking {
  cars: CarWithDetails
  renter: Profile
  owner: Profile
}
