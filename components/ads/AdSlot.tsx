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
  leaderboard: "min-h-[90px]",
  rectangle: "min-h-[250px]",
  "in-article": "min-h-[280px]",
  sidebar: "min-h-[600px]",
};

export default function AdSlot({
  format = "leaderboard",
  label = "Advertisement",
  className = "",
  hidden = false,
}: AdSlotProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref.current || inView) return;
    const el = ref.current;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setInView(true)),
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [inView]);

  if (hidden) return null;

  const variant = format === "sidebar" ? 2 : format === "rectangle" ? 0 : 1;

  return (
    <div ref={ref} className={`my-8 ${className}`}>
      <div className="mb-2 text-center text-[10px] uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
        {label}
      </div>

      <div
        className={`flex ${MIN_HEIGHT[format]} items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50`}
      >
        {!inView ? (
          <span className="text-xs text-slate-400">Loading…</span>
        ) : (
          <HousePromo variant={variant} />
        )}
      </div>
    </div>
  );
}

function HousePromo({ variant = 0 }: { variant?: number }) {
  const banners = [
    {
      href: "/pricing",
      title: "Need more characters?",
      cta: `Explore ${siteConfig.name} packs from ₹9 →`,
      bg: "from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40",
      text: "text-orange-900 dark:text-orange-200",
    },
    {
      href: "/text-to-speech",
      title: "Turn any text into natural Indian voices.",
      cta: "Try it free →",
      bg: "from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-850",
      text: "text-slate-800 dark:text-slate-200",
    },
    {
      href: "/text-to-speech",
      title: "High-definition Hindi voiceovers for YouTube & Reels.",
      cta: "Generate now →",
      bg: "from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40",
      text: "text-emerald-900 dark:text-emerald-200",
    },
  ];
  const b = banners[variant % banners.length];

  return (
    <Link
      href={b.href}
      className={`flex h-full w-full items-center justify-center bg-gradient-to-r ${b.bg} px-6 py-4 text-center transition hover:opacity-95`}
    >
      <span className={`text-xs sm:text-sm font-semibold ${b.text}`}>
        {b.title}{" "}
        <span className="font-bold underline underline-offset-2 ml-1">{b.cta}</span>
      </span>
    </Link>
  );
}