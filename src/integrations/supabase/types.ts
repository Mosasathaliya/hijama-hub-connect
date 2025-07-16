export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      coupons: {
        Row: {
          created_at: string
          discount_type: string
          discount_value: number
          expiry_date: string
          id: string
          is_active: boolean
          max_uses: number
          referral_percentage: number
          referrer_name: string
          updated_at: string
          used_count: number
        }
        Insert: {
          created_at?: string
          discount_type: string
          discount_value: number
          expiry_date: string
          id?: string
          is_active?: boolean
          max_uses?: number
          referral_percentage?: number
          referrer_name: string
          updated_at?: string
          used_count?: number
        }
        Update: {
          created_at?: string
          discount_type?: string
          discount_value?: number
          expiry_date?: string
          id?: string
          is_active?: boolean
          max_uses?: number
          referral_percentage?: number
          referrer_name?: string
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      doctors: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          specialization: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          specialization?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          specialization?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      female_patients: {
        Row: {
          additional_notes: string | null
          allergies: string | null
          chief_complaint: string
          created_at: string
          current_medications: string | null
          date_of_birth: string | null
          doctor_id: string | null
          form_token: string
          id: string
          medical_history: string | null
          patient_email: string | null
          patient_name: string
          patient_phone: string
          preferred_appointment_date: string | null
          preferred_appointment_time: string | null
          status: string | null
          submitted_at: string
          updated_at: string
        }
        Insert: {
          additional_notes?: string | null
          allergies?: string | null
          chief_complaint: string
          created_at?: string
          current_medications?: string | null
          date_of_birth?: string | null
          doctor_id?: string | null
          form_token?: string
          id?: string
          medical_history?: string | null
          patient_email?: string | null
          patient_name: string
          patient_phone: string
          preferred_appointment_date?: string | null
          preferred_appointment_time?: string | null
          status?: string | null
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          additional_notes?: string | null
          allergies?: string | null
          chief_complaint?: string
          created_at?: string
          current_medications?: string | null
          date_of_birth?: string | null
          doctor_id?: string | null
          form_token?: string
          id?: string
          medical_history?: string | null
          patient_email?: string | null
          patient_name?: string
          patient_phone?: string
          preferred_appointment_date?: string | null
          preferred_appointment_time?: string | null
          status?: string | null
          submitted_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      hijama_cup_prices: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          number_of_cups: number
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          number_of_cups: number
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          number_of_cups?: number
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      hijama_readings: {
        Row: {
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          created_at: string
          hijama_points: Json | null
          id: string
          patient_id: string
          patient_table: string | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string
          hijama_points?: Json | null
          id?: string
          patient_id: string
          patient_table?: string | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string
          hijama_points?: Json | null
          id?: string
          patient_id?: string
          patient_table?: string | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: []
      }
      male_patients: {
        Row: {
          additional_notes: string | null
          allergies: string | null
          chief_complaint: string
          created_at: string
          current_medications: string | null
          date_of_birth: string | null
          doctor_id: string | null
          form_token: string
          id: string
          medical_history: string | null
          patient_email: string | null
          patient_name: string
          patient_phone: string
          preferred_appointment_date: string | null
          preferred_appointment_time: string | null
          status: string | null
          submitted_at: string
          updated_at: string
        }
        Insert: {
          additional_notes?: string | null
          allergies?: string | null
          chief_complaint: string
          created_at?: string
          current_medications?: string | null
          date_of_birth?: string | null
          doctor_id?: string | null
          form_token?: string
          id?: string
          medical_history?: string | null
          patient_email?: string | null
          patient_name: string
          patient_phone: string
          preferred_appointment_date?: string | null
          preferred_appointment_time?: string | null
          status?: string | null
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          additional_notes?: string | null
          allergies?: string | null
          chief_complaint?: string
          created_at?: string
          current_medications?: string | null
          date_of_birth?: string | null
          doctor_id?: string | null
          form_token?: string
          id?: string
          medical_history?: string | null
          patient_email?: string | null
          patient_name?: string
          patient_phone?: string
          preferred_appointment_date?: string | null
          preferred_appointment_time?: string | null
          status?: string | null
          submitted_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      patient_forms: {
        Row: {
          additional_notes: string | null
          allergies: string | null
          chief_complaint: string
          created_at: string
          current_medications: string | null
          date_of_birth: string | null
          doctor_id: string | null
          form_token: string
          gender: string | null
          id: string
          medical_history: string | null
          patient_email: string | null
          patient_name: string
          patient_phone: string
          preferred_appointment_date: string | null
          preferred_appointment_time: string | null
          status: string | null
          submitted_at: string
          updated_at: string
        }
        Insert: {
          additional_notes?: string | null
          allergies?: string | null
          chief_complaint: string
          created_at?: string
          current_medications?: string | null
          date_of_birth?: string | null
          doctor_id?: string | null
          form_token?: string
          gender?: string | null
          id?: string
          medical_history?: string | null
          patient_email?: string | null
          patient_name: string
          patient_phone: string
          preferred_appointment_date?: string | null
          preferred_appointment_time?: string | null
          status?: string | null
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          additional_notes?: string | null
          allergies?: string | null
          chief_complaint?: string
          created_at?: string
          current_medications?: string | null
          date_of_birth?: string | null
          doctor_id?: string | null
          form_token?: string
          gender?: string | null
          id?: string
          medical_history?: string | null
          patient_email?: string | null
          patient_name?: string
          patient_phone?: string
          preferred_appointment_date?: string | null
          preferred_appointment_time?: string | null
          status?: string | null
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_forms_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          coupon_id: string | null
          created_at: string
          doctor_id: string | null
          hijama_points_count: number
          id: string
          is_taxable: boolean
          paid_at: string | null
          patient_id: string
          patient_table: string | null
          payment_method: string | null
          payment_status: string
          updated_at: string
        }
        Insert: {
          amount: number
          coupon_id?: string | null
          created_at?: string
          doctor_id?: string | null
          hijama_points_count?: number
          id?: string
          is_taxable?: boolean
          paid_at?: string | null
          patient_id: string
          patient_table?: string | null
          payment_method?: string | null
          payment_status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          coupon_id?: string | null
          created_at?: string
          doctor_id?: string | null
          hijama_points_count?: number
          id?: string
          is_taxable?: boolean
          paid_at?: string | null
          patient_id?: string
          patient_table?: string | null
          payment_method?: string | null
          payment_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_conditions: {
        Row: {
          condition_name: string
          created_at: string
          id: string
          is_checked: boolean
          patient_form_id: string
          updated_at: string
        }
        Insert: {
          condition_name: string
          created_at?: string
          id?: string
          is_checked?: boolean
          patient_form_id: string
          updated_at?: string
        }
        Update: {
          condition_name?: string
          created_at?: string
          id?: string
          is_checked?: boolean
          patient_form_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_conditions_patient_form_id_fkey"
            columns: ["patient_form_id"]
            isOneToOne: false
            referencedRelation: "patient_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activities: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          section_name: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          section_name: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          section_name?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          created_at: string
          id: string
          permission_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          access_code: string
          created_at: string
          id: string
          is_active: boolean
          updated_at: string
          username: string
        }
        Insert: {
          access_code: string
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          username: string
        }
        Update: {
          access_code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          username?: string
        }
        Relationships: []
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
