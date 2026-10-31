"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AdSlot from "@/components/ads/AdSlot";

interface PremiumSidebarProps {
  balance?: number;
  planName?: string;
  customerNo?: number | null;
  onApplyPreset?: (preset: { lang: string; voice: string; speed: number }) => void;
}

export default function PremiumSidebar({
  balance = 0,
  planName = "Standard Pack (Pro)",
  customerNo = 10000000,
  onApplyPreset,
}: PremiumSidebarProps) {
  const pathname = usePathname();
  const [retentionDays, setRetentionDays] = useState<number>(30);
  const [studio320k, setStudio320k] = useState<boolean>(true);
  const [expressiveMode, setExpressiveMode] = useState<string>("narrative");
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const handleRetentionChange = (days: number) => {
    setRetentionDays(days);
    setSavedNotice(`Retention set to ${days} days`);
    setTimeout(() => setSavedNotice(null), 2500);
  };

  const proPresets = [
    {
      title: "🎙️ YouTube Intro & Shorts",
      lang: "hi-IN",
      voice: "hi-IN-Wavenet-B",
      speed: 1.1,
      gender: "male",
      desc: "Fast, punchy Arjun voice for viral video reels",
    },
    {
      title: "📖 Hindi Story Narration",
      lang: "hi-IN",
      voice: "hi-IN-Wavenet-A",
      speed: 0.95,
      gender: "female",
      desc: "Warm Aditi voice with natural breathing pauses",
    },
    {
      title: "💼 Corporate Presentation",
      lang: "en-IN",
      voice: "en-IN-Wavenet-B",
      speed: 1.0,
      gender: "male",
      desc: "Clear Indian English news & corporate style",
    },
  ];

  return (
    <aside className="w-full lg:w-80 shrink-0 space-y-4 font-sans">
      {/* ── Left Admin Panel Container ── */}
      <div className="rounded-[28px] border border-black/[0.08] dark:border-white/[0.08] bg-white/90 dark:bg-[#0c0d12]/90 backdrop-blur-2xl p-5 shadow-xl shadow-black/5 dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-5">
        {/* 1. Admin/Studio Workspace Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white text-base shadow-sm font-black">
              ⚡
            </span>
            <div>
              <div className="text-[11px] font-bold text-orange-600 dark:text-orange-400">
                Studio Admin Panel
              </div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                Pro AI Workspace
              </div>
            </div>
          </div>

          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
            Active
          </span>
        </div>

        {/* 2. Customer ID & Subscription Balance Card */}
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-500/5 p-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-500 dark:text-zinc-400">
              Customer #{customerNo ? customerNo.toString() : "10000000"}
            </span>
            <span className="font-bold text-emerald-700 dark:text-emerald-300">
              {planName}
            </span>
          </div>

          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">
                Voice Credit Balance
              </div>
              <div className="text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                🪙 {balance.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="mt-3 h-1.5 w-full rounded-full bg-emerald-500/20 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
              style={{ width: `${Math.min(100, (balance / 50000) * 100)}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
            <span>Validity: Never Expires</span>
            <span>Up to 10k chars/req</span>
          </div>
        </div>

        {/* 3. Admin Panel Quick Navigation */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 px-2 mb-1.5">
            Admin Navigation
          </div>

          <Link
            href="/text-to-speech"
            className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
              pathname === "/text-to-speech"
                ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/25"
                : "text-slate-700 dark:text-zinc-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>🎙️</span>
              <span>Text to Speech Studio</span>
            </div>
            <span className="size-2 rounded-full bg-orange-500 animate-pulse" />
          </Link>

          <Link
            href="/history"
            className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
              pathname === "/history"
                ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/25"
                : "text-slate-700 dark:text-zinc-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>🕒</span>
              <span>Conversion History</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">Archive &rarr;</span>
          </Link>

          <Link
            href="/account"
            className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
              pathname === "/account"
                ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/25"
                : "text-slate-700 dark:text-zinc-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>👤</span>
              <span>Account &amp; Billing</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">Manage &rarr;</span>
          </Link>
        </div>

        {/* 4. Pro Audio Suite Controls */}
        <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.08] space-y-3.5">
          <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 px-2">
            Pro Audio Controls
          </div>

          {/* 320kbps Studio Master MP3 switch */}
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02]">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Lossless 320kbps MP3</span>
                <span className="rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] px-1 font-bold">
                  HD
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                Highest studio bitrate output
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStudio320k(!studio320k)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                studio320k ? "bg-emerald-500" : "bg-slate-300 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  studio320k ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Expressive style selection */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1.5 block px-1">
              Speech Inflection Style
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: "narrative", label: "📖 Narrative" },
                { id: "commercial", label: "📢 Commercial" },
                { id: "conversational", label: "💬 Casual Chat" },
                { id: "dramatic", label: "🎭 Dramatic" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setExpressiveMode(m.id)}
                  className={`rounded-xl border px-2 py-1.5 text-xs font-semibold text-center transition cursor-pointer ${
                    expressiveMode === m.id
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold"
                      : "border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] text-slate-700 dark:text-zinc-300 hover:border-emerald-300"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Configurable Cloud Retention */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1.5 px-1">
              <span>Cloud History Archive</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                {retentionDays} Days
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1">
              {[
                { days: 30, label: "30 Days" },
                { days: 90, label: "90 Days" },
                { days: 365, label: "1 Year" },
              ].map((opt) => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => handleRetentionChange(opt.days)}
                  className={`rounded-lg border px-2 py-1 text-[11px] font-semibold transition cursor-pointer ${
                    retentionDays === opt.days
                      ? "border-emerald-500 bg-emerald-500 text-white font-bold"
                      : "border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] text-slate-700 dark:text-zinc-300 hover:border-emerald-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {savedNotice && (
              <div className="mt-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold px-1 animate-fadeIn">
                ✓ {savedNotice}
              </div>
            )}
          </div>
        </div>

        {/* 5. Quick Pro Voice Presets */}
        <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.08] space-y-2.5">
          <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 px-2">
            1-Click Pro Presets
          </div>

          <div className="space-y-1.5">
            {proPresets.map((p) => (
              <button
                key={p.title}
                type="button"
                onClick={() =>
                  onApplyPreset?.({ lang: p.lang, voice: p.voice, speed: p.speed })
                }
                className="w-full text-left rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-2.5 bg-black/[0.015] dark:bg-white/[0.02] hover:border-emerald-500/40 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    {p.title}
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      p.gender === "female"
                        ? "bg-pink-100 text-pink-700 dark:bg-pink-950/80 dark:text-pink-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300"
                    }`}
                  >
                    {p.gender === "female" ? "♀ Pink" : "♂ Blue"}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                  {p.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 6. Hardware Status & Zero Ads Confirmation */}
        <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.08] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-zinc-400 px-1">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Priority Neural GPU</span>
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Sub-2s</span>
          </div>

          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2 text-center text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
            ✨ Pro Studio Workspace Active
          </div>
        </div>

        {/* 7. Sidebar Sponsor Ad Space */}
        <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
          <AdSlot
            format="rectangle"
            label="Sidebar Sponsor Ad"
            className="!my-1"
          />
        </div>
      </div>
    </aside>
  );
}
