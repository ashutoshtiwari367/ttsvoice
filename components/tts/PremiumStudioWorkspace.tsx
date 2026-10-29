"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import VoiceControls from "./VoiceControls";
import { ALL_LANGUAGES_CATALOG, type Language, type Voice } from "@/lib/tts/catalog";
import { AUDIO_CONTROL_SETTINGS, CHAR_LIMIT_CONTROL, STUDIO_SPEAKING_STYLES } from "@/config/control";
import { useTheme } from "@/components/theme/ThemeProvider";
import ThemeToggle from "@/components/theme/ThemeToggle";
import ProfileDropdown from "@/components/layout/ProfileDropdown";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface PremiumStudioWorkspaceProps {
  initialText?: string;
  userAllowance?: {
    isAuthenticated: boolean;
    userType: "guest" | "free" | "premium";
    tier: "anon" | "free" | "paid";
    totalAllowance: number;
    usedChars: number;
    remainingChars: number;
    singleReqCap: number;
    isPremium: boolean;
    balance: number;
    customerNo?: number | null;
    activePlanName?: string;
  } | null;
}

interface RecentProject {
  id: string | number;
  num: number;
  title: string;
  langName: string;
  langFlag: string;
  voiceName: string;
  voiceGender: "male" | "female";
  duration: string;
  created: string;
  audioUrl?: string | null;
}

const DEFAULT_PROJECTS: RecentProject[] = [
  {
    id: 1,
    num: 1,
    title: "YouTube Intro",
    langName: "Hindi",
    langFlag: "🇮🇳",
    voiceName: "Aditi",
    voiceGender: "female",
    duration: "00:00:28",
    created: "Oct 26, 2026",
    audioUrl: null,
  },
  {
    id: 2,
    num: 2,
    title: "Podcast Episode",
    langName: "English",
    langFlag: "🇺🇸",
    voiceName: "Arjun",
    voiceGender: "male",
    duration: "00:02:15",
    created: "Oct 25, 2026",
    audioUrl: null,
  },
  {
    id: 3,
    num: 3,
    title: "Education Video",
    langName: "Hindi",
    langFlag: "🇮🇳",
    voiceName: "Priya",
    voiceGender: "female",
    duration: "00:01:42",
    created: "Oct 24, 2026",
    audioUrl: null,
  },
  {
    id: 4,
    num: 4,
    title: "Advertisement",
    langName: "English",
    langFlag: "🇺🇸",
    voiceName: "Rohit",
    voiceGender: "male",
    duration: "00:00:55",
    created: "Oct 24, 2026",
    audioUrl: null,
  },
  {
    id: 5,
    num: 5,
    title: "News Bulletin",
    langName: "Hindi",
    langFlag: "🇮🇳",
    voiceName: "Aditi",
    voiceGender: "female",
    duration: "00:03:10",
    created: "Oct 23, 2026",
    audioUrl: null,
  },
];

const SPEAKING_STYLES = STUDIO_SPEAKING_STYLES.map((s) => ({
  id: s.id,
  label: s.label,
  icon: s.studioIcon,
  speed: s.speed,
  pitch: s.pitch,
}));

