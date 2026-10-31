import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI Audio & Voice Tools",
  description: "Explore the audio generation, voice tuning, and speech synthesis tools by IndianTTS.",
};

const tools = [
  {
    title: "AI Text to Speech Studio",
    badge: "Core Tool",
    description: "Generate natural, human-like voiceovers across 30+ Indian and global dialects. Choose voice avatars, adjust speed, and download 320kbps MP3s.",
    href: "/text-to-speech",
    cta: "Launch Studio →",
    active: true,
  },
  {
    title: "Audio Speed & Cadence Tuner",
    badge: "Built-in",
    description: "Fine-tune narration pacing from 0.7x to 1.3x speed with automated pitch preservation for professional podcasts and reels.",
    href: "/text-to-speech",
    cta: "Use in Studio →",
    active: true,
  },
  {
    title: "Multi-Lingual Voiceover Catalog",
    badge: "30+ Languages",
    description: "Browse 34 regional Indian and international language accents with authentic native inflection and localized pronounciations.",
    href: "/#languages",
    cta: "Browse Languages →",
    active: true,
  },
  {
    title: "High-Bitrate MP3 Downloader",
    badge: "Studio Ready",
    description: "Download crystal-clear, royalty-free audio tracks optimized for YouTube, Instagram Reels, IVR, and commercial voiceovers.",
    href: "/text-to-speech",
    cta: "Try Audio Player →",
    active: true,
  },
];

export default function ToolsPage() {
  return (
    <main className="flex-1 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-xs font-bold text-[#ff5500]">
            AI Voice Tools
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Creator Studio Tools
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            A comprehensive suite of voiceover generation and audio production tools designed for Indian content creators, educators, and businesses.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {tools.map((tool) => (
            <div
              key={tool.title}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-7 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-none transition hover:border-orange-300 dark:hover:border-orange-500/50 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="rounded-full bg-orange-50 dark:bg-orange-950/60 px-2.5 py-1 text-[11px] font-bold text-[#ff5500] dark:text-orange-400 border border-orange-200/60 dark:border-orange-900/40">
                    {tool.badge}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {tool.title}
                </h2>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {tool.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Link
                  href={tool.href}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#ff5500] hover:text-[#e04b00] transition"
                >
                  {tool.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
