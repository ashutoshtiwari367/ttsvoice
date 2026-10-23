"use client";

import { useEffect, useState } from "react";
import CountryFlag from "@/components/ui/CountryFlag";

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
  voices: Voice[];
}

interface VoiceControlsProps {
  lang: string;
  voice: string;
  speed: number;
  onLangChange: (lang: string) => void;
  onVoiceChange: (voice: string) => void;
  onSpeedChange: (speed: number) => void;
}

// 20+ Indian & Global Languages with voices
export const ALL_LANGUAGES_CATALOG: Language[] = [
  {
    code: "hi-IN",
    label: "🇮🇳 Hindi (हिन्दी)",
    voices: [
      { id: "hi-IN-Wavenet-A", label: "Aditi (अदिति)", gender: "female", tier: "free" },
      { id: "hi-IN-Wavenet-B", label: "Arjun (अर्जुन)", gender: "male", tier: "free" },
      { id: "hi-IN-Wavenet-C", label: "Priya (प्रिया)", gender: "female", tier: "free" },
      { id: "hi-IN-Wavenet-D", label: "Rohit (रोहित)", gender: "male", tier: "free" },
      { id: "hi-IN-Neural2-A", label: "Ananya Studio (अनन्या)", gender: "female", tier: "paid" },
      { id: "hi-IN-Neural2-B", label: "Kabir Studio (कबीर)", gender: "male", tier: "paid" },
    ],
  },
  {
    code: "en-IN",
    label: "🇮🇳 Indian English",
    voices: [
      { id: "en-IN-Wavenet-A", label: "Isha (Natural & Smooth)", gender: "female", tier: "free" },
      { id: "en-IN-Wavenet-B", label: "Dev (Corporate & News)", gender: "male", tier: "free" },
      { id: "en-IN-Wavenet-C", label: "Meera (Youthful Voice)", gender: "female", tier: "free" },
      { id: "en-IN-Wavenet-D", label: "Rohan (Friendly & Tech)", gender: "male", tier: "free" },
      { id: "en-IN-Neural2-A", label: "Aarav Ultra (Pro Voiceover)", gender: "male", tier: "paid" },
    ],
  },
  {
    code: "ta-IN",
    label: "🇮🇳 Tamil (தமிழ்)",
    voices: [
      { id: "ta-IN-Wavenet-A", label: "Vani (வாணி)", gender: "female", tier: "free" },
      { id: "ta-IN-Wavenet-B", label: "Karthik (கார்த்திக்)", gender: "male", tier: "free" },
      { id: "ta-IN-Wavenet-C", label: "Deepa (தீபா)", gender: "female", tier: "free" },
    ],
  },
  {
    code: "te-IN",
    label: "🇮🇳 Telugu (తెలుగు)",
    voices: [
      { id: "te-IN-Standard-A", label: "Lakshmi (లక్ష్మి)", gender: "female", tier: "free" },
      { id: "te-IN-Standard-B", label: "Suresh (సురేష్)", gender: "male", tier: "free" },
    ],
  },
  {
    code: "mr-IN",
    label: "🇮🇳 Marathi (मराठी)",
    voices: [
      { id: "mr-IN-Wavenet-A", label: "Sai (साई)", gender: "female", tier: "free" },
      { id: "mr-IN-Wavenet-B", label: "Aniket (अनिकेत)", gender: "male", tier: "free" },
      { id: "mr-IN-Wavenet-C", label: "Tanvi (तन्वी)", gender: "female", tier: "free" },
    ],
  },
  {
    code: "bn-IN",
    label: "🇮🇳 Bengali (বাংলা)",
    voices: [
      { id: "bn-IN-Wavenet-A", label: "Tithi (তিথি)", gender: "female", tier: "free" },
      { id: "bn-IN-Wavenet-B", label: "Subir (সুবীর)", gender: "male", tier: "free" },
    ],
  },
  {
    code: "gu-IN",
    label: "🇮🇳 Gujarati (ગુજરાતી)",
    voices: [
      { id: "gu-IN-Wavenet-A", label: "Dhara (ધારા)", gender: "female", tier: "free" },
      { id: "gu-IN-Wavenet-B", label: "Harish (હરીશ)", gender: "male", tier: "free" },
    ],
  },
  {
    code: "kn-IN",
    label: "🇮🇳 Kannada (ಕನ್ನಡ)",
    voices: [
      { id: "kn-IN-Wavenet-A", label: "Sharada (ಶಾರದಾ)", gender: "female", tier: "free" },
      { id: "kn-IN-Wavenet-B", label: "Chetan (ಚೇತನ್)", gender: "male", tier: "free" },
    ],
  },
  {
    code: "ml-IN",
    label: "🇮🇳 Malayalam (മലയാളം)",
    voices: [
      { id: "ml-IN-Wavenet-A", label: "Anjali (അഞ്ജലി)", gender: "female", tier: "free" },
      { id: "ml-IN-Wavenet-B", label: "Vishnu (വിഷ്ണു)", gender: "male", tier: "free" },
    ],
  },
  {
    code: "pa-IN",
    label: "🇮🇳 Punjabi (ਪੰਜਾਬੀ)",
    voices: [
      { id: "pa-IN-Wavenet-A", label: "Simran (ਸਿਮਰਨ)", gender: "female", tier: "free" },
      { id: "pa-IN-Wavenet-B", label: "Harpreet (ਹਰਪ੍ਰੀਤ)", gender: "male", tier: "free" },
    ],
  },
  {
    code: "ur-IN",
    label: "🇮🇳 Urdu (اردو)",
    voices: [
      { id: "ur-IN-Wavenet-A", label: "Zoya (زویا)", gender: "female", tier: "free" },
      { id: "ur-IN-Wavenet-B", label: "Tariq (طارق)", gender: "male", tier: "free" },
    ],
  },
  {
    code: "or-IN",
    label: "🇮🇳 Odia (ଓଡ଼ିଆ)",
    voices: [
      { id: "or-IN-Standard-A", label: "Rashmi (ରଶ୍ମି)", gender: "female", tier: "free" },
      { id: "or-IN-Standard-B", label: "Bikram (ବିକ୍ରମ)", gender: "male", tier: "free" },
    ],
  },
  {
    code: "as-IN",
    label: "🇮🇳 Assamese (অসমীয়া)",
    voices: [
      { id: "as-IN-Standard-A", label: "Parineeti (পৰিনীতি)", gender: "female", tier: "free" },
      { id: "as-IN-Standard-B", label: "Bhupen (ভূপেন)", gender: "male", tier: "free" },
    ],
  },
  {
    code: "en-US",
    label: "🇺🇸 English (US)",
    voices: [
      { id: "en-US-Journey-F", label: "Jenny (US Studio Story)", gender: "female", tier: "free" },
      { id: "en-US-Journey-D", label: "Guy (US Radio Host)", gender: "male", tier: "free" },
    ],
  },
  {
    code: "en-GB",
    label: "🇬🇧 English (UK)",
    voices: [
      { id: "en-GB-Wavenet-A", label: "Sonia (British Classical)", gender: "female", tier: "free" },
      { id: "en-GB-Wavenet-B", label: "Ryan (British Narrator)", gender: "male", tier: "free" },
    ],
  },
  {
    code: "es-ES",
    label: "🇪🇸 Spanish (Español)",
    voices: [
      { id: "es-ES-Wavenet-B", label: "Lucia (Español Claro)", gender: "female", tier: "free" },
      { id: "es-ES-Wavenet-C", label: "Alvaro (Español Dinámico)", gender: "male", tier: "free" },
    ],
  },
  {
    code: "fr-FR",
    label: "🇫🇷 French (Français)",
    voices: [
      { id: "fr-FR-Wavenet-A", label: "Celine (Français Doux)", gender: "female", tier: "free" },
      { id: "fr-FR-Wavenet-B", label: "Henri (Français Élégant)", gender: "male", tier: "free" },
    ],
  },
  {
    code: "de-DE",
    label: "🇩🇪 German (Deutsch)",
    voices: [
      { id: "de-DE-Wavenet-A", label: "Marlene (Deutsch Klar)", gender: "female", tier: "free" },
      { id: "de-DE-Wavenet-B", label: "Klaus (Deutsch Markant)", gender: "male", tier: "free" },
    ],
  },
  {
    code: "ar-XA",
    label: "🇸🇦 Arabic (العربية)",
    voices: [
      { id: "ar-XA-Wavenet-A", label: "Fatima (فاطمة)", gender: "female", tier: "free" },
      { id: "ar-XA-Wavenet-B", label: "Omar (عمر)", gender: "male", tier: "free" },
    ],
  },
  {
    code: "ja-JP",
    label: "🇯🇵 Japanese (日本語)",
    voices: [
      { id: "ja-JP-Wavenet-A", label: "Nanami (七海)", gender: "female", tier: "free" },
      { id: "ja-JP-Wavenet-C", label: "Keita (健太)", gender: "male", tier: "free" },
    ],
  },
];

