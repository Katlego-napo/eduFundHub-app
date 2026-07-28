export type Bursary = {
  id: string;
  name: string;
  funder: string;
  field_of_study: string;
  province: string;
  closing_date: string;
  coverage: string;
  description: string;
  eligibility: string;
  benefits: string;
  official_url: string;
  contact_info: string | null;
  created_at: string;
};

export const FIELDS_OF_STUDY = [
  "All Fields",
  "Engineering",
  "Information Technology",
  "Education",
  "Health Sciences",
  "Commerce & Accounting",
  "Law",
  "Sciences",
] as const;

export const PROVINCES = [
  "National",
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
] as const;

/**
 * Parses a "YYYY-MM-DD" date-only string as a LOCAL calendar date.
 *
 * `new Date("2026-07-15")` is parsed by JS as UTC midnight, not local
 * midnight. Once that gets converted back to local time for display or
 * comparison (toLocaleDateString, setHours, etc.), any timezone behind UTC
 * shows the PREVIOUS day instead of the date that was actually set — e.g. a
 * bursary closing on the 15th shows as closing on the 14th. Building the
 * Date from its Y/M/D parts directly avoids the UTC round-trip entirely.
 */
function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const closing = parseDateOnly(dateStr);
  closing.setHours(0, 0, 0, 0);
  return Math.ceil((closing.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDate(dateStr: string): string {
  return parseDateOnly(dateStr).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function urgencyStyle(days: number): string {
  if (days < 0) return "bg-foreground/5 text-muted ring-border";
  if (days <= 14) return "bg-accent/15 text-[#7A5A0A] ring-accent/30";
  if (days <= 30) return "bg-secondary/10 text-secondary ring-secondary/20";
  return "bg-foreground/5 text-muted ring-border";
}

export function urgencyLabel(days: number): string {
  if (days < 0) return "Closed";
  if (days === 0) return "Closes today";
  return `Closes in ${days} day${days !== 1 ? "s" : ""}`;
}