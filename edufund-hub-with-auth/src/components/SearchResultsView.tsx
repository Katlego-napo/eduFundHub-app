"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { PastPaper } from "@/lib/types/pastPaper";
import type { Bursary } from "@/lib/types/bursary";
import type { BlogPost } from "@/lib/types/blog";
import { daysUntil, formatDate, urgencyStyle, urgencyLabel } from "@/lib/types/bursary";
import { Search, Download, BookOpen, Clock, ArrowUpRight, FileQuestion } from "lucide-react";

export default function SearchResultsView({
  query,
  papers,
  bursaries,
  posts,
}: {
  query: string;
  papers: PastPaper[];
  bursaries: Bursary[];
  posts: BlogPost[];
}) {
  const router = useRouter();
  const [input, setInput] = useState(query);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    router.push(`/search?q=${encodeURIComponent(input.trim())}`);
  }

  const totalResults = papers.length + bursaries.length + posts.length;

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
          placeholder="Search past papers or bursaries..."
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
            Type something above to search past papers and bursaries.
          </p>
        </div>
      ) : totalResults === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface px-6 py-14 text-center">
          <FileQuestion size={28} className="text-muted" />
          <p className="text-sm text-muted">
            No results for &ldquo;{query}&rdquo;. Try a different subject, grade, year,
            or bursary name.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
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

          {papers.length > 0 && (
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Past Papers
                <span className="ml-2 text-sm font-normal text-muted">
                  ({papers.length})
                </span>
              </h2>
              <div className="mt-4 overflow-hidden rounded-2xl border border-border">
                {papers.map((p, i) => (
                  <div
                    key={p.id}
                    className={`flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6 ${
                      i !== papers.length - 1 ? "border-b border-border" : ""
                    } ${i % 2 === 0 ? "bg-background" : "bg-surface"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <BookOpen size={17} />
                      </span>
                      <div>
                        <p className="font-medium text-foreground">{p.subject}</p>
                        <p className="text-xs text-muted">
                          {p.grade} &middot; {p.year}
                          {p.memo_url && (
                            <span className="ml-2 rounded-full bg-secondary/10 px-2 py-0.5 text-secondary">
                              Memo included
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <a
                      href={p.paper_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                    >
                      <Download size={14} />
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {posts.length > 0 && (
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Blog Articles
                <span className="ml-2 text-sm font-normal text-muted">
                  ({posts.length})
                </span>
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-lg hover:shadow-black/5"
                  >
                    <div className="h-20 w-full" style={{ backgroundColor: post.cover_color }} />
                    <div className="p-4">
                      <span className="text-xs font-medium text-muted">{post.category}</span>
                      <h3 className="mt-1 text-sm font-semibold text-foreground group-hover:text-primary">
                        {post.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
