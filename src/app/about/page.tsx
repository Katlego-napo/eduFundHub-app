import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BookOpen, HeartHandshake, Sparkles, Brain } from "lucide-react";

export const metadata = {
  title: "About Us | EduFund Hub",
  description:
    "EduFund Hub helps South African students access past papers, bursaries, and an AI study assistant — free, always.",
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-background">
        <section className="border-b border-border bg-primary py-12">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
            <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              About EduFund Hub
            </h1>
            <p className="mt-2 text-white/75">
              Helping South African students access the resources they need to succeed.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <div className="space-y-5 text-sm leading-relaxed text-foreground sm:text-base">
            <p>
              EduFund Hub was created with one goal in mind: making sure that
              every South African student, no matter their background or
              location, has access to the tools they need to study
              effectively and fund their education.
            </p>
            <p>
              Too many students struggle to find reliable study tools,
              know where to look for bursaries, or get extra help when
              studying for a difficult subject. We built EduFund Hub to close
              that gap by bringing study materials, bursary listings,Quizzes, and an
              AI-powered study assistant together in one place, at affordable subscription.
            </p>
          </div>


          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border bg-surface p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen size={20} />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold text-foreground">
                Study Resources
              </h3>
              <p className="mt-2 text-sm text-muted">
                A growing library of study materials , organized so
                you can find exactly what you need before test day.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HeartHandshake size={20} />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold text-foreground">
                Bursaries
              </h3>
              <p className="mt-2 text-sm text-muted">
                Up-to-date bursary opportunities from across South Africa,
                searchable by field of study and province.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                <Brain size={20} />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold text-foreground">
                Practice Quizzes
              </h3>
              <p className="mt-2 text-sm text-muted">
                Multiple-choice quizzes with instant explanations, track
                your progress, and see how you rank against other students.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles size={20} />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold text-foreground">
                AI Study Assistant
              </h3>
              <p className="mt-2 text-sm text-muted">
                Ask questions, and generate
                practice quizzes tailored to what you're studying.
              </p>
            </div>
          </div>


          <div className="mt-10 rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Our Mission
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
              We believe access to quality study resources and funding
              information shouldn't depend on where you live or how much you
              can afford. EduFund Hub exists to level that playing field, one
              student at a time.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}