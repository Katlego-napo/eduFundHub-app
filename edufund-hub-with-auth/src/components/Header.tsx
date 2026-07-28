"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, Moon, Sun, GraduationCap, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Quizzes", href: "/quizzes" },
  { label: "AI Study Assistant", href: "/study-assistant" },
  { label: "Study Materials", href: "/past-papers" },
  { label: "Bursaries", href: "/bursaries" },
  { label: "Blog", href: "/blog" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const router = useRouter();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark =
      stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDark(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  function handleHeaderSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false);
    setSearchQuery("");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
            <GraduationCap size={20} strokeWidth={2.25} />
          </span>
          <span className="font-display text-lg font-semibold text-foreground">
            EduFund <span className="text-secondary">Hub</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Toggle search"
            className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
              searchOpen
                ? "border-primary text-primary"
                : "border-border text-muted hover:border-primary hover:text-primary"
            }`}
          >
            {searchOpen ? <X size={17} /> : <Search size={17} />}
          </button>

          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-primary hover:text-primary"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <Link
            href="/login"
            className={`hidden rounded-full px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5 sm:block ${
              user ? "!hidden" : ""
            }`}
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className={`hidden rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-light sm:block ${
              user ? "!hidden" : ""
            }`}
          >
            Sign Up
          </Link>

          {user && (
            <>
              <Link
                href="/dashboard"
                className="hidden rounded-full px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5 sm:block"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="hidden rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-light sm:block"
              >
                Log Out
              </button>
            </>
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            className="flex h-9 w-9 items-center justify-center rounded-full text-foreground lg:hidden"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-border bg-surface px-4 py-3 sm:px-6 lg:px-8">
          <form
            onSubmit={handleHeaderSearch}
            className="mx-auto flex max-w-2xl items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5"
          >
            <Search size={16} className="shrink-0 text-muted" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search past papers or bursaries..."
              className="w-full min-w-0 bg-transparent py-1.5 text-sm text-foreground placeholder:text-muted/70 focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-primary-light"
            >
              Search
            </button>
          </form>
        </div>
      )}

      {menuOpen && (
        <nav className="border-t border-border bg-surface px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-primary/5"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 border-t border-border pt-3">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 rounded-full border border-border py-2 text-center text-sm font-medium text-primary"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex-1 rounded-full bg-primary py-2 text-center text-sm font-semibold text-white"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 rounded-full border border-border py-2 text-center text-sm font-medium text-primary"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 rounded-full bg-primary py-2 text-center text-sm font-semibold text-white"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}