import { createClient } from "@/lib/supabase/server";
import type { Bursary } from "@/lib/types/bursary";
import { daysUntil, formatDate, urgencyStyle, urgencyLabel } from "@/lib/types/bursary";
import { Clock, ArrowUpRight } from "lucide-react";

const FEATURED_COUNT = 3;

export default async function FeaturedBursaries() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bursaries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(FEATURED_COUNT);

  const bursaries: Bursary[] = data ?? [];

  // Nothing to show yet (e.g. no bursaries uploaded) — skip the section
  // entirely rather than rendering an empty grid.
  if (bursaries.length === 0) return null;

  return (
    <section className="bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-secondary">
              Don&apos;t miss out
            </span>
            <h2 className="mt-1 font-display text-2xl font-semibold text-foreground sm:text-3xl">
              Featured Bursaries
            </h2>
          </div>
          <a
            href="/bursaries"
            className="text-sm font-semibold text-primary hover:underline"
          >
            View all bursaries →
          </a>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {bursaries.map((b) => {
            const days = daysUntil(b.closing_date);
            return (
              <div
                key={b.id}
                className="flex flex-col rounded-2xl border border-border bg-surface p-6 transition-shadow hover:shadow-lg hover:shadow-black/5"
              >
                <div
                  className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${urgencyStyle(
                    days
                  )}`}
                >
                  <Clock size={12} />
                  {urgencyLabel(days)}
                </div>

                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                  {b.name}
                </h3>
                <p className="mt-1 text-sm text-muted">{b.funder}</p>

                <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Closing date</span>
                    <span className="font-medium text-foreground">
                      {formatDate(b.closing_date)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="shrink-0 text-muted">Coverage</span>
                    <span className="text-right font-medium text-foreground">
                      {b.coverage}
                    </span>
                  </div>
                </div>

                <a
                  href={b.official_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 flex items-center justify-center gap-1.5 rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
                >
                  Apply Now
                  <ArrowUpRight size={15} />
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}