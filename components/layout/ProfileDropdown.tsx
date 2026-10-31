"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { extractUsername, formatDisplayName } from "@/lib/user";
import { PAID_FEATURES_CONTROL } from "@/config/control";
import {
  getCachedAllowance,
  getEmailAvatarLetter,
  setCachedAllowance,
} from "@/lib/userPreferences";
import {
  BookmarkMicIcon,
  ChevronRightIcon,
  CreditCardIcon,
  CrownIcon,
  HelpCircleIcon,
  HistoryIcon,
  LogOutIcon,
  SettingsIcon,
  SparklesIcon,
  UserIcon,
} from "@/components/ui/LucideIcons";

interface ProfileDropdownProps {
  user: User;
  onSignOut: () => Promise<void> | void;
  signingOut?: boolean;
}

interface SubscriptionSnapshot {
  isAuthenticated: boolean;
  tier: string;
  balance: number;
  activePlan: string;
  activePlanName: string;
  displayName?: string;
}

interface AllowanceSnapshot {
  isAuthenticated?: boolean;
  totalAllowance: number;
  usedChars: number;
  remainingChars: number;
}

interface MenuOption {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  paidOnly?: boolean;
}

const MENU_OPTIONS: MenuOption[] = [
  { href: "/account", label: "Account Overview", icon: SparklesIcon },
  { href: "/profile", label: "My Profile", icon: UserIcon },
  { href: "/history", label: "History", icon: HistoryIcon },
  { href: "/saved-voices", label: "Saved Voices", icon: BookmarkMicIcon },
  {
    href: "/billing",
    label: "Billing & Subscription",
    icon: CreditCardIcon,
    paidOnly: true,
  },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
  { href: "/help", label: "Help & Support", icon: HelpCircleIcon },
];

