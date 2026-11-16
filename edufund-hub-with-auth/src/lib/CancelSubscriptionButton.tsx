"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelSubscriptionButton({ endDate }: { endDate: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payfast/cancel", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Couldn't cancel your subscription.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
      >
        Cancel subscription
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-border bg-background p-4">
      <p className="text-sm text-foreground">
        Cancel your subscription? You won&apos;t be charged again
        {endDate ? (
          <>
            {" "}
            and you&apos;ll keep full access until <strong>{endDate}</strong>.
          </>
        ) : (
          "."
        )}
      </p>
      {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
        >
          {loading ? "Cancelling..." : "Yes, cancel"}
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={loading}
          className="rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-foreground/5"
        >
          Keep my subscription
        </button>
      </div>
    </div>
  );
}
