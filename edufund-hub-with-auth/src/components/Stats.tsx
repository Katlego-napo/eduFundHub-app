import { FileText, Banknote, Newspaper, Users } from "lucide-react";

// const STATS = [
//   { label: "Past Papers", value: "2,400+", icon: FileText },
//   { label: "Active Bursaries", value: "180+", icon: Banknote },
//   { label: "Blog Articles", value: "320+", icon: Newspaper },
//   { label: "Registered Students", value: "15,500+", icon: Users },
// ];

export default function Stats() {
  return (
    <section className="border-b border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {/* {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center text-center">
              <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                <stat.icon size={18} />
              </span>
              <span className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
                {stat.value}
              </span>
              <span className="mt-1 text-xs text-muted sm:text-sm">
                {stat.label}
              </span>
            </div>
          ))} */}
        </div>
      </div>
    </section>
  );
}
