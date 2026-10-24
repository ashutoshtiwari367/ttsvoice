"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { siteConfig as TTS_DEFAULTS } from "@/config/site";
import AdSpacePromo from "./AdSpacePromo";
import ScriptEditor from "./ScriptEditor";
import VoiceControls from "./VoiceControls";
import GenerateButton from "./GenerateButton";
import AudioResult from "./AudioResult";
import RecentConversions from "./RecentConversions";

type Status = "idle" | "generating" | "ready" | "error";

const DEFAULT_BUSY_NOTICE =
  "Our servers are experiencing high demand right now. Please try again in 2 to 5 minutes.";

interface UserAllowanceState {
  isAuthenticated: boolean;
  userType: "guest" | "free" | "premium";
  tier: "anon" | "free" | "paid";
  totalAllowance: number;
  usedChars: number;
  remainingChars: number;
  singleReqCap: number;
  historyRetentionMinutes: number;
  historyRetentionLabel: string;
  historyNotice: string;
  isPremium: boolean;
  balance: number;
  reqCap: number;
  activePlanName?: string;
  customerNo?: number | null;
}

export default function TTSWorkspace() {
  const [text, setText] = useState("");
  const [speed, setSpeed] = useState<number>(TTS_DEFAULTS.tts.speed);
  const [lang, setLang] = useState<string>("hi-IN");
  const [voice, setVoice] = useState<string>("hi-IN-Wavenet-B");
  const [status, setStatus] = useState<Status>("idle");
  const [playing, setPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeAudio, setNoticeAudio] = useState<string | null>(null);
  const [userAllowance, setUserAllowance] = useState<UserAllowanceState | null>(null);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  const resultRef = useRef<HTMLDivElement | null>(null);

  const fetchAllowance = async () => {
    try {
      const res = await fetch("/api/user/credits");
      if (res.ok) {
        const data = await res.json();
        setUserAllowance(data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchAllowance();
    window.addEventListener("focus", fetchAllowance);
    window.addEventListener("auth-changed", fetchAllowance);
    window.addEventListener("credits-updated", fetchAllowance);
    return () => {
      window.removeEventListener("focus", fetchAllowance);
      window.removeEventListener("auth-changed", fetchAllowance);
      window.removeEventListener("credits-updated", fetchAllowance);
    };
  }, []);

  // Pick up ?lang=... from URL if directed from other pages
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get("lang");
      if (urlLang) {
        setLang(urlLang);
      }
    }
  }, []);

  // Character calculations
  const isPremium = userAllowance?.isPremium === true;
  const singleCap = isPremium
    ? (userAllowance?.reqCap ?? 10000)
    : 500;
  const remainingAllowance = userAllowance?.remainingChars ?? 500;
  const allowedLimit = Math.max(0, Math.min(singleCap, remainingAllowance));

  const isOverLimit = text.length > allowedLimit;
  const extraChars = isOverLimit ? text.length - allowedLimit : 0;
  const isAllowanceExhausted = remainingAllowance <= 0;

  const generateSpeech = async () => {
    if (!text.trim() || status === "generating" || isOverLimit || isAllowanceExhausted) {
      return;
    }

    setStatus("generating");
    setError(null);
    setErrorCode(null);
    setNotice(null);
    setNoticeAudio(null);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          lang,
          voice,
          speed,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const serverError = data.error || "Failed to generate speech";
        setError(serverError);
        setErrorCode(data.code || null);
        setStatus("error");
        fetchAllowance();
        return;
      }

      setAudioUrl(data.audioUrl);
      setStatus("ready");

      if (data.notice) {
        setNotice(data.notice);
        setNoticeAudio(data.noticeAudioUrl || null);
      }

      fetchAllowance();
      setHistoryRefreshTrigger((prev) => prev + 1);

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
    <section id="tool" className="mx-auto max-w-[1440px] px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-16">
      {/* Pro Subscriber Quick Status Bar (if logged in with active subscription) */}
      {isPremium && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.08] dark:bg-emerald-950/30 px-5 py-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-lg bg-emerald-500 text-white text-xs font-black">
              ⚡
            </span>
            <span className="font-bold text-slate-800 dark:text-zinc-200">
              Pro Studio Active: Customer #{userAllowance?.customerNo ?? "10000000"} ({userAllowance?.activePlanName ?? "Standard Pack"})
            </span>
          </div>

          <div className="flex items-center gap-3 font-semibold">
            <Link
              href="/account"
              className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3.5 py-1 font-extrabold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30 transition"
            >
              Manage in Account →
            </Link>
            <span className="text-slate-500 dark:text-zinc-400">
              Priority GPU Acceleration
            </span>
          </div>
        </div>
      )}

      {/* ── 3-COLUMN STUDIO LAYOUT (Matching user uploaded image) ── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-start gap-5 lg:gap-6">
        {/* 1. LEFT COLUMN: AD SPACE & PROMO CARD */}
        <AdSpacePromo />

        {/* 2. CENTER COLUMN: AI VOICE STUDIO SCRIPT EDITOR & CONVERT BUTTON */}
        <div className="flex-1 w-full min-w-0 space-y-5">
          <ScriptEditor
            text={text}
            onChange={setText}
            onClear={clearText}
            userType={userAllowance?.userType ?? "guest"}
            totalAllowance={userAllowance?.totalAllowance ?? 500}
            usedChars={userAllowance?.usedChars ?? 0}
            remainingChars={userAllowance?.remainingChars ?? 500}
            maxCharacters={singleCap}
            tier={userAllowance?.tier ?? "anon"}
            balance={userAllowance?.balance ?? 0}
          />

          {/* Prominent Wide Pill Action Button */}
          <GenerateButton
            generating={status === "generating"}
            disabled={
              !text.trim() ||
              status === "generating" ||
              isOverLimit ||
              isAllowanceExhausted
            }
            isOverLimit={isOverLimit}
            extraChars={extraChars}
            remainingAllowance={remainingAllowance}
            onClick={generateSpeech}
          />

          {/* Error Message Alert */}
          {error && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-5 py-3.5 text-xs font-semibold text-red-700 dark:text-red-300 shadow-sm animate-fadeIn"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">⚠️</span>
                <span>{error}</span>
              </div>
              {(errorCode === "insufficient_credits" ||
                errorCode === "daily_limit_reached" ||
                errorCode === "text_too_long" ||
                errorCode === "voice_not_allowed") && (
                <Link
                  href={userAllowance?.isAuthenticated ? "/pricing" : "/login"}
                  className="rounded-xl bg-red-600 hover:bg-red-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition"
                >
                  {userAllowance?.isAuthenticated ? "View Packs & Pricing →" : "Sign In Free →"}
                </Link>
              )}
            </div>
          )}

          {/* Server Notice */}
          {notice && (
            <div
              role="status"
              className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 p-4 text-xs font-semibold text-amber-800 dark:text-amber-300"
            >
              <p>{notice}</p>
              {noticeAudio && (
                <audio
                  className="mt-3 w-full"
                  src={noticeAudio}
                  controls
                  preload="none"
                />
              )}
              <button
                type="button"
                onClick={generateSpeech}
                className="mt-3 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-amber-700 cursor-pointer"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Audio Result Container (Shown when audio is generated) */}
          {(status === "ready" || status === "generating") && (
            <div
              ref={resultRef}
              className="rounded-[28px] border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#0c0d12] p-6 shadow-xl shadow-slate-200/40 dark:shadow-black/40 animate-fadeIn"
            >
              <AudioResult
                status={status}
                playing={playing}
                audioUrl={audioUrl}
                onPlay={() => setPlaying(!playing)}
              />
            </div>
          )}

          {/* Recent Conversions History */}
          <RecentConversions
            userType={userAllowance?.userType ?? "guest"}
            refreshTrigger={historyRefreshTrigger}
          />
        </div>

        {/* 3. RIGHT COLUMN: VOICE CONTROLS & AVATAR SELECTION */}
        <VoiceControls
          lang={lang}
          voice={voice}
          speed={speed}
          onLangChange={setLang}
          onVoiceChange={setVoice}
          onSpeedChange={setSpeed}
        />
      </div>
    </section>
  );
}
