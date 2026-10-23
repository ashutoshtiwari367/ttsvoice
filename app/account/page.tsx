"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface PurchaseItem {
  id: number;
  packId: string;
  packName: string;
  amount: string;
  currency: string;
  charAmount: number;
  status: string;
  date: string;
  expiryDate: string | null;
  validityLabel: string;
  isExpired: boolean;
}

interface AccountData {
  isAuthenticated: boolean;
  userId: string | null;
  customerNo?: number | null;
  email: string | null;
  username: string;
  displayName: string;
  accountCreatedAt?: string;
  lastSignInAt?: string;
  activePlan: string;
  activePlanName: string;
  purchaseDate: string | null;
  expiryDate: string | null;
  validityStatus: string;
  tier: string;
  balance: number;
  reqCap: number;
  totalPurchasedChars: number;
  purchases: PurchaseItem[];
}

export default function AccountPage() {
  const router = useRouter();
  const [data, setData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const fetchAccount = async () => {
    try {
      const res = await fetch("/api/user/subscription");
      if (res.ok) {
        const json = await res.json();
        if (!json.isAuthenticated) {
          router.push("/login?next=/account");
          return;
        }
        setData(json);
      } else {
        router.push("/login?next=/account");
      }
    } catch (err) {
      console.error("fetch_account_error", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAccount();

    const handleFocus = () => fetchAccount();
    window.addEventListener("focus", handleFocus);
    window.addEventListener("credits-updated", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("credits-updated", handleFocus);
    };
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchAccount();
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-full border-3 border-orange-500/20 border-t-[#ff5500] animate-spin" />
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
            Loading your account details...
          </p>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const isPaid = data.tier === "paid" || data.balance > 0;
  const initial = (data.username || "U").charAt(0).toUpperCase();

  return (
    <main className="relative min-h-screen text-slate-900 dark:text-zinc-100 transition-colors pb-24 overflow-hidden">
      {/* Decorative background glows */}
      <div className="pointer-events-none absolute -top-40 right-1/4 size-96 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-20 size-80 rounded-full bg-amber-500/5 blur-3xl" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-8">
        {/* Top Breadcrumb & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 dark:text-zinc-400">
            <Link
              href="/"
              className="hover:text-[#ff5500] dark:hover:text-orange-400 transition"
            >
              Home
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-bold">
              Account Information
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-zinc-900/80 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:border-orange-500/40 hover:text-[#ff5500] dark:hover:text-orange-400 transition shadow-xs cursor-pointer disabled:opacity-50"
              title="Refresh Balance"
            >
              <span className={refreshing ? "animate-spin" : ""}>🔄</span>
              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>

            <Link
              href="/pricing"
              className="btn-primary py-1.5 px-3.5 text-xs font-bold shadow-md inline-flex items-center gap-1.5"
            >
              <span>⚡</span>
              <span>Recharge Credits</span>
            </Link>
          </div>
        </div>

        {/* 1. USER PROFILE IDENTITY HERO */}
        <section className="mt-8 rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] p-6 sm:p-8 backdrop-blur-xl shadow-xl shadow-black/[0.02] relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Big Avatar */}
              <div className="relative shrink-0">
                <div className="size-16 sm:size-20 rounded-2xl bg-gradient-to-br from-[#ff6a1f] to-[#ff4400] text-white flex items-center justify-center text-2xl sm:text-3xl font-black uppercase shadow-lg shadow-orange-500/25 border-2 border-white dark:border-zinc-800">
                  {initial}
                </div>
                <span
                  className="absolute -bottom-1 -right-1 size-5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900"
                  title="Account Status: Active"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                    {data.displayName || data.username}
                  </h1>

                  <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-0.5 text-xs font-bold text-[#ff5500] dark:text-orange-400">
                    @{data.username}
                  </span>

                  {data.customerNo && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/25 bg-blue-500/10 px-2.5 py-0.5 text-xs font-mono font-bold text-blue-600 dark:text-blue-400" title="Universal Customer Number">
                      <span>#</span>{data.customerNo}
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-500 dark:text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active Member
                  </span>
                </div>

                <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-zinc-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <span>✉️</span>
                    <span>{data.email}</span>
                  </span>

                  {data.accountCreatedAt && (
                    <span className="inline-flex items-center gap-1.5 text-slate-400 dark:text-zinc-500 text-xs">
                      <span>📅 Joined</span>
                      <span>
                        {new Date(data.accountCreatedAt).toLocaleDateString("en-IN", {
                          month: "short",
                          year: "numeric",
                          day: "numeric",
                        })}
                      </span>
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <Link
                href="/text-to-speech"
                className="btn-ghost py-2.5 px-4 text-xs font-bold border border-black/[0.08] dark:border-white/[0.08]"
              >
                <span>Studio</span>
                <span>&rarr;</span>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="rounded-xl border border-red-500/20 bg-red-500/5 px-3.5 py-2.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/15 transition cursor-pointer disabled:opacity-50"
              >
                {signingOut ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          </div>
        </section>

        {/* 2. CREDITS & BALANCE SHOWCASE (PRIMARY FOCUS) */}
        <section className="mt-8 grid gap-6 md:grid-cols-3">
          {/* Main Available Credits Box (Spans 2 cols) */}
          <div className="md:col-span-2 rounded-3xl border-2 border-orange-500/30 bg-gradient-to-br from-white via-orange-500/[0.03] to-white dark:from-[#0d0d14] dark:via-orange-950/20 dark:to-[#0a0a10] p-6 sm:p-8 backdrop-blur-xl shadow-xl shadow-orange-500/5 relative overflow-hidden">
            <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-orange-500/15 blur-2xl" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 px-3 py-1 text-xs font-bold text-[#ff5500] dark:text-orange-400">
                  <span>🪙</span>
                  <span>Live Character Balance</span>
                </span>
                <h2 className="mt-3 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Total Credits Available
                </h2>
              </div>

              <div className="inline-flex items-center gap-2">
                <span className="rounded-xl bg-black/[0.04] dark:bg-white/[0.05] px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-zinc-300 border border-black/[0.06] dark:border-white/[0.08]">
                  Tier: <strong className="text-orange-500 uppercase">{data.tier}</strong>
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-5xl sm:text-6xl font-black tracking-tight text-slate-950 dark:text-white">
                {data.balance.toLocaleString()}
              </span>
              <span className="text-base sm:text-lg font-bold text-orange-500 uppercase tracking-wide">
                Credits (Chars)
              </span>
            </div>

            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
              Each character of text converted to natural Indian speech deducts 1 character credit.
            </p>

            <div className="mt-6 pt-6 border-t border-black/[0.06] dark:border-white/[0.08] grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Per-Request Cap
                </span>
                <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {data.reqCap.toLocaleString()} <span className="text-xs font-normal text-slate-400">chars</span>
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Lifetime Added
                </span>
                <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {data.totalPurchasedChars.toLocaleString()} <span className="text-xs font-normal text-slate-400">chars</span>
                </p>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Speech Audio
                </span>
                <p className="text-base sm:text-lg font-extrabold text-emerald-500 dark:text-emerald-400 mt-0.5">
                  Studio HD MP3
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/pricing"
                className="btn-primary py-2.5 px-5 text-xs sm:text-sm font-bold shadow-lg shadow-orange-500/25"
              >
                <span>Top Up / Buy More Credits &rarr;</span>
              </Link>
              <Link
                href="/text-to-speech"
                className="btn-ghost py-2.5 px-5 text-xs sm:text-sm font-bold border border-black/[0.08] dark:border-white/[0.08]"
              >
                <span>Open Voice Studio</span>
              </Link>
            </div>
          </div>

          {/* Quick Stats / Info Side Card */}
          <div className="rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.025] p-6 sm:p-7 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🛡️</span>
                  <span>Account Info</span>
                </h3>
                <span className="text-[10px] font-bold rounded-md bg-emerald-500/10 text-emerald-500 px-2 py-0.5 border border-emerald-500/20">
                  Verified
                </span>
              </div>

              <div className="mt-4 space-y-3.5 text-xs">
                <div>
                  <span className="text-slate-400 dark:text-zinc-500 font-medium block">
                    Username
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {data.username}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 dark:text-zinc-500 font-medium block">
                    Registered Email
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white truncate block">
                    {data.email}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 dark:text-zinc-500 font-medium block">
                    User ID
                  </span>
                  <span className="font-mono text-[11px] text-slate-600 dark:text-zinc-400 truncate block">
                    {data.userId || "—"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 dark:text-zinc-500 font-medium block">
                    Supported Languages
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    Hindi, English, Tamil, Telugu + 12 more
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-black/[0.06] dark:border-white/[0.08]">
              <Link
                href="/pricing"
                className="w-full text-center block text-xs font-bold text-[#ff5500] dark:text-orange-400 hover:underline"
              >
                Compare All Plans &amp; Packs &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* 3. CURRENT ACTIVE PLAN, PURCHASE DATE & EXPIRY DETAILS */}
        <section className="mt-8 rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.025] p-6 sm:p-8 backdrop-blur-xl shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Subscription / Plan Overview
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white mt-1">
                Current Active Plan: <span className="text-gradient">{data.activePlanName}</span>
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold border ${
                  isPaid
                    ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/25"
                    : "bg-slate-500/10 text-slate-600 dark:text-zinc-400 border-slate-500/20"
                }`}
              >
                <span
                  className={`size-2 rounded-full ${
                    isPaid ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                  }`}
                />
                <span>{data.validityStatus}</span>
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Purchase Date */}
            <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.015] dark:bg-white/[0.015] p-4">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                <span>🗓️</span>
                <span>Purchase Date</span>
              </span>
              <p className="mt-2 text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                {data.purchaseDate
                  ? new Date(data.purchaseDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "N/A (Free Tier)"}
              </p>
              <span className="mt-1 block text-[11px] text-slate-400 dark:text-zinc-500">
                {data.purchaseDate ? "Transaction completed" : "Default registration tier"}
              </span>
            </div>

            {/* Expiry Date */}
            <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.015] dark:bg-white/[0.015] p-4">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                <span>⏳</span>
                <span>Expiry Date / Validity</span>
              </span>
              <p className="mt-2 text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                {data.expiryDate ? (
                  new Date(data.expiryDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                ) : isPaid ? (
                  <span className="text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                    <span>∞</span>
                    <span>Never Expires (Lifetime)</span>
                  </span>
                ) : (
                  "Weekly Reset"
                )}
              </p>
              <span className="mt-1 block text-[11px] text-slate-400 dark:text-zinc-500">
                {isPaid
                  ? "Standard credits never expire"
                  : "Refreshes every 7 days automatically"}
              </span>
            </div>

            {/* Audio Retention */}
            <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.015] dark:bg-white/[0.015] p-4">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                <span>📁</span>
                <span>Audio Storage Retention</span>
              </span>
              <p className="mt-2 text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                {isPaid ? "7 Days Cloud Retention" : "24 Hours Retention"}
              </p>
              <span className="mt-1 block text-[11px] text-slate-400 dark:text-zinc-500">
                Download MP3 anytime before expiry
              </span>
            </div>

            {/* License & Rights */}
            <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.015] dark:bg-white/[0.015] p-4">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                <span>⚖️</span>
                <span>Commercial Usage Rights</span>
              </span>
              <p className="mt-2 text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                {isPaid ? "Full Commercial Rights" : "Personal / Evaluation"}
              </p>
              <span className="mt-1 block text-[11px] text-slate-400 dark:text-zinc-500">
                YouTube, Podcasts, Ads &amp; Audiobooks
              </span>
            </div>
          </div>
        </section>

        {/* 4. PURCHASE HISTORY & BILLING RECORDS */}
        <section className="mt-8 rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.025] p-6 sm:p-8 backdrop-blur-xl shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white flex items-center gap-2">
                <span>📜</span>
                <span>Purchase History &amp; Recharge Invoices</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Complete log of your prepaid pack recharges, character additions, and receipts.
              </p>
            </div>

            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ff5500] dark:text-orange-400 hover:underline"
            >
              <span>+ Add More Credits</span>
            </Link>
          </div>

          <div className="mt-6">
            {data.purchases.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border border-dashed border-black/[0.08] dark:border-white/[0.08] p-8">
                <span className="text-4xl">🛒</span>
                <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                  No purchases yet
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                  You are currently using the Free Tier (1,000 characters/week). Top up anytime to get Standard credits that never expire.
                </p>
                <Link
                  href="/pricing"
                  className="btn-primary mt-5 inline-flex py-2.5 px-5 text-xs font-bold shadow-md"
                >
                  View Plans &amp; Recharge &rarr;
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-black/[0.06] dark:border-white/[0.08] text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      <th className="py-3 px-4">Plan / Pack</th>
                      <th className="py-3 px-4">Characters Added</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Purchase Date</th>
                      <th className="py-3 px-4">Validity / Expiry</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04] text-xs">
                    {data.purchases.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-4 px-4">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {item.packName}
                          </span>
                          <span className="block text-[11px] text-slate-400 dark:text-zinc-500 font-mono mt-0.5">
                            ID: #{item.id} • {item.packId}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            +{item.charAmount.toLocaleString()} chars
                          </span>
                        </td>

                        <td className="py-4 px-4 font-black text-slate-900 dark:text-white text-sm">
                          ₹{item.amount}
                        </td>

                        <td className="py-4 px-4 text-slate-600 dark:text-zinc-400">
                          {new Date(item.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>

                        <td className="py-4 px-4">
                          {item.expiryDate ? (
                            <div>
                              <span
                                className={`font-semibold ${
                                  item.isExpired
                                    ? "text-red-500 dark:text-red-400"
                                    : "text-slate-800 dark:text-zinc-200"
                                }`}
                              >
                                {new Date(item.expiryDate).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                              <span className="block text-[10px] text-slate-400">
                                {item.validityLabel}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-500 dark:text-emerald-400 font-semibold">
                              <span>∞</span>
                              <span>Never Expires</span>
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-right">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              item.status === "paid"
                                ? "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/25"
                                : "bg-amber-500/15 text-amber-500 border border-amber-500/25"
                            }`}
                          >
                            <span>✓</span>
                            <span>{item.status}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* 5. HELPFUL FOOTER TIPS */}
        <div className="mt-8 rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] p-5 text-xs text-slate-500 dark:text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            💡 Need customized high-capacity enterprise voice quotas or dedicated API access?{" "}
            <Link href="/contact" className="text-[#ff5500] dark:text-orange-400 font-bold hover:underline">
              Contact Support
            </Link>
          </p>

          <Link
            href="/faq"
            className="text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white transition"
          >
            Billing &amp; Credits FAQ &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}
