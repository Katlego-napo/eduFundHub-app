import { createClient } from "@/lib/supabase/server";
import type { PastPaper } from "@/lib/types/pastPaper";
import { Download, BookOpen } from "lucide-react";

const LATEST_COUNT = 4;

export default async function LatestPapers() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("past_papers")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(LATEST_COUNT);

  const papers: PastPaper[] = data ?? [];

  // Nothing to show yet (e.g. no papers uploaded) — skip the section
  // entirely rather than rendering an empty list.
  if (papers.length === 0) return null;

  return (
    <section className="bg-surface py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-secondary">
              Fresh off the press
            </span>
            <h2 className="mt-1 font-display text-2xl font-semibold text-foreground sm:text-3xl">
              Latest Past Papers
            </h2>
          </div>
          <a
            href="/past-papers"
            className="text-sm font-semibold text-primary hover:underline"
          >
            View all papers →
          </a>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-border">
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
    </section>
  );
}