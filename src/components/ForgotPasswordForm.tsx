"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordForm() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    setLoading(false);

    // Rate limit / network problems are worth showing. Anything else we treat
    // as "sent" so the page never reveals whether an email has an account.
    if (error && /rate limit|fetch/i.test(error.message)) {
      setError("Too many attempts or a network problem. Please try again in a few minutes.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-secondary/30 bg-secondary/10 p-5 text-center">
        <p className="font-display text-base font-semibold text-foreground">Check your email</p>
        <p className="mt-1 text-sm text-muted">
          If an account exists for <strong>{email}</strong>, we&apos;ve sent a link to reset
          your password. It can take a minute, so check your spam folder too.
        </p>
        <a href="/login" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          Back to log in
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-secondary"
        />
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={loading || !email}
        className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-60"
      >
        {loading ? "Sending..." : "Send reset link"}
      </button>

      <p className="text-center text-sm">
        <a href="/login" className="font-medium text-primary hover:underline">
          Back to log in
        </a>
      </p>
    </form>
  );
}
