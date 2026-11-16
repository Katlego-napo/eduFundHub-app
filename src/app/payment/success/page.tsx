"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type Phase = "waiting" | "done" | "slow" | "loggedout";

// PayFast sends the customer here right after paying. Their subscription is
// switched on a few seconds later by PayFast's notification, so we wait for
// that (instead of assuming), then send them to the quizzes, all unlocked.
export default function PaymentSuccessPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("waiting");

  useEffect(() => {
    let stopped = false;
    let tries = 0;
    const MAX_TRIES = 25; // about 50 seconds

    async function check() {
      try {
        const res = await fetch("/api/trial/status", { cache: "no-store" });
        const data = await res.json();
        if (stopped) return;

        if (!data.isLoggedIn) {
          setPhase("loggedout");
          return;
        }
        if (data.isSubscribed && !data.isTrial) {
          setPhase("done");
          setTimeout(() => router.push("/quizzes"), 1500);
          return;
        }
      } catch {
        // network blip: just try again
      }

      tries += 1;
      if (stopped) return;
      if (tries >= MAX_TRIES) {
        setPhase("slow");
        return;
      }
      setTimeout(check, 2000);
    }

    check();
    return () => {
      stopped = true;
    };
  }, [router]);

  return (
    <>
      <Header />
      <main className="flex-1 bg-background">
        <section className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
          {phase === "waiting" && (
            <>
              <Loader2 size={36} className="mx-auto animate-spin text-primary" />
              <h1 className="mt-5 font-display text-xl font-semibold text-foreground">
                Confirming your payment...
              </h1>
              <p className="mt-2 text-sm text-muted">
                This usually takes a few seconds. Please don&apos;t close this page.
              </p>
            </>
          )}

          {phase === "done" && (
            <>
              <CheckCircle2 size={40} className="mx-auto text-secondary" />
              <h1 className="mt-5 font-display text-xl font-semibold text-foreground">
                Payment successful!
              </h1>
              <p className="mt-2 text-sm text-muted">
                Everything is unlocked. Taking you to the quizzes...
              </p>
            </>
          )}

          {phase === "slow" && (
            <>
              <h1 className="font-display text-xl font-semibold text-foreground">
                Your payment is still being confirmed
              </h1>
              <p className="mt-2 text-sm text-muted">
                PayFast has your payment. Confirmation is taking longer than usual, and your access will
                switch on automatically as soon as it arrives. If nothing changes in a few minutes,
                email admin@edufundhub.co.za and we&apos;ll sort it out.
              </p>
              <Link
                href="/quizzes"
                className="mt-6 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-light"
              >
                Go to quizzes
              </Link>
            </>
          )}

          {phase === "loggedout" && (
            <>
              <h1 className="font-display text-xl font-semibold text-foreground">
                Please log in to continue
              </h1>
              <p className="mt-2 text-sm text-muted">
                Your payment went through. Log in and your subscription will be active.
              </p>
              <Link
                href="/login?redirect=/quizzes"
                className="mt-6 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-light"
              >
                Log in
              </Link>
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
