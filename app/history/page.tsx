"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HistoryItem, HistoryResponse } from "@/app/api/history/route";
import { ALL_LANGUAGES_CATALOG } from "@/lib/tts/catalog";
import AdminPanelLayout from "@/components/layout/AdminPanelLayout";
import {
  DownloadIcon,
  FilterIcon,
  HistoryIcon,
  PauseIcon,
  PlayIcon,
  RefreshCwIcon,
  SearchIcon,
  SparklesIcon,
  TrashIcon,
} from "@/components/ui/LucideIcons";

type SortMode = "newest" | "oldest" | "expiring" | "longest";

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [userType, setUserType] = useState<"guest" | "free" | "premium">("guest");
  const [retentionNotice, setRetentionNotice] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Audio playback state
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  // Search, Filter & Manage states
  const [searchQuery, setSearchQuery] = useState("");
  const [langFilter, setLangFilter] = useState<string>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

  // 1-second live countdown ticker (also drives automatic expiry removal)
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchHistory = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/history", { cache: "no-store" });
      if (res.ok) {
        const json: HistoryResponse = await res.json();
        setHistory(json.history || []);
        setUserType(json.userType || "guest");
        if (json.retentionNotice) {
          setRetentionNotice(json.retentionNotice);
        }
      }
    } catch (err) {
      console.error("fetch_history_error", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    return () => {
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, []);

  const handlePlayAudio = (id: number, url: string | null) => {
    if (!url) return;

    if (playingId === id && audioElement) {
      if (!audioElement.paused) {
        audioElement.pause();
        setPlayingId(null);
      } else {
        audioElement.play();
        setPlayingId(id);
      }
      return;
    }

    if (audioElement) {
      audioElement.pause();
    }

    const audio = new Audio(url);
    audio.play();
    setAudioElement(audio);
    setPlayingId(id);

    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);
  };

  const handleDeleteItem = async (id: number) => {
    setDeletingId(id);
    if (playingId === id && audioElement) {
      audioElement.pause();
      setPlayingId(null);
    }

    try {
      const res = await fetch(`/api/history?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("delete_history_item_error", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (activeHistory.length === 0) return;
    setClearingAll(true);
    if (audioElement) {
      audioElement.pause();
      setPlayingId(null);
    }

    try {
      const res = await fetch("/api/history?clear=all", { method: "DELETE" });
      if (res.ok) {
        setHistory([]);
      }
    } catch (err) {
      console.error("clear_history_error", err);
    } finally {
      setClearingAll(false);
    }
  };

  // Resolve friendly language & voice names from catalog
  const resolveMeta = (langCode: string, voiceId: string) => {
    const langObj = ALL_LANGUAGES_CATALOG.find((l) => l.code === langCode);
    const voiceObj = langObj?.voices.find((v) => v.id === voiceId);
    return {
      langLabel: langObj ? `${langObj.flag} ${langObj.label}` : langCode,
      voiceLabel: voiceObj ? voiceObj.label : voiceId,
    };
  };

  // Automatically remove any item whose retention window has expired
  const activeHistory = useMemo(() => {
    return history.filter((item) => {
      const expiresAtMs = new Date(item.expiresAt).getTime();
      return now < expiresAtMs && !item.isExpired && !!item.audioUrl;
    });
  }, [history, now]);

  // Unique languages present in active history for quick filter dropdown
  const availableLanguages = useMemo(() => {
    const codes = Array.from(new Set(activeHistory.map((h) => h.lang)));
    return codes.map((code) => {
      const match = ALL_LANGUAGES_CATALOG.find((l) => l.code === code);
      return {
        code,
        label: match ? `${match.flag} ${match.label}` : code,
      };
    });
  }, [activeHistory]);

  // Apply Search + Language Filter + Sort
  const filteredHistory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const list = activeHistory.filter((item) => {
      if (langFilter !== "all" && item.lang !== langFilter) return false;
      if (!q) return true;
      const meta = resolveMeta(item.lang, item.voice);
      return (
        item.excerpt.toLowerCase().includes(q) ||
        item.voice.toLowerCase().includes(q) ||
        item.lang.toLowerCase().includes(q) ||
        meta.langLabel.toLowerCase().includes(q) ||
        meta.voiceLabel.toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      if (sortMode === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortMode === "expiring") {
        return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
      }
      if (sortMode === "longest") {
        return b.chars - a.chars;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [activeHistory, searchQuery, langFilter, sortMode]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-full border-3 border-orange-500/20 border-t-[#ff5500] animate-spin" />
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
            Loading your conversion history...
          </p>
        </div>
      </main>
    );
  }

  return (
    <AdminPanelLayout activeTab="history">
      <div className="space-y-6">
        {/* Header & Retention Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div>
            {userType === "guest" && (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-zinc-400 mb-1.5">
                <Link href="/" className="hover:text-orange-500 transition">
                  Home
                </Link>
                <span>/</span>
                <span className="text-slate-900 dark:text-zinc-200">History</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-orange-500/10 text-[#ff5500]">
                <HistoryIcon size={20} />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                Audio Generation History
              </h1>
              <span className="rounded-full bg-orange-500/10 text-[#ff5500] dark:text-orange-400 border border-orange-500/20 text-xs px-2.5 py-0.5 font-bold">
                {activeHistory.length} Active
              </span>

              {userType === "guest" && (
                <span className="rounded-full bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs px-2.5 py-0.5 font-bold">
                  Guest • 30-Min Retention
                </span>
              )}
              {userType === "free" && (
                <span className="rounded-full bg-orange-500/15 border border-orange-500/25 text-orange-600 dark:text-orange-400 text-xs px-2.5 py-0.5 font-bold">
                  Logged-In • 24-Hour Retention
                </span>
              )}
              {userType === "premium" && (
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs px-2.5 py-0.5 font-bold">
                  Pro Cloud Archive
                </span>
              )}
            </div>

            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
              {retentionNotice ||
                (userType === "guest"
                  ? "Guest conversions are retained for 30 minutes and automatically removed once expired."
                  : "Logged-in conversions are retained for 24 hours and automatically removed once expired.")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fetchHistory(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:border-orange-500/40 hover:text-[#ff5500] transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCwIcon size={14} className={refreshing ? "animate-spin" : ""} />
              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>

            {activeHistory.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                disabled={clearingAll}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/25 bg-rose-500/[0.06] hover:bg-rose-500/15 px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 transition cursor-pointer disabled:opacity-50"
              >
                <TrashIcon size={14} />
                <span>{clearingAll ? "Clearing..." : "Clear All"}</span>
              </button>
            )}

            <Link
              href="/text-to-speech"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ff6a1f] to-[#ff4400] px-4 py-2 text-xs font-extrabold text-white shadow-md shadow-orange-500/25 hover:brightness-110 transition"
            >
              <SparklesIcon size={14} />
              <span>New Voiceover</span>
            </Link>
          </div>
        </div>

        {/* Retention Policy Info Banner */}
        {userType === "guest" && (
          <div
            role="status"
            className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-orange-300/80 dark:border-orange-900/60 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 p-4 text-xs sm:text-sm text-orange-900 dark:text-orange-200 shadow-xs"
          >
            <div>
              <strong>Guest Retention (30 Minutes):</strong> Log in to keep your generated audio for{" "}
              <strong>24 hours</strong> and unlock extra character allowance.
            </div>
            <Link
              href="/login?next=/history"
              className="rounded-xl bg-[#ff5500] px-3.5 py-2 text-xs font-extrabold text-white shrink-0 self-start sm:self-auto hover:bg-[#e64d00] transition"
            >
              Log In →
            </Link>
          </div>
        )}

        {/* Search & Filtering Controls */}
        {activeHistory.length > 0 && (
          <div className="mt-6 grid gap-3 sm:grid-cols-12 rounded-2xl border border-black/[0.07] dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.03] p-3.5 backdrop-blur-xl shadow-xs">
            {/* Search Input */}
            <div className="relative sm:col-span-6">
              <SearchIcon
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search script text, voice, or language..."
                aria-label="Search audio history"
                className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/70 pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#ff5500] focus:outline-none"
              />
            </div>

            {/* Language Filter */}
            <div className="relative sm:col-span-3">
              <FilterIcon
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={langFilter}
                onChange={(e) => setLangFilter(e.target.value)}
                aria-label="Filter by language"
                className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/70 pl-8 pr-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-200 focus:border-[#ff5500] focus:outline-none"
              >
                <option value="all">All Languages ({activeHistory.length})</option>
                {availableLanguages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div className="sm:col-span-3">
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                aria-label="Sort history"
                className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/70 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-200 focus:border-[#ff5500] focus:outline-none"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="expiring">Sort: Expiring Soonest</option>
                <option value="longest">Sort: Most Characters</option>
              </select>
            </div>
          </div>
        )}

        {/* History List or Empty State */}
        {activeHistory.length === 0 ? (
          <div className="mt-10 text-center rounded-3xl border border-dashed border-black/[0.1] dark:border-white/[0.1] p-12 bg-white/50 dark:bg-white/[0.02]">
            <div className="size-14 rounded-2xl bg-orange-500/10 text-[#ff5500] flex items-center justify-center mx-auto mb-4">
              <HistoryIcon size={26} />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              No Active Audio History
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
              {userType === "guest"
                ? "You have no active guest conversions right now (expired items are automatically cleared after 30 minutes)."
                : "You have no active conversions in the last 24 hours. Generate speech in the Studio to see it here!"}
            </p>
            <Link
              href="/text-to-speech"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6a1f] to-[#ff4400] px-5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-orange-500/25 hover:brightness-110 transition"
            >
              <span>Open TTS Studio</span>
              <span>&rarr;</span>
            </Link>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.02] p-10 text-center">
            <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">
              No history items match your search or filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setLangFilter("all");
              }}
              className="mt-3 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-bold text-[#ff5500] cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-3.5">
            {filteredHistory.map((item) => {
              const expiresAtMs = new Date(item.expiresAt).getTime();
              const liveRemainingSecs = Math.max(
                0,
                Math.floor((expiresAtMs - now) / 1000)
              );

              const hours = Math.floor(liveRemainingSecs / 3600);
              const mins = Math.floor((liveRemainingSecs % 3600) / 60);
              const secs = liveRemainingSecs % 60;

              let liveCountdownText = `${secs}s remaining`;
              if (hours > 0) {
                liveCountdownText = `${hours}h ${mins}m ${secs < 10 ? "0" : ""}${secs}s remaining`;
              } else if (mins > 0) {
                liveCountdownText = `${mins}m ${secs < 10 ? "0" : ""}${secs}s remaining`;
              }

              const meta = resolveMeta(item.lang, item.voice);

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/85 dark:bg-white/[0.03] p-4 sm:p-5 backdrop-blur-xl shadow-xs hover:border-orange-500/30 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left: Script Excerpt & Metadata */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] mb-2 font-semibold">
                      <span className="rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 px-2.5 py-0.5">
                        {meta.langLabel}
                      </span>
                      <span className="rounded-lg bg-orange-500/10 border border-orange-500/20 text-[#ff5500] dark:text-orange-300 px-2.5 py-0.5 font-bold">
                        {meta.voiceLabel}
                      </span>
                      <span className="rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-2 py-0.5">
                        {item.speed.toFixed(1)}x
                      </span>
                      <span className="rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-2 py-0.5">
                        {item.chars} chars
                      </span>
                      <span className="rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-[10px] font-bold">
                        ⏱ {liveCountdownText}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-slate-900 dark:text-zinc-100 line-clamp-2">
                      &ldquo;{item.excerpt}&rdquo;
                    </p>

                    <div className="mt-2 text-[11px] text-slate-400 dark:text-zinc-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>
                        Generated:{" "}
                        {new Date(item.createdAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span>•</span>
                      <span>
                        Auto-removes at{" "}
                        {new Date(item.expiresAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Right: Play, Download, Reuse Voice, Delete */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-end lg:self-center">
                    {item.audioUrl && (
                      <>
                        <button
                          type="button"
                          onClick={() => handlePlayAudio(item.id, item.audioUrl)}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                            playingId === item.id
                              ? "bg-[#ff5500] text-white shadow-sm"
                              : "border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 hover:border-orange-500/40 hover:text-[#ff5500]"
                          }`}
                        >
                          {playingId === item.id ? (
                            <>
                              <PauseIcon size={14} />
                              <span>Pause</span>
                            </>
                          ) : (
                            <>
                              <PlayIcon size={14} />
                              <span>Play</span>
                            </>
                          )}
                        </button>

                        <a
                          href={`/api/download?url=${encodeURIComponent(item.audioUrl)}`}
                          download
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:border-orange-500/40 hover:text-[#ff5500] transition"
                          title="Download MP3"
                        >
                          <DownloadIcon size={14} />
                          <span>Download</span>
                        </a>
                      </>
                    )}

                    <Link
                      href={`/text-to-speech?lang=${encodeURIComponent(
                        item.lang
                      )}&voice=${encodeURIComponent(item.voice)}&speed=${item.speed}`}
                      className="inline-flex items-center gap-1 rounded-xl border border-orange-500/25 bg-orange-500/10 px-3 py-2 text-xs font-bold text-[#ff5500] dark:text-orange-400 hover:bg-orange-500/20 transition"
                    >
                      <span>Use Voice</span>
                    </Link>

                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() => handleDeleteItem(item.id)}
                      aria-label="Delete from history"
                      title="Delete audio from history"
                      className="inline-flex items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/[0.06] hover:bg-rose-500/15 p-2 text-rose-600 dark:text-rose-400 transition cursor-pointer disabled:opacity-40"
                    >
                      <TrashIcon size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminPanelLayout>
  );
}
