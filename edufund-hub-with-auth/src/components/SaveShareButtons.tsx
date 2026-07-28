"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bookmark, Share2, Check } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export default function SaveShareButtons({
  bursaryId,
  bursaryName,
}: {
  bursaryId: string;
  bursaryName: string;
}) {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, [supabase]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("saved_bursaries")
      .select("id")
      .eq("user_id", user.id)
      .eq("bursary_id", bursaryId)
      .maybeSingle()
      .then(({ data }) => setSaved(!!data));
  }, [user, bursaryId, supabase]);

  async function toggleSave() {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setLoading(true);
    if (saved) {
      await supabase
        .from("saved_bursaries")
        .delete()
        .eq("user_id", user.id)
        .eq("bursary_id", bursaryId);
      setSaved(false);
    } else {
      await supabase
        .from("saved_bursaries")
        .insert({ user_id: user.id, bursary_id: bursaryId });
      setSaved(true);
    }
    setLoading(false);
  }

  async function handleShare() {
    const url = `${window.location.origin}/bursaries#${bursaryId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: bursaryName, url });
        return;
      } catch {
        // user cancelled share sheet, fall through to clipboard copy
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={toggleSave}
        disabled={loading}
        aria-label={saved ? "Unsave bursary" : "Save bursary"}
        className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
          saved
            ? "border-accent bg-accent/15 text-[#7A5A0A]"
            : "border-border text-muted hover:border-primary hover:text-primary"
        }`}
      >
        <Bookmark size={15} fill={saved ? "currentColor" : "none"} />
      </button>
      <button
        onClick={handleShare}
        aria-label="Share bursary"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-primary hover:text-primary"
      >
        {copied ? <Check size={15} /> : <Share2 size={15} />}
      </button>
    </div>
  );
}
