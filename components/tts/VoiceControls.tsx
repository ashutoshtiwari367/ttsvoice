"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";

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
      { id: "gu-IN-Wavenet-A", label: "Dhara (ધારા)", gender: "female", tier: "free" },
    ],
  },
  {
    code: "kn-IN",
    label: "Kannada (ಕನ್ನಡ)",
    flag: "🇮🇳",
    voices: [
      { id: "kn-IN-Wavenet-B", label: "Chetan (ಚೇತನ್)", gender: "male", tier: "free" },
      { id: "kn-IN-Wavenet-A", label: "Sharada (ಶಾರದಾ)", gender: "female", tier: "free" },
    ],
  },
  {
    code: "ml-IN",
    label: "Malayalam (മലയാളം)",
    flag: "🇮🇳",
    voices: [
      { id: "ml-IN-Wavenet-B", label: "Vishnu (വിഷ്ണു)", gender: "male", tier: "free" },
      { id: "ml-IN-Wavenet-A", label: "Anjali (അഞ്ജലി)", gender: "female", tier: "free" },
    ],
  },
  {
    code: "pa-IN",
    label: "Punjabi (ਪੰਜਾਬੀ)",
    flag: "🇮🇳",
    voices: [
      { id: "pa-IN-Wavenet-B", label: "Harpreet (ਹਰਪ੍ਰੀਤ)", gender: "male", tier: "free" },
      { id: "pa-IN-Wavenet-A", label: "Simran (ਸਿਮਰਨ)", gender: "female", tier: "free" },
    ],
  },
  {
    code: "en-US",
    label: "English (US)",
    flag: "🇺🇸",
    voices: [
      { id: "en-US-Neural2-J", label: "James (Dynamic & Smooth)", gender: "male", tier: "free" },
      { id: "en-US-Neural2-F", label: "Emily (Natural & Warm)", gender: "female", tier: "free" },
    ],
  },
  {
    code: "en-GB",
    label: "English (UK)",
    flag: "🇬🇧",
    voices: [
      { id: "en-GB-Neural2-B", label: "Arthur (British Posh)", gender: "male", tier: "free" },
      { id: "en-GB-Neural2-A", label: "Olivia (Royal English)", gender: "female", tier: "free" },
    ],
  },
];

