"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export interface Voice {
  id: string;
  label: string;
  gender: string;
  tier?: string;
  preview_url?: string | null;
}

export interface Language {
  code: string;
  label: string;
  flag: string;
  voices: Voice[];
}

interface VoiceControlsProps {
  lang: string;
  voice: string;
  speed: number;
  onLangChange: (lang: string) => void;
  onVoiceChange: (voice: string) => void;
  onSpeedChange: (speed: number) => void;
  isAuthenticated?: boolean;
  onApplyTemplate?: (text: string) => void;
  className?: string;
}

export const ALL_LANGUAGES_CATALOG: Language[] = [
  {
    code: "hi-IN",
    label: "Hindi (हिन्दी)",
    flag: "🇮🇳",
    voices: [
      { id: "hi-IN-Wavenet-B", label: "Arjun (अर्जुन)", gender: "male", tier: "free" },
      { id: "hi-IN-Wavenet-A", label: "Aditi (अदिति)", gender: "female", tier: "free" },
      { id: "hi-IN-Wavenet-D", label: "Rohit (रोहित)", gender: "male", tier: "free" },
      { id: "hi-IN-Wavenet-C", label: "Priya (प्रिया)", gender: "female", tier: "free" },
      { id: "hi-IN-Neural2-B", label: "Kabir Studio (कबीर)", gender: "male", tier: "paid" },
      { id: "hi-IN-Neural2-A", label: "Ananya Studio (अनन्या)", gender: "female", tier: "paid" },
    ],
  },
  {
    code: "en-IN",
    label: "Indian English",
    flag: "🇮🇳",
    voices: [
      { id: "en-IN-Wavenet-B", label: "Dev (Corporate & News)", gender: "male", tier: "free" },
      { id: "en-IN-Wavenet-A", label: "Isha (Natural & Smooth)", gender: "female", tier: "free" },
      { id: "en-IN-Wavenet-D", label: "Rohan (Friendly & Tech)", gender: "male", tier: "free" },
      { id: "en-IN-Wavenet-C", label: "Meera (Youthful Voice)", gender: "female", tier: "free" },
      { id: "en-IN-Neural2-A", label: "Aarav Ultra (Pro Voiceover)", gender: "male", tier: "paid" },
    ],
  },
  {
    code: "ta-IN",
    label: "Tamil (தமிழ்)",
    flag: "🇮🇳",
    voices: [
      { id: "ta-IN-Wavenet-B", label: "Karthik (கார்த்திக்)", gender: "male", tier: "free" },
      { id: "ta-IN-Wavenet-A", label: "Vani (வாணி)", gender: "female", tier: "free" },
      { id: "ta-IN-Wavenet-C", label: "Deepa (தீபா)", gender: "female", tier: "free" },
    ],
  },
  {
    code: "te-IN",
    label: "Telugu (తెలుగు)",
    flag: "🇮🇳",
    voices: [
      { id: "te-IN-Standard-B", label: "Suresh (సురేష్)", gender: "male", tier: "free" },
      { id: "te-IN-Standard-A", label: "Lakshmi (లక్ష్మి)", gender: "female", tier: "free" },
    ],
  },
  {
    code: "mr-IN",
    label: "Marathi (मराठी)",
    flag: "🇮🇳",
    voices: [
      { id: "mr-IN-Wavenet-B", label: "Aniket (अनिकेत)", gender: "male", tier: "free" },
      { id: "mr-IN-Wavenet-A", label: "Sai (साई)", gender: "female", tier: "free" },
      { id: "mr-IN-Wavenet-C", label: "Tanvi (तन्वी)", gender: "female", tier: "free" },
    ],
  },
  {
    code: "bn-IN",
    label: "Bengali (বাংলা)",
    flag: "🇮🇳",
    voices: [
      { id: "bn-IN-Wavenet-B", label: "Subir (সুবীর)", gender: "male", tier: "free" },
      { id: "bn-IN-Wavenet-A", label: "Tithi (তিথি)", gender: "female", tier: "free" },
    ],
  },
  {
    code: "gu-IN",
    label: "Gujarati (ગુજરાતી)",
    flag: "🇮🇳",
    voices: [
      { id: "gu-IN-Wavenet-B", label: "Harish (હરીશ)", gender: "male", tier: "free" },
      { id: "gu-IN-Wavenet-A", label: "Dhwani (ધ્વનિ)", gender: "female", tier: "free" },
    ],
  },
  {
    code: "kn-IN",
    label: "Kannada (ಕನ್ನಡ)",
    flag: "🇮🇳",
    voices: [
      { id: "kn-IN-Wavenet-B", label: "Praveen (ಪ್ರವೀಣ್)", gender: "male", tier: "free" },
      { id: "kn-IN-Wavenet-A", label: "Kavya (ಕಾವ್ಯ)", gender: "female", tier: "free" },
    ],
  },
  {
    code: "ml-IN",
    label: "Malayalam (മലയാളം)",
    flag: "🇮🇳",
    voices: [
      { id: "ml-IN-Wavenet-B", label: "Madhav (മാധവ്)", gender: "male", tier: "free" },
      { id: "ml-IN-Wavenet-A", label: "Anju (അഞ്ജു)", gender: "female", tier: "free" },
    ],
  },
  {
    code: "pa-IN",
    label: "Punjabi (ਪੰਜਾਬੀ)",
    flag: "🇮🇳",
    voices: [
      { id: "pa-IN-Wavenet-B", label: "Gurpreet (ਗੁਰਪ੍ਰੀਤ)", gender: "male", tier: "free" },
      { id: "pa-IN-Wavenet-A", label: "Simran (ਸਿਮਰਨ)", gender: "female", tier: "free" },
    ],
  },
  {
    code: "en-US",
    label: "English (US)",
    flag: "🇺🇸",
    voices: [
      { id: "en-US-Neural2-J", label: "Michael (Professional)", gender: "male", tier: "paid" },
      { id: "en-US-Neural2-F", label: "Sarah (Warm & Natural)", gender: "female", tier: "paid" },
      { id: "en-US-Wavenet-D", label: "David (Commercial)", gender: "male", tier: "free" },
      { id: "en-US-Wavenet-C", label: "Emily (Casual & Friendly)", gender: "female", tier: "free" },
    ],
  },
  {
    code: "en-GB",
    label: "English (UK)",
    flag: "🇬🇧",
    voices: [
      { id: "en-GB-Neural2-B", label: "Oliver (Narrator)", gender: "male", tier: "paid" },
      { id: "en-GB-Neural2-A", label: "Charlotte (BBC Style)", gender: "female", tier: "paid" },
    ],
  },
];

