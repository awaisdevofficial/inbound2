-- ============================================================
-- 002_create_schema.sql
-- Creates ALL enums, tables, indexes, and RLS policies.
-- Run this AFTER 001_drop_everything.sql
-- ============================================================

-- =====================
-- 0. ENABLE EXTENSIONS
-- =====================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================
-- 1. CREATE ENUMS
-- =====================

-- Call status enum
CREATE TYPE public.call_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'failed',
  'not_connected',
  'night_time_dont_call'
);

-- Activity type enum (comprehensive — covers both DB-side and code-side values)
CREATE TYPE public.activity_type AS ENUM (
  -- Bot / Agent operations
  'bot_created',
  'bot_updated',
  'bot_deleted',
  'agent_created',
  'agent_updated',
  'agent_deleted',
  'agent_activated',
  'agent_deactivated',
  -- Call operations
  'call_started',
  'call_completed',
  'call_failed',
  -- Credit operations
  'credit_added',
  'credit_used',
  -- Template operations
  'template_created',
  'template_updated',
  -- Account operations
  'account_login',
  'account_deactivated',
  'account_reactivated',
  'profile_updated',
  'password_changed',
  'settings_changed',
  'settings_updated',
  'billing_updated',
  -- Knowledge base operations
  'knowledge_base_created',
  'knowledge_base_updated',
  'knowledge_base_deleted',
  -- Phone number operations
  'phone_number_imported',
  'phone_number_removed',
  -- Lead & email operations
  'lead_created',
  'email_sent'
);

-- Notification type enum (includes extra types the code defines)
CREATE TYPE public.notification_type AS ENUM (
  'info',
  'success',
  'warning',
  'error',
  'system',
  'billing',
  'agent',
  'call'
);

-- Transaction type enum
CREATE TYPE public.transaction_type AS ENUM (
  'credit',
  'debit',
  'refund',
  'adjustment'
);

-- Usage type enum
CREATE TYPE public.usage_type AS ENUM (
  'call',
  'sms',
  'ai_analysis',
  'phone_number_rental',
  'other'
);

-- Email status enum
CREATE TYPE public.email_status AS ENUM (
  'pending',
  'sent',
  'failed',
  'bounced'
);

-- Phone number status enum
CREATE TYPE public.phone_number_status AS ENUM (
  'active',
  'inactive',
  'pending'
);

-- Email automation trigger type enum
CREATE TYPE public.email_trigger_type AS ENUM (
  'lead_created',
  'call_ended',
  'call_completed',
  'no_response',
  'high_quality_lead'
);

-- Sentiment type enum
CREATE TYPE public.sentiment_type AS ENUM (
  'positive',
  'neutral',
  'negative'
);

-- =====================
-- 2. CREATE TABLES
-- =====================

