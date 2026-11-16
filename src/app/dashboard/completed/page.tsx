import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { getDashboardData, quizHref, WEAK_BELOW } from "@/lib/dashboardStats";

export const metadata = { title: "Quizzes completed | EduFund Hub" };

export default async function CompletedQuizzesPage() {
  const { user } = await getCurrentUserWithRole();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const dash = await getDashboardData(supabase, user.id);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-foreground">Quizzes completed</h1>
      <p className="mt-1 text-sm text-muted">
        {dash.completed.length} of {dash.totalQuizzes} quiz
        {dash.totalQuizzes !== 1 ? "zes" : ""} taken. Tap Review to see your answers.
      </p>

      {dash.completed.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-surface px-6 py-12 text-center">
          <p className="text-sm text-muted">You haven&apos;t completed any quizzes yet.</p>
          <Link
            href="/quizzes"
            className="mt-4 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-light"
          >
            Take a quiz
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {dash.completed.map((c) => (
            <div
              key={c.quizId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-5 py-4"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground">{c.title}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {c.subject} &middot; {c.topic} &middot; {c.grade} &middot;{" "}
                  {new Date(c.takenAt).toLocaleDateString("en-ZA", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    c.percent < WEAK_BELOW
                      ? "bg-accent/20 text-[#7A5A0A]"
                      : "bg-secondary/10 text-secondary"
                  }`}
                >
                  {c.score}/{c.total} &middot; {c.percent}%
                </span>
                <Link
                  href={quizHref(c.quizId)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
                >
                  Review
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