export default function ProfileDropdown({
  user,
  onSignOut,
  signingOut = false,
}: ProfileDropdownProps) {
  const pathname = usePathname();
  const paidEnabled = PAID_FEATURES_CONTROL.enabled;
  const [open, setOpen] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionSnapshot | null>(null);
  const [allowance, setAllowance] = useState<AllowanceSnapshot | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(paidEnabled);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const hoverCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const avatarLetter = getEmailAvatarLetter(user.email);

  const visibleMenuOptions = MENU_OPTIONS.filter(
    (opt) => !opt.paidOnly || (paidEnabled && PAID_FEATURES_CONTROL.showBillingInMenu)
  );

  // Determine real backend subscription status (Pro vs Free) when paid features are active
  const isPro =
    paidEnabled &&
    (subscription?.tier === "paid" || (subscription?.balance ?? 0) > 0);

  const syncCharacterBalance = useCallback(async (forceFetch = false) => {
    const cached = getCachedAllowance<AllowanceSnapshot>();
    if (cached && cached.isAuthenticated !== false) {
      setAllowance(cached);
      if (!forceFetch) return;
    }

    try {
      const res = await fetch("/api/user/credits", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setAllowance(json);
        setCachedAllowance(json);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    syncCharacterBalance(false);

    const handleCreditsSync = () => {
      const latestCached = getCachedAllowance<AllowanceSnapshot>();
      if (latestCached) {
        setAllowance(latestCached);
      }
      syncCharacterBalance(true);
    };

    window.addEventListener("credits-updated", handleCreditsSync);
    window.addEventListener("auth-changed", handleCreditsSync);

    return () => {
      window.removeEventListener("credits-updated", handleCreditsSync);
      window.removeEventListener("auth-changed", handleCreditsSync);
    };
  }, [syncCharacterBalance]);

  const fetchSubscriptionStatus = useCallback(async () => {
    // Skip network roundtrip completely while paid features are hidden
    if (!paidEnabled || !user?.id) {
      setSubscription(null);
      setLoadingPlan(false);
      return;
    }

    try {
      const res = await fetch("/api/user/subscription", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json?.isAuthenticated) {
          setSubscription({
            isAuthenticated: true,
            tier: json.tier || "free",
            balance: Number(json.balance ?? 0),
            activePlan: json.activePlan || "Free Tier",
            activePlanName: json.activePlanName || "Free",
            displayName: json.displayName,
          });
        } else {
          setSubscription(null);
        }
      }
    } catch {
      // Keep fallback gracefully
    } finally {
      setLoadingPlan(false);
    }
  }, [paidEnabled, user?.id]);

  // Fetch & keep subscription status reactive only when paid features are enabled
  useEffect(() => {
    if (!paidEnabled) {
      setLoadingPlan(false);
      return;
    }

    setLoadingPlan(true);
    fetchSubscriptionStatus();

    const handleSync = () => {
      fetchSubscriptionStatus();
    };

    window.addEventListener("auth-changed", handleSync);
    window.addEventListener("credits-updated", handleSync);
    window.addEventListener("focus", handleSync);

    return () => {
      window.removeEventListener("auth-changed", handleSync);
      window.removeEventListener("credits-updated", handleSync);
      window.removeEventListener("focus", handleSync);
    };
  }, [paidEnabled, fetchSubscriptionStatus]);

  // Close dropdown automatically when route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Clear hover timer on unmount
  useEffect(() => {
    return () => {
      if (hoverCloseTimerRef.current) {
        clearTimeout(hoverCloseTimerRef.current);
      }
    };
  }, []);

  // Close on click/tap outside & Escape key
  useEffect(() => {
    if (!open) return;

    const handlePointerOutside = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerOutside);
    document.addEventListener("touchstart", handlePointerOutside, { passive: true });
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerOutside);
      document.removeEventListener("touchstart", handlePointerOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const isDesktopHoverCapable = () => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  };

  const handleMouseEnter = () => {
    if (!isDesktopHoverCapable()) return;
    if (hoverCloseTimerRef.current) {
      clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
    setOpen(true);
  };

  const handleMouseLeave = () => {
    if (!isDesktopHoverCapable()) return;
    hoverCloseTimerRef.current = setTimeout(() => {
      setOpen(false);
    }, 170);
  };

  const handleTriggerClick = () => {
    if (hoverCloseTimerRef.current) {
      clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
    setOpen((prev) => !prev);
  };

  // Accessible keyboard navigation across dropdown items
  const handleContainerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        if (document.activeElement === triggerRef.current && e.key === "ArrowDown") {
          e.preventDefault();
          setOpen(true);
          requestAnimationFrame(() => {
            const items = containerRef.current?.querySelectorAll<HTMLElement>(
              '[data-dropdown-item="true"]'
            );
            items?.[0]?.focus();
          });
        }
      }
      return;
    }

    const items = Array.from(
      containerRef.current?.querySelectorAll<HTMLElement>(
        '[data-dropdown-item="true"]'
      ) ?? []
    );
    if (items.length === 0) return;

    const currentIndex = items.indexOf(document.activeElement as HTMLElement);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      items[nextIndex]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      items[prevIndex]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1]?.focus();
    }
  };

  const handleSignOutClick = async () => {
    setOpen(false);
    setSubscription(null);
    await onSignOut();
  };

  const rawCustomName = (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.display_name ||
    (user.email ? extractUsername(user.email) : "")
  ).trim();
  const customName = rawCustomName ? formatDisplayName(rawCustomName) : "";

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleContainerKeyDown}
      className="relative inline-flex items-center"
    >
      {/* Circular Profile Avatar Button (First Letter of Email Only) */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleTriggerClick}
        aria-label="Open account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="profile-dropdown-menu"
        className={`relative flex size-9 sm:size-9.5 shrink-0 items-center justify-center rounded-full border text-sm font-extrabold uppercase tracking-tight transition-all duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5500] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#06060a] ${
          open
            ? "border-[#ff5500] bg-gradient-to-br from-[#ff6a1f] to-[#ff4400] text-white shadow-md shadow-orange-500/30 scale-[1.03]"
            : "border-orange-500/25 dark:border-orange-400/25 bg-gradient-to-br from-orange-500/12 via-amber-500/10 to-orange-600/15 dark:from-orange-500/20 dark:via-amber-500/15 dark:to-orange-600/20 text-[#ff5500] dark:text-orange-300 hover:border-[#ff5500]/60 hover:from-[#ff6a1f] hover:to-[#ff4400] hover:text-white hover:shadow-md hover:shadow-orange-500/25"
        }`}
      >
        <span>{avatarLetter}</span>

        {/* Pro Indicator Badge on Avatar */}
        {isPro && (
          <span
            aria-hidden="true"
            className="absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white ring-2 ring-white dark:ring-[#06060a] shadow-2xs"
          >
            <CrownIcon size={8} />
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <div
        id="profile-dropdown-menu"
        role="menu"
        aria-label="Account navigation"
        aria-hidden={!open}
        className={`absolute right-0 top-full z-50 mt-2.5 w-[304px] max-w-[calc(100vw-1.5rem)] origin-top-right rounded-2xl border border-slate-200/90 dark:border-white/[0.09] bg-white/98 dark:bg-[#0e1017]/98 backdrop-blur-2xl shadow-[0_18px_50px_-12px_rgba(15,23,42,0.22)] dark:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.85)] transition-all duration-200 ease-out ${
          open
            ? "visible opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "invisible opacity-0 scale-95 -translate-y-1.5 pointer-events-none"
        }`}
      >
        {/* ── 1. TOP SECTION: Avatar + My Account + Live Account Balance ── */}
        <div className="px-4 py-3.5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6a1f] to-[#ff4400] text-sm font-black uppercase text-white shadow-md shadow-orange-500/25 ring-2 ring-orange-500/15">
              {avatarLetter}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="truncate text-sm font-bold text-slate-900 dark:text-white hover:text-[#ff5500] dark:hover:text-orange-400 transition"
                >
                  My Account
                </Link>

                {isPro && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/35 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    <CrownIcon size={11} />
                    <span>Pro</span>
                  </span>
                )}
              </div>

              {customName && (
                <p className="truncate text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                  {customName}
                </p>
              )}

              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                <span>Current Plan:</span>
                <span
                  className={`font-bold ${
                    isPro
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-700 dark:text-zinc-200"
                  }`}
                >
                  {!paidEnabled ? "Free" : loadingPlan ? "..." : isPro ? "Pro" : "Free"}
                </span>
              </div>
            </div>
          </div>

          {/* Account Character Balance Meter (Shown on Profile Hover / Click) */}
          {(() => {
            const totalChars = allowance?.totalAllowance ?? 1000;
            const remainingChars = allowance?.remainingChars ?? totalChars;
            const usedChars = allowance?.usedChars ?? Math.max(0, totalChars - remainingChars);
            const remainingPct = Math.max(
              0,
              Math.min(100, (remainingChars / Math.max(1, totalChars)) * 100)
            );

            return (
              <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/90 dark:bg-white/[0.04] px-3 py-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-600 dark:text-zinc-300">
                    Account Balance
                  </span>
                  <span className="font-extrabold text-[#ff5500] dark:text-orange-400">
                    {remainingChars.toLocaleString()} / {totalChars.toLocaleString()} chars
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      remainingChars === 0
                        ? "bg-red-500"
                        : remainingPct < 20
                        ? "bg-amber-500"
                        : "bg-gradient-to-r from-[#ff6a1f] to-[#ff4400]"
                    }`}
                    style={{ width: `${remainingPct}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                  <span>Used: {usedChars.toLocaleString()} chars</span>
                  <span>Remaining: {remainingChars.toLocaleString()}</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Thin Divider */}
        <div className="h-px bg-slate-100 dark:bg-white/[0.07]" />

        {/* ── 2. MAIN MENU OPTIONS ── */}
        <div className="p-1.5 space-y-0.5">
          {visibleMenuOptions.map((item) => {
            const IconComponent = item.icon;
            const active =
              pathname === item.href || pathname?.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                tabIndex={open ? 0 : -1}
                data-dropdown-item="true"
                onClick={() => setOpen(false)}
                className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5500]/60 ${
                  active
                    ? "bg-orange-500/10 dark:bg-orange-500/15 text-[#ff5500] dark:text-orange-400"
                    : "text-slate-700 dark:text-zinc-200 hover:bg-slate-100/90 dark:hover:bg-white/[0.06] hover:text-slate-950 dark:hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <IconComponent
                    size={17}
                    className={`shrink-0 transition-colors ${
                      active
                        ? "text-[#ff5500] dark:text-orange-400"
                        : "text-slate-400 dark:text-zinc-400 group-hover:text-[#ff5500] dark:group-hover:text-orange-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </span>

                <ChevronRightIcon
                  size={14}
                  className={`shrink-0 transition-all duration-150 ${
                    active
                      ? "text-[#ff5500] dark:text-orange-400 translate-x-0.5"
                      : "text-slate-300 dark:text-zinc-600 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
                  }`}
                />
              </Link>
            );
          })}
        </div>

        {/* Thin Divider */}
        <div className="h-px bg-slate-100 dark:bg-white/[0.07]" />

        {/* ── 3. ACCOUNT ACTIONS: Sign Out ── */}
        <div className="p-1.5">
          <button
            type="button"
            role="menuitem"
            tabIndex={open ? 0 : -1}
            data-dropdown-item="true"
            disabled={signingOut}
            onClick={handleSignOutClick}
            className="group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/[0.08] dark:hover:bg-rose-500/15 transition-all duration-150 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60"
          >
            <LogOutIcon
              size={17}
              className="shrink-0 text-rose-500 dark:text-rose-400 transition-transform duration-150 group-hover:-translate-x-0.5"
            />
            <span>{signingOut ? "Signing Out..." : "Sign Out"}</span>
          </button>
        </div>

        {/* ── 4. BOTTOM PREMIUM SECTION: Upgrade to Pro (Shown only when paid features are enabled & user is Free) ── */}
        {paidEnabled &&
          PAID_FEATURES_CONTROL.showUpgradeCard &&
          !loadingPlan &&
          !isPro && (
          <>
            <div className="h-px bg-slate-100 dark:bg-white/[0.07]" />

            <div className="p-2.5">
              <div className="relative overflow-hidden rounded-xl border border-orange-500/25 dark:border-orange-500/30 bg-gradient-to-br from-orange-500/[0.11] via-amber-500/[0.08] to-rose-500/[0.10] dark:from-[#ff5500]/20 dark:via-amber-500/12 dark:to-rose-500/15 p-3.5">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full bg-orange-500/20 blur-xl"
                />

                <div className="relative flex items-start gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff6a1f] to-amber-500 text-white shadow-sm shadow-orange-500/30">
                    <CrownIcon size={16} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 text-xs font-extrabold text-slate-900 dark:text-white">
                      <span>Unlock Pro Features</span>
                      <SparklesIcon
                        size={12}
                        className="text-[#ff5500] dark:text-amber-400"
                      />
                    </div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600 dark:text-zinc-300">
                      Unlock Premium Voices &amp; Advanced Studio Features.
                    </p>
                  </div>
                </div>

                <Link
                  href="/billing#upgrade"
                  role="menuitem"
                  tabIndex={open ? 0 : -1}
                  data-dropdown-item="true"
                  onClick={() => setOpen(false)}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#ff6a1f] via-[#ff5500] to-orange-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-md shadow-orange-500/25 hover:brightness-110 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5500]"
                >
                  <CrownIcon size={14} />
                  <span>Upgrade to Pro</span>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
