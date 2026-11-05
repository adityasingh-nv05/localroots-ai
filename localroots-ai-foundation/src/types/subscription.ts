/**
 * Data shapes only. There is NO payment processing in this codebase.
 * Plans and statuses will be driven by a payment provider once one is integrated.
 */
export const SUBSCRIPTION_PLANS = ['free', 'growth', 'premium'] as const;
export const SUBSCRIPTION_STATUSES = ['inactive', 'trialing', 'active', 'past_due', 'cancelled'] as const;

export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/** Mirrors the `subscriptions` table. */
export interface Subscription {
  id: string;
  business_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_end: string | null;
  created_at: string;
}
