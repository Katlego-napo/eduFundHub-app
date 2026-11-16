"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Quiz } from "@/lib/types/quiz";
import { Brain, BookmarkX, FileQuestion, Award, Eye } from "lucide-react";
import { QuizTaker, type AttemptedMap } from "@/components/QuizzesBrowser";

export default function SavedQuizzesList({
  quizzes,
  allQuizzes = [],
  initialAttemptedQuizzes = {},
}: {
  quizzes: Quiz[];
  allQuizzes?: Quiz[];
  initialAttemptedQuizzes?: AttemptedMap;
}) {
  const supabase = createClient();
  const [savedQuizzes, setSavedQuizzes] = useState(quizzes);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [attempted, setAttempted] = useState<AttemptedMap>(initialAttemptedQuizzes);

  async function handleUnsave(quiz: Quiz) {
    setRemovingId(quiz.id);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { error } = await supabase
        .from("saved_quizzes")
        .delete()
        .eq("user_id", userData.user.id)
        .eq("quiz_id", quiz.id);

      if (!error) {
        setSavedQuizzes((prev) => prev.filter((q) => q.id !== quiz.id));
      }
    } finally {
      setRemovingId(null);
    }
  }

  function handleSubmitted(quizId: string, score: number, total: number, answers: number[]) {
    setAttempted((prev) => ({ ...prev, [quizId]: { score, total, answers } }));
  }

  if (activeQuiz) {
    const existing = attempted[activeQuiz.id];
    return (
      <QuizTaker
        key={activeQuiz.id}
        quiz={activeQuiz}
        allQuizzes={allQuizzes}
        attemptedQuizzes={attempted}
        onBack={() => setActiveQuiz(null)}
        onSelectRelated={(q) => setActiveQuiz(q)}
        onSubmitted={handleSubmitted}
        reviewMode={!!existing}
        initialAnswers={existing?.answers}
      />
    );
  }

  if (savedQuizzes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface px-6 py-14 text-center">
        <FileQuestion size={28} className="text-muted" />
        <p className="text-sm text-muted">
          You haven&apos;t saved any quizzes yet. Bookmark one from the{" "}
          <a href="/quizzes" className="font-medium text-primary hover:underline">
            Quizzes page
          </a>{" "}
          to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {savedQuizzes.map((quiz) => {
        const result = attempted[quiz.id];
        return (
          <div
            key={quiz.id}
            className="relative flex flex-col rounded-2xl border border-border bg-surface p-6 transition-shadow hover:shadow-lg hover:shadow-black/5"
          >
            <button
              onClick={() => handleUnsave(quiz)}
              disabled={removingId === quiz.id}
              aria-label="Remove from saved quizzes"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-50"
            >
              <BookmarkX size={14} />
            </button>

            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
              <Brain size={18} />
            </span>

            <h3 className="mt-4 font-display text-base font-semibold text-foreground">
              {quiz.title}
            </h3>
            <p className="mt-1 text-sm text-muted">
              {quiz.grade} &middot; {quiz.subject}
            </p>
            <p className="mt-1 text-xs text-muted">
              {quiz.questions.length} question{quiz.questions.length !== 1 ? "s" : ""}
            </p>

            {result ? (
              <button
                onClick={() => setActiveQuiz(quiz)}
                className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-full bg-secondary/10 py-2.5 text-sm font-semibold text-secondary transition-colors hover:bg-secondary/15"
              >
                <Award size={15} />
                Completed &middot; {result.score}/{result.total}
                <Eye size={14} className="ml-0.5" />
              </button>
            ) : (
              <button
                onClick={() => setActiveQuiz(quiz)}
                className="mt-5 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
              >
                Take Quiz
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}