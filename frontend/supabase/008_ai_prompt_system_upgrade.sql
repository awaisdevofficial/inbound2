-- ============================================================
-- 008_ai_prompt_system_upgrade.sql
-- Upgrades AI prompt system with 3-layer agent architecture
-- Adds structured profile storage, document upload, and versioning
-- ============================================================

-- 1. Upgrade ai_prompts table with new columns
ALTER TABLE public.ai_prompts
ADD COLUMN IF NOT EXISTS agent_profile jsonb NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS clarification_questions jsonb NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS call_type text NULL,
ADD COLUMN IF NOT EXISTS tone text NULL,
ADD COLUMN IF NOT EXISTS call_goal text NULL;

-- Add check constraint for status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ai_prompts_status_check'
  ) THEN
    ALTER TABLE public.ai_prompts
    ADD CONSTRAINT ai_prompts_status_check 
    CHECK (status IN ('draft', 'needs_clarification', 'ready', 'archived'));
  END IF;
END $$;

-- 2. Create company_documents table
CREATE TABLE IF NOT EXISTS public.company_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_url text NOT NULL,
  extracted_text text NULL,
  extracted_profile jsonb NULL DEFAULT '{}'::jsonb,
  missing_fields jsonb NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_documents_user_id
ON public.company_documents USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_company_documents_created_at
ON public.company_documents USING btree (created_at DESC);

-- 3. Create ai_prompt_versions table
CREATE TABLE IF NOT EXISTS public.ai_prompt_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL REFERENCES public.ai_prompts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  system_prompt text NOT NULL,
  begin_message text NULL,
  agent_profile jsonb NULL DEFAULT '{}'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_prompt_versions_prompt_id
ON public.ai_prompt_versions USING btree (prompt_id);

CREATE INDEX IF NOT EXISTS idx_ai_prompt_versions_user_id
ON public.ai_prompt_versions USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_ai_prompt_versions_generated_at
ON public.ai_prompt_versions USING btree (generated_at DESC);

-- 4. Create storage bucket for company documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-documents',
  'company-documents',
  false,
  52428800,  -- 50 MB
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 5. Storage policies for company-documents bucket
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

-- Create new policies
CREATE POLICY "Users can upload their own documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'company-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can read their own documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'company-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'company-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 6. Add RLS policies for new tables
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_prompt_versions ENABLE ROW LEVEL SECURITY;

-- Company documents policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own documents" ON public.company_documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON public.company_documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.company_documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.company_documents;

-- Create new policies
CREATE POLICY "Users can view their own documents"
  ON public.company_documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON public.company_documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON public.company_documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON public.company_documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- AI prompt versions policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own prompt versions" ON public.ai_prompt_versions;
DROP POLICY IF EXISTS "Users can insert their own prompt versions" ON public.ai_prompt_versions;
DROP POLICY IF EXISTS "Users can delete their own prompt versions" ON public.ai_prompt_versions;

-- Create new policies
CREATE POLICY "Users can view their own prompt versions"
  ON public.ai_prompt_versions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prompt versions"
  ON public.ai_prompt_versions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompt versions"
  ON public.ai_prompt_versions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
