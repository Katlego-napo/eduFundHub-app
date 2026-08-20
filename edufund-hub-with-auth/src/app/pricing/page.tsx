"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Check, Sparkles, Brain, Calendar, Loader2 } from "lucide-react";
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

// Inner component that uses useSearchParams — must be inside <Suspense>
function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);

  const [data, setData] = useState<PricingData | null>(null);
  const [starting, setStarting] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);
  const [trialSuccess, setTrialSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [payfastData, setPayfastData] = useState<{
    url: string;
    fields: Record<string, string>;
  } | null>(null);

  const returnStatus = searchParams.get("status");

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

  useEffect(() => {
    if (payfastData && formRef.current) {
      formRef.current.submit();
    }
  }, [payfastData]);

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

  async function handleSubscribe(plan: "monthly" | "exam_season") {
    if (!data?.isLoggedIn) {
      router.push("/login?redirect=/pricing");
      return;
    }
    setCheckoutError(null);
    setCheckoutLoading(plan);
    try {
      const res = await fetch("/api/payfast/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();
      if (!res.ok) {
        setCheckoutError(json.error ?? "Couldn't start checkout. Please try again.");
        return;
      }
      setPayfastData({ url: json.payfastUrl, fields: json.paymentData });
    } catch {
      setCheckoutError("Something went wrong. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  }

  const loading = data === null;
  const {
    isLoggedIn,
    isSubscribed,
    isTrial,
    trialDaysRemaining,
    trialUsed,
    plan,
  } = data ?? {
    isLoggedIn: false,
    isSubscribed: false,
    isTrial: false,
    trialDaysRemaining: null,
    trialUsed: false,
    plan: null,
  };

  return (
    <>
      {/* Hidden PayFast form — auto-submitted once checkout data arrives */}
      {payfastData && (
        <form
          ref={formRef}
          method="POST"
          action={payfastData.url}
          style={{ display: "none" }}
        >
          {Object.entries(payfastData.fields).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
        </form>
      )}

      {/* Return status banners */}
      {returnStatus === "success" && (
        <div className="mb-8 rounded-2xl border border-secondary/30 bg-secondary/10 px-5 py-4 text-center text-sm font-medium text-foreground">
          🎉 Payment successful! Your subscription is now active.{" "}
          <Link href="/dashboard" className="font-semibold text-primary hover:underline">
            Go to your dashboard →
          </Link>
        </div>
      )}
      {returnStatus === "cancelled" && (
        <div className="mb-8 rounded-2xl border border-border bg-surface px-5 py-4 text-center text-sm text-muted">
          Payment was cancelled. You can try again whenever you&apos;re ready.
        </div>
      )}

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
          Subscribe before it ends to keep full access.
        </div>
      )}

      {trialSuccess && (
        <div className="mb-8 rounded-2xl border border-secondary/30 bg-secondary/10 px-5 py-4 text-center text-sm font-medium text-foreground">
          🎉 Your 14-day free trial has started! Redirecting you now...
        </div>
      )}

      {checkoutError && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-700">
          {checkoutError}
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

        {/* Monthly plan */}
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
            R69
            <span className="text-base font-normal text-muted">/month</span>
          </p>
          <ul className="mt-6 flex-1 space-y-3">
            {FEATURES_PAID.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-muted">
                <Check size={15} className="mt-0.5 shrink-0 text-primary" />
                {f}
              </li>
            ))}
          </ul>

          <div className="mt-6 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center rounded-full bg-primary/20 py-2.5">
                <Loader2 size={16} className="animate-spin text-primary" />
              </div>
            ) : isSubscribed && plan === "monthly" ? (
              <div className="flex items-center justify-center gap-2 rounded-full bg-secondary/10 py-2.5 text-sm font-semibold text-secondary">
                ✅ Current plan
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleSubscribe("monthly")}
                  disabled={checkoutLoading === "monthly"}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-60"
                >
                  {checkoutLoading === "monthly" ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Sparkles size={15} />
                  )}
                  Subscribe — R69/month
                </button>
                {!trialUsed && !isTrial && (
                  <>
                    <button
                      onClick={handleStartTrial}
                      disabled={starting || trialSuccess}
                      className="flex w-full items-center justify-center gap-2 rounded-full border border-primary py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5 disabled:opacity-60"
                    >
                      {starting && (
                        <Loader2 size={14} className="animate-spin" />
                      )}
                      Start 14-Day Free Trial
                    </button>
                    <p className="text-center text-xs text-muted">
                      No credit card required for trial.
                    </p>
                  </>
                )}
                {trialUsed && !isTrial && (
                  <p className="text-center text-xs text-muted">
                    Trial already used.
                  </p>
                )}
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
            R199
            <span className="text-base font-normal text-muted">/3 months</span>
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
          {loading ? (
            <div className="mt-6 flex items-center justify-center rounded-full bg-accent/20 py-2.5">
              <Loader2 size={16} className="animate-spin text-[#7A5A0A]" />
            </div>
          ) : isSubscribed && plan === "exam_season" ? (
            <div className="mt-6 flex items-center justify-center gap-2 rounded-full bg-secondary/10 py-2.5 text-sm font-semibold text-secondary">
              ✅ Current plan
            </div>
          ) : (
            <button
              onClick={() => handleSubscribe("exam_season")}
              disabled={checkoutLoading === "exam_season"}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-accent py-2.5 text-sm font-semibold text-[#3A2E0A] transition-colors hover:bg-accent/90 disabled:opacity-60"
            >
              {checkoutLoading === "exam_season" ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Brain size={15} />
              )}
              Subscribe — R199
            </button>
          )}
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
              Access to paid features stops and you revert to the free plan.
              Subscribe at any time to restore full access.
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
              What payment methods are accepted?
            </p>
            <p className="mt-1">
              All major South African payment methods through PayFast —
              credit/debit cards, EFT, and more.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">
              Is the free plan actually free?
            </p>
            <p className="mt-1">
              Yes, always. Bursary listings and one free quiz will remain free
              with no credit card required.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// Outer page component — wraps PricingContent in Suspense so that
// useSearchParams() doesn't cause a static rendering build error on Vercel.
export default function PricingPage() {
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
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-muted" />
              </div>
            }
          >
            <PricingContent />
          </Suspense>
        </section>
      </main>
      <Footer />
    </>
  );
}
