"use client";

import { useState } from "react";
import { Brain, RefreshCw, CheckCircle2, XCircle } from "lucide-react";

type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export default function QuizGenerator({ documentId }: { documentId: string }) {
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateQuiz() {
    setLoading(true);
    setError(null);
    setSubmitted(false);
    setAnswers({});

    try {
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, numQuestions: 5 }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Couldn't generate a quiz.");
        return;
      }

      setQuiz(data.quiz as QuizQuestion[]);
    } catch {
      setError("Couldn't reach the AI assistant. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function selectAnswer(qIndex: number, optionIndex: number) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));
  }

  const score =
    quiz?.reduce((acc, q, i) => (answers[i] === q.correctIndex ? acc + 1 : acc), 0) ?? 0;

  // Fire-and-forget: save the result for the dashboard's quiz stats.
  // Deliberately doesn't block or disrupt the submit flow if it fails —
  // seeing your score right now matters more than the save succeeding,
  // so failures are just logged rather than shown to the user.
  async function saveAttempt(finalScore: number, total: number) {
    try {
      const res = await fetch("/api/ai/quiz/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, score: finalScore, total }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("Failed to save quiz attempt:", data.error);
      }
    } catch (err) {
      console.error("Failed to save quiz attempt:", err);
    }
  }

  function handleSubmit() {
    if (!quiz) return;
    setSubmitted(true);
    saveAttempt(score, quiz.length);
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
          <Brain size={16} className="text-secondary" />
          Practice Quiz
        </h3>
        <button
          onClick={generateQuiz}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-60"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {quiz ? "Generate New Quiz" : "Generate Quiz"}
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {!quiz && !loading && (
        <p className="mt-4 text-sm text-muted">
          Generate a 5-question multiple-choice quiz based on this document.
        </p>
      )}

      {quiz && (
        <div className="mt-5 space-y-6">
          {quiz.map((q, qi) => {
            const userAnswer = answers[qi];
            const isCorrect = userAnswer === q.correctIndex;

            return (
              <div key={qi} className="border-t border-border pt-5 first:border-t-0 first:pt-0">
                <p className="font-medium text-foreground">
                  {qi + 1}. {q.question}
                </p>
                <div className="mt-3 space-y-2">
                  {q.options.map((opt, oi) => {
                    const isSelected = userAnswer === oi;
                    const showCorrect = submitted && oi === q.correctIndex;
                    const showWrong = submitted && isSelected && !isCorrect;

                    return (
                      <button
                        key={oi}
                        onClick={() => selectAnswer(qi, oi)}
                        disabled={submitted}
                        className={`flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ${
                          showCorrect
                            ? "border-secondary bg-secondary/10 text-foreground"
                            : showWrong
                            ? "border-red-300 bg-red-50 text-foreground"
                            : isSelected
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border text-foreground hover:bg-foreground/5"
                        }`}
                      >
                        {opt}
                        {showCorrect && <CheckCircle2 size={16} className="text-secondary" />}
                        {showWrong && <XCircle size={16} className="text-red-500" />}
                      </button>
                    );
                  })}
                </div>
                {submitted && (
                  <p className="mt-2 text-xs text-muted">
                    <span className="font-medium text-foreground">Explanation: </span>
                    {q.explanation}
                  </p>
                )}
              </div>
            );
          })}

          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={Object.keys(answers).length !== quiz.length}
              className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-60"
            >
              Submit Quiz
            </button>
          ) : (
            <div className="rounded-xl bg-accent/15 px-4 py-3 text-center">
              <p className="font-display text-lg font-semibold text-[#7A5A0A]">
                You scored {score} / {quiz.length}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}