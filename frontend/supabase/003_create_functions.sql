-- ============================================================
-- 003_create_functions.sql
-- Creates ALL RPC (database) functions used by the application.
-- Run this AFTER 002_create_schema.sql
-- ============================================================

-- =============================================
-- 1. add_credits
-- Adds credits to a user's profile (Remaning_credits)
-- and logs the transaction in credit_usage_logs.
-- Returns the credit_usage_log ID.
-- =============================================
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id      uuid,
  p_amount       numeric,
  p_description  text DEFAULT 'Credit added',
  p_reference_id text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance_before numeric;
  v_balance_after  numeric;
  v_log_id         uuid;
BEGIN
  -- Get current balance
  SELECT COALESCE("Remaning_credits", 0)
    INTO v_balance_before
    FROM profiles
   WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;

  v_balance_after := v_balance_before + p_amount;

  -- Update profile credits
  UPDATE profiles
     SET "Remaning_credits" = v_balance_after,
         "Total_credit" = COALESCE("Total_credit", 0) + p_amount,
         updated_at = now()
   WHERE user_id = p_user_id;

  -- Log the credit addition
  INSERT INTO credit_usage_logs (
    user_id, usage_type, amount_used, balance_before, balance_after,
    cost_breakdown
  ) VALUES (
    p_user_id, 'other', p_amount, v_balance_before, v_balance_after,
    jsonb_build_object(
      'type', 'credit_added',
      'description', p_description,
      'reference_id', p_reference_id,
      'purchase', jsonb_build_object(
        'credits', p_amount,
        'description', p_description,
        'reference_id', p_reference_id
      )
    )
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id::text;
END;
$$;

-- =============================================
-- 2. deduct_call_credits
-- Deducts credits for a completed call.
-- Returns JSON with deduction details.
-- =============================================
CREATE OR REPLACE FUNCTION public.deduct_call_credits(
  p_user_id          uuid,
  p_call_id          uuid,
  p_duration_seconds integer,
  p_cost_breakdown   jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance_before numeric;
  v_credits_to_deduct numeric;
  v_balance_after  numeric;
  v_log_id         uuid;
  v_rate_per_minute numeric := 1.0;  -- 1 credit per minute
BEGIN
  -- Check if already processed
  IF EXISTS (
    SELECT 1 FROM credit_usage_logs
     WHERE call_id = p_call_id AND usage_type = 'call'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Credits already processed for this call',
      'call_id', p_call_id
    );
  END IF;

  -- Calculate credits to deduct (1 credit = 1 minute)
  v_credits_to_deduct := CEIL(p_duration_seconds::numeric / 60.0);

  -- Get current balance
  SELECT COALESCE("Remaning_credits", 0)
    INTO v_balance_before
    FROM profiles
   WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  -- Check sufficient balance
  IF v_balance_before < v_credits_to_deduct THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Insufficient credits. Required: %s, Available: %s', v_credits_to_deduct, v_balance_before),
      'required', v_credits_to_deduct,
      'available', v_balance_before
    );
  END IF;

  v_balance_after := v_balance_before - v_credits_to_deduct;

  -- Update profile
  UPDATE profiles
     SET "Remaning_credits" = v_balance_after,
         total_minutes_used = COALESCE(total_minutes_used, 0) + (p_duration_seconds::numeric / 60.0),
         updated_at = now()
   WHERE user_id = p_user_id;

  -- Log usage
  INSERT INTO credit_usage_logs (
    user_id, call_id, usage_type, amount_used,
    duration_seconds, rate_per_minute,
    balance_before, balance_after, cost_breakdown
  ) VALUES (
    p_user_id, p_call_id, 'call', v_credits_to_deduct,
    p_duration_seconds, v_rate_per_minute,
    v_balance_before, v_balance_after, p_cost_breakdown
  )
  RETURNING id INTO v_log_id;

  RETURN jsonb_build_object(
    'success', true,
    'credits_deducted', v_credits_to_deduct,
    'balance_before', v_balance_before,
    'balance_after', v_balance_after,
    'log_id', v_log_id
  );
END;
$$;

-- =============================================
-- 3. deduct_credits_for_action
-- Generic function to deduct credits for any action type.
-- Reads the cost from credit_costs table.
-- Returns JSON with deduction details.
-- =============================================
CREATE OR REPLACE FUNCTION public.deduct_credits_for_action(
  p_user_id          uuid,
  p_action_type      text,
  p_quantity         numeric DEFAULT 1,
  p_reference_id     uuid DEFAULT NULL,
  p_metadata         jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cost_per_unit    numeric;
  v_action_name      text;
  v_total_cost       numeric;
  v_balance_before   numeric;
  v_balance_after    numeric;
  v_log_id           uuid;
BEGIN
  -- Get cost from credit_costs table
  SELECT cost_per_unit, action_name
    INTO v_cost_per_unit, v_action_name
    FROM credit_costs
   WHERE action_type = p_action_type
     AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('No active credit cost found for action type: %s', p_action_type)
    );
  END IF;

  -- Calculate total cost
  v_total_cost := v_cost_per_unit * p_quantity;

  -- Get current balance
  SELECT COALESCE("Remaning_credits", 0)
    INTO v_balance_before
    FROM profiles
   WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  -- Check sufficient balance
  IF v_balance_before < v_total_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Insufficient credits. Required: %s, Available: %s', v_total_cost, v_balance_before),
      'required', v_total_cost,
      'available', v_balance_before,
      'action_type', p_action_type,
      'action_name', v_action_name
    );
  END IF;

  v_balance_after := v_balance_before - v_total_cost;

  -- Update profile
  UPDATE profiles
     SET "Remaning_credits" = v_balance_after,
         updated_at = now()
   WHERE user_id = p_user_id;

  -- Log usage
  INSERT INTO credit_usage_logs (
    user_id, usage_type, amount_used,
    balance_before, balance_after, cost_breakdown
  ) VALUES (
    p_user_id, 'other', v_total_cost,
    v_balance_before, v_balance_after,
    jsonb_build_object(
      'action_type', p_action_type,
      'action_name', v_action_name,
      'cost_per_unit', v_cost_per_unit,
      'quantity', p_quantity,
      'total_cost', v_total_cost,
      'reference_id', p_reference_id,
      'metadata', p_metadata
    )
  )
  RETURNING id INTO v_log_id;

  RETURN jsonb_build_object(
    'success', true,
    'credits_deducted', v_total_cost,
    'balance_before', v_balance_before,
    'balance_after', v_balance_after,
    'action_type', p_action_type,
    'action_name', v_action_name,
    'log_id', v_log_id
  );
