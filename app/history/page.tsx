"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HistoryItem, HistoryResponse } from "@/app/api/history/route";

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [userType, setUserType] = useState<"guest" | "free" | "premium">("guest");
  const [retentionNotice, setRetentionNotice] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  // 1-second live countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/history");
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
    <main className="relative min-h-screen text-slate-900 dark:text-zinc-100 transition-colors pb-24 overflow-hidden">
      {/* Decorative background glows */}
      <div className="pointer-events-none absolute -top-40 right-1/4 size-96 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-20 size-80 rounded-full bg-amber-500/5 blur-3xl" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header Breadcrumbs & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-zinc-400 mb-1">
              <Link href="/" className="hover:text-orange-500 transition">
                Home
              </Link>
              <span>/</span>
              <span className="text-slate-900 dark:text-zinc-200">
                Conversion History
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-3">
                <span>🎙️ Conversion History</span>
              </h1>
              <span className="rounded-full bg-orange-500/10 text-[#ff5500] dark:text-orange-400 border border-orange-500/20 text-xs px-2.5 py-0.5 font-bold">
                {history.length} Saved
              </span>

              {userType === "guest" && (
                <span className="rounded-full bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs px-2.5 py-0.5 font-bold">
                  Guest Mode (30-Min Retention)
                </span>
              )}
              {userType === "free" && (
                <span className="rounded-full bg-orange-500/15 border border-orange-500/25 text-orange-600 dark:text-orange-400 text-xs px-2.5 py-0.5 font-bold">
                  Free Account (24-Hour Retention)
                </span>
              )}
              {userType === "premium" && (
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs px-2.5 py-0.5 font-bold">
                  👑 Premium Archive
                </span>
              )}
            </div>

            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
              {retentionNotice ||
                (userType === "guest"
                  ? "Guest conversions are automatically purged after 30 minutes."
                  : "Your conversion history is automatically deleted after 24 hours from creation.")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/text-to-speech"
              className="btn-primary py-2 px-4 text-xs font-bold shadow-md inline-flex items-center gap-2"
            >
              <span>✨</span>
              <span>New Voiceover</span>
            </Link>
          </div>
        </div>

        {/* ── Prominent Deletion Notice Banner ── */}
        {userType === "free" && (
          <div
            role="status"
            className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-300/80 dark:border-amber-900/60 bg-amber-50/90 dark:bg-amber-950/30 p-4 text-xs sm:text-sm text-amber-900 dark:text-amber-200 shadow-sm"
          >
            <span className="text-lg">ℹ️</span>
            <div>
              <span className="font-bold">Automatic 24-Hour History Expiration:</span>{" "}
              In accordance with our free user policy, each conversion and its
              generated audio file is retained for exactly{" "}
              <strong>24 hours from its creation time</strong>. After 24 hours,
              records and audio files are automatically purged permanently from our
              servers.
            </div>
          </div>
        )}

        {userType === "guest" && (
          <div
            role="status"
            className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-orange-300/80 dark:border-orange-900/60 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 p-4 text-xs sm:text-sm text-orange-900 dark:text-orange-200 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🎁</span>
              <div>
                <span className="font-bold">You are viewing Guest History (30-Minute Retention):</span>{" "}
                Sign in to your free account to keep your history for{" "}
                <strong>24 hours</strong> and receive an additional{" "}
                <strong>fresh 500 characters</strong> allowance!
              </div>
            </div>

            <Link
              href="/signup"
              className="btn-primary py-1.5 px-3.5 text-xs font-bold shrink-0 self-start sm:self-auto shadow-sm"
            >
              Sign Up Free →
            </Link>
          </div>
        )}

        {/* ── History List or Empty State ── */}
        {history.length === 0 ? (
          <div className="mt-12 text-center rounded-3xl border border-dashed border-black/[0.1] dark:border-white/[0.1] p-12 bg-white/40 dark:bg-white/[0.02]">
            <div className="size-16 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto text-2xl font-bold mb-4">
              🎧
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              No Voice Generations Yet
            </h2>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
              {userType === "guest"
                ? "You haven't generated any speech in this guest session yet, or your previous conversions have expired (30-minute limit). Go to the TTS Studio to generate audio!"
                : "You haven't generated any speech audio yet, or previous conversions have completed their 24-hour retention window. Enter text in the TTS Studio and produce speech!"}
            </p>
            <Link
              href="/text-to-speech"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 transition"
            >
              <span>Go to Studio</span>
              <span>&rarr;</span>
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {history.map((item) => {
              // Live calculation of remaining expiration countdown
              const expiresAtMs = new Date(item.expiresAt).getTime();
              const isExpiredLive = now >= expiresAtMs || item.isExpired;
              const liveRemainingSecs = Math.max(
                0,
                Math.floor((expiresAtMs - now) / 1000)
              );

              let liveCountdownText = "Audio Expired";
              if (!isExpiredLive) {
                const hours = Math.floor(liveRemainingSecs / 3600);
                const mins = Math.floor((liveRemainingSecs % 3600) / 60);
                const secs = liveRemainingSecs % 60;

                if (hours > 0) {
                  liveCountdownText = `${hours}h ${mins}m ${secs < 10 ? "0" : ""}${secs}s remaining`;
                } else if (mins > 0) {
                  liveCountdownText = `${mins}m ${secs < 10 ? "0" : ""}${secs}s remaining`;
                } else {
                  liveCountdownText = `${secs}s remaining`;
                }
              }

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.03] p-5 backdrop-blur-xl shadow-xs hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left: Text Excerpt & Meta */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] mb-2 font-semibold">
                      <span className="rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 px-2 py-0.5">
                        🌐 {item.lang}
                      </span>
                      <span className="rounded-md bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 px-2 py-0.5">
                        🗣️ {item.voice}
                      </span>
                      <span className="rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 px-2 py-0.5">
                        ⚡ {item.speed.toFixed(1)}x
                      </span>
                      <span className="rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 px-2 py-0.5">
                        📝 {item.chars} chars
                      </span>

                      {/* Live countdown pill */}
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold inline-flex items-center gap-1 ${
                          isExpiredLive
                            ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                            : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        <span>⏱️</span>
                        <span>{liveCountdownText}</span>
                      </span>
                    </div>

                    <p className="text-sm font-medium text-slate-900 dark:text-zinc-100 line-clamp-2">
                      &ldquo;{item.excerpt}&rdquo;
                    </p>

                    <div className="mt-2 text-xs text-slate-400 dark:text-zinc-500 flex items-center gap-3">
                      <span>
                        📅 Generated:{" "}
                        {new Date(item.createdAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span>•</span>
                      <span>
                        ⏳ Expires:{" "}
                        {new Date(item.expiresAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Right: Audio Playback & Action Controls */}
                  <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                    {item.audioUrl && !isExpiredLive ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handlePlayAudio(item.id, item.audioUrl)}
                          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm transition cursor-pointer ${
                            playingId === item.id
                              ? "bg-orange-500 text-white animate-pulse"
                              : "border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 hover:border-orange-500/40 hover:text-orange-500"
                          }`}
                        >
                          {playingId === item.id ? (
                            <>
                              <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
                                <rect x="6" y="5" width="4" height="14" rx="1" />
                                <rect x="14" y="5" width="4" height="14" rx="1" />
                              </svg>
                              <span>Pause</span>
                            </>
                          ) : (
                            <>
                              <svg className="size-4 text-[#ff5500]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5.14v13.72a1 1 0 001.5.86l11-6.86a1 1 0 000-1.72l-11-6.86a1 1 0 00-1.5.86z" />
                              </svg>
                              <span>Play Audio</span>
                            </>
                          )}
                        </button>

                        <a
                          href={`/api/download?url=${encodeURIComponent(item.audioUrl)}`}
                          download
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:text-orange-500 transition shadow-sm"
                          title="Download MP3"
                        >
                          <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span>Download</span>
                        </a>
                      </>
                    ) : (
                      <span className="text-xs font-semibold text-rose-500 dark:text-rose-400 italic px-2">
                        Audio Expired &amp; Purged
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
