export default function Features() {
  const cards = [
    {
      icon: "🇮🇳",
      title: "50+ Indian & Global Languages",
      text: "Specialized in Indian regional dialects (Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, etc.) and major international accents.",
      tag: "Authentic Nuance",
    },
    {
      icon: "⚡",
      title: "Studio AI Voices",
      text: "Choose from conversational, news broadcast, narrative, and cheerful voice avatars tailored for high audience retention.",
      tag: "Neural Engine",
    },
    {
      icon: "🎧",
      title: "Creator & Commercial Ready",
      text: "Crystal clear 320kbps MP3s ready for YouTube, podcasts, reels, audiobooks, client voiceovers, and ads.",
      tag: "Full Rights",
    },
  ];

  return (
    <section className="relative py-20 sm:py-24 overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#ff5500] dark:text-orange-400">
          <span>Built For Audio Creators</span>
        </div>

        {/* Heading */}
        <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
          Studio tools. <span className="text-gradient">Natural cadence.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-slate-600 dark:text-zinc-400">
          State of the art speech synthesis designed to sound human, expressive and immersive.
        </p>

        {/* 3 Feature Cards */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 md:grid-cols-3 text-left">
          {cards.map((card) => (
            <div
              key={card.title}
              className="card-glow relative overflow-hidden rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.025] p-7 shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all"
            >
              {/* Subtle top light edge */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />

              <div className="flex items-center justify-between mb-5">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-orange-500/10 dark:bg-orange-500/15 text-2xl shadow-sm border border-orange-500/20">
                  {card.icon}
                </span>
                <span className="rounded-full bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.06] px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-zinc-400">
                  {card.tag}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {card.title}
              </h3>

              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                {card.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