END;
$$;

-- =============================================
-- 4. deactivate_account
-- Deactivates a user account.
-- =============================================
CREATE OR REPLACE FUNCTION public.deactivate_account(
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
     SET is_deactivated = true,
         deactivated_at = now(),
         updated_at = now()
   WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;
END;
$$;

-- =============================================
-- 4. reactivate_account
-- Reactivates a user account.
-- =============================================
CREATE OR REPLACE FUNCTION public.reactivate_account(
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
     SET is_deactivated = false,
         deactivated_at = NULL,
         updated_at = now()
   WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;
END;
$$;

-- =============================================
-- 5. request_account_deactivation
-- Generates a 6-digit verification code for deactivation.
-- Returns the code (sent to user via email in the app).
-- =============================================
CREATE OR REPLACE FUNCTION public.request_account_deactivation(
  p_user_id uuid,
  p_reason  text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
BEGIN
  -- Generate 6-digit code
  v_code := lpad(floor(random() * 1000000)::text, 6, '0');

  -- Store the code with 15-minute expiration
  UPDATE profiles
     SET deactivation_code = v_code,
         deactivation_code_expires_at = now() + interval '15 minutes',
         deactivation_reason = p_reason,
         updated_at = now()
   WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;

  RETURN v_code;
END;
$$;

-- =============================================
-- 6. verify_and_deactivate_account
-- Verifies the deactivation code and deactivates the account.
-- =============================================
CREATE OR REPLACE FUNCTION public.verify_and_deactivate_account(
  p_user_id uuid,
  p_code    text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stored_code text;
  v_expires_at  timestamptz;
BEGIN
  SELECT deactivation_code, deactivation_code_expires_at
    INTO v_stored_code, v_expires_at
    FROM profiles
   WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  IF v_stored_code IS NULL OR v_stored_code != p_code THEN
    RAISE EXCEPTION 'Invalid verification code';
  END IF;

  IF v_expires_at IS NOT NULL AND v_expires_at < now() THEN
    RAISE EXCEPTION 'Verification code has expired';
  END IF;

  -- Deactivate the account and clear the code
  UPDATE profiles
     SET is_deactivated = true,
         deactivated_at = now(),
         deactivation_code = NULL,
         deactivation_code_expires_at = NULL,
         updated_at = now()
   WHERE user_id = p_user_id;
END;
$$;

-- =============================================
-- 7. create_invoice
-- Creates an invoice for a subscription package.
-- Returns the invoice number.
-- =============================================
CREATE OR REPLACE FUNCTION public.create_invoice(
  p_user_id      uuid,
  p_package_id   uuid,
  p_package_name text,
  p_amount       numeric,
  p_currency     text DEFAULT 'USD'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice_number text;
  v_invoice_id     uuid;
BEGIN
  -- Generate invoice number: INV-YYYYMMDD-RANDOM
  v_invoice_number := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random() * 100000)::text, 5, '0');

  INSERT INTO invoices (
    user_id, package_id, package_name, amount, currency,
    status, invoice_number, due_date
  ) VALUES (
    p_user_id, p_package_id, p_package_name, p_amount, p_currency,
    'pending', v_invoice_number, now() + interval '7 days'
  )
  RETURNING id INTO v_invoice_id;

  RETURN v_invoice_number;
END;
$$;

-- =============================================
-- 8. mark_invoice_paid
-- Marks an invoice as paid, adds credits, and creates a subscription.
-- Returns true on success.
-- =============================================
CREATE OR REPLACE FUNCTION public.mark_invoice_paid(
  p_invoice_id        uuid,
  p_payment_method    text DEFAULT NULL,
  p_payment_reference text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice   RECORD;
  v_package   RECORD;
BEGIN
  -- Get invoice
  SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  IF v_invoice.status = 'paid' THEN
    RAISE EXCEPTION 'Invoice is already paid';
  END IF;

  -- Update invoice
  UPDATE invoices
     SET status = 'paid',
         paid_at = now(),
         payment_method = p_payment_method,
         payment_reference = p_payment_reference,
         updated_at = now()
   WHERE id = p_invoice_id;

  -- Get package details (if package_id exists)
  IF v_invoice.package_id IS NOT NULL THEN
    SELECT * INTO v_package FROM subscription_packages WHERE id = v_invoice.package_id;

    IF FOUND THEN
      -- Add credits from the package
      PERFORM public.add_credits(
        v_invoice.user_id,
        v_package.credits_included,
        format('Subscription: %s', v_package.display_name),
        p_invoice_id::text
      );

      -- Create or update subscription
      INSERT INTO user_subscriptions (
        user_id, package_id, package_name, status,
        started_at, expires_at, invoice_id
      ) VALUES (
        v_invoice.user_id, v_invoice.package_id, v_package.display_name,
        'active', now(), now() + interval '30 days', p_invoice_id
      );
    END IF;
  END IF;

  -- Update profile payment status
  UPDATE profiles
     SET payment_status = 'paid',
         updated_at = now()
   WHERE user_id = v_invoice.user_id;

  RETURN true;
END;
$$;

-- =============================================
-- 9. create_notification
-- Creates an in-app notification for a user.
-- =============================================
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id  uuid,
  p_type     text DEFAULT 'info',
  p_title    text DEFAULT '',
  p_message  text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO notifications (
    user_id, type, title, message, metadata
  ) VALUES (
    p_user_id, p_type::notification_type, p_title,
    COALESCE(p_message, ''), COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- =============================================
-- 10. mark_notification_read
-- Marks a single notification as read.
-- =============================================
CREATE OR REPLACE FUNCTION public.mark_notification_read(
  p_notification_id uuid,
  p_user_id         uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE notifications
     SET read = true,
         read_at = now()
   WHERE id = p_notification_id
     AND user_id = p_user_id;
END;
$$;

-- =============================================
-- 11. mark_all_notifications_read
-- Marks all unread notifications as read for a user.
-- =============================================
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE notifications
     SET read = true,
         read_at = now()
   WHERE user_id = p_user_id
     AND read = false;
END;
$$;

-- =============================================
-- 12. log_activity
-- Logs an activity for a user.
-- =============================================
CREATE OR REPLACE FUNCTION public.log_activity(
  p_user_id       uuid,
  p_activity_type text,
  p_description   text,
  p_entity_type   text DEFAULT NULL,
  p_entity_id     text DEFAULT NULL,
  p_metadata      jsonb DEFAULT NULL,
  p_ip_address    text DEFAULT NULL,
  p_user_agent    text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO activity_logs (
    user_id, activity_type, description,
    entity_type, entity_id, metadata,
    ip_address, user_agent
  ) VALUES (
    p_user_id, p_activity_type::activity_type, p_description,
    p_entity_type, p_entity_id, COALESCE(p_metadata, '{}'::jsonb),
    p_ip_address, p_user_agent
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- =============================================
-- 13. deduct_credits_for_email_send
-- Deducts credits when an email is sent.
-- Should be called from the email sending logic.
-- =============================================
CREATE OR REPLACE FUNCTION public.deduct_credits_for_email_send(
  p_user_id      uuid,
  p_email_id     uuid DEFAULT NULL,
  p_metadata     jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.deduct_credits_for_action(
    p_user_id,
    'send_email',
    1,  -- quantity (1 email)
    p_email_id,  -- reference_id
    jsonb_build_object(
      'trigger', 'manual_email_send',
      'metadata', p_metadata
    )
  );
END;
$$;

-- 14. deduct_credits_for_prompt_formatting
-- Deducts credits for prompt formatting operation.
-- =============================================
CREATE OR REPLACE FUNCTION public.deduct_credits_for_prompt_formatting(
  p_user_id      uuid,
  p_prompt_id    uuid DEFAULT NULL,
  p_metadata     jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.deduct_credits_for_action(
    p_user_id,
    'prompt_formatting',
    1,  -- quantity
    p_prompt_id,  -- reference_id
    jsonb_build_object(
      'trigger', 'manual_prompt_formatting',
      'metadata', p_metadata
    )
  );
END;
$$;

-- 15. deduct_credits_for_prompt_generation
-- Deducts credits for prompt generation operation.
-- =============================================
CREATE OR REPLACE FUNCTION public.deduct_credits_for_prompt_generation(
  p_user_id      uuid,
  p_prompt_id    uuid DEFAULT NULL,
  p_metadata     jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.deduct_credits_for_action(
    p_user_id,
    'prompt_generation',
    1,  -- quantity
    p_prompt_id,  -- reference_id
    jsonb_build_object(
      'trigger', 'manual_prompt_generation',
      'metadata', p_metadata
    )
  );
END;
$$;

-- 16. deduct_credits_for_email_import_batch
-- Deducts credits for importing a batch of emails.
-- Should be called after importing emails in bulk.
-- =============================================
CREATE OR REPLACE FUNCTION public.deduct_credits_for_email_import_batch(
  p_user_id      uuid,
  p_email_count  integer,
  p_metadata     jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batches numeric;
BEGIN
  -- Calculate number of 100-email batches (round up)
  v_batches := CEIL(p_email_count::numeric / 100.0);
  
  RETURN public.deduct_credits_for_action(
    p_user_id,
    'import_emails',
    v_batches,  -- quantity (number of 100-email batches)
    NULL,  -- reference_id
    jsonb_build_object(
      'trigger', 'manual_email_import_batch',
      'email_count', p_email_count,
      'batches', v_batches,
      'metadata', p_metadata
    )
  );
END;
$$;

-- 17. send_email (placeholder)
-- This function is a placeholder. In production, you should
-- implement this using Supabase Edge Functions or the
-- pg_net / http extension to call an external email API
-- (e.g., Resend, SendGrid, etc.)
-- =============================================
CREATE OR REPLACE FUNCTION public.send_email(
  p_from     text,
  p_to       text[],
  p_subject  text,
  p_html     text,
  p_reply_to text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- ============================================================
  -- PLACEHOLDER: Replace this with your actual email sending logic.
  --
  -- Option 1: Use pg_net extension to call Resend API:
  --   SELECT net.http_post(
  --     url := 'https://api.resend.com/emails',
  --     headers := jsonb_build_object(
  --       'Authorization', 'Bearer ' || current_setting('app.resend_api_key'),
  --       'Content-Type', 'application/json'
  --     ),
  --     body := jsonb_build_object(
  --       'from', p_from,
  --       'to', p_to,
  --       'subject', p_subject,
  --       'html', p_html,
  --       'reply_to', p_reply_to
  --     )::text
  --   );
  --
  -- Option 2: Use a Supabase Edge Function.
  -- ============================================================

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Email queued (placeholder - implement actual sending)',
    'to', to_jsonb(p_to),
    'subject', p_subject
  );
END;
$$;

-- Done! All RPC functions are ready.
-- Now run 004_create_triggers.sql to create triggers.
