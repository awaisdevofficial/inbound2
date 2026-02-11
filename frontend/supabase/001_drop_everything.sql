-- ============================================================
-- 001_drop_everything.sql
-- Drops ALL existing database objects (functions, triggers,
-- policies, tables, types, enums) from the public schema.
-- Run this FIRST before running the schema creation script.
-- ============================================================

-- =====================
-- 1. DROP ALL TRIGGERS
-- =====================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT trigger_name, event_object_table
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
  ) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I CASCADE;', r.trigger_name, r.event_object_table);
  END LOOP;
END $$;

-- =====================
-- 2. DROP ALL FUNCTIONS
-- =====================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT ns.nspname AS schema_name,
           p.proname AS function_name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace ns ON p.pronamespace = ns.oid
    WHERE ns.nspname = 'public'
      AND p.prokind IN ('f', 'p')  -- functions and procedures
  ) LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE;', r.function_name, r.args);
  END LOOP;
END $$;

-- =====================
-- 3. DROP ALL POLICIES
-- =====================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', r.policyname, r.tablename);
  END LOOP;
END $$;

-- =====================
-- 4. DISABLE RLS ON ALL TABLES (before dropping)
-- =====================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY;', r.tablename);
  END LOOP;
END $$;

-- =====================
-- 5. DROP ALL TABLES (CASCADE)
-- =====================
DROP TABLE IF EXISTS public.email_automation_rules CASCADE;
DROP TABLE IF EXISTS public.email_sent_logs CASCADE;
DROP TABLE IF EXISTS public.email_templates CASCADE;
DROP TABLE IF EXISTS public.call_analytics CASCADE;
DROP TABLE IF EXISTS public.credit_usage_logs CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.calls CASCADE;
DROP TABLE IF EXISTS public.bots CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.ai_prompts CASCADE;
DROP TABLE IF EXISTS public.imported_phone_numbers CASCADE;
DROP TABLE IF EXISTS public.knowledge_bases CASCADE;
DROP TABLE IF EXISTS public.page_leads CASCADE;
DROP TABLE IF EXISTS public.user_emails CASCADE;
DROP TABLE IF EXISTS public.user_subscriptions CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.subscription_packages CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- =====================
-- 6. DROP ALL CUSTOM TYPES / ENUMS
-- =====================
DROP TYPE IF EXISTS public.call_status CASCADE;
DROP TYPE IF EXISTS public.activity_type CASCADE;
DROP TYPE IF EXISTS public.notification_type CASCADE;
DROP TYPE IF EXISTS public.transaction_type CASCADE;
DROP TYPE IF EXISTS public.usage_type CASCADE;
DROP TYPE IF EXISTS public.email_status CASCADE;
DROP TYPE IF EXISTS public.phone_number_status CASCADE;
DROP TYPE IF EXISTS public.email_trigger_type CASCADE;
DROP TYPE IF EXISTS public.sentiment_type CASCADE;

-- =====================
-- 7. CLEAN UP ANY REMAINING CUSTOM TYPES
-- =====================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT t.typname
    FROM pg_type t
    JOIN pg_namespace ns ON t.typnamespace = ns.oid
    WHERE ns.nspname = 'public'
      AND t.typtype = 'e'  -- enum types
  ) LOOP
    EXECUTE format('DROP TYPE IF EXISTS public.%I CASCADE;', r.typname);
  END LOOP;
END $$;

-- Done! All public schema objects have been dropped.
-- Now run 002_create_schema.sql to recreate everything.
