import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { cancelPayFastSubscription } from "@/lib/payfastCancel";

// Add any other tables that have a user_id column pointing at the user.
const USER_TABLES = ["quiz_attempts", "saved_quizzes", "payments", "subscriptions"];

export async function POST(request: Request) {
  // 1. Who is asking? Taken from the session cookie, never from the request body.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (body?.confirm !== "DELETE") {
    return NextResponse.json({ error: "Type DELETE to confirm." }, { status: 400 });
  }

  const admin = createServiceClient();

  // 2. Stop PayFast billing FIRST. If this fails we stop here, so nobody is
  //    left with an active subscription and no account.
  const { data: sub } = await admin
    .from("subscriptions")
    .select("payfast_token, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (sub?.payfast_token && sub.status === "active") {
    const result = await cancelPayFastSubscription(sub.payfast_token);
    if (!result.ok) {
      console.error("Account delete aborted, PayFast cancel failed:", result.message);
      return NextResponse.json(
        {
          error:
            "We couldn't cancel your subscription, so your account has not been deleted. Please try again, or contact admin@edufundhub.co.za.",
        },
        { status: 502 }
      );
    }
  }

  // 3. Delete the user's rows, then the account itself.
  for (const table of USER_TABLES) {
    const { error } = await admin.from(table).delete().eq("user_id", user.id);
    if (error) {
      console.error(`Account delete failed on ${table}:`, error.message);
      return NextResponse.json(
        { error: "Something went wrong deleting your data. Please try again." },
        { status: 500 }
      );
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    // Most likely a table not in USER_TABLES still references this user.
    console.error("Account delete failed on auth user:", deleteError.message);
    return NextResponse.json(
      { error: "Something went wrong deleting your account. Please try again." },
      { status: 500 }
    );
  }

  // 4. Clear the session cookie. Don't fail the request if this errors.
  try {
    await supabase.auth.signOut();
  } catch {}

  return NextResponse.json({ ok: true });
}
