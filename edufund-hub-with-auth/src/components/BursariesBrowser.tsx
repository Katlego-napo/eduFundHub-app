"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Bursary } from "@/lib/types/bursary";
import { daysUntil, formatDate, urgencyStyle, urgencyLabel } from "@/lib/types/bursary";
import SaveShareButtons from "@/components/SaveShareButtons";
import { Search, Clock, ArrowUpRight, Trash2 } from "lucide-react";

export default function BursariesBrowser({
  initialBursaries,
  isAdmin = false,
}: {
  initialBursaries: Bursary[];
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [bursaries, setBursaries] = useState(initialBursaries);
  const [query, setQuery] = useState("");
  const [fieldFilter, setFieldFilter] = useState("All");
  const [provinceFilter, setProvinceFilter] = useState("All");
  const [sortByClosing, setSortByClosing] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fields = useMemo(
    () => ["All", ...Array.from(new Set(bursaries.map((b) => b.field_of_study)))],
    [bursaries]
  );
  const provinces = useMemo(
    () => ["All", ...Array.from(new Set(bursaries.map((b) => b.province)))],
    [bursaries]
  );

  async function handleDelete(b: Bursary) {
    const confirmed = window.confirm(`Delete "${b.name}"? This can't be undone.`);
    if (!confirmed) return;

    setDeletingId(b.id);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/admin/bursaries/${b.id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setDeleteError(data.error ?? "Couldn't delete this bursary.");
        return;
      }

      setBursaries((prev) => prev.filter((item) => item.id !== b.id));
      router.refresh();
    } catch {
      setDeleteError("Something went wrong. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = bursaries
    .filter((b) => {
      const matchesQuery = `${b.name} ${b.funder} ${b.field_of_study}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesField = fieldFilter === "All" || b.field_of_study === fieldFilter;
      const matchesProvince = provinceFilter === "All" || b.province === provinceFilter;
      return matchesQuery && matchesField && matchesProvince;
    })
    .sort((a, b) =>
      sortByClosing
        ? new Date(a.closing_date).getTime() - new Date(b.closing_date).getTime()
        : 0
    );

  return (
    <div>
      {/* Search */}
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-2">
        <Search size={18} className="ml-2 shrink-0 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by bursary name, funder, or field..."
          className="w-full min-w-0 bg-transparent py-2 text-sm text-foreground placeholder:text-muted/70 focus:outline-none"
        />
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-3">
        <select
          value={fieldFilter}
          onChange={(e) => setFieldFilter(e.target.value)}
          className="rounded-full border border-border bg-surface px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
        >
          {fields.map((f) => (
            <option key={f} value={f}>
              {f === "All" ? "All Fields of Study" : f}
            </option>
          ))}
        </select>
        <select
          value={provinceFilter}
          onChange={(e) => setProvinceFilter(e.target.value)}
          className="rounded-full border border-border bg-surface px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
        >
          {provinces.map((p) => (
            <option key={p} value={p}>
              {p === "All" ? "All Provinces" : p}
            </option>
          ))}
        </select>
        <button
          onClick={() => setSortByClosing(!sortByClosing)}
          className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
            sortByClosing
              ? "border-secondary bg-secondary/10 text-secondary"
              : "border-border text-muted"
          }`}
        >
          <Clock size={14} />
          Sort by closing date
        </button>
      </div>

      <p className="mt-4 text-sm text-muted">
        {filtered.length} bursar{filtered.length !== 1 ? "ies" : "y"} found
      </p>

      {deleteError && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {deleteError}
        </p>
      )}

      {/* Results grid */}
      <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface px-6 py-14 text-center">
            <p className="text-sm text-muted">
              No bursaries match your search. Try different filters.
            </p>
          </div>
        ) : (
          filtered.map((b) => {
            const days = daysUntil(b.closing_date);
            return (
              <div
                key={b.id}
                id={b.id}
                className="flex flex-col rounded-2xl border border-border bg-surface p-6 transition-shadow hover:shadow-lg hover:shadow-black/5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${urgencyStyle(
                      days
                    )}`}
                  >
                    <Clock size={12} />
                    {urgencyLabel(days)}
                  </div>
                  <SaveShareButtons bursaryId={b.id} bursaryName={b.name} />
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
                    <span className="shrink-0 text-muted">Field</span>
                    <span className="text-right font-medium text-foreground">
                      {b.field_of_study}
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

                {isAdmin && (
                  <button
                    onClick={() => handleDelete(b)}
                    disabled={deletingId === b.id}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full border border-red-200 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 size={13} />
                    {deletingId === b.id ? "Deleting..." : "Delete Bursary"}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}