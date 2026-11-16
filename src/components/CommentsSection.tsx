"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Comment } from "@/lib/types/blog";
import { formatBlogDate } from "@/lib/types/blog";
import { Trash2, MessageCircle } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";

export default function CommentsSection({
  postId,
  initialComments,
}: {
  postId: string;
  initialComments: Comment[];
}) {
  const supabase = createClient();
  const [comments, setComments] = useState(initialComments);
  const [user, setUser] = useState<User | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !text.trim()) return;

    setLoading(true);
    setError(null);

    const authorName =
      (user.user_metadata?.full_name as string | undefined) ||
      user.email?.split("@")[0] ||
      "Student";

    const { data, error: insertError } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        user_id: user.id,
        author_name: authorName,
        content: text.trim(),
      })
      .select()
      .single();

    setLoading(false);

    if (insertError || !data) {
      setError("Couldn't post your comment. Try again.");
      return;
    }

    setComments((prev) => [data as Comment, ...prev]);
    setText("");
  }

  async function handleDelete(commentId: string) {
    const { error: deleteError } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (!deleteError) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  }

  return (
    <div className="mt-12 border-t border-border pt-8">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
        <MessageCircle size={18} />
        Comments
        <span className="text-sm font-normal text-muted">({comments.length})</span>
      </h2>

      {user ? (
        <form onSubmit={handleSubmit} className="mt-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Share your thoughts..."
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-secondary"
          />
          {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="mt-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-60"
          >
            {loading ? "Posting..." : "Post Comment"}
          </button>
        </form>
      ) : (
        <p className="mt-4 rounded-xl bg-foreground/5 px-4 py-3 text-sm text-muted">
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>{" "}
          to join the conversation.
        </p>
      )}

      <div className="mt-6 space-y-5">
        {comments.length === 0 ? (
          <p className="text-sm text-muted">No comments yet. Be the first to share your thoughts.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {c.author_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{c.author_name}</p>
                  <span className="text-xs text-muted">{formatBlogDate(c.created_at)}</span>
                </div>
                <p className="mt-0.5 text-sm text-muted">{c.content}</p>
              </div>
              {user?.id === c.user_id && (
                <button
                  onClick={() => handleDelete(c.id)}
                  aria-label="Delete comment"
                  className="text-muted hover:text-red-600"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
