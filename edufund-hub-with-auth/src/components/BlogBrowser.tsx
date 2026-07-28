"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BlogPost } from "@/lib/types/blog";
import { formatBlogDate } from "@/lib/types/blog";
import { Search, FileQuestion, Trash2 } from "lucide-react";

export default function BlogBrowser({
  posts,
  isAdmin = false,
}: {
  posts: BlogPost[];
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [allPosts, setAllPosts] = useState(posts);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const categories = ["All", ...Array.from(new Set(allPosts.map((p) => p.category)))];

  const filtered = allPosts.filter((p) => {
    const matchesQuery = `${p.title} ${p.excerpt}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesCategory = category === "All" || p.category === category;
    return matchesQuery && matchesCategory;
  });

  async function handleDelete(post: BlogPost) {
    const confirmed = window.confirm(`Delete "${post.title}"? This can't be undone.`);
    if (!confirmed) return;

    setDeletingId(post.id);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/admin/posts/${post.id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setDeleteError(data.error ?? "Couldn't delete this post.");
        return;
      }

      setAllPosts((prev) => prev.filter((p) => p.id !== post.id));
      router.refresh();
    } catch {
      setDeleteError("Something went wrong. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-2">
        <Search size={18} className="ml-2 shrink-0 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles..."
          className="w-full min-w-0 bg-transparent py-2 text-sm text-foreground placeholder:text-muted/70 focus:outline-none"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              category === c
                ? "bg-primary text-white"
                : "bg-foreground/5 text-muted hover:bg-foreground/10"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm text-muted">
        {filtered.length} article{filtered.length !== 1 ? "s" : ""}
      </p>

      {deleteError && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {deleteError}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface px-6 py-14 text-center">
          <FileQuestion size={28} className="text-muted" />
          <p className="text-sm text-muted">
            No articles match your search. Try a different term or category.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {filtered.map((post) => (
            <div
              key={post.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-shadow hover:shadow-lg hover:shadow-black/5"
            >
              {isAdmin && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(post);
                  }}
                  disabled={deletingId === post.id}
                  aria-label={`Delete "${post.title}"`}
                  className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-white/90 text-red-600 backdrop-blur-sm transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                </button>
              )}

              <Link href={`/blog/${post.slug}`} className="flex flex-1 flex-col">
                <div
                  className="h-36 w-full"
                  style={{ backgroundColor: post.cover_color }}
                />
                <div className="flex flex-1 flex-col p-5">
                  <span className="w-fit rounded-full bg-foreground/5 px-2.5 py-1 text-xs font-medium text-muted">
                    {post.category}
                  </span>
                  <h3 className="mt-3 font-display text-base font-semibold leading-snug text-foreground group-hover:text-primary">
                    {post.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm text-muted line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-muted">
                      {formatBlogDate(post.created_at)}
                    </span>
                    <span className="text-sm font-semibold text-primary">
                      Read More →
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}