export default function VoiceControls({
  lang,
  voice,
  speed,
  onLangChange,
  onVoiceChange,
  onSpeedChange,
  className = "",
}: VoiceControlsProps) {
  const [styleMode, setStyleMode] = useState<string>("normal");
  const [showAllVoices, setShowAllVoices] = useState<boolean>(false);
  const [isPlayingSample, setIsPlayingSample] = useState<boolean>(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState<boolean>(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Current active language & voices
  const currentLangObj =
    ALL_LANGUAGES_CATALOG.find((l) => l.code === lang) || ALL_LANGUAGES_CATALOG[0];
  const activeVoices = currentLangObj.voices;

  const currentVoiceObj =
    activeVoices.find((v) => v.id === voice) || activeVoices[0];
  const selectedGender = currentVoiceObj?.gender || "male";

  // Pick gender voice
  const handleGenderSelect = (gender: "male" | "female") => {
    const matchedVoice =
      activeVoices.find((v) => v.gender === gender) ||
      activeVoices[0];
    if (matchedVoice) {
      onVoiceChange(matchedVoice.id);
    }
  };

  // Test voice sample playback
  const handleTestVoiceSample = () => {
    if (typeof window === "undefined") return;

    setIsPlayingSample(true);

    // Speak a sample preview using Web Speech API or synthesise short sentence
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const sampleText =
        lang.startsWith("hi")
          ? selectedGender === "female"
            ? "नमस्ते! यह मेरी आवाज़ का टेस्ट सैंपल है।"
            : "नमस्ते! यह मेरी पुरुष आवाज़ का सैंपल है।"
          : "Hello! This is a test preview of my neural voice.";

      const utter = new SpeechSynthesisUtterance(sampleText);
      utter.rate = speed;
      utter.lang = lang;
      utter.onend = () => setIsPlayingSample(false);
      utter.onerror = () => setIsPlayingSample(false);
      window.speechSynthesis.speak(utter);
    } else {
      setTimeout(() => setIsPlayingSample(false), 2000);
    }
  };

  const styleModes = [
    { id: "normal", label: "Normal", icon: "📊" },
    { id: "story", label: "Story", icon: "📖" },
    { id: "news", label: "News", icon: "📰" },
    { id: "youtube", label: "YouTube", icon: "▶️" },
  ];

  return (
    <aside className={`w-full lg:w-[340px] xl:w-[370px] shrink-0 font-sans ${className}`}>
      <div className="rounded-[28px] border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#0c0d12] p-5 sm:p-6 shadow-xl shadow-slate-200/40 dark:shadow-black/40 space-y-5">
        {/* ── 1. Choose Voice Avatar ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
              <span className="flex size-5 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950/60 text-[#ff5500] text-[11px] font-bold">
                👤
              </span>
              <span>1. Choose Voice Avatar</span>
            </div>

            <button
              type="button"
              onClick={() => setShowAllVoices(!showAllVoices)}
              className="text-xs font-bold text-[#ff5500] hover:underline cursor-pointer"
            >
              {showAllVoices ? "Hide List" : "See All"}
            </button>
          </div>

          {/* Avatar Cards (Male & Female) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Male Avatar */}
            <button
              type="button"
              onClick={() => handleGenderSelect("male")}
              className={`group relative flex flex-col items-center rounded-2xl p-3 transition-all cursor-pointer border-2 ${
                selectedGender === "male"
                  ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 shadow-md shadow-blue-500/10"
                  : "border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 hover:border-blue-300"
              }`}
            >
              {/* Checkmark Badge if Selected */}
              {selectedGender === "male" && (
                <div className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-blue-500 text-white text-[11px] font-black shadow-xs">
                  ✓
                </div>
              )}

              <div className="relative size-20 sm:size-24 overflow-hidden rounded-2xl shadow-sm mb-2">
                <Image
                  src="/images/male-avatar.jpg"
                  alt="Male Voice Avatar"
                  fill
                  className="object-cover transition group-hover:scale-105"
                  sizes="100px"
                  priority
                />
              </div>

              <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                Male
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-0.5">
                {activeVoices.find((v) => v.gender === "male")?.label.split(" ")[0] || "Arjun"}
              </span>
            </button>

            {/* Female Avatar */}
            <button
              type="button"
              onClick={() => handleGenderSelect("female")}
              className={`group relative flex flex-col items-center rounded-2xl p-3 transition-all cursor-pointer border-2 ${
                selectedGender === "female"
                  ? "border-pink-500 bg-pink-50/50 dark:bg-pink-950/30 shadow-md shadow-pink-500/10"
                  : "border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 hover:border-pink-300"
              }`}
            >
              {/* Checkmark Badge if Selected */}
              {selectedGender === "female" && (
                <div className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-pink-500 text-white text-[11px] font-black shadow-xs">
                  ✓
                </div>
              )}

              <div className="relative size-20 sm:size-24 overflow-hidden rounded-2xl shadow-sm mb-2">
                <Image
                  src="/images/female-avatar.jpg"
                  alt="Female Voice Avatar"
                  fill
                  className="object-cover transition group-hover:scale-105"
                  sizes="100px"
                  priority
                />
              </div>

              <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                Female
              </span>
              <span className="text-[10px] text-pink-600 dark:text-pink-400 font-bold mt-0.5">
                {activeVoices.find((v) => v.gender === "female")?.label.split(" ")[0] || "Aditi"}
              </span>
            </button>
          </div>

          {/* Extended Voice Picker (shown when "See All" is clicked) */}
          {showAllVoices && (
            <div className="mt-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 p-2.5 space-y-1.5 animate-fadeIn">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 px-1">
                All Available Voices ({currentLangObj.label})
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                {activeVoices.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      onVoiceChange(v.id);
                      setShowAllVoices(false);
                    }}
                    className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left transition cursor-pointer ${
                      voice === v.id
                        ? "bg-orange-500 text-white font-bold"
                        : "bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-orange-50 dark:hover:bg-zinc-700"
                    }`}
                  >
                    <span>{v.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        voice === v.id
                          ? "bg-white/20 text-white"
                          : v.gender === "female"
                          ? "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      }`}
                    >
                      {v.gender === "female" ? "♀ Pink" : "♂ Blue"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── 2. Select Language ── */}
        <div ref={dropdownRef} className="relative">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 mb-2">
            <span className="flex size-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 text-[11px] font-bold">
              🌐
            </span>
            <span>2. Select Language</span>
          </div>

          {/* Language Selector Box */}
          <button
            type="button"
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            className="w-full flex items-center justify-between rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/40 p-3 text-left transition hover:border-orange-400 cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{currentLangObj.flag}</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {currentLangObj.label}
              </span>
            </div>
            <svg
              className={`size-4 text-slate-400 transition-transform ${
                langDropdownOpen ? "rotate-180 text-orange-500" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {langDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 max-h-60 overflow-y-auto rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12131a] p-2 shadow-2xl space-y-1 animate-fadeIn">
              {ALL_LANGUAGES_CATALOG.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    onLangChange(item.code);
                    const defaultVoice = item.voices[0]?.id;
                    if (defaultVoice) onVoiceChange(defaultVoice);
                    setLangDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs transition cursor-pointer ${
                    lang === item.code
                      ? "bg-orange-500 text-white font-bold"
                      : "text-slate-800 dark:text-zinc-200 hover:bg-orange-50 dark:hover:bg-zinc-800/80"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.flag}</span>
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[10px] opacity-80">
                    {item.voices.length} Voices
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── 3. Speaking Style / Mode ── */}
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 mb-2.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950/60 text-[#ff5500] text-[11px] font-bold">
              📊
            </span>
            <span>3. Speaking Style / Mode</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {styleModes.map((m) => {
              const active = styleMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setStyleMode(m.id)}
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

        {/* ── 4. Speech Speed ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
              <span className="flex size-5 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950/60 text-[#ff5500] text-[11px] font-bold">
                ⏱️
              </span>
              <span>4. Speech Speed</span>
            </div>

            <span className="rounded-md bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/60 px-2 py-0.5 text-xs font-extrabold text-[#ff5500] dark:text-orange-400">
              {speed.toFixed(1)}x
            </span>
          </div>

          {/* Range Slider */}
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

        {/* ── 5. Test Voice Sample Button ── */}
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
      </div>
    </aside>
  );
}