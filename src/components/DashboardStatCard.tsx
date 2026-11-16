import Link from "next/link";
import { ChevronRight } from "lucide-react";

// One of the four number cards at the top of the dashboard.
// Pass `href` to make the whole card clickable.
export default function DashboardStatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const body = (
    <>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-3 font-display text-3xl font-bold text-primary">{value}</p>
      {href && (
        <p className="mt-2 flex items-center gap-0.5 text-xs font-medium text-secondary">
          View details
          <ChevronRight size={13} />
        </p>
      )}
    </>
  );

  const base = "rounded-2xl border border-border bg-surface p-5";

  if (href) {
    return (
      <Link
        href={href}
        className={`${base} block transition-shadow hover:shadow-lg hover:shadow-black/5`}
      >
        {body}
      </Link>
    );
  }
  return <div className={base}>{body}</div>;
}
