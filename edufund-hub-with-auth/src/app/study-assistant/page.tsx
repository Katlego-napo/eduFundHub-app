import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StudyAssistantClient from "@/components/study-assistant/StudyAssistantClient";
import type { StudyDocument } from "@/lib/types/studyDocument";

export const metadata = {
  title: "AI Study Assistant | EduFund Hub",
};

export default async function StudyAssistantPage() {
  const supabase = await createClient();
  const { data: userData, error } = await supabase.auth.getUser();

  if (error || !userData?.user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("study_documents")
    .select("*")
    .eq("user_id", userData.user.id)
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
              Upload your notes or a past paper, ask questions, and generate practice quizzes.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <StudyAssistantClient initialDocuments={documents} />
        </section>
      </main>
      <Footer />
    </>
  );
}
