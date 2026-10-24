"use client";

import Image from "next/image";
import Link from "next/link";

interface AdSpacePromoProps {
  className?: string;
}

export default function AdSpacePromo({ className = "" }: AdSpacePromoProps) {
  const features = [
    "100+ Realistic AI Voices",
    "Multiple Languages",
    "Natural & Human-like Speech",
    "Commercial Use",
  ];

  return (
    <aside
      className={`w-full lg:w-[280px] xl:w-[300px] shrink-0 font-sans ${className}`}
    >
      <div className="relative overflow-hidden rounded-[28px] border border-orange-200/80 dark:border-orange-900/40 bg-gradient-to-b from-[#fffbf8] via-[#fff5ed] to-[#ffede0] dark:from-[#1b1410] dark:via-[#16100c] dark:to-[#120c09] p-5 sm:p-6 shadow-xl shadow-orange-500/5 flex flex-col justify-between min-h-[580px]">
        {/* Top Header Tag */}
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#ff5500]">
            <span className="text-xs">◆</span>
            <span>AD SPACE</span>
          </div>

          {/* Heading */}
          <h2 className="mt-3 text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white leading-[1.18] tracking-tight">
            Create<br />
            Stunning Audio<br />
            <span className="text-[#ff5500]">from Text</span>
          </h2>

          <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
            Perfect for YouTube, Podcasts, E-learning, Reels & more.
          </p>

          {/* Feature List */}
          <ul className="mt-4 space-y-2.5">
            {features.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-zinc-200"
              >
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950/80 text-[#ff5500] text-[10px] font-black">
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 3D Illustration Graphic */}
        <div className="relative my-4 flex items-center justify-center py-2">
          <div className="relative size-44 sm:size-48 overflow-hidden rounded-2xl shadow-sm">
            <Image
              src="/images/podcast-mic-3d.jpg"
              alt="3D Studio Microphone on Podium"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 200px"
              priority
            />
          </div>
        </div>

        {/* Bottom CTA Button */}
        <div>
          <Link
            href="/pricing"
            className="flex w-full items-center justify-center gap-1.5 rounded-full border-2 border-orange-500/80 bg-white/80 dark:bg-zinc-900/80 px-5 py-2.5 text-xs font-extrabold text-[#ff5500] dark:text-orange-400 shadow-sm transition hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 dark:hover:text-white hover:shadow-md cursor-pointer group"
          >
            <span>Explore Premium</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
