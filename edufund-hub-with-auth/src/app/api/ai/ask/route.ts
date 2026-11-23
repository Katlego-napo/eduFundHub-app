import { NextResponse } from "next/server";
import { STUDY_ASSISTANT_ENABLED } from "@/lib/features";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getSubscriptionStatus } from "@/lib/auth/getSubscriptionStatus";
import { askQuestionAboutDocument } from "@/lib/ai/gemini";
import { checkAndLogAiUsage, DAILY_LIMIT } from "@/lib/ai/rateLimit";

export async function POST(request: Request) {
  if (!STUDY_ASSISTANT_ENABLED) {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }
  const supabase = await createClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // The assistant is a subscriber feature (admins always count as subscribed).
  const { isSubscribed } = await getSubscriptionStatus();
  if (!isSubscribed) {
    return NextResponse.json(
      { error: "Please subscribe to use the AI Study Assistant." },
      { status: 403 }
    );
  }

  const { documentId, question } = await request.json();

  if (!documentId || !question?.trim()) {
    return NextResponse.json(
      { error: "Document and question are required." },
      { status: 400 }
    );
  }

  const { allowed, usedToday } = await checkAndLogAiUsage(userData.user.id);
  if (!allowed) {
    return NextResponse.json(
      {
        error: `You've reached today's limit of ${DAILY_LIMIT} AI requests. Please try again tomorrow.`,
      },
      { status: 429 }
    );
  }

  // Study guides are shared (uploaded by the admin), read with the service
  // client because no user-level RLS policy exposes the guide text.
  const { data: document, error: docError } = await createServiceClient()
    .from("study_documents")
    .select("extracted_text")
    .eq("id", documentId)
    .single();

  if (docError || !document) {
    return NextResponse.json({ error: "Study guide not found." }, { status: 404 });
  }

  try {
    const answer = await askQuestionAboutDocument(document.extracted_text, question.trim());
    return NextResponse.json({ answer, usedToday });
  } catch {
    return NextResponse.json(
      { error: "The AI assistant is unavailable right now. Please try again shortly." },
      { status: 500 }
    );
  }
}
