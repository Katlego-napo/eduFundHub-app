import { createClient } from "@/lib/supabase/server";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BursariesBrowser from "@/components/BursariesBrowser";
import type { Bursary } from "@/lib/types/bursary";

export const metadata = {
  title: "Bursaries | EduFund Hub",
  description:
    "Find the latest bursary opportunities for South African students. Search and filter by field of study, province, and closing date.",
};

export default async function BursariesPage() {
  const supabase = await createClient();
  const { isAdmin } = await getCurrentUserWithRole();
  const { data, error } = await supabase
    .from("bursaries")
    .select("*")
    .order("closing_date", { ascending: true });

  const bursaries: Bursary[] = error ? [] : (data ?? []);

  return (
    <>
      <Header />
      <main className="flex-1 bg-background">
        <section className="border-b border-border bg-primary py-12">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
            <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              Bursary Opportunities
            </h1>
            <p className="mt-2 text-white/75">
              Find funding for your studies, search, filter, save, and apply.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          {error ? (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              Couldn&apos;t load bursaries right now. Please refresh the page.
            </p>
          ) : (
            <BursariesBrowser initialBursaries={bursaries} isAdmin={isAdmin} />
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}