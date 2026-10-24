"use client";

import Link from "next/link";
import { useRef, useEffect } from "react";

interface ScriptEditorProps {
  text: string;
  onChange: (value: string) => void;
  onClear: () => void;
  userType?: "guest" | "free" | "premium";
  totalAllowance?: number;
  usedChars?: number;
  remainingChars?: number;
  maxCharacters?: number;
  tier?: "anon" | "free" | "paid";
  balance?: number;
}

const sampleTemplates = [
  {
    id: "welcome",
    label: "Welcome",
    text: "नमस्ते! IndianTTS में आपका स्वागत है। यह भारत का सबसे एडवांस और रियलिस्टिक AI वॉयस स्टूडियो है।",
  },
  {
    id: "youtube",
    label: "YouTube Intro",
    text: "Hey creators! Welcome back to the channel. In today's video, we are diving deep into how AI voiceovers can take your videos viral.",
  },
  {
    id: "story",
    label: "Story",
    text: "एक बार की बात है, पहाड़ों के बीच बसे एक शांत गांव में, हवाएं पुराने किस्से सुनाती थीं और नदियां गीत गाती थीं...",
  },
  {
    id: "ad",
    label: "Advertisement",
    text: "क्या आप भी अपनी रील्स, पॉडकास्ट और विज्ञापनों के लिए असली इंसानी आवाज़ ढूंढ रहे हैं? आज ही शुरू करें IndianTTS, बिल्कुल फ्री!",
  },
];

