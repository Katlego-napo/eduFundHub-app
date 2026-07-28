"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Banknote, Sparkles } from "lucide-react";

export default function Hero() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <section className="relative overflow-hidden bg-primary">
      {/* Subtle background texture */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-secondary ring-1 ring-white/15">
            For South African students
          </span>

          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.1] text-white sm:text-5xl lg:text-6xl">
            Your Gateway to{" "}
            <span className="text-accent">Academic Success</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base text-white/75 sm:text-lg">
            Access study materials, bursaries, study resources, and career
            opportunities in one place.
          </p>

          {/* Search-first interaction */}
          <form onSubmit={handleSearch} className="mx-auto mt-8 max-w-xl">
            <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-xl shadow-black/10">
              <Search size={18} className="ml-2 shrink-0 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="text"
                placeholder="Search 'Grade 12 Mathematics 2025' or 'NSFAS bursary'..."
                className="w-full min-w-0 bg-transparent py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
              >
                Search
              </button>
            </div>
          </form>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
            <a
              href="/study-assistant"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-secondary px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] sm:w-auto"
            >
              <Sparkles size={16} />
              AI Study Assistant
            </a>
            <a
              href="/past-papers"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary transition-transform hover:scale-[1.02] sm:w-auto"
            >
              <FileText size={16} />
              Browse Study Materials
            </a>
            <a
              href="/bursaries"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-[#3A2E0A] transition-transform hover:scale-[1.02] sm:w-auto"
            >
              <Banknote size={16} />
              Find Bursaries
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}