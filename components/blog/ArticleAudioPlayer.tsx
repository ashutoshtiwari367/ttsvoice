"use client";

import { useState, useEffect, useRef } from "react";

interface ArticleAudioPlayerProps {
  title: string;
  textContent: string;
  readingTime: string;
  compact?: boolean;
}

export default function ArticleAudioPlayer({
  title,
  textContent,
  readingTime,
  compact = false,
}: ArticleAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState<number>(1);
  const [isSupported, setIsSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true);
    }

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const togglePlay = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();

    // Prepare clean text to speak
    const cleanText = textContent
      ? textContent
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 2000)
      : title;

    const fullText = `${title}. ${cleanText}`;
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.rate = rate;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice =
      voices.find((v) => v.lang.includes("en-IN") || v.lang.includes("en-US")) ||
      voices[0];
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const cycleRate = () => {
    const rates = [1, 1.25, 1.5];
    const nextRate = rates[(rates.indexOf(rate) + 1) % rates.length];
    setRate(nextRate);
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  // Compact sidebar widget version
  if (compact) {
    return (
      <div className="card-glow rounded-3xl border border-orange-500/30 bg-gradient-to-b from-orange-500/[0.08] via-white/80 dark:via-[#0d0d14]/80 to-white/60 dark:to-[#0d0d14]/60 backdrop-blur-xl p-5 shadow-lg relative overflow-hidden">
        {/* Ambient warm glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#ff5500]/20 blur-xl"
        />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="dot-live" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#ff5500] dark:text-orange-400">
                {isPlaying ? "Playing Narration" : "Listen to Article"}
              </span>
            </div>
            <button
              type="button"
              onClick={cycleRate}
              title="Change speech playback speed"
              className="rounded-full border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-bold text-slate-700 dark:text-zinc-300 hover:text-[#ff5500] dark:hover:text-orange-400 transition-colors"
            >
              {rate}x
            </button>
          </div>

          {/* Action Row: Play Button + Waveform */}
          <div className="flex items-center gap-3.5 my-2">
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-[#ff6a1f] to-[#ff5500] text-white shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95 transition-transform"
              aria-label={isPlaying ? "Pause audio narration" : "Listen to article"}
            >
              {isPlaying ? (
                <span className="text-base font-bold">⏸</span>
              ) : (
                <span className="text-base font-bold ml-0.5">▶</span>
              )}
            </button>

            <div className="flex-1">
              <div className="flex items-center gap-1 h-6">
                {[4, 8, 14, 20, 10, 16, 8, 12, 18, 6].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: isPlaying ? `${Math.max(6, (h * (i % 2 === 0 ? 1.2 : 0.8)))}px` : `${Math.max(4, h * 0.4)}px` }}
                    className={`flex-1 rounded-full bg-[#ff5500] transition-all duration-200 ${
                      isPlaying
                        ? "animate-[pulse_0.8s_ease-in-out_infinite]"
                        : "opacity-35"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                <span>{isPlaying ? "AI Voice Active" : "Click to Play"}</span>
                <span>{readingTime}</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-2">
            Instant narration synthesized by IndianTTS Neural Engine.
          </p>
        </div>
      </div>
    );
  }

  // Full-width version (e.g. for mobile or main flow)
  return (
    <div className="rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/75 dark:bg-white/[0.03] backdrop-blur-xl p-4 shadow-sm my-6 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={togglePlay}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#ff6a1f] to-[#ff5500] text-white shadow-md shadow-orange-500/25 hover:scale-105 active:scale-95 transition-transform"
            aria-label={isPlaying ? "Pause audio narration" : "Listen to article"}
          >
            {isPlaying ? (
              <span className="text-sm font-bold">⏸</span>
            ) : (
              <span className="text-sm font-bold ml-0.5">▶</span>
            )}
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#ff5500] dark:text-orange-400">
                {isPlaying ? "Now Playing" : "Listen to this article"}
              </span>
              <span className="text-[10px] rounded-full bg-orange-500/10 px-2 py-0.5 text-orange-600 dark:text-orange-300 font-semibold">
                AI Voice
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Audio narration powered by IndianTTS • {readingTime}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pl-14 sm:pl-0">
          <div className="flex items-end gap-1 h-5 w-16">
            <span
              className={`w-1 rounded-full bg-[#ff5500] transition-all duration-300 ${
                isPlaying ? "h-5 animate-[bounce_0.6s_ease-in-out_infinite]" : "h-2 opacity-40"
              }`}
            />
            <span
              className={`w-1 rounded-full bg-[#ff5500] transition-all duration-300 ${
                isPlaying ? "h-3.5 animate-[bounce_0.8s_ease-in-out_infinite]" : "h-3 opacity-40"
              }`}
            />
            <span
              className={`w-1 rounded-full bg-[#ff5500] transition-all duration-300 ${
                isPlaying ? "h-5 animate-[bounce_0.5s_ease-in-out_infinite]" : "h-4 opacity-40"
              }`}
            />
            <span
              className={`w-1 rounded-full bg-[#ff5500] transition-all duration-300 ${
                isPlaying ? "h-2.5 animate-[bounce_0.9s_ease-in-out_infinite]" : "h-2 opacity-40"
              }`}
            />
            <span
              className={`w-1 rounded-full bg-[#ff5500] transition-all duration-300 ${
                isPlaying ? "h-4 animate-[bounce_0.7s_ease-in-out_infinite]" : "h-3 opacity-40"
              }`}
            />
          </div>

          <button
            type="button"
            onClick={cycleRate}
            title="Change speech playback rate"
            className="rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.05] px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-[#ff5500] dark:hover:text-orange-400 transition-colors"
          >
            {rate}x
          </button>
        </div>
      </div>
    </div>
  );
}
