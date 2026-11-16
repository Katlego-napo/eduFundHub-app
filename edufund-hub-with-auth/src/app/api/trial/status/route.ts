import { NextResponse } from "next/server";
import { getSubscriptionStatus } from "@/lib/auth/getSubscriptionStatus";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";

export async function GET() {
  const { user } = await getCurrentUserWithRole();

  if (!user) {
    return NextResponse.json({
      isLoggedIn: false,
      isSubscribed: false,
      isTrial: false,
      trialDaysRemaining: null,
      trialUsed: false,
      plan: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });
  }

  const status = await getSubscriptionStatus();

  return NextResponse.json(
    {
      isLoggedIn: true,
      isSubscribed: status.isSubscribed,
      isTrial: status.isTrial,
      trialDaysRemaining: status.trialDaysRemaining,
      trialUsed: status.trialUsed,
      plan: status.plan,
      currentPeriodEnd: status.currentPeriodEnd,
      cancelAtPeriodEnd: status.cancelAtPeriodEnd,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