export default function ScriptEditor({
  text,
  onChange,
  onClear,
  userType = "guest",
  totalAllowance = 500,
  usedChars = 0,
  remainingChars = 500,
  maxCharacters = 500,
  tier = "anon",
  balance = 0,
}: ScriptEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);

  // Allowed characters for the current request
  const allowedLimit = Math.max(0, Math.min(maxCharacters, remainingChars));
  const isOverLimit = text.length > allowedLimit;
  const extraChars = isOverLimit ? text.length - allowedLimit : 0;

  // Split text into valid portion and extra portion
  const validSlice = isOverLimit ? text.slice(0, allowedLimit) : text;
  const extraSlice = isOverLimit ? text.slice(allowedLimit) : "";

  // Synchronize scrolling between textarea and backdrop highlighter
  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  useEffect(() => {
    handleScroll();
  }, [text]);

  const currentCount = text.length;
  const progressPercent = Math.min(100, (currentCount / (allowedLimit || 1)) * 100);

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#0c0d12] shadow-xl shadow-slate-200/40 dark:shadow-black/40">
      {/* ── 1. Top Card Header (AI Voice Studio) ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800/80 px-6 py-4 bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>Al Voice Studio</span>
            <span className="rounded-md bg-orange-500/10 dark:bg-orange-950/60 px-1.5 py-0.2 text-[10px] font-black text-[#ff5500] dark:text-orange-400 border border-orange-500/25">
              V1.5.1
            </span>
          </span>
          <span className="hidden sm:inline text-xs text-slate-400 dark:text-zinc-500 font-medium">
            - Real-Time Neural Speech
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 dark:bg-zinc-800 px-3 py-1 text-xs font-bold text-slate-700 dark:text-zinc-300">
            {userType === "premium" ? "Pro AI Studio" : userType === "free" ? "Free Studio" : "Guest Mode"}
          </span>

          <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-[#ff5500] dark:text-orange-400 border border-orange-500/20">
            V1.5.1 Neural Engine
          </span>
        </div>
      </div>

      {/* ── 2. Inside Body ── */}
      <div className="p-5 sm:p-6 space-y-4">
        {/* Row: "Text Script" & "Try sample:" chips */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-sm sm:text-base">
            <span className="flex size-6 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 text-xs font-black">
              ✏️
            </span>
            <span>Text Script</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-semibold mr-1">
              Try sample:
            </span>
            {sampleTemplates.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onChange(s.text)}
                className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:border-orange-400 hover:text-orange-600 dark:hover:text-orange-400 transition cursor-pointer"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Textarea with extra characters highlight ── */}
        <div
          className={`relative rounded-2xl border transition-all duration-200 ${
            isOverLimit
              ? "border-red-400 dark:border-red-500 bg-red-50/20 dark:bg-red-950/20 ring-2 ring-red-500/10"
              : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10"
          }`}
        >
          {/* Synchronized Highlighter Backdrop (Over-limit characters in reddish) */}
          <div
            ref={backdropRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-auto whitespace-pre-wrap break-words p-4 font-sans text-sm sm:text-base leading-relaxed text-transparent select-none"
          >
            <span>{validSlice}</span>
            {isOverLimit && (
              <mark className="rounded-xs bg-red-500/25 dark:bg-red-500/35 text-transparent underline decoration-red-500 decoration-wavy decoration-1">
                {extraSlice}
              </mark>
            )}
          </div>

          {/* Actual Editable Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            placeholder="Paste or type your script here in Hindi, English, Tamil, Marathi, or any Indian/global language..."
            rows={10}
            className="relative z-10 w-full resize-y bg-transparent p-4 font-sans text-sm sm:text-base leading-relaxed text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-hidden min-h-[260px] sm:min-h-[290px]"
          />

          {text && (
            <button
              type="button"
              onClick={onClear}
              className="absolute top-3 right-3 z-20 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-2 py-0.5 text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-zinc-400 transition cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* ── Character Count Bar (Remaining chars hidden from studio, viewable in Account) ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/40 p-3 sm:px-4 sm:py-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-white dark:bg-zinc-800 px-3 py-1 font-semibold text-slate-600 dark:text-zinc-300 shadow-2xs border border-slate-200/60 dark:border-zinc-700">
              Input Script: <strong className="text-slate-900 dark:text-white font-extrabold">{currentCount} / {allowedLimit} characters</strong>
            </span>

            <Link
              href="/account"
              className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 hover:text-[#ff5500] dark:hover:text-orange-400 transition ml-1"
            >
              Account Balance →
            </Link>
          </div>

          {/* Progress bar + Count */}
          <div className="flex items-center gap-2.5 ml-auto">
            <div className="w-24 sm:w-32 h-2 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isOverLimit
                    ? "bg-red-500"
                    : progressPercent > 80
                    ? "bg-amber-500"
                    : "bg-[#ff5500]"
                }`}
                style={{ width: `${Math.min(100, progressPercent)}%` }}
              />
            </div>
            <span
              className={`font-black text-xs min-w-[50px] text-right ${
                isOverLimit ? "text-red-600 dark:text-red-400" : "text-slate-700 dark:text-zinc-300"
              }`}
            >
              {currentCount} / {allowedLimit}
            </span>
          </div>
        </div>

        {/* Over-limit Warning notice if text exceeds limit */}
        {isOverLimit && (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-3 text-xs text-red-700 dark:text-red-300">
            <span>
              ⚠️ <strong>Character limit exceeded!</strong> You have {extraChars} extra character(s) highlighted in red. Please trim to {allowedLimit} to convert.
            </span>
            <button
              type="button"
              onClick={() => onChange(text.slice(0, allowedLimit))}
              className="shrink-0 rounded-lg bg-red-600 px-2.5 py-1 text-white font-bold hover:bg-red-700 transition"
            >
              Trim to {allowedLimit}
            </button>
          </div>
        )}

        {/* ── 3. Info Alert Banner ── */}
        <div className="flex items-center gap-2 rounded-2xl bg-amber-500/[0.08] dark:bg-amber-500/[0.05] border border-amber-500/20 p-3 sm:px-4 text-xs font-semibold text-slate-800 dark:text-amber-200">
          <span className="text-base shrink-0">💡</span>
          <span>
            Sign in to get 500 extra characters and save your history for 24 hours.
          </span>
          {userType === "guest" && (
            <Link
              href="/login"
              className="ml-auto shrink-0 font-extrabold text-[#ff5500] hover:underline"
            >
              Sign In Free →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}