-- ============================================================
-- 010_add_page_leads_categorization.sql
-- Adds categorization and analysis columns to page_leads table
-- ============================================================

-- Add categorization and analysis columns
ALTER TABLE public.page_leads
ADD COLUMN IF NOT EXISTS call_type text,
ADD COLUMN IF NOT EXISTS call_id text,
ADD COLUMN IF NOT EXISTS lead_strength text,
ADD COLUMN IF NOT EXISTS intent_summary text,
ADD COLUMN IF NOT EXISTS call_summary text,
ADD COLUMN IF NOT EXISTS call_outcome text,
ADD COLUMN IF NOT EXISTS next_step_type text,
ADD COLUMN IF NOT EXISTS next_step_details text,
ADD COLUMN IF NOT EXISTS appointment_date text,
ADD COLUMN IF NOT EXISTS appointment_time text,
ADD COLUMN IF NOT EXISTS appointment_timezone text,
ADD COLUMN IF NOT EXISTS appointment_type text,
ADD COLUMN IF NOT EXISTS order_items jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS order_total text,
ADD COLUMN IF NOT EXISTS order_type text,
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS support_issue text,
ADD COLUMN IF NOT EXISTS resolution_provided boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sentiment text,
ADD COLUMN IF NOT EXISTS urgency_level text,
ADD COLUMN IF NOT EXISTS confidence_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS transcript text,
ADD COLUMN IF NOT EXISTS extracted_data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_lead boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS source text DEFAULT 'call',
ADD COLUMN IF NOT EXISTS last_call_at timestamptz;

-- Add indexes for filtering by category
CREATE INDEX IF NOT EXISTS idx_page_leads_call_type ON public.page_leads(call_type);
CREATE INDEX IF NOT EXISTS idx_page_leads_lead_strength ON public.page_leads(lead_strength);
CREATE INDEX IF NOT EXISTS idx_page_leads_is_lead ON public.page_leads(is_lead);
CREATE INDEX IF NOT EXISTS idx_page_leads_status ON public.page_leads(status);
CREATE INDEX IF NOT EXISTS idx_page_leads_call_id ON public.page_leads(call_id);
