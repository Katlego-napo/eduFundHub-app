import { redirect } from "next/navigation";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import CreatePostForm from "@/components/CreatePostForm";
import Link from "next/link";
import { GraduationCap, ShieldAlert } from "lucide-react";

export default async function CreatePostPage() {
  const { user, isAdmin } = await getCurrentUserWithRole();

  if (!user) {
    redirect("/login");
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <ShieldAlert size={36} className="text-muted" />
        <h1 className="mt-4 font-display text-xl font-semibold text-foreground">
          Admins only
        </h1>
        <p className="mt-1 max-w-sm text-sm text-muted">
          You need admin access to publish blog posts.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-light"
        >
          Back to homepage
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
              <GraduationCap size={20} />
            </span>
            <span className="font-display text-lg font-semibold text-foreground">
              EduFund <span className="text-secondary">Hub</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Create Blog Post
        </h1>
        <p className="mt-1 text-sm text-muted">
          Write a new article for the EduFund Hub blog.
        </p>

        <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
          <CreatePostForm />
        </div>
      </main>
    </div>
  );
}
