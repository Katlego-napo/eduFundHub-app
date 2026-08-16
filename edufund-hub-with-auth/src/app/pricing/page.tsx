"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Check, Sparkles, Brain, Calendar, Lock, Loader2 } from "lucide-react";
import Link from "next/link";

const FEATURES_FREE = [
  "Browse all bursary listings",
  "Save bursaries to your dashboard",
  "One free practice quiz",
];

const FEATURES_PAID = [
  "Everything in Free",
  "Unlimited practice quizzes",
  "Full AI Study Assistant access",
  "Upload documents and ask questions",
  "Generate AI practice quizzes from your notes",
  "Per-subject and per-topic progress tracking",
  "Full ranking and subject strength stats",
];

type PricingData = {
  isLoggedIn: boolean;
  isSubscribed: boolean;
  isTrial: boolean;
  trialDaysRemaining: number | null;
  trialUsed: boolean;
  plan: string | null;
};

export default function PricingPage() {
  const router = useRouter();
  const [data, setData] = useState<PricingData | null>(null);
  const [starting, setStarting] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);
  const [trialSuccess, setTrialSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/trial/status")
      .then((r) => r.json())
      .then(setData)
      .catch(() =>
        setData({
          isLoggedIn: false,
          isSubscribed: false,
          isTrial: false,
          trialDaysRemaining: null,
          trialUsed: false,
          plan: null,
        })
      );
  }, []);

  async function handleStartTrial() {
    setStarting(true);
    setTrialError(null);
    try {
      const res = await fetch("/api/trial", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setTrialError(json.error ?? "Couldn't start trial. Please try again.");
        return;
      }
      setTrialSuccess(true);
      setTimeout(() => router.push("/quizzes"), 1500);
    } catch {
      setTrialError("Something went wrong. Please try again.");
    } finally {
      setStarting(false);
    }
  }

  const loading = data === null;
  const { isLoggedIn, isSubscribed, isTrial, trialDaysRemaining, trialUsed, plan } =
    data ?? {
      isLoggedIn: false,
      isSubscribed: false,
      isTrial: false,
      trialDaysRemaining: null,
      trialUsed: false,
      plan: null,
    };

  return (
    <>
      <Header />
      <main className="flex-1 bg-background">
        <section className="border-b border-border bg-primary py-12">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              Simple, affordable pricing
            </h1>
            <p className="mt-2 text-white/75">
              Built for South African Grade 11 and 12 students. Cancel anytime.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          {/* Active subscription banner */}
          {isSubscribed && !isTrial && (
            <div className="mb-8 rounded-2xl border border-secondary/30 bg-secondary/10 px-5 py-4 text-center text-sm text-foreground">
              ✅ You&apos;re on the{" "}
              <span className="font-semibold">
                {plan === "exam_season" ? "Exam Season Package" : "Monthly Plan"}
              </span>
              . All features are unlocked.{" "}
              <Link href="/dashboard" className="font-medium text-primary hover:underline">
                Go to your dashboard →
              </Link>
            </div>
          )}

          {/* Trial active banner */}
          {isTrial && (
            <div className="mb-8 rounded-2xl border border-accent/30 bg-accent/10 px-5 py-4 text-center text-sm text-foreground">
              🎉 Your free trial is active —{" "}
              <span className="font-semibold">
                {trialDaysRemaining} day{trialDaysRemaining !== 1 ? "s" : ""} remaining.
              </span>{" "}
              Subscribe before it ends to keep full access.{" "}
              <Link href="/dashboard" className="font-medium text-primary hover:underline">
                Go to your dashboard →
              </Link>
            </div>
          )}

          {/* Trial success */}
          {trialSuccess && (
            <div className="mb-8 rounded-2xl border border-secondary/30 bg-secondary/10 px-5 py-4 text-center text-sm font-medium text-foreground">
              🎉 Your 14-day free trial has started! Redirecting you now...
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Free plan */}
            <div className="flex flex-col rounded-2xl border border-border bg-surface p-6">
              <h2 className="font-display text-lg font-semibold text-foreground">Free</h2>
              <p className="mt-1 text-sm text-muted">Get started with no commitment.</p>
              <p className="mt-4 font-display text-3xl font-bold text-foreground">
                R0
                <span className="text-base font-normal text-muted">/month</span>
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {FEATURES_FREE.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted">
                    <Check size={15} className="mt-0.5 shrink-0 text-secondary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={isLoggedIn ? "/quizzes" : "/signup"}
                className="mt-6 flex items-center justify-center rounded-full border border-border py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/5"
              >
                {isLoggedIn ? "You're on this plan" : "Get Started Free"}
              </Link>
            </div>

            {/* Monthly plan — with free trial */}
            <div className="relative flex flex-col rounded-2xl border-2 border-primary bg-surface p-6 shadow-lg shadow-primary/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                  Most Popular
                </span>
              </div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Monthly Plan
              </h2>
              <p className="mt-1 text-sm text-muted">Full access, billed monthly.</p>
              <p className="mt-4 font-display text-3xl font-bold text-foreground">
                Coming Soon
              </p>
              <p className="mt-1 text-xs text-muted">
                Payments launching shortly.
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {FEATURES_PAID.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted">
                    <Check size={15} className="mt-0.5 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Trial / subscribe button logic */}
              <div className="mt-6 space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center rounded-full bg-primary/20 py-2.5">
                    <Loader2 size={16} className="animate-spin text-primary" />
                  </div>
                ) : isSubscribed ? (
                  <Link
                    href="/dashboard"
                    className="flex items-center justify-center gap-2 rounded-full bg-secondary/10 py-2.5 text-sm font-semibold text-secondary"
                  >
                    ✅ Already subscribed
                  </Link>
                ) : !isLoggedIn ? (
                  <Link
                    href="/signup"
                    className="flex items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
                  >
                    <Sparkles size={15} />
                    Start 14-Day Free Trial
                  </Link>
                ) : trialUsed ? (
                  <>
                    <div className="flex items-center justify-center gap-2 rounded-full bg-foreground/5 py-2.5 text-sm font-medium text-muted">
                      <Lock size={14} />
                      Trial already used
                    </div>
                    <a
                      href="mailto:admin@edufundhub.co.za?subject=Monthly Plan Waitlist"
                      className="flex items-center justify-center gap-2 rounded-full border border-primary py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
                    >
                      Join the Waitlist
                    </a>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleStartTrial}
                      disabled={starting || trialSuccess}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-60"
                    >
                      {starting ? (
                        <><Loader2 size={15} className="animate-spin" /> Starting trial...</>
                      ) : (
                        <><Sparkles size={15} /> Start 14-Day Free Trial</>
                      )}
                    </button>
                    <p className="text-center text-xs text-muted">
                      No credit card required. Trial lasts 14 days.
                    </p>
                  </>
                )}
                {trialError && (
                  <p className="text-center text-xs text-red-600">{trialError}</p>
                )}
              </div>
            </div>

            {/* Exam season plan */}
            <div className="flex flex-col rounded-2xl border border-border bg-surface p-6">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Exam Season
                </h2>
                <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-[#7A5A0A]">
                  Sep – Nov
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">
                Full access for the matric exam period.
              </p>
              <p className="mt-4 font-display text-3xl font-bold text-foreground">
                Coming Soon
              </p>
              <p className="mt-1 text-xs text-muted">
                Available annually September – November.
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {FEATURES_PAID.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted">
                    <Check size={15} className="mt-0.5 shrink-0 text-[#7A5A0A]" />
                    {f}
                  </li>
                ))}
                <li className="flex items-start gap-2 text-sm font-medium text-[#7A5A0A]">
                  <Calendar size={15} className="mt-0.5 shrink-0" />
                  Timed for matric exams
                </li>
              </ul>
              <a
                href="mailto:admin@edufundhub.co.za?subject=Exam Season Package Waitlist"
                className="mt-6 flex items-center justify-center gap-2 rounded-full bg-accent py-2.5 text-sm font-semibold text-[#3A2E0A] transition-colors hover:bg-accent/90"
              >
                <Brain size={15} />
                Join the Waitlist
              </a>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-12 rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Common questions
            </h2>
            <div className="mt-4 space-y-4 text-sm text-muted">
              <div>
                <p className="font-medium text-foreground">
                  What does the 14-day free trial include?
                </p>
                <p className="mt-1">
                  Full access to everything — unlimited quizzes, AI Study Assistant,
                  progress tracking, and ranking. No credit card required.
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">
                  What happens after my trial ends?
                </p>
                <p className="mt-1">
                  Access to paid features stops and you revert to the free plan. You
                  can subscribe at any time to restore full access.
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">When will payments launch?</p>
                <p className="mt-1">
                  We&apos;re finalising our payment setup with PayFast. Join the waitlist
                  to be notified as soon as subscriptions open.
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">Can I cancel anytime?</p>
                <p className="mt-1">
                  Yes — cancel anytime and you keep access until the end of your
                  billing period. No hidden fees.
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">
                  What payment methods will be accepted?
                </p>
                <p className="mt-1">
                  All major South African payment methods through PayFast —
                  credit/debit cards, EFT, and more.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}