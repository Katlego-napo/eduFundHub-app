import { redirect } from "next/navigation";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import Header from "@/components/Header";
import DashboardSidebar from "@/components/DashboardSidebar";

// Wraps every page under /dashboard with the site header and the left sidebar.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getCurrentUserWithRole();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row">
        <DashboardSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
