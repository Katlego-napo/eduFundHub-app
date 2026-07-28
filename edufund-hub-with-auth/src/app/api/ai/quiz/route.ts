import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateQuizFromDocument } from "@/lib/ai/gemini";
import { checkAndLogAiUsage, DAILY_LIMIT } from "@/lib/ai/rateLimit";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { documentId, numQuestions } = await request.json();

  if (!documentId) {
    return NextResponse.json({ error: "Document is required." }, { status: 400 });
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

  const { data: document, error: docError } = await supabase
    .from("study_documents")
    .select("extracted_text, user_id")
    .eq("id", documentId)
    .single();

  if (docError || !document || document.user_id !== userData.user.id) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  try {
    const quiz = await generateQuizFromDocument(
      document.extracted_text,
      Math.min(Math.max(numQuestions ?? 5, 1), 10)
    );
    return NextResponse.json({ quiz, usedToday });
  } catch {
    return NextResponse.json(
      { error: "Couldn't generate a quiz right now. Please try again." },
      { status: 500 }
    );
  }
}
