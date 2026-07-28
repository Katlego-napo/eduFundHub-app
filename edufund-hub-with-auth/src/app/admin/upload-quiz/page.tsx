import { redirect } from "next/navigation";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import UploadQuizForm from "@/components/UploadQuizForm";
import Header from "@/components/Header";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default async function UploadQuizPage() {
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
          You need admin access to create quizzes.
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
      <Header />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Create Quiz
        </h1>
        <p className="mt-1 text-sm text-muted">
          Build a multiple-choice practice quiz with explanations for each answer.
        </p>

        <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
          <UploadQuizForm />
        </div>
      </main>
    </div>
  );
}