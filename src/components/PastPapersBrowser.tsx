"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { PastPaper } from "@/lib/types/pastPaper";
import { Search, Download, BookOpen, FileText, Trash2 } from "lucide-react";

export default function PastPapersBrowser({
  initialPapers,
  isAdmin = false,
}: {
  initialPapers: PastPaper[];
  isAdmin?: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [papers, setPapers] = useState(initialPapers);
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [gradeFilter, setGradeFilter] = useState("All");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const subjects = useMemo(
    () => ["All", ...Array.from(new Set(papers.map((p) => p.subject)))],
    [papers]
  );
  const years = useMemo(
    () => ["All", ...Array.from(new Set(papers.map((p) => p.year))).sort().reverse()],
    [papers]
  );
  const grades = useMemo(
    () => ["All", ...Array.from(new Set(papers.map((p) => p.grade)))],
    [papers]
  );

  const filtered = papers.filter((p) => {
    const matchesQuery = `${p.subject} ${p.year} ${p.grade}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesSubject = subjectFilter === "All" || p.subject === subjectFilter;
    const matchesYear = yearFilter === "All" || p.year === yearFilter;
    const matchesGrade = gradeFilter === "All" || p.grade === gradeFilter;
    return matchesQuery && matchesSubject && matchesYear && matchesGrade;
  });

  async function handleDelete(paper: PastPaper) {
    const label = `${paper.subject} – ${paper.grade} ${paper.year}`;
    const confirmed = window.confirm(`Delete "${label}"? This can't be undone.`);
    if (!confirmed) return;

    setDeletingId(paper.id);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/admin/papers/${paper.id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setDeleteError(data.error ?? "Couldn't delete this paper.");
        return;
      }

      setPapers((prev) => prev.filter((p) => p.id !== paper.id));
      router.refresh();
    } catch {
      setDeleteError("Something went wrong. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDownload(paper: PastPaper, url: string) {
    window.open(url, "_blank");
    const { error } = await supabase
      .from("past_papers")
      .update({ download_count: paper.download_count + 1 })
      .eq("id", paper.id);
    if (!error) {
      setPapers((prev) =>
        prev.map((p) =>
          p.id === paper.id ? { ...p, download_count: p.download_count + 1 } : p
        )
      );
    }
  }

  return (
    <div>
      {/* Search */}
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-2">
        <Search size={18} className="ml-2 shrink-0 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by subject, year, or grade..."
          className="w-full min-w-0 bg-transparent py-2 text-sm text-foreground placeholder:text-muted/70 focus:outline-none"
        />
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-3">
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="rounded-full border border-border bg-surface px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
        >
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s === "All" ? "All Subjects" : s}
            </option>
          ))}
        </select>
        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="rounded-full border border-border bg-surface px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
        >
          {grades.map((g) => (
            <option key={g} value={g}>
              {g === "All" ? "All Grades" : g}
            </option>
          ))}
        </select>
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="rounded-full border border-border bg-surface px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y === "All" ? "All Years" : y}
            </option>
          ))}
        </select>
      </div>

      {/* Results */}
      <p className="mt-4 text-sm text-muted">
        {filtered.length} paper{filtered.length !== 1 ? "s" : ""} found
      </p>

      {deleteError && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {deleteError}
        </p>
      )}

      <div className="mt-3 overflow-hidden rounded-2xl border border-border">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 bg-surface px-6 py-14 text-center">
            <FileText size={28} className="text-muted" />
            <p className="text-sm text-muted">
              No papers match your search. Try different filters.
            </p>
          </div>
        ) : (
          filtered.map((p, i) => (
            <div
              key={p.id}
              className={`flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6 ${
                i !== filtered.length - 1 ? "border-b border-border" : ""
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
                    <span className="ml-2">
                      {p.download_count} download{p.download_count !== 1 ? "s" : ""}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(p, p.paper_url)}
                  className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                >
                  <Download size={14} />
                  Paper
                </button>
                {p.memo_url && (
                  <button
                    onClick={() => handleDownload(p, p.memo_url!)}
                    className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-secondary transition-colors hover:bg-secondary/5"
                  >
                    <Download size={14} />
                    Memo
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(p)}
                    disabled={deletingId === p.id}
                    className="flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    {deletingId === p.id ? "Deleting..." : "Delete"}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}