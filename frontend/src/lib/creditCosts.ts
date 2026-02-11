/**
 * Credit Cost Configuration
 * Defines the credit cost for each action in the system
 */

export interface CreditCost {
  action: string;
  description: string;
  creditCost: number;
}

export const CREDIT_COSTS: CreditCost[] = [
  {
    action: "Create Agent",
    description: "Creating a new AI agent/bot",
    creditCost: 5,
  },
  {
    action: "Prompt Formatting",
    description: "Formatting prompts for agents",
    creditCost: 1,
  },
  {
    action: "Prompt Generation",
    description: "Generating prompts using AI",
    creditCost: 2,
  },
  {
    action: "Import 100 Emails",
    description: "Importing 100 emails at once",
    creditCost: 5,
  },
  {
    action: "Generate 10 Templates",
    description: "Generating 10 email templates",
    creditCost: 3,
  },
  {
    action: "Call Minute",
    description: "Per minute of call time",
    creditCost: 1,
  },
];

/**
 * Get credit cost for a specific action
 */
export function getCreditCost(action: string): number {
  const cost = CREDIT_COSTS.find((c) => c.action === action);
  return cost?.creditCost || 0;
}

/**
 * Monthly Subscription Plans
 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  description?: string;
  features?: string[];
  popular?: boolean;
}

export const MONTHLY_PLANS: SubscriptionPlan[] = [
  {
    id: "free-trial",
    name: "Free Trial",
    credits: 100,
    price: 0,
    currency: "USD",
    description: "100 free credits for 7 days (new users only)",
    features: [
      "100 credits",
      "7-day trial period",
      "Full access to all features",
      "Upgrade anytime",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    credits: 500,
    price: 19,
    currency: "USD",
    description: "Perfect for getting started",
    features: [
      "500 credits per month",
      "Basic support",
      "Email templates",
      "Call recording",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    credits: 2000,
    price: 49,
    currency: "USD",
    description: "For growing businesses",
    features: [
      "2000 credits per month",
      "Priority support",
      "Advanced analytics",
      "Custom integrations",
      "API access",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    credits: 5000,
    price: 99,
    currency: "USD",
    description: "For professional teams",
    features: [
      "5000 credits per month",
      "24/7 support",
      "Advanced AI features",
      "White-label options",
      "Dedicated account manager",
    ],
  },
];

/**
 * Calculate how many actions can be performed with given credits
 */
export function calculateActionsFromCredits(credits: number): Record<string, number> {
  const actions: Record<string, number> = {};
  
  CREDIT_COSTS.forEach((cost) => {
    if (cost.creditCost > 0) {
      actions[cost.action] = Math.floor(credits / cost.creditCost);
    }
  });
  
  return actions;
}

/**
 * Get plan by ID
 */
export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return MONTHLY_PLANS.find((plan) => plan.id === planId);
}
