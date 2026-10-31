"use client";

import Link from "next/link";
import { useRef, useEffect } from "react";
import { CHAR_LIMIT_CONTROL } from "@/config/control";

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
  totalAllowance,
  usedChars = 0,
  remainingChars,
  maxCharacters,
  tier = "anon",
  balance = 0,
}: ScriptEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);

  // Dynamic limits based on user type:
  // - Guest Users (Without Login): 500 characters
  // - Registered Users (With Login): 1,000 characters
  const isGuest = userType === "guest";
  const userTypeLimit = isGuest ? 500 : 1000;
  const effectiveMax = maxCharacters !== undefined ? maxCharacters : userTypeLimit;
  const effectiveRemaining = remainingChars !== undefined ? remainingChars : userTypeLimit;

  // Allowed characters for the current request
  const allowedLimit = Math.max(0, Math.min(effectiveMax, effectiveRemaining));
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

        {/* ── Textarea with character limit styling ── */}
        <div
          className={`relative rounded-2xl border transition-all duration-200 ${
            isOverLimit
              ? "border-red-500 bg-red-50/30 dark:bg-red-950/20 ring-2 ring-red-500/20"
              : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10"
          }`}
        >
          {/* Over-limit status pill on top right */}
          {isOverLimit && (
            <div className="absolute top-3 right-16 z-20 flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-950/90 border border-red-300 dark:border-red-800 px-2.5 py-0.5 text-[11px] font-black text-red-700 dark:text-red-300 shadow-2xs">
              <span>🔒</span>
              <span>{CHAR_LIMIT_CONTROL.badgeText}</span>
            </div>
          )}

          {/* Actual Editable Textarea (Turns red with low opacity when over limit) */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            placeholder="Paste or type your script here in Hindi, English, Tamil, Marathi, or any Indian/global language..."
            rows={10}
            className={`relative z-10 w-full resize-y bg-transparent p-4 font-sans text-sm sm:text-base leading-relaxed placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-hidden min-h-[260px] sm:min-h-[290px] transition-all duration-200 ${
              isOverLimit
                ? "text-red-600 dark:text-red-400 opacity-60 font-medium selection:bg-red-200 dark:selection:bg-red-900"
                : "text-slate-900 dark:text-zinc-100 opacity-100"
            }`}
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

        {/* ── Character Limit Bar (Only Limit Shown in Studio) ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/40 p-3 sm:px-4 sm:py-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-lg px-3 py-1 font-semibold shadow-2xs border transition ${
                isOverLimit
                  ? "bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300"
                  : "bg-white dark:bg-zinc-800 border-slate-200/60 dark:border-zinc-700 text-slate-600 dark:text-zinc-300"
              }`}
            >
              Character Limit:{" "}
              <strong
                className={`font-extrabold ${
                  isOverLimit ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"
                }`}
              >
                {currentCount} / {allowedLimit} characters
              </strong>
            </span>
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

        {/* ── High-Converting Call to Action Banner (Configurable via `config/control.ts`) ── */}
        {isOverLimit && (
          <div className="rounded-2xl border-2 border-red-500/50 bg-gradient-to-br from-red-500/10 via-orange-500/10 to-amber-500/5 dark:from-red-950/50 dark:via-orange-950/30 dark:to-zinc-900/60 p-4 sm:p-5 shadow-lg shadow-red-500/5 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white text-lg font-black shadow-md shadow-red-500/30">
                  🔒
                </span>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-red-600 dark:text-red-400 flex items-center gap-2">
                    <span>{CHAR_LIMIT_CONTROL.bannerTitle}</span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium mt-1 leading-relaxed">
                    {userType === "guest"
                      ? CHAR_LIMIT_CONTROL.guestBannerMessage
                      : CHAR_LIMIT_CONTROL.loggedInBannerMessage}
                  </p>
                </div>
              </div>

              {userType === "guest" && (
                <div className="flex items-center gap-2 sm:self-center shrink-0 pl-12 sm:pl-0">
                  <Link
                    href={CHAR_LIMIT_CONTROL.primaryLoginHref}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ff5500] to-[#ff7324] hover:from-[#f05000] hover:to-[#ff6815] text-white px-4 py-2.5 text-xs font-black shadow-md shadow-orange-500/25 transition active:scale-95 cursor-pointer text-center"
                  >
                    <span>{CHAR_LIMIT_CONTROL.primaryLoginLabel}</span>
                    <span>→</span>
                  </Link>
                  {CHAR_LIMIT_CONTROL.secondarySignupLabel && (
                    <Link
                      href={CHAR_LIMIT_CONTROL.secondarySignupHref}
                      className="rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 px-3.5 py-2.5 text-xs font-bold transition text-center"
                    >
                      {CHAR_LIMIT_CONTROL.secondarySignupLabel}
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 3. Info Alert Banner (Logged-in "Your free account audio history is saved automatically for 24 hours" commented out) ── */}
        {userType === "guest" && (
          <div className="flex items-center gap-2 rounded-2xl bg-amber-500/[0.08] dark:bg-amber-500/[0.05] border border-amber-500/20 p-3 sm:px-4 text-xs font-semibold text-slate-800 dark:text-amber-200">
            <span className="text-base shrink-0">💡</span>
            <span>{CHAR_LIMIT_CONTROL.guestInfoTipText}</span>
            <Link
              href={CHAR_LIMIT_CONTROL.primaryLoginHref}
              className="ml-auto shrink-0 font-extrabold text-[#ff5500] hover:underline"
            >
              {CHAR_LIMIT_CONTROL.guestInfoTipActionLabel}
            </Link>
          </div>
        )}
        {/*
        {userType !== "guest" && (
          <div className="flex items-center gap-2 rounded-2xl bg-amber-500/[0.08] dark:bg-amber-500/[0.05] border border-amber-500/20 p-3 sm:px-4 text-xs font-semibold text-slate-800 dark:text-amber-200">
            <span className="text-base shrink-0">💡</span>
            <span>{CHAR_LIMIT_CONTROL.loggedInInfoTipText}</span>
          </div>
        )}
        */}
      </div>
    </div>
  );
}