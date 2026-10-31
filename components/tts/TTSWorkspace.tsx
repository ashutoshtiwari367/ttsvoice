"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { siteConfig as TTS_DEFAULTS } from "@/config/site";
import { AUDIO_CONTROL_SETTINGS, CHAR_LIMIT_CONTROL } from "@/config/control";
import { ALL_LANGUAGES_CATALOG } from "@/lib/tts/catalog";
import {
  getCachedAllowance,
  getCachedAuthUser,
  getUserPreferences,
  setCachedAllowance,
  setCachedAuthUser,
} from "@/lib/userPreferences";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
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
  const [speed, setSpeed] = useState<number>(AUDIO_CONTROL_SETTINGS.speed.default);
  const [pitch, setPitch] = useState<number>(AUDIO_CONTROL_SETTINGS.pitch.default);
  const [lang, setLang] = useState<string>(AUDIO_CONTROL_SETTINGS.defaultLanguage);
  const [voice, setVoice] = useState<string>(AUDIO_CONTROL_SETTINGS.defaultVoice);
  const [status, setStatus] = useState<Status>("idle");
  const [playing, setPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [generatedVoice, setGeneratedVoice] = useState<{
    id: string;
    label: string;
    gender: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeAudio, setNoticeAudio] = useState<string | null>(null);
  const [userAllowance, setUserAllowance] = useState<UserAllowanceState | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  const resultRef = useRef<HTMLDivElement | null>(null);
  const allowanceInFlightRef = useRef(false);

  const fetchAllowance = async () => {
    if (allowanceInFlightRef.current) return;
    allowanceInFlightRef.current = true;
    try {
      const supabase = createClient();
      const { data: sessData } = await supabase.auth.getSession();
      const token = sessData.session?.access_token;
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/user/credits", { headers, cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUserAllowance(data);
        setCachedAllowance(data);
      }
    } catch {
      // ignore
    } finally {
      allowanceInFlightRef.current = false;
    }
  };

  useEffect(() => {
    // 1. Instant 0ms hydration from local cache
    const cachedUser = getCachedAuthUser();
    if (cachedUser) {
      setAuthUser(cachedUser);
    }
    const cachedAllowance = getCachedAllowance<UserAllowanceState>();
    if (cachedAllowance) {
      setUserAllowance(cachedAllowance);
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setAuthUser(data.user);
        setCachedAuthUser(data.user);
      }
    });

    fetchAllowance();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;
      const nextUser = session?.user ?? null;
      setAuthUser(nextUser);
      setCachedAuthUser(nextUser);
      if (event === "SIGNED_OUT") {
        setUserAllowance(null);
        setCachedAllowance(null);
      }
      fetchAllowance();
    });
    const handleAuthSync = () => {
      const latestCachedUser = getCachedAuthUser();
      setAuthUser(latestCachedUser);
      const latestCached = getCachedAllowance<UserAllowanceState>();
      if (!latestCached) {
        setUserAllowance(null);
      }
      fetchAllowance();
    };
    window.addEventListener("auth-changed", handleAuthSync);
    window.addEventListener("credits-updated", fetchAllowance);
    return () => {
      listener.subscription.unsubscribe();
      window.removeEventListener("auth-changed", handleAuthSync);
      window.removeEventListener("credits-updated", fetchAllowance);
    };
  }, []);

  // Apply saved user default settings + URL query params (?lang=&voice=&speed=&pitch=)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const applyPreferencesAndQuery = () => {
      const prefs = getUserPreferences();
      const params = new URLSearchParams(window.location.search);

      const urlLang = params.get("lang");
      const urlVoice = params.get("voice");
      const urlSpeed = params.get("speed");
      const urlPitch = params.get("pitch");

      const targetLang = urlLang || prefs.defaultLanguage;
      const langMatch = ALL_LANGUAGES_CATALOG.find((l) => l.code === targetLang);

      if (langMatch) {
        setLang(langMatch.code);
        if (urlVoice && langMatch.voices.some((v) => v.id === urlVoice)) {
          setVoice(urlVoice);
        } else if (
          !urlLang &&
          prefs.defaultVoice &&
          langMatch.voices.some((v) => v.id === prefs.defaultVoice)
        ) {
          setVoice(prefs.defaultVoice);
        } else if (langMatch.voices.length > 0) {
          setVoice(langMatch.voices[0].id);
        }
      }

      if (urlSpeed && Number.isFinite(Number(urlSpeed))) {
        setSpeed(Number(urlSpeed));
      } else if (Number.isFinite(prefs.defaultSpeed)) {
        setSpeed(prefs.defaultSpeed);
      }

      if (urlPitch && Number.isFinite(Number(urlPitch))) {
        setPitch(Number(urlPitch));
      } else if (Number.isFinite(prefs.defaultPitch)) {
        setPitch(prefs.defaultPitch);
      }
    };

    applyPreferencesAndQuery();
    window.addEventListener("tts-preferences-updated", applyPreferencesAndQuery);
    return () => {
      window.removeEventListener("tts-preferences-updated", applyPreferencesAndQuery);
    };
  }, []);

  // Pause active audio playback whenever voice or language changes
  useEffect(() => {
    setPlaying(false);
  }, [voice, lang]);

  // Active selected voice metadata
  const currentLangEntry =
    ALL_LANGUAGES_CATALOG.find((l) => l.code === lang) || ALL_LANGUAGES_CATALOG[0];
  const currentVoiceEntry =
    currentLangEntry.voices.find((v) => v.id === voice) || currentLangEntry.voices[0];
  const hasVoiceChangedAfterGen =
    status === "ready" &&
    !!generatedVoice &&
    generatedVoice.id !== currentVoiceEntry.id;

  // Character calculations:
  // - Without Login (Guest): 500 characters
  // - With Login (Registered User): 1,000 characters
  const isLoggedIn = !!authUser || userAllowance?.isAuthenticated === true || (userAllowance && userAllowance.userType !== "guest");
  const isPremium = userAllowance?.isPremium === true;
  const defaultUserLimit = isLoggedIn ? 1000 : 500;

  const singleCap = isPremium
    ? (userAllowance?.reqCap ?? 10000)
    : (userAllowance?.singleReqCap ?? defaultUserLimit);
  const remainingAllowance = userAllowance?.remainingChars ?? defaultUserLimit;
  const allowedLimit = Math.max(0, Math.min(singleCap, remainingAllowance));

  const isOverLimit = text.length > allowedLimit;
  const extraChars = isOverLimit ? text.length - allowedLimit : 0;
  const isAllowanceExhausted = remainingAllowance <= 0;

  const generateSpeech = async () => {
    if (!text.trim() || status === "generating" || isOverLimit || isAllowanceExhausted) {
      return;
    }

    const requestedVoice = currentVoiceEntry;

    setPlaying(false);
    setAudioUrl(null);
    setStatus("generating");
    setError(null);
    setErrorCode(null);
    setNotice(null);
    setNoticeAudio(null);

    try {
      const supabase = createClient();
      const { data: sessData } = await supabase.auth.getSession();
      const token = sessData.session?.access_token;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({
          text,
          lang,
          voice: requestedVoice.id,
          speed,
          pitch,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errCode = data.error || data.code;
        setError(getErrorMessage(errCode, userAllowance?.userType));
        setErrorCode(errCode || null);
        setStatus("error");
        fetchAllowance();
        return;
      }

      if (data.busy) {
        setStatus("idle");
        setNotice(data.message || data.notice || DEFAULT_BUSY_NOTICE);
        setNoticeAudio(data.url || data.noticeAudioUrl || null);
        fetchAllowance();
        return;
      }

      const generatedAudio = data.url || data.audioUrl || null;
      setAudioUrl(generatedAudio);
      setGeneratedVoice({
        id: requestedVoice.id,
        label: requestedVoice.label,
        gender: requestedVoice.gender,
      });
      setStatus("ready");
      if (generatedAudio && getUserPreferences().autoPlay) {
        setPlaying(true);
      }

      if (data.notice || data.message) {
        setNotice(data.notice || data.message);
        setNoticeAudio(data.noticeAudioUrl || null);
      }

      // Optimistically deduct characters immediately so UI + Profile hover update in 0ms
      const usedNow = Number(data.chars ?? text.length) || 0;
      setUserAllowance((prev) => {
        if (!prev) return prev;
        const nextUsed = prev.usedChars + usedNow;
        const nextRemaining = Math.max(0, prev.remainingChars - usedNow);
        const nextSingleCap = prev.isPremium
          ? Math.min(prev.reqCap, nextRemaining)
          : Math.min(prev.totalAllowance, nextRemaining);
        const updated: UserAllowanceState = {
          ...prev,
          usedChars: nextUsed,
          remainingChars: nextRemaining,
          singleReqCap: nextSingleCap,
          balance: prev.isPremium ? nextRemaining : prev.balance,
        };
        setCachedAllowance(updated);
        return updated;
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("credits-updated"));
      }

      fetchAllowance();
      setHistoryRefreshTrigger((prev) => prev + 1);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    } catch (err) {
      console.error("generate_speech_error", err);
      setError("Something went wrong. Please check your connection and try again.");
      setStatus("error");
    }
  };

  const clearText = () => {
    setText("");
    setStatus("idle");
    setPlaying(false);
    setAudioUrl(null);
    setGeneratedVoice(null);
    setError(null);
    setErrorCode(null);
    setNotice(null);
    setNoticeAudio(null);
  };

  // Paid functions currently hidden — all users use the clean standard TTSWorkspace
  /*
  if (isPremium) {
    return (
      <PremiumStudioWorkspace
        initialText={text}
        userAllowance={userAllowance}
      />
    );
  }
  */

  return (
    <section id="tool" className="mx-auto max-w-[1440px] px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-16">
      {/* ── 3-COLUMN STUDIO LAYOUT (Mobile: Studio Top, Voice Controls Middle, Ad Space Bottom) ── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-start gap-5 lg:gap-6">
        {/* 1. LEFT COLUMN: AD SPACE & PROMO CARD (Mobile: bottom/order-3, Desktop: left/order-1) */}
        <AdSpacePromo className="order-3 lg:order-1" />

        {/* 2. CENTER COLUMN: AI VOICE STUDIO (Mobile: top/order-1, Desktop: center/order-2) */}
        <div className="order-1 lg:order-2 flex-1 w-full min-w-0 space-y-5">
          <ScriptEditor
            text={text}
            onChange={setText}
            onClear={clearText}
            userType={isLoggedIn ? (isPremium ? "premium" : "free") : "guest"}
            totalAllowance={userAllowance?.totalAllowance ?? defaultUserLimit}
            usedChars={userAllowance?.usedChars ?? 0}
            remainingChars={userAllowance?.remainingChars ?? defaultUserLimit}
            maxCharacters={allowedLimit}
            tier={userAllowance?.tier ?? (isLoggedIn ? "free" : "anon")}
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
            userType={isLoggedIn ? (isPremium ? "premium" : "free") : "guest"}
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
              {!userAllowance?.isAuthenticated &&
                (errorCode === "insufficient_credits" ||
                  errorCode === "daily_limit_reached" ||
                  errorCode === "text_too_long" ||
                  errorCode === "voice_not_allowed") && (
                <Link
                  href={CHAR_LIMIT_CONTROL.primaryLoginHref}
                  className="rounded-xl bg-gradient-to-r from-[#ff5500] to-[#ff7324] hover:from-[#f05000] hover:to-[#ff6815] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition"
                >
                  {CHAR_LIMIT_CONTROL.primaryLoginLabel} →
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
                generatedVoiceLabel={generatedVoice?.label}
                generatedVoiceGender={generatedVoice?.gender}
                pendingVoiceLabel={hasVoiceChangedAfterGen ? currentVoiceEntry.label : null}
                pendingVoiceGender={hasVoiceChangedAfterGen ? currentVoiceEntry.gender : null}
                onRegenerate={hasVoiceChangedAfterGen ? generateSpeech : undefined}
              />
            </div>
          )}

          {/* Recent Conversions History */}
          <RecentConversions
            userType={userAllowance?.userType ?? "guest"}
            refreshTrigger={historyRefreshTrigger}
          />
        </div>

        {/* 3. RIGHT COLUMN: VOICE CONTROLS & AVATAR SELECTION (Mobile: middle/order-2, Desktop: right/order-3) */}
        <VoiceControls
          lang={lang}
          voice={voice}
          speed={speed}
          pitch={pitch}
          onLangChange={setLang}
          onVoiceChange={setVoice}
          onSpeedChange={setSpeed}
          onPitchChange={setPitch}
          isAuthenticated={userAllowance?.isAuthenticated === true}
          onApplyTemplate={(tplText) => setText(tplText)}
          className="order-2 lg:order-3"
        />
      </div>
    </section>
  );
}

function getErrorMessage(code?: string, userType?: string) {
  switch (code) {
    case "daily_limit_reached":
    case "text_too_long":
      return userType === "guest"
        ? CHAR_LIMIT_CONTROL.apiGuestLimitError
        : CHAR_LIMIT_CONTROL.apiLoggedInLimitError;
    case "insufficient_credits":
      return "You do not have enough credits to complete this conversion. Please recharge your account.";
    case "voice_not_allowed":
      return "This premium studio voice requires an active Pro subscription.";
    case "capacity_reached":
      return "Our servers are currently experiencing high demand. Please try again in a few moments.";
    default:
      return "Failed to generate speech. Please try again.";
  }
}
