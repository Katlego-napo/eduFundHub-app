"use client";

import { useState } from "react";

type SubjectStrength = {
  subject: string;
  percent: number;
};

type TopicStrength = {
  topic: string;
  percent: number;
};

export default function SubjectStrengthsCard({
  subjectStrengths,
  topicStrengthsMap,
  strongestSubject,
  subjectRanks,
}: {
  subjectStrengths: SubjectStrength[];
  topicStrengthsMap: Record<string, TopicStrength[]>;
  strongestSubject: SubjectStrength | null;
  subjectRanks: Record<string, { topPercent: number; aheadPercent: number }>;
}) {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const topics = selectedSubject ? (topicStrengthsMap[selectedSubject] ?? []) : [];
  const displaySubjects = subjectStrengths.slice(0, 4);

  function formatRankBand(topPercent: number): string {
    if (topPercent <= 10) return "Top 10%";
    if (topPercent <= 25) return "Top 25%";
    if (topPercent <= 50) return "Top Half";
    return "Keep Practicing";
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-sm font-semibold text-foreground">
          Subject Strengths
        </h3>
        {subjectStrengths.length > 0 && (
          <select
            value={selectedSubject ?? ""}
            onChange={(e) => setSelectedSubject(e.target.value || null)}
            className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
          >
            <option value="">All Subjects</option>
            {subjectStrengths.map((s) => (
              <option key={s.subject} value={s.subject}>
                {s.subject}
              </option>
            ))}
          </select>
        )}
      </div>

      {subjectStrengths.length === 0 ? (
        <p className="mt-2 text-xs text-muted">
          Take a few quizzes from the Quizzes page to see which subjects
          you&apos;re strongest in.
        </p>
      ) : selectedSubject ? (
        // Topic drill-down view
        <div className="mt-3">
          {topics.length === 0 ? (
            <p className="text-xs text-muted">
              No topic data yet for {selectedSubject}. Topics are tracked once
              the admin adds a Topic when creating a quiz.
            </p>
          ) : (
            <div className="space-y-2.5">
              {topics.map((t) => (
                <div key={t.topic}>
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>{t.topic}</span>
                    <span>{t.percent}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-foreground/5">
                    <div
                      className="h-full rounded-full bg-secondary"
                      style={{ width: `${t.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // All-subjects overview
        <>
          {strongestSubject && (
            <p className="mt-2 text-sm text-muted">
              Strongest:{" "}
              <span className="font-semibold text-foreground">
                {strongestSubject.subject} ({strongestSubject.percent}%)
              </span>
            </p>
          )}
          <div className="mt-3 space-y-2.5">
            {displaySubjects.map((s) => {
              const subjRank = subjectRanks[s.subject];
              return (
                <div key={s.subject}>
                  <div className="flex items-center justify-between text-xs text-muted">
                    <button
                      onClick={() => setSelectedSubject(s.subject)}
                      className="font-medium text-foreground underline-offset-2 hover:underline"
                    >
                      {s.subject}
                    </button>
                    <span className="flex items-center gap-2">
                      <span>{s.percent}%</span>
                      {subjRank && (
                        <span className="rounded-full bg-secondary/10 px-2 py-0.5 font-medium text-secondary">
                          {formatRankBand(subjRank.topPercent)}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-foreground/5">
                    <div
                      className="h-full rounded-full bg-secondary"
                      style={{ width: `${s.percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted">
            Click a subject to see topic breakdown.
          </p>
        </>
      )}
    </div>
  );
}