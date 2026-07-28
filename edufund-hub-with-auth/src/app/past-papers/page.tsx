import { createClient } from "@/lib/supabase/server";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PastPapersBrowser from "@/components/PastPapersBrowser";
import type { PastPaper } from "@/lib/types/pastPaper";

export const metadata = {
  title: "Study Material | EduFund Hub",
  description:
    "Browse and download examination study resources for Grade 12/11/10, TVET and university in South Africa.",
};

export default async function PastPapersPage() {
  const supabase = await createClient();
  const { isAdmin } = await getCurrentUserWithRole();
  const { data, error } = await supabase
    .from("past_papers")
    .select("*")
    .order("created_at", { ascending: false });

  const papers: PastPaper[] = error ? [] : (data ?? []);

  return (
    <>
      <Header />
      <main className="flex-1 bg-background">
        <section className="border-b border-border bg-primary py-12">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
            <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              Exam Preparation Resources 
            </h1>
            <p className="mt-2 text-white/75">
              Search, filter and Download.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          {error ? (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              Couldn&apos;t load Material right now. Please refresh the page.
            </p>
          ) : (
            <PastPapersBrowser initialPapers={papers} isAdmin={isAdmin} />
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}