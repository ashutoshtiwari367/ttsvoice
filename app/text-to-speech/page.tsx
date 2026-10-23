import type { Metadata } from "next";
import TTSWorkspace from "@/components/tts/TTSWorkspace";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `${siteConfig.name} — AI Text to Speech Studio`,
  description: "Generate lifelike Indian and global AI speech with neural voice avatars.",
};

export default function TextToSpeechPage() {
  return (
    <main className="relative flex-1">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex justify-center overflow-hidden"
      >
        <div className="h-[400px] w-[800px] -translate-y-1/2 rounded-full bg-gradient-to-b from-orange-500/10 via-amber-500/5 to-transparent blur-[120px] dark:from-orange-500/15" />
      </div>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6 pt-10 sm:pt-14 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 dark:border-orange-900/60 bg-orange-50/80 dark:bg-orange-950/40 px-3 py-1 text-xs font-bold text-orange-700 dark:text-orange-300">
            <span className="size-1.5 rounded-full bg-orange-500 animate-pulse" />
            {siteConfig.name} Studio
          </span>

          <span className="hidden sm:inline-flex items-center rounded-full border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400">
            🎙️ 20+ Regional & Global Accents
          </span>
          <span className="hidden md:inline-flex items-center rounded-full border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400">
            ⚡ Ultra-fast Neural Engine
          </span>
        </div>

        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl lg:text-5xl">
          Convert Text to{" "}
          <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
            Realistic Voiceover
          </span>
        </h1>

        <p className="mt-3 max-w-3xl text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-400">
          Transform your text into human-quality speech across all Indian languages and popular global dialects. Choose a voice avatar, adjust speed, listen to the preview, and download your audio.
        </p>
      </section>

      <TTSWorkspace />
    </main>
  );
}