export interface VoicePreset {
  id: string;
  name: string;
  lang: string;
  langLabel: string;
  langFlag: string;
  voice: string;
  voiceLabel: string;
  gender: "male" | "female";
  speed: number;
  pitch: number;
  volume: number;
  style: string;
  naturalPauses: boolean;
  outputFormat: "mp3" | "wav" | "ogg";
  isCustom?: boolean;
}

export const DEFAULT_PRESETS: VoicePreset[] = [
  {
    id: "preset-hindi-story",
    name: "Hindi Story & Audiobook",
    lang: "hi-IN",
    langLabel: "Hindi (हिन्दी)",
    langFlag: "🇮🇳",
    voice: "hi-IN-Wavenet-A",
    voiceLabel: "Aditi (अदिति)",
    gender: "female",
    speed: 0.9,
    pitch: 0,
    volume: 100,
    style: "story",
    naturalPauses: true,
    outputFormat: "mp3",
    isCustom: false,
  },
  {
    id: "preset-hindi-yt",
    name: "YouTube Tech Explainer",
    lang: "hi-IN",
    langLabel: "Hindi (हिन्दी)",
    langFlag: "🇮🇳",
    voice: "hi-IN-Wavenet-B",
    voiceLabel: "Arjun (अर्जुन)",
    gender: "male",
    speed: 1.2,
    pitch: 0,
    volume: 100,
    style: "youtube",
    naturalPauses: true,
    outputFormat: "mp3",
    isCustom: false,
  },
  {
    id: "preset-news-anchor",
    name: "Indian English News Anchor",
    lang: "en-IN",
    langLabel: "Indian English",
    langFlag: "🇮🇳",
    voice: "en-IN-Wavenet-B",
    voiceLabel: "Dev (Corporate & News)",
    gender: "male",
    speed: 1.1,
    pitch: 0,
    volume: 100,
    style: "news",
    naturalPauses: true,
    outputFormat: "mp3",
    isCustom: false,
  },
  {
    id: "preset-calm-female",
    name: "Smooth Dialogue & Podcast",
    lang: "en-IN",
    langLabel: "Indian English",
    langFlag: "🇮🇳",
    voice: "en-IN-Wavenet-A",
    voiceLabel: "Isha (Natural & Smooth)",
    gender: "female",
    speed: 1.0,
    pitch: 0,
    volume: 100,
    style: "normal",
    naturalPauses: true,
    outputFormat: "mp3",
    isCustom: false,
  },
];

