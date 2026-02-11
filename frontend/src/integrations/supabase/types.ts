export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      activity_logs: {
        Row: {
          id: string;
          user_id: string;
          activity_type: Database["public"]["Enums"]["activity_type"];
          entity_type: string | null;
          entity_id: string | null;
          description: string;
          metadata: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_type: Database["public"]["Enums"]["activity_type"];
          entity_type?: string | null;
          entity_id?: string | null;
          description: string;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_type?: Database["public"]["Enums"]["activity_type"];
          entity_type?: string | null;
          entity_id?: string | null;
          description?: string;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      ai_prompts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: string;
          system_prompt: string;
          begin_message: string | null;
          state_prompts: Json;
          tools_config: Json;
          is_active: boolean;
          is_template: boolean;
          usage_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          category?: string;
          system_prompt: string;
          begin_message?: string | null;
          state_prompts?: Json;
          tools_config?: Json;
          is_active?: boolean;
          is_template?: boolean;
          usage_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          category?: string;
          system_prompt?: string;
          begin_message?: string | null;
          state_prompts?: Json;
          tools_config?: Json;
          is_active?: boolean;
          is_template?: boolean;
          usage_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bots: {
        Row: {
          bot_config: Json | null;
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          name: string;
          retell_agent_id: string;
          updated_at: string;
          user_id: string;
          voice_settings: Json | null;
          retell_llm_id: string | null;
          modal: string | null;
          general_prompt: string | null;
          begin_messgae: string | null;
          agent_number: string | null;
          Transfer_to: string | null;
        };
        Insert: {
          bot_config?: Json | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          retell_agent_id: string;
          updated_at?: string;
          user_id: string;
          voice_settings?: Json | null;
          retell_llm_id?: string | null;
          modal?: string | null;
          general_prompt?: string | null;
          begin_messgae?: string | null;
          agent_number?: string | null;
          Transfer_to?: string | null;
        };
        Update: {
          bot_config?: Json | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          retell_agent_id?: string;
          updated_at?: string;
          user_id?: string;
          voice_settings?: Json | null;
          retell_llm_id?: string | null;
          modal?: string | null;
          general_prompt?: string | null;
          begin_messgae?: string | null;
          agent_number?: string | null;
          Transfer_to?: string | null;
        };
        Relationships: [];
      };
      call_analytics: {
        Row: {
          id: string;
          call_id: string;
          user_id: string;
          sentiment: "positive" | "neutral" | "negative" | null;
          is_lead: boolean;
          lead_quality_score: number | null;
          conversation_topics: string[] | null;
          user_intent: string | null;
          agent_performance_score: number | null;
          voicemail_detected: boolean;
          transfer_occurred: boolean;
          key_phrases: Json;
          call_outcome: string | null;
          ai_analysis_data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          call_id: string;
          user_id: string;
          sentiment?: "positive" | "neutral" | "negative" | null;
          is_lead?: boolean;
          lead_quality_score?: number | null;
          conversation_topics?: string[] | null;
          user_intent?: string | null;
          agent_performance_score?: number | null;
          voicemail_detected?: boolean;
          transfer_occurred?: boolean;
          key_phrases?: Json;
          call_outcome?: string | null;
          ai_analysis_data?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          call_id?: string;
          user_id?: string;
          sentiment?: "positive" | "neutral" | "negative" | null;
          is_lead?: boolean;
          lead_quality_score?: number | null;
          conversation_topics?: string[] | null;
          user_intent?: string | null;
          agent_performance_score?: number | null;
          voicemail_detected?: boolean;
          transfer_occurred?: boolean;
          key_phrases?: Json;
          call_outcome?: string | null;
          ai_analysis_data?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "call_analytics_call_id_fkey";
            columns: ["call_id"];
            isOneToOne: true;
            referencedRelation: "calls";
            referencedColumns: ["id"];
          }
        ];
      };
      calls: {
        Row: {
          batch_call_id: string | null;
          bot_id: string | null;
          completed_at: string | null;
          contact_name: string | null;
          created_at: string;
          duration_seconds: number | null;
          error_message: string | null;
          id: string;
          metadata: Json | null;
          phone_number: string;
          recording_url: string | null;
          started_at: string | null;
          status: Database["public"]["Enums"]["call_status"];
          transcript: string | null;
          user_id: string;
          webhook_response: Json | null;
          Lead_status: string | null;
        };
        Insert: {
          batch_call_id?: string | null;
          bot_id?: string | null;
          completed_at?: string | null;
          contact_name?: string | null;
          created_at?: string;
          duration_seconds?: number | null;
          error_message?: string | null;
          id?: string;
          metadata?: Json | null;
          phone_number: string;
          recording_url?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["call_status"];
          transcript?: string | null;
          user_id: string;
          webhook_response?: Json | null;
          Lead_status?: string | null;
        };
        Update: {
          batch_call_id?: string | null;
          bot_id?: string | null;
          completed_at?: string | null;
          contact_name?: string | null;
          created_at?: string;
          duration_seconds?: number | null;
          error_message?: string | null;
          id?: string;
          metadata?: Json | null;
          phone_number?: string;
          recording_url?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["call_status"];
          transcript?: string | null;
          user_id?: string;
          webhook_response?: Json | null;
          Lead_status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "calls_bot_id_fkey";
            columns: ["bot_id"];
            isOneToOne: false;
            referencedRelation: "bots";
            referencedColumns: ["id"];
          }
        ];
      };
      credit_usage_logs: {
        Row: {
          id: string;
          user_id: string;
          transaction_id: string | null;
          call_id: string | null;
          usage_type: "call" | "sms" | "ai_analysis" | "phone_number_rental" | "other";
          amount_used: number;
          duration_seconds: number | null;
          rate_per_minute: number | null;
          cost_breakdown: Json;
          balance_before: number | null;
          balance_after: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          transaction_id?: string | null;
          call_id?: string | null;
          usage_type: "call" | "sms" | "ai_analysis" | "phone_number_rental" | "other";
          amount_used: number;
          duration_seconds?: number | null;
          rate_per_minute?: number | null;
          cost_breakdown?: Json;
          balance_before?: number | null;
          balance_after?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          transaction_id?: string | null;
          call_id?: string | null;
          usage_type?: "call" | "sms" | "ai_analysis" | "phone_number_rental" | "other";
          amount_used?: number;
          duration_seconds?: number | null;
          rate_per_minute?: number | null;
          cost_breakdown?: Json;
          balance_before?: number | null;
          balance_after?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credit_usage_logs_call_id_fkey";
            columns: ["call_id"];
            isOneToOne: false;
            referencedRelation: "calls";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_usage_logs_transaction_id_fkey";
            columns: ["transaction_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          }
        ];
      };
      email_automation_rules: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          trigger_type: "lead_created" | "call_ended" | "call_completed" | "no_response" | "high_quality_lead";
          conditions: Json;
          template_id: string | null;
          delay_minutes: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          trigger_type: "lead_created" | "call_ended" | "call_completed" | "no_response" | "high_quality_lead";
          conditions?: Json;
          template_id?: string | null;
          delay_minutes?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          trigger_type?: "lead_created" | "call_ended" | "call_completed" | "no_response" | "high_quality_lead";
          conditions?: Json;
          template_id?: string | null;
          delay_minutes?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "email_automation_rules_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "email_templates";
            referencedColumns: ["id"];
          }
        ];
      };
      email_sent_logs: {
        Row: {
          id: string;
          user_id: string;
          from_email: string;
          to_email: string;
          to_phone_number: string | null;
          subject: string;
          body: string;
          call_id: string | null;
          status: "pending" | "sent" | "failed" | "bounced" | null;
          error_message: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          from_email: string;
          to_email: string;
          to_phone_number?: string | null;
          subject: string;
          body: string;
          call_id?: string | null;
          status?: "pending" | "sent" | "failed" | "bounced" | null;
          error_message?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          from_email?: string;
          to_email?: string;
          to_phone_number?: string | null;
          subject?: string;
          body?: string;
          call_id?: string | null;
          status?: "pending" | "sent" | "failed" | "bounced" | null;
          error_message?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "email_sent_logs_call_id_fkey";
            columns: ["call_id"];
            isOneToOne: false;
            referencedRelation: "calls";
            referencedColumns: ["id"];
          }
        ];
      };
      email_templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          subject: string;
          body: string;
          description: string | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          subject: string;
          body: string;
          description?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          subject?: string;
          body?: string;
          description?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      imported_phone_numbers: {
        Row: {
          id: string;
          user_id: string;
          phone_number: string;
          termination_uri: string | null;
          status: "active" | "inactive" | "pending";
          imported_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          phone_number: string;
          termination_uri?: string | null;
          status?: "active" | "inactive" | "pending";
          imported_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          phone_number?: string;
          termination_uri?: string | null;
          status?: "active" | "inactive" | "pending";
          imported_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      knowledge_bases: {
        Row: {
          id: string;
          user_id: string;
          knowledge_base_id: string | null;
          knowledge_base_name: string;
          status: string;
          knowledge_base_texts: Json;
          knowledge_base_urls: string[] | null;
          enable_auto_refresh: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          knowledge_base_id?: string | null;
          knowledge_base_name: string;
          status?: string;
          knowledge_base_texts?: Json;
          knowledge_base_urls?: string[] | null;
          enable_auto_refresh?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          knowledge_base_id?: string | null;
          knowledge_base_name?: string;
          status?: string;
          knowledge_base_texts?: Json;
          knowledge_base_urls?: string[] | null;
          enable_auto_refresh?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: Database["public"]["Enums"]["notification_type"];
          title: string;
          message: string;
          read: boolean;
          metadata: Json;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type?: Database["public"]["Enums"]["notification_type"];
          title: string;
          message: string;
          read?: boolean;
          metadata?: Json;
          created_at?: string;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: Database["public"]["Enums"]["notification_type"];
          title?: string;
          message?: string;
          read?: boolean;
          metadata?: Json;
          created_at?: string;
          read_at?: string | null;
        };
        Relationships: [];
      };
      page_leads: {
        Row: {
          id: string;
          user_id: string;
          name: string | null;
          email: string | null;
          phone_number: string | null;
          address: string | null;
          bot_name: string | null;
          status: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string | null;
          email?: string | null;
          phone_number?: string | null;
          address?: string | null;
          bot_name?: string | null;
          status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string | null;
          email?: string | null;
          phone_number?: string | null;
          address?: string | null;
          bot_name?: string | null;
          status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          retell_api_key: string | null;
          timezone: string;
          updated_at: string;
          user_id: string;
          total_minutes_used: number | null;
          Total_credit: number | null;
          Remaning_credits: number | null;
          is_deactivated: boolean | null;
          deactivated_at: string | null;
          last_activity_at: string | null;
          payment_status: string | null;
          company_name: string | null;
          company_address: string | null;
          position: string | null;
          contact_info: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          retell_api_key?: string | null;
          timezone?: string;
          updated_at?: string;
          user_id: string;
          total_minutes_used?: number | null;
          Total_credit?: number | null;
          Remaning_credits?: number | null;
          is_deactivated?: boolean | null;
          deactivated_at?: string | null;
          last_activity_at?: string | null;
          payment_status?: string | null;
          company_name?: string | null;
          company_address?: string | null;
          position?: string | null;
          contact_info?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          retell_api_key?: string | null;
          timezone?: string;
          updated_at?: string;
          user_id?: string;
          total_minutes_used?: number | null;
          Total_credit?: number | null;
          Remaning_credits?: number | null;
          is_deactivated?: boolean | null;
          deactivated_at?: string | null;
          last_activity_at?: string | null;
          payment_status?: string | null;
          company_name?: string | null;
          company_address?: string | null;
          position?: string | null;
          contact_info?: string | null;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          wallet_id: string;
          amount: number;
          type: "credit" | "debit" | "refund" | "adjustment";
          description: string | null;
          reference_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          wallet_id: string;
          amount: number;
          type: "credit" | "debit" | "refund" | "adjustment";
          description?: string | null;
          reference_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          wallet_id?: string;
          amount?: number;
          type?: "credit" | "debit" | "refund" | "adjustment";
          description?: string | null;
          reference_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_wallet_id_fkey";
            columns: ["wallet_id"];
            isOneToOne: false;
            referencedRelation: "wallets";
            referencedColumns: ["id"];
          }
        ];
      };
      user_emails: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          name: string | null;
          smtp_password: string | null;
          is_primary: boolean;
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          name?: string | null;
          smtp_password?: string | null;
          is_primary?: boolean;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          name?: string | null;
          smtp_password?: string | null;
          is_primary?: boolean;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      wallets: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          balance?: number;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          balance?: number;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscription_packages: {
        Row: {
          id: string;
          name: string;
          display_name: string;
          description: string | null;
          price: number;
          currency: string;
          credits_included: number;
          features: Json | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          display_name: string;
          description?: string | null;
          price: number;
          currency?: string;
          credits_included?: number;
          features?: Json | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          display_name?: string;
          description?: string | null;
          price?: number;
          currency?: string;
          credits_included?: number;
          features?: Json | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          user_id: string;
          package_id: string | null;
          package_name: string;
          amount: number;
          currency: string;
          status: string;
          invoice_number: string;
          payment_method: string | null;
          payment_reference: string | null;
          paid_at: string | null;
          due_date: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          package_id?: string | null;
          package_name: string;
          amount: number;
          currency?: string;
          status?: string;
          invoice_number: string;
          payment_method?: string | null;
          payment_reference?: string | null;
          paid_at?: string | null;
          due_date?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          package_id?: string | null;
          package_name?: string;
          amount?: number;
          currency?: string;
          status?: string;
          invoice_number?: string;
          payment_method?: string | null;
          payment_reference?: string | null;
          paid_at?: string | null;
          due_date?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          package_id: string;
          package_name: string;
          status: string;
          started_at: string;
          expires_at: string | null;
          cancelled_at: string | null;
          invoice_id: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          package_id: string;
          package_name: string;
          status?: string;
          started_at?: string;
          expires_at?: string | null;
          cancelled_at?: string | null;
          invoice_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          package_id?: string;
          package_name?: string;
          status?: string;
          started_at?: string;
          expires_at?: string | null;
          cancelled_at?: string | null;
          invoice_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_credits: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_description?: string;
          p_reference_id?: string;
        };
        Returns: string;
      };
      deactivate_account: {
        Args: {
          p_user_id: string;
        };
        Returns: void;
      };
      deduct_call_credits: {
        Args: {
          p_user_id: string;
          p_call_id: string;
          p_duration_seconds: number;
          p_cost_breakdown?: Json;
        };
        Returns: Json;
      };
      reactivate_account: {
        Args: {
          p_user_id: string;
        };
        Returns: void;
      };
      create_invoice: {
        Args: {
          p_user_id: string;
          p_package_id: string;
          p_package_name: string;
          p_amount: number;
          p_currency?: string;
        };
        Returns: string;
      };
      mark_invoice_paid: {
        Args: {
          p_invoice_id: string;
          p_payment_method?: string;
          p_payment_reference?: string;
        };
        Returns: boolean;
      };
      send_email: {
        Args: {
          p_from: string;
          p_to: string[];
          p_subject: string;
          p_html: string;
          p_reply_to?: string | null;
        };
        Returns: Json;
      };
    };
    Enums: {
      activity_type:
        | "bot_created"
        | "bot_updated"
        | "bot_deleted"
        | "call_started"
        | "call_completed"
        | "call_failed"
        | "credit_added"
        | "credit_used"
        | "template_created"
        | "template_updated"
        | "account_login"
        | "lead_created"
        | "email_sent"
        | "settings_changed";
      call_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "failed"
        | "not_connected"
        | "night_time_dont_call";
      notification_type: "info" | "success" | "warning" | "error" | "system";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      activity_type: [
        "bot_created",
        "bot_updated",
        "bot_deleted",
        "call_started",
        "call_completed",
        "call_failed",
        "credit_added",
        "credit_used",
        "template_created",
        "template_updated",
        "account_login",
        "lead_created",
        "email_sent",
      ],
      call_status: [
        "pending",
        "in_progress",
        "completed",
        "failed",
        "not_connected",
        "night_time_dont_call",
      ],
      notification_type: ["info", "success", "warning", "error", "system"],
    },
  },
} as const;
