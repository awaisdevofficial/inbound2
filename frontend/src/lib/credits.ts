import { supabase } from "@/integrations/supabase/client";

/**
 * Calculate credit cost based on call duration
 * @param durationSeconds - Duration of call in seconds
 * @param ratePerMinute - Cost per minute (default: $0.85)
 * @returns Cost in dollars
 */
export function calculateCallCost(
  durationSeconds: number,
  ratePerMinute: number = 0.85
): number {
  const minutes = durationSeconds / 60;
  return Number((minutes * ratePerMinute).toFixed(2));
}

/**
 * Format currency amount
 * @param amount - Amount in dollars
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Format duration in seconds to readable string
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Get credit balance status
 * @param balance - Current balance
 * @returns Status object with color and message
 */
export function getCreditBalanceStatus(balance: number): {
  status: "healthy" | "low" | "critical";
  color: string;
  message: string;
} {
  if (balance >= 20) {
    return {
      status: "healthy",
      color: "text-green-600",
      message: "Your balance is healthy",
    };
  } else if (balance >= 10) {
    return {
      status: "low",
      color: "text-yellow-600",
      message: "Consider adding more credits soon",
    };
  } else if (balance >= 5) {
    return {
      status: "low",
      color: "text-orange-600",
      message: "Your balance is getting low",
    };
  } else {
    return {
      status: "critical",
      color: "text-red-600",
      message: "Critical: Please add credits immediately",
    };
  }
}

/**
 * Calculate credits needed for call duration
 * 1 credit = 1 minute, so we convert seconds to exact minutes (not rounded)
 * @param durationSeconds - Duration of call in seconds
 * @returns Credits needed (in minutes, exact)
 */
export function calculateCreditsNeeded(durationSeconds: number): number {
  return durationSeconds / 60; // Exact minutes, not rounded
}

/**
 * Estimate remaining call minutes based on balance
 * Since credits = minutes, balance directly represents minutes
 * @param balance - Current credit balance (in minutes)
 * @returns Estimated minutes remaining (same as balance)
 */
export function estimateRemainingMinutes(balance: number): number {
  return Math.floor(balance); // Credits = minutes, so balance is already in minutes
}

/**
 * Deduct credits for a completed call
 * This is called from n8n webhook, but can also be called manually
 * @param userId - User ID
 * @param callId - Call ID
 * @param durationSeconds - Call duration in seconds
 * @param costBreakdown - Optional cost breakdown from Retell
 */
export async function deductCallCredits(
  userId: string,
  callId: string,
  durationSeconds: number,
  costBreakdown?: Record<string, any>
) {
  try {
    const { data, error } = await supabase.rpc("deduct_call_credits", {
      p_user_id: userId,
      p_call_id: callId,
      p_duration_seconds: durationSeconds,
      p_cost_breakdown: costBreakdown || {},
    });

    if (error) throw error;
    return data;
  } catch (error) {
    // Removed console.error for security
    throw error;
  }
}

/**
 * Add credits to user account
 * @param userId - User ID
 * @param amount - Amount to add
 * @param description - Transaction description
 * @param referenceId - Optional reference ID (e.g., payment ID)
 */
export async function addCredits(
  userId: string,
  amount: number,
  description?: string,
  referenceId?: string
) {
  try {
    const { data, error } = await supabase.rpc("add_credits", {
      p_user_id: userId,
      p_amount: amount,
      p_description: description || "Credit added",
      p_reference_id: referenceId || null,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    // Removed console.error for security
    throw error;
  }
}

/**
 * Get usage statistics for a date range
 * @param userId - User ID
 * @param startDate - Start date
 * @param endDate - End date
 */
export async function getUsageStatistics(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const { data, error } = await supabase
      .from("credit_usage_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (error) throw error;

    const totalUsed = data?.reduce(
      (sum, log) => sum + Number(log.amount_used),
      0
    ) || 0;

    const callUsage = data?.filter((log) => log.usage_type === "call") || [];
    const totalMinutes = callUsage.reduce(
      (sum, log) => sum + (log.duration_seconds || 0),
      0
    ) / 60;

    const totalCalls = callUsage.length;

    return {
      totalUsed,
      totalMinutes,
      totalCalls,
      averageCostPerCall: totalCalls > 0 ? totalUsed / totalCalls : 0,
      logs: data,
    };
  } catch (error) {
    // Removed console.error for security
    throw error;
  }
}

/**
 * Parse Retell cost breakdown from webhook
 * @param retellCost - Cost object from Retell webhook
 */
export function parseRetellCost(retellCost: any) {
  if (!retellCost) return null;

  return {
    total_duration_seconds: retellCost.total_duration_seconds || 0,
    combined_cost: retellCost.combined_cost || 0,
    product_costs: retellCost.product_costs || [],
    breakdown: retellCost.product_costs?.reduce(
      (acc: any, product: any) => {
        acc[product.product] = product.cost;
        return acc;
      },
      {}
    ),
  };
}
