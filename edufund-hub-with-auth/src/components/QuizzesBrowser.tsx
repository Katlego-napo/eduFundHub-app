"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import MathText from "@/components/MathText";
import DiagramRenderer from "@/components/DiagramRenderer";
import SubjectTopicBrowser from "@/components/SubjectTopicBrowser";
import { hasUsedFreeQuizSample, markFreeQuizSampleUsed } from "@/lib/freeQuizSample";
import type { Quiz } from "@/lib/types/quiz";
import {
  Search,
  Brain,
  Trash2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Award,
  Eye,
  RefreshCw,
  Lock,
} from "lucide-react";

export type AttemptedMap = Record<
  string,
  { score: number; total: number; answers?: number[] }
>;

export default function QuizzesBrowser({
  quizzes,
  isAdmin = false,
  isLoggedIn = false,
  isSubscribed = false,
  initialSavedQuizIds = [],
  initialAttemptedQuizzes = {},
  initialSubject = null,
  initialTopic = null,
  initialQuizId = null,
}: {
  quizzes: Quiz[];
  isAdmin?: boolean;
  isLoggedIn?: boolean;
  isSubscribed?: boolean;
  initialSavedQuizIds?: string[];
  initialAttemptedQuizzes?: AttemptedMap;
  initialSubject?: string | null;
  initialTopic?: string | null;
  initialQuizId?: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [allQuizzes, setAllQuizzes] = useState(quizzes);
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [gradeFilter, setGradeFilter] = useState("All");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // Deep link from the dashboard (?quiz=ID). Only opens quizzes the user has
  // already completed (review mode), so it can't skip the free-sample limit.
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(() =>
    initialQuizId && initialAttemptedQuizzes[initialQuizId]
      ? quizzes.find((q) => q.id === initialQuizId) ?? null
      : null
  );
  const [savedIds, setSavedIds] = useState<Set<string>>(
    new Set(initialSavedQuizIds)
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [attempted, setAttempted] = useState<AttemptedMap>(initialAttemptedQuizzes);
  const [sampleUsed, setSampleUsed] = useState(false);
  const [view, setView] = useState<"subjects" | "all">("subjects");
  const [activeSubject, setActiveSubject] = useState<string | null>(initialSubject);
  const [activeTopic, setActiveTopic] = useState<string | null>(
    initialSubject ? initialTopic : null
  );

  useEffect(() => {
    // Non-subscribers (both anonymous and logged-in) share the same
    // one-free-quiz gate tracked in localStorage.
    const used = !isSubscribed ? hasUsedFreeQuizSample() : false;
    if (!isSubscribed) setSampleUsed(used);

    // Deep link from search (?quiz=ID): open the quiz directly, but only
    // when the user is actually allowed to take it (subscriber, admin, or
    // still has their free sample). Otherwise they just land on the list,
    // where the normal "Subscribe to Unlock" gate applies.
    if (initialQuizId && (isSubscribed || isAdmin || !used)) {
      const target = quizzes.find((q) => q.id === initialQuizId);
      if (target) setActiveQuiz((current) => current ?? target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubscribed]);

  const subjects = useMemo(
    () => ["All", ...Array.from(new Set(allQuizzes.map((q) => q.subject)))],
    [allQuizzes]
  );
  const grades = useMemo(
    () => ["All", ...Array.from(new Set(allQuizzes.map((q) => q.grade)))],
    [allQuizzes]
  );

  const filtered = allQuizzes.filter((q) => {
    const matchesQuery = `${q.title} ${q.subject}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesSubject = subjectFilter === "All" || q.subject === subjectFilter;
    const matchesGrade = gradeFilter === "All" || q.grade === gradeFilter;
    return matchesQuery && matchesSubject && matchesGrade;
  });

  async function handleDelete(quiz: Quiz) {
    const confirmed = window.confirm(`Delete "${quiz.title}"? This can't be undone.`);
    if (!confirmed) return;

    setDeletingId(quiz.id);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/admin/quizzes/${quiz.id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setDeleteError(data.error ?? "Couldn't delete this quiz.");
        return;
      }

      setAllQuizzes((prev) => prev.filter((q) => q.id !== quiz.id));
      router.refresh();
    } catch {
      setDeleteError("Something went wrong. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  const [deletingTopic, setDeletingTopic] = useState<string | null>(null);

  // Admin: delete every quiz shown in a topic, in one go.
  async function handleDeleteTopic(topicName: string, topicQuizzes: Quiz[]) {
    const n = topicQuizzes.length;
    const confirmed = window.confirm(
      `Delete the topic "${topicName}" and all ${n} quiz${n !== 1 ? "zes" : ""} in it? This can't be undone.`
    );
    if (!confirmed) return;

    setDeletingTopic(topicName);
    setDeleteError(null);
    try {
      const res = await fetch("/api/admin/quizzes/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: topicQuizzes.map((q) => q.id) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(data.error ?? "Couldn't delete this topic.");
        return;
      }
      const gone = new Set(topicQuizzes.map((q) => q.id));
      setAllQuizzes((prev) => prev.filter((q) => !gone.has(q.id)));
      if (activeTopic === topicName) setActiveTopic(null);
      router.refresh();
    } catch {
      setDeleteError("Something went wrong. Please try again.");
    } finally {
      setDeletingTopic(null);
    }
  }

  async function toggleSave(quiz: Quiz) {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    setSavingId(quiz.id);
    const alreadySaved = savedIds.has(quiz.id);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      if (alreadySaved) {
        const { error } = await supabase
          .from("saved_quizzes")
          .delete()
          .eq("user_id", userData.user.id)
          .eq("quiz_id", quiz.id);
        if (!error) {
          setSavedIds((prev) => {
            const next = new Set(prev);
            next.delete(quiz.id);
            return next;
          });
        }
      } else {
        const { error } = await supabase
          .from("saved_quizzes")
          .insert({ user_id: userData.user.id, quiz_id: quiz.id });
        if (!error) {
          setSavedIds((prev) => new Set(prev).add(quiz.id));
        }
      }
    } finally {
      setSavingId(null);
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
        isLoggedIn={isSubscribed}
        onFreeSampleUsed={() => {
          markFreeQuizSampleUsed();
          setSampleUsed(true);
        }}
      />
    );
  }

  return (
    <div>
      {!isSubscribed && sampleUsed && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-secondary/30 bg-secondary/10 px-5 py-4">
          <p className="text-sm text-foreground">
            <strong>You&apos;ve tried your free sample quiz!</strong>{" "}
            {isLoggedIn
              ? "Subscribe to unlock unlimited quizzes and track your progress."
              : "Sign up free or subscribe to unlock unlimited quizzes."}
          </p>
          <div className="flex shrink-0 gap-2">
            <a
              href="/pricing"
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
            >
              View Plans
            </a>
            {!isLoggedIn && (
              <a
                href="/login"
                className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
              >
                Log In
              </a>
            )}
          </div>
        </div>
      )}

      {view === "subjects" && deleteError && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{deleteError}</div>
      )}

      <div className="mb-5 inline-flex rounded-full border border-border bg-surface p-1 text-sm font-medium">
        {(["subjects", "all"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-full px-4 py-1.5 transition-colors ${
              view === v ? "bg-primary text-white" : "text-muted hover:text-foreground"
            }`}
          >
            {v === "subjects" ? "By subject" : "All quizzes"}
          </button>
        ))}
      </div>

      {view === "subjects" ? (
        <SubjectTopicBrowser
          quizzes={allQuizzes}
          attempted={attempted}
          isSubscribed={isSubscribed}
          sampleUsed={sampleUsed}
          grades={grades}
          gradeFilter={gradeFilter}
          onGradeChange={setGradeFilter}
          activeSubject={activeSubject}
          onSubjectChange={(s) => {
            setActiveSubject(s);
            setActiveTopic(null);
          }}
          activeTopic={activeTopic}
          onTopicChange={setActiveTopic}
          onStart={(q) => setActiveQuiz(q)}
          isAdmin={isAdmin}
          onDeleteTopic={handleDeleteTopic}
          deletingTopic={deletingTopic}
        />
      ) : (
      <>
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-2">
        <Search size={18} className="ml-2 shrink-0 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by quiz title or subject..."
          className="w-full min-w-0 bg-transparent py-2 text-sm text-foreground placeholder:text-muted/70 focus:outline-none"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="rounded-full border border-border bg-surface px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
        >
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s === "All" ? "All Subjects" : s}
            </option>
          ))}
        </select>
        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="rounded-full border border-border bg-surface px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
        >
          {grades.map((g) => (
            <option key={g} value={g}>
              {g === "All" ? "All Grades" : g}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-4 text-sm text-muted">
        {filtered.length} quiz{filtered.length !== 1 ? "zes" : ""} found
      </p>

      {deleteError && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {deleteError}
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface px-6 py-14 text-center">
            <Brain size={28} className="text-muted" />
            <p className="text-sm text-muted">
              No quizzes match your search. Try different filters.
            </p>
          </div>
        ) : (
          filtered.map((quiz) => {
            const isSaved = savedIds.has(quiz.id);
            const result = attempted[quiz.id];
            return (
              <div
                key={quiz.id}
                className="relative flex flex-col rounded-2xl border border-border bg-surface p-6 transition-shadow hover:shadow-lg hover:shadow-black/5"
              >
                <div className="absolute right-4 top-4 flex items-center gap-1.5">
                  <button
                    onClick={() => toggleSave(quiz)}
                    disabled={savingId === quiz.id}
                    aria-label={isSaved ? "Unsave quiz" : "Save quiz"}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors disabled:opacity-50 ${
                      isSaved
                        ? "border-secondary bg-secondary/10 text-secondary"
                        : "border-border text-muted hover:border-secondary hover:text-secondary"
                    }`}
                  >
                    {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(quiz)}
                      disabled={deletingId === quiz.id}
                      aria-label={`Delete "${quiz.title}"`}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-red-200 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

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
                  {quiz.questions.length} question
                  {quiz.questions.length !== 1 ? "s" : ""}
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
                ) : !isSubscribed && sampleUsed ? (
                  <a
                    href="/pricing"
                    className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-full bg-primary/10 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
                  >
                    <Lock size={14} />
                    Subscribe to Unlock
                  </a>
                ) : (
                  <button
                    onClick={() => setActiveQuiz(quiz)}
                    className="mt-5 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
                  >
                    {!isSubscribed ? "Try Free Sample" : "Take Quiz"}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
      </>
      )}
    </div>
  );
}

// Exported so /saved-quizzes can reuse the exact same take-quiz +
// review + related-quizzes experience without duplicating this logic.
export function QuizTaker({
  quiz,
  onBack,
  allQuizzes = [],
  attemptedQuizzes = {},
  onSelectRelated,
  onSubmitted,
  reviewMode = false,
  initialAnswers,
  isLoggedIn = true,
  onFreeSampleUsed,
}: {
  quiz: Quiz;
  onBack: () => void;
  allQuizzes?: Quiz[];
  attemptedQuizzes?: AttemptedMap;
  onSelectRelated?: (quiz: Quiz) => void;
  onSubmitted?: (quizId: string, score: number, total: number, answers: number[]) => void;
  reviewMode?: boolean;
  initialAnswers?: number[];
  isLoggedIn?: boolean;
  onFreeSampleUsed?: () => void;
}) {
  const MAX_RETAKES = 20;
  const [answers, setAnswers] = useState<Record<number, number>>(() => {
    if (!initialAnswers) return {};
    return initialAnswers.reduce<Record<number, number>>((acc, val, i) => {
      acc[i] = val;
      return acc;
    }, {});
  });
  const [submitted, setSubmitted] = useState(reviewMode);
  const [saveError, setSaveError] = useState(false);
  // Local copies of reviewMode/practice state — reviewMode itself is a
  // static prop set once when this component opens, but once a retake
  // starts we need to flip out of "review only" without waiting for a
  // remount, so that stays in state instead.
  const [isReviewOnly, setIsReviewOnly] = useState(reviewMode);
  const [isPracticeAttempt, setIsPracticeAttempt] = useState(false);
  const [retakeCount, setRetakeCount] = useState(0);

  // The permanent, saved first-attempt result for this quiz (if any) —
  // used to remind the student what their official score stays at
  // while they're retaking for practice.
  const officialResult = attemptedQuizzes[quiz.id];

  // Scroll to the top whenever a quiz is opened — since quiz cards can
  // be scrolled far down the page, without this the quiz view renders
  // starting from wherever the page happened to be scrolled to, instead
  // of showing the title and first question.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [quiz.id]);

  function selectAnswer(qIndex: number, optionIndex: number) {
    if (submitted || isReviewOnly) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));
  }

  const score = quiz.questions.reduce(
    (acc, q, i) => (answers[i] === q.correctIndex ? acc + 1 : acc),
    0
  );

  const relatedQuizzes = allQuizzes.filter(
    (q) =>
      q.id !== quiz.id &&
      q.subject === quiz.subject &&
      q.grade === quiz.grade &&
      !attemptedQuizzes[q.id]
  );

  // Fire-and-forget, same pattern as the AI quiz: doesn't block or
  // disrupt the student seeing their score if the save fails. Only
  // ever called on a genuine first submission — never in review mode,
  // since that would create a duplicate attempt row for the same quiz.
  async function saveAttempt(answersArray: number[]) {
    try {
      const res = await fetch("/api/ai/quiz/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: quiz.id,
          subject: quiz.subject,
          topic: quiz.topic ?? null,
          score,
          total: quiz.questions.length,
          answers: answersArray,
        }),
      });
      if (!res.ok) {
        setSaveError(true);
        const data = await res.json().catch(() => ({}));
        console.error("Failed to save quiz attempt:", data.error);
      }
    } catch (err) {
      setSaveError(true);
      console.error("Failed to save quiz attempt:", err);
    }
  }

  function handleSubmit() {
    if (isReviewOnly) return;
    const answersArray = quiz.questions.map((_, i) => answers[i]);
    setSubmitted(true);
    // Only the genuine first attempt ever gets saved. Practice retakes
    // are deliberately not persisted at all — no API call, nothing
    // written to the database, so they can never affect the saved
    // score, rank, or subject stats.
    if (!isPracticeAttempt) {
      if (isLoggedIn) {
        saveAttempt(answersArray);
        onSubmitted?.(quiz.id, score, quiz.questions.length, answersArray);
      } else {
        // Anonymous visitor: this was their one free sample quiz.
        // There's no account to save a score against, so skip the API
        // call entirely (it would just 401) and mark the sample used.
        onFreeSampleUsed?.();
      }
    }
  }

  function handleRetake() {
    if (retakeCount >= MAX_RETAKES) return;
    setRetakeCount((c) => c + 1);
    setIsPracticeAttempt(true);
    setIsReviewOnly(false);
    setAnswers({});
    setSubmitted(false);
    setSaveError(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary"
      >
        <ArrowLeft size={15} />
        Back to quizzes
      </button>

      <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
        {quiz.title}
      </h2>
      <p className="mt-1 text-sm text-muted">
        {quiz.grade} &middot; {quiz.subject}
        {isReviewOnly && (
          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2 py-0.5 text-xs font-medium text-muted">
            <Eye size={11} />
            Reviewing your answers
          </span>
        )}
        {isPracticeAttempt && !isReviewOnly && (
          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-[#7A5A0A]">
            <RefreshCw size={11} />
            Practice attempt &middot; won&apos;t be saved
          </span>
        )}
      </p>

      <div className="mt-6 space-y-6">
        {quiz.questions.map((q, qi) => {
          const userAnswer = answers[qi];
          const isCorrect = userAnswer === q.correctIndex;

          return (
            <div key={qi} className="border-t border-border pt-5 first:border-t-0 first:pt-0">
              <p className="font-medium text-foreground">
                {qi + 1}. <MathText text={q.question} />
              </p>
              {q.diagram && <DiagramRenderer diagram={q.diagram} />}
              <div className="mt-3 space-y-2">
                {q.options.map((opt, oi) => {
                  const isSelected = userAnswer === oi;
                  const showCorrect = submitted && oi === q.correctIndex;
                  const showWrong = submitted && isSelected && !isCorrect;

                  return (
                    <button
                      key={oi}
                      onClick={() => selectAnswer(qi, oi)}
                      disabled={submitted || isReviewOnly}
                      className={`flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ${
                        showCorrect
                          ? "border-secondary bg-secondary/10 text-foreground"
                          : showWrong
                          ? "border-red-300 bg-red-50 text-foreground"
                          : isSelected
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border text-foreground hover:bg-foreground/5"
                      } ${(submitted || isReviewOnly) && !isSelected && !showCorrect ? "opacity-70" : ""}`}
                    >
                      <span className="flex-1">
                        <MathText text={opt} />
                      </span>
                      {showCorrect && <CheckCircle2 size={16} className="text-secondary" />}
                      {showWrong && <XCircle size={16} className="text-red-500" />}
                    </button>
                  );
                })}
              </div>
              {submitted && (
                <p className="mt-2 text-xs text-muted">
                  <span className="font-medium text-foreground">Explanation: </span>
                  <MathText text={q.explanation} />
                </p>
              )}
            </div>
          );
        })}

        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length !== quiz.questions.length}
            className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-60"
          >
            Submit Quiz
          </button>
        ) : (
          <>
            <div className="rounded-xl bg-accent/15 px-4 py-3 text-center">
              <p className="font-display text-lg font-semibold text-[#7A5A0A]">
                You scored {score} / {quiz.questions.length}
              </p>
              {isPracticeAttempt && officialResult && (
                <p className="mt-1 text-xs text-muted">
                  Practice attempt — not saved. Your official score stays{" "}
                  {officialResult.score}/{officialResult.total}.
                </p>
              )}
              {saveError && !isPracticeAttempt && (
                <p className="mt-1 text-xs text-red-600">
                  Your score couldn&apos;t be saved to your dashboard, but here&apos;s
                  your result.
                </p>
              )}
            </div>

            {!isLoggedIn ? (
              <div className="rounded-2xl border border-secondary/30 bg-secondary/10 p-5 text-center">
                <p className="font-display text-base font-semibold text-foreground">
                  Enjoyed that? 🎉
                </p>
                <p className="mt-1 text-sm text-muted">
                  Sign up free and subscribe to unlock unlimited quizzes, track
                  your progress, and see how you rank against other students.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2.5">
                  <a
                    href="/pricing"
                    className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
                  >
                    View Plans
                  </a>
                  <a
                    href="/login"
                    className="rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
                  >
                    Log In
                  </a>
                </div>
              </div>
            ) : (
              <>
                {retakeCount < MAX_RETAKES ? (
                  <button
                    onClick={handleRetake}
                    className="flex w-full items-center justify-center gap-1.5 rounded-full border border-border py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
                  >
                    <RefreshCw size={14} />
                    Retake for Practice
                    {retakeCount > 0 && (
                      <span className="text-xs font-normal text-muted">
                        ({MAX_RETAKES - retakeCount} left)
                      </span>
                    )}
                  </button>
                ) : (
                  <p className="text-center text-xs text-muted">
                    You&apos;ve used all your practice retakes for this quiz this
                    session.
                  </p>
                )}

                {relatedQuizzes.length > 0 && (
                  <div className="border-t border-border pt-5">
                    <h3 className="font-display text-sm font-semibold text-foreground">
                      Related Quizzes
                    </h3>
                    <p className="mt-1 text-xs text-muted">
                      More {quiz.grade} {quiz.subject} quizzes you haven&apos;t taken
                      yet.
                    </p>
                    <div className="mt-3 space-y-2">
                      {relatedQuizzes.map((rq) => (
                        <button
                          key={rq.id}
                          onClick={() => onSelectRelated?.(rq)}
                          className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-3 text-left text-sm transition-colors hover:border-primary hover:bg-primary/5"
                        >
                          <span>
                            <span className="font-medium text-foreground">
                              {rq.title}
                            </span>
                            <span className="ml-2 text-xs text-muted">
                              {rq.questions.length} question
                              {rq.questions.length !== 1 ? "s" : ""}
                            </span>
                          </span>
                          <ArrowRight size={15} className="shrink-0 text-primary" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
