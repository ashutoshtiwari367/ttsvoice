"use client";

import React from "react";
import Link from "next/link";
import { languages, LanguageDef } from "@/config/languages";
import CountryFlag from "@/components/ui/CountryFlag";

// Split languages into two complementary streams for dual-direction marquee
const half = Math.ceil(languages.length / 2);
const row1 = languages.slice(0, half);
const row2 = languages.slice(half);

function LanguagePill({ lang }: { lang: LanguageDef }) {
  return (
    <Link
      href={`/text-to-speech?lang=${lang.id}`}
      className="group relative inline-flex items-center gap-2.5 rounded-full border border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.035] px-4 py-2 text-xs sm:text-sm font-medium shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all duration-300 hover:border-[#ff5500] dark:hover:border-[#ff5500]/80 hover:bg-white dark:hover:bg-white/[0.08] hover:shadow-xl hover:shadow-orange-500/15 hover:-translate-y-0.5 select-none shrink-0"
    >
      <CountryFlag
        country={lang.countryCode || "IN"}
        size={22}
        className="size-5.5 shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-sm"
      />
      <span className="font-bold text-slate-800 dark:text-zinc-100 tracking-tight group-hover:text-[#ff5500] dark:group-hover:text-orange-400 transition-colors">
        {lang.name}
      </span>
      <span className="text-[11px] sm:text-xs text-slate-400 dark:text-zinc-500 font-normal">
        {lang.nativeName}
      </span>
      {lang.isIndian ? (
        <span className="inline-block rounded-full bg-orange-500/10 dark:bg-orange-500/20 text-[#ff5500] dark:text-orange-400 text-[10px] font-black px-2 py-0.5 border border-orange-500/20">
          IN
        </span>
      ) : (
        <span className="hidden sm:inline-block rounded-full bg-slate-500/10 dark:bg-white/[0.06] text-slate-500 dark:text-zinc-400 text-[10px] font-semibold px-1.5 py-0.5">
          AI
        </span>
      )}
    </Link>
  );
}

export default function LanguageCarousel() {
  return (
    <div className="relative mt-12 sm:mt-14 w-full overflow-hidden py-4">
      {/* Subtle eyebrow heading */}
      <div className="mb-5 flex items-center justify-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">
        <span className="dot-live" />
        <span>50+ Supported Regional &amp; Global Accents • Click to Listen</span>
      </div>

      {/* Edge gradient masks for seamless fade out */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 sm:w-36 bg-gradient-to-r from-[var(--bg)] via-[var(--bg)]/80 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 sm:w-36 bg-gradient-to-l from-[var(--bg)] via-[var(--bg)]/80 to-transparent z-10" />

      {/* Row 1 — Moving Left */}
      <div className="flex overflow-hidden py-1.5">
        <div className="animate-marquee-left flex items-center gap-3.5">
          {row1.concat(row1).map((lang, idx) => (
            <LanguagePill key={`r1-${lang.id}-${idx}`} lang={lang} />
          ))}
        </div>
      </div>

      {/* Row 2 — Moving Right */}
      <div className="mt-3 flex overflow-hidden py-1.5">
        <div className="animate-marquee-right flex items-center gap-3.5">
          {row2.concat(row2).map((lang, idx) => (
            <LanguagePill key={`r2-${lang.id}-${idx}`} lang={lang} />
          ))}
        </div>
      </div>
    </div>
  );
}
