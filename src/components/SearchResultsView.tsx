"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Quiz } from "@/lib/types/quiz";
import type { Bursary } from "@/lib/types/bursary";
import { daysUntil, formatDate, urgencyStyle, urgencyLabel } from "@/lib/types/bursary";
import { Search, Clock, ArrowUpRight, FileQuestion, Brain } from "lucide-react";

export default function SearchResultsView({
  query,
  quizzes,
  bursaries,
}: {
  query: string;
  quizzes: Quiz[];
  bursaries: Bursary[];
}) {
  const router = useRouter();
  const [input, setInput] = useState(query);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    router.push(`/search?q=${encodeURIComponent(input.trim())}`);
  }

  const totalResults = quizzes.length + bursaries.length;

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-2"
      >
        <Search size={18} className="ml-2 shrink-0 text-muted" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search quizzes or bursaries..."
          className="w-full min-w-0 bg-transparent py-2 text-sm text-foreground placeholder:text-muted/70 focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
        >
          Search
        </button>
      </form>

      {!query ? (
        <div className="mt-10 flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface px-6 py-14 text-center">
          <Search size={28} className="text-muted" />
          <p className="text-sm text-muted">
            Type something above to search quizzes and bursaries.
          </p>
        </div>
      ) : totalResults === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface px-6 py-14 text-center">
          <FileQuestion size={28} className="text-muted" />
          <p className="text-sm text-muted">
            No results for &ldquo;{query}&rdquo;. Try a different subject, grade,
            topic, or bursary name.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {quizzes.length > 0 && (
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Quizzes
                <span className="ml-2 text-sm font-normal text-muted">
                  ({quizzes.length})
                </span>
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {quizzes.map((quiz) => (
                  <Link
                    key={quiz.id}
                    href="/quizzes"
                    className="flex flex-col rounded-2xl border border-border bg-surface p-5 transition-shadow hover:shadow-lg hover:shadow-black/5"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                      <Brain size={18} />
                    </span>
                    <h3 className="mt-3 font-display text-base font-semibold text-foreground">
                      {quiz.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                      {quiz.grade} &middot; {quiz.subject}
                      {quiz.topic && (
                        <span className="ml-2 rounded-full bg-secondary/10 px-2 py-0.5 text-xs text-secondary">
                          {quiz.topic}
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {quiz.questions.length} question{quiz.questions.length !== 1 ? "s" : ""}
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-1.5 rounded-full bg-primary py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-light">
                      Take Quiz
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {bursaries.length > 0 && (
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Bursaries
                <span className="ml-2 text-sm font-normal text-muted">
                  ({bursaries.length})
                </span>
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {bursaries.map((b) => {
                  const days = daysUntil(b.closing_date);
                  return (
                    <div
                      key={b.id}
                      className="flex flex-col rounded-2xl border border-border bg-surface p-5"
                    >
                      <div
                        className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${urgencyStyle(
                          days
                        )}`}
                      >
                        <Clock size={12} />
                        {urgencyLabel(days)}
                      </div>
                      <h3 className="mt-3 font-display text-base font-semibold text-foreground">
                        {b.name}
                      </h3>
                      <p className="mt-1 text-sm text-muted">{b.funder}</p>
                      <p className="mt-2 text-xs text-muted">
                        Closes {formatDate(b.closing_date)} &middot; {b.coverage}
                      </p>
                      <Link
                        href={`/bursaries#${b.id}`}
                        className="mt-4 flex items-center justify-center gap-1.5 rounded-full bg-primary py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
                      >
                        View Bursary
                        <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}