import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { BlogPost } from "@/lib/types/blog";

export default async function BlogPreview() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(3);

  const posts: BlogPost[] = data ?? [];

  if (posts.length === 0) return null;

  return (
    <section className="bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-secondary">
              From the blog
            </span>
            <h2 className="mt-1 font-display text-2xl font-semibold text-foreground sm:text-3xl">
              Educational Resources
            </h2>
          </div>
          <Link
            href="/blog"
            className="text-sm font-semibold text-primary hover:underline"
          >
            View all articles →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-shadow hover:shadow-lg hover:shadow-black/5"
            >
              <div className="h-36 w-full" style={{ backgroundColor: post.cover_color }} />
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
                <span className="mt-4 text-sm font-semibold text-primary">
                  Read More →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