const femaleGradients = [
  "from-pink-500 to-rose-400 shadow-rose-500/20",
  "from-purple-500 to-indigo-400 shadow-purple-500/20",
  "from-amber-400 to-orange-500 shadow-orange-500/20",
  "from-teal-400 to-emerald-500 shadow-emerald-500/20",
];

const maleGradients = [
  "from-blue-500 to-cyan-400 shadow-blue-500/20",
  "from-indigo-500 to-violet-400 shadow-indigo-500/20",
  "from-emerald-500 to-teal-400 shadow-teal-500/20",
  "from-amber-500 to-orange-600 shadow-amber-500/20",
];

function getAvatarDetails(v?: Voice) {
  if (!v) return { isFemale: true, gradient: femaleGradients[0], persona: "Natural Voice" };
  const isFemale = v.gender.toLowerCase() === "female";
  const gradient = isFemale ? femaleGradients[0] : maleGradients[0];
  let persona = isFemale ? "Warm & Expressive" : "Clear & Confident";
  if (v.label.toLowerCase().includes("studio") || v.tier === "paid") {
    persona = "Ultra HD Studio";
  } else if (v.label.toLowerCase().includes("story") || v.label.toLowerCase().includes("narrat")) {
    persona = "Storyteller & Audiobook";
  } else if (v.label.toLowerCase().includes("news") || v.label.toLowerCase().includes("corporat")) {
    persona = "News & Professional";
  }
  return { isFemale, gradient, persona };
}

