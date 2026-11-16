import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { getSubscriptionStatus } from "@/lib/auth/getSubscriptionStatus";
import DeleteAccountSection from "@/components/DeleteAccountSection";
import CancelSubscriptionButton from "@/components/CancelSubscriptionButton";

export const metadata = { title: "Settings | EduFund Hub" };

const dateOnly: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };

export default async function SettingsPage() {
  const { user, isAdmin } = await getCurrentUserWithRole();
  if (!user) redirect("/login");

  const s = await getSubscriptionStatus();

  const name = user.user_metadata?.full_name || user.user_metadata?.name || "Not set";
  const memberSince = user.created_at ? new Date(user.created_at).toLocaleDateString("en-ZA", dateOnly) : null;
  const endDate = s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString("en-ZA", dateOnly) : null;
  const trialEnds = s.currentPeriodEnd
    ? new Date(s.currentPeriodEnd).toLocaleString("en-ZA", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const planName =
    s.plan === "yearly" ? "Yearly plan" : s.plan === "monthly" ? "Monthly plan" : s.plan === "admin" ? "Admin" : "Subscribed";

  let plan: { label: string; detail: string; badge: string; upgrade: boolean };
  if (s.isTrial) {
    plan = {
      label: "Free trial",
      detail: trialEnds ? `Your trial ends ${trialEnds}.` : "Your trial is active.",
      badge: "bg-accent/20 text-[#7A5A0A]",
      upgrade: true,
    };
  } else if (s.isSubscribed && s.cancelAtPeriodEnd) {
    plan = {
      label: `${planName} (cancelled)`,
      detail: `You won't be charged again. You keep full access until ${endDate}.`,
      badge: "bg-accent/20 text-[#7A5A0A]",
      upgrade: true,
    };
  } else if (s.isSubscribed) {
    plan = {
      label: planName,
      detail:
        s.plan === "monthly"
          ? `Renews monthly. Your current period ends around ${endDate}.`
          : s.plan === "yearly"
          ? `Paid once. You have full access until ${endDate}. It does not renew automatically.`
          : "You have full access to everything.",
      badge: "bg-secondary/15 text-secondary",
      upgrade: false,
    };
  } else {
    plan = {
      label: "Free plan",
      detail: "You can try one free sample quiz. Subscribe for unlimited quizzes.",
      badge: "bg-foreground/10 text-muted",
      upgrade: true,
    };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted">Your profile, plan and account.</p>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-base font-semibold text-foreground">Profile</h2>
        <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted">Name</dt>
            <dd className="mt-0.5 font-medium text-foreground">{name}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Email</dt>
            <dd className="mt-0.5 break-all font-medium text-foreground">{user.email}</dd>
          </div>
          {memberSince && (
            <div>
              <dt className="text-xs text-muted">Member since</dt>
              <dd className="mt-0.5 font-medium text-foreground">{memberSince}</dd>
            </div>
          )}
          {isAdmin && (
            <div>
              <dt className="text-xs text-muted">Role</dt>
              <dd className="mt-0.5 font-medium text-foreground">Admin</dd>
            </div>
          )}
        </dl>
        <Link href="/forgot-password" className="mt-5 inline-block text-sm font-medium text-primary hover:underline">
          Change password
        </Link>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-base font-semibold text-foreground">Your plan</h2>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${plan.badge}`}>{plan.label}</span>
            <p className="mt-2 text-sm text-muted">{plan.detail}</p>
          </div>
          {plan.upgrade && (
            <Link
              href="/pricing"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
            >
              {s.isTrial || s.cancelAtPeriodEnd ? "View plans" : "Upgrade"}
            </Link>
          )}
          {s.canCancel && !s.cancelAtPeriodEnd && <CancelSubscriptionButton endDate={endDate} />}
        </div>
      </section>

      <DeleteAccountSection hasActiveSubscription={s.canCancel} />
    </div>
  );
}
