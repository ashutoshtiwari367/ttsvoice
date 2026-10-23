import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Answers to common questions about IndianTTS, voices, and pricing.",
};

const questions = [
  {
    q: "What is IndianTTS?",
    a: "IndianTTS is an advanced neural text-to-speech platform built specifically for Indian languages and international dialects. It transforms typed or pasted scripts into natural, human-like voiceovers in seconds.",
  },
  {
    q: "Can I download the generated audio?",
    a: "Yes! You can preview the synthesized audio in our interactive audio player and download studio-ready 320kbps MP3 files with a single click.",
  },
  {
    q: "Which languages and accents are supported?",
    a: "We support 30+ regional Indian and international languages including Hindi, Indian English, Tamil, Telugu, Marathi, Bengali, Gujarati, Kannada, Malayalam, Punjabi, Urdu, Assamese, as well as US/UK English, Spanish, French, German, Arabic, and Japanese.",
  },
  {
    q: "How does the character credit balance work?",
    a: "Every character in your text script uses 1 character credit. We provide generous free character allocations to get started, plus affordable instant top-up packs starting at just ₹9.",
  },
  {
    q: "Do I get commercial rights for generated voices?",
    a: "Yes! All audio generated through IndianTTS can be used commercially for YouTube monetization, social media reels, podcasts, client projects, e-learning courses, and advertisements.",
  },
  {
    q: "How do I choose different voice avatars?",
    a: "In the Text to Speech Studio, you can select your language and pick from multiple natural masculine and feminine neural voices with varied tones, including conversational, expressive, and news anchor.",
  },
];

export default function FAQPage() {
  return (
    <main className="flex-1 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Eyebrow */}
        <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#ff5500]">
          FAQ
        </span>

        {/* Heading */}
        <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Frequently asked questions
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Everything you need to know about IndianTTS studio, neural voices, and audio downloads.
        </p>

        {/* Accordions */}
        <div className="mt-12 space-y-3.5 text-left">
          {questions.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-none transition hover:border-orange-300 dark:hover:border-orange-500/50"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                <span>{item.q}</span>
                <span className="ml-4 flex size-6 shrink-0 items-center justify-center rounded-full text-slate-400 group-open:rotate-180 group-open:text-[#ff5500] transition-transform">
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

              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {item.a}
              </p>
            </details>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Have more questions?
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Start synthesizing speech for free in our studio or explore our flexible character packs.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/text-to-speech"
              className="rounded-xl bg-[#ff5500] hover:bg-[#e04b00] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition"
            >
              Open Studio Free →
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              View Pricing (from ₹9)
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
