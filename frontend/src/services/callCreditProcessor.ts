import { supabase } from "@/integrations/supabase/client";
import { Call } from "@/types/database";
import { sendLowBalanceEmail } from "./emailService";

interface ProcessCallResult {
  success: boolean;
  creditsDeducted: number; // This is in minutes
  error?: string;
}

/**
 * Check if a call has ended (not pending or in_progress)
 * Only ended calls should have their duration counted in the scheduling system
 */
function isCallEnded(status: string | null): boolean {
  if (!status) return false;
  
  // Calls that have ended (completed, failed, not_connected, night_time_dont_call)
  const endedStatuses = ["completed", "failed", "not_connected", "night_time_dont_call"];
  
  // Calls that are still ongoing or pending should NOT be counted
  const ongoingStatuses = ["pending", "in_progress"];
  
  return endedStatuses.includes(status.toLowerCase()) && !ongoingStatuses.includes(status.toLowerCase());
}

/**
 * Process credit deduction for an ended call
 * NOTE: Credit calculation and deduction is handled by Supabase triggers/functions
 * This function only checks if the call has already been processed
 */
export async function processCallCredits(call: Call): Promise<ProcessCallResult> {
  try {
    // CRITICAL: Only process calls that have ENDED and have duration
    // Do NOT process pending or in_progress calls
    if (!call.duration_seconds || !isCallEnded(call.status)) {
      return {
        success: false,
        creditsDeducted: 0,
        error: call.status === "pending" || call.status === "in_progress" 
          ? "Call is still pending or in progress - duration not yet available"
          : "Call has not ended or missing duration",
      };
    }

    // Check if credits have already been deducted for this call
    const { data: existingLog, error: logError } = await supabase
      .from("credit_usage_logs")
      .select("id, amount_used")
      .eq("call_id", call.id)
      .eq("usage_type", "call")
      .single();

    if (existingLog && !logError) {
      // Credits already processed by Supabase
      return {
        success: true,
        creditsDeducted: existingLog.amount_used || 0,
        error: "Credits already processed for this call",
      };
    }

    // Get current balance from profile (managed by Supabase)
    const { data: profile } = await supabase
      .from("profiles")
      .select("Remaning_credits")
      .eq("user_id", call.user_id)
      .single();

    const currentBalance = (profile as any)?.Remaning_credits ? parseFloat(String((profile as any).Remaning_credits)) : 0;

    // Create activity log
    await supabase.from("activity_logs").insert({
      user_id: call.user_id,
      activity_type: "credit_used",
      entity_type: "call",
      entity_id: call.id,
      description: `Call completed: ${call.duration_seconds}s`,
      metadata: {
        call_id: call.id,
        duration_seconds: call.duration_seconds,
      },
    });

    // Check for low balance notifications (get updated balance from Supabase)
    const { data: updatedProfile } = await supabase
      .from("profiles")
      .select("Remaning_credits")
      .eq("user_id", call.user_id)
      .single();

    const newBalance = (updatedProfile as any)?.Remaning_credits ? parseFloat(String((updatedProfile as any).Remaning_credits)) : currentBalance;

    if (newBalance < 10) {
      await createLowBalanceNotification(call.user_id, newBalance);
    }

    // Get credits deducted from credit_usage_logs (created by Supabase trigger)
    const { data: creditLog } = await supabase
      .from("credit_usage_logs")
      .select("amount_used")
      .eq("call_id", call.id)
      .eq("usage_type", "call")
      .single();

    const creditsDeducted = creditLog?.amount_used || 0;

    return {
      success: true,
      creditsDeducted: creditsDeducted,
    };
  } catch (error: any) {
    // Removed console.error for security
    return {
      success: false,
      creditsDeducted: 0,
      error: error?.message || "Failed to process call credits",
    };
  }
}


/**
 * Create low balance notification and send email
 */
async function createLowBalanceNotification(userId: string, balance: number) {
  try {
    const isCritical = balance < 5;
    
    // Create in-app notification
    await supabase.from("notifications").insert({
      user_id: userId,
      type: isCritical ? "error" : "warning",
      title: isCritical ? "Critical: Low Credits" : "Low Credits Warning",
      message: isCritical
        ? `Your credit balance is critically low (${balance} credits remaining). Please add more credits to continue using the service.`
        : `Your credit balance is getting low (${balance} credits remaining). Consider adding more credits soon.`,
      metadata: {
        balance,
        threshold: isCritical ? 5 : 10,
      },
    });

    // Get user email from profile to send email notification
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("user_id", userId)
      .single();

    const userEmail = (profile as any)?.email;

    // Send email notification if user email is available
    if (userEmail) {
      try {
        const { error: emailError } = await sendLowBalanceEmail(
          userEmail,
          balance,
          isCritical,
          userId
        );

        // Handle email errors based on Resend API response codes
        // Reference: https://resend.com/docs/api-reference/introduction
        if (emailError) {
          // Rate limit (429) - could retry later, but for now just log
          // Other errors (400, 401, 403, 5xx) - log but don't fail notification
          // Email sending failed, but notification was created successfully
          // This is a non-critical error, so we continue
        }
      } catch (emailError) {
        // Email sending failed, but notification was created successfully
        // This is a non-critical error, so we continue
      }
    }
  } catch (error) {
    // Removed console.error for security
  }
}

/**
 * Process all unprocessed completed calls for a user
 * IMPORTANT: Only processes calls that have ENDED with status "completed"
 * Does NOT process pending or in_progress calls - only ended/completed calls
 * have their duration added to the scheduling system
 */
export async function processUnprocessedCalls(userId: string): Promise<{
  processed: number;
  errors: number;
}> {
  try {
    // Get all calls for the user
    // CRITICAL: Filter by status and duration_seconds in JavaScript to avoid PostgREST enum/RLS issues
    // Only process completed (ended) calls with duration - excludes pending and in_progress
    // Only ended calls should have their duration counted in the scheduling system
    const { data: calls, error: callsError } = await supabase
      .from("calls")
      .select("id, user_id, status, duration_seconds, webhook_response")
      .eq("user_id", userId);

    if (callsError) throw callsError;

    // Filter for completed calls with duration in JavaScript
    const callsWithDuration = (calls || []).filter(
      (call) => 
        call.status === "completed" &&
        call.duration_seconds !== null && 
        call.duration_seconds !== undefined
    );

    // Get all call IDs that already have credit logs
    const { data: processedCalls, error: logsError } = await supabase
      .from("credit_usage_logs")
      .select("call_id")
      .eq("user_id", userId)
      .eq("usage_type", "call")
      .not("call_id", "is", null);

    if (logsError) throw logsError;

    const processedCallIds = new Set(
      (processedCalls || []).map((log) => log.call_id).filter(Boolean)
    );

    // Filter out already processed calls
    const unprocessedCalls = callsWithDuration.filter(
      (call) => !processedCallIds.has(call.id)
    );

    let processed = 0;
    let errors = 0;

    // Process each call
    for (const call of unprocessedCalls) {
      const result = await processCallCredits(call as Call);
      if (result.success) {
        processed++;
      } else {
        errors++;
      }
    }

    return { processed, errors };
  } catch (error) {
    // Removed console.error for security
    return { processed: 0, errors: 0 };
  }
}
