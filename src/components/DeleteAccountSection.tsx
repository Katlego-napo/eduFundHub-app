"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Drop <DeleteAccountSection hasActiveSubscription={...} /> into your
// dashboard / settings page.
export default function DeleteAccountSection({
  hasActiveSubscription = false,
}: {
  hasActiveSubscription?: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Couldn't delete your account.");
        return;
      }
      await supabase.auth.signOut().catch(() => {});
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
      <h2 className="font-display text-lg font-semibold text-red-700">Delete account</h2>
      <p className="mt-1 text-sm text-muted">
        This permanently deletes your account, quiz results and saved quizzes.
        {hasActiveSubscription && " Your subscription will be cancelled and you won't be charged again."}{" "}
        This can&apos;t be undone.
      </p>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="mt-4 rounded-full border border-red-300 px-5 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
        >
          Delete my account
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          <label htmlFor="confirm-delete" className="block text-sm font-medium text-foreground">
            Type <strong>DELETE</strong> to confirm
          </label>
          <input
            id="confirm-delete"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="off"
            className="w-full max-w-xs rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-red-300"
          />

          {error && <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDelete}
              disabled={confirm !== "DELETE" || loading}
              className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Deleting..." : "Permanently delete"}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setConfirm("");
                setError(null);
              }}
              disabled={loading}
              className="rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-foreground/5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
