import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { documentId, quizId, subject, topic, score, total, answers } =
    await request.json();

  if (
    typeof score !== "number" ||
    typeof total !== "number" ||
    total <= 0 ||
    score < 0 ||
    score > total
  ) {
    return NextResponse.json({ error: "Invalid score data." }, { status: 400 });
  }

  const { error: insertError } = await supabase.from("quiz_attempts").insert({
    user_id: userData.user.id,
    document_id: documentId ?? null,
    quiz_id: quizId ?? null,
    subject: subject ?? null,
    topic: typeof topic === "string" && topic.trim() ? topic.trim() : null,
    score,
    total,
    answers: Array.isArray(answers) ? answers : null,
  });

  if (insertError) {
    console.error("Failed to save quiz attempt:", insertError);
    return NextResponse.json(
      { error: "Couldn't save your quiz result." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}