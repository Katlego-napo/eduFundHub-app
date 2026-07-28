"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BLOG_CATEGORIES, slugify } from "@/lib/types/blog";

const COLOR_OPTIONS = [
  { label: "Primary Blue", value: "#0F4C81" },
  { label: "Secondary Sky", value: "#00A8E8" },
  { label: "Accent Gold", value: "#FFC857" },
  { label: "Deep Navy", value: "#0A2E4D" },
];

export default function CreatePostForm() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(BLOG_CATEGORIES[0]);
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverColor, setCoverColor] = useState(COLOR_OPTIONS[0].value);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const authorName =
      (userData.user?.user_metadata?.full_name as string | undefined) ||
      "EduFund Hub Team";

    const slug = slugify(title);

    const { error: insertError } = await supabase.from("blog_posts").insert({
      slug,
      title,
      category,
      excerpt,
      content,
      cover_color: coverColor,
      author_name: authorName,
      author_id: userData.user?.id ?? null,
    });

    setLoading(false);

    if (insertError) {
      setError(
        insertError.message.includes("duplicate")
          ? "A post with this title already exists. Try a different title."
          : insertError.message
      );
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push(`/blog/${slug}`), 1000);
  }

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-secondary";
  const labelClass = "text-sm font-medium text-foreground";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={labelClass}>Title</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="How to Apply for NSFAS in 2027"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            {BLOG_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Cover Color</label>
          <select
            value={coverColor}
            onChange={(e) => setCoverColor(e.target.value)}
            className={inputClass}
          >
            {COLOR_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Excerpt (short summary shown on the blog list)</label>
        <textarea
          required
          rows={2}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="A one or two sentence summary of the article."
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>
          Content (separate paragraphs with a blank line)
        </label>
        <textarea
          required
          rows={10}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={"First paragraph...\n\nSecond paragraph..."}
          className={inputClass}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {success && (
        <p className="rounded-lg bg-secondary/10 px-3 py-2 text-sm text-foreground">
          Post published! Redirecting...
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-60"
      >
        {loading ? "Publishing..." : "Publish Post"}
      </button>
    </form>
  );
}
