"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PAID_FEATURES_CONTROL } from "@/config/control";
import AccountNavBar from "@/components/layout/AccountNavBar";
import { getEmailAvatarLetter } from "@/lib/userPreferences";
import {
  CheckIcon,
  CrownIcon,
  FileTextIcon,
  LogOutIcon,
  RefreshCwIcon,
  ShieldIcon,
  SparklesIcon,
  UserIcon,
} from "@/components/ui/LucideIcons";

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
  totalAllowance?: number;
  usedChars?: number;
  remainingChars?: number;
  reqCap: number;
  totalPurchasedChars: number;
  purchases: PurchaseItem[];
}

type TabKey = "overview" | "usage" | "profile" | "plan" | "billing";

export default function AccountPage() {
  const router = useRouter();
  const [data, setData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

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
    try {
      await supabase.auth.signOut();
    } finally {
      window.dispatchEvent(new Event("auth-changed"));
      window.location.href = "/";
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#111217] text-slate-900 dark:text-zinc-100 p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 rounded-full border-2 border-zinc-300 dark:border-zinc-700 border-t-[#ff5500] animate-spin" />
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Loading account details...
          </p>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const isPaid = data.tier === "paid" || data.balance > 0;
  const initial = getEmailAvatarLetter(data.email);

  const totalChars = data.totalAllowance ?? 1000;
  const remainingChars = data.remainingChars ?? data.balance;
  const usedChars = data.usedChars ?? Math.max(0, totalChars - remainingChars);
  const usagePercent = Math.min(
    100,
    Math.max(0, Math.round((usedChars / (totalChars || 1)) * 100))
  );

  return (
    <main className="min-h-screen bg-[#f7f7f8] dark:bg-[#0e0f12] text-zinc-900 dark:text-zinc-100 font-sans pb-20 transition-colors">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Navigation Bar */}
        <AccountNavBar />

        {/* ChatGPT Style Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-5 rounded-2xl bg-white dark:bg-[#18191e] border border-zinc-200 dark:border-zinc-800 shadow-xs mb-6">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-gradient-to-br from-[#ff6a1f] to-[#ff4400] text-white flex items-center justify-center text-lg font-black uppercase shadow-xs">
              {initial}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                  {data.displayName || data.username}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                  {data.tier}
                </span>
                {data.customerNo && (
                  <span className="hidden sm:inline-block font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                    #{data.customerNo}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-xs sm:max-w-md">
                {data.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer disabled:opacity-50"
              title="Refresh Balance"
            >
              <RefreshCwIcon size={13} className={refreshing ? "animate-spin text-orange-500" : ""} />
              <span>{refreshing ? "Syncing..." : "Refresh"}</span>
            </button>

            <Link
              href="/text-to-speech"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ff6a1f] to-[#ff4400] text-white px-3.5 py-1.5 text-xs font-bold shadow-sm shadow-orange-500/25 hover:opacity-95 transition"
            >
              <span>🎙️</span>
              <span>Open Studio</span>
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer disabled:opacity-50"
            >
              <LogOutIcon size={13} />
              <span>{signingOut ? "Signing out..." : "Sign Out"}</span>
            </button>
          </div>
        </div>

        {/* ChatGPT Style Settings Container: Left Sidebar Tabs + Right Content Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Navigation Sidebar */}
          <aside className="lg:col-span-3 rounded-2xl bg-white dark:bg-[#18191e] border border-zinc-200 dark:border-zinc-800 p-2 shadow-xs">
            <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none" aria-label="Account Settings Tabs">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition cursor-pointer text-left whitespace-nowrap border ${
                  activeTab === "overview"
                    ? "bg-orange-500/10 text-[#ff5500] dark:text-orange-400 border-orange-500/25 shadow-2xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-orange-500/5 hover:text-[#ff5500] dark:hover:text-orange-400 border-transparent"
                }`}
              >
                <SparklesIcon size={15} className={activeTab === "overview" ? "text-orange-500" : "text-zinc-400"} />
                <span>Overview</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("usage")}
                className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition cursor-pointer text-left whitespace-nowrap border ${
                  activeTab === "usage"
                    ? "bg-orange-500/10 text-[#ff5500] dark:text-orange-400 border-orange-500/25 shadow-2xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-orange-500/5 hover:text-[#ff5500] dark:hover:text-orange-400 border-transparent"
                }`}
              >
                <CrownIcon size={15} className={activeTab === "usage" ? "text-orange-500" : "text-zinc-400"} />
                <span>Usage &amp; Quota</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition cursor-pointer text-left whitespace-nowrap border ${
                  activeTab === "profile"
                    ? "bg-orange-500/10 text-[#ff5500] dark:text-orange-400 border-orange-500/25 shadow-2xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-orange-500/5 hover:text-[#ff5500] dark:hover:text-orange-400 border-transparent"
                }`}
              >
                <UserIcon size={15} className={activeTab === "profile" ? "text-orange-500" : "text-zinc-400"} />
                <span>Profile &amp; ID</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("plan")}
                className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition cursor-pointer text-left whitespace-nowrap border ${
                  activeTab === "plan"
                    ? "bg-orange-500/10 text-[#ff5500] dark:text-orange-400 border-orange-500/25 shadow-2xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-orange-500/5 hover:text-[#ff5500] dark:hover:text-orange-400 border-transparent"
                }`}
              >
                <ShieldIcon size={15} className={activeTab === "plan" ? "text-orange-500" : "text-zinc-400"} />
                <span>Plan &amp; Validity</span>
              </button>

              {PAID_FEATURES_CONTROL.enabled && (
                <button
                  type="button"
                  onClick={() => setActiveTab("billing")}
                  className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition cursor-pointer text-left whitespace-nowrap border ${
                    activeTab === "billing"
                      ? "bg-orange-500/10 text-[#ff5500] dark:text-orange-400 border-orange-500/25 shadow-2xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-orange-500/5 hover:text-[#ff5500] dark:hover:text-orange-400 border-transparent"
                  }`}
                >
                  <FileTextIcon size={15} className={activeTab === "billing" ? "text-orange-500" : "text-zinc-400"} />
                  <span>Invoices &amp; Orders</span>
                </button>
              )}
            </nav>

            {/* Quick Balance Status in Sidebar */}
            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 px-3 hidden lg:block">
              <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                <span>Remaining</span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {remainingChars.toLocaleString()}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all duration-300 rounded-full"
                  style={{ width: `${Math.max(5, 100 - usagePercent)}%` }}
                />
              </div>
              <span className="mt-1.5 block text-[10px] text-zinc-400">
                {totalChars.toLocaleString()} chars total allowance
              </span>
            </div>
          </aside>

          {/* Right Main Content Area */}
          <div className="lg:col-span-9 space-y-6">
            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="rounded-2xl bg-white dark:bg-[#18191e] border border-zinc-200 dark:border-zinc-800 p-6 sm:p-7 shadow-xs space-y-6">
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Account Overview
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Live snapshot of your speech synthesis quotas, active plan, and usage stats.
                  </p>
                </div>

                {/* Minimalist Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 p-4">
                    <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">
                      Available Balance
                    </span>
                    <div className="mt-1.5 flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                        {remainingChars.toLocaleString()}
                      </span>
                      <span className="text-xs font-semibold text-zinc-500">chars</span>
                    </div>
                    <span className="mt-1 block text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Ready to synthesize
                    </span>
                  </div>

                  <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 p-4">
                    <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">
                      Active Plan
                    </span>
                    <div className="mt-1.5 flex items-baseline gap-1.5">
                      <span className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                        {data.activePlanName}
                      </span>
                    </div>
                    <span className="mt-1 block text-[11px] text-zinc-500 dark:text-zinc-400">
                      Status: <strong className="text-emerald-500">{data.validityStatus}</strong>
                    </span>
                  </div>

                  <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 p-4">
                    <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">
                      Request Capacity
                    </span>
                    <div className="mt-1.5 flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                        {data.reqCap.toLocaleString()}
                      </span>
                      <span className="text-xs font-semibold text-zinc-500">chars/req</span>
                    </div>
                    <span className="mt-1 block text-[11px] text-zinc-500 dark:text-zinc-400">
                      Standard neural model
                    </span>
                  </div>
                </div>

                {/* ChatGPT Row-Based Overview List */}
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 border-t border-b border-zinc-100 dark:border-zinc-800/80">
                  <div className="py-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">User Identification</span>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">Primary email and customer ID</p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{data.email}</span>
                      {data.customerNo && (
                        <span className="block text-[11px] font-mono text-zinc-400">Customer #{data.customerNo}</span>
                      )}
                    </div>
                  </div>

                  <div className="py-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">Character Allowance Usage</span>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">
                        {usedChars.toLocaleString()} used out of {totalChars.toLocaleString()} total
                      </p>
                    </div>
                    <div className="w-36 text-right">
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{usagePercent}% used</span>
                      <div className="mt-1 h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full"
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="py-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">Audio Storage Retention</span>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">Cloud audio file availability</p>
                    </div>
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {isPaid ? "7 Days Cloud Storage" : "24 Hours Retention"}
                    </span>
                  </div>

                  <div className="py-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">Commercial Usage Rights</span>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">License for generated audio files</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                      <CheckIcon size={13} />
                      <span>{isPaid ? "Commercial License" : "Personal / Evaluation"}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Ready to voice your content?
                  </span>
                  <Link
                    href="/text-to-speech"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 text-xs font-semibold transition shadow-xs"
                  >
                    <span>Open Voice Studio</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </div>
            )}

            {/* TAB 2: USAGE & QUOTA */}
            {activeTab === "usage" && (
              <div className="rounded-2xl bg-white dark:bg-[#18191e] border border-zinc-200 dark:border-zinc-800 p-6 sm:p-7 shadow-xs space-y-6">
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Voice Quota &amp; Usage
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Detailed consumption meter for Indian and Global neural speech generation.
                  </p>
                </div>

                {/* Big Clean Usage Box */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                    <div>
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        Remaining Character Allowance
                      </span>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-4xl sm:text-5xl font-black text-zinc-900 dark:text-white tracking-tight">
                          {remainingChars.toLocaleString()}
                        </span>
                        <span className="text-sm font-semibold text-zinc-500">
                          / {totalChars.toLocaleString()} characters
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                      {totalChars - usedChars > 0 ? `${(totalChars - usedChars).toLocaleString()} remaining` : "Quota reached"}
                    </span>
                  </div>

                  {/* Clean Minimal Progress Bar */}
                  <div className="mt-4 h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 transition-all duration-300 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(2, (remainingChars / (totalChars || 1)) * 100))}%` }}
                    />
                  </div>

                  <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                    Used {usedChars.toLocaleString()} characters. Each converted character deducts exactly 1 character from your balance.
                  </p>
                </div>

                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 border-t border-b border-zinc-100 dark:border-zinc-800/80">
                  <div className="py-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">Per-Request Limit</span>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">Maximum text length in a single generation</p>
                    </div>
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {data.reqCap.toLocaleString()} chars
                    </span>
                  </div>

                  <div className="py-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">Lifetime Added Characters</span>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">Total characters credited to this account</p>
                    </div>
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {data.totalPurchasedChars.toLocaleString()} chars
                    </span>
                  </div>

                  <div className="py-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">Speech Audio Format</span>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">High definition audio output bitrate</p>
                    </div>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Studio HD MP3 (48 kHz)
                    </span>
                  </div>
                </div>

                <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800/70 p-4 text-xs text-zinc-500 dark:text-zinc-400">
                  💡 Free accounts receive 1,000 complimentary characters every cycle. Standard paid pack characters never expire.
                </div>
              </div>
            )}

            {/* TAB 3: PROFILE & ID */}
            {activeTab === "profile" && (
              <div className="rounded-2xl bg-white dark:bg-[#18191e] border border-zinc-200 dark:border-zinc-800 p-6 sm:p-7 shadow-xs space-y-6">
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Profile &amp; Identity
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Your personal profile attributes and authentication credentials.
                  </p>
                </div>

                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 border-t border-b border-zinc-100 dark:border-zinc-800/80">
                  <div className="py-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">Display Name</span>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">Public profile identifier</p>
                    </div>
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {data.displayName || data.username}
                    </span>
                  </div>

                  <div className="py-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">Username</span>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">System account handle</p>
                    </div>
                    <span className="font-mono text-xs text-zinc-600 dark:text-zinc-300">
                      @{data.username}
                    </span>
                  </div>

                  <div className="py-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">Email Address</span>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">Login and notification email</p>
                    </div>
                    <span className="font-semibold text-zinc-900 dark:text-white">
                      {data.email}
                    </span>
                  </div>

                  {data.customerNo && (
                    <div className="py-3.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">Customer Number</span>
                        <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">Universal account reference</p>
                      </div>
                      <span className="font-mono font-bold text-xs text-zinc-900 dark:text-white">
                        #{data.customerNo}
                      </span>
                    </div>
                  )}

                  <div className="py-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">User ID</span>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">Unique database UUID</p>
                    </div>
                    <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-xs">
                      {data.userId || "—"}
                    </span>
                  </div>

                  <div className="py-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">Member Since</span>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">Date account was created</p>
                    </div>
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {data.accountCreatedAt
                        ? new Date(data.accountCreatedAt).toLocaleDateString("en-IN", {
                            month: "short",
                            year: "numeric",
                            day: "numeric",
                          })
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/profile"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-3.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  >
                    <span>Edit Profile Details</span>
                    <span>&rarr;</span>
                  </Link>

                  <Link
                    href="/settings"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-3.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  >
                    <span>Security &amp; Preferences</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </div>
            )}

            {/* TAB 4: PLAN & VALIDITY */}
            {activeTab === "plan" && (
              <div className="rounded-2xl bg-white dark:bg-[#18191e] border border-zinc-200 dark:border-zinc-800 p-6 sm:p-7 shadow-xs space-y-6">
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Plan &amp; Validity
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Entitlements, licensing, validity rules, and storage guarantees.
                  </p>
                </div>

                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 border-t border-b border-zinc-100 dark:border-zinc-800/80">
                  <div className="py-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">Current Plan Name</span>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">Active tier subscription</p>
                    </div>
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {data.activePlanName}
                    </span>
                  </div>

                  <div className="py-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">Validity Status</span>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">Account state and expiration</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{data.validityStatus}</span>
                    </span>
                  </div>

                  <div className="py-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">Purchase Date</span>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">Date of current activation</p>
                    </div>
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {data.purchaseDate
                        ? new Date(data.purchaseDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "N/A (Default Tier)"}
                    </span>
                  </div>

                  <div className="py-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">Expiry Date</span>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">Plan renewal or expiration</p>
                    </div>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {data.expiryDate ? (
                        new Date(data.expiryDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      ) : isPaid ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Never Expires (Lifetime)
                        </span>
                      ) : (
                        "Weekly Refresh"
                      )}
                    </span>
                  </div>

                  <div className="py-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">Storage Retention</span>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">Audio archive cloud duration</p>
                    </div>
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {isPaid ? "7 Days Cloud Archive" : "24 Hours Retention"}
                    </span>
                  </div>

                  <div className="py-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">Commercial License</span>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">Permitted for YouTube, Ads, Podcasts</p>
                    </div>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {isPaid ? "Commercial Rights Granted" : "Personal / Evaluation"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: BILLING HISTORY (Only rendered when PAID_FEATURES_CONTROL is enabled) */}
            {activeTab === "billing" && PAID_FEATURES_CONTROL.enabled && (
              <div className="rounded-2xl bg-white dark:bg-[#18191e] border border-zinc-200 dark:border-zinc-800 p-6 sm:p-7 shadow-xs space-y-6">
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Purchase History &amp; Recharge Invoices
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Records of character pack purchases and account recharges.
                  </p>
                </div>

                {data.purchases.length === 0 ? (
                  <div className="text-center py-12 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8">
                    <span className="text-3xl">📜</span>
                    <h3 className="mt-3 text-xs font-semibold text-zinc-900 dark:text-white">
                      No purchase records yet
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                      You are using the complimentary free allowance. Convert speech anytime in Voice Studio.
                    </p>
                    <Link
                      href="/text-to-speech"
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 text-xs font-semibold hover:opacity-90 transition"
                    >
                      <span>Open Voice Studio</span>
                      <span>&rarr;</span>
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                          <th className="py-2.5 px-3">Plan / Item</th>
                          <th className="py-2.5 px-3">Characters</th>
                          <th className="py-2.5 px-3">Amount</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-xs">
                        {data.purchases.map((item) => (
                          <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                            <td className="py-3 px-3">
                              <span className="font-semibold text-zinc-900 dark:text-white block">
                                {item.packName}
                              </span>
                              <span className="font-mono text-[10px] text-zinc-400">
                                #{item.id}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                +{item.charAmount.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-bold text-zinc-900 dark:text-white">
                              ₹{item.amount}
                            </td>
                            <td className="py-3 px-3 text-zinc-500 dark:text-zinc-400">
                              {new Date(item.date).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
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
            )}
          </div>
        </div>

        {/* Minimal ChatGPT Style Bottom Support Bar */}
        <div className="mt-8 rounded-2xl bg-white dark:bg-[#18191e] border border-zinc-200 dark:border-zinc-800 px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <p className="flex items-center gap-1.5">
            <span>💡</span>
            <span>Need enterprise voice quotas or custom model tuning?</span>
            <Link href="/contact" className="text-orange-600 dark:text-orange-400 font-semibold hover:underline">
              Contact Support
            </Link>
          </p>

          <Link
            href="/faq"
            className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition font-medium"
          >
            Billing &amp; Usage FAQ &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}
