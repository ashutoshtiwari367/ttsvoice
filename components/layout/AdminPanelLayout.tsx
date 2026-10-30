"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { PAID_FEATURES_CONTROL } from "@/config/control";
import {
  clearAccountClientCaches,
  getCachedAllowance,
  getCachedAuthUser,
  getEmailAvatarLetter,
  setCachedAllowance,
  setCachedAuthUser,
} from "@/lib/userPreferences";
import {
  BookmarkMicIcon,
  ChevronRightIcon,
  CreditCardIcon,
  CrownIcon,
  HelpCircleIcon,
  HistoryIcon,
  LogOutIcon,
  MenuIcon,
  RefreshCwIcon,
  SettingsIcon,
  SparklesIcon,
  UserIcon,
  XIcon,
} from "@/components/ui/LucideIcons";

export type AdminTabKey =
  | "overview"
  | "profile"
  | "history"
  | "saved-voices"
  | "billing"
  | "settings"
  | "help";

interface AllowanceSnapshot {
  isAuthenticated?: boolean;
  totalAllowance: number;
  usedChars: number;
  remainingChars: number;
}

interface SubscriptionSnapshot {
  isAuthenticated: boolean;
  tier: string;
  balance: number;
  activePlan: string;
  activePlanName: string;
  displayName?: string;
  customerNo?: number | null;
}

interface AdminPanelLayoutProps {
  children: React.ReactNode;
  activeTab?: AdminTabKey;
}

const SIDE_NAV_ITEMS: {
  key: AdminTabKey;
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  paidOnly?: boolean;
}[] = [
  {
    key: "overview",
    href: "/account",
    label: "Account Overview",
    description: "Quotas, active plan & stats",
    icon: SparklesIcon,
  },
  {
    key: "profile",
    href: "/profile",
    label: "My Profile",
    description: "Personal details & password",
    icon: UserIcon,
  },
  {
    key: "history",
    href: "/history",
    label: "Audio History",
    description: "Generated voice files & logs",
    icon: HistoryIcon,
  },
  {
    key: "saved-voices",
    href: "/saved-voices",
    label: "Saved Voices",
    description: "Voice presets & favorites",
    icon: BookmarkMicIcon,
  },
  {
    key: "billing",
    href: "/billing",
    label: "Billing & Plans",
    description: "Invoices, orders & top-ups",
    icon: CreditCardIcon,
    paidOnly: true,
  },
  {
    key: "settings",
    href: "/settings",
    label: "Settings",
    description: "Preferences & studio defaults",
    icon: SettingsIcon,
  },
  {
    key: "help",
    href: "/help",
    label: "Help & Support",
    description: "Guides, FAQs & feedback",
    icon: HelpCircleIcon,
  },
];

