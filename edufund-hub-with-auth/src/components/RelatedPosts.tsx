import Link from "next/link";
import type { BlogPost } from "@/lib/types/blog";

export default function RelatedPosts({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null;

  return (
    <div className="mt-12 border-t border-border pt-8">
      <h2 className="font-display text-lg font-semibold text-foreground">
        Related Articles
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-lg hover:shadow-black/5"
          >
            <div className="h-20 w-full" style={{ backgroundColor: post.cover_color }} />
            <div className="p-4">
              <span className="text-xs font-medium text-muted">{post.category}</span>
              <h3 className="mt-1 text-sm font-semibold text-foreground group-hover:text-primary">
                {post.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
