import { createClient } from "@/lib/supabase/server";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";

export type SubscriptionStatus = {
  isSubscribed: boolean;
  plan: string | null;
  currentPeriodEnd: string | null;
  isTrial: boolean;
  trialDaysRemaining: number | null;
  trialUsed: boolean;
};

/**
 * Returns the subscription status for the currently authenticated user.
 *
 * Admins always return isSubscribed: true — they should never be gated
 * out of any feature regardless of their subscription row in the DB.
 *
 * Both "active" (paid) and "trial" statuses grant full access, as long
 * as current_period_end is in the future (or null for lifetime access).
 * This matches the "access until end of billing period" cancellation
 * policy and the 14-day trial design — once the trial period passes,
 * the user is automatically treated as non-subscribed.
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const { user, isAdmin } = await getCurrentUserWithRole();

  if (!user) {
    return {
      isSubscribed: false,
      plan: null,
      currentPeriodEnd: null,
      isTrial: false,
      trialDaysRemaining: null,
      trialUsed: false,
    };
  }

  // Admins bypass the subscription check entirely.
  if (isAdmin) {
    return {
      isSubscribed: true,
      plan: "admin",
      currentPeriodEnd: null,
      isTrial: false,
      trialDaysRemaining: null,
      trialUsed: false,
    };
  }

  const supabase = await createClient();

  // Fetch subscription and trial_used flag in parallel.
  const [subscriptionRes, profileRes] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("status, plan, current_period_end")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("trial_used")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const subscription = subscriptionRes.data;
  const trialUsed = profileRes.data?.trial_used ?? false;

  const notSubscribed = {
    isSubscribed: false,
    plan: null,
    currentPeriodEnd: null,
    isTrial: false,
    trialDaysRemaining: null,
    trialUsed,
  };

  if (!subscription) return notSubscribed;

  const isValidStatus =
    subscription.status === "active" || subscription.status === "trial";
  if (!isValidStatus) return notSubscribed;

  // Check period end hasn't passed.
  let trialDaysRemaining: number | null = null;
  if (subscription.current_period_end) {
    const periodEnd = new Date(subscription.current_period_end);
    if (periodEnd < new Date()) return notSubscribed;

    if (subscription.status === "trial") {
      const msRemaining = periodEnd.getTime() - Date.now();
      trialDaysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
    }
  }

  return {
    isSubscribed: true,
    plan: subscription.plan ?? null,
    currentPeriodEnd: subscription.current_period_end ?? null,
    isTrial: subscription.status === "trial",
    trialDaysRemaining,
    trialUsed,
  };
}