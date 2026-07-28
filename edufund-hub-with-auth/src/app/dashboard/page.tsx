import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import Header from "@/components/Header";
import SubjectStrengthsCard from "@/components/SubjectStrengthsCard";
import Link from "next/link";
import {
  UploadCloud,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Brain,
  FileQuestion,
} from "lucide-react";

// Turns a raw "top X%" number into plain, unambiguous language. A raw
// percentage reads fine in the middle (e.g. "Top 20%") but gets
// confusing at the edges — "Top 100%" sounds like a good score when it
// actually means last place. Bands avoid that ambiguity entirely.
export default async function DashboardPage() {
  // Below this many total students (overall, or within a subject), a
  // percentile ranking is more confusing than helpful, so it's hidden
  // until there's a meaningful group to compare against.
  const MIN_STUDENTS_FOR_RANK = 3;

  const { user, isAdmin } = await getCurrentUserWithRole();

  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { count: savedBursariesCount } = await supabase
    .from("saved_bursaries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: savedQuizzesCount } = await supabase
    .from("saved_quizzes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { data: quizAttempts } = await supabase
    .from("quiz_attempts")
    .select("score, total, subject, topic")
    .eq("user_id", user.id);

  const totalQuizzes = quizAttempts?.length ?? 0;
  const averageScorePercent =
    totalQuizzes > 0
      ? Math.round(
          (quizAttempts!.reduce((acc, a) => acc + a.score / a.total, 0) / totalQuizzes) * 100
        )
      : null;

  // Subject strength: average score % per subject, from attempts on
  // admin-authored quizzes only (subject is null for AI-generated
  // quizzes, since those aren't tied to a specific subject).
  const bySubject = new Map<string, { totalScore: number; totalQuestions: number }>();
  for (const attempt of quizAttempts ?? []) {
    if (!attempt.subject) continue;
    const existing = bySubject.get(attempt.subject) ?? {
      totalScore: 0,
      totalQuestions: 0,
    };
    existing.totalScore += attempt.score;
    existing.totalQuestions += attempt.total;
    bySubject.set(attempt.subject, existing);
  }
  const subjectStrengths = Array.from(bySubject.entries())
    .map(([subject, { totalScore, totalQuestions }]) => ({
      subject,
      percent: Math.round((totalScore / totalQuestions) * 100),
    }))
    .sort((a, b) => b.percent - a.percent);
  const strongestSubject = subjectStrengths[0] ?? null;

  // Topic strength: per-subject breakdown — for each subject, build a
  // map of topic → average score %, so the dashboard can show a
  // dropdown that drills down from subject into specific topics.
  // Only attempts that have both a subject and a topic are included.
  const topicStrengths = new Map<
    string,
    { topic: string; percent: number }[]
  >();
  const bySubjectTopic = new Map<
    string,
    Map<string, { totalScore: number; totalQuestions: number }>
  >();
  for (const attempt of quizAttempts ?? []) {
    if (!attempt.subject || !attempt.topic) continue;
    if (!bySubjectTopic.has(attempt.subject)) {
      bySubjectTopic.set(attempt.subject, new Map());
    }
    const topicMap = bySubjectTopic.get(attempt.subject)!;
    const existing = topicMap.get(attempt.topic) ?? {
      totalScore: 0,
      totalQuestions: 0,
    };
    existing.totalScore += attempt.score;
    existing.totalQuestions += attempt.total;
    topicMap.set(attempt.topic, existing);
  }
  for (const [subject, topicMap] of bySubjectTopic.entries()) {
    const topics = Array.from(topicMap.entries())
      .map(([topic, { totalScore, totalQuestions }]) => ({
        topic,
        percent: Math.round((totalScore / totalQuestions) * 100),
      }))
      .sort((a, b) => b.percent - a.percent);
    topicStrengths.set(subject, topics);
  }

  // Rank: computed across ALL students server-side using the
  // service-role client (bypasses RLS, which normally restricts each
  // user to only their own attempts). Only the current user's rank
  // number is ever sent to the browser — no other student's data,
  // name, or score is exposed, by design.
  let rank: { position: number; totalStudents: number } | null = null;
  if (totalQuizzes > 0) {
    const serviceClient = createServiceClient();
    const { data: allAttempts } = await serviceClient
      .from("quiz_attempts")
      .select("user_id, score, total");

    if (allAttempts && allAttempts.length > 0) {
      const perUser = new Map<string, { totalScore: number; totalQuestions: number }>();
      for (const a of allAttempts) {
        const existing = perUser.get(a.user_id) ?? { totalScore: 0, totalQuestions: 0 };
        existing.totalScore += a.score;
        existing.totalQuestions += a.total;
        perUser.set(a.user_id, existing);
      }
      const ranked = Array.from(perUser.entries())
        .map(([userId, { totalScore, totalQuestions }]) => ({
          userId,
          average: totalScore / totalQuestions,
        }))
        .sort((a, b) => b.average - a.average);

      const position = ranked.findIndex((r) => r.userId === user.id);
      // Below this many total students, a percentile is more confusing
      // than useful (e.g. being 1st out of 1 student would otherwise
      // show as "Top 100%", which reads as the opposite of what it
      // means). Below the threshold, we simply don't show a rank yet.
      if (position !== -1 && ranked.length >= MIN_STUDENTS_FOR_RANK) {
        rank = { position: position + 1, totalStudents: ranked.length };
      }
    }
  }

  // Per-subject rank: same idea as overall rank, but computed separately
  // within each subject the student has attempted — its own leaderboard
  // per subject, so a student can see they might be, say, Top 10% in
  // Mathematics but Top 60% in Physical Sciences even though their
  // overall rank sits somewhere in between. Only the student's own
  // percentile per subject is ever exposed, same privacy approach as
  // the overall rank above.
  const subjectRanks: Record<string, { topPercent: number; aheadPercent: number }> = {};
  if (subjectStrengths.length > 0) {
    const subjectServiceClient = createServiceClient();
    const { data: allSubjectAttempts } = await subjectServiceClient
      .from("quiz_attempts")
      .select("user_id, score, total, subject")
      .not("subject", "is", null);

    if (allSubjectAttempts) {
      const bySubjectByUser = new Map<
        string,
        Map<string, { totalScore: number; totalQuestions: number }>
      >();
      for (const a of allSubjectAttempts) {
        if (!a.subject) continue;
        if (!bySubjectByUser.has(a.subject)) bySubjectByUser.set(a.subject, new Map());
        const userMap = bySubjectByUser.get(a.subject)!;
        const existing = userMap.get(a.user_id) ?? { totalScore: 0, totalQuestions: 0 };
        existing.totalScore += a.score;
        existing.totalQuestions += a.total;
        userMap.set(a.user_id, existing);
      }

      for (const { subject } of subjectStrengths) {
        const userMap = bySubjectByUser.get(subject);
        if (!userMap) continue;

        const rankedInSubject = Array.from(userMap.entries())
          .map(([userId, { totalScore, totalQuestions }]) => ({
            userId,
            average: totalScore / totalQuestions,
          }))
          .sort((a, b) => b.average - a.average);

        const positionInSubject = rankedInSubject.findIndex((r) => r.userId === user.id);
        // Same reasoning as the overall rank: too small a group makes a
        // percentile misleading (e.g. 1 of 1 student would show as
        // "Top 100%", the opposite of what it sounds like).
        if (positionInSubject !== -1 && rankedInSubject.length >= MIN_STUDENTS_FOR_RANK) {
          const totalInSubject = rankedInSubject.length;
          subjectRanks[subject] = {
            topPercent: Math.max(
              1,
              Math.ceil(((positionInSubject + 1) / totalInSubject) * 100)
            ),
            aheadPercent: Math.round(
              ((totalInSubject - (positionInSubject + 1)) / totalInSubject) * 100
            ),
          };
        }
      }
    }
  }

  const name = user.user_metadata?.full_name || user.email?.split("@")[0];

  // Encouraging copy tiers based on percentile (how many students this
  // user is ahead of) — deliberately framed around effort and progress
  // rather than "you're behind", especially at the lower end.
  let rankTier: {
    message: string;
    subMessage: string;
    gradient: string;
    emoji: string;
    percentileAhead: number;
  } | null = null;

  if (rank) {
    const percentileAhead = Math.round(
      ((rank.totalStudents - rank.position) / rank.totalStudents) * 100
    );

    if (percentileAhead >= 90) {
      rankTier = {
        message: "You're a top performer!",
        subMessage: "Incredible work — you're ahead of almost everyone. Keep it up!",
        gradient: "from-secondary to-primary",
        emoji: "🏆",
        percentileAhead,
      };
    } else if (percentileAhead >= 70) {
      rankTier = {
        message: "You're doing great!",
        subMessage: "You're ahead of most students. A few more quizzes could push you even higher.",
        gradient: "from-secondary to-primary",
        emoji: "🌟",
        percentileAhead,
      };
    } else if (percentileAhead >= 40) {
      rankTier = {
        message: "You're making solid progress!",
        subMessage: "You're right in the mix — keep practicing to climb higher.",
        gradient: "from-primary to-secondary",
        emoji: "💪",
        percentileAhead,
      };
    } else {
      rankTier = {
        message: "Every quiz makes you stronger.",
        subMessage: "Your ranking today isn't your ceiling — consistent practice is how students move up. You've got this!",
        gradient: "from-primary to-secondary",
        emoji: "🌱",
        percentileAhead,
      };
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
          Welcome back, {name} 👋
        </h1>
        <p className="mt-1 text-muted">
          Signed in as <span className="font-medium">{user.email}</span>
        </p>

        {rank && rankTier && (
          <div
            className={`mt-6 overflow-hidden rounded-2xl bg-gradient-to-br ${rankTier.gradient} p-6 sm:p-8`}
          >
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                  Your Quiz Ranking
                </p>
                <p className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
                  {rankTier.percentileAhead}%
                </p>
                <p className="mt-1 text-sm text-white/80">
                  You&apos;re doing better than {rankTier.percentileAhead}% of students
                </p>
                <p className="mt-3 flex items-center gap-2 text-lg font-semibold text-white">
                  <span className="text-2xl">{rankTier.emoji}</span>
                  {rankTier.message}
                </p>
                <p className="mt-1 max-w-md text-sm text-white/85">{rankTier.subMessage}</p>
              </div>
              <Link
                href="/quizzes"
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-primary transition-transform hover:scale-[1.03]"
              >
                Take Another Quiz
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}

        <Link
          href="/study-assistant"
          className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-primary p-6 transition-transform hover:scale-[1.01]"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
              <Sparkles size={20} />
            </span>
            <div>
              <p className="font-display font-semibold text-white">AI Study Assistant</p>
              <p className="text-sm text-white/75">
                Upload notes or a past paper — ask questions or generate a practice quiz.
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary">
            Try it now
            <ArrowRight size={14} />
          </span>
        </Link>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <h3 className="font-display text-sm font-semibold text-foreground">
              Saved Papers
            </h3>
            <p className="mt-2 text-2xl font-semibold text-primary">0</p>
            <p className="mt-1 text-xs text-muted">No papers saved yet</p>
          </div>
          <Link
            href="/saved-bursaries"
            className="rounded-2xl border border-border bg-surface p-6 transition-shadow hover:shadow-lg hover:shadow-black/5"
          >
            <h3 className="font-display text-sm font-semibold text-foreground">
              Saved Bursaries
            </h3>
            <p className="mt-2 text-2xl font-semibold text-secondary">
              {savedBursariesCount ?? 0}
            </p>
            <p className="mt-1 text-xs text-muted">
              {savedBursariesCount ? "View your saved bursaries" : "No bursaries saved yet"}
            </p>
          </Link>
          <Link
            href="/saved-quizzes"
            className="rounded-2xl border border-border bg-surface p-6 transition-shadow hover:shadow-lg hover:shadow-black/5"
          >
            <h3 className="flex items-center gap-1.5 font-display text-sm font-semibold text-foreground">
              <FileQuestion size={14} className="text-secondary" />
              Saved Quizzes
            </h3>
            <p className="mt-2 text-2xl font-semibold text-secondary">
              {savedQuizzesCount ?? 0}
            </p>
            <p className="mt-1 text-xs text-muted">
              {savedQuizzesCount ? "View your saved quizzes" : "No quizzes saved yet"}
            </p>
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <h3 className="flex items-center gap-1.5 font-display text-sm font-semibold text-foreground">
              <Brain size={14} className="text-secondary" />
              Quiz Progress
            </h3>
            <p className="mt-2 text-2xl font-semibold text-secondary">
              {totalQuizzes}
              <span className="ml-1 text-sm font-normal text-muted">
                {totalQuizzes === 1 ? "quiz" : "quizzes"} taken
              </span>
            </p>
            <p className="mt-1 text-xs text-muted">
              {totalQuizzes > 0
                ? `Average score: ${averageScorePercent}%`
                : "Take a quiz to see your progress here"}
            </p>
          </div>

          <SubjectStrengthsCard
            subjectStrengths={subjectStrengths}
            topicStrengthsMap={Object.fromEntries(topicStrengths)}
            strongestSubject={strongestSubject}
            subjectRanks={subjectRanks}
          />
        </div>

        {isAdmin && (
          <div className="mt-10">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-secondary" />
              <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-secondary">
                Admin Tools
              </h2>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/admin/upload-paper"
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-5 transition-shadow hover:shadow-lg hover:shadow-black/5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UploadCloud size={18} />
                </span>
                <div>
                  <p className="font-medium text-foreground">Upload Past Paper</p>
                  <p className="text-xs text-muted">Add a paper + memorandum</p>
                </div>
              </Link>
              <Link
                href="/admin/upload-bursary"
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-5 transition-shadow hover:shadow-lg hover:shadow-black/5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                  <UploadCloud size={18} />
                </span>
                <div>
                  <p className="font-medium text-foreground">Add Bursary</p>
                  <p className="text-xs text-muted">List a new opportunity</p>
                </div>
              </Link>
              <Link
                href="/admin/create-post"
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-5 transition-shadow hover:shadow-lg hover:shadow-black/5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-[#7A5A0A]">
                  <UploadCloud size={18} />
                </span>
                <div>
                  <p className="font-medium text-foreground">Create Blog Post</p>
                  <p className="text-xs text-muted">Publish a new article</p>
                </div>
              </Link>
              <Link
                href="/admin/upload-quiz"
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-5 transition-shadow hover:shadow-lg hover:shadow-black/5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                  <FileQuestion size={18} />
                </span>
                <div>
                  <p className="font-medium text-foreground">Create Quiz</p>
                  <p className="text-xs text-muted">Add a multiple-choice quiz</p>
                </div>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}