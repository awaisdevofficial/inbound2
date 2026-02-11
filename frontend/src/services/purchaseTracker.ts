import { supabase } from "@/integrations/supabase/client";

export interface Purchase {
  id: string;
  user_id: string;
  package_id: string;
  package_name: string;
  credits: number; // Credits = Minutes
  price: number;
  currency: string;
  payment_method?: string;
  payment_reference?: string;
  status: "pending" | "completed" | "failed" | "refunded";
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Record a purchase/package purchase
 * Credits are added directly to wallet (1 credit = 1 minute)
 */
export async function recordPurchase(
  userId: string,
  packageId: string,
  packageName: string,
  credits: number, // Number of credits (minutes) purchased
  price: number,
  paymentMethod?: string,
  paymentReference?: string,
  metadata?: Record<string, any>
): Promise<Purchase | null> {
  try {
    // Add credits to wallet using the add_credits function
    const { data: creditResult, error: creditError } = await supabase.rpc(
      "add_credits",
      {
        p_user_id: userId,
        p_amount: credits, // Credits = minutes, so we add credits directly
        p_description: `Purchase: ${packageName} package (${credits} credits)`,
        p_reference_id: paymentReference || `purchase_${Date.now()}`,
      }
    );

    if (creditError) throw creditError;

    // Return purchase record (transactions table removed, purchase info stored in metadata)
    const purchaseId = paymentReference || `purchase_${Date.now()}`;
    return {
      id: purchaseId,
      user_id: userId,
      package_id: packageId,
      package_name: packageName,
      credits,
      price,
      currency: "USD",
      payment_method: paymentMethod,
      payment_reference: paymentReference,
      status: "completed",
      metadata: {
        purchase: {
          package_id: packageId,
          package_name: packageName,
          credits: credits,
          price: price,
          payment_method: paymentMethod,
          purchase_date: new Date().toISOString(),
          ...metadata,
        },
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Purchase;
  } catch (error: any) {
    // Removed console.error for security
    return null;
  }
}

/**
 * Get all purchases for a user
 * Note: Transactions table removed, purchases are now tracked via credit_usage_logs or stored separately
 */
export async function getUserPurchases(userId: string): Promise<Purchase[]> {
  try {
    // Get all credit_usage_logs for the user
    // Note: credit_usage_logs doesn't have a metadata column, so we filter in JavaScript
    const { data: creditLogs, error } = await supabase
      .from("credit_usage_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const purchases: Purchase[] = [];

    for (const log of creditLogs || []) {
      // Check if cost_breakdown contains purchase info (since metadata column doesn't exist)
      const costBreakdown = log.cost_breakdown as any;
      const purchaseData = costBreakdown?.purchase;
      
      // If no purchase data in cost_breakdown, skip this log
      if (!purchaseData) continue;
      
      purchases.push({
        id: log.id,
        user_id: userId,
        package_id: purchaseData.package_id || "",
        package_name: purchaseData.package_name || "Credit Purchase",
        credits: purchaseData.credits || log.amount_used,
        price: purchaseData.price || 0,
        currency: "USD",
        payment_method: purchaseData.payment_method,
        payment_reference: purchaseData.payment_reference || undefined,
        status: "completed",
        metadata: purchaseData,
        created_at: log.created_at,
        updated_at: log.created_at,
      });
    }

    return purchases;
  } catch (error) {
    // Removed console.error for security
    return [];
  }
}

/**
 * Get total credits purchased by user
 */
export async function getTotalCreditsPurchased(
  userId: string
): Promise<number> {
  try {
    const purchases = await getUserPurchases(userId);
    return purchases.reduce((sum, p) => sum + p.credits, 0);
  } catch (error) {
    // Removed console.error for security
    return 0;
  }
}
