"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { siteConfig } from "@/config/site";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import ThemeToggle from "@/components/theme/ThemeToggle";
import ProfileDropdown from "@/components/layout/ProfileDropdown";
import {
  clearAccountClientCaches,
  getCachedAuthUser,
  setCachedAuthUser,
} from "@/lib/userPreferences";

const links = siteConfig.navLinks;

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    // 1. Instant 0ms synchronous cache read on hydration (prevents 2s guest-button flash)
    const cached = getCachedAuthUser();
    if (cached) {
      setUser(cached);
      setAuthReady(true);
    }

    const supabase = createClient();

    const syncSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const sessionUser = data.session?.user ?? null;
        setUser(sessionUser);
        setCachedAuthUser(sessionUser);
      } finally {
        setAuthReady(true);
      }
    };

    syncSession();

    // Subscribe once to client-side auth & profile metadata changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "INITIAL_SESSION") return;
        const nextUser = session?.user ?? null;
        setUser(nextUser);
        setCachedAuthUser(nextUser);
        setAuthReady(true);
      }
    );

    const handleAuthChanged = () => {
      const latestCached = getCachedAuthUser();
      if (!latestCached) {
        setUser(null);
      }
      syncSession();
    };

    window.addEventListener("auth-changed", handleAuthChanged);

    return () => {
      listener.subscription.unsubscribe();
      window.removeEventListener("auth-changed", handleAuthChanged);
    };
  }, []);

  const handleSignOut = async () => {
    setLoggingOut(true);
    setMenuOpen(false);
    // Clear account-specific UI state immediately before network roundtrip
    setUser(null);
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
    } finally {
      clearAccountClientCaches();
      setLoggingOut(false);
      // Redirect to the main public TTS page
      window.location.href = "/";
    }
  };

  const GuestAuthButtons = ({ mobile = false }: { mobile?: boolean }) => {
    const isHistoryActive = pathname === "/history";

    return (
      <div
        className={`flex items-center gap-2 sm:gap-2.5 ${
          mobile ? "w-full flex-wrap justify-between" : ""
        }`}
      >
        <Link
          href="/history"
          onClick={() => setMenuOpen(false)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition shadow-xs ${
            isHistoryActive
              ? "border-orange-500/50 bg-orange-500/15 text-[#ff5500] dark:text-orange-400"
              : "border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] text-slate-800 dark:text-zinc-200 hover:border-orange-500/40 hover:text-[#ff5500] dark:hover:text-orange-400"
          }`}
          title="Generation History"
        >
          <svg
            className="size-3.5 text-slate-500 dark:text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>History</span>
        </Link>
        <Link
          href="/login"
          onClick={() => setMenuOpen(false)}
          className="rounded-full border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] px-3.5 py-1.5 text-xs font-bold text-slate-800 dark:text-zinc-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition"
        >
          Log In
        </Link>
        <Link
          href="/signup"
          onClick={() => setMenuOpen(false)}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 via-[#ff5500] to-orange-600 px-4 py-1.5 text-xs font-extrabold text-white shadow-md shadow-orange-500/25 hover:scale-105 active:scale-95 transition"
        >
          <span>Sign Up Free</span>
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    );
  };

  if (pathname?.startsWith("/studio")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.06] dark:border-white/[0.08] bg-white/95 dark:bg-[#06060a]/95 backdrop-blur-xl transition-colors">
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
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="size-5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          </span>

          <span className="tracking-tight text-slate-900 dark:text-white">
            {siteConfig.namePrefix}
            <span className="text-gradient font-black">
              {siteConfig.nameAccent}
            </span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-1.5 rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] p-1.5 backdrop-blur-md lg:flex"
        >
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

        {/* Unified Right Side Controls (Single ProfileDropdown mount across Desktop & Mobile) */}
        <div className="flex shrink-0 items-center gap-2.5 lg:gap-3">
          <ThemeToggle />

          {user ? (
            <ProfileDropdown
              user={user}
              onSignOut={handleSignOut}
              signingOut={loggingOut}
            />
          ) : authReady ? (
            <div className="hidden lg:flex">
              <GuestAuthButtons />
            </div>
          ) : (
            <div className="hidden lg:block h-8 w-24 rounded-full bg-slate-200/50 dark:bg-zinc-800/50 animate-pulse" />
          )}

          <button
            type="button"
            className="inline-flex size-9.5 items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900 transition cursor-pointer lg:hidden"
            aria-label={
              menuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <svg
                className="size-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="size-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
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

            {!user && (
              <div className="mt-3 flex items-center justify-between border-t border-black/[0.06] dark:border-white/[0.08] pt-4">
                <GuestAuthButtons mobile />
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
