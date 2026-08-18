import { NextResponse } from "next/server";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { buildPaymentData, PAYFAST_URL, type PayfastPlan } from "@/lib/payfast";

export async function POST(request: Request) {
  const { user } = await getCurrentUserWithRole();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { plan } = await request.json();

  if (plan !== "monthly" && plan !== "exam_season") {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  const userName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Student";

  const paymentData = buildPaymentData(
    plan as PayfastPlan,
    user.id,
    user.email!,
    userName
  );

  // Return the PayFast URL and payment data to the client so it can
  // build and auto-submit the form. We do this server-side so the
  // merchant key and signature generation never happen in the browser.
  return NextResponse.json({
    payfastUrl: PAYFAST_URL,
    paymentData,
  });
}