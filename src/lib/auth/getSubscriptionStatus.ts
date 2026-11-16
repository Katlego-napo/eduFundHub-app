import { createClient } from "@/lib/supabase/server";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";

export type SubscriptionStatus = {
  isSubscribed: boolean;
  plan: string | null;
  currentPeriodEnd: string | null;
  isTrial: boolean;
  trialDaysRemaining: number | null;
  trialUsed: boolean;
  // Cancelled, but still inside the period they already paid for.
  cancelAtPeriodEnd: boolean;
  // Active monthly subscription that can be cancelled in Settings.
  canCancel: boolean;
};

/**
 * Returns the subscription status for the currently authenticated user.
 *
 * Admins always return isSubscribed: true.
 *
 * "active", "trial" and "cancelled" all grant full access as long as
 * current_period_end is still in the future. "cancelled" means the user
 * stopped renewal but keeps what they've paid for until the period ends.
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const { user, isAdmin } = await getCurrentUserWithRole();

  const none = (trialUsed = false): SubscriptionStatus => ({
    isSubscribed: false,
    plan: null,
    currentPeriodEnd: null,
    isTrial: false,
    trialDaysRemaining: null,
    trialUsed,
    cancelAtPeriodEnd: false,
    canCancel: false,
  });

  if (!user) return none();

  if (isAdmin) {
    return { ...none(), isSubscribed: true, plan: "admin" };
  }

  const supabase = await createClient();

  const [subscriptionRes, profileRes] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("status, plan, current_period_end, payfast_token")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("profiles").select("trial_used").eq("id", user.id).maybeSingle(),
  ]);

  const subscription = subscriptionRes.data;
  const trialUsed = profileRes.data?.trial_used ?? false;

  if (!subscription) return none(trialUsed);

  const validStatus = ["active", "trial", "cancelled"].includes(subscription.status);
  if (!validStatus) return none(trialUsed);

  // A cancelled subscription is only useful while there is paid time left.
  if (subscription.status === "cancelled" && !subscription.current_period_end) return none(trialUsed);

  let trialDaysRemaining: number | null = null;
  if (subscription.current_period_end) {
    const periodEnd = new Date(subscription.current_period_end);
    if (periodEnd < new Date()) return none(trialUsed);

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
    cancelAtPeriodEnd: subscription.status === "cancelled",
    canCancel:
      subscription.status === "active" && subscription.plan === "monthly" && !!subscription.payfast_token,
  };
}
