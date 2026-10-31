"use client";

import Link from "next/link";
import { languages } from "@/config/languages";
import CountryFlag from "@/components/ui/CountryFlag";

const rows = [
  // Row 1: 6 languages
  ["hi-IN", "en-IN", "as-IN", "bn-IN", "gu-IN", "kn-IN"],
  // Row 2: 6 languages
  ["ml-IN", "mr-IN", "pa-IN", "ta-IN", "te-IN", "ur-IN"],
  // Row 3: 5 languages
  ["en-US", "af-ZA", "ar-XA", "hy-AM", "az-AZ"],
  // Row 4: 5 languages
  ["be-BY", "bs-BA", "bg-BG", "de-DE", "es-ES"],
  // Row 5: 6 languages
  ["fr-FR", "id-ID", "it-IT", "ja-JP", "ko-KR", "nl-NL"],
  // Row 6: 6 languages
  ["pl-PL", "pt-PT", "ru-RU", "tr-TR", "vi-VN", "cmn-CN"],
];

const langMap = new Map(languages.map((l) => [l.id, l]));

export default function Languages() {
  return (
    <section id="languages" className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Eyebrow */}
        <span className="text-xs font-bold text-[#ff5500]">
          Global &amp; Indian Catalog
        </span>

        {/* Heading */}
        <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Speak to the world in their language
        </h2>

        {/* Subtitle */}
        <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Choose from over 30 Indian regional dialects and international languages with natural inflection
          and localized country voices.
        </p>

        {/* Language Pills in 6 structured rows matching screenshot with vector SVGs */}
        <div className="mt-10 flex flex-col items-center gap-2.5 sm:gap-3.5 max-w-5xl mx-auto">
          {rows.map((row, rIdx) => (
            <div
              key={rIdx}
              className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3"
            >
              {row.map((id) => {
                const lang = langMap.get(id);
                if (!lang) return null;
                return (
                  <Link
                    key={lang.id}
                    href={`/text-to-speech?lang=${lang.id}`}
                    className="group inline-flex items-center gap-2 rounded-full border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none transition-all duration-200 hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-md hover:-translate-y-0.5 select-none"
                  >
                    {/* Vector SVG Circular Flag */}
                    <CountryFlag
                      country={lang.countryCode || "IN"}
                      className="size-4.5 sm:size-5"
                    />

                    {/* Language Name */}
                    <span className="font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
                      {lang.name}
                    </span>

                    {/* Native Script in Parentheses */}
                    <span className="text-slate-400 dark:text-slate-500 text-xs font-normal">
                      ({lang.nativeName})
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
