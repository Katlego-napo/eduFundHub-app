import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { cancelPayFastSubscription } from "@/lib/payfastCancel";

// Cancels the signed-in user's monthly subscription at PayFast (stops future
// charges). They keep access until current_period_end.
export async function POST() {
  const { user } = await getCurrentUserWithRole();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const svc = createServiceClient();
  const { data: sub, error } = await svc
    .from("subscriptions")
    .select("status, plan, payfast_token, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Cancel: could not read subscription:", error.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  if (!sub || sub.status !== "active" || !sub.payfast_token) {
    return NextResponse.json({ error: "There's no active monthly subscription to cancel." }, { status: 400 });
  }

  const result = await cancelPayFastSubscription(sub.payfast_token);
  if (!result.ok) {
    console.error("Cancel: PayFast refused:", result.message);
    return NextResponse.json(
      {
        error:
          "We couldn't cancel with PayFast right now, so you have not been changed. Please try again, or email admin@edufundhub.co.za.",
      },
      { status: 502 }
    );
  }

  const { error: updateError } = await svc
    .from("subscriptions")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("user_id", user.id);
  if (updateError) {
    // PayFast has already stopped billing; PayFast's own cancellation
    // notification will also set this status.
    console.error("Cancel: PayFast cancelled but DB update failed:", updateError.message);
  }

  await svc.from("payfast_events").insert({
    payment_status: "CANCELLED_BY_USER",
    user_id: user.id,
    plan: sub.plan,
    result: "processed",
    reason: "User cancelled in Settings",
  });

  return NextResponse.json({ success: true, accessUntil: sub.current_period_end });
}
