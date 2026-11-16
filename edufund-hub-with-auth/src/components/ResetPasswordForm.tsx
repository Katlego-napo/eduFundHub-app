"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordForm() {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // The reset link signs the user in via /auth/callback. If there's no
  // session, the link was expired, already used, or the page was opened directly.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setStatus(data.user ? "ready" : "invalid"));
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) return setError(error.message);

    setDone(true);
    setTimeout(() => router.push("/dashboard"), 1500);
  }

  if (status === "checking") {
    return <p className="text-center text-sm text-muted">Checking your link...</p>;
  }

  if (status === "invalid") {
    return (
      <div className="rounded-xl border border-border bg-surface p-5 text-center">
        <p className="font-display text-base font-semibold text-foreground">
          This link has expired
        </p>
        <p className="mt-1 text-sm text-muted">
          Reset links work once and expire after a short time. Request a new one.
        </p>
        <a
          href="/forgot-password"
          className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-light"
        >
          Get a new link
        </a>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-xl border border-secondary/30 bg-secondary/10 p-5 text-center">
        <p className="font-display text-base font-semibold text-foreground">Password updated</p>
        <p className="mt-1 text-sm text-muted">Taking you to your dashboard...</p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
          New password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-foreground">
          Confirm new password
        </label>
        <input
          id="confirm"
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
        />
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-60"
      >
        {loading ? "Saving..." : "Update password"}
      </button>
    </form>
  );
}
