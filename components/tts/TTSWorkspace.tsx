"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { siteConfig as TTS_DEFAULTS } from "@/config/site";
import ScriptEditor from "./ScriptEditor";
import VoiceControls from "./VoiceControls";
import GenerateButton from "./GenerateButton";
import AudioResult from "./AudioResult";
import AdSlot from "../ads/AdSlot";

type Status = "idle" | "generating" | "ready" | "error";

const DEFAULT_BUSY_NOTICE =
  "Our servers are experiencing high demand right now. Please try again in 2 to 5 minutes.";

interface UserCreditsState {
  isAuthenticated: boolean;
  tier: "anon" | "free" | "paid";
  balance: number;
  reqCap: number;
  dayCap: number;
  weekCap: number;
  allowPremiumVoices: boolean;
}

export default function TTSWorkspace() {
  const [text, setText] = useState("");
  const [speed, setSpeed] = useState<number>(TTS_DEFAULTS.tts.speed);
  const [lang, setLang] = useState<string>("hi-IN");
  const [voice, setVoice] = useState<string>("hi-IN-Wavenet-A");
  const [status, setStatus] = useState<Status>("idle");
  const [playing, setPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeAudio, setNoticeAudio] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState<UserCreditsState | null>(null);

  const resultRef = useRef<HTMLDivElement | null>(null);

  const fetchCredits = async () => {
    try {
      const res = await fetch("/api/user/credits");
      if (res.ok) {
        const data = await res.json();
        setUserCredits(data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchCredits();
    window.addEventListener("focus", fetchCredits);
    window.addEventListener("auth-changed", fetchCredits);
    window.addEventListener("credits-updated", fetchCredits);
    return () => {
      window.removeEventListener("focus", fetchCredits);
      window.removeEventListener("auth-changed", fetchCredits);
      window.removeEventListener("credits-updated", fetchCredits);
    };
  }, []);

  // Pick up ?lang=... from URL if directed from home page language pills
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get("lang");
      if (urlLang) {
        setLang(urlLang);
      }
    }
  }, []);

  const generateSpeech = async () => {
    if (!text.trim() || status === "generating") {
      return;
    }

    setStatus("generating");
    setPlaying(false);
    setError(null);
    setErrorCode(null);
    setNotice(null);
    setNoticeAudio(null);
    setAudioUrl(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang, voice, speed }),
      });

      const data = await res.json();

      if (!res.ok) {
        const code = data?.error;
        setErrorCode(code);
        setError(messageFor(code));
        setStatus("error");
        return;
      }

      if (data.busy) {
        setNotice(typeof data.message === "string" && data.message ? data.message : DEFAULT_BUSY_NOTICE);
        setNoticeAudio(typeof data.url === "string" && data.url ? data.url : null);
        setStatus("idle");
        return;
      }

      setAudioUrl(data.url);
      setStatus("ready");

      // Refresh credits balance after spend
      fetchCredits();
      window.dispatchEvent(new Event("credits-updated"));

      setTimeout(() => {
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
      setStatus("error");
    }
  };

  const clearText = () => {
    setText("");
    setStatus("idle");
    setPlaying(false);
    setAudioUrl(null);
    setError(null);
    setErrorCode(null);
    setNotice(null);
    setNoticeAudio(null);
  };

  return (
    <section id="tool" className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-16">
      <div className="overflow-hidden rounded-[32px] border border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.03] shadow-2xl dark:shadow-[0_25px_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-colors">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] px-6 py-4.5 sm:px-8 bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <span className="dot-live" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              AI Voice Studio
            </span>
            <span className="hidden sm:inline text-xs text-slate-400 dark:text-zinc-500 font-medium">
              • Real-Time Neural Speech
            </span>
          </div>

          <div className="flex items-center gap-2">
            {userCredits?.tier === "paid" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-500 dark:text-emerald-400 border border-emerald-500/25">
                🪙 {userCredits.balance.toLocaleString()} Credits
              </span>
            )}
            <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-[#ff5500] dark:text-orange-400 border border-orange-500/20">
              v2.0 Neural Engine
            </span>
          </div>
        </div>

        {/* Editor and controls */}
        <div className="p-5 sm:p-8">
          <ScriptEditor
            text={text}
            onChange={setText}
            onClear={clearText}
            maxCharacters={userCredits?.reqCap ?? 500}
            tier={userCredits?.tier ?? "anon"}
            balance={userCredits?.balance ?? 0}
          />

          {/* Pricing promo card */}
          <div className="relative mt-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#ff6a1f] via-[#ff5500] to-amber-500 p-5 text-white shadow-xl shadow-orange-500/20 sm:p-6">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-12 size-48 rounded-full bg-white/15 blur-xl"
            />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-100">
                  Prepaid Voice Top-ups
                </span>
                <h2 className="mt-1 text-lg font-bold sm:text-xl">
                  Need more characters for your audio projects?
                </h2>
                <p className="mt-0.5 text-xs sm:text-sm text-orange-50/90">
                  High-definition Indian &amp; Global AI voices starting from just ₹29 via Razorpay
                </p>
              </div>

              <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                <p className="flex items-baseline gap-1">
                  <span className="text-xs font-semibold text-orange-100">From</span>
                  <span className="text-4xl sm:text-5xl font-black leading-none tracking-tight">
                    ₹29
                  </span>
                </p>

                <Link
                  href="/pricing"
                  className="btn-ghost px-5 py-2.5 text-xs sm:text-sm font-bold bg-white text-slate-900 shadow-md hover:bg-orange-50 transition"
                >
                  Explore Plans <span className="ml-1" aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Voice & Avatar Controls */}
          <VoiceControls
            lang={lang}
            voice={voice}
            speed={speed}
            onLangChange={setLang}
            onVoiceChange={setVoice}
            onSpeedChange={setSpeed}
          />

          {/* Generate Action Button */}
          <GenerateButton
            generating={status === "generating"}
            disabled={!text.trim() || status === "generating"}
            onClick={generateSpeech}
          />

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="mt-4 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/30 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300"
            >
              <div className="flex items-center gap-2.5">
                <svg className="size-5 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
              {(errorCode === "insufficient_credits" ||
                errorCode === "daily_limit_reached" ||
                errorCode === "weekly_limit_reached" ||
                errorCode === "voice_not_allowed") && (
                <Link
                  href="/pricing"
                  className="rounded-lg bg-red-600 hover:bg-red-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition"
                >
                  View Packs & Pricing →
                </Link>
              )}
            </div>
          )}

          {/* Server Notice */}
          {notice && (
            <div
              role="status"
              className="mt-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-800 dark:text-amber-300"
            >
              <p className="font-medium">{notice}</p>
              {noticeAudio && (
                <audio className="mt-3 w-full" src={noticeAudio} controls preload="none" />
              )}
              <button
                type="button"
                onClick={generateSpeech}
                className="mt-3 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-amber-700"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Result Container */}
        <div
          ref={resultRef}
          className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/60 p-6 sm:p-8 transition-colors"
        >
          <AudioResult
            status={status}
            playing={playing}
            audioUrl={audioUrl}
            onPlay={() => setPlaying(!playing)}
          />
        </div>
      </div>

      <div className="mt-8">
        <AdSlot format="leaderboard" label="Advertisement" />
      </div>
    </section>
  );
}

function messageFor(code?: string) {
  switch (code) {
    case "daily_limit_reached":
      return "You have reached today's free character limit. Sign in or top up to continue.";
    case "weekly_limit_reached":
      return "You have reached this week's free limit. Please try again in a few days.";
    case "monthly_limit_reached":
      return "You have reached this month's limit. Please top up to continue.";
    case "generation_limit_reached":
      return "You have reached today's generation limit. Please try again tomorrow.";
    case "region_unavailable":
      return "This service is currently not available in your region.";
    case "insufficient_credits":
      return "Not enough credits. Please recharge your account to continue.";
    case "voice_not_allowed":
      return "This voice requires a Pro plan. Upgrade to unlock.";
    case "text_too_long":
      return "Your script is too long. Please shorten your text or upgrade.";
    case "invalid_voice":
    case "unsupported_language":
      return "Please select a valid language and voice.";
    case "invalid_request":
      return "Please enter some text to generate.";
    case "rate_limited":
      return "Too many requests. Please wait a few seconds and try again.";
    case "blocked":
      return "Access is temporarily restricted. Please contact support.";
    default:
      return "Unable to generate speech. Please try again.";
  }
}
