import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  let email: string;
  try {
    const body = await request.json();
    email = (body.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email });

  // 23505 = already subscribed, so treat it as success
  if (error && error.code !== "23505") {
    console.error("Newsletter insert error:", error);
    return NextResponse.json(
      { error: "Couldn't subscribe right now. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, alreadySubscribed: error?.code === "23505" });
}
