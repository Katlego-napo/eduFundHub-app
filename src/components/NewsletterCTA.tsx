"use client";

import { useState } from "react";

export default function NewsletterCTA() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Couldn't subscribe right now. Please try again.");
        return;
      }

      setSuccess(true);
      setEmail("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-primary py-14">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">
          Never miss a closing date
        </h2>
        <p className="mt-2 text-white/75">
          Get new bursaries, quizzes, and study tips delivered to your inbox weekly.
        </p>

        {success ? (
          <div className="mx-auto mt-6 max-w-md rounded-2xl bg-white/10 px-6 py-4 text-sm font-medium text-white">
            🎉 You&apos;re subscribed! Check your inbox for updates.
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              disabled={loading}
              className="flex-1 rounded-full bg-white px-5 py-3 text-sm text-foreground placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70"
            />
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-[#3A2E0A] transition-colors hover:bg-accent/90 disabled:opacity-60"
            >
              {loading ? "Subscribing..." : "Subscribe"}
            </button>
          </form>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-300">{error}</p>
        )}

        <p className="mt-4 text-xs text-white/50">
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}