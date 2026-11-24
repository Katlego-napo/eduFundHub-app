import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchResultsView from "@/components/SearchResultsView";
import { createServiceClient } from "@/lib/supabase/service";
import { prepareQuizzes } from "@/lib/quizAccess";
import type { Quiz } from "@/lib/types/quiz";
import type { Bursary } from "@/lib/types/bursary";

export const metadata = {
  title: "Search | EduFund Hub",
  description: "Search quizzes and bursaries on EduFund Hub.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  let quizzes: Quiz[] = [];
  let bursaries: Bursary[] = [];

  if (query) {
    const supabase = await createClient();
    const service = createServiceClient();

    const [quizzesRes, bursariesRes] = await Promise.all([
      service
        .from("quizzes")
        .select("*")
        .or(
          `title.ilike.%${query}%,subject.ilike.%${query}%,grade.ilike.%${query}%,topic.ilike.%${query}%`
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("bursaries")
        .select("*")
        .or(
          `name.ilike.%${query}%,funder.ilike.%${query}%,field_of_study.ilike.%${query}%,province.ilike.%${query}%`
        )
        .order("closing_date", { ascending: true }),
    ]);

    // Search only needs titles and counts, never question content.
    quizzes = prepareQuizzes((quizzesRes.data ?? []) as Quiz[], false);
    bursaries = bursariesRes.data ?? [];
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-background">
        <section className="border-b border-border bg-primary py-12">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
            <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              Search Results
            </h1>
            {query && (
              <p className="mt-2 text-white/75">
                Showing results for &ldquo;{query}&rdquo;
              </p>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <SearchResultsView query={query} quizzes={quizzes} bursaries={bursaries} />
        </section>
      </main>
      <Footer />
    </>
  );
}
