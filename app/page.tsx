import type { Metadata } from "next";
import TTSWorkspace from "@/components/tts/TTSWorkspace";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `${siteConfig.name} — AI Text to Speech Studio`,
  description: siteConfig.description,
};

export default function HomePage() {
  return (
    <main className="relative flex-1 bg-slate-50/40 dark:bg-[#07080c] min-h-screen">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex justify-center overflow-hidden"
      >
        <div className="h-[300px] w-[800px] -translate-y-1/2 rounded-full bg-gradient-to-b from-orange-500/10 via-amber-500/5 to-transparent blur-[120px] dark:from-orange-500/15" />
      </div>

      <TTSWorkspace />
    </main>
  );
}