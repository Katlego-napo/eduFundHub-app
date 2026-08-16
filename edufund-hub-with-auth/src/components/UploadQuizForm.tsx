"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Upload, ListChecks, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { QUIZ_GRADES } from "@/lib/types/quiz";
import MathText from "@/components/MathText";
import { parseBulkQuizJson } from "@/lib/bulkQuizImport";

type DraftQuestion = {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  diagram: string; // raw SVG string, empty = no diagram
};

type BulkResultRow = {
  label: string;
  ok: boolean;
  error?: string;
};

function emptyQuestion(): DraftQuestion {
  return {
    question: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    explanation: "",
    diagram: "",
  };
}

const BULK_PLACEHOLDER = `[
  {
    "quiz_title": "Algebra, Equations & Inequalities - Part 1",
    "questions": [
      {
        "question": "What is the value of $\\\\sin(90^\\\\circ)$?",
        "options": ["$0$", "$0.5$", "$1$", "$-1$"],
        "correct_index": 2,
        "explanation": "Because $\\\\sin(90^\\\\circ) = 1$, the opposite side matches the hypotenuse."
      }
    ]
  }
]`;

export default function UploadQuizForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"single" | "bulk">("single");

  // Shared across both modes
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState<string>(QUIZ_GRADES[4]); // Grade 12 default
  const [topic, setTopic] = useState("");

  // Single-entry mode state
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Bulk-paste mode state
  const [bulkJson, setBulkJson] = useState("");
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkTotal, setBulkTotal] = useState(0);
  const [bulkResults, setBulkResults] = useState<BulkResultRow[] | null>(null);

  function updateQuestion(index: number, patch: Partial<DraftQuestion>) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...patch } : q))
    );
  }

  function updateOption(qIndex: number, oIndex: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const options = [...q.options] as [string, string, string, string];
        options[oIndex] = value;
        return { ...q, options };
      })
    );
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, emptyQuestion()]);
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (questions.some((q) => q.options.some((o) => !o.trim()))) {
      setError("Every question needs all 4 options filled in.");
      return;
    }
    if (questions.some((q) => !q.question.trim())) {
      setError("Every question needs its question text filled in.");
      return;
    }
    if (questions.some((q) => !q.explanation.trim())) {
      setError("Every question needs an explanation for the correct answer.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subject,
          grade,
          topic: topic.trim() || null,
          questions: questions.map((q) => ({
            question: q.question.trim(),
            options: q.options.map((o) => o.trim()),
            correctIndex: q.correctIndex,
            explanation: q.explanation.trim(),
            diagram: q.diagram.trim()
              ? { type: "svg", content: q.diagram.trim() }
              : null,
          })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Couldn't create the quiz.");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/quizzes"), 1000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkImport() {
    setBulkError(null);
    setBulkResults(null);

    if (!subject.trim()) {
      setBulkError("Set a Subject above before importing — it's applied to every quiz in the batch.");
      return;
    }
    if (!bulkJson.trim()) {
      setBulkError("Paste a JSON array of quizzes first.");
      return;
    }

    const parsed = await parseBulkQuizJson(bulkJson);
    if (!parsed.ok) {
      setBulkError(parsed.error);
      return;
    }

    setBulkImporting(true);
    setBulkTotal(parsed.items.length);
    setBulkProgress(0);

    const results: BulkResultRow[] = [];

    // Sequential on purpose — one at a time, so "Processing X of Y" can
    // update cleanly and a failure in one quiz never affects the others.
    for (let i = 0; i < parsed.items.length; i++) {
      setBulkProgress(i + 1);
      const item = parsed.items[i];

      if (!item.ok) {
        results.push({ label: item.label, ok: false, error: item.error });
        continue;
      }

      try {
        const res = await fetch("/api/admin/quizzes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: item.quiz.title,
            subject,
            grade,
            topic: item.quiz.topic ?? (topic.trim() || null),
            questions: item.quiz.questions,
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          results.push({
            label: item.quiz.title,
            ok: false,
            error: data.error ?? "Server rejected this quiz.",
          });
        } else {
          results.push({ label: item.quiz.title, ok: true });
        }
      } catch {
        results.push({
          label: item.quiz.title,
          ok: false,
          error: "Network error while saving this quiz.",
        });
      }
    }

    setBulkResults(results);
    setBulkImporting(false);
  }

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-secondary";
  const labelClass = "text-sm font-medium text-foreground";

  const successCount = bulkResults?.filter((r) => r.ok).length ?? 0;
  const failCount = bulkResults?.filter((r) => !r.ok).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="inline-flex rounded-full border border-border bg-background p-1">
        <button
          type="button"
          onClick={() => setMode("single")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            mode === "single"
              ? "bg-primary text-white"
              : "text-muted hover:text-foreground"
          }`}
        >
          <Plus size={14} />
          Single Entry
        </button>
        <button
          type="button"
          onClick={() => setMode("bulk")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            mode === "bulk"
              ? "bg-primary text-white"
              : "text-muted hover:text-foreground"
          }`}
        >
          <ListChecks size={14} />
          Bulk Paste
        </button>
      </div>

      {/* Shared fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Subject</label>
          <input
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Mathematics"
            className={inputClass}
          />
          {mode === "bulk" && (
            <p className="mt-1 text-xs text-muted">
              Applied to every quiz in the pasted batch.
            </p>
          )}
        </div>
        <div>
          <label className={labelClass}>Topic <span className="font-normal text-muted">(optional)</span></label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Trigonometry"
            className={inputClass}
          />
          {mode === "bulk" && (
            <p className="mt-1 text-xs text-muted">
              Used as fallback if not in the JSON. Individual quizzes can override via a <code className="rounded bg-foreground/5 px-1">topic</code> field.
            </p>
          )}
        </div>
        <div>
          <label className={labelClass}>Grade</label>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className={inputClass}
          >
            {QUIZ_GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          {mode === "bulk" && (
            <p className="mt-1 text-xs text-muted">
              Applied to every quiz in the pasted batch.
            </p>
          )}
        </div>
      </div>

      {mode === "single" ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={labelClass}>Quiz Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Grade 12 Trigonometry Practice"
              className={inputClass}
            />
          </div>

          <div className="space-y-5">
            {questions.map((q, qi) => (
              <div
                key={qi}
                className="rounded-2xl border border-border bg-background p-5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-semibold text-foreground">
                    Question {qi + 1}
                  </h3>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(qi)}
                      className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
                    >
                      <Trash2 size={13} />
                      Remove
                    </button>
                  )}
                </div>

                <div className="mt-3">
                  <label className={labelClass}>Question</label>
                  <p className="mt-0.5 text-xs text-muted">
                    For math, wrap LaTeX in $...$ (inline) or $$...$$ (block), e.g.{" "}
                    <code className="rounded bg-foreground/5 px-1">
                      Solve for x: $2x + 3 = 11$
                    </code>
                  </p>
                  <textarea
                    required
                    rows={2}
                    value={q.question}
                    onChange={(e) => updateQuestion(qi, { question: e.target.value })}
                    placeholder="What is the value of sin(90°)?"
                    className={inputClass}
                  />
                  {q.question.includes("$") && (
                    <div className="mt-1.5 rounded-lg border border-dashed border-border bg-surface px-3 py-2 text-sm text-foreground">
                      <span className="mr-1.5 text-xs font-medium uppercase text-muted">
                        Preview:
                      </span>
                      <MathText text={q.question} />
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <label className={labelClass}>
                    Options (select the radio button next to the correct one)
                  </label>
                  <div className="mt-1.5 space-y-2">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name={`correct-${qi}`}
                          checked={q.correctIndex === oi}
                          onChange={() => updateQuestion(qi, { correctIndex: oi })}
                          className="h-4 w-4 shrink-0 accent-secondary"
                          aria-label={`Option ${oi + 1} is correct`}
                        />
                        <input
                          required
                          value={opt}
                          onChange={(e) => updateOption(qi, oi, e.target.value)}
                          placeholder={`Option ${oi + 1} (supports $LaTeX$)`}
                          className={`${inputClass} mt-0`}
                        />
                        {opt.includes("$") && (
                          <span className="shrink-0 rounded-lg border border-dashed border-border bg-surface px-2.5 py-2 text-sm text-foreground">
                            <MathText text={opt} />
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3">
                  <label className={labelClass}>
                    Explanation (shown after the student submits)
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={q.explanation}
                    onChange={(e) => updateQuestion(qi, { explanation: e.target.value })}
                    placeholder="sin(90°) = 1, since at 90° the opposite side equals the hypotenuse."
                    className={inputClass}
                  />
                  {q.explanation.includes("$") && (
                    <div className="mt-1.5 rounded-lg border border-dashed border-border bg-surface px-3 py-2 text-sm text-foreground">
                      <span className="mr-1.5 text-xs font-medium uppercase text-muted">
                        Preview:
                      </span>
                      <MathText text={q.explanation} />
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <label className={labelClass}>
                    Diagram{" "}
                    <span className="font-normal text-muted">(optional — paste SVG markup)</span>
                  </label>
                  <p className="mt-0.5 text-xs text-muted">
                    Paste a raw{" "}
                    <code className="rounded bg-foreground/5 px-1">&lt;svg&gt;...&lt;/svg&gt;</code>{" "}
                    block. Shown above the answer options. Leave blank for no diagram.
                  </p>
                  <textarea
                    rows={4}
                    value={q.diagram}
                    onChange={(e) => updateQuestion(qi, { diagram: e.target.value })}
                    placeholder="<svg viewBox='0 0 200 100' xmlns='http://www.w3.org/2000/svg'>...</svg>"
                    spellCheck={false}
                    className={`${inputClass} font-mono text-xs`}
                  />
                  {q.diagram.trim().startsWith("<svg") && (
                    <div className="mt-1.5 overflow-auto rounded-lg border border-dashed border-border bg-surface p-3">
                      <span className="mb-1 block text-xs font-medium uppercase text-muted">
                        Preview:
                      </span>
                      <div
                        className="max-w-full"
                        dangerouslySetInnerHTML={{ __html: q.diagram }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addQuestion}
            className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
          >
            <Plus size={14} />
            Add Another Question
          </button>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          {success && (
            <p className="rounded-lg bg-secondary/10 px-3 py-2 text-sm text-foreground">
              Quiz created! Redirecting...
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-60"
          >
            {loading ? "Publishing..." : "Publish Quiz"}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Bulk Paste JSON</label>
            <p className="mt-0.5 text-xs text-muted">
              Paste an array of quizzes. Each needs a{" "}
              <code className="rounded bg-foreground/5 px-1">quiz_title</code> and a{" "}
              <code className="rounded bg-foreground/5 px-1">questions</code> array —
              the correct answer can be a number (
              <code className="rounded bg-foreground/5 px-1">correct_index</code>) or a
              letter (<code className="rounded bg-foreground/5 px-1">A</code>–
              <code className="rounded bg-foreground/5 px-1">D</code>). LaTeX
              backslashes are handled automatically either single or double-escaped.
            </p>
            <textarea
              rows={14}
              value={bulkJson}
              onChange={(e) => setBulkJson(e.target.value)}
              placeholder={BULK_PLACEHOLDER}
              spellCheck={false}
              className={`${inputClass} font-mono text-xs`}
            />
          </div>

          {bulkError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {bulkError}
            </p>
          )}

          <button
            type="button"
            onClick={handleBulkImport}
            disabled={bulkImporting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-60"
          >
            {bulkImporting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Importing... ({bulkProgress} of {bulkTotal})
              </>
            ) : (
              <>
                <Upload size={15} />
                Import All Quizzes
              </>
            )}
          </button>

          {bulkResults && (
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-sm font-medium text-foreground">
                {successCount} imported
                {failCount > 0 && (
                  <span className="text-red-600"> &middot; {failCount} failed</span>
                )}
              </p>
              <div className="mt-3 max-h-64 space-y-1.5 overflow-y-auto">
                {bulkResults.map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${
                      r.ok ? "bg-secondary/10 text-foreground" : "bg-red-50 text-red-700"
                    }`}
                  >
                    {r.ok ? (
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-secondary" />
                    ) : (
                      <XCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
                    )}
                    <span>
                      <span className="font-medium">{r.label}</span>
                      {!r.ok && r.error && <span> — {r.error}</span>}
                    </span>
                  </div>
                ))}
              </div>
              {successCount > 0 && (
                <button
                  type="button"
                  onClick={() => router.push("/quizzes")}
                  className="mt-3 w-full rounded-full border border-border py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                >
                  View Quizzes
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}