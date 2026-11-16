"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CheckCircle2, AlertTriangle, Settings } from "lucide-react";

const ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/completed", label: "Quizzes completed", icon: CheckCircle2 },
  { href: "/dashboard/weak-topics", label: "Weak topics", icon: AlertTriangle },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

// Left sidebar on desktop; a scrollable row of tabs on phones.
export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Dashboard" className="md:w-56 md:shrink-0">
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-surface p-2 md:sticky md:top-24 md:flex-col md:overflow-visible">
        {ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:bg-foreground/5 hover:text-foreground"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
