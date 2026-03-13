export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
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
          verified_status: 'unverified' | 'pending' | 'verified' | 'rejected'
          role: 'user' | 'admin'
          is_lister: boolean
          rejection_reason: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string; email: string }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      verification_images: {
        Row: {
          id: string
          user_id: string
          image_type: 'license_front' | 'license_back' | 'national_id_front' | 'national_id_back' | 'selfie_with_id' | 'selfie'
          storage_path: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['verification_images']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['verification_images']['Row']>
      }
      car_brands: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['car_brands']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['car_brands']['Row']>
      }
      car_models: {
        Row: {
          id: string
          brand_id: string
          name: string
          body_type: 'sedan' | 'suv' | 'hatchback' | 'van' | 'pickup' | 'coupe' | 'convertible' | 'wagon' | 'mpv'
          seats: number
          fuel_type: 'gasoline' | 'diesel' | 'electric' | 'hybrid'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['car_models']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['car_models']['Row']>
      }
      cars: {
        Row: {
          id: string
          owner_id: string
          model_id: string
          plate_number: string
          mileage: number | null
          price_per_day: number
          location: string | null
          additional_info: string | null
          status: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive'
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['cars']['Row'], 'id' | 'created_at' | 'updated_at' | 'status'>
        Update: Partial<Database['public']['Tables']['cars']['Row']>
      }
      car_images: {
        Row: {
          id: string
          car_id: string
          storage_path: string
          is_primary: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['car_images']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['car_images']['Row']>
      }
      car_documents: {
        Row: {
          id: string
          car_id: string
          document_type: 'orcr' | 'rental_agreement'
          storage_path: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['car_documents']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['car_documents']['Row']>
      }
      bookings: {
        Row: {
          id: string
          car_id: string
          renter_id: string
          owner_id: string
          start_date: string
          end_date: string
          total_days: number
          base_price: number
          commission: number
          total_price: number
          downpayment_amount: number
          balance_amount: number
          status: string
          owner_response_deadline: string | null
          payment_deadline: string | null
          renter_completed: boolean
          owner_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['bookings']['Row']>
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          amount: number
          payment_type: 'downpayment' | 'balance' | 'payout' | 'refund'
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
          transaction_id: string | null
          payment_method: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['payments']['Row']>
      }
      audit_log: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          details: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_log']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['audit_log']['Row']>
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_type: 'basic' | 'premium'
          additional_slots: number
          start_date: string
          end_date: string | null
          status: 'active' | 'expired' | 'cancelled'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['subscriptions']['Row']>
      }
    }
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

// Extended types with joins
export interface CarWithDetails extends Car {
  car_models: CarModel & { car_brands: CarBrand }
  car_images: CarImage[]
  profiles: Pick<Profile, 'full_name' | 'phone' | 'email'>
}

export interface BookingWithDetails extends Booking {
  cars: CarWithDetails
  renter: Profile
  owner: Profile
}
