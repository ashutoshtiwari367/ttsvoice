import Link from "next/link";
import LanguageCarousel from "./LanguageCarousel";

export default function Hero() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-8 text-center overflow-hidden">
      {/* Background ambient lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 -top-24 -z-10 h-72 w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#ff5500]/25 via-amber-500/10 to-transparent blur-3xl dark:from-[#ff5500]/20"
      />

      {/* Eyebrow badge */}
      <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 dark:border-orange-500/30 bg-orange-500/10 dark:bg-orange-950/40 px-4 py-1.5 text-xs font-bold text-[#ff5500] dark:text-orange-400 shadow-sm backdrop-blur-md">
        <span className="dot-live" />
        <span className="tracking-wide">Next-Gen Neural Voice Synthesis</span>
        <span className="hidden sm:inline text-orange-400/60">•</span>
        <span className="hidden sm:inline text-slate-600 dark:text-zinc-400 font-medium">50+ Regional Dialects</span>
      </div>

      {/* Main Headline */}
      <h1 className="mt-8 text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-950 dark:text-white leading-[1.08]">
        Turn your words into{" "}
        <br className="hidden sm:inline" />
        <span className="text-gradient">authentic human speech.</span>
      </h1>

      {/* Subtitle */}
      <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600 dark:text-zinc-400">
        Generate lifelike voices across Indian regional dialects and global languages.
        Studio-grade 320kbps audio, authentic inflections, and zero monthly lock-in.
      </p>

      {/* Primary Action Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
        <Link
          href="/text-to-speech"
          className="btn-primary px-7 py-3.5 text-sm sm:text-base font-bold shadow-xl shadow-orange-500/25"
        >
          <span>🎙️ Open Voice Studio</span>
          <span aria-hidden="true">→</span>
        </Link>

        <Link
          href="/pricing"
          className="btn-ghost px-6 py-3.5 text-sm sm:text-base font-semibold"
        >
          <span>View Credit Packs</span>
          <span className="text-xs text-orange-500 font-bold">(from ₹29)</span>
        </Link>
      </div>

      {/* Trust & Spec Badges */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="text-emerald-500 font-bold">✓</span> No subscription lock-in
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="text-emerald-500 font-bold">✓</span> 320kbps Studio MP3
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="text-emerald-500 font-bold">✓</span> Instant Razorpay Recharges
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="text-emerald-500 font-bold">✓</span> Commercial use allowed
        </span>
      </div>

      {/* Language Carousel with Country Flags (Above Ad space) */}
      <LanguageCarousel />

      {/* Sponsored Ad Box — polished glass container */}
      <div className="mx-auto mt-12 max-w-3xl rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] py-8 px-6 text-center backdrop-blur-md transition-all hover:border-orange-500/30">
        <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">
          Sponsored Space
        </div>
        <div className="mt-2 text-xs font-semibold text-slate-400 dark:text-zinc-500">
          Partner Advertisement Slot • 728 × 90
        </div>
      </div>
    </section>
  );
}