/**
 * Trial Credits Management
 * Handles free trial credits that expire after 1 week
 */

export const TRIAL_CREDITS_AMOUNT = 100;
export const TRIAL_CREDITS_DURATION_DAYS = 7;

/**
 * Calculate expiration date for trial credits (1 week from now)
 */
export function calculateTrialExpirationDate(): string {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + TRIAL_CREDITS_DURATION_DAYS);
  return expirationDate.toISOString();
}

/**
 * Check if trial credits have expired
 */
export function isTrialExpired(expirationDate: string | null | undefined): boolean {
  if (!expirationDate) return false; // No expiration date means not a trial
  
  const expiration = new Date(expirationDate);
  const now = new Date();
  return now > expiration;
}

/**
 * Get days remaining until trial expires
 */
export function getTrialDaysRemaining(expirationDate: string | null | undefined): number | null {
  if (!expirationDate) return null;
  
  const expiration = new Date(expirationDate);
  const now = new Date();
  const diffTime = expiration.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
}

/**
 * Format expiration date for display
 */
export function formatTrialExpiration(expirationDate: string | null | undefined): string {
  if (!expirationDate) return "No expiration";
  
  const expiration = new Date(expirationDate);
  return expiration.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Check if user is on free trial
 */
export function isOnFreeTrial(
  expirationDate: string | null | undefined,
  paymentStatus: string | null | undefined
): boolean {
  // User is on free trial if they have an expiration date and haven't paid
  return !!expirationDate && paymentStatus !== "paid" && !isTrialExpired(expirationDate);
}
