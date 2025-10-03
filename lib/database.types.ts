// Auto-generated types for Supabase database schema
// This file should be regenerated after schema changes using:
// supabase gen types typescript --local > lib/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          category_key: string
          display_name: string
          description: string | null
          icon: string | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_key: string
          display_name: string
          description?: string | null
          icon?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_key?: string
          display_name?: string
          description?: string | null
          icon?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      subcategories: {
        Row: {
          id: string
          category_id: string
          subcategory_key: string
          display_name: string
          description: string | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          subcategory_key: string
          display_name: string
          description?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          subcategory_key?: string
          display_name?: string
          description?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      prompt_templates: {
        Row: {
          id: string
          template_id: string
          subcategory_id: string | null
          name: string
          image_url: string
          prompt: string
          room_types: string[]
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          template_id: string
          subcategory_id?: string | null
          name: string
          image_url: string
          prompt: string
          room_types?: string[]
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          subcategory_id?: string | null
          name?: string
          image_url?: string
          prompt?: string
          room_types?: string[]
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          email: string | null
          display_name: string | null
          avatar_url: string | null
          subscription_tier: 'free' | 'pro' | 'premium' | 'business'
          role: 'admin' | 'editor' | 'user'
          credits: number
          revenue_cat_subscriber_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'pro' | 'premium' | 'business'
          role?: 'admin' | 'editor' | 'user'
          credits?: number
          revenue_cat_subscriber_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'pro' | 'premium' | 'business'
          role?: 'admin' | 'editor' | 'user'
          credits?: number
          revenue_cat_subscriber_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      admin_audit_log: {
        Row: {
          id: string
          admin_id: string
          action: string
          entity_type: string
          entity_id: string | null
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action: string
          entity_type: string
          entity_id?: string | null
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          action?: string
          entity_type?: string
          entity_id?: string | null
          details?: Json | null
          created_at?: string
        }
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          credits_amount: number
          transaction_type: string
          description: string | null
          generation_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          credits_amount: number
          transaction_type: string
          description?: string | null
          generation_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          credits_amount?: number
          transaction_type?: string
          description?: string | null
          generation_id?: string | null
          created_at?: string
        }
      }
      generations: {
        Row: {
          id: string
          user_id: string
          type: string
          prompt: string
          status: string
          credits_used: number
          output_image_url: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          prompt: string
          status?: string
          credits_used: number
          output_image_url?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          prompt?: string
          status?: string
          credits_used?: number
          output_image_url?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      templates_with_hierarchy: {
        Row: {
          id: string
          template_id: string
          name: string
          image_url: string
          prompt: string
          room_types: string[]
          display_order: number
          template_active: boolean
          created_at: string
          updated_at: string
          subcategory_id: string | null
          subcategory_key: string | null
          subcategory_name: string | null
          subcategory_order: number | null
          subcategory_active: boolean | null
          category_id: string | null
          category_key: string | null
          category_name: string | null
          category_icon: string | null
          category_order: number | null
          category_active: boolean | null
        }
      }
    }
    Functions: {
      add_credits: {
        Args: {
          user_id_param: string
          credits_amount: number
          transaction_type: string
          transaction_description?: string
        }
        Returns: boolean
      }
      deduct_credits: {
        Args: {
          user_id_param: string
          credits_amount: number
          transaction_type: string
          transaction_description?: string
          generation_id_param?: string
        }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          action_param: string
          entity_type_param: string
          entity_id_param?: string
          details_param?: Json
        }
        Returns: void
      }
    }
  }
}

// Helper types for application use
export type Category = Database['public']['Tables']['categories']['Row']
export type Subcategory = Database['public']['Tables']['subcategories']['Row']
export type PromptTemplate = Database['public']['Tables']['prompt_templates']['Row']
export type TemplateWithHierarchy = Database['public']['Views']['templates_with_hierarchy']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Generation = Database['public']['Tables']['generations']['Row']
export type CreditTransaction = Database['public']['Tables']['credit_transactions']['Row']
export type AdminAuditLog = Database['public']['Tables']['admin_audit_log']['Row']