export default function VoiceControls({
  lang,
  voice,
  speed,
  onLangChange,
  onVoiceChange,
  onSpeedChange,
}: VoiceControlsProps) {
  const [languages, setLanguages] = useState<Language[]>(ALL_LANGUAGES_CATALOG);
  const [isPlayingSample, setIsPlayingSample] = useState(false);

  // Merge extra voices from API if available
  useEffect(() => {
    let cancelled = false;
    fetch("/api/voices", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const apiLangs: Language[] = data.languages ?? [];
        if (apiLangs.length > 0) {
          // Merge API languages with the 20+ base languages catalog
          const existingCodes = new Set(ALL_LANGUAGES_CATALOG.map((l) => l.code));
          const merged = [...ALL_LANGUAGES_CATALOG];
          for (const al of apiLangs) {
            const idx = merged.findIndex((m) => m.code === al.code);
            if (idx >= 0) {
              const existingVoiceIds = new Set(merged[idx].voices.map((v) => v.id));
              const newVoices = al.voices.filter((v) => !existingVoiceIds.has(v.id));
              merged[idx] = {
                ...merged[idx],
                voices: [...merged[idx].voices, ...newVoices],
              };
            } else {
              merged.push(al);
            }
          }
          setLanguages(merged);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // ── R14: Saved Templates (tt_user_template) ──────────────────────────────
  interface SavedTemplate {
    id: number;
    name: string;
    voice_code: string;
    language_code: string;
    speed: number;
  }
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [savingPreset, setSavingPreset] = useState(false);
  const [presetMsg, setPresetMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const loadTemplates = async () => {
    try {
      const res = await fetch("/api/templates");
      if (res.ok) {
        const json = await res.json();
        setTemplates(json.templates || []);
      }
    } catch (err) {
      console.error("fetch_templates_failed", err);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleSavePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetName.trim()) return;
    setSavingPreset(true);
    setPresetMsg(null);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: presetName.trim(),
          voice_code: voice,
          language_code: lang,
          speed: speed,
        }),
      });

      if (res.status === 401) {
        setPresetMsg({ text: "Please log in to save presets.", isError: true });
        return;
      }

      if (res.ok) {
        setPresetMsg({ text: "Preset saved successfully!", isError: false });
        setPresetName("");
        setTimeout(() => {
          setShowSavePresetModal(false);
          setPresetMsg(null);
        }, 1200);
        loadTemplates();
      } else {
        const errJson = await res.json();
        setPresetMsg({ text: errJson.error || "Failed to save preset.", isError: true });
      }
    } catch {
      setPresetMsg({ text: "Network error saving preset.", isError: true });
    } finally {
      setSavingPreset(false);
    }
  };

  const handleSelectTemplate = (templateIdStr: string) => {
    if (!templateIdStr) return;
    const t = templates.find((item) => String(item.id) === templateIdStr);
    if (!t) return;
    onLangChange(t.language_code);
    onVoiceChange(t.voice_code);
    onSpeedChange(Number(t.speed) || 1.0);
  };

  const handleDeleteTemplate = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/templates?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setTemplates((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("delete_template_failed", err);
    }
  };

  // Ensure selected voice belongs to current language
  useEffect(() => {
    const current = languages.find((l) => l.code === lang);
    if (current && !current.voices.some((v) => v.id === voice)) {
      if (current.voices[0]) {
        onVoiceChange(current.voices[0].id);
      }
    }
  }, [lang, languages, voice, onVoiceChange]);

  const currentLang = languages.find((l) => l.code === lang) ?? languages[0];
  const voices = currentLang?.voices ?? [];
  const selectedVoice = voices.find((v) => v.id === voice) ?? voices[0];
  const avatar = getAvatarDetails(selectedVoice);

  const handleLangChange = (newCode: string) => {
    onLangChange(newCode);
    const newLang = languages.find((l) => l.code === newCode);
    if (newLang?.voices[0]) {
      onVoiceChange(newLang.voices[0].id);
    }
  };

  const playSample = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !selectedVoice) return;
    window.speechSynthesis.cancel();
    if (isPlayingSample) {
      setIsPlayingSample(false);
      return;
    }
    const sampleText =
      selectedVoice.gender.toLowerCase() === "female"
        ? `Namaste, this is ${selectedVoice.label.split(" ")[0]}. Your text to speech avatar.`
        : `Hello, this is ${selectedVoice.label.split(" ")[0]}. Ready to speak your script.`;
    const utterance = new SpeechSynthesisUtterance(sampleText);
    utterance.rate = speed;
    utterance.onend = () => setIsPlayingSample(false);
    utterance.onerror = () => setIsPlayingSample(false);
    setIsPlayingSample(true);
    window.speechSynthesis.speak(utterance);
  };

  const popularLangs = ["hi-IN", "en-IN", "ta-IN", "te-IN", "mr-IN", "bn-IN"];

  return (
    <div className="mt-6 space-y-5">
      {/* ── Top Bar: Quick Switch Language Chips + Saved Presets ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
            Popular:
          </span>
          {languages
            .filter((l) => popularLangs.includes(l.code))
            .map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => handleLangChange(l.code)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  lang === l.code
                    ? "bg-[#ff5500] text-white shadow-sm"
                    : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-orange-300 dark:hover:border-orange-500"
                }`}
              >
                <CountryFlag country={l.code.split("-")[1] || "IN"} size={14} className="size-3.5" />
                <span>{l.label.replace(/^[^\s]+\s*/, "").split(" ")[0]}</span>
              </button>
            ))}
        </div>

        {/* Saved Presets Action */}
        <div className="flex items-center gap-2">
          {templates.length > 0 && (
            <div className="relative">
              <select
                onChange={(e) => {
                  handleSelectTemplate(e.target.value);
                  e.target.value = "";
                }}
                defaultValue=""
                className="appearance-none rounded-xl border border-orange-500/30 bg-orange-500/10 dark:bg-orange-950/30 px-3 py-1.5 pr-8 text-xs font-bold text-orange-700 dark:text-orange-300 hover:border-orange-500 transition cursor-pointer"
              >
                <option value="" disabled>
                  ⭐ Presets ({templates.length})
                </option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {t.name} ({t.voice_code} · {t.speed}x)
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-orange-600 dark:text-orange-400">
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowSavePresetModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-orange-500/40 hover:text-orange-600 transition shadow-xs"
            title="Save current voice, language and speed as a template"
          >
            <span>🔖</span>
            <span>Save Preset</span>
          </button>
        </div>
      </div>

      {/* Save Preset Inline Modal */}
      {showSavePresetModal && (
        <div className="rounded-2xl border border-orange-500/30 bg-orange-50/80 dark:bg-orange-950/20 p-4 backdrop-blur-sm shadow-sm transition">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>🔖</span>
              <span>Save Voice Preset</span>
            </h4>
            <button
              type="button"
              onClick={() => {
                setShowSavePresetModal(false);
                setPresetMsg(null);
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
            >
              &times;
            </button>
          </div>

          <form onSubmit={handleSavePreset} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Preset Name (e.g. Hindi News Aditi)"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              maxLength={40}
              className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={savingPreset || !presetName.trim()}
                className="btn-primary py-2 px-4 text-xs font-bold disabled:opacity-50"
              >
                {savingPreset ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSavePresetModal(false);
                  setPresetMsg(null);
                }}
                className="btn-ghost py-2 px-3 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>

          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Will remember: <strong>{currentLang?.label}</strong> · Voice <strong>{selectedVoice?.label}</strong> · Speed <strong>{speed}x</strong>
          </p>

          {presetMsg && (
            <p className={`mt-2 text-xs font-bold ${presetMsg.isError ? "text-rose-600" : "text-emerald-600"}`}>
              {presetMsg.text}
            </p>
          )}
        </div>
      )}

      {/* ── Main Controls Grid: Language, Voice, Speed ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* 1. Language Dropdown (All 20+ Languages) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <svg className="size-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              All Languages
            </label>
            <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400">
              {languages.length} Languages
            </span>
          </div>

          <div className="relative">
            <select
              value={lang}
              onChange={(e) => handleLangChange(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-3 pr-10 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white shadow-sm transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              {languages.map((l) => (
                <option
                  key={l.code}
                  value={l.code}
                  className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white py-1.5"
                >
                  {l.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* 2. Voice Dropdown */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <svg className="size-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
              Select Voice
            </label>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {voices.length} voices
            </span>
          </div>

          <div className="relative">
            <select
              value={voice}
              onChange={(e) => onVoiceChange(e.target.value)}
              disabled={voices.length === 0}
              className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-3 pr-10 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white shadow-sm transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              {voices.length === 0 && <option value="">No voices available</option>}
              {voices.map((v) => {
                const isPremium = v.tier === "paid";
                const isFemale = v.gender.toLowerCase() === "female";
                return (
                  <option
                    key={v.id}
                    value={v.id}
                    disabled={isPremium}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white py-1.5"
                  >
                    {isFemale ? "👩" : "👨"} {v.label} {isPremium ? "🔒 (Pro)" : ""}
                  </option>
                );
              })}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* 3. Speed Control */}
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <svg className="size-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Speech Speed
            </label>
            <span className="rounded-md bg-orange-100 dark:bg-orange-950/80 px-2 py-0.5 text-xs font-bold text-orange-700 dark:text-orange-300">
              {speed.toFixed(1)}x
            </span>
          </div>

          <div className="flex h-[46px] items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 shadow-sm">
            <input
              type="range"
              min="0.7"
              max="1.3"
              step="0.1"
              value={speed}
              onChange={(e) => onSpeedChange(Number(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* ── Active Selected Voice Avatar Preview Card ── */}
      {selectedVoice && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900/90 dark:to-slate-900/50 p-4 shadow-sm transition">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Avatar badge */}
            <div
              className={`flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr ${avatar.gradient} text-white shadow-md`}
            >
              {avatar.isFemale ? (
                <svg className="size-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.686 2 6 4.686 6 8c0 2.21 1.2 4.14 2.97 5.17A6.99 6.99 0 005 20a1 1 0 102 0 5 5 0 0110 0 1 1 0 102 0 6.99 6.99 0 00-3.97-6.83C16.8 12.14 18 10.21 18 8c0-3.314-2.686-6-6-6zm0 2c2.21 0 4 1.79 4 4 0 1.95-1.4 3.54-3.26 3.93a1 1 0 00-.74.98v.09h0a1 1 0 00-.74-.98C9.4 11.54 8 9.95 8 8c0-2.21 1.79-4 4-4z" />
                </svg>
              ) : (
                <svg className="size-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.686 2 6 4.686 6 8c0 2.22 1.2 4.16 2.98 5.19A7 7 0 005 20a1 1 0 102 0 5 5 0 0110 0 1 1 0 102 0 7 7 0 00-3.98-6.81C16.8 12.16 18 10.22 18 8c0-3.314-2.686-6-6-6zm0 2c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4z" />
                </svg>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {selectedVoice.label}
                </span>
                <span className="rounded-full bg-orange-100 dark:bg-orange-950/80 px-2 py-0.5 text-[10px] font-bold text-orange-700 dark:text-orange-300">
                  {selectedVoice.gender}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {avatar.persona} · {currentLang?.label}
              </p>
            </div>
          </div>

          {/* Test Voice Sample Audio Button */}
          <button
            type="button"
            onClick={playSample}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm transition ${
              isPlayingSample
                ? "bg-orange-500 text-white animate-pulse"
                : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-700 hover:text-orange-600"
            }`}
          >
            {isPlayingSample ? (
              <>
                <svg className="size-3.5 animate-spin" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
                <span>Playing Voice Sample…</span>
              </>
            ) : (
              <>
                <svg className="size-3.5 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5.14v13.72a1 1 0 001.5.86l11-6.86a1 1 0 000-1.72l-11-6.86a1 1 0 00-1.5.86z" />
                </svg>
                <span>Test Voice Sample</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}