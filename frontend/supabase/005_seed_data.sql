-- ============================================================
-- 005_seed_data.sql
-- Seeds initial data (subscription packages).
-- Run this AFTER 004_create_triggers.sql
-- ============================================================

-- =============================================
-- Subscription Packages
-- These match the MONTHLY_PLANS in src/lib/creditCosts.ts
-- =============================================
INSERT INTO public.subscription_packages (name, display_name, description, price, currency, credits_included, features, is_active)
VALUES
  (
    'free-trial',
    'Free Trial',
    '100 free credits for 7 days (new users only)',
    0,
    'USD',
    100,
    '["100 credits", "7-day trial period", "Full access to all features", "Upgrade anytime"]'::jsonb,
    true
  ),
  (
    'starter',
    'Starter',
    'Perfect for getting started',
    19,
    'USD',
    500,
    '["500 credits per month", "Basic support", "Email templates", "Call recording"]'::jsonb,
    true
  ),
  (
    'growth',
    'Growth',
    'For growing businesses',
    49,
    'USD',
    2000,
    '["2000 credits per month", "Priority support", "Advanced analytics", "Custom integrations", "API access"]'::jsonb,
    true
  ),
  (
    'pro',
    'Pro',
    'For professional teams',
    99,
    'USD',
    5000,
    '["5000 credits per month", "24/7 support", "Advanced AI features", "White-label options", "Dedicated account manager"]'::jsonb,
    true
  )
ON CONFLICT DO NOTHING;

-- =============================================
-- Credit Costs
-- Default costs for various actions
-- =============================================
INSERT INTO public.credit_costs (action_type, action_name, cost_per_unit, unit_description, is_active)
VALUES
  ('create_agent', 'Create Agent', 5, 'per agent', true),
  ('prompt_formatting', 'Prompt Formatting', 1, 'per formatting operation', true),
  ('prompt_generation', 'Prompt Generation', 2, 'per generation', true),
  ('generate_template', 'Generate Email Template', 1, 'per template', true),
  ('send_email', 'Send Email', 0.5, 'per email', true),
  ('import_emails', 'Import Emails', 5, 'per 100 emails', true),
  ('agent_call_runtime', 'Agent Call Runtime', 1, 'per minute', true)
ON CONFLICT (action_type) DO UPDATE
SET 
  action_name = EXCLUDED.action_name,
  cost_per_unit = EXCLUDED.cost_per_unit,
  unit_description = EXCLUDED.unit_description,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- ============================================================
-- DONE! Seed data is ready.
--
-- EXECUTION ORDER:
--   1. Run 001_drop_everything.sql    (drops all existing objects)
--   2. Run 002_create_schema.sql      (creates enums, tables, RLS)
--   3. Run 003_create_functions.sql   (creates all RPC functions)
--   4. Run 004_create_triggers.sql    (creates triggers)
--   5. Run 005_seed_data.sql          (seeds subscription packages and credit costs)
--
-- You can also run them all at once by copying the contents
-- of each file in order into the Supabase SQL Editor.
-- ============================================================