-- ----- profiles -----
CREATE TABLE public.profiles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text,
  full_name     text,
  avatar_url    text,
  timezone      text NOT NULL DEFAULT 'UTC',
  retell_api_key text,
  -- Credit & usage fields
  total_minutes_used  numeric DEFAULT 0,
  "Total_credit"      numeric DEFAULT 0,
  "Remaning_credits"  numeric DEFAULT 0,
  -- Account status
  is_deactivated      boolean DEFAULT false,
  deactivated_at      timestamptz,
  last_activity_at    timestamptz,
  payment_status      text DEFAULT 'unpaid',
  -- Trial
  trial_credits_expires_at timestamptz,
  -- KYC verification fields
  kyc_status            text,                -- 'pending' | 'verified' | 'rejected'
  passport_url          text,
  id_document_url       text,
  kyc_other_documents   jsonb DEFAULT '[]'::jsonb,
  kyc_submitted_at      timestamptz,
  kyc_verified_at       timestamptz,
  -- Two-factor authentication
  two_factor_enabled      boolean DEFAULT false,
  two_factor_secret       text,
  two_factor_backup_codes jsonb,             -- string array stored as jsonb
  -- Phone verification
  phone_number                text,
  phone_verified              boolean DEFAULT false,
  phone_verification_code     text,
  phone_verification_sent_at  timestamptz,
  -- Company information
  company_name     text,
  company_address  text,
  position         text,
  contact_info     text,
  -- Deactivation verification
  deactivation_code            text,
  deactivation_code_expires_at timestamptz,
  deactivation_reason          text,
  -- Timestamps
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- ----- bots -----
CREATE TABLE public.bots (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text NOT NULL,
  retell_agent_id text NOT NULL,
  is_active       boolean DEFAULT true,
  description     text,
  voice_settings  jsonb,
  bot_config      jsonb,
  retell_llm_id   text,
  modal           text,               -- model name (legacy typo column name)
  general_prompt  text,
  begin_messgae   text,               -- begin message (legacy typo column name)
  agent_number    text,               -- incoming phone number assigned
  "Transfer_to"   text,               -- transfer destination
  is_inbound      boolean,            -- whether this is an inbound agent
  "Agent_role"    text,               -- role label e.g. "Inbound"
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bots_user_id ON public.bots(user_id);
CREATE INDEX idx_bots_retell_agent_id ON public.bots(retell_agent_id);

-- ----- calls -----
CREATE TABLE public.calls (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_id           uuid REFERENCES public.bots(id) ON DELETE SET NULL,
  phone_number     text NOT NULL,
  contact_name     text,
  status           public.call_status DEFAULT 'pending',
  duration_seconds integer,
  transcript       text,
  recording_url    text,
  metadata         jsonb,
  webhook_response jsonb,
  error_message    text,
  batch_call_id    text,
  "Lead_status"    text,              -- "Yes" or "No"
  started_at       timestamptz,
  completed_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_calls_user_id ON public.calls(user_id);
CREATE INDEX idx_calls_bot_id ON public.calls(bot_id);
CREATE INDEX idx_calls_status ON public.calls(status);
CREATE INDEX idx_calls_started_at ON public.calls(started_at DESC NULLS LAST);

-- ----- call_analytics -----
CREATE TABLE public.call_analytics (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id                uuid NOT NULL UNIQUE REFERENCES public.calls(id) ON DELETE CASCADE,
  user_id                uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sentiment              public.sentiment_type,
  is_lead                boolean DEFAULT false,
  lead_quality_score     integer,       -- 1-10
  conversation_topics    text[],
  user_intent            text,
  agent_performance_score integer,      -- 1-10
  voicemail_detected     boolean DEFAULT false,
  transfer_occurred      boolean DEFAULT false,
  key_phrases            jsonb DEFAULT '{}'::jsonb,
  call_outcome           text,
  ai_analysis_data       jsonb DEFAULT '{}'::jsonb,
  created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_call_analytics_call_id ON public.call_analytics(call_id);
CREATE INDEX idx_call_analytics_user_id ON public.call_analytics(user_id);

-- ----- wallets -----
CREATE TABLE public.wallets (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance    numeric NOT NULL DEFAULT 0,
  currency   text NOT NULL DEFAULT 'USD',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);

-- ----- transactions -----
CREATE TABLE public.transactions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id    uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  amount       numeric NOT NULL,
  type         public.transaction_type NOT NULL,
  description  text,
  reference_id text,
  metadata     jsonb DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_wallet_id ON public.transactions(wallet_id);

-- ----- credit_usage_logs -----
CREATE TABLE public.credit_usage_logs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id   uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  call_id          uuid REFERENCES public.calls(id) ON DELETE SET NULL,
  usage_type       public.usage_type NOT NULL,
  amount_used      numeric NOT NULL DEFAULT 0,
  duration_seconds integer,
  rate_per_minute  numeric,
  cost_breakdown   jsonb DEFAULT '{}'::jsonb,
  balance_before   numeric,
  balance_after    numeric,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ----- credit_costs -----
-- Stores the cost in credits for each action type
CREATE TABLE public.credit_costs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type      text NOT NULL UNIQUE,  -- e.g., 'create_agent', 'send_email', etc.
  action_name      text NOT NULL,          -- Human-readable name
  cost_per_unit    numeric NOT NULL DEFAULT 0,
  unit_description text,                   -- e.g., 'per agent', 'per email', 'per 100 emails'
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_costs_action_type ON public.credit_costs(action_type);
CREATE INDEX idx_credit_costs_is_active ON public.credit_costs(is_active);

CREATE INDEX idx_credit_usage_user_id ON public.credit_usage_logs(user_id);
CREATE INDEX idx_credit_usage_call_id ON public.credit_usage_logs(call_id);
CREATE INDEX idx_credit_usage_type ON public.credit_usage_logs(usage_type);

-- ----- activity_logs -----
CREATE TABLE public.activity_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type public.activity_type NOT NULL,
  entity_type   text,
  entity_id     text,
  description   text NOT NULL,
  metadata      jsonb DEFAULT '{}'::jsonb,
  ip_address    text,
  user_agent    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_type ON public.activity_logs(activity_type);
CREATE INDEX idx_activity_logs_created ON public.activity_logs(created_at DESC);

-- ----- notifications -----
CREATE TABLE public.notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       public.notification_type DEFAULT 'info',
  title      text NOT NULL,
  message    text NOT NULL,
  read       boolean DEFAULT false,
  metadata   jsonb DEFAULT '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE read = false;
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

-- ----- ai_prompts -----
CREATE TABLE public.ai_prompts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text NOT NULL,
  category      text NOT NULL DEFAULT 'general',
  system_prompt text NOT NULL,
  begin_message text,
  state_prompts jsonb DEFAULT '{}'::jsonb,
  tools_config  jsonb DEFAULT '{}'::jsonb,
  is_active     boolean DEFAULT true,
  is_template   boolean DEFAULT false,
  usage_count   integer DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_prompts_user_id ON public.ai_prompts(user_id);

-- ----- email_templates -----
CREATE TABLE public.email_templates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text NOT NULL,
  subject       text NOT NULL,
  body          text NOT NULL,
  description   text,
  is_default    boolean DEFAULT false,
  accent_color  text DEFAULT '#4F46E5',
  design_style  text DEFAULT 'modern',
  company_name  text DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_templates_user_id ON public.email_templates(user_id);

-- ----- email_sent_logs -----
CREATE TABLE public.email_sent_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_email      text NOT NULL,
  to_email        text NOT NULL,
  to_phone_number text,
  subject         text NOT NULL,
  body            text NOT NULL,
  call_id         uuid REFERENCES public.calls(id) ON DELETE SET NULL,
  status          public.email_status DEFAULT 'pending',
  error_message   text,
  sent_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_sent_user_id ON public.email_sent_logs(user_id);
CREATE INDEX idx_email_sent_call_id ON public.email_sent_logs(call_id);

-- ----- email_automation_rules -----
CREATE TABLE public.email_automation_rules (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text NOT NULL,
  trigger_type  public.email_trigger_type NOT NULL,
  conditions    jsonb DEFAULT '{}'::jsonb,
  template_id   uuid REFERENCES public.email_templates(id) ON DELETE SET NULL,
  delay_minutes integer DEFAULT 0,
  is_active     boolean DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_rules_user_id ON public.email_automation_rules(user_id);

-- ----- imported_phone_numbers -----
CREATE TABLE public.imported_phone_numbers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number    text NOT NULL,
  termination_uri text,
  status          public.phone_number_status DEFAULT 'pending',
  imported_at     timestamptz DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_phone_numbers_user_id ON public.imported_phone_numbers(user_id);

-- ----- knowledge_bases -----
CREATE TABLE public.knowledge_bases (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  knowledge_base_id     text,               -- Retell KB ID
  knowledge_base_name   text NOT NULL,
  status                text DEFAULT 'pending',
  knowledge_base_texts  jsonb DEFAULT '[]'::jsonb,
  knowledge_base_urls   text[],
  enable_auto_refresh   boolean DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_knowledge_bases_user_id ON public.knowledge_bases(user_id);

-- ----- page_leads -----
CREATE TABLE public.page_leads (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text,
  email        text,
  phone_number text,
  address      text,
  bot_name     text,
  status       text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_page_leads_user_id ON public.page_leads(user_id);

-- ----- user_emails -----
CREATE TABLE public.user_emails (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text NOT NULL,
  name          text,
  smtp_password text,
  is_primary    boolean DEFAULT false,
  is_verified   boolean DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_emails_user_id ON public.user_emails(user_id);
CREATE UNIQUE INDEX idx_user_emails_unique ON public.user_emails(user_id, email);

-- ----- subscription_packages -----
CREATE TABLE public.subscription_packages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  display_name    text NOT NULL,
  description     text,
  price           numeric NOT NULL,
  currency        text NOT NULL DEFAULT 'USD',
  credits_included numeric DEFAULT 0,
  features        jsonb,
  is_active       boolean DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ----- invoices -----
CREATE TABLE public.invoices (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id        uuid REFERENCES public.subscription_packages(id) ON DELETE SET NULL,
  package_name      text NOT NULL,
  amount            numeric NOT NULL,
  currency          text NOT NULL DEFAULT 'USD',
  status            text NOT NULL DEFAULT 'pending',
  invoice_number    text NOT NULL UNIQUE,
  payment_method    text,
  payment_reference text,
  paid_at           timestamptz,
  due_date          timestamptz,
  metadata          jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);

-- ----- user_subscriptions -----
CREATE TABLE public.user_subscriptions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id   uuid NOT NULL REFERENCES public.subscription_packages(id) ON DELETE CASCADE,
  package_name text NOT NULL,
  status       text NOT NULL DEFAULT 'active',
  started_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz,
  cancelled_at timestamptz,
  invoice_id   uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  metadata     jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.user_subscriptions(status);

-- =====================
-- 3. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- =====================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imported_phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- =====================
-- 4. CREATE RLS POLICIES
-- =====================

-- ===== profiles =====
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===== bots =====
CREATE POLICY "bots_select_own" ON public.bots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "bots_insert_own" ON public.bots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bots_update_own" ON public.bots
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bots_delete_own" ON public.bots
  FOR DELETE USING (auth.uid() = user_id);

-- ===== calls =====
CREATE POLICY "calls_select_own" ON public.calls
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "calls_insert_own" ON public.calls
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "calls_update_own" ON public.calls
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "calls_delete_own" ON public.calls
  FOR DELETE USING (auth.uid() = user_id);

-- ===== call_analytics =====
CREATE POLICY "call_analytics_select_own" ON public.call_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "call_analytics_insert_own" ON public.call_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "call_analytics_update_own" ON public.call_analytics
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===== wallets =====
CREATE POLICY "wallets_select_own" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "wallets_insert_own" ON public.wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wallets_update_own" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===== transactions =====
CREATE POLICY "transactions_select_own" ON public.transactions
  FOR SELECT USING (
    wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid())
  );

CREATE POLICY "transactions_insert_own" ON public.transactions
  FOR INSERT WITH CHECK (
    wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid())
  );

-- ===== credit_usage_logs =====
CREATE POLICY "credit_usage_select_own" ON public.credit_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "credit_usage_insert_own" ON public.credit_usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===== activity_logs =====
CREATE POLICY "activity_logs_select_own" ON public.activity_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "activity_logs_insert_own" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===== notifications =====
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_own" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===== ai_prompts =====
CREATE POLICY "ai_prompts_select_own" ON public.ai_prompts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ai_prompts_insert_own" ON public.ai_prompts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_prompts_update_own" ON public.ai_prompts
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_prompts_delete_own" ON public.ai_prompts
  FOR DELETE USING (auth.uid() = user_id);

-- ===== email_templates =====
CREATE POLICY "email_templates_select_own" ON public.email_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "email_templates_insert_own" ON public.email_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "email_templates_update_own" ON public.email_templates
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "email_templates_delete_own" ON public.email_templates
  FOR DELETE USING (auth.uid() = user_id);

-- ===== email_sent_logs =====
CREATE POLICY "email_sent_logs_select_own" ON public.email_sent_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "email_sent_logs_insert_own" ON public.email_sent_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "email_sent_logs_update_own" ON public.email_sent_logs
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===== email_automation_rules =====
CREATE POLICY "email_rules_select_own" ON public.email_automation_rules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "email_rules_insert_own" ON public.email_automation_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "email_rules_update_own" ON public.email_automation_rules
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "email_rules_delete_own" ON public.email_automation_rules
  FOR DELETE USING (auth.uid() = user_id);

-- ===== imported_phone_numbers =====
CREATE POLICY "phone_numbers_select_own" ON public.imported_phone_numbers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "phone_numbers_insert_own" ON public.imported_phone_numbers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "phone_numbers_update_own" ON public.imported_phone_numbers
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "phone_numbers_delete_own" ON public.imported_phone_numbers
  FOR DELETE USING (auth.uid() = user_id);

-- ===== knowledge_bases =====
CREATE POLICY "knowledge_bases_select_own" ON public.knowledge_bases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "knowledge_bases_insert_own" ON public.knowledge_bases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "knowledge_bases_update_own" ON public.knowledge_bases
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "knowledge_bases_delete_own" ON public.knowledge_bases
  FOR DELETE USING (auth.uid() = user_id);

-- ===== page_leads =====
CREATE POLICY "page_leads_select_own" ON public.page_leads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "page_leads_insert_own" ON public.page_leads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "page_leads_update_own" ON public.page_leads
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "page_leads_delete_own" ON public.page_leads
  FOR DELETE USING (auth.uid() = user_id);

-- ===== user_emails =====
CREATE POLICY "user_emails_select_own" ON public.user_emails
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_emails_insert_own" ON public.user_emails
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_emails_update_own" ON public.user_emails
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_emails_delete_own" ON public.user_emails
  FOR DELETE USING (auth.uid() = user_id);

-- ===== subscription_packages (read-only for all authenticated users) =====
CREATE POLICY "subscription_packages_select_all" ON public.subscription_packages
  FOR SELECT USING (true);  -- Anyone can read packages

-- ===== invoices =====
CREATE POLICY "invoices_select_own" ON public.invoices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "invoices_insert_own" ON public.invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "invoices_update_own" ON public.invoices
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===== user_subscriptions =====
CREATE POLICY "subscriptions_select_own" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "subscriptions_insert_own" ON public.user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subscriptions_update_own" ON public.user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===== credit_costs (read-only for all authenticated users) =====
CREATE POLICY "credit_costs_select_all" ON public.credit_costs
  FOR SELECT USING (is_active = true);  -- Anyone can read active costs

-- =====================
-- 5. GRANT REALTIME ACCESS
-- =====================
-- Enable realtime for tables that use postgres_changes subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_usage_logs;

-- Done! Tables, enums, indexes, and RLS policies are ready.
-- Now run 003_create_functions.sql to create all RPC functions.
