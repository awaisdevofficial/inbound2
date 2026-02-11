-- ============================================================
-- 009_add_call_analysis.sql
-- Adds AI analysis columns to calls table
-- ============================================================

-- Add analysis columns to calls table
ALTER TABLE public.calls
ADD COLUMN IF NOT EXISTS call_type text,
ADD COLUMN IF NOT EXISTS analyzed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS analysis jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS call_outcome text,
ADD COLUMN IF NOT EXISTS sentiment text,
ADD COLUMN IF NOT EXISTS urgency_level text,
ADD COLUMN IF NOT EXISTS confidence_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS intent_summary text,
ADD COLUMN IF NOT EXISTS call_summary text,
ADD COLUMN IF NOT EXISTS is_lead boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS lead_strength text,
ADD COLUMN IF NOT EXISTS extracted_customer_data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add indexes for filtering
CREATE INDEX IF NOT EXISTS idx_calls_call_type ON public.calls(call_type);
CREATE INDEX IF NOT EXISTS idx_calls_analyzed ON public.calls(analyzed);
CREATE INDEX IF NOT EXISTS idx_calls_is_lead ON public.calls(is_lead);
CREATE INDEX IF NOT EXISTS idx_calls_lead_strength ON public.calls(lead_strength);

-- Add updated_at trigger if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_calls_updated_at'
  ) THEN
    CREATE TRIGGER set_calls_updated_at
      BEFORE UPDATE ON public.calls
      FOR EACH ROW
      EXECUTE FUNCTION public.trigger_set_updated_at();
  END IF;
END $$;
