import type { SupabaseClient } from "@supabase/supabase-js";

// A topic scoring below this (once attempted) counts as "weak".
// Same rule as the subject -> topic screens on /quizzes.
export const WEAK_BELOW = 50;

type QuizRow = {
  id: string;
  title: string;
  subject: string;
  topic: string | null;
  grade: string;
};
type AttemptRow = {
  quiz_id: string | null;
  score: number;
  total: number;
  created_at: string;
};

export type TopicStat = {
  subject: string;
  topic: string;
  percent: number; // average score across the quizzes attempted in this topic
  attemptedCount: number;
  totalCount: number;
  weak: boolean;
};

export type CompletedQuiz = {
  quizId: string;
  title: string;
  subject: string;
  topic: string;
  grade: string;
  score: number;
  total: number;
  percent: number;
  takenAt: string;
};

export type SubjectProgress = {
  subject: string;
  total: number;
  done: number;
  percent: number;
};

export type DashboardData = {
  totalQuizzes: number;
  completed: CompletedQuiz[]; // newest first
  overallProgress: number;
  averageScore: number | null;
  subjectProgress: SubjectProgress[];
  topics: TopicStat[];
  weakTopics: TopicStat[]; // lowest score first
  recommended: TopicStat[];
};

const pct = (score: number, total: number) => (total > 0 ? (score / total) * 100 : 0);

// Links into the quizzes page, which opens straight to the right screen.
export function topicHref(subject: string, topic: string) {
  return `/quizzes?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topic)}`;
}
export function quizHref(quizId: string) {
  return `/quizzes?quiz=${encodeURIComponent(quizId)}`;
}

export async function getDashboardData(
  supabase: SupabaseClient,
  userId: string
): Promise<DashboardData> {
  const [quizRes, attemptRes] = await Promise.all([
    supabase.from("quizzes").select("id, title, subject, topic, grade"),
    supabase
      .from("quiz_attempts")
      .select("quiz_id, score, total, created_at")
      .eq("user_id", userId)
      .not("quiz_id", "is", null)
      .order("created_at", { ascending: false }),
  ]);

  const quizzes: QuizRow[] = quizRes.data ?? [];
  const attempts: AttemptRow[] = attemptRes.data ?? [];
  const quizById = new Map(quizzes.map((q) => [q.id, q]));

  // One result per quiz: the newest saved attempt. Attempts on quizzes that
  // were since deleted are ignored. Map order stays newest-first.
  const latest = new Map<string, AttemptRow>();
  for (const a of attempts) {
    if (!a.quiz_id || latest.has(a.quiz_id) || !quizById.has(a.quiz_id)) continue;
    latest.set(a.quiz_id, a);
  }

  const completed: CompletedQuiz[] = Array.from(latest.values()).map((a) => {
    const q = quizById.get(a.quiz_id!)!;
    return {
      quizId: q.id,
      title: q.title,
      subject: q.subject,
      topic: q.topic?.trim() || "General",
      grade: q.grade,
      score: a.score,
      total: a.total,
      percent: Math.round(pct(a.score, a.total)),
      takenAt: a.created_at,
    };
  });

  const averageScore = completed.length
    ? Math.round(
        Array.from(latest.values()).reduce((sum, a) => sum + pct(a.score, a.total), 0) /
          completed.length
      )
    : null;

  const overallProgress = quizzes.length
    ? Math.round((completed.length / quizzes.length) * 100)
    : 0;

  // Subject progress: share of each subject's quizzes the user has attempted.
  const bySubject = new Map<string, { total: number; done: number }>();
  for (const q of quizzes) {
    const s = bySubject.get(q.subject) ?? { total: 0, done: 0 };
    s.total += 1;
    if (latest.has(q.id)) s.done += 1;
    bySubject.set(q.subject, s);
  }
  const subjectProgress: SubjectProgress[] = Array.from(bySubject.entries())
    .map(([subject, s]) => ({
      subject,
      total: s.total,
      done: s.done,
      percent: s.total ? Math.round((s.done / s.total) * 100) : 0,
    }))
    .sort((a, b) => a.subject.localeCompare(b.subject));

  // Topic stats, grouped the same way as the quizzes page.
  const byTopic = new Map<
    string,
    { subject: string; topic: string; total: number; scores: number[] }
  >();
  for (const q of quizzes) {
    const topic = q.topic?.trim() || "General";
    const key = `${q.subject}\u0000${topic}`;
    const t = byTopic.get(key) ?? { subject: q.subject, topic, total: 0, scores: [] };
    t.total += 1;
    const a = latest.get(q.id);
    if (a) t.scores.push(pct(a.score, a.total));
    byTopic.set(key, t);
  }
  const topics: TopicStat[] = Array.from(byTopic.values())
    .map((t) => {
      const percent = t.scores.length
        ? Math.round(t.scores.reduce((x, y) => x + y, 0) / t.scores.length)
        : 0;
      return {
        subject: t.subject,
        topic: t.topic,
        percent,
        attemptedCount: t.scores.length,
        totalCount: t.total,
        weak: t.scores.length > 0 && percent < WEAK_BELOW,
      };
    })
    .sort((a, b) => a.subject.localeCompare(b.subject) || a.topic.localeCompare(b.topic));

  const weakTopics = topics.filter((t) => t.weak).sort((a, b) => a.percent - b.percent);

  // Recommended: weak topics first, then topics that still have quizzes
  // the user hasn't taken (least-touched first).
  const rest = topics
    .filter((t) => !t.weak && t.attemptedCount < t.totalCount)
    .sort((a, b) => a.attemptedCount - b.attemptedCount);
  const recommended = [...weakTopics, ...rest].slice(0, 5);

  return {
    totalQuizzes: quizzes.length,
    completed,
    overallProgress,
    averageScore,
    subjectProgress,
    topics,
    weakTopics,
    recommended,
  };
}
