"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/theme/ThemeProvider";
import { ALL_LANGUAGES_CATALOG } from "@/lib/tts/catalog";
import {
  AUDIO_CONTROL_SETTINGS,
  SPEAKING_STYLE_MODES,
  type AudioOutputFormat,
} from "@/config/control";
import {
  clearAccountClientCaches,
  DEFAULT_USER_PREFERENCES,
  getUserPreferences,
  saveUserPreferences,
  type UserTTSPreferences,
} from "@/lib/userPreferences";
import AccountNavBar from "@/components/layout/AccountNavBar";
import {
  BellIcon,
  CheckIcon,
  LockIcon,
  LogOutIcon,
  MoonIcon,
  PauseIcon,
  PlayIcon,
  SettingsIcon,
  ShieldIcon,
  SlidersIcon,
  SunIcon,
} from "@/components/ui/LucideIcons";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");
  const [prefs, setPrefs] = useState<UserTTSPreferences>(
    DEFAULT_USER_PREFERENCES
  );
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSavedMsg, setPrefsSavedMsg] = useState<string | null>(null);

  // Audio preview state
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Security password form state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPwd, setUpdatingPwd] = useState(false);
  const [securityMsg, setSecurityMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [signingOutAll, setSigningOutAll] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;
      if (!user) {
        router.replace("/login?next=/settings");
        return;
      }

      setUserEmail(user.email || "");

      const localPrefs = getUserPreferences();
      const cloudPrefs = user.user_metadata?.tts_preferences;
      const merged: UserTTSPreferences = cloudPrefs
        ? {
            ...DEFAULT_USER_PREFERENCES,
            ...localPrefs,
            ...cloudPrefs,
            notifications: {
              ...DEFAULT_USER_PREFERENCES.notifications,
              ...(localPrefs.notifications || {}),
              ...(cloudPrefs.notifications || {}),
            },
          }
        : localPrefs;

      setPrefs(merged);
      saveUserPreferences(merged);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
      if (audioRef.current) audioRef.current.pause();
    };
  }, [router]);

  const selectedLangObj = useMemo(
    () =>
      ALL_LANGUAGES_CATALOG.find((l) => l.code === prefs.defaultLanguage) ||
      ALL_LANGUAGES_CATALOG[0],
    [prefs.defaultLanguage]
  );

  const handleLanguageChange = (code: string) => {
    const langMatch =
      ALL_LANGUAGES_CATALOG.find((l) => l.code === code) ||
      ALL_LANGUAGES_CATALOG[0];
    setPrefs((prev) => ({
      ...prev,
      defaultLanguage: langMatch.code,
      defaultVoice: langMatch.voices[0]?.id || prev.defaultVoice,
    }));
  };

  const handleStyleChange = (styleId: string) => {
    const styleObj = SPEAKING_STYLE_MODES.find((s) => s.id === styleId);
    setPrefs((prev) => ({
      ...prev,
      defaultStyle: styleId,
      defaultSpeed:
        styleObj && styleId !== "other" ? styleObj.speed : prev.defaultSpeed,
      defaultPitch:
        styleObj && styleId !== "other" ? styleObj.pitch : prev.defaultPitch,
    }));
  };

  const handlePreviewDefaultVoice = async () => {
    if (previewPlaying && audioRef.current) {
      audioRef.current.pause();
      setPreviewPlaying(false);
      return;
    }

    setPreviewLoading(true);
    try {
      const res = await fetch("/api/voices/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang: prefs.defaultLanguage,
          voice: prefs.defaultVoice,
          speed: prefs.defaultSpeed,
          pitch: prefs.defaultPitch,
        }),
      });
      if (!res.ok) {
        setPreviewLoading(false);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.volume = Math.max(0.1, Math.min(1, prefs.defaultVolume / 100));
      audioRef.current = audio;
      setPreviewLoading(false);
      setPreviewPlaying(true);
      audio.onended = () => {
        setPreviewPlaying(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setPreviewPlaying(false);
        URL.revokeObjectURL(url);
      };
      await audio.play();
    } catch {
      setPreviewLoading(false);
      setPreviewPlaying(false);
    }
  };

  const handleSaveAllSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    setPrefsSavedMsg(null);

    saveUserPreferences(prefs);

    try {
      const supabase = createClient();
      await supabase.auth.updateUser({
        data: {
          tts_preferences: prefs,
        },
      });
      setPrefsSavedMsg(
        "Preferences saved! Your Studio defaults and notifications are now active."
      );
      setTimeout(() => setPrefsSavedMsg(null), 4000);
    } catch {
      setPrefsSavedMsg("Preferences saved locally!");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleResetDefaults = () => {
    setPrefs(DEFAULT_USER_PREFERENCES);
    saveUserPreferences(DEFAULT_USER_PREFERENCES);
    setPrefsSavedMsg("Reset to Studio factory defaults.");
    setTimeout(() => setPrefsSavedMsg(null), 3000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMsg(null);

    if (newPassword.length < 8) {
      setSecurityMsg({
        type: "error",
        text: "Password must be at least 8 characters.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityMsg({
        type: "error",
        text: "New password and confirmation do not match.",
      });
      return;
    }

    setUpdatingPwd(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        setSecurityMsg({ type: "error", text: error.message });
      } else {
        setNewPassword("");
        setConfirmPassword("");
        setSecurityMsg({
          type: "success",
          text: "Password updated successfully.",
        });
      }
    } catch {
      setSecurityMsg({
        type: "error",
        text: "Could not update password. Please try again.",
      });
    } finally {
      setUpdatingPwd(false);
    }
  };

  const handleSignOutEverywhere = async () => {
    setSigningOutAll(true);
    const supabase = createClient();
    try {
      await supabase.auth.signOut({ scope: "global" });
    } finally {
      clearAccountClientCaches();
      window.location.href = "/";
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-full border-3 border-orange-500/20 border-t-[#ff5500] animate-spin" />
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
            Loading workspace settings...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen text-slate-900 dark:text-zinc-100 pb-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-8">
        <AccountNavBar />

        {/* Header */}
        <div className="pb-6 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-orange-500/10 text-[#ff5500]">
              <SettingsIcon size={20} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              Settings &amp; Preferences
            </h1>
          </div>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
            Customize theme appearance, default Studio voice settings, audio output, notifications, and account security.
          </p>
        </div>

        {prefsSavedMsg && (
          <div
            role="status"
            className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300"
          >
            ✓ {prefsSavedMsg}
          </div>
        )}

        <form onSubmit={handleSaveAllSettings} className="mt-8 space-y-6">
          {/* 1. APPEARANCE: LIGHT MODE / DARK MODE */}
          <section className="rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white/85 dark:bg-white/[0.03] p-6 sm:p-7 backdrop-blur-xl shadow-xs">
            <h2 className="text-base font-extrabold text-slate-950 dark:text-white">
              Appearance Theme
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Choose between crisp Light Mode and Studio Dark Mode.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex items-center justify-between rounded-2xl border p-4 text-left transition cursor-pointer ${
                  theme === "light"
                    ? "border-2 border-[#ff5500] bg-orange-500/[0.06]"
                    : "border-slate-200 dark:border-zinc-800 hover:border-orange-400/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
                    <SunIcon size={20} />
                  </span>
                  <div>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Light Mode
                    </div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400">
                      Clean daylight workspace
                    </div>
                  </div>
                </div>
                {theme === "light" && (
                  <CheckIcon size={18} className="text-[#ff5500]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex items-center justify-between rounded-2xl border p-4 text-left transition cursor-pointer ${
                  theme === "dark"
                    ? "border-2 border-[#ff5500] bg-orange-500/[0.08]"
                    : "border-slate-200 dark:border-zinc-800 hover:border-orange-400/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
                    <MoonIcon size={20} />
                  </span>
                  <div>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Dark Mode
                    </div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400">
                      Low-glare studio experience
                    </div>
                  </div>
                </div>
                {theme === "dark" && (
                  <CheckIcon size={18} className="text-[#ff5500]" />
                )}
              </button>
            </div>
          </section>

          {/* 2. DEFAULT LANGUAGE, VOICE & SPEAKING STYLE */}
          <section className="rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white/85 dark:bg-white/[0.03] p-6 sm:p-7 backdrop-blur-xl shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <SlidersIcon size={18} className="text-[#ff5500]" />
                <div>
                  <h2 className="text-base font-extrabold text-slate-950 dark:text-white">
                    Default Voice &amp; Studio Configuration
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Automatically pre-selected whenever you open the Text-to-Speech Studio.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePreviewDefaultVoice}
                className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3.5 py-2 text-xs font-bold text-[#ff5500] dark:text-orange-400 hover:bg-orange-500/20 transition cursor-pointer self-start sm:self-auto"
              >
                {previewPlaying ? (
                  <>
                    <PauseIcon size={14} />
                    <span>Stop Sample</span>
                  </>
                ) : (
                  <>
                    <PlayIcon size={14} />
                    <span>
                      {previewLoading ? "Loading..." : "Test Default Voice"}
                    </span>
                  </>
                )}
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Default Language
                </label>
                <select
                  value={prefs.defaultLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
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
                  Default Voice
                </label>
                <select
                  value={prefs.defaultVoice}
                  onChange={(e) =>
                    setPrefs((p) => ({ ...p, defaultVoice: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
                >
                  {selectedLangObj.voices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label} ({v.gender === "male" ? "Male" : "Female"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Default Speaking Style
                </label>
                <select
                  value={prefs.defaultStyle}
                  onChange={(e) => handleStyleChange(e.target.value)}
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

            {/* 3. AUDIO PREFERENCES */}
            <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.07] space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Audio Preferences
              </h3>

              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-600 dark:text-zinc-300">Default Speed</span>
                    <span className="text-[#ff5500]">{prefs.defaultSpeed.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min={AUDIO_CONTROL_SETTINGS.speed.min}
                    max={AUDIO_CONTROL_SETTINGS.speed.max}
                    step={AUDIO_CONTROL_SETTINGS.speed.step}
                    value={prefs.defaultSpeed}
                    onChange={(e) =>
                      setPrefs((p) => ({
                        ...p,
                        defaultSpeed: Number(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-600 dark:text-zinc-300">Default Pitch</span>
                    <span className="text-[#ff5500]">
                      {prefs.defaultPitch > 0
                        ? `+${prefs.defaultPitch}`
                        : prefs.defaultPitch}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={AUDIO_CONTROL_SETTINGS.pitch.min}
                    max={AUDIO_CONTROL_SETTINGS.pitch.max}
                    step={AUDIO_CONTROL_SETTINGS.pitch.step}
                    value={prefs.defaultPitch}
                    onChange={(e) =>
                      setPrefs((p) => ({
                        ...p,
                        defaultPitch: Number(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-600 dark:text-zinc-300">Preview Volume</span>
                    <span className="text-[#ff5500]">{prefs.defaultVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={prefs.defaultVolume}
                    onChange={(e) =>
                      setPrefs((p) => ({
                        ...p,
                        defaultVolume: Number(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 pt-2">
                <div className="rounded-xl border border-slate-200 dark:border-zinc-800 p-3">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-1">
                    Preferred Output Format
                  </label>
                  <select
                    value={prefs.outputFormat}
                    onChange={(e) =>
                      setPrefs((p) => ({
                        ...p,
                        outputFormat: e.target.value as AudioOutputFormat,
                      }))
                    }
                    className="w-full bg-transparent text-xs font-extrabold uppercase text-slate-900 dark:text-white focus:outline-none"
                  >
                    {AUDIO_CONTROL_SETTINGS.outputFormats.map((fmt) => (
                      <option
                        key={fmt}
                        value={fmt}
                        className="bg-white dark:bg-zinc-900"
                      >
                        {fmt.toUpperCase()} Studio Audio
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-zinc-800 p-3 cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Natural Pauses
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Smooth sentence breathing
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.naturalPauses}
                    onChange={(e) =>
                      setPrefs((p) => ({
                        ...p,
                        naturalPauses: e.target.checked,
                      }))
                    }
                    className="size-4 accent-[#ff5500]"
                  />
                </label>

                <label className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-zinc-800 p-3 cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Auto-Play Audio
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Play immediately when ready
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.autoPlay}
                    onChange={(e) =>
                      setPrefs((p) => ({
                        ...p,
                        autoPlay: e.target.checked,
                      }))
                    }
                    className="size-4 accent-[#ff5500]"
                  />
                </label>
              </div>
            </div>
          </section>

          {/* 4. NOTIFICATION PREFERENCES */}
          <section className="rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white/85 dark:bg-white/[0.03] p-6 sm:p-7 backdrop-blur-xl shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <BellIcon size={18} className="text-[#ff5500]" />
              <div>
                <h2 className="text-base font-extrabold text-slate-950 dark:text-white">
                  Notification Preferences
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Control account alerts for {userEmail}.
                </p>
              </div>
            </div>

            <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
              {[
                {
                  key: "lowCreditAlerts" as const,
                  title: "Character Allowance Alerts",
                  desc: "Notify when your weekly character allowance runs low.",
                },
                {
                  key: "expiryReminders" as const,
                  title: "Audio Retention Expiry Reminders",
                  desc: "Show helpful reminders before 24-hour generated audio history expires.",
                },
                {
                  key: "productUpdates" as const,
                  title: "New Neural Voices & Studio Feature Releases",
                  desc: "Occasional updates when new Indian regional or global AI voices launch.",
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between gap-4 py-3.5 cursor-pointer"
                >
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400">
                      {item.desc}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.notifications[item.key]}
                    onChange={(e) =>
                      setPrefs((p) => ({
                        ...p,
                        notifications: {
                          ...p.notifications,
                          [item.key]: e.target.checked,
                        },
                      }))
                    }
                    className="size-4 shrink-0 accent-[#ff5500]"
                  />
                </label>
              ))}
            </div>
          </section>

          {/* Save / Reset Preferences Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:border-orange-400 transition cursor-pointer"
            >
              Reset to Factory Defaults
            </button>

            <button
              type="submit"
              disabled={savingPrefs}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6a1f] to-[#ff4400] px-6 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-orange-500/25 hover:brightness-110 transition cursor-pointer disabled:opacity-50"
            >
              <CheckIcon size={16} />
              <span>{savingPrefs ? "Saving Preferences..." : "Save All Preferences"}</span>
            </button>
          </div>
        </form>

        {/* 5. ACCOUNT SECURITY SETTINGS */}
        <section className="mt-10 rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white/85 dark:bg-white/[0.03] p-6 sm:p-7 backdrop-blur-xl shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-black/[0.06] dark:border-white/[0.07] pb-4">
            <ShieldIcon size={19} className="text-emerald-500" />
            <div>
              <h2 className="text-base font-extrabold text-slate-950 dark:text-white">
                Account Security Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Update your login password or revoke active sessions across devices.
              </p>
            </div>
          </div>

          {securityMsg && (
            <div
              role="status"
              className={`rounded-xl border px-4 py-2.5 text-xs font-bold ${
                securityMsg.type === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
              }`}
            >
              {securityMsg.text}
            </div>
          )}

          <form
            onSubmit={handlePasswordChange}
            className="grid gap-4 sm:grid-cols-3 items-end"
          >
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={updatingPwd}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 px-4 py-2.5 text-xs font-extrabold text-[#ff5500] dark:text-orange-400 transition cursor-pointer disabled:opacity-50"
            >
              <LockIcon size={14} />
              <span>{updatingPwd ? "Updating..." : "Change Password"}</span>
            </button>
          </form>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-black/[0.06] dark:border-white/[0.07]">
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Global Session Sign Out
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Immediately end all active login sessions across browsers and mobile devices.
              </p>
            </div>

            <button
              type="button"
              disabled={signingOutAll}
              onClick={handleSignOutEverywhere}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/25 bg-rose-500/[0.07] hover:bg-rose-500/15 px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 transition cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <LogOutIcon size={14} />
              <span>
                {signingOutAll ? "Signing Out..." : "Sign Out All Devices"}
              </span>
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

