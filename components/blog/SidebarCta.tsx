import Link from "next/link";

export default function SidebarCta() {
  return (
    <div className="card-glow rounded-3xl border border-orange-500/30 bg-gradient-to-b from-orange-500/[0.08] via-white/80 dark:via-[#0d0d14]/80 to-white/60 dark:to-[#0d0d14]/60 backdrop-blur-xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Ambient glow in card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#ff5500]/20 blur-2xl"
      />

      <div className="relative">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-[11px] font-bold text-[#ff5500] dark:text-orange-400 mb-3">
          <span className="dot-live" />
          <span>AI Voice Studio</span>
        </div>

        <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-950 dark:text-white leading-snug">
          Turn Any Text into <span className="text-gradient">Natural Speech</span>
        </h3>

        <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-zinc-400">
          Create lifelike voiceovers for YouTube, podcasts, reels, and e-learning in seconds.
        </p>

        <ul className="mt-4 space-y-2 text-xs text-slate-700 dark:text-zinc-300">
          <li className="flex items-center gap-2">
            <span className="text-[#ff5500] font-bold">✓</span>
            <span>50+ Authentic Regional Accents</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-[#ff5500] font-bold">✓</span>
            <span>Ultra-realistic neural AI models</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-[#ff5500] font-bold">✓</span>
            <span>Instant 320kbps studio MP3</span>
          </li>
        </ul>

        <Link
          href="/text-to-speech"
          className="btn-primary mt-5 w-full py-3 text-xs font-bold text-center justify-center shadow-lg shadow-orange-500/20"
        >
          <span>Try IndianTTS Free</span>
          <span aria-hidden="true">→</span>
        </Link>

        <p className="mt-2.5 text-[10px] text-center text-slate-400 dark:text-zinc-500">
          Free forever tier • No credit card needed
        </p>
      </div>
    </div>
  );
}
