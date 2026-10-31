export default function FAQ() {
  const faqs = [
    {
      q: "What is IndianTTS?",
      a: "IndianTTS is an advanced neural speech generation platform tailored specifically for Indian regional dialects and popular global languages. It delivers natural human-like cadence, authentic accents, and studio-grade 320kbps MP3 audio.",
    },
    {
      q: "Can I download the generated audio and use it commercially?",
      a: "Yes! Once generated, you can preview and download high-quality MP3 files. All audio created on our platform comes with commercial rights for YouTube monetization, reels, podcasts, e-learning, and client projects.",
    },
    {
      q: "Which languages and accents are supported?",
      a: "We support over 50+ regional Indian and international languages including Hindi, Indian English, Tamil, Telugu, Marathi, Bengali, Gujarati, Kannada, Malayalam, Punjabi, Urdu, Assamese, as well as US/UK English, Spanish, French, German, Arabic, and Japanese.",
    },
    {
      q: "How does the prepaid character credit balance work?",
      a: "Each character you convert uses 1 character credit. We provide a generous free allowance to test voices, followed by affordable prepaid packs starting at just ₹29 via Razorpay. Standard credits never expire.",
    },
    {
      q: "Is there any recurring monthly subscription or lock-in?",
      a: "No! Unlike other platforms that force recurring monthly credit card subscriptions, IndianTTS uses 100% prepaid top-ups. You recharge only when you need audio, via UPI, Debit/Credit Card or Netbanking.",
    },
  ];

  return (
    <section id="faq" className="relative py-20 sm:py-24 border-t border-black/[0.06] dark:border-white/[0.08] overflow-hidden">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-3.5 py-1 text-xs font-bold text-[#ff5500] dark:text-orange-400">
          <span>FAQ</span>
        </div>

        {/* Heading */}
        <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
          Frequently asked <span className="text-gradient">questions.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-slate-600 dark:text-zinc-400">
          Everything you need to know about voices, credits, downloads, and commercial rights.
        </p>

        {/* Accordions */}
        <div className="mt-12 space-y-3.5 text-left">
          {faqs.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.025] p-5.5 shadow-sm dark:shadow-none backdrop-blur-xl transition-all hover:border-orange-500/30 open:border-orange-500/40 open:bg-white/90 dark:open:bg-white/[0.04]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                <span>{item.q}</span>
                <span className="ml-4 flex size-7 shrink-0 items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.05] text-slate-400 group-open:rotate-180 group-open:text-[#ff5500] group-open:bg-orange-500/10 transition-all">
                  <svg
                    className="size-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </summary>

              <p className="mt-3.5 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}