export default function PremiumStudioWorkspace({
  initialText = "",
  userAllowance,
}: PremiumStudioWorkspaceProps) {
  // Navigation & Tabs
  const [activeNav, setActiveNav] = useState("tts");
  const [activeTab, setActiveTab] = useState<"tts" | "ssml" | "file" | "longform">("tts");

  // Studio Script & TTS States
  const [text, setText] = useState(initialText);
  const [selectedGender, setSelectedGender] = useState<"male" | "female">(
    AUDIO_CONTROL_SETTINGS.defaultGender
  );
  const [selectedLang, setSelectedLang] = useState<string>(AUDIO_CONTROL_SETTINGS.defaultLanguage);
  const [selectedVoice, setSelectedVoice] = useState<string>(AUDIO_CONTROL_SETTINGS.defaultVoice);
  const [speakingStyle, setSpeakingStyle] = useState<string>(AUDIO_CONTROL_SETTINGS.defaultStyle);
  const [speed, setSpeed] = useState<number>(AUDIO_CONTROL_SETTINGS.speed.default);
  const [pitch, setPitch] = useState<number>(AUDIO_CONTROL_SETTINGS.pitch.default);
  const [volume, setVolume] = useState<number>(AUDIO_CONTROL_SETTINGS.volume.default);
  const [autoDetect, setAutoDetect] = useState<boolean>(true);

  // Advanced Accordion & Menus
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(true);
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchFocused, setSearchFocused] = useState<boolean>(false);
  const [notificationOpen, setNotificationOpen] = useState<boolean>(false);
  const [presetModalOpen, setPresetModalOpen] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Generation status
  const [status, setStatus] = useState<"idle" | "generating" | "ready" | "error">("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playingProjectId, setPlayingProjectId] = useState<string | number | null>(null);

  // Projects list
  const [projects, setProjects] = useState<RecentProject[]>(DEFAULT_PROJECTS);

  // User Profile
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>("Guest");
  const [userEmail, setUserEmail] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const projectAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch Supabase user info if available
  useEffect(() => {
    try {
      const supabase = createClient();
      const syncUser = (u: User | null) => {
        setSupabaseUser(u);
        if (u) {
          setIsLoggedIn(true);
          const email = u.email || "";
          setUserEmail(email);
          const metaName = u.user_metadata?.full_name || u.user_metadata?.name;
          if (metaName) {
            setUserName(metaName);
          } else if (email) {
            const raw = email.split("@")[0].replace(/[._-]/g, " ");
            setUserName(raw.charAt(0).toUpperCase() + raw.slice(1));
          }
        } else {
          setIsLoggedIn(false);
          setUserEmail("");
          setUserName("Guest");
        }
      };

      supabase.auth.getUser().then(({ data }) => syncUser(data.user ?? null));
      const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
        syncUser(session?.user ?? null);
      });
      return () => listener.subscription.unsubscribe();
    } catch {
      // ignore
    }
  }, []);

  const handleSignOut = async () => {
    setSupabaseUser(null);
    setIsLoggedIn(false);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth-changed"));
        window.location.href = "/";
      }
    } catch {
      window.location.href = "/";
    }
  };

  // Fetch generation history to populate recent projects
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/history");
        if (res.ok) {
          const data = await res.json();
          if (data.history && data.history.length > 0) {
            const mapped: RecentProject[] = data.history.slice(0, 10).map((h: any, idx: number) => {
              const langObj = ALL_LANGUAGES_CATALOG.find((l) => l.code === h.lang);
              const voiceObj = langObj?.voices.find((v) => v.id === h.voice);
              const title = h.excerpt
                ? h.excerpt.slice(0, 24) + (h.excerpt.length > 24 ? "..." : "")
                : `Project #${h.id}`;
              const createdDate = new Date(h.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              return {
                id: h.id,
                num: idx + 1,
                title,
                langName: langObj?.label.split(" ")[0] || "Hindi",
                langFlag: langObj?.flag || "🇮🇳",
                voiceName: voiceObj?.label.split(" ")[0] || "Aditi",
                voiceGender: (voiceObj?.gender as "male" | "female") || "female",
                duration: "00:00:25",
                created: createdDate,
                audioUrl: h.audioUrl || null,
              };
            });
            setProjects(mapped);
          }
        }
      } catch {
        // fallback to default projects
      }
    }
    loadHistory();
  }, []);

  // Current language catalog entry
  const currentLangObj =
    ALL_LANGUAGES_CATALOG.find((l) => l.code === selectedLang) || ALL_LANGUAGES_CATALOG[0];

  // Filter voices by gender
  const availableVoices = currentLangObj.voices.filter((v) =>
    selectedGender ? v.gender === selectedGender : true
  );

  // Handle avatar click (Male / Female)
  const handleSelectGender = (gender: "male" | "female") => {
    setSelectedGender(gender);
    const firstMatchingVoice = currentLangObj.voices.find((v) => v.gender === gender);
    if (firstMatchingVoice) {
      setSelectedVoice(firstMatchingVoice.id);
    }
  };

  // Handle Language Change
  const handleSelectLanguage = (langCode: string) => {
    setSelectedLang(langCode);
    const newLang = ALL_LANGUAGES_CATALOG.find((l) => l.code === langCode);
    if (newLang) {
      const matchGender = newLang.voices.find((v) => v.gender === selectedGender);
      setSelectedVoice(matchGender ? matchGender.id : newLang.voices[0]?.id || "");
    }
  };

  // Handle Voice Change (sync voice and gender)
  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId);
    const currentL = ALL_LANGUAGES_CATALOG.find((l) => l.code === selectedLang) || ALL_LANGUAGES_CATALOG[0];
    const match = currentL.voices.find((v) => v.id === voiceId);
    if (match) {
      setSelectedGender(match.gender as "male" | "female");
    }
  };

  // Handle Speaking Style Change
  const handleSelectStyle = (styleId: string) => {
    setSpeakingStyle(styleId);
    const found = SPEAKING_STYLES.find((s) => s.id === styleId);
    if (found) {
      setSpeed(found.speed);
      setPitch(found.pitch);
    }
  };

  // Generate Speech Handler
  const handleGenerate = async (previewOnly = false) => {
    const textToGen = previewOnly ? text.trim().slice(0, 50) : text.trim();
    if (!textToGen) return;

    setStatus("generating");
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToGen,
          lang: selectedLang,
          voice: selectedVoice,
          speed,
          pitch,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate speech");
        setStatus("error");
        return;
      }

      const url = data.url || data.audioUrl || null;
      setAudioUrl(url);
      setStatus("ready");

      if (url && audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }

      // Add to recent projects
      const activeVoiceObj = currentLangObj.voices.find((v) => v.id === selectedVoice);
      const newProj: RecentProject = {
        id: Date.now(),
        num: 1,
        title: textToGen.slice(0, 20) + (textToGen.length > 20 ? "..." : ""),
        langName: currentLangObj.label.split(" ")[0],
        langFlag: currentLangObj.flag,
        voiceName: activeVoiceObj?.label.split(" ")[0] || "Aditi",
        voiceGender: selectedGender,
        duration: "00:00:15",
        created: "Just now",
        audioUrl: url,
      };

      setProjects((prev) => [newProj, ...prev.slice(0, 4).map((p, i) => ({ ...p, num: i + 2 }))]);
    } catch {
      setError("Network error while generating speech");
      setStatus("error");
    }
  };

  // Play/Pause Generated Audio
  const togglePlayAudio = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Play Recent Project Item
  const handlePlayProject = (proj: RecentProject) => {
    if (playingProjectId === proj.id && projectAudioRef.current) {
      if (!projectAudioRef.current.paused) {
        projectAudioRef.current.pause();
        setPlayingProjectId(null);
      } else {
        projectAudioRef.current.play();
        setPlayingProjectId(proj.id);
      }
      return;
    }

    if (proj.audioUrl) {
      if (projectAudioRef.current) {
        projectAudioRef.current.src = proj.audioUrl;
        projectAudioRef.current.play();
        setPlayingProjectId(proj.id);
      }
    } else {
      // Simulate/Generate sample for demo row
      handleGenerate(true);
      setPlayingProjectId(proj.id);
    }
  };

  // File Upload to Text
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setText(content);
          setActiveTab("tts");
        }
      };
      reader.readAsText(file);
    }
  };

  const maxChars = 5000;
  const charCount = text.length;
  const isOverLimit = charCount > maxChars;
  const extraChars = isOverLimit ? charCount - maxChars : 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0e17] text-slate-900 dark:text-slate-100 font-sans flex flex-col transition-colors duration-200">
      {/* Hidden audio players */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
      <audio
        ref={projectAudioRef}
        onEnded={() => setPlayingProjectId(null)}
        onPause={() => setPlayingProjectId(null)}
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".txt,.doc,.docx"
        className="hidden"
      />

      {/* ── 1. TOP HEADER (IndianTTS Studio) ── */}
      <header className="sticky top-0 z-40 h-16 w-full border-b border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-[#0f121d] px-4 lg:px-6 flex items-center justify-between shadow-xs">
        {/* Left: Brand & Studio Badge */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
            aria-label="Toggle menu"
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link href="/" className="flex items-center gap-2 group">
            {/* Soundwave Brand Icon */}
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff5500] to-[#ff7324] text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            </div>

            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Indian<span className="text-[#ff5500]">TTS</span>
            </span>
          </Link>

          {/* Studio Pill Badge */}
          <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 px-2.5 py-0.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
            Studio
          </span>
        </div>

        {/* Center: Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              placeholder="Search voices, languages or projects..."
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-[#141824] pl-9 pr-14 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-orange-500/80 focus:bg-white dark:focus:bg-[#141824] focus:outline-none transition shadow-xs"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
              <kbd className="rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:text-zinc-400">
                Ctrl K
              </kbd>
            </div>

            {/* Quick search popup */}
            {searchFocused && (
              <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121520] p-2 shadow-xl z-50 animate-fadeIn text-xs">
                <div className="p-1.5 font-bold text-[10px] uppercase tracking-wider text-slate-400">
                  Quick Voices
                </div>
                {ALL_LANGUAGES_CATALOG.slice(0, 3).map((l) =>
                  l.voices.slice(0, 2).map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setSelectedLang(l.code);
                        setSelectedVoice(v.id);
                        setSelectedGender(v.gender as "male" | "female");
                      }}
                      className="w-full text-left flex items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:text-orange-600 transition"
                    >
                      <span className="font-semibold">{v.label}</span>
                      <span className="text-[10px] text-slate-400">{l.label}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Controls: Bell, Theme Toggle, User Profile */}
        <div className="flex items-center gap-2.5">
          {/* Notifications Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="flex size-9 items-center justify-center rounded-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
              title="Notifications"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-orange-500" />
            </button>

            {notificationOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121520] p-4 shadow-xl z-50 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Notifications</span>
                  <span className="text-[10px] text-orange-600 font-semibold">1 New</span>
                </div>
                <div className="mt-2 text-xs space-y-2">
                  <div className="rounded-xl bg-orange-50/50 dark:bg-orange-950/20 p-2.5 text-slate-700 dark:text-zinc-300">
                    <p className="font-bold text-orange-600">⚡ Pro Studio Active</p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      You have full unlocked access to all neural voices, priority GPU queue, and 30-day retention.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Reusable Profile Dropdown or Guest Sign In */}
          {supabaseUser ? (
            <ProfileDropdown user={supabaseUser} onSignOut={handleSignOut} />
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-1.5 text-xs font-bold text-slate-800 dark:text-zinc-200 hover:border-orange-500/40 transition shadow-xs"
            >
              Log In
            </Link>
          )}
        </div>
      </header>

      {/* ── 2. THREE-COLUMN WORKSPACE BODY ── */}
      <div className="flex-1 flex w-full max-w-[1600px] mx-auto overflow-hidden">
        {/* ── LEFT SIDEBAR ── */}
        <aside
          className={`fixed lg:static inset-y-16 left-0 z-30 w-60 shrink-0 border-r border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#0f121d] flex flex-col justify-between p-4 transition-transform lg:translate-x-0 ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              type="button"
              onClick={() => setActiveNav("tts")}
              className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition text-left ${
                activeNav === "tts"
                  ? "bg-orange-50 dark:bg-orange-950/40 text-[#ff5500] dark:text-orange-400 font-extrabold shadow-xs"
                  : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900"
              }`}
            >
              <span className="text-base">🎙️</span>
              <span>Text to Speech</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveNav("studio")}
              className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition text-left ${
                activeNav === "studio"
                  ? "bg-orange-50 dark:bg-orange-950/40 text-[#ff5500] dark:text-orange-400 font-extrabold shadow-xs"
                  : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900"
              }`}
            >
              <span className="text-base">〰️</span>
              <span>Voice Studio</span>
            </button>

            <Link
              href="/history"
              className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 transition text-left"
            >
              <span className="text-base">📁</span>
              <span>Projects / History</span>
            </Link>

            <button
              type="button"
              onClick={() => setActiveNav("cloning")}
              className="w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 transition text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">👤</span>
                <span>Voice Cloning</span>
              </div>
              <span className="rounded-md bg-orange-500/10 text-orange-600 text-[10px] px-1.5 py-0.5 font-bold">
                PRO
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveNav("batch")}
              className="w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 transition text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">📑</span>
                <span>Batch Conversion</span>
              </div>
              <span className="rounded-md bg-orange-500/10 text-orange-600 text-[10px] px-1.5 py-0.5 font-bold">
                PRO
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveNav("editor")}
              className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 transition text-left"
            >
              <span className="text-base">🎛️</span>
              <span>Audio Editor</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveNav("subtitles")}
              className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 transition text-left"
            >
              <span className="text-base font-mono font-bold">cc</span>
              <span>Subtitles / SRT</span>
            </button>

            <Link
              href="/tools"
              className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 transition text-left"
            >
              <span className="text-base font-mono">&lt;/&gt;</span>
              <span>API Access</span>
            </Link>

            <Link
              href="/account"
              className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 transition text-left"
            >
              <span className="text-base">📊</span>
              <span>Usage Analytics</span>
            </Link>

            <Link
              href="/account"
              className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 transition text-left"
            >
              <span className="text-base">⚙️</span>
              <span>Settings</span>
            </Link>
          </nav>

          {/* Bottom Pro Studio Card */}
          <div className="mt-6 rounded-2xl border border-orange-200/90 dark:border-orange-950/80 bg-gradient-to-br from-[#fff6ef] via-[#fffaf5] to-[#ffeedf] dark:from-[#20140c] dark:via-[#19100a] dark:to-[#130c07] p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex size-7 items-center justify-center rounded-lg bg-orange-500 text-white text-xs font-black shadow-xs">
                👑
              </span>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                  Pro Studio
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                  All premium features unlocked
                </p>
              </div>
            </div>

            <ul className="mt-3 space-y-1.5 text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
              <li className="flex items-center gap-2">
                <span className="text-[#ff5500] font-black">✓</span>
                <span>No Ads</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#ff5500] font-black">✓</span>
                <span>Unlimited Access</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#ff5500] font-black">✓</span>
                <span>Advanced Voice Controls</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#ff5500] font-black">✓</span>
                <span>Export in Multiple Formats</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#ff5500] font-black">✓</span>
                <span>Priority Support</span>
              </li>
            </ul>
          </div>
        </aside>

        {/* ── CENTER WORKSPACE CANVAS ── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 space-y-6">
          {/* AI Voice Studio Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/50 text-[#ff5500] shadow-xs">
                {/* Equalizer Soundwave icon */}
                <div className="flex items-end gap-[3px] h-5">
                  <span className="w-1 bg-[#ff5500] rounded-full h-3 animate-pulse" />
                  <span className="w-1 bg-[#ff5500] rounded-full h-5 animate-pulse delay-75" />
                  <span className="w-1 bg-[#ff5500] rounded-full h-2 animate-pulse delay-150" />
                  <span className="w-1 bg-[#ff5500] rounded-full h-4 animate-pulse delay-100" />
                </div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  AI Voice Studio
                </h1>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Convert your text into natural, high-quality speech using advanced AI voices.
                </p>
              </div>
            </div>

            {/* Right Quick Pill Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-900/40 px-3 py-1 text-[11px] font-bold text-orange-700 dark:text-orange-400">
                <span>⚡</span>
                <span>Real-Time Synthesis</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/40 px-3 py-1 text-[11px] font-bold text-blue-700 dark:text-blue-400">
                <span>🎙️</span>
                <span>100+ Voices</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/40 px-3 py-1 text-[11px] font-bold text-blue-700 dark:text-blue-400">
                <span>🌐</span>
                <span>Multi-Language</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-900/40 px-3 py-1 text-[11px] font-bold text-purple-700 dark:text-purple-400">
                <span>🎛️</span>
                <span>Studio Tools</span>
              </span>
            </div>
          </div>

          {/* Main Script Editor Card */}
          <div className={`rounded-2xl border transition-all duration-200 bg-white dark:bg-[#121520] shadow-sm overflow-hidden ${
            isOverLimit
              ? "border-red-500 ring-2 ring-red-500/20"
              : "border-slate-200 dark:border-zinc-800"
          }`}>
            {/* Top Sub Tabs Bar */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 px-4 sm:px-5 py-2.5 bg-slate-50/50 dark:bg-white/[0.01]">
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("tts")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition border-b-2 ${
                    activeTab === "tts"
                      ? "border-[#ff5500] text-[#ff5500] dark:text-orange-400"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  <span>🎙️</span>
                  <span>Text to Speech</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("ssml");
                    if (!text.includes("<speak>")) {
                      setText(`<speak>\n  ${text || "Type your script with pauses here."}\n  <break time="500ms"/>\n</speak>`);
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition border-b-2 ${
                    activeTab === "ssml"
                      ? "border-[#ff5500] text-[#ff5500] dark:text-orange-400"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  <span className="font-mono text-[11px]">&lt;/&gt;</span>
                  <span>SSML Editor</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition border-b-2 ${
                    activeTab === "file"
                      ? "border-[#ff5500] text-[#ff5500] dark:text-orange-400"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  <span>📤</span>
                  <span>File to Speech</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("longform")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition border-b-2 ${
                    activeTab === "longform"
                      ? "border-[#ff5500] text-[#ff5500] dark:text-orange-400"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  <span>📄</span>
                  <span>Long Form</span>
                </button>
              </div>

              {/* Right Tab Tools: Import & Clear */}
              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 transition"
                  title="Upload .txt file"
                >
                  <svg className="size-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Import Text</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setText("");
                    setStatus("idle");
                    setAudioUrl(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                  title="Clear text"
                >
                  <svg className="size-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Textarea */}
            <div className={`p-4 sm:p-5 transition-all duration-200 ${
              isOverLimit ? "bg-red-50/20 dark:bg-red-950/20" : ""
            }`}>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste or type your script here in Hindi, English, Tamil, Marathi, or any Indian/global language..."
                rows={7}
                className={`w-full resize-y bg-transparent text-sm sm:text-base leading-relaxed placeholder:text-slate-400 focus:outline-none transition-all duration-200 ${
                  isOverLimit
                    ? "text-red-600 dark:text-red-400 opacity-60 font-medium selection:bg-red-200"
                    : "text-slate-900 dark:text-slate-100 opacity-100"
                }`}
              />
            </div>

            {/* Textarea Bottom Meta Bar */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-800/80 px-4 sm:px-5 py-2.5 text-xs text-slate-500 dark:text-zinc-400 bg-slate-50/30 dark:bg-white/[0.01]">
              <span className={`font-medium ${isOverLimit ? "text-red-600 dark:text-red-400 font-bold" : ""}`}>
                {charCount} / {maxChars} characters {isOverLimit && "(Limit Exceeded)"}
              </span>

              {/* Auto Detect Language Toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className="font-semibold text-slate-600 dark:text-zinc-300 flex items-center gap-1">
                  <span>🪄</span>
                  <span>Auto Detect Language</span>
                </span>
                <div
                  onClick={() => setAutoDetect(!autoDetect)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    autoDetect ? "bg-[#ff5500]" : "bg-slate-300 dark:bg-zinc-700"
                  }`}
                >
                  <span
                    className={`inline-block size-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                      autoDetect ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </div>
              </label>
            </div>
          </div>

          {/* Over-limit Call to Action Banner (Configurable via `config/control.ts`) */}
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
                      {!isLoggedIn
                        ? CHAR_LIMIT_CONTROL.guestBannerMessage
                        : CHAR_LIMIT_CONTROL.loggedInBannerMessage}
                    </p>
                  </div>
                </div>

                {!isLoggedIn && (
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

          {/* Action Row Under Editor */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Preview (50 chars) */}
            <button
              type="button"
              disabled={!text.trim() || status === "generating"}
              onClick={() => handleGenerate(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121520] px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              <span>▶</span>
              <span>Preview (50 chars)</span>
            </button>

            {/* Generate Speech (Prominent Orange/Red Button) */}
            <button
              type="button"
              disabled={status === "generating" || (!isOverLimit && !text.trim())}
              onClick={() => {
                if (isOverLimit) {
                  if (!isLoggedIn && typeof window !== "undefined") {
                    window.location.href = CHAR_LIMIT_CONTROL.primaryLoginHref;
                  }
                  return;
                }
                handleGenerate(false);
              }}
              className={`inline-flex items-center gap-2.5 rounded-xl px-6 py-2.5 text-xs font-black text-white shadow-md transition active:scale-98 cursor-pointer ${
                isOverLimit
                  ? "bg-gradient-to-r from-red-600 via-[#ff5500] to-[#ff7324] shadow-red-500/25 hover:shadow-red-500/40"
                  : "bg-gradient-to-r from-[#ff5500] to-[#ff7324] hover:from-[#f05000] hover:to-[#ff6815] shadow-orange-500/25 disabled:opacity-50"
              }`}
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
              <span>
                {status === "generating"
                  ? "Generating Audio..."
                  : isOverLimit
                  ? !isLoggedIn
                    ? `${CHAR_LIMIT_CONTROL.guestGenerateButtonText} →`
                    : CHAR_LIMIT_CONTROL.loggedInGenerateButtonText
                  : "Generate Speech"}
              </span>
            </button>

            {/* Add to Project */}
            <button
              type="button"
              onClick={() => {
                if (text.trim()) {
                  const newP: RecentProject = {
                    id: Date.now(),
                    num: projects.length + 1,
                    title: text.slice(0, 20) + (text.length > 20 ? "..." : ""),
                    langName: currentLangObj.label.split(" ")[0],
                    langFlag: currentLangObj.flag,
                    voiceName: currentLangObj.voices.find((v) => v.id === selectedVoice)?.label.split(" ")[0] || "Aditi",
                    voiceGender: selectedGender,
                    duration: "00:00:20",
                    created: "Oct 26, 2026",
                    audioUrl,
                  };
                  setProjects((prev) => [newP, ...prev]);
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121520] px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-xs transition cursor-pointer"
            >
              <svg className="size-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <span>Add to Project</span>
            </button>

            {/* Download */}
            {audioUrl ? (
              <a
                href={audioUrl}
                download="indiantts_pro_audio.mp3"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121520] px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-xs transition cursor-pointer"
              >
                <svg className="size-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download</span>
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121520] px-4 py-2.5 text-xs font-bold text-slate-400 dark:text-zinc-500 shadow-xs opacity-60 cursor-not-allowed"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download</span>
              </button>
            )}

            {/* More Menu */}
            <button
              type="button"
              onClick={() => alert("Pro Studio Tools: Audio Stems, SRT Export, and High-Bitrate WAV are enabled.")}
              className="flex size-9 items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121520] text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition shadow-xs cursor-pointer"
              title="More options"
            >
              <span>•••</span>
            </button>
          </div>

          {/* Error notice if any */}
          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-3.5 text-xs font-bold text-red-700 dark:text-red-300 animate-fadeIn">
              ⚠️ {error}
            </div>
          )}

          {/* Generated Audio Player Result Box (if audio is ready) */}
          {audioUrl && (
            <div className="rounded-2xl border border-orange-200/90 dark:border-orange-900/50 bg-gradient-to-r from-orange-50/50 via-white to-amber-50/40 dark:from-zinc-900 dark:to-zinc-900 p-4 sm:p-5 shadow-sm animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={togglePlayAudio}
                    className="flex size-11 items-center justify-center rounded-full bg-[#ff5500] text-white shadow-md shadow-orange-500/30 hover:scale-105 active:scale-95 transition cursor-pointer"
                  >
                    {isPlaying ? (
                      <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="4" width="4" height="16" />
                        <rect x="14" y="4" width="4" height="16" />
                      </svg>
                    ) : (
                      <svg className="size-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    )}
                  </button>
                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-white">
                      Synthesized Speech Ready
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                      {currentLangObj.label} • {currentLangObj.voices.find((v) => v.id === selectedVoice)?.label} • {speed}x Speed
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={audioUrl}
                    download="speech_320kbps.mp3"
                    className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-xs transition"
                  >
                    Download MP3 (320 kbps)
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Recent Projects Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121520] shadow-sm overflow-hidden">
            {/* Table Header Row */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/60 text-[#ff5500] text-xs font-black">
                  📄
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Recent Projects
                </h3>
              </div>
              <Link
                href="/history"
                className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline"
              >
                View All
              </Link>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-zinc-800/80 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 bg-slate-50/40 dark:bg-white/[0.01]">
                    <th className="py-2.5 px-4 w-10">#</th>
                    <th className="py-2.5 px-4">Title</th>
                    <th className="py-2.5 px-4">Language</th>
                    <th className="py-2.5 px-4">Voice</th>
                    <th className="py-2.5 px-4">Duration</th>
                    <th className="py-2.5 px-4">Created</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-medium">
                  {projects.map((proj) => (
                    <tr
                      key={proj.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-400 font-semibold">{proj.num}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => handlePlayProject(proj)}
                            className="flex size-7 items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-[#ff5500] hover:text-white transition shadow-xs cursor-pointer"
                            title="Play preview"
                          >
                            {playingProjectId === proj.id ? (
                              <span className="text-[10px]">⏸</span>
                            ) : (
                              <span className="text-[10px] ml-0.5">▶</span>
                            )}
                          </button>
                          <span className="font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                            {proj.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-zinc-300">
                          <span>{proj.langFlag}</span>
                          <span>{proj.langName}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="relative size-6 shrink-0 rounded-full overflow-hidden border border-slate-200 dark:border-zinc-700">
                            <Image
                              src={
                                proj.voiceGender === "male"
                                  ? "/images/male-avatar.jpg"
                                  : "/images/female-avatar.jpg"
                              }
                              alt={proj.voiceName}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-zinc-200">
                            {proj.voiceName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-zinc-400">
                        {proj.duration}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-zinc-400">
                        {proj.created}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (proj.audioUrl) {
                                window.open(proj.audioUrl, "_blank");
                              } else {
                                handleGenerate(true);
                              }
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
                            title="Download project audio"
                          >
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
                            title="Options"
                          >
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Mobile VoiceControls panel */}
          <div className="md:hidden pt-4">
            <VoiceControls
              lang={selectedLang}
              voice={selectedVoice}
              speed={speed}
              onLangChange={handleSelectLanguage}
              onVoiceChange={handleVoiceChange}
              onSpeedChange={setSpeed}
              isAuthenticated={userAllowance?.isAuthenticated === true || isLoggedIn}
              onApplyTemplate={(tplText) => setText(tplText)}
              className="w-full"
            />
          </div>
        </main>

        {/* ── RIGHT PANEL (Unified VoiceControls: Voice, Settings & Templates) ── */}
        <div className="w-80 lg:w-[360px] xl:w-[390px] shrink-0 border-l border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/30 dark:bg-[#0c0d14] p-3 lg:p-4 overflow-y-auto hidden md:block">
          <VoiceControls
            lang={selectedLang}
            voice={selectedVoice}
            speed={speed}
            onLangChange={handleSelectLanguage}
            onVoiceChange={handleVoiceChange}
            onSpeedChange={setSpeed}
            isAuthenticated={userAllowance?.isAuthenticated === true || isLoggedIn}
            onApplyTemplate={(tplText) => setText(tplText)}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
