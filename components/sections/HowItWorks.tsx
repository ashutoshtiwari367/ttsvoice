export default function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Write or paste script",
      text: "Type your script in Hindi, English, Tamil, Marathi or any of 50+ supported dialects.",
    },
    {
      step: "02",
      title: "Select voice avatar",
      text: "Pick the voice personality, preview authentic pronunciation, and fine-tune speaking speed.",
    },
    {
      step: "03",
      title: "Synthesize & export",
      text: "Instant neural rendering. Stream the preview and download pristine 320kbps MP3 audio.",
    },
  ];

  return (
    <section className="relative py-20 sm:py-24 border-t border-black/[0.06] dark:border-white/[0.08] overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-3.5 py-1 text-xs font-bold text-[#ff5500] dark:text-orange-400">
          <span>Effortless Workflow</span>
        </div>

        {/* Heading */}
        <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
          Three simple steps to <span className="text-gradient">studio audio.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-slate-600 dark:text-zinc-400">
          No complicated audio editors or equipment needed. From text to professional MP3 in seconds.
        </p>

        {/* 3 Step Cards */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 md:grid-cols-3 text-left">
          {steps.map((item) => (
            <div
              key={item.step}
              className="card-glow relative overflow-hidden rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.025] p-8 shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff6a1f] to-[#ff4400] text-sm font-black text-white shadow-lg shadow-orange-500/30">
                  {item.step}
                </span>
                <span className="text-xs text-slate-400 dark:text-zinc-500 font-bold">
                  Step {item.step}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {item.title}
              </h3>

              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}