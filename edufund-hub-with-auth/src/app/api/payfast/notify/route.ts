import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyItn, PLAN_CONFIG, type PayfastPlan } from "@/lib/payfast";

export async function POST(request: Request) {
  const rawBody = await request.text();

  // Parse the URL-encoded body PayFast sends.
  const body = Object.fromEntries(new URLSearchParams(rawBody));

  console.log("PayFast ITN received:", {
    payment_status: body.payment_status,
    custom_str1: body.custom_str1,
    custom_str2: body.custom_str2,
    amount_gross: body.amount_gross,
  });

  // Step 1: Verify the ITN is genuine.
  const { valid, reason } = await verifyItn(body, rawBody);
  if (!valid) {
    console.error("PayFast ITN verification failed:", reason);
    // Return 200 to prevent PayFast from retrying — we log the failure
    // but don't want an infinite retry loop for a permanently invalid
    // notification. A real fraud attempt is better handled by alerting
    // than by returning an error status.
    return new NextResponse("INVALID", { status: 200 });
  }

  const paymentStatus = body.payment_status;
  const userId = body.custom_str1;
  const plan = body.custom_str2 as PayfastPlan;
  const payfastToken = body.token; // subscription token for future management
  const amountGross = parseFloat(body.amount_gross ?? "0");

  if (!userId || !plan || !PLAN_CONFIG[plan]) {
    console.error("ITN missing userId or invalid plan:", { userId, plan });
    return new NextResponse("MISSING_DATA", { status: 200 });
  }

  // Step 2: Verify the amount matches what we expect for this plan.
  // This prevents someone from paying R1 and getting a subscription.
  const expectedAmount = parseFloat(PLAN_CONFIG[plan].amount);
  if (Math.abs(amountGross - expectedAmount) > 0.01) {
    console.error("ITN amount mismatch:", { amountGross, expectedAmount });
    return new NextResponse("AMOUNT_MISMATCH", { status: 200 });
  }

  const serviceClient = createServiceClient();

  if (paymentStatus === "COMPLETE") {
    // Calculate the end of the current billing period based on the plan.
    const now = new Date();
    const periodEnd = new Date(now);

    if (plan === "exam_season") {
      // Exam season package: 3 months from payment date.
      periodEnd.setMonth(periodEnd.getMonth() + 3);
    } else {
      // Monthly plan: 1 month from payment date.
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const { error: upsertError } = await serviceClient
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          status: "active",
          plan,
          payfast_token: payfastToken ?? null,
          current_period_end: periodEnd.toISOString(),
          updated_at: now.toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("Failed to activate subscription:", upsertError);
      // Return 200 so PayFast doesn't retry — we'll need to manually
      // fix this in the DB. In production, add an alerting mechanism here.
      return new NextResponse("DB_ERROR", { status: 200 });
    }

    console.log(`Subscription activated for user ${userId}, plan: ${plan}`);

  } else if (
    paymentStatus === "CANCELLED" ||
    paymentStatus === "FAILED"
  ) {
    // Mark subscription as inactive — don't delete the row so we
    // preserve the payfast_token and history.
    const { error } = await serviceClient
      .from("subscriptions")
      .update({
        status: "inactive",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to deactivate subscription:", error);
    } else {
      console.log(`Subscription cancelled/failed for user ${userId}`);
    }

  } else {
    // Other statuses: PENDING, REFUNDED etc. — log but don't change anything.
    console.log(`Unhandled ITN status: ${paymentStatus} for user ${userId}`);
  }

  // PayFast expects a 200 response to confirm receipt.
  return new NextResponse("OK", { status: 200 });
}