import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { revalidatePath } from "next/cache";
import type { QuizQuestion } from "@/lib/types/quiz";

// Collapse stray spaces: "  Algebra   basics " -> "Algebra basics"
function tidy(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function isValidQuestion(q: unknown): q is QuizQuestion {
  if (typeof q !== "object" || q === null) return false;
  const question = q as Record<string, unknown>;
  return (
    typeof question.question === "string" &&
    question.question.trim().length > 0 &&
    Array.isArray(question.options) &&
    question.options.length === 4 &&
    question.options.every((o) => typeof o === "string" && o.trim().length > 0) &&
    typeof question.correctIndex === "number" &&
    question.correctIndex >= 0 &&
    question.correctIndex <= 3 &&
    typeof question.explanation === "string"
  );
}

export async function POST(request: Request) {
  const { user, isAdmin } = await getCurrentUserWithRole();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!isAdmin) {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  const { title, subject, grade, topic, questions } = await request.json();

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }
  if (!subject || typeof subject !== "string" || !subject.trim()) {
    return NextResponse.json({ error: "Subject is required." }, { status: 400 });
  }
  if (!grade || typeof grade !== "string" || !grade.trim()) {
    return NextResponse.json({ error: "Grade is required." }, { status: 400 });
  }
  if (!Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json(
      { error: "At least one question is required." },
      { status: 400 }
    );
  }
  if (!questions.every(isValidQuestion)) {
    return NextResponse.json(
      {
        error:
          "Each question needs question text, exactly 4 filled-in options, a correct answer selected, and an explanation.",
      },
      { status: 400 }
    );
  }

  // Service-role client: this route has already done its own auth +
  // isAdmin check above, so RLS doesn't need to gate this write too.
  const serviceClient = createServiceClient();

  // Reuse the spelling already in the database when the new subject/topic
  // matches ignoring capitalisation, so "algebra" never becomes a second
  // "Algebra" topic. The first spelling saved wins.
  const { data: known } = await serviceClient.from("quizzes").select("subject, topic");
  const rows = known ?? [];

  const cleanSubject = tidy(subject);
  const subjectMatch = rows.find(
    (r) => r.subject.toLowerCase() === cleanSubject.toLowerCase()
  );
  const finalSubject = subjectMatch?.subject ?? cleanSubject;

  let finalTopic: string | null =
    typeof topic === "string" && tidy(topic) ? tidy(topic) : null;
  if (finalTopic) {
    const wanted = finalTopic.toLowerCase();
    const topicMatch = rows.find(
      (r) => r.subject === finalSubject && r.topic && r.topic.toLowerCase() === wanted
    );
    if (topicMatch?.topic) finalTopic = topicMatch.topic;
  }

  const { error: insertError } = await serviceClient.from("quizzes").insert({
    title: title.trim(),
    subject: finalSubject,
    grade: grade.trim(),
    topic: finalTopic,
    questions,
    created_by: user.id,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  revalidatePath("/quizzes");

  return NextResponse.json({ success: true });
}