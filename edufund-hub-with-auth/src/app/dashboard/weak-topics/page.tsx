import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { getDashboardData, topicHref, WEAK_BELOW } from "@/lib/dashboardStats";

export const metadata = { title: "Weak topics | EduFund Hub" };

export default async function WeakTopicsPage() {
  const { user } = await getCurrentUserWithRole();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const dash = await getDashboardData(supabase, user.id);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-foreground">Weak topics</h1>
      <p className="mt-1 text-sm text-muted">
        Topics where your average score is below {WEAK_BELOW}%. Practise these to bring them up.
      </p>

      {dash.weakTopics.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-surface px-6 py-12 text-center">
          <p className="text-sm text-muted">
            {dash.completed.length === 0
              ? "Take a few quizzes and we'll show you which topics need more practice."
              : "No weak topics right now. Great work, keep it up!"}
          </p>
          <Link
            href="/quizzes"
            className="mt-4 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-light"
          >
            Browse quizzes
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {dash.weakTopics.map((t) => (
            <div
              key={`${t.subject}-${t.topic}`}
              className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-border bg-surface px-5 py-4"
            >
              <div className="w-full sm:w-48">
                <p className="font-medium text-foreground">{t.topic}</p>
                <p className="text-xs text-muted">
                  {t.subject} &middot; {t.attemptedCount} of {t.totalCount} quiz
                  {t.totalCount !== 1 ? "zes" : ""} done
                </p>
              </div>
              <div
                className="h-2.5 min-w-[120px] flex-1 overflow-hidden rounded-full bg-foreground/10"
                role="progressbar"
                aria-valuenow={t.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${t.topic} score`}
              >
                <div className="h-full rounded-full bg-accent" style={{ width: `${t.percent}%` }} />
              </div>
              <span className="w-10 text-right text-sm font-medium text-foreground">
                {t.percent}%
              </span>
              <Link
                href={topicHref(t.subject, t.topic)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
              >
                Start quiz
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
