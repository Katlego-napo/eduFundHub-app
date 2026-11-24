import { createClient } from "@/lib/supabase/server";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { getSubscriptionStatus } from "@/lib/auth/getSubscriptionStatus";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import QuizzesBrowser, { type AttemptedMap } from "@/components/QuizzesBrowser";
import { createServiceClient } from "@/lib/supabase/service";
import { prepareQuizzes } from "@/lib/quizAccess";
import type { Quiz } from "@/lib/types/quiz";

export const metadata = {
  title: "Practice Quizzes | EduFund Hub",
  description:
    "Multiple-choice practice quizzes for high school students in South Africa.",
};

export default async function QuizzesPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; topic?: string; quiz?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { user, isAdmin } = await getCurrentUserWithRole();

  // Subscription first: it decides whether question content may be sent.
  const { isSubscribed } = user
    ? await getSubscriptionStatus()
    : { isSubscribed: false };

  // Read with the service client (the browser is not allowed to read quiz
  // questions directly) and strip the questions server-side for anyone
  // without access. Admins and active subscribers get the full quiz.
  const { data, error } = await createServiceClient()
    .from("quizzes")
    .select("*")
    .order("created_at", { ascending: false });

  const quizzes: Quiz[] = error
    ? []
    : prepareQuizzes((data ?? []) as Quiz[], isSubscribed || isAdmin);

  let savedQuizIds: string[] = [];
  let attemptedQuizzes: AttemptedMap = {};

  if (user) {
    const { data: saved } = await supabase
      .from("saved_quizzes")
      .select("quiz_id")
      .eq("user_id", user.id);
    savedQuizIds = (saved ?? []).map((row) => row.quiz_id);

    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("quiz_id, score, total, answers, created_at")
      .eq("user_id", user.id)
      .not("quiz_id", "is", null)
      .order("created_at", { ascending: false });

    for (const attempt of attempts ?? []) {
      if (!attempt.quiz_id || attemptedQuizzes[attempt.quiz_id]) continue;
      attemptedQuizzes[attempt.quiz_id] = {
        score: attempt.score,
        total: attempt.total,
        answers: attempt.answers ?? undefined,
      };
    }
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-background">
        <section className="border-b border-border bg-primary py-12">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
            <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              Practice Quizzes
            </h1>
            <p className="mt-2 text-white/75">
              Test your knowledge with multiple-choice quizzes.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          {error ? (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              Couldn&apos;t load quizzes right now. Please refresh the page.
            </p>
          ) : (
            <QuizzesBrowser
              quizzes={quizzes}
              isAdmin={isAdmin}
              isLoggedIn={!!user}
              isSubscribed={isSubscribed}
              initialSavedQuizIds={savedQuizIds}
              initialAttemptedQuizzes={attemptedQuizzes}
              initialSubject={sp.subject ?? null}
              initialTopic={sp.topic ?? null}
              initialQuizId={sp.quiz ?? null}
            />
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
