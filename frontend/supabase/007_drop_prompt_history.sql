-- ============================================================
-- 007_drop_prompt_history.sql
-- Remove prompt_history table - using ai_prompts table instead
-- ============================================================

-- Drop the prompt_history table if it exists
DROP TABLE IF EXISTS public.prompt_history CASCADE;

-- Note: All prompt history functionality now uses the ai_prompts table
-- This provides a unified approach for managing prompts
