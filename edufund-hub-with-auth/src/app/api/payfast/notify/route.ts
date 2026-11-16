import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyItn, PLAN_CONFIG, isPayfastPlan, addMonths } from "@/lib/payfast";
import { cancelPayFastSubscription } from "@/lib/payfastCancel";

// PayFast calls this after every payment ("ITN"). It is the ONLY place that
// switches a subscription on, and every notification is written to the
// payfast_events table so nothing can fail silently again.
//
// Reply rules: 200 = "got it, don't retry". 500 = "try again later" (used only
// when OUR database fails, so a real payment is never lost).
export async function POST(request: Request) {
  const rawBody = await request.text();
  const body = Object.fromEntries(new URLSearchParams(rawBody)) as Record<string, string>;
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;
  const svc = createServiceClient();

  const userId = body.custom_str1 || null;
  const planRaw = body.custom_str2 || null;

  console.log("PayFast ITN received:", {
    status: body.payment_status,
    pf_payment_id: body.pf_payment_id,
    plan: planRaw,
    amount_gross: body.amount_gross,
  });

  async function record(result: "processed" | "rejected" | "ignored" | "error", reason?: string) {
    const raw: Record<string, string> = { ...body };
    delete raw.signature;
    const amount = Number(body.amount_gross);
    const { error } = await svc.from("payfast_events").insert({
      pf_payment_id: body.pf_payment_id || null,
      m_payment_id: body.m_payment_id || null,
      payment_status: body.payment_status || null,
      user_id: userId && /^[0-9a-f-]{36}$/i.test(userId) ? userId : null,
      plan: planRaw,
      amount_gross: Number.isFinite(amount) ? amount : null,
      result,
      reason: reason ?? null,
      ip,
      raw,
    });
    if (error) console.error("Could not write payfast_events row:", error.message);
  }

  // 1. Is this genuinely from PayFast?
  const check = await verifyItn(body, ip);
  if (!check.valid) {
    console.error("PayFast ITN rejected:", check.reason);
    await record("rejected", check.reason);
    return new NextResponse("INVALID", { status: 200 });
  }
  const ipNote =
    check.ipOk === false ? "Source IP not in PayFast's list (accepted: PayFast confirmed the notification)." : undefined;

  // 2. Do we know who paid for what?
  if (!userId || !isPayfastPlan(planRaw)) {
    await record("rejected", "Missing user id or unknown plan in notification");
    return new NextResponse("MISSING_DATA", { status: 200 });
  }
  const plan = planRaw;
  const cfg = PLAN_CONFIG[plan];
  const status = body.payment_status;

  // ---------------------------------------------------------------- COMPLETE
  if (status === "COMPLETE") {
    const paid = parseFloat(body.amount_gross ?? "0");
    if (Math.abs(paid - parseFloat(cfg.amount)) > 0.01) {
      await record("rejected", `Amount mismatch: paid ${paid}, expected ${cfg.amount}`);
      return new NextResponse("AMOUNT_MISMATCH", { status: 200 });
    }

    // PayFast can send the same notification more than once. Never apply twice.
    if (body.pf_payment_id) {
      const { data: already } = await svc
        .from("payfast_events")
        .select("id")
        .eq("pf_payment_id", body.pf_payment_id)
        .eq("result", "processed")
        .limit(1);
      if (already && already.length > 0) return new NextResponse("OK", { status: 200 });
    }

    const { data: existing, error: readError } = await svc
      .from("subscriptions")
      .select("status, plan, payfast_token, current_period_end")
      .eq("user_id", userId)
      .maybeSingle();
    if (readError) {
      console.error("ITN: could not read subscription:", readError.message);
      await record("error", `Could not read subscription: ${readError.message}`);
      return new NextResponse("DB_ERROR", { status: 500 });
    }

    // Paid time already left (paid plan, or cancelled but not yet ended) is kept.
    // A running free trial is NOT added on top.
    const now = new Date();
    const hasPaidTimeLeft =
      !!existing &&
      (existing.status === "active" || existing.status === "cancelled") &&
      !!existing.current_period_end &&
      new Date(existing.current_period_end) > now;
    const base = hasPaidTimeLeft ? new Date(existing!.current_period_end as string) : now;
    const periodEnd = addMonths(base, cfg.months);

    let token: string | null = cfg.recurring ? body.token || existing?.payfast_token || null : null;
    let note = ipNote;

    // Buying the one-off yearly plan while a monthly subscription is still
    // billing: stop the monthly billing so they aren't charged twice.
    if (!cfg.recurring && existing?.payfast_token) {
      const cancelled = await cancelPayFastSubscription(existing.payfast_token);
      if (!cancelled.ok) {
        token = existing.payfast_token;
        note = [note, `Could not cancel the old monthly subscription automatically (${cancelled.message}). Cancel it in the PayFast dashboard.`]
          .filter(Boolean)
          .join(" ");
      }
    }

    const { error: upsertError } = await svc.from("subscriptions").upsert(
      {
        user_id: userId,
        status: "active",
        plan,
        payfast_token: token,
        current_period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (upsertError) {
      console.error("ITN: could not activate subscription:", upsertError.message);
      await record("error", `Could not activate subscription: ${upsertError.message}`);
      return new NextResponse("DB_ERROR", { status: 500 });
    }

    console.log(`Subscription active for ${userId}: ${plan} until ${periodEnd.toISOString()}`);
    await record("processed", note ?? `Active until ${periodEnd.toISOString()}`);
    return new NextResponse("OK", { status: 200 });
  }

  // --------------------------------------------------------------- CANCELLED
  if (status === "CANCELLED") {
    const { data: existing } = await svc
      .from("subscriptions")
      .select("status, payfast_token")
      .eq("user_id", userId)
      .maybeSingle();

    // Only react if it's the SAME subscription we're tracking (not an old one
    // we replaced). Access is kept until the end of the paid period.
    if (existing?.payfast_token && body.token && existing.payfast_token === body.token) {
      const { error } = await svc
        .from("subscriptions")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      if (error) {
        await record("error", `Could not mark cancelled: ${error.message}`);
        return new NextResponse("DB_ERROR", { status: 500 });
      }
      await record("processed", "Subscription cancelled; access continues until the period ends");
    } else {
      await record("ignored", "Cancellation for a subscription we are no longer tracking");
    }
    return new NextResponse("OK", { status: 200 });
  }

  // FAILED / PENDING / anything else: logged only. A failed renewal simply
  // doesn't extend access, so it ends naturally when the paid period runs out.
  await record("ignored", `Status ${status}: no change made`);
  return new NextResponse("OK", { status: 200 });
}
