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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      cows: {
        Row: {
          birth_date: string | null
          breed: string | null
          created_at: string
          health_status: string
          id: string
          last_milking_amount: number | null
          name: string
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          breed?: string | null
          created_at?: string
          health_status?: string
          id?: string
          last_milking_amount?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          breed?: string | null
          created_at?: string
          health_status?: string
          id?: string
          last_milking_amount?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      egg_records: {
        Row: {
          count: number
          created_at: string
          date: string
          id: string
          quality_grade: string | null
          updated_at: string
        }
        Insert: {
          count: number
          created_at?: string
          date?: string
          id?: string
          quality_grade?: string | null
          updated_at?: string
        }
        Update: {
          count?: number
          created_at?: string
          date?: string
          id?: string
          quality_grade?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      feed_inventory: {
        Row: {
          cost_per_unit: number | null
          created_at: string
          current_stock: number
          feed_type: string
          id: string
          reorder_level: number
          supplier: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          cost_per_unit?: number | null
          created_at?: string
          current_stock: number
          feed_type: string
          id?: string
          reorder_level: number
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          cost_per_unit?: number | null
          created_at?: string
          current_stock?: number
          feed_type?: string
          id?: string
          reorder_level?: number
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          created_at: string | null
          current_stock: number
          date: string
          id: string
          initial_stock: number
          notes: string | null
          product_type: string
          quantity_received: number
          shop_id: number
          spoilt_amount: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_stock: number
          date: string
          id?: string
          initial_stock: number
          notes?: string | null
          product_type: string
          quantity_received: number
          shop_id: number
          spoilt_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_stock?: number
          date?: string
          id?: string
          initial_stock?: number
          notes?: string | null
          product_type?: string
          quantity_received?: number
          shop_id?: number
          spoilt_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      milk_processing_records: {
        Row: {
          created_at: string
          date: string
          id: string
          mala_amount: number
          total_milk_used: number
          updated_at: string
          yoghurt_amount: number
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          mala_amount?: number
          total_milk_used?: number
          updated_at?: string
          yoghurt_amount?: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          mala_amount?: number
          total_milk_used?: number
          updated_at?: string
          yoghurt_amount?: number
        }
        Relationships: []
      }
      milk_records: {
        Row: {
          amount: number
          cow_id: string | null
          created_at: string
          date: string
          id: string
          milking_period: string | null
          milking_time: string | null
          quality_grade: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          cow_id?: string | null
          created_at?: string
          date?: string
          id?: string
          milking_period?: string | null
          milking_time?: string | null
          quality_grade?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          cow_id?: string | null
          created_at?: string
          date?: string
          id?: string
          milking_period?: string | null
          milking_time?: string | null
          quality_grade?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milk_records_cow_id_fkey"
            columns: ["cow_id"]
            isOneToOne: false
            referencedRelation: "cows"
            referencedColumns: ["id"]
          },
        ]
      }
      product_prices: {
        Row: {
          created_at: string
          effective_date: string
          id: string
          price: number
          product_type: string
          shop_id: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          effective_date?: string
          id?: string
          price: number
          product_type: string
          shop_id?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          effective_date?: string
          id?: string
          price?: number
          product_type?: string
          shop_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_prices_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          shop_id: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          shop_id?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          shop_id?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_records: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          product_type: string
          quantity: number
          shop_id: number | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          id?: string
          product_type: string
          quantity: number
          shop_id?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          product_type?: string
          quantity?: number
          shop_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_records_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          created_at: string
          id: number
          location: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          location?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          location?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      slaughter_records: {
        Row: {
          animal_type: string
          count: number
          created_at: string
          date: string
          id: string
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          animal_type?: string
          count: number
          created_at?: string
          date?: string
          id?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          animal_type?: string
          count?: number
          created_at?: string
          date?: string
          id?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      user_role: "farm_owner" | "farm_manager" | "shop_manager"
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
      user_role: ["farm_owner", "farm_manager", "shop_manager"],
    },
  },
} as const