export default function AdminPanelLayout({
  children,
  activeTab: propActiveTab,
}: AdminPanelLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(() => getCachedAuthUser());
  const [sub, setSub] = useState<SubscriptionSnapshot | null>(null);
  const [allowance, setAllowance] = useState<AllowanceSnapshot | null>(() =>
    getCachedAllowance<AllowanceSnapshot>()
  );
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [refreshingQuota, setRefreshingQuota] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Determine current active section
  const currentKey: AdminTabKey =
    propActiveTab ||
    (pathname === "/profile"
      ? "profile"
      : pathname === "/history"
      ? "history"
      : pathname === "/saved-voices"
      ? "saved-voices"
      : pathname === "/billing"
      ? "billing"
      : pathname === "/settings"
      ? "settings"
      : pathname === "/help"
      ? "help"
      : "overview");

  const paidEnabled = PAID_FEATURES_CONTROL.enabled;

  const syncAllowance = useCallback(async (force = false) => {
    if (!force) {
      const cached = getCachedAllowance<AllowanceSnapshot>();
      if (cached) {
        setAllowance(cached);
        return;
      }
    }

    try {
      setRefreshingQuota(true);
      const res = await fetch("/api/user/credits", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setAllowance(json);
        setCachedAllowance(json);
      }
    } catch {
      // ignore
    } finally {
      setRefreshingQuota(false);
    }
  }, []);

  const syncSubscription = useCallback(async () => {
    try {
      const res = await fetch("/api/user/subscription", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json?.isAuthenticated) {
          setSub({
            isAuthenticated: true,
            tier: json.tier || "free",
            balance: Number(json.balance ?? 0),
            activePlan: json.activePlan || "Free Tier",
            activePlanName: json.activePlanName || "Free",
            displayName: json.displayName,
            customerNo: json.customerNo,
          });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const fetchSession = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);
      setCachedAuthUser(currentUser);
      if (currentUser) {
        syncAllowance(false);
        syncSubscription();
      }
    };

    fetchSession();

    const { data: authSub } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const nextUser = session?.user ?? null;
        setUser(nextUser);
        setCachedAuthUser(nextUser);
        if (nextUser) {
          syncAllowance(true);
          syncSubscription();
        }
      }
    );

    const handleSyncEvent = () => {
      syncAllowance(true);
      syncSubscription();
    };

    window.addEventListener("credits-updated", handleSyncEvent);
    window.addEventListener("auth-changed", handleSyncEvent);
    window.addEventListener("focus", handleSyncEvent);

    return () => {
      authSub.subscription.unsubscribe();
      window.removeEventListener("credits-updated", handleSyncEvent);
      window.removeEventListener("auth-changed", handleSyncEvent);
      window.removeEventListener("focus", handleSyncEvent);
    };
  }, [syncAllowance, syncSubscription]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
    } finally {
      clearAccountClientCaches();
      setSigningOut(false);
      window.location.href = "/";
    }
  };

  const avatarLetter = getEmailAvatarLetter(user?.email || null);
  const displayName =
    sub?.displayName ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.display_name ||
    (user?.email ? user.email.split("@")[0] : "Account");

  const isPro =
    paidEnabled && (sub?.tier === "paid" || (sub?.balance ?? 0) > 0);

  const totalChars = allowance?.totalAllowance ?? 1000;
  const remainingChars = allowance?.remainingChars ?? (sub?.balance ?? 0);
  const usedChars =
    allowance?.usedChars ?? Math.max(0, totalChars - remainingChars);
  const usagePercent = Math.min(
    100,
    Math.max(0, Math.round((usedChars / (totalChars || 1)) * 100))
  );

  const visibleNavItems = SIDE_NAV_ITEMS.filter(
    (item) =>
      !item.paidOnly ||
      (paidEnabled && PAID_FEATURES_CONTROL.showBillingInMenu)
  );

  const activeItem =
    visibleNavItems.find((item) => item.key === currentKey) ||
    visibleNavItems[0];

  // Common Sidebar Navigation Content
  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col justify-between h-full space-y-6">
      <div className="space-y-5">
        {/* Top Header */}
        <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Admin Panel
              </span>
            </div>

            {isMobile && (
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                aria-label="Close menu"
              >
                <XIcon size={18} />
              </button>
            )}
          </div>

          {/* User Card */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6a1f] to-[#ff4400] text-sm font-black uppercase text-white shadow-sm ring-2 ring-orange-500/20">
              {avatarLetter}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-xs font-bold text-zinc-900 dark:text-white">
                  {displayName}
                </p>
                {isPro ? (
                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    <CrownIcon size={9} />
                    <span>Pro</span>
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                    Free
                  </span>
                )}
              </div>
              <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                {user?.email || "Guest User"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1" aria-label="Admin Navigation Links">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentKey === item.key;

            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setMobileDrawerOpen(false)}
                className={`group flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-orange-500/10 dark:bg-orange-500/15 text-[#ff5500] dark:text-orange-400 border border-orange-500/25 shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-xl transition-all ${
                      isActive
                        ? "bg-gradient-to-br from-[#ff6a1f] to-[#ff4400] text-white shadow-xs"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white"
                    }`}
                  >
                    <Icon size={15} />
                  </span>
                  <div className="min-w-0 text-left">
                    <span className="block truncate leading-snug">
                      {item.label}
                    </span>
                    <span className="block truncate text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                      {item.description}
                    </span>
                  </div>
                </div>

                {isActive && (
                  <span className="text-orange-500 shrink-0">
                    <ChevronRightIcon size={14} />
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Live Quota Meter */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-zinc-700 dark:text-zinc-300">
              Voice Quota
            </span>
            <button
              type="button"
              onClick={() => syncAllowance(true)}
              disabled={refreshingQuota}
              title="Refresh Balance"
              className="p-1 text-zinc-400 hover:text-orange-500 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCwIcon
                size={12}
                className={refreshingQuota ? "animate-spin text-orange-500" : ""}
              />
            </button>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black tracking-tight text-zinc-950 dark:text-white">
              {remainingChars.toLocaleString()}
            </span>
            <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
              / {totalChars.toLocaleString()} chars
            </span>
          </div>

          <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-[#ff5500] transition-all duration-300"
              style={{
                width: `${Math.max(4, 100 - usagePercent)}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
            <span>{100 - usagePercent}% available</span>
            {isPro ? (
              <span className="font-bold text-amber-600 dark:text-amber-400">
                Pro Uncapped
              </span>
            ) : (
              <Link
                href="/pricing"
                className="font-bold text-orange-500 hover:underline"
              >
                Upgrade &rarr;
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
        <Link
          href="/text-to-speech"
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6a1f] to-[#ff4400] text-white py-2.5 px-3 text-xs font-bold shadow-md shadow-orange-500/20 hover:opacity-95 transition"
        >
          <span>🎙️</span>
          <span>Open Voice Studio</span>
          <span>&rarr;</span>
        </Link>

        {user && (
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent py-2 px-3 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer disabled:opacity-50"
          >
            <LogOutIcon size={13} />
            <span>{signingOut ? "Signing out..." : "Sign Out"}</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full bg-[var(--bg)] text-[var(--text)] transition-colors min-h-[calc(100vh-4rem)]">
      {/* ── MOBILE HEADER (Visible on small screens) ── */}
      <div className="lg:hidden sticky top-16 z-30 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#12141a]/95 backdrop-blur-md px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff6a1f] to-[#ff4400] text-xs font-black uppercase text-white shadow-xs">
            {avatarLetter}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-orange-600 dark:text-orange-400 block leading-tight">
              Admin Panel
            </span>
            <p className="truncate text-xs font-bold text-zinc-900 dark:text-white">
              {activeItem.label}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileDrawerOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition hover:border-orange-500/40"
          aria-label="Toggle side panel navigation"
        >
          {mobileDrawerOpen ? <XIcon size={16} /> : <MenuIcon size={16} />}
          <span>{mobileDrawerOpen ? "Close" : "Menu"}</span>
        </button>
      </div>

      {/* ── MOBILE SLIDE-OVER DRAWER ── */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Sheet */}
          <aside
            aria-label="Mobile Admin Navigation"
            className="fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-white dark:bg-[#14161e] p-5 shadow-2xl flex flex-col justify-between overflow-y-auto"
          >
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}

      {/* ── EXPANSIVE CONTAINER (Aligned with Header & Footer) ── */}
      <div className="w-full max-w-7xl 2xl:max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* ── DESKTOP CLAUDE-STYLE SIDE PANEL ── */}
          <aside
            aria-label="Admin Navigation Sidebar"
            className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18191e] p-5 shadow-xs sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto"
          >
            {renderSidebarContent(false)}
          </aside>

          {/* ── RIGHT MAIN CONTENT AREA ── */}
          <main className="flex-1 min-w-0 w-full">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
