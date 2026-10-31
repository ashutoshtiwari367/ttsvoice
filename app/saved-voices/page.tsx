"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ALL_LANGUAGES_CATALOG } from "@/lib/tts/catalog";
import {
  AUDIO_CONTROL_SETTINGS,
  DEFAULT_PRESETS,
  PRESETS_STORAGE_KEY,
  SPEAKING_STYLE_MODES,
  type VoicePreset,
} from "@/config/control";
import {
  getFavoriteVoices,
  toggleFavoriteVoiceItem,
  type FavoriteVoiceItem,
} from "@/lib/userPreferences";
import AdminPanelLayout from "@/components/layout/AdminPanelLayout";
import {
  BookmarkMicIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  SlidersIcon,
  SparklesIcon,
  StarIcon,
  TrashIcon,
} from "@/components/ui/LucideIcons";

export default function SavedVoicesPage() {
  const router = useRouter();
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Saved Presets & Favorite Voices
  const [presets, setPresets] = useState<VoicePreset[]>(DEFAULT_PRESETS);
  const [favorites, setFavorites] = useState<FavoriteVoiceItem[]>([]);

  // New Preset Creator State
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [selectedLang, setSelectedLang] = useState<string>(
    AUDIO_CONTROL_SETTINGS.defaultLanguage
  );
  const [selectedVoice, setSelectedVoice] = useState<string>(
    AUDIO_CONTROL_SETTINGS.defaultVoice
  );
  const [selectedStyle, setSelectedStyle] = useState<string>(
    AUDIO_CONTROL_SETTINGS.defaultStyle
  );
  const [speed, setSpeed] = useState<number>(AUDIO_CONTROL_SETTINGS.speed.default);
  const [pitch, setPitch] = useState<number>(AUDIO_CONTROL_SETTINGS.pitch.default);
  const [formNotice, setFormNotice] = useState<string | null>(null);

  // Voice Catalog Explorer Filter
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogLang, setCatalogLang] = useState<string>("all");

  // Audio Sample Preview State
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let active = true;

    async function init() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;
      if (!user) {
        router.replace("/login?next=/saved-voices");
        return;
      }

      setIsAuthenticated(true);

      // Load local presets & favorite voices
      try {
        const storedPresets = localStorage.getItem(PRESETS_STORAGE_KEY);
        if (storedPresets) {
          const parsed = JSON.parse(storedPresets);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPresets(parsed);
          }
        }
      } catch {
        // ignore
      }

      setFavorites(getFavoriteVoices());
      setLoadingAuth(false);
    }

    init();

    const syncFavorites = () => setFavorites(getFavoriteVoices());
    window.addEventListener("tts-saved-voices-updated", syncFavorites);

    return () => {
      active = false;
      window.removeEventListener("tts-saved-voices-updated", syncFavorites);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [router]);

  const activeLangObj = useMemo(
    () =>
      ALL_LANGUAGES_CATALOG.find((l) => l.code === selectedLang) ||
      ALL_LANGUAGES_CATALOG[0],
    [selectedLang]
  );

  const activeVoiceObj = useMemo(
    () =>
      activeLangObj.voices.find((v) => v.id === selectedVoice) ||
      activeLangObj.voices[0],
    [activeLangObj, selectedVoice]
  );

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId);
    const mode = SPEAKING_STYLE_MODES.find((s) => s.id === styleId);
    if (mode && styleId !== "other") {
      setSpeed(mode.speed);
      setPitch(mode.pitch);
    }
  };

  const handlePreviewVoice = async (
    key: string,
    langCode: string,
    voiceId: string,
    rate = 1.0,
    pitchVal = 0
  ) => {
    if (playingKey === key && audioRef.current) {
      audioRef.current.pause();
      setPlayingKey(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingKey(null);
    }

    setLoadingKey(key);
    try {
      const res = await fetch("/api/voices/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang: langCode,
          voice: voiceId,
          speed: rate,
          pitch: pitchVal,
        }),
      });

      if (!res.ok) {
        setLoadingKey(null);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      setLoadingKey(null);
      setPlayingKey(key);

      audio.onended = () => {
        setPlayingKey(null);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setPlayingKey(null);
        URL.revokeObjectURL(url);
      };

      await audio.play();
    } catch {
      setLoadingKey(null);
      setPlayingKey(null);
    }
  };

  const handleCreatePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = presetName.trim();
    if (!trimmed) {
      setFormNotice("Please enter a name for your voice preset.");
      return;
    }

    const newPreset: VoicePreset = {
      id: `custom-${Date.now()}`,
      name: trimmed,
      lang: activeLangObj.code,
      langLabel: activeLangObj.label,
      langFlag: activeLangObj.flag,
      voice: activeVoiceObj.id,
      voiceLabel: activeVoiceObj.label,
      gender: (activeVoiceObj.gender as "male" | "female") || "female",
      speed,
      pitch,
      volume: 100,
      style: selectedStyle,
      naturalPauses: true,
      outputFormat: "mp3",
      isCustom: true,
    };

    const next = [newPreset, ...presets];
    setPresets(next);

    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }

    // Best-effort sync to backend templates table
    fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: trimmed,
        voice_code: activeVoiceObj.id,
        language_code: activeLangObj.code,
        speed,
      }),
    }).catch(() => {});

    setPresetName("");
    setFormNotice(null);
    setCreatorOpen(false);
  };

  const handleDeletePreset = (id: string) => {
    const next = presets.filter((p) => p.id !== id);
    setPresets(next);
    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handleToggleFavorite = (
    voiceId: string,
    voiceLabel: string,
    gender: "male" | "female",
    langCode: string,
    langLabel: string,
    langFlag: string
  ) => {
    const res = toggleFavoriteVoiceItem({
      voiceId,
      voiceLabel,
      gender,
      langCode,
      langLabel,
      langFlag,
    });
    setFavorites(res.favorites);
  };

  // Filtered voices for quick favoriting directory
  const browsableVoices = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    const items: Array<{
      voiceId: string;
      voiceLabel: string;
      gender: "male" | "female";
      langCode: string;
      langLabel: string;
      langFlag: string;
    }> = [];

    for (const l of ALL_LANGUAGES_CATALOG) {
      if (catalogLang !== "all" && l.code !== catalogLang) continue;
      for (const v of l.voices) {
        if (
          !q ||
          v.label.toLowerCase().includes(q) ||
          l.label.toLowerCase().includes(q) ||
          v.id.toLowerCase().includes(q)
        ) {
          items.push({
            voiceId: v.id,
            voiceLabel: v.label,
            gender: (v.gender as "male" | "female") || "female",
            langCode: l.code,
            langLabel: l.label,
            langFlag: l.flag,
          });
        }
      }
    }

    return items.slice(0, 18);
  }, [catalogSearch, catalogLang]);

  if (loadingAuth || !isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-full border-3 border-orange-500/20 border-t-[#ff5500] animate-spin" />
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
            Loading your saved voices...
          </p>
        </div>
      </main>
    );
  }

  return (
    <AdminPanelLayout activeTab="saved-voices">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-orange-500/10 text-[#ff5500]">
                <BookmarkMicIcon size={20} />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                Saved Voices &amp; Presets
              </h1>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
              Manage your favorite voices and custom voice presets (language, speaking style, pitch, and speed) for instant one-click selection in Studio.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCreatorOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6a1f] to-[#ff4400] px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-orange-500/25 hover:brightness-110 transition cursor-pointer self-start sm:self-auto"
          >
            <PlusIcon size={16} />
            <span>{creatorOpen ? "Close Preset Builder" : "New Voice Preset"}</span>
          </button>
        </div>

        {/* New Voice Preset Creator Form */}
        {creatorOpen && (
          <form
            onSubmit={handleCreatePreset}
            className="mt-6 rounded-3xl border-2 border-orange-500/30 bg-white/90 dark:bg-[#0e1017] p-6 sm:p-7 shadow-xl shadow-orange-500/5 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3.5">
              <div className="flex items-center gap-2">
                <SlidersIcon size={18} className="text-[#ff5500]" />
                <h2 className="text-base font-extrabold text-slate-950 dark:text-white">
                  Create Custom Voice Preset
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  handlePreviewVoice(
                    "builder-preview",
                    activeLangObj.code,
                    activeVoiceObj.id,
                    speed,
                    pitch
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-[#ff5500] dark:text-orange-400 hover:bg-orange-500/20 transition cursor-pointer"
              >
                {playingKey === "builder-preview" ? (
                  <>
                    <PauseIcon size={13} />
                    <span>Stop Sample</span>
                  </>
                ) : (
                  <>
                    <PlayIcon size={13} />
                    <span>
                      {loadingKey === "builder-preview"
                        ? "Loading..."
                        : "Preview Configuration"}
                    </span>
                  </>
                )}
              </button>
            </div>

            {formNotice && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-300">
                {formNotice}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Preset Name
                </label>
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="e.g. Hindi Documentary"
                  maxLength={60}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Language
                </label>
                <select
                  value={selectedLang}
                  onChange={(e) => {
                    const code = e.target.value;
                    setSelectedLang(code);
                    const found = ALL_LANGUAGES_CATALOG.find((l) => l.code === code);
                    if (found?.voices[0]) setSelectedVoice(found.voices[0].id);
                  }}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
                >
                  {ALL_LANGUAGES_CATALOG.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Voice Avatar
                </label>
                <select
                  value={activeVoiceObj.id}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
                >
                  {activeLangObj.voices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label} ({v.gender === "male" ? "Male" : "Female"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Speaking Style
                </label>
                <select
                  value={selectedStyle}
                  onChange={(e) => handleStyleSelect(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
                >
                  {SPEAKING_STYLE_MODES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.icon} {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 pt-1">
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-700 dark:text-zinc-300">Speaking Speed</span>
                  <span className="text-[#ff5500]">{speed.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={AUDIO_CONTROL_SETTINGS.speed.min}
                  max={AUDIO_CONTROL_SETTINGS.speed.max}
                  step={AUDIO_CONTROL_SETTINGS.speed.step}
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-700 dark:text-zinc-300">Voice Pitch</span>
                  <span className="text-[#ff5500]">
                    {pitch > 0 ? `+${pitch}` : pitch}
                  </span>
                </div>
                <input
                  type="range"
                  min={AUDIO_CONTROL_SETTINGS.pitch.min}
                  max={AUDIO_CONTROL_SETTINGS.pitch.max}
                  step={AUDIO_CONTROL_SETTINGS.pitch.step}
                  value={pitch}
                  onChange={(e) => setPitch(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCreatorOpen(false)}
                className="rounded-xl border border-slate-200 dark:border-zinc-800 px-4 py-2 text-xs font-bold text-slate-600 dark:text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-[#ff6a1f] to-[#ff4400] px-5 py-2 text-xs font-extrabold text-white shadow-md shadow-orange-500/25 cursor-pointer"
              >
                Save Voice Preset
              </button>
            </div>
          </form>
        )}

        {/* 1. SAVED VOICE PRESETS */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
              <SparklesIcon size={18} className="text-[#ff5500]" />
              <span>Voice Presets ({presets.length})</span>
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {presets.map((tpl) => {
              const styleLabel =
                SPEAKING_STYLE_MODES.find((s) => s.id === tpl.style)?.label ||
                tpl.style ||
                "Normal";
              const key = `preset-${tpl.id}`;

              return (
                <div
                  key={tpl.id}
                  className="flex flex-col justify-between rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/85 dark:bg-white/[0.03] p-5 backdrop-blur-xl shadow-xs hover:border-orange-500/35 transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-[#ff5500] dark:text-orange-400">
                          {tpl.isCustom ? "Custom Preset" : "Studio Preset"}
                        </span>
                        <h3 className="mt-2 text-base font-extrabold text-slate-900 dark:text-white">
                          {tpl.name}
                        </h3>
                      </div>

                      {tpl.isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDeletePreset(tpl.id)}
                          aria-label={`Delete ${tpl.name}`}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition cursor-pointer"
                        >
                          <TrashIcon size={15} />
                        </button>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                      <span className="rounded-md bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 text-slate-700 dark:text-zinc-200">
                        {tpl.langFlag} {tpl.langLabel}
                      </span>
                      <span className="rounded-md bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 text-slate-700 dark:text-zinc-200">
                        {tpl.voiceLabel}
                      </span>
                      <span className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-amber-700 dark:text-amber-300">
                        Style: {styleLabel}
                      </span>
                      <span className="rounded-md bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 text-slate-600 dark:text-zinc-400">
                        {tpl.speed.toFixed(2)}x • Pitch {tpl.pitch > 0 ? `+${tpl.pitch}` : tpl.pitch}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-2 pt-3 border-t border-black/[0.05] dark:border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() =>
                        handlePreviewVoice(
                          key,
                          tpl.lang,
                          tpl.voice,
                          tpl.speed,
                          tpl.pitch
                        )
                      }
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:border-orange-500/40 hover:text-[#ff5500] transition cursor-pointer"
                    >
                      {playingKey === key ? (
                        <>
                          <PauseIcon size={13} />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <PlayIcon size={13} />
                          <span>{loadingKey === key ? "..." : "Sample"}</span>
                        </>
                      )}
                    </button>

                    <Link
                      href={`/text-to-speech?lang=${encodeURIComponent(
                        tpl.lang
                      )}&voice=${encodeURIComponent(tpl.voice)}&speed=${
                        tpl.speed
                      }&pitch=${tpl.pitch}&style=${encodeURIComponent(tpl.style)}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ff6a1f] to-[#ff4400] px-3.5 py-2 text-xs font-extrabold text-white shadow-sm hover:brightness-110 transition"
                    >
                      <span>Select in Studio</span>
                      <span aria-hidden="true">&rarr;</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 2. FAVORITE VOICES */}
        <section className="mt-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
                <StarIcon size={18} filled className="text-amber-500" />
                <span>Favorite Voices ({favorites.length})</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Starred voices appear right inside your Studio voice selector for fast access.
              </p>
            </div>
          </div>

          {favorites.length > 0 && (
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              {favorites.map((fav) => {
                const key = `fav-${fav.voiceId}`;
                return (
                  <div
                    key={fav.voiceId}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] dark:bg-amber-500/[0.06] p-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                        <span>{fav.langFlag}</span>
                        <span className="truncate">{fav.voiceLabel}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                        {fav.langLabel} • {fav.gender === "male" ? "Male" : "Female"}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          handlePreviewVoice(key, fav.langCode, fav.voiceId)
                        }
                        title="Play sample"
                        className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2 text-slate-700 dark:text-zinc-200 hover:text-[#ff5500] cursor-pointer"
                      >
                        {playingKey === key ? (
                          <PauseIcon size={13} />
                        ) : (
                          <PlayIcon size={13} />
                        )}
                      </button>

                      <Link
                        href={`/text-to-speech?lang=${encodeURIComponent(
                          fav.langCode
                        )}&voice=${encodeURIComponent(fav.voiceId)}`}
                        className="rounded-lg bg-[#ff5500] px-2.5 py-1.5 text-[11px] font-extrabold text-white hover:bg-[#e64d00] transition"
                      >
                        Use
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          handleToggleFavorite(
                            fav.voiceId,
                            fav.voiceLabel,
                            fav.gender,
                            fav.langCode,
                            fav.langLabel,
                            fav.langFlag
                          )
                        }
                        title="Remove from favorites"
                        className="rounded-lg p-1.5 text-amber-500 hover:bg-amber-500/15 cursor-pointer"
                      >
                        <StarIcon size={15} filled />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Voice Explorer to Add Favorites */}
          <div className="rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.03] p-5 sm:p-6 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/[0.06] dark:border-white/[0.07]">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Explore &amp; Star Voices from Catalog
              </h3>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <SearchIcon
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Search voices..."
                    className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
                  />
                </div>

                <select
                  value={catalogLang}
                  onChange={(e) => setCatalogLang(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-200 focus:border-[#ff5500] focus:outline-none"
                >
                  <option value="all">All Languages</option>
                  {ALL_LANGUAGES_CATALOG.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {browsableVoices.map((v) => {
                const isFav = favorites.some((f) => f.voiceId === v.voiceId);
                const key = `cat-${v.voiceId}`;

                return (
                  <div
                    key={v.voiceId}
                    className="flex items-center justify-between gap-2 rounded-xl border border-black/[0.06] dark:border-white/[0.07] bg-black/[0.015] dark:bg-white/[0.02] p-3 hover:border-orange-500/30 transition"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {v.langFlag} {v.voiceLabel}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                        {v.langLabel} • {v.gender === "male" ? "Male" : "Female"}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          handlePreviewVoice(key, v.langCode, v.voiceId)
                        }
                        title="Preview sample"
                        className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1.5 text-slate-600 dark:text-zinc-300 hover:text-[#ff5500] cursor-pointer"
                      >
                        {playingKey === key ? (
                          <PauseIcon size={13} />
                        ) : (
                          <PlayIcon size={13} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleToggleFavorite(
                            v.voiceId,
                            v.voiceLabel,
                            v.gender,
                            v.langCode,
                            v.langLabel,
                            v.langFlag
                          )
                        }
                        title={isFav ? "Saved in Favorites" : "Save to Favorites"}
                        className={`rounded-lg border p-1.5 transition cursor-pointer ${
                          isFav
                            ? "border-amber-500/40 bg-amber-500/15 text-amber-500"
                            : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-400 hover:text-amber-500"
                        }`}
                      >
                        <StarIcon size={14} filled={isFav} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </AdminPanelLayout>
  );
}

