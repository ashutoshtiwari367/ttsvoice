"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { siteConfig } from "@/config/site";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import ThemeToggle from "@/components/theme/ThemeToggle";

import { extractUsername } from "@/lib/user";

const links = siteConfig.navLinks;

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const checkUser = () => {
      supabase.auth.getUser().then(({ data }) => {
        setUser(data.user ?? null);
      });
    };

    // Check user on mount and every time navigation/redirect occurs
    checkUser();

    // Subscribe to client-side auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    window.addEventListener("focus", checkUser);
    window.addEventListener("auth-changed", checkUser);

    return () => {
      listener.subscription.unsubscribe();
      window.removeEventListener("focus", checkUser);
      window.removeEventListener("auth-changed", checkUser);
    };
  }, [pathname]);

  const handleSignOut = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setLoggingOut(false);
    router.push("/login");
    router.refresh();
  };

  const AuthButtons = ({ mobile = false }: { mobile?: boolean }) => {
    if (user) {
      const username = extractUsername(user.email);

      if (mobile) {
        return (
          <div className="flex flex-col w-full gap-2.5">
            <Link
              href="/history"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] p-3 text-xs font-bold text-slate-800 dark:text-zinc-200 hover:text-orange-500 transition"
            >
              <div className="flex items-center gap-2">
                <span>🎙️</span>
                <span>Generation History</span>
              </div>
              <span className="text-xs text-slate-400">&rarr;</span>
            </Link>

            <Link
              href="/account"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between rounded-xl border border-orange-500/20 bg-orange-500/10 p-3 text-xs font-bold text-slate-800 dark:text-zinc-200 hover:border-orange-500/40 transition"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6a1f] to-[#ff4400] text-white text-xs font-black uppercase shadow-xs">
                  {username.charAt(0) || "U"}
                </span>
                <div className="text-left">
                  <div className="font-bold text-slate-950 dark:text-white">@{username}</div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal truncate max-w-[180px]">
                    {user.email}
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-[#ff5500] dark:text-orange-400">
                Account &rarr;
              </span>
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={loggingOut}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer text-center"
            >
              {loggingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        );
      }

      const isAccountActive = pathname === "/account";
      const isHistoryActive = pathname === "/history";

      return (
        <div className="flex items-center gap-2">
          <Link
            href="/history"
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition shadow-xs ${
              isHistoryActive
                ? "border-orange-500/50 bg-orange-500/15 text-[#ff5500] dark:text-orange-400"
                : "border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.05] text-slate-800 dark:text-zinc-200 hover:border-orange-500/40 hover:text-[#ff5500] dark:hover:text-orange-400"
            }`}
            title="Generation History (Kept 7 days)"
          >
            <span>🎙️</span>
            <span>History</span>
          </Link>

          <Link
            href="/account"
            onClick={() => setMenuOpen(false)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition shadow-xs group ${
              isAccountActive
                ? "border-orange-500/50 bg-orange-500/15 text-[#ff5500] dark:text-orange-400"
                : "border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.05] text-slate-800 dark:text-zinc-200 hover:border-orange-500/40 hover:text-[#ff5500] dark:hover:text-orange-400 hover:bg-orange-50/50 dark:hover:bg-orange-950/20"
            }`}
            title={`Signed in as ${user.email} (View Account)`}
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6a1f] to-[#ff4400] text-white text-[10px] font-black uppercase shadow-xs">
              {username.charAt(0) || "U"}
            </span>
            <span className="max-w-[130px] truncate">@{username}</span>
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={loggingOut}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
          >
            {loggingOut ? "…" : "Sign out"}
          </button>
        </div>
      );
    }

    return (
      <div className={`flex items-center gap-3.5 ${mobile ? "w-full justify-between" : ""}`}>
        <Link
          href="/login"
          onClick={() => setMenuOpen(false)}
          className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition"
        >
          Log In
        </Link>
        <Link
          href="/signup"
          onClick={() => setMenuOpen(false)}
          className="btn-primary px-4 py-2 text-xs sm:text-sm shadow-md"
        >
          <span>Sign Up Free</span>
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-[#06060a]/80 backdrop-blur-xl transition-colors">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5 text-lg sm:text-xl font-bold tracking-tight text-slate-950 dark:text-white"
          aria-label={`${siteConfig.name} home`}
          onClick={() => setMenuOpen(false)}
        >
          <span
            aria-hidden="true"
            className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6a1f] to-[#ff4400] text-white shadow-lg shadow-orange-500/25 transition-transform duration-300 group-hover:scale-105"
          >
            <svg viewBox="0 0 24 24" fill="none" className="size-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          </span>

          <span className="tracking-tight text-slate-900 dark:text-white">
            {siteConfig.namePrefix}
            <span className="text-gradient font-black">{siteConfig.nameAccent}</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Main navigation" className="hidden items-center gap-1.5 rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] p-1.5 backdrop-blur-md lg:flex">
          {links.map(({ href, label }) => {
            const active = isActivePath(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200 ${
                  active
                    ? "bg-[#ff5500]/15 dark:bg-[#ff5500]/20 text-[#ff5500] dark:text-orange-400 shadow-sm"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right side controls (Desktop) */}
        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <ThemeToggle />
          <AuthButtons />
        </div>

        {/* Mobile controls (Theme Toggle + Hamburger) */}
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />

          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900 transition"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {menuOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="border-t border-black/[0.06] dark:border-white/[0.08] bg-white/95 dark:bg-[#06060a]/95 px-5 py-4 backdrop-blur-xl lg:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1.5">
            {links.map(({ href, label }) => {
              const active = isActivePath(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-orange-500/10 text-[#ff5500] dark:text-orange-400"
                      : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  {label}
                </Link>
              );
            })}

            <div className="mt-3 flex items-center justify-between border-t border-black/[0.06] dark:border-white/[0.08] pt-4">
              <AuthButtons mobile />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
