import crypto from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import {
  buildPaymentData,
  isPayfastPlan,
  PAYFAST_URL,
  MERCHANT_ID,
  MERCHANT_KEY,
  SITE_URL,
} from "@/lib/payfast";

export async function POST(request: Request) {
  const { user } = await getCurrentUserWithRole();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  if (!isPayfastPlan(body?.plan)) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  // Fail loudly (in the server log) if payments aren't configured.
  const missing = [
    !MERCHANT_ID && "PAYFAST_MERCHANT_ID",
    !MERCHANT_KEY && "PAYFAST_MERCHANT_KEY",
    !SITE_URL && "NEXT_PUBLIC_SITE_URL",
  ].filter(Boolean);
  if (missing.length > 0) {
    console.error("PayFast checkout: missing environment variables:", missing.join(", "));
    return NextResponse.json({ error: "Payments aren't set up yet. Please try again later." }, { status: 500 });
  }

  const userName =
    user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Student";

  // The signature and merchant key are generated here on the server,
  // never in the browser.
  const paymentData = buildPaymentData(body.plan, user.id, user.email!, userName, crypto.randomUUID());

  return NextResponse.json({ payfastUrl: PAYFAST_URL, paymentData });
}
