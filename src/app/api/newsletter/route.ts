import { NextResponse } from "next/server";

const BREVO_API_URL = "https://api.brevo.com/v3/contacts";
const BREVO_LIST_ID = parseInt(process.env.BREVO_LIST_ID ?? "2", 10);

export async function POST(request: Request) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error("BREVO_API_KEY is not set.");
    return NextResponse.json(
      { error: "Newsletter service is not configured." },
      { status: 500 }
    );
  }

  let email: string;
  try {
    const body = await request.json();
    email = (body.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Basic email validation — Brevo will also validate server-side, but
  // catching obvious mistakes here gives a faster, clearer error message.
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      email,
      listIds: [BREVO_LIST_ID],
      // updateEnabled: true means if this email already exists in Brevo,
      // we just add them to this list rather than erroring — avoids false
      // "already subscribed" errors for contacts added through other means.
      updateEnabled: true,
    }),
  });

  // 201 = contact created, 204 = contact already existed and was updated
  if (res.status === 201 || res.status === 204) {
    return NextResponse.json({ success: true });
  }

  const data = await res.json().catch(() => ({}));

  // Brevo returns 400 with code "duplicate_parameter" if this exact email
  // is already in this exact list — treat that as a soft success so the
  // user just sees "You're subscribed!" rather than a confusing error.
  if (res.status === 400 && data?.code === "duplicate_parameter") {
    return NextResponse.json({ success: true, alreadySubscribed: true });
  }

  console.error("Brevo API error:", res.status, data);
  return NextResponse.json(
    { error: "Couldn't subscribe right now. Please try again." },
    { status: 500 }
  );
}