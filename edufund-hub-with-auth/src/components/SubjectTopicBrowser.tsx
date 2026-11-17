"use client";

import { useMemo } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import type { Quiz } from "@/lib/types/quiz";
import type { AttemptedMap } from "@/components/QuizzesBrowser";

// Topics scoring below this (once attempted) get the "Weak" badge.
const WEAK_BELOW = 50;

type SubjectStat = { name: string; total: number; done: number };
type TopicStat = {
  name: string;
  quizzes: Quiz[];
  attemptedCount: number;
  percent: number; // average score % across attempted quizzes
};

export default function SubjectTopicBrowser({
  quizzes,
  attempted,
  isSubscribed,
  sampleUsed,
  grades,
  gradeFilter,
  onGradeChange,
  activeSubject,
  onSubjectChange,
  activeTopic,
  onTopicChange,
  onStart,
  isAdmin = false,
  onDeleteTopic,
  deletingTopic = null,
}: {
  quizzes: Quiz[];
  attempted: AttemptedMap;
  isSubscribed: boolean;
  sampleUsed: boolean;
  grades: string[];
  gradeFilter: string;
  onGradeChange: (grade: string) => void;
  activeSubject: string | null;
  onSubjectChange: (subject: string | null) => void;
  activeTopic: string | null;
  onTopicChange: (topic: string | null) => void;
  onStart: (quiz: Quiz) => void;
  isAdmin?: boolean;
  onDeleteTopic?: (topicName: string, quizzes: Quiz[]) => void;
  deletingTopic?: string | null;
}) {
  const scoped = useMemo(
    () => quizzes.filter((q) => gradeFilter === "All" || q.grade === gradeFilter),
    [quizzes, gradeFilter]
  );

  const subjects = useMemo<SubjectStat[]>(() => {
    const map = new Map<string, SubjectStat>();
    for (const q of scoped) {
      const s = map.get(q.subject) ?? { name: q.subject, total: 0, done: 0 };
      s.total += 1;
      if (attempted[q.id]) s.done += 1;
      map.set(q.subject, s);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [scoped, attempted]);

  const topics = useMemo<TopicStat[]>(() => {
    if (!activeSubject) return [];
    const map = new Map<string, Quiz[]>();
    for (const q of scoped) {
      if (q.subject !== activeSubject) continue;
      const key = q.topic?.trim() || "General";
      map.set(key, [...(map.get(key) ?? []), q]);
    }
    return Array.from(map.entries())
      .map(([name, list]) => {
        const done = list.filter((q) => attempted[q.id]);
        const percent = done.length
          ? Math.round(
              done.reduce((sum, q) => {
                const r = attempted[q.id];
                return sum + (r.total > 0 ? (r.score / r.total) * 100 : 0);
              }, 0) / done.length
            )
          : 0;
        return { name, quizzes: list, attemptedCount: done.length, percent };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [scoped, attempted, activeSubject]);

  const gradeSelect = (
    <select
      value={gradeFilter}
      onChange={(e) => onGradeChange(e.target.value)}
      className="rounded-full border border-border bg-surface px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
    >
      {grades.map((g) => (
        <option key={g} value={g}>
          {g === "All" ? "All Grades" : g}
        </option>
      ))}
    </select>
  );

  // ---------- Level 3: quizzes inside the chosen topic ----------
  if (activeSubject && activeTopic) {
    const topic = topics.find((t) => t.name === activeTopic);
    return (
      <div>
        <button
          onClick={() => onTopicChange(null)}
          className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary"
        >
          <ArrowLeft size={15} />
          {activeSubject} topics
        </button>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground">{activeTopic}</h2>
            <p className="mt-1 text-sm text-muted">{activeSubject} &middot; choose a quiz.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && topic && topic.quizzes.length > 0 && onDeleteTopic && (
              <button
                onClick={() => onDeleteTopic(topic.name, topic.quizzes)}
                disabled={deletingTopic === topic.name}
                className="flex items-center gap-1.5 rounded-full border border-red-200 px-3.5 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
              >
                <Trash2 size={14} />
                {deletingTopic === topic.name ? "Deleting..." : "Delete topic"}
              </button>
            )}
            {gradeSelect}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {!topic || topic.quizzes.length === 0 ? (
            <p className="rounded-2xl border border-border bg-surface px-6 py-10 text-center text-sm text-muted">
              No quizzes for this grade in this topic.
            </p>
          ) : (
            topic.quizzes.map((q) => {
              const result = attempted[q.id];
              const locked = !result && !isSubscribed && sampleUsed;
              const pct =
                result && result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
              return (
                <div
                  key={q.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{q.title}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {q.grade} &middot; {q.questions.length} question
                      {q.questions.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {result && (
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          pct < WEAK_BELOW
                            ? "bg-accent/20 text-[#7A5A0A]"
                            : "bg-secondary/10 text-secondary"
                        }`}
                      >
                        {result.score}/{result.total}
                      </span>
                    )}
                    {locked ? (
                      <a
                        href="/pricing"
                        className="rounded-lg bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
                      >
                        Unlock
                      </a>
                    ) : (
                      <button
                        onClick={() => onStart(q)}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
                      >
                        {result ? "Review" : "Start quiz"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ---------- Level 2: topics for the chosen subject ----------
  if (activeSubject) {
    return (
      <div>
        <button
          onClick={() => onSubjectChange(null)}
          className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary"
        >
          <ArrowLeft size={15} />
          All subjects
        </button>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground">
              {activeSubject}
            </h2>
            <p className="mt-1 text-sm text-muted">Pick a topic to practise.</p>
          </div>
          {gradeSelect}
        </div>

        <div className="mt-5 space-y-3">
          {topics.length === 0 ? (
            <p className="rounded-2xl border border-border bg-surface px-6 py-10 text-center text-sm text-muted">
              No topics for this grade yet.
            </p>
          ) : (
            topics.map((t) => {
              const weak = t.attemptedCount > 0 && t.percent < WEAK_BELOW;
              return (
                <div
                  key={t.name}
                  className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-border bg-surface px-5 py-4"
                >
                  <div className="w-full sm:w-40">
                    <p className="font-medium text-foreground">{t.name}</p>
                    <p className="text-xs text-muted">
                      {t.attemptedCount} of {t.quizzes.length} quiz
                      {t.quizzes.length !== 1 ? "zes" : ""} done
                    </p>
                  </div>

                  <div
                    className="h-2.5 min-w-[120px] flex-1 overflow-hidden rounded-full bg-foreground/10"
                    role="progressbar"
                    aria-valuenow={t.percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${t.name} score`}
                  >
                    <div
                      className={`h-full rounded-full ${weak ? "bg-accent" : "bg-primary"}`}
                      style={{ width: `${t.percent}%` }}
                    />
                  </div>

                  <span className="w-10 text-right text-sm font-medium text-foreground">
                    {t.percent}%
                  </span>

                  <span className="w-14">
                    {weak && (
                      <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-semibold text-[#7A5A0A]">
                        Weak
                      </span>
                    )}
                  </span>

                  <button
                    onClick={() => onTopicChange(t.name)}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
                  >
                    View quizzes
                  </button>

                  {isAdmin && onDeleteTopic && (
                    <button
                      onClick={() => onDeleteTopic(t.name, t.quizzes)}
                      disabled={deletingTopic === t.name}
                      title={`Delete the whole "${t.name}" topic`}
                      aria-label={`Delete topic ${t.name}`}
                      className="rounded-lg border border-red-200 p-2 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ---------- Level 1: choose a subject ----------
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Choose Subject
          </h2>
          <p className="mt-1 text-sm text-muted">Pick a subject to practise.</p>
        </div>
        {gradeSelect}
      </div>

      {subjects.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-border bg-surface px-6 py-10 text-center text-sm text-muted">
          No quizzes available yet.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {subjects.map((s) => {
            const percent = s.total ? Math.round((s.done / s.total) * 100) : 0;
            return (
              <div
                key={s.name}
                className="flex flex-col rounded-2xl border border-border bg-surface p-5"
              >
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {s.name}
                </h3>
                <p className="mt-3 text-xs text-muted">{percent}% completed</p>
                <div
                  className="mt-1.5 h-2 overflow-hidden rounded-full bg-foreground/10"
                  role="progressbar"
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${s.name} completed`}
                >
                  <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                </div>
                <button
                  onClick={() => onSubjectChange(s.name)}
                  className="mt-4 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
                >
                  View topics
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
