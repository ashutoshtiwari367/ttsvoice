"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ALL_LANGUAGES_CATALOG,
  type Language,
  type Voice,
} from "@/lib/tts/catalog";
import {
  AUDIO_CONTROL_SETTINGS,
  DEFAULT_PRESETS,
  PRESETS_STORAGE_KEY,
  SPEAKING_STYLE_MODES,
  type AudioOutputFormat,
  type VoicePreset,
} from "@/config/control";
import {
  getFavoriteVoices,
  getUserPreferences,
  toggleFavoriteVoiceItem,
  type FavoriteVoiceItem,
} from "@/lib/userPreferences";

export { ALL_LANGUAGES_CATALOG, DEFAULT_PRESETS, type Language, type Voice, type VoicePreset };

interface VoiceControlsProps {
  lang: string;
  voice: string;
  speed: number;
  pitch?: number;
  onLangChange: (lang: string) => void;
  onVoiceChange: (voice: string) => void;
  onSpeedChange: (speed: number) => void;
  onPitchChange?: (pitch: number) => void;
  isAuthenticated?: boolean;
  onApplyTemplate?: (text: string) => void;
  className?: string;
}

export default function VoiceControls({
  lang,
  voice,
  speed,
  pitch: pitchProp,
  onLangChange,
  onVoiceChange,
  onSpeedChange,
  onPitchChange,
  isAuthenticated,
  onApplyTemplate,
  className = "",
}: VoiceControlsProps) {
  // ── ACTIVE TAB: "voice" | "settings" | "templates" ──
  const [activeTab, setActiveTab] = useState<"voice" | "settings" | "templates">("voice");

  // ── Auth & Template Name Validation State ──
  const [user, setUser] = useState<any>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const isUserLoggedIn = isAuthenticated !== undefined ? isAuthenticated : !!user;

  const [selectedGender, setSelectedGender] = useState<"male" | "female">(
    AUDIO_CONTROL_SETTINGS.defaultGender
  );
  const [selectedStyle, setSelectedStyle] = useState<string>(
    AUDIO_CONTROL_SETTINGS.defaultStyle
  );
  const [showAllVoices, setShowAllVoices] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── Gender filter ("all" | "male" | "female") & Person/Language Dropdown state ──
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const [personDropdownOpen, setPersonDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [langSearch, setLangSearch] = useState("");
  const langDropdownRef = useRef<HTMLDivElement | null>(null);
  const langSearchInputRef = useRef<HTMLInputElement | null>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPersonDropdownOpen(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
        setLangSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Audio Settings State (defaults from `config/control.ts`) ──
  const [internalPitch, setInternalPitch] = useState<number>(AUDIO_CONTROL_SETTINGS.pitch.default);
  const pitch = pitchProp !== undefined ? pitchProp : internalPitch;
  const setPitch = (val: number) => {
    setInternalPitch(val);
    onPitchChange?.(val);
  };
  const [volume, setVolume] = useState<number>(AUDIO_CONTROL_SETTINGS.volume.default);
  const [outputFormat, setOutputFormat] = useState<AudioOutputFormat>(
    AUDIO_CONTROL_SETTINGS.defaultOutputFormat
  );
  const [sampleRate, setSampleRate] = useState<string>(AUDIO_CONTROL_SETTINGS.defaultSampleRate);
  const [naturalPauses, setNaturalPauses] = useState<boolean>(
    AUDIO_CONTROL_SETTINGS.defaultNaturalPauses
  );
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(
    AUDIO_CONTROL_SETTINGS.defaultAutoPlay
  );

  // Find active language and voice list
  const currentLangObj =
    ALL_LANGUAGES_CATALOG.find((l) => l.code === lang) ||
    ALL_LANGUAGES_CATALOG[0];

  const normalizedLangQuery = langSearch.trim().toLowerCase();
  const filteredLanguages = ALL_LANGUAGES_CATALOG.filter((l) => {
    if (!normalizedLangQuery) return true;
    return (
      l.label.toLowerCase().includes(normalizedLangQuery) ||
      l.code.toLowerCase().includes(normalizedLangQuery) ||
      l.voices.some((v) => v.label.toLowerCase().includes(normalizedLangQuery))
    );
  });

  const handleSelectLangItem = (selected: Language) => {
    onLangChange(selected.code);
    if (selected.voices.length > 0) {
      const sameGender =
        selected.voices.find((v) => v.gender === selectedGender && v.tier !== "paid") ||
        selected.voices.find((v) => v.gender === selectedGender);
      onVoiceChange(sameGender ? sameGender.id : selected.voices[0].id);
    }
    setLangSearch("");
    setLangDropdownOpen(false);
    setShowAllVoices(false);
  };

  const activeVoices = currentLangObj.voices;

  // Filter voices by gender filter
  const filteredVoices = activeVoices.filter((v) => {
    if (genderFilter === "male") return v.gender === "male";
    if (genderFilter === "female") return v.gender === "female";
    return true;
  });

  // Show only default 3 voices unless expanded ("person only default 3 hi show kro")
  const defaultVoiceLimit = AUDIO_CONTROL_SETTINGS.defaultVisibleVoices;
  const hasMoreVoices = filteredVoices.length > defaultVoiceLimit;
  const visibleVoices = (() => {
    if (showAllVoices || !hasMoreVoices) return filteredVoices;
    const topThree = filteredVoices.slice(0, defaultVoiceLimit);
    if (topThree.some((v) => v.id === voice)) return topThree;
    const activeMatch = filteredVoices.find((v) => v.id === voice);
    return activeMatch ? [...topThree.slice(0, defaultVoiceLimit - 1), activeMatch] : topThree;
  })();

  const getPersonNumber = (voiceId: string) => {
    const idx = activeVoices.findIndex((v) => v.id === voiceId);
    return idx >= 0 ? idx + 1 : 1;
  };

  const currentVoiceObj =
    activeVoices.find((v) => v.id === voice) || activeVoices[0];
  const currentPersonNum = getPersonNumber(currentVoiceObj.id);

  const sampleAudioRef = useRef<HTMLAudioElement | null>(null);
  const sampleObjectUrlRef = useRef<string | null>(null);
  const sampleAbortRef = useRef<AbortController | null>(null);

  const stopVoiceSample = () => {
    if (sampleAbortRef.current) {
      sampleAbortRef.current.abort();
      sampleAbortRef.current = null;
    }
    if (sampleAudioRef.current) {
      sampleAudioRef.current.pause();
      sampleAudioRef.current = null;
    }
    if (sampleObjectUrlRef.current) {
      URL.revokeObjectURL(sampleObjectUrlRef.current);
      sampleObjectUrlRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setLoadingVoiceId(null);
    setPlayingVoiceId(null);
  };

  // Sync selected gender from current voice
  useEffect(() => {
    const matched = activeVoices.find((v) => v.id === voice);
    if (matched) {
      setSelectedGender(matched.gender as "male" | "female");
    }
  }, [voice, lang]);

  // Stop any playing sample when language changes or component unmounts
  useEffect(() => {
    stopVoiceSample();
    return () => {
      stopVoiceSample();
    };
  }, [lang]);

  const handleGenderSelect = (gender: "male" | "female") => {
    setSelectedGender(gender);
    const currentMatches = activeVoices.find((v) => v.id === voice && v.gender === gender);
    if (currentMatches) return;
    const matchedVoice =
      activeVoices.find((v) => v.gender === gender && v.tier !== "paid") ||
      activeVoices.find((v) => v.gender === gender) ||
      activeVoices[0];
    if (matchedVoice) {
      onVoiceChange(matchedVoice.id);
    }
  };

  const handlePlayVoicePreview = async (targetVoice: Voice) => {
    if (typeof window === "undefined") return;

    // Clicking play on the voice currently playing/loading stops it
    if (playingVoiceId === targetVoice.id || loadingVoiceId === targetVoice.id) {
      stopVoiceSample();
      return;
    }

    stopVoiceSample();
    setLoadingVoiceId(targetVoice.id);

    const activeGender = (targetVoice.gender as "male" | "female") || selectedGender;
    const controller = new AbortController();
    sampleAbortRef.current = controller;

    try {
      const res = await fetch("/api/voices/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang,
          voice: targetVoice.id,
          speed,
          pitch,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        setLoadingVoiceId(null);
        setPlayingVoiceId(targetVoice.id);
        fallbackBrowserPreview(activeGender);
        return;
      }

      const blob = await res.blob();
      if (controller.signal.aborted) return;

      const objectUrl = URL.createObjectURL(blob);
      sampleObjectUrlRef.current = objectUrl;

      const audio = new Audio(objectUrl);
      audio.volume = Math.max(0.1, Math.min(1.0, volume / 100));
      sampleAudioRef.current = audio;

      setLoadingVoiceId(null);
      setPlayingVoiceId(targetVoice.id);

      audio.onended = () => {
        stopVoiceSample();
      };
      audio.onerror = () => {
        stopVoiceSample();
        setPlayingVoiceId(targetVoice.id);
        fallbackBrowserPreview(activeGender);
      };

      await audio.play();
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setLoadingVoiceId(null);
      setPlayingVoiceId(targetVoice.id);
      fallbackBrowserPreview(activeGender);
    }
  };

  const fallbackBrowserPreview = (gender: "male" | "female") => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const sampleText = lang.startsWith("hi")
        ? gender === "female"
          ? "नमस्ते! यह मेरी स्वाभाविक आवाज़ का टेस्ट सैंपल है।"
          : "नमस्ते! यह मेरी पुरुष आवाज़ का टेस्ट सैंपल है।"
        : "Hello! This is a test preview of my natural AI voice.";

      const utter = new SpeechSynthesisUtterance(sampleText);
      const voices = window.speechSynthesis.getVoices();
      const langVoices = voices.filter((v) =>
        v.lang.toLowerCase().startsWith(lang.split("-")[0].toLowerCase())
      );
      const genderHint =
        gender === "female"
          ? /female|swara|heera|kalpana|zira|samantha|victoria|aditi/i
          : /male|madhur|ravi|hemant|david|mark|alex|daniel|arjun/i;
      const picked = langVoices.find((v) => genderHint.test(v.name)) || langVoices[0];
      if (picked) utter.voice = picked;

      utter.rate = speed;
      const genderBasePitch = gender === "female" ? 1.18 : 0.82;
      utter.pitch = Math.max(0.5, Math.min(2.0, genderBasePitch + pitch * 0.08));
      utter.lang = lang;
      utter.onend = () => setPlayingVoiceId(null);
      utter.onerror = () => setPlayingVoiceId(null);
      window.speechSynthesis.speak(utter);
    } else {
      setTimeout(() => setPlayingVoiceId(null), 2000);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ── Voice Presets / Templates & Favorite Voices State ──
  const [presets, setPresets] = useState<VoicePreset[]>(DEFAULT_PRESETS);
  const [favoriteVoices, setFavoriteVoices] = useState<FavoriteVoiceItem[]>([]);
  const [presetNameInput, setPresetNameInput] = useState("");

  // Load custom saved templates, favorites & user preferences from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(PRESETS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPresets(parsed);
        }
      }
      setFavoriteVoices(getFavoriteVoices());

      const prefs = getUserPreferences();
      const params = new URLSearchParams(window.location.search);
      const urlStyle = params.get("style");
      if (urlStyle) {
        setSelectedStyle(urlStyle);
      } else if (prefs.defaultStyle) {
        setSelectedStyle(prefs.defaultStyle);
      }
      if (prefs.defaultVolume) setVolume(prefs.defaultVolume);
      if (prefs.outputFormat) setOutputFormat(prefs.outputFormat);
      if (typeof prefs.naturalPauses === "boolean") setNaturalPauses(prefs.naturalPauses);
      if (typeof prefs.autoPlay === "boolean") setAutoPlayAudio(prefs.autoPlay);
    } catch (e) {
      console.error("Failed to load saved templates", e);
    }

    const syncFavorites = () => setFavoriteVoices(getFavoriteVoices());
    window.addEventListener("tts-saved-voices-updated", syncFavorites);
    return () => window.removeEventListener("tts-saved-voices-updated", syncFavorites);
  }, []);

  const openSaveTemplateFlow = () => {
    if (!isUserLoggedIn) {
      setShowLoginPrompt(true);
      showToast("🔒 Please log in to save custom templates!");
      return;
    }
    setNameError(null);
    setPresetNameInput("");
    setSaveModalOpen(true);
  };

  const handleSavePreset = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = presetNameInput.trim();

    // 1. Template name is strictly required
    if (!trimmed) {
      setNameError("Template name is required");
      showToast("⚠️ Please enter a template name!");
      return;
    }
    setNameError(null);

    // 2. User must be logged in to save custom template
    if (!isUserLoggedIn) {
      setShowLoginPrompt(true);
      showToast("🔒 Please log in to save custom templates!");
      return;
    }

    const finalName = trimmed;

    const newPreset: VoicePreset = {
      id: `custom-${Date.now()}`,
      name: finalName,
      lang,
      langLabel: currentLangObj.label,
      langFlag: currentLangObj.flag,
      voice,
      voiceLabel: currentVoiceObj.label,
      gender: selectedGender,
      speed,
      pitch,
      volume,
      style: selectedStyle,
      naturalPauses,
      outputFormat,
      isCustom: true,
    };

    const updated = [newPreset, ...presets];
    setPresets(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to save template to localStorage", err);
      }
    }
    setPresetNameInput("");
    setSaveModalOpen(false);
    setActiveTab("templates");
    showToast(`Template "${finalName}" saved!`);
  };

  const handleApplyPreset = (tpl: VoicePreset) => {
    onLangChange(tpl.lang);
    onVoiceChange(tpl.voice);
    setSelectedGender(tpl.gender);
    onSpeedChange(tpl.speed);
    setPitch(tpl.pitch ?? 0);
    setVolume(tpl.volume ?? 100);
    setSelectedStyle(tpl.style === "story" ? "storytelling" : tpl.style || "normal");
    setNaturalPauses(tpl.naturalPauses ?? true);
    setOutputFormat(tpl.outputFormat || "mp3");

    showToast(`Template "${tpl.name}" applied!`);
    setActiveTab("voice");
  };

  const handleDeletePreset = (id: string, name: string) => {
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to delete template", err);
      }
    }
    showToast(`Template "${name}" removed`);
  };

  const styleModes = SPEAKING_STYLE_MODES;

  return (
    <aside className={`w-full lg:w-[350px] xl:w-[380px] shrink-0 font-sans ${className}`}>
      <div className="relative rounded-[28px] border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#0c0d12] p-5 sm:p-6 shadow-xl shadow-slate-200/40 dark:shadow-black/40">
        {/* Floating Notification Toast */}
        {toastMessage && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-50 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-1.5 text-xs font-bold shadow-lg animate-fadeIn flex items-center gap-2">
            <span>✨</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ── 3-TAB NAVIGATION HEADER (Voice | Settings | Templates) ── */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-3 mb-5">
          {/* Tab 1: Voice */}
          <button
            type="button"
            id="tab-voice"
            onClick={() => setActiveTab("voice")}
            className={`flex items-center gap-1.5 sm:gap-2 pb-2 text-xs sm:text-sm font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "voice"
                ? "border-orange-500 text-orange-600 dark:text-orange-400 font-extrabold"
                : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <svg
              className={`size-4 sm:size-4.5 ${
                activeTab === "voice" ? "text-orange-500" : "text-slate-400"
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 10v2a7 7 0 0 1-14 0v-2"
              />
              <line x1="12" y1="19" x2="12" y2="23" strokeLinecap="round" />
              <line x1="8" y1="23" x2="16" y2="23" strokeLinecap="round" />
            </svg>
            <span>Voice</span>
          </button>

          {/* Tab 2: Settings */}
          <button
            type="button"
            id="tab-settings"
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-1.5 sm:gap-2 pb-2 text-xs sm:text-sm font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "settings"
                ? "border-orange-500 text-orange-600 dark:text-orange-400 font-extrabold"
                : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <svg
              className={`size-4 sm:size-4.5 ${
                activeTab === "settings" ? "text-orange-500" : "text-slate-400"
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
              />
            </svg>
            <span>Settings</span>
          </button>

          {/* Tab 3: Templates */}
          <button
            type="button"
            id="tab-templates"
            onClick={() => setActiveTab("templates")}
            className={`flex items-center gap-1.5 sm:gap-2 pb-2 text-xs sm:text-sm font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "templates"
                ? "border-orange-500 text-orange-600 dark:text-orange-400 font-extrabold"
                : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <svg
              className={`size-4 sm:size-4.5 ${
                activeTab === "templates" ? "text-orange-500" : "text-slate-400"
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
            <span>Templates</span>
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ── TAB 1: VOICE TAB CONTENT ── */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "voice" && (
          <div className="space-y-5 animate-fadeIn">
            {/* 1. Select Language (Dropdown with Search Bar Inside) */}
            <div ref={langDropdownRef} className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                  <span className="flex size-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 text-[11px] font-bold">
                    🌐
                  </span>
                  <span>1. Select Language</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">
                  {ALL_LANGUAGES_CATALOG.length} Languages
                </span>
              </div>

              {/* Selected Language Dropdown Trigger */}
              <button
                type="button"
                onClick={() => {
                  const nextOpen = !langDropdownOpen;
                  setLangDropdownOpen(nextOpen);
                  if (nextOpen) {
                    setTimeout(() => langSearchInputRef.current?.focus(), 0);
                  } else {
                    setLangSearch("");
                  }
                }}
                aria-expanded={langDropdownOpen}
                className={`w-full flex items-center justify-between rounded-xl border bg-slate-50/80 dark:bg-zinc-900/60 px-3.5 py-2.5 text-left transition cursor-pointer ${
                  langDropdownOpen
                    ? "border-orange-500 ring-2 ring-orange-500/20"
                    : "border-slate-200/90 dark:border-zinc-800 hover:border-orange-400"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base leading-none shrink-0">{currentLangObj.flag}</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {currentLangObj.label}
                  </span>
                </div>

                <svg
                  className={`size-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                    langDropdownOpen ? "rotate-180 text-orange-500" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu with Search Bar Inside */}
              {langDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2.5 shadow-xl shadow-slate-900/15 dark:shadow-black/60 animate-fadeIn">
                  {/* Search Bar Inside Dropdown */}
                  <div className="relative flex items-center mb-2">
                    <svg
                      className="pointer-events-none absolute left-3 size-3.5 text-slate-400 dark:text-zinc-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.2"
                        d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      ref={langSearchInputRef}
                      type="text"
                      value={langSearch}
                      onChange={(e) => setLangSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (filteredLanguages.length > 0) {
                            handleSelectLangItem(filteredLanguages[0]);
                          }
                        } else if (e.key === "Escape") {
                          setLangDropdownOpen(false);
                          setLangSearch("");
                        }
                      }}
                      placeholder="Search language (Hindi, Tamil, English...)"
                      aria-label="Search language"
                      className="w-full rounded-xl border border-slate-200/90 dark:border-zinc-700/80 bg-slate-50 dark:bg-zinc-800/80 pl-8 pr-8 py-2 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-orange-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition"
                    />
                    {langSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setLangSearch("");
                          langSearchInputRef.current?.focus();
                        }}
                        title="Clear search"
                        className="absolute right-2.5 flex size-4.5 items-center justify-center rounded-full bg-slate-200/80 dark:bg-zinc-700 text-[10px] font-bold text-slate-600 dark:text-zinc-300 hover:bg-orange-500 hover:text-white transition cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between px-1.5 pb-1.5 mb-1 border-b border-slate-100 dark:border-zinc-800">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      {normalizedLangQuery
                        ? `Matching (${filteredLanguages.length})`
                        : `All Languages (${filteredLanguages.length})`}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setLangDropdownOpen(false);
                        setLangSearch("");
                      }}
                      className="text-[10px] font-bold text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition cursor-pointer"
                    >
                      Close ✕
                    </button>
                  </div>

                  {filteredLanguages.length > 0 ? (
                    <div className="max-h-56 overflow-y-auto space-y-1 pr-0.5">
                      {filteredLanguages.map((l) => {
                        const isSelected = l.code === lang;
                        return (
                          <button
                            key={l.code}
                            type="button"
                            onClick={() => handleSelectLangItem(l)}
                            className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-left transition cursor-pointer border ${
                              isSelected
                                ? "border-orange-500 bg-orange-50/80 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold shadow-xs"
                                : "border-transparent hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-slate-800 dark:text-zinc-200"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-base leading-none shrink-0">{l.flag}</span>
                              <div className="truncate">
                                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {l.label}
                                </div>
                                <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                                  {l.code} • {l.voices.length} {l.voices.length === 1 ? "voice" : "voices"}
                                </div>
                              </div>
                            </div>

                            {isSelected ? (
                              <span className="size-5 flex items-center justify-center rounded-full bg-orange-500 text-white text-xs font-black shrink-0 shadow-xs">
                                ✓
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 shrink-0">
                                Select
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-5 px-3 text-center space-y-2">
                      <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                        No language found for &ldquo;{langSearch}&rdquo;
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setLangSearch("");
                          langSearchInputRef.current?.focus();
                        }}
                        className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                      >
                        Show all languages
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Select Voice Avatar & Person */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                  <span className="flex size-5 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950/60 text-[#ff5500] text-[11px] font-bold">
                    👤
                  </span>
                  <span>2. Select Voice Avatar</span>
                </div>

                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">
                  {filteredVoices.length} {filteredVoices.length === 1 ? "Voice" : "Voices"}
                </span>
              </div>

              {/* Compact Avatar Filter: All | Male | Female with small images */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {/* Option 1: All */}
                <button
                  type="button"
                  onClick={() => setGenderFilter("all")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-1.5 px-2 text-xs font-bold transition-all cursor-pointer ${
                    genderFilter === "all"
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 shadow-xs ring-1 ring-orange-500/20"
                      : "border-slate-200/90 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40 text-slate-600 dark:text-zinc-400 hover:border-orange-300"
                  }`}
                >
                  <span className="flex size-6 items-center justify-center rounded-full bg-slate-200 dark:bg-zinc-800 text-[11px] font-bold">
                    👥
                  </span>
                  <span>All</span>
                </button>

                {/* Option 2: Male (small male avatar image) */}
                <button
                  type="button"
                  onClick={() => {
                    setGenderFilter("male");
                    handleGenderSelect("male");
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-1.5 px-2 text-xs font-bold transition-all cursor-pointer ${
                    genderFilter === "male"
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 shadow-xs ring-1 ring-orange-500/20"
                      : "border-slate-200/90 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40 text-slate-600 dark:text-zinc-400 hover:border-orange-300"
                  }`}
                >
                  <div className="relative size-6 shrink-0 overflow-hidden rounded-full border border-blue-400/80 shadow-xs">
                    <Image
                      src="/images/male-avatar.jpg"
                      alt="Male"
                      fill
                      className="object-cover"
                      sizes="24px"
                    />
                  </div>
                  <span>Male</span>
                </button>

                {/* Option 3: Female (small female avatar image) */}
                <button
                  type="button"
                  onClick={() => {
                    setGenderFilter("female");
                    handleGenderSelect("female");
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-1.5 px-2 text-xs font-bold transition-all cursor-pointer ${
                    genderFilter === "female"
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 shadow-xs ring-1 ring-orange-500/20"
                      : "border-slate-200/90 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40 text-slate-600 dark:text-zinc-400 hover:border-orange-300"
                  }`}
                >
                  <div className="relative size-6 shrink-0 overflow-hidden rounded-full border border-pink-400/80 shadow-xs">
                    <Image
                      src="/images/female-avatar.jpg"
                      alt="Female"
                      fill
                      className="object-cover"
                      sizes="24px"
                    />
                  </div>
                  <span>Female</span>
                </button>
              </div>

              {/* Voice Persons Box (Default 3 shown, expandable if more) */}
              <div className="mt-3 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50 p-2.5 shadow-xs">
                <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-200/60 dark:border-zinc-800/80 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Voice Persons ({visibleVoices.length}
                    {hasMoreVoices && !showAllVoices ? `/${filteredVoices.length}` : ""})
                  </span>
                  {hasMoreVoices ? (
                    <button
                      type="button"
                      onClick={() => setShowAllVoices((prev) => !prev)}
                      className="text-[10px] font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{showAllVoices ? "Show 3 default" : `View all (${filteredVoices.length})`}</span>
                      <span>{showAllVoices ? "↑" : "↓"}</span>
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">
                      Default
                    </span>
                  )}
                </div>

                {/* Default 3 voice persons (scrollable when expanded) */}
                <div
                  className={`space-y-1.5 pt-1 pl-1 pr-1 ${
                    showAllVoices ? "max-h-[210px] overflow-y-auto" : ""
                  }`}
                >
                  {visibleVoices.map((v) => {
                    const pNum = getPersonNumber(v.id);
                    const isSelected = v.id === voice;
                    const isPlayingThis = playingVoiceId === v.id;
                    const isLoadingThis = loadingVoiceId === v.id;

                    return (
                      <div
                        key={v.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          onVoiceChange(v.id);
                          setSelectedGender(v.gender as "male" | "female");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onVoiceChange(v.id);
                            setSelectedGender(v.gender as "male" | "female");
                          }
                        }}
                        className={`w-full flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left transition-all cursor-pointer border ${
                          isSelected
                            ? "border-orange-500 bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 font-bold shadow-xs ring-1 ring-orange-500/20"
                            : "border-transparent bg-white/70 dark:bg-zinc-800/40 hover:bg-white dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:border-slate-200 dark:hover:border-zinc-700"
                        }`}
                      >
                        {/* Left Side: Male/Female Avatar with Selection Tick on top-left + Voice Info */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative size-8.5 shrink-0">
                            <div
                              className={`relative size-8.5 overflow-hidden rounded-xl border transition-all shadow-xs ${
                                isSelected
                                  ? "border-orange-500 ring-2 ring-orange-500/20"
                                  : "border-slate-200 dark:border-zinc-700"
                              }`}
                            >
                              <Image
                                src={
                                  v.gender === "female"
                                    ? "/images/female-avatar.jpg"
                                    : "/images/male-avatar.jpg"
                                }
                                alt={v.label}
                                fill
                                className="object-cover"
                                sizes="34px"
                              />
                            </div>

                            {/* Selection Tick on Male/Female Avatar (Left Side) */}
                            <span
                              className={`absolute -top-1 -left-1 z-10 flex size-4 items-center justify-center rounded-full text-[9px] font-black shadow-xs transition-all ${
                                isSelected
                                  ? "bg-orange-500 text-white ring-2 ring-white dark:ring-zinc-800"
                                  : "bg-white/95 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-600 text-transparent"
                              }`}
                              aria-hidden="true"
                            >
                              ✓
                            </span>
                          </div>

                          <div className="truncate">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                                Person {pNum}: {v.label.split(" ")[0]}
                              </span>
                              <span
                                className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                                  v.gender === "female"
                                    ? "bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300"
                                    : "bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300"
                                }`}
                              >
                                {v.gender}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                              {v.label}
                            </div>
                          </div>
                        </div>

                        {/* Right Side: Per-Voice Play / Stop Sample Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayVoicePreview(v);
                          }}
                          title={
                            isPlayingThis || isLoadingThis
                              ? `Stop ${v.label.split(" ")[0]} sample`
                              : `Play ${v.label.split(" ")[0]} voice sample`
                          }
                          aria-label={
                            isPlayingThis || isLoadingThis
                              ? `Stop ${v.label} sample`
                              : `Play ${v.label} sample`
                          }
                          className={`flex size-7.5 shrink-0 items-center justify-center rounded-full border transition-all cursor-pointer ${
                            isPlayingThis || isLoadingThis
                              ? "border-orange-500 bg-orange-500 text-white shadow-sm ring-2 ring-orange-500/25"
                              : "border-orange-200/90 dark:border-orange-800/60 bg-orange-50/80 dark:bg-orange-950/40 text-[#ff5500] dark:text-orange-400 hover:bg-orange-500 hover:border-orange-500 hover:text-white shadow-2xs"
                          }`}
                        >
                          {isLoadingThis ? (
                            <span className="size-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                          ) : isPlayingThis ? (
                            <svg className="size-3.5" fill="currentColor" viewBox="0 0 24 24">
                              <rect x="6" y="5" width="4" height="14" rx="1" />
                              <rect x="14" y="5" width="4" height="14" rx="1" />
                            </svg>
                          ) : (
                            <svg className="size-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <polygon points="6 4 20 12 6 20 6 4" />
                            </svg>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {hasMoreVoices && (
                  <button
                    type="button"
                    onClick={() => setShowAllVoices((prev) => !prev)}
                    className="mt-2 w-full rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-800/60 hover:border-orange-400 py-1.5 text-[11px] font-bold text-slate-600 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 transition cursor-pointer"
                  >
                    {showAllVoices
                      ? "Show Less (Default 3) ▴"
                      : `Show More Voices (+${filteredVoices.length - defaultVoiceLimit}) ▾`}
                  </button>
                )}
              </div>
            </div>

            {/* 3. Speaking Style / Mode */}
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 mb-2.5">
                <span className="flex size-5 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 text-[11px] font-bold">
                  📶
                </span>
                <span>3. Speaking Style / Mode</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {styleModes.map((m) => {
                  const active = selectedStyle === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedStyle(m.id);
                        if (m.id !== "other") {
                          onSpeedChange(m.speed);
                          setPitch(m.pitch);
                        }
                      }}
                      className={`flex items-center gap-2 rounded-xl border py-2 px-2.5 text-xs font-bold transition cursor-pointer ${
                        active
                          ? "border-orange-500 bg-orange-50/70 dark:bg-orange-950/30 text-[#ff5500] dark:text-orange-400 shadow-xs"
                          : "border-slate-200/80 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 text-slate-700 dark:text-zinc-300 hover:border-orange-300"
                      }`}
                    >
                      <span className="shrink-0">{m.icon}</span>
                      <span className="truncate">{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Inline Custom Controls when "Other" Speaking Style is selected */}
              {selectedStyle === "other" && (
                <div className="mt-2.5 rounded-xl border border-orange-200/80 dark:border-orange-900/50 bg-orange-50/40 dark:bg-zinc-900/70 p-2.5 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                    <span>Custom Speed</span>
                    <span className="text-orange-600 dark:text-orange-400">{speed.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={AUDIO_CONTROL_SETTINGS.speed.min}
                    max={AUDIO_CONTROL_SETTINGS.speed.max}
                    step={AUDIO_CONTROL_SETTINGS.speed.step}
                    value={speed}
                    onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                    className="w-full accent-[#ff5500] h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
                  />

                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-zinc-300 pt-1">
                    <span>Custom Pitch</span>
                    <span className="text-purple-600 dark:text-purple-400">
                      {pitch > 0 ? `+${pitch}` : pitch} st
                    </span>
                  </div>
                  <input
                    type="range"
                    min={AUDIO_CONTROL_SETTINGS.pitch.min}
                    max={AUDIO_CONTROL_SETTINGS.pitch.max}
                    step={AUDIO_CONTROL_SETTINGS.pitch.step}
                    value={pitch}
                    onChange={(e) => setPitch(parseInt(e.target.value, 10))}
                    className="w-full accent-purple-600 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Quick Action: Save as Template */}
            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80">
              <button
                type="button"
                onClick={openSaveTemplateFlow}
                className="w-full flex items-center justify-between rounded-xl bg-orange-50/70 hover:bg-orange-100/90 dark:bg-orange-950/20 dark:hover:bg-orange-950/40 border border-orange-200/80 dark:border-orange-900/40 px-3 py-2 text-xs font-bold text-orange-600 dark:text-orange-400 transition cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <span>💾</span>
                  <span>Save this Voice as Template</span>
                </span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ── TAB 2: SETTINGS TAB CONTENT ── */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "settings" && (
          <div className="space-y-5 animate-fadeIn">
            {/* 1. Speech Speed */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                  <span className="flex size-5 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950/60 text-[#ff5500] text-[11px] font-bold">
                    ⏱️
                  </span>
                  <span>Speech Speed</span>
                </div>

                <span className="rounded-md bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/60 px-2 py-0.5 text-xs font-extrabold text-[#ff5500] dark:text-orange-400">
                  {speed.toFixed(1)}x
                </span>
              </div>

              <input
                type="range"
                min={AUDIO_CONTROL_SETTINGS.speed.min}
                max={AUDIO_CONTROL_SETTINGS.speed.max}
                step={AUDIO_CONTROL_SETTINGS.speed.step}
                value={speed}
                onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                className="w-full accent-[#ff5500] h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500 font-semibold mt-1">
                <span>{AUDIO_CONTROL_SETTINGS.speed.min}x Slow</span>
                <span>{AUDIO_CONTROL_SETTINGS.speed.default.toFixed(1)}x Normal</span>
                <span>{AUDIO_CONTROL_SETTINGS.speed.max.toFixed(1)}x Fast</span>
              </div>
            </div>

            {/* 2. Audio Pitch / Tone */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                  <span className="flex size-5 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 text-[11px] font-bold">
                    🎵
                  </span>
                  <span>Audio Pitch</span>
                </div>
                <span className="rounded-md bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/60 px-2 py-0.5 text-xs font-extrabold text-purple-600 dark:text-purple-400">
                  {pitch > 0 ? `+${pitch}` : pitch} st
                </span>
              </div>

              <input
                type="range"
                min={AUDIO_CONTROL_SETTINGS.pitch.min}
                max={AUDIO_CONTROL_SETTINGS.pitch.max}
                step={AUDIO_CONTROL_SETTINGS.pitch.step}
                value={pitch}
                onChange={(e) => setPitch(parseInt(e.target.value, 10))}
                className="w-full accent-purple-600 h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500 font-semibold mt-1">
                <span>Deep ({AUDIO_CONTROL_SETTINGS.pitch.min}st)</span>
                <span>Natural ({AUDIO_CONTROL_SETTINGS.pitch.default}st)</span>
                <span>High (+{AUDIO_CONTROL_SETTINGS.pitch.max}st)</span>
              </div>
            </div>

            {/* Audio Volume / Gain */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                  <span className="flex size-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 text-[11px] font-bold">
                    🔊
                  </span>
                  <span>Audio Gain / Volume</span>
                </div>
                <span className="rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                  {volume}%
                </span>
              </div>

              <input
                type="range"
                min={AUDIO_CONTROL_SETTINGS.volume.min}
                max={AUDIO_CONTROL_SETTINGS.volume.max}
                step={AUDIO_CONTROL_SETTINGS.volume.step}
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-600 h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500 font-semibold mt-1">
                <span>{AUDIO_CONTROL_SETTINGS.volume.min}% Soft</span>
                <span>{AUDIO_CONTROL_SETTINGS.volume.default}% Standard</span>
                <span>{AUDIO_CONTROL_SETTINGS.volume.max}% Boost</span>
              </div>
            </div>

            {/* Output Format */}
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 mb-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 text-[11px] font-bold">
                  💿
                </span>
                <span>Audio Format</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {AUDIO_CONTROL_SETTINGS.outputFormats.map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setOutputFormat(fmt)}
                    className={`rounded-xl border py-2 text-center text-xs font-extrabold uppercase transition cursor-pointer ${
                      outputFormat === fmt
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600 shadow-xs"
                        : "border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:border-orange-300"
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Sample Rate */}
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 mb-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 text-[11px] font-bold">
                  ⚡
                </span>
                <span>Sampling Quality</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {AUDIO_CONTROL_SETTINGS.sampleRates.map((sr) => (
                  <button
                    key={sr}
                    type="button"
                    onClick={() => setSampleRate(sr)}
                    className={`rounded-xl border py-2 text-center text-xs font-bold transition cursor-pointer ${
                      sampleRate === sr
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 shadow-xs"
                        : "border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:border-blue-300"
                    }`}
                  >
                    {sr}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="text-xs">
                  <div className="font-bold text-slate-800 dark:text-zinc-200">
                    Natural Punctuation Pauses
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                    Auto-insert commas & period breath pauses
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={naturalPauses}
                  onChange={(e) => setNaturalPauses(e.target.checked)}
                  className="size-4.5 accent-orange-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div className="text-xs">
                  <div className="font-bold text-slate-800 dark:text-zinc-200">
                    Auto-Play on Generation
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                    Play speech immediately when ready
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoPlayAudio}
                  onChange={(e) => setAutoPlayAudio(e.target.checked)}
                  className="size-4.5 accent-orange-500 rounded cursor-pointer"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => {
                onSpeedChange(AUDIO_CONTROL_SETTINGS.speed.default);
                setPitch(AUDIO_CONTROL_SETTINGS.pitch.default);
                setVolume(AUDIO_CONTROL_SETTINGS.volume.default);
                setOutputFormat(AUDIO_CONTROL_SETTINGS.defaultOutputFormat);
                setSampleRate(AUDIO_CONTROL_SETTINGS.defaultSampleRate);
                setNaturalPauses(AUDIO_CONTROL_SETTINGS.defaultNaturalPauses);
                setAutoPlayAudio(AUDIO_CONTROL_SETTINGS.defaultAutoPlay);
                showToast("Default settings restored!");
              }}
              className="w-full text-center text-xs font-semibold text-slate-500 hover:text-orange-600 dark:text-zinc-400 dark:hover:text-orange-400 pt-2 transition cursor-pointer"
            >
              Reset to Recommended Settings
            </button>

            {/* Quick Action: Save as Template */}
            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80">
              <button
                type="button"
                onClick={openSaveTemplateFlow}
                className="w-full flex items-center justify-between rounded-xl bg-orange-50/70 hover:bg-orange-100/90 dark:bg-orange-950/20 dark:hover:bg-orange-950/40 border border-orange-200/80 dark:border-orange-900/40 px-3 py-2 text-xs font-bold text-orange-600 dark:text-orange-400 transition cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <span>💾</span>
                  <span>Save Settings as Template</span>
                </span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ── TAB 3: TEMPLATES TAB (VOICE PRESETS) ── */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "templates" && (
          <div className="space-y-3 animate-fadeIn">
            {/* Header: Title + '+ Save Current' Button */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800/80">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                    Saved Templates
                  </span>
                  <span className="text-[10px] font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full">
                    {presets.length}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium mt-0.5">
                  Click Apply to load voice & settings
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const res = toggleFavoriteVoiceItem({
                      voiceId: currentVoiceObj.id,
                      voiceLabel: currentVoiceObj.label,
                      gender: (currentVoiceObj.gender as "male" | "female") || selectedGender,
                      langCode: currentLangObj.code,
                      langLabel: currentLangObj.label,
                      langFlag: currentLangObj.flag,
                    });
                    setFavoriteVoices(res.favorites);
                    showToast(
                      res.isSaved
                        ? `★ Added ${currentVoiceObj.label.split(" ")[0]} to Saved Voices!`
                        : `Removed from Saved Voices`
                    );
                  }}
                  title="Star current voice to Favorites"
                  className="flex items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-bold px-2.5 py-1.5 transition cursor-pointer"
                >
                  <span>
                    {favoriteVoices.some((f) => f.voiceId === currentVoiceObj.id) ? "★" : "☆"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={openSaveTemplateFlow}
                  className="flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold px-3 py-1.5 shadow-xs transition cursor-pointer shrink-0"
                >
                  <span>💾</span>
                  <span>+ Save Current</span>
                </button>
              </div>
            </div>

            {/* Quick Favorite Voices Strip */}
            {favoriteVoices.length > 0 && (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.05] p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  <span>★ Favorite Voices ({favoriteVoices.length})</span>
                  <Link href="/saved-voices" className="hover:underline">
                    Manage →
                  </Link>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {favoriteVoices.slice(0, 6).map((fav) => (
                    <button
                      key={fav.voiceId}
                      type="button"
                      onClick={() => {
                        onLangChange(fav.langCode);
                        onVoiceChange(fav.voiceId);
                        setSelectedGender(fav.gender);
                        showToast(`Selected ${fav.voiceLabel.split(" ")[0]}!`);
                        setActiveTab("voice");
                      }}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold transition cursor-pointer ${
                        voice === fav.voiceId
                          ? "border-orange-500 bg-orange-500 text-white"
                          : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 hover:border-orange-400"
                      }`}
                    >
                      <span>{fav.langFlag}</span>
                      <span>{fav.voiceLabel.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Compact Saved Templates List */}
            <div className="max-h-[460px] overflow-y-auto space-y-2 pr-1">
              {presets.map((tpl) => (
                <div
                  key={tpl.id}
                  className="group rounded-xl border border-slate-200/90 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30 p-2.5 hover:border-orange-500/60 hover:bg-white dark:hover:bg-zinc-900 transition shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    {/* Left: Avatar + Title & Meta */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative size-8 shrink-0 overflow-hidden rounded-full border border-slate-200 dark:border-zinc-700 shadow-2xs">
                        <Image
                          src={
                            tpl.gender === "female"
                              ? "/images/female-avatar.jpg"
                              : "/images/male-avatar.jpg"
                          }
                          alt={tpl.name}
                          fill
                          className="object-cover"
                          sizes="32px"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {tpl.name}
                          </span>
                          {tpl.isCustom && (
                            <span className="text-[8px] font-black uppercase px-1 py-0.2 rounded bg-orange-100 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400 shrink-0">
                              Custom
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                          <span>{tpl.langFlag}</span>
                          <span className="truncate">{tpl.voiceLabel.split(" ")[0]}</span>
                          <span>•</span>
                          <span>{tpl.speed.toFixed(1)}x</span>
                          <span>•</span>
                          <span className="capitalize">{tpl.style}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Apply & Dustbin Delete buttons side-by-side */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleApplyPreset(tpl)}
                        className="rounded-lg border border-orange-500/30 bg-orange-50 hover:bg-orange-500 dark:bg-orange-950/30 dark:hover:bg-orange-500 text-orange-600 hover:text-white dark:text-orange-400 dark:hover:text-white px-2.5 py-1 text-[11px] font-extrabold transition shadow-2xs cursor-pointer"
                      >
                        Apply
                      </button>

                      <button
                        type="button"
                        title="Delete Template"
                        onClick={() => handleDeletePreset(tpl.id, tpl.name)}
                        className="size-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                      >
                        {/* Dustbin / Trash Can Icon */}
                        <svg
                          className="size-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {presets.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400 dark:text-zinc-500">
                  <p className="font-semibold">No templates found.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setPresets(DEFAULT_PRESETS);
                      if (typeof window !== "undefined") {
                        localStorage.removeItem(PRESETS_STORAGE_KEY);
                      }
                      showToast("Default templates restored!");
                    }}
                    className="mt-2 text-orange-500 hover:underline font-bold text-xs cursor-pointer"
                  >
                    Restore Starter Templates
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Login Prompt Modal (Shown when unauthenticated user attempts to save) ── */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121318] p-5 shadow-2xl text-center">
            <div className="mx-auto size-12 flex items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 text-xl font-bold mb-3">
              🔒
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">
              Login Required to Save
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4 leading-relaxed">
              Custom voice templates are saved to your account so you can reuse them anytime. Please log in or sign up to save your templates.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 rounded-xl border border-slate-200 dark:border-zinc-800 py-2 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <Link
                href="/login"
                className="flex-1 rounded-xl bg-orange-500 hover:bg-orange-600 py-2 text-xs font-bold text-white shadow-xs transition text-center"
              >
                Log In Now →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Save Voice Template Modal (Shown when user clicks Save Template) ── */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121318] p-5 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 text-sm font-bold">
                  💾
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Save Voice Template
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                    Save active voice & settings
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSaveModalOpen(false);
                  setNameError(null);
                }}
                className="size-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 text-sm font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Current Settings Preview */}
            <div className="my-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50 p-2.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1.5">
                Current Settings Preview:
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative size-7 shrink-0 overflow-hidden rounded-full border border-slate-200 dark:border-zinc-700">
                    <Image
                      src={
                        selectedGender === "female"
                          ? "/images/female-avatar.jpg"
                          : "/images/male-avatar.jpg"
                      }
                      alt="Voice"
                      fill
                      className="object-cover"
                      sizes="28px"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {currentVoiceObj.label.split(" ")[0]}
                      </span>
                      <span
                        className={`text-[8px] font-black uppercase px-1 py-0.2 rounded ${
                          selectedGender === "female"
                            ? "bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300"
                            : "bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300"
                        }`}
                      >
                        {selectedGender === "female" ? "Fem" : "Male"}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                      {currentLangObj.label}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-zinc-400 shrink-0">
                  <span className="rounded bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 border border-orange-200/60 dark:border-orange-900/40">
                    {speed.toFixed(1)}x
                  </span>
                  <span className="rounded bg-slate-200/70 dark:bg-zinc-800 px-1.5 py-0.5 capitalize">
                    {selectedStyle}
                  </span>
                </div>
              </div>
            </div>

            {/* Template Name Form */}
            <form onSubmit={handleSavePreset} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-zinc-200 mb-1.5">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={presetNameInput}
                  onChange={(e) => {
                    setPresetNameInput(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  placeholder="e.g. YouTube Explainer, Story Voice..."
                  className={`w-full rounded-xl border bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition ${
                    nameError
                      ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-slate-200 dark:border-zinc-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  }`}
                />
                {nameError && (
                  <p className="text-[11px] font-bold text-red-500 mt-1">
                    ⚠️ Please enter a template name.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSaveModalOpen(false);
                    setNameError(null);
                  }}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-zinc-800 py-2 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
                >
                  <span>💾</span>
                  <span>Save Template</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}