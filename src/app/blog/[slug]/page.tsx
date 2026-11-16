import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CommentsSection from "@/components/CommentsSection";
import RelatedPosts from "@/components/RelatedPosts";
import BlogShareButtons from "@/components/BlogShareButtons";
import { formatBlogDate } from "@/lib/types/blog";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("title, excerpt")
    .eq("slug", slug)
    .maybeSingle();

  if (!post) return { title: "Article | EduFund Hub" };

  return {
    title: `${post.title} | EduFund Hub`,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!post) {
    notFound();
  }

  const [commentsRes, relatedRes] = await Promise.all([
    supabase
      .from("comments")
      .select("*")
      .eq("post_id", post.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("blog_posts")
      .select("*")
      .eq("category", post.category)
      .neq("id", post.id)
      .limit(3),
  ]);

  const comments = commentsRes.data ?? [];
  const related = relatedRes.data ?? [];
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/blog/${post.slug}`;

  return (
    <>
      <Header />
      <main className="flex-1 bg-background">
        <div
          className="h-56 w-full sm:h-72"
          style={{ backgroundColor: post.cover_color }}
        />

        <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <span className="rounded-full bg-foreground/5 px-2.5 py-1 text-xs font-medium text-muted">
            {post.category}
          </span>
          <h1 className="mt-3 font-display text-2xl font-semibold text-foreground sm:text-3xl">
            {post.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              By {post.author_name} &middot; {formatBlogDate(post.created_at)}
            </p>
            <BlogShareButtons title={post.title} url={url} />
          </div>

          <div className="prose prose-neutral mt-6 max-w-none text-foreground">
            {post.content.split("\n\n").map((paragraph: string, i: number) => (
              <p key={i} className="mb-4 leading-relaxed text-foreground/90">
                {paragraph}
              </p>
            ))}
          </div>

          <RelatedPosts posts={related} />
          <CommentsSection postId={post.id} initialComments={comments} />
        </article>
      </main>
      <Footer />
    </>
  );
}
