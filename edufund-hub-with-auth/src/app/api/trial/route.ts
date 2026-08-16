import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";

const TRIAL_DAYS = 14;

export async function POST() {
  const { user } = await getCurrentUserWithRole();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const supabase = await createClient();

  // Check if user has already used their trial — read from profiles
  // (RLS-scoped to this user, so no service client needed for reads).
  const { data: profile } = await supabase
    .from("profiles")
    .select("trial_used")
    .eq("id", user.id)
    .single();

  if (profile?.trial_used) {
    return NextResponse.json(
      { error: "You have already used your free trial." },
      { status: 409 }
    );
  }

  // Check if they already have an active subscription or trial running.
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.status === "active" || existing?.status === "trial") {
    const periodEnd = existing.current_period_end
      ? new Date(existing.current_period_end)
      : null;
    if (!periodEnd || periodEnd > new Date()) {
      return NextResponse.json(
        { error: "You already have an active subscription or trial." },
        { status: 409 }
      );
    }
  }

  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);

  // Use the service-role client for writes — the subscriptions table has
  // no client-side insert policy (writes are restricted to server-side
  // code only, to prevent users from manipulating their own status).
  const serviceClient = createServiceClient();

  const { error: subscriptionError } = await serviceClient
    .from("subscriptions")
    .upsert(
      {
        user_id: user.id,
        status: "trial",
        plan: "trial",
        current_period_end: trialEnd.toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (subscriptionError) {
    console.error("Failed to create trial subscription:", subscriptionError);
    return NextResponse.json(
      { error: "Couldn't start your trial. Please try again." },
      { status: 500 }
    );
  }

  // Mark trial as used on the profiles table — this is the permanent
  // record that prevents a second trial even if the subscription row
  // is later deleted or overwritten.
  const { error: profileError } = await serviceClient
    .from("profiles")
    .update({ trial_used: true })
    .eq("id", user.id);

  if (profileError) {
    console.error("Failed to mark trial_used on profile:", profileError);
    // Not blocking — the subscription row was already created, so the
    // trial works. The trial_used flag will be set on next login check
    // or can be manually corrected in the DB if needed.
  }

  return NextResponse.json({
    success: true,
    trialEnd: trialEnd.toISOString(),
  });
}