export default function VoiceControls({
  lang,
  voice,
  speed,
  onLangChange,
  onVoiceChange,
  onSpeedChange,
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

  const [selectedGender, setSelectedGender] = useState<"male" | "female">("male");
  const [selectedStyle, setSelectedStyle] = useState<string>("normal");
  const [showAllVoices, setShowAllVoices] = useState(false);
  const [isPlayingSample, setIsPlayingSample] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── Gender filter ("all" | "male" | "female") & Person Dropdown state ──
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const [personDropdownOpen, setPersonDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close person dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPersonDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Audio Settings State ──
  const [pitch, setPitch] = useState<number>(0); // -5 to +5 semitones
  const [volume, setVolume] = useState<number>(100); // 50 to 150 %
  const [outputFormat, setOutputFormat] = useState<"mp3" | "wav" | "ogg">("mp3");
  const [sampleRate, setSampleRate] = useState<string>("44.1 kHz");
  const [naturalPauses, setNaturalPauses] = useState<boolean>(true);
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(true);

  // Find active language and voice list
  const currentLangObj =
    ALL_LANGUAGES_CATALOG.find((l) => l.code === lang) ||
    ALL_LANGUAGES_CATALOG[0];

  const activeVoices = currentLangObj.voices;

  // Filter voices by gender filter
  const filteredVoices = activeVoices.filter((v) => {
    if (genderFilter === "male") return v.gender === "male";
    if (genderFilter === "female") return v.gender === "female";
    return true;
  });

  const getPersonNumber = (voiceId: string) => {
    const idx = activeVoices.findIndex((v) => v.id === voiceId);
    return idx >= 0 ? idx + 1 : 1;
  };

  const currentVoiceObj =
    activeVoices.find((v) => v.id === voice) || activeVoices[0];
  const currentPersonNum = getPersonNumber(currentVoiceObj.id);

  // Sync selected gender from current voice on mount or change
  useEffect(() => {
    const matched = activeVoices.find((v) => v.id === voice);
    if (matched) {
      setSelectedGender(matched.gender as "male" | "female");
    }
  }, [voice, activeVoices]);

  const handleGenderSelect = (gender: "male" | "female") => {
    setSelectedGender(gender);
    const matchedVoice =
      activeVoices.find((v) => v.gender === gender) || activeVoices[0];
    if (matchedVoice) {
      onVoiceChange(matchedVoice.id);
    }
  };

  const handleTestVoiceSample = () => {
    if (typeof window === "undefined") return;

    setIsPlayingSample(true);

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const sampleText = lang.startsWith("hi")
        ? selectedGender === "female"
          ? "नमस्ते! यह मेरी स्वाभाविक आवाज़ का टेस्ट सैंपल है।"
          : "नमस्ते! यह मेरी पुरुष आवाज़ का टेस्ट सैंपल है।"
        : "Hello! This is a test preview of my natural AI voice.";

      const utter = new SpeechSynthesisUtterance(sampleText);
      utter.rate = speed;
      utter.pitch = Math.max(0.5, Math.min(2.0, 1 + pitch * 0.1));
      utter.lang = lang;
      utter.onend = () => setIsPlayingSample(false);
      utter.onerror = () => setIsPlayingSample(false);
      window.speechSynthesis.speak(utter);
    } else {
      setTimeout(() => setIsPlayingSample(false), 2000);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ── Voice Presets / Templates State ──
  const [presets, setPresets] = useState<VoicePreset[]>(DEFAULT_PRESETS);
  const [presetNameInput, setPresetNameInput] = useState("");

  // Load custom saved templates from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("tts_voice_presets_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPresets(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load saved templates", e);
    }
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
        localStorage.setItem("tts_voice_presets_v2", JSON.stringify(updated));
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
    setSelectedStyle(tpl.style || "normal");
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
        localStorage.setItem("tts_voice_presets_v2", JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to delete template", err);
      }
    }
    showToast(`Template "${name}" removed`);
  };

  const styleModes = [
    { id: "normal", label: "Normal", icon: "📊" },
    { id: "story", label: "Story", icon: "📖" },
    { id: "news", label: "News", icon: "📰" },
    { id: "youtube", label: "YouTube", icon: "▶️" },
  ];

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
            {/* 1. Select Language */}
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 mb-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 text-[11px] font-bold">
                  🌐
                </span>
                <span>1. Select Language</span>
              </div>

              <div className="relative">
                <select
                  value={lang}
                  onChange={(e) => {
                    const newLang = e.target.value;
                    onLangChange(newLang);
                    const langMatch = ALL_LANGUAGES_CATALOG.find((l) => l.code === newLang);
                    if (langMatch && langMatch.voices.length > 0) {
                      const sameGender = langMatch.voices.find((v) => v.gender === selectedGender);
                      onVoiceChange(sameGender ? sameGender.id : langMatch.voices[0].id);
                    }
                  }}
                  className="w-full appearance-none rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 px-3.5 py-2.5 pr-10 text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:border-orange-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition cursor-pointer"
                >
                  {ALL_LANGUAGES_CATALOG.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.label}
                    </option>
                  ))}
                </select>

                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
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

              {/* Open & Scrollable Voice Persons Box ("thoda sa space deke open kr do vo scroleble ho jaye") */}
              <div className="mt-3 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50 p-2.5 shadow-xs">
                <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-200/60 dark:border-zinc-800/80 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Voice Persons ({filteredVoices.length})
                  </span>
                  <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1">
                    <span>Scroll voices</span>
                    <span>↓</span>
                  </span>
                </div>

                {/* Scrollable list with comfortable height and spacing */}
                <div className="max-h-[175px] overflow-y-auto space-y-1.5 pr-1">
                  {filteredVoices.map((v) => {
                    const pNum = getPersonNumber(v.id);
                    const isSelected = v.id === voice;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          onVoiceChange(v.id);
                          setSelectedGender(v.gender as "male" | "female");
                        }}
                        className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-left transition-all cursor-pointer border ${
                          isSelected
                            ? "border-orange-500 bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 font-bold shadow-xs ring-1 ring-orange-500/20"
                            : "border-transparent bg-white/70 dark:bg-zinc-800/40 hover:bg-white dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:border-slate-200 dark:hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative size-8 shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-700 shadow-xs">
                            <Image
                              src={
                                v.gender === "female"
                                  ? "/images/female-avatar.jpg"
                                  : "/images/male-avatar.jpg"
                              }
                              alt={v.label}
                              fill
                              className="object-cover"
                              sizes="32px"
                            />
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

                        {isSelected ? (
                          <span className="size-5 flex items-center justify-center rounded-full bg-orange-500 text-white text-xs font-black shrink-0 shadow-xs">
                            ✓
                          </span>
                        ) : (
                          <span className="size-5 flex items-center justify-center rounded-full border border-slate-200 dark:border-zinc-700 text-slate-300 dark:text-zinc-600 text-xs shrink-0">
                            ○
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
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
                      onClick={() => setSelectedStyle(m.id)}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition cursor-pointer ${
                        active
                          ? "border-orange-500 bg-orange-50/70 dark:bg-orange-950/30 text-[#ff5500] dark:text-orange-400 shadow-xs"
                          : "border-slate-200/80 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 text-slate-700 dark:text-zinc-300 hover:border-orange-300"
                      }`}
                    >
                      <span>{m.icon}</span>
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Test Voice Sample Button */}
            <div>
              <button
                type="button"
                onClick={handleTestVoiceSample}
                disabled={isPlayingSample}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 py-3 text-xs sm:text-sm font-extrabold text-slate-800 dark:text-zinc-200 transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isPlayingSample ? (
                  <>
                    <span className="size-2 rounded-full bg-orange-500 animate-ping" />
                    <span>Playing Voice Sample...</span>
                  </>
                ) : (
                  <>
                    <span className="text-xs">▶</span>
                    <span>Test Voice Sample</span>
                  </>
                )}
              </button>
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
                min={0.5}
                max={2.0}
                step={0.1}
                value={speed}
                onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                className="w-full accent-[#ff5500] h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500 font-semibold mt-1">
                <span>0.5x Slow</span>
                <span>1.0x Normal</span>
                <span>2.0x Fast</span>
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
                min={-5}
                max={5}
                step={1}
                value={pitch}
                onChange={(e) => setPitch(parseInt(e.target.value, 10))}
                className="w-full accent-purple-600 h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500 font-semibold mt-1">
                <span>Deep (-5st)</span>
                <span>Natural (0st)</span>
                <span>High (+5st)</span>
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
                min={50}
                max={150}
                step={5}
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-600 h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500 font-semibold mt-1">
                <span>50% Soft</span>
                <span>100% Standard</span>
                <span>150% Boost</span>
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
                {(["mp3", "wav", "ogg"] as const).map((fmt) => (
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
                {["24 kHz", "44.1 kHz", "48 kHz"].map((sr) => (
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
                onSpeedChange(1.0);
                setPitch(0);
                setVolume(100);
                setOutputFormat("mp3");
                setSampleRate("44.1 kHz");
                setNaturalPauses(true);
                setAutoPlayAudio(true);
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

              <button
                type="button"
                onClick={openSaveTemplateFlow}
                className="flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold px-3 py-1.5 shadow-xs transition cursor-pointer shrink-0"
              >
                <span>💾</span>
                <span>+ Save Current</span>
              </button>
            </div>

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
                        localStorage.removeItem("tts_voice_presets_v2");
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