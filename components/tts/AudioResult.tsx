"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import AdSlot from "@/components/ads/AdSlot";

interface AudioResultProps {
  status: "idle" | "generating" | "ready" | "error";
  playing: boolean;
  audioUrl: string | null;
  onPlay: () => void;
  generatedVoiceLabel?: string | null;
  generatedVoiceGender?: string | null;
  pendingVoiceLabel?: string | null;
  pendingVoiceGender?: string | null;
  onRegenerate?: () => void;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioResult({
  status,
  playing,
  audioUrl,
  onPlay,
  generatedVoiceLabel,
  generatedVoiceGender,
  pendingVoiceLabel,
  pendingVoiceGender,
  onRegenerate,
}: AudioResultProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  // Reset scrubber whenever audioUrl changes so previous audio state never leaks
  useEffect(() => {
    setCurrent(0);
    setDuration(0);
  }, [audioUrl]);

  // Keep the real <audio> element in sync with `playing`, `audioUrl`, and `status`.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || status !== "ready" || !audioUrl) return;
    if (playing) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [playing, audioUrl, status]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current;
    if (!el) return;
    const time = Number(e.target.value);
    el.currentTime = time;
    setCurrent(time);
  };

  if (status === "idle") {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 px-6 py-12 text-center transition">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
          <Icon name="mic" size={26} />
        </div>

        <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
          Your synthesized voiceover will appear here
        </h3>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Type or paste your text, select your preferred language & avatar, and click Generate Speech.
        </p>
      </div>
    );
  }

  if (status === "generating") {
    return (
      <div className="rounded-2xl border border-orange-200 dark:border-orange-950 bg-orange-50/30 dark:bg-orange-950/20 px-6 py-12 text-center">
        <div className="relative mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/25">
          <Icon name="mic" size={28} />
          <span className="absolute -inset-1.5 animate-ping rounded-2xl bg-orange-500/20 pointer-events-none" />
        </div>

        <h3 className="mt-5 text-base font-bold text-slate-900 dark:text-white">
          Generating human-like speech…
        </h3>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Neural network rendering natural pitch, cadence and pronunciation.
        </p>

        {/* Pulsing bars animation */}
        <div className="mx-auto mt-6 flex items-center justify-center gap-1.5 h-6">
          <span className="w-1.5 h-3 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-6 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-4 bg-orange-500 rounded-full animate-bounce [animation-delay:0s]" />
          <span className="w-1.5 h-5 bg-orange-500 rounded-full animate-bounce [animation-delay:0.15s]" />
          <span className="w-1.5 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:0.3s]" />
        </div>
      </div>
    );
  }

  if (status === "error" || !audioUrl) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20 px-6 py-10 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
          <Icon name="mic" size={22} />
        </div>
        <h3 className="mt-4 text-sm font-bold text-red-900 dark:text-red-300">
          Could not generate audio
        </h3>
        <p className="mt-1 text-xs text-red-600/80 dark:text-red-400/80">
          Please check your network or try a different voice/language.
        </p>
      </div>
    );
  }

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Real audio element keyed by URL so switching voices always loads fresh audio */}
      <audio
        key={audioUrl}
        ref={audioRef}
        src={audioUrl}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onEnded={() => {
          setCurrent(0);
          if (playing) onPlay();
        }}
        className="hidden"
      />

      {/* Prompt when user changed voice avatar after generating */}
      {pendingVoiceLabel && onRegenerate && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orange-300 dark:border-orange-800/70 bg-orange-50/90 dark:bg-orange-950/40 px-4 py-3 text-xs animate-fadeIn">
          <div className="flex items-center gap-2 font-semibold text-orange-900 dark:text-orange-200">
            <span>🎙️</span>
            <span>
              Voice changed to{" "}
              <strong>
                {pendingVoiceLabel.split(" ")[0]} ({pendingVoiceGender === "female" ? "Female" : "Male"})
              </strong>
              . Regenerate to hear the new voice!
            </span>
          </div>
          <button
            type="button"
            onClick={onRegenerate}
            className="rounded-xl bg-gradient-to-r from-[#ff5500] to-amber-500 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-sm hover:opacity-95 transition cursor-pointer"
          >
            Regenerate with {pendingVoiceLabel.split(" ")[0]} &rarr;
          </button>
        </div>
      )}

      {/* Success banner */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <Icon name="check" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Speech Generated Successfully!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {generatedVoiceLabel
                ? `Voice: ${generatedVoiceLabel} (${generatedVoiceGender === "female" ? "Female" : "Male"})`
                : "Listen to the high-definition studio preview below"}
            </p>
          </div>
        </div>

        <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          Ready
        </span>
      </div>

      {/* Audio Player Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-zinc-950 p-6 text-white shadow-2xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Play/Pause Button */}
          <button
            onClick={onPlay}
            aria-label={playing ? "Pause" : "Play"}
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-lg shadow-orange-500/30 transition-transform hover:scale-105 active:scale-95"
          >
            <Icon name={playing ? "pause" : "play"} size={24} />
          </button>

          {/* Scrubber & Waveform */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
              <span>{formatTime(current)}</span>
              <span className="text-[11px] font-sans text-orange-400 font-semibold">
                {playing ? "Playing preview…" : "Paused"}
              </span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Slider Scrubber */}
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={current}
              onChange={handleSeek}
              className="w-full accent-orange-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
            />
          </div>
        </div>
      </div>

      <AdSlot format="rectangle" label="Advertisement" />

      {/* Download Action Area */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <a
          href={`/api/download?url=${encodeURIComponent(audioUrl)}`}
          className="flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:shadow-xl hover:shadow-orange-500/35 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Icon name="download" size={20} />
          Download High-Quality MP3
        </a>
      </div>
    </div>
  );
}