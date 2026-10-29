"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";

type AdFormat = "leaderboard" | "rectangle" | "in-article" | "sidebar";

interface AdSlotProps {
  format?: AdFormat;
  label?: string;
  className?: string;
  hidden?: boolean;
  adSlotId?: string;
}

const MIN_HEIGHT: Record<AdFormat, string> = {
  leaderboard: "min-h-[110px]",
  rectangle: "min-h-[260px]",
  "in-article": "min-h-[280px]",
  sidebar: "min-h-[340px]",
};

const SPONSOR_ADS = [
  {
    sponsor: "Hostinger Cloud",
    tag: "SPONSORED WEB HOSTING",
    title: "Launch Fast Websites & APIs with 75% Off",
    description: "Ultra-fast NVMe SSD cloud hosting, free .COM domain, free daily backups & 99.9% uptime for creators.",
    cta: "Claim 75% Discount →",
    href: "https://www.hostinger.com",
    badgeBg: "bg-blue-600 text-white",
    cardBg: "from-blue-600/10 via-indigo-600/5 to-transparent",
    btnColor: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20",
    icon: "🚀",
  },
  {
    sponsor: "StudioGear Pro",
    tag: "AD • AUDIO HARDWARE",
    title: "Broadcast Microphones & Audio Interfaces",
    description: "Upgrade your voiceover studio with Shure SM7B, Focusrite Scarlett & acoustic shields at best Indian prices.",
    cta: "Explore Studio Gear →",
    href: "/text-to-speech",
    badgeBg: "bg-amber-600 text-white",
    cardBg: "from-amber-500/10 via-orange-500/5 to-transparent",
    btnColor: "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-500/20",
    icon: "🎙️",
  },
  {
    sponsor: "Canva Pro",
    tag: "SPONSORED DESIGN",
    title: "Create Viral YouTube Thumbnails in Seconds",
    description: "Access 100M+ premium templates, AI background remover & typography kits for YouTube & Instagram creators.",
    cta: "Start 30-Day Free Trial →",
    href: "https://www.canva.com",
    badgeBg: "bg-purple-600 text-white",
    cardBg: "from-purple-600/10 via-pink-600/5 to-transparent",
    btnColor: "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/20",
    icon: "🎨",
  },
  {
    sponsor: `${siteConfig.name} Studio`,
    tag: "FEATURED CREATOR TOOL",
    title: "Realistic Indian Neural Voice Generator",
    description: "Generate lifelike voiceovers in 20+ Indian languages with natural inflection and studio MP3 downloads.",
    cta: "Try Free Voices →",
    href: "/text-to-speech",
    badgeBg: "bg-orange-600 text-white",
    cardBg: "from-orange-500/10 via-amber-500/5 to-transparent",
    btnColor: "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-500/20",
    icon: "🎙️",
  },
];

export default function AdSlot({
  format = "leaderboard",
  label = "Advertisement Space",
  className = "",
  hidden = false,
}: AdSlotProps) {
  const [adIndex, setAdIndex] = useState(0);

  // Auto-cycle through ads every 6 seconds so user sees it live
  useEffect(() => {
    const timer = setInterval(() => {
      setAdIndex((prev) => (prev + 1) % SPONSOR_ADS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  if (hidden) return null;

  const currentAd = SPONSOR_ADS[adIndex];

  return (
    <div
      style={{ display: "block", visibility: "visible" }}
      className={`sponsor-commercial-wrapper my-6 w-full ${className}`}
    >
      {/* ── Top Ad Space Banner Header ── */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[9px] font-extrabold text-amber-700 dark:text-amber-400">
            <span className="inline-block size-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>📢 ADVERTISEMENT SPACE</span>
          </span>
          <span className="hidden sm:inline text-slate-400 dark:text-zinc-500">•</span>
          <span className="text-slate-600 dark:text-zinc-400 font-bold">{label}</span>
        </div>

        <div className="flex items-center gap-2 text-[9px] text-slate-400 dark:text-zinc-500">
          <span className="rounded bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 border border-slate-200 dark:border-zinc-700 font-semibold">
            {format === "leaderboard" ? "728 × 90 Responsive Banner" : "300 × 250 Medium Rectangle"}
          </span>
          <span title="AdChoices & Sponsor Partner Placement" className="cursor-help font-bold text-slate-400 hover:text-slate-600">
            AdChoices ⓘ
          </span>
        </div>
      </div>

      {/* ── Main Ad Container Box ── */}
      <div
        style={{ display: "flex", visibility: "visible" }}
        className={`relative ${MIN_HEIGHT[format]} w-full flex-col justify-center overflow-hidden rounded-2xl border-2 border-dashed border-amber-500/30 dark:border-amber-400/20 bg-gradient-to-r from-amber-500/[0.03] via-white to-slate-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 shadow-md transition hover:border-amber-500/60`}
      >
        {/* Subtle Watermark on corner */}
        <div className="pointer-events-none absolute top-1.5 right-2 text-[9px] font-black uppercase tracking-widest text-slate-300 dark:text-zinc-700 select-none">
          SPONSORED AD
        </div>

        {/* Ad Content */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0 w-full sm:w-auto">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-zinc-800 shadow-sm border border-black/[0.06] dark:border-white/[0.08] text-xl">
              {currentAd.icon}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-black tracking-wider uppercase shadow-2xs ${currentAd.badgeBg}`}
                >
                  {currentAd.tag}
                </span>
                <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500">
                  {currentAd.sponsor}
                </span>
              </div>

              <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white line-clamp-1">
                {currentAd.title}
              </div>
              <div className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-1 mt-0.5 max-w-xl">
                {currentAd.description}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center w-full sm:w-auto justify-between sm:justify-end">
            {/* Quick Carousel Controls */}
            <div className="flex items-center gap-1">
              {SPONSOR_ADS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAdIndex(i)}
                  className={`size-2 rounded-full transition-all cursor-pointer ${
                    i === adIndex
                      ? "bg-amber-500 w-4"
                      : "bg-slate-300 dark:bg-zinc-700 hover:bg-slate-400"
                  }`}
                  aria-label={`Show Ad ${i + 1}`}
                />
              ))}
            </div>

            <Link
              href={currentAd.href}
              target={currentAd.href.startsWith("http") ? "_blank" : undefined}
              rel={currentAd.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black transition hover:scale-105 active:scale-95 cursor-pointer ${currentAd.btnColor}`}
            >
              <span>{currentAd.cta}</span>
            </Link>
          </div>
        </div>

        {/* Bottom Micro Footer */}
        <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-zinc-800/80 bg-slate-100/40 dark:bg-zinc-900/40 px-3 py-1 text-[9px] text-slate-400 dark:text-zinc-500">
          <span>🎯 Live Advertisement Slot • Google AdSense / Direct Sponsor Banner Integration</span>
          <span className="font-semibold">ID: #{currentAd.sponsor.toLowerCase().replace(/\s+/g, "-")}</span>
        </div>
      </div>
    </div>
  );
}