import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { getSubscriptionStatus } from "@/lib/auth/getSubscriptionStatus";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StudyAssistantClient from "@/components/study-assistant/StudyAssistantClient";
import type { StudyDocument } from "@/lib/types/studyDocument";
import { Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { STUDY_ASSISTANT_ENABLED } from "@/lib/features";

export const metadata = {
  title: "AI Study Assistant | EduFund Hub",
};

export default async function StudyAssistantPage() {
  // Switched off until there is demand — see src/lib/features.ts
  if (!STUDY_ASSISTANT_ENABLED) notFound();

  const supabase = await createClient();
  const { data: userData, error } = await supabase.auth.getUser();

  if (error || !userData?.user) {
    redirect("/login");
  }

  const { isAdmin } = await getCurrentUserWithRole();
  const { isSubscribed } = await getSubscriptionStatus();

  // Study guides are uploaded by the admin and shared with all subscribers.
  // Only id / name / date go to the browser — never the guide text itself.
  const { data } = await createServiceClient()
    .from("study_documents")
    .select("id, file_name, created_at")
    .order("created_at", { ascending: false });

  const documents: StudyDocument[] = data ?? [];

  return (
    <>
      <Header />
      <main className="flex-1 bg-background">
        <section className="border-b border-border bg-primary py-12">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
            <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              AI Study Assistant
            </h1>
            <p className="mt-2 text-white/75">
              Ask questions and get answers based on EduFund Hub&apos;s official study guides.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          {isSubscribed ? (
            <StudyAssistantClient initialDocuments={documents} isAdmin={isAdmin} />
          ) : (
            <div className="relative">
              {/* Blurred preview of what the feature looks like */}
              <div className="pointer-events-none select-none blur-sm opacity-40">
                <div className="rounded-2xl border border-border bg-surface p-6">
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    Ask about our study guides
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Pick a study guide and ask any question. Answers come from the
                    guide itself.
                  </p>
                  <div className="mt-4 h-10 w-full rounded-full bg-primary/30" />
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-surface p-6">
                    <div className="h-5 w-48 rounded bg-foreground/10" />
                    <div className="mt-4 space-y-2">
                      <div className="h-4 w-full rounded bg-foreground/5" />
                      <div className="h-4 w-3/4 rounded bg-foreground/5" />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border bg-surface p-6">
                    <div className="h-5 w-32 rounded bg-foreground/10" />
                    <div className="mt-4 space-y-2">
                      <div className="h-4 w-full rounded bg-foreground/5" />
                      <div className="h-4 w-2/3 rounded bg-foreground/5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Lock overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="mx-4 w-full max-w-sm rounded-2xl border border-border bg-surface p-8 text-center shadow-xl shadow-black/10">
                  <span className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Lock size={24} />
                  </span>
                  <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
                    Subscribe to unlock
                  </h2>
                  <p className="mt-2 text-sm text-muted">
                    The AI Study Assistant is available to subscribers. Ask
                    questions and get answers based on our study guides.
                  </p>
                  <Link
                    href="/pricing"
                    className="mt-5 flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
                  >
                    <Sparkles size={15} />
                    View Plans
                  </Link>
                  <p className="mt-3 text-xs text-muted">
                    Free plan available — no credit card required.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
