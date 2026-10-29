"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HistoryItem, HistoryResponse } from "@/app/api/history/route";

interface RecentConversionsProps {
  userType?: "guest" | "free" | "premium";
  refreshTrigger?: number;
}

export default function RecentConversions({
  userType = "guest",
  refreshTrigger = 0,
}: RecentConversionsProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [retentionNotice, setRetentionNotice] = useState<string>("");

  // Live countdown ticker updated every second
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/history", { cache: "no-store" });
      if (res.ok) {
        const json: HistoryResponse = await res.json();
        setHistory(json.history || []);
        if (json.retentionNotice) {
          setRetentionNotice(json.retentionNotice);
        }
      }
    } catch (err) {
      console.error("fetch_recent_conversions_error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    window.addEventListener("auth-changed", fetchHistory);
    return () => {
      window.removeEventListener("auth-changed", fetchHistory);
    };
  }, [refreshTrigger]);

  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, [audioElement]);

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

  const activeHistory = history.filter((item) => {
    const expiresAtMs = new Date(item.expiresAt).getTime();
    return now < expiresAtMs && !item.isExpired && !!item.audioUrl;
  });

  if (loading && activeHistory.length === 0) {
    return null;
  }

  if (activeHistory.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.015] dark:bg-white/[0.02] p-5 sm:p-7 backdrop-blur-xl">
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/[0.06] dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500 text-xs font-bold">
              🕒
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {userType === "guest"
                ? "Recent Guest Conversions (30-Minute History)"
                : userType === "free"
                ? "Your Account Conversion History (24-Hour Retention)"
                : "Recent Cloud Conversions"}
            </h3>
            <span className="rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 px-2 py-0.5 text-[10px] font-bold">
              {activeHistory.length} Saved
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            {retentionNotice ||
              (userType === "guest"
                ? "Audio is automatically purged after 30 minutes. Replay or download your generated speech below."
                : "Your conversion history is automatically deleted after 24 hours from creation.")}
          </p>
        </div>

        <Link
          href="/history"
          className="self-start sm:self-auto text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 underline underline-offset-2 flex items-center gap-1"
        >
          <span>View All History</span>
          <span>&rarr;</span>
        </Link>
      </div>

      {/* ── Conversions List ── */}
      <div className="mt-4 divide-y divide-black/[0.05] dark:divide-white/[0.05] space-y-3">
        {activeHistory.slice(0, 5).map((item) => {
          // Calculate remaining seconds live
          const expiresAtMs = new Date(item.expiresAt).getTime();
          const isExpiredLive = now >= expiresAtMs || item.isExpired;
          const liveRemainingSecs = Math.max(
            0,
            Math.floor((expiresAtMs - now) / 1000)
          );

          let liveTimeLabel = "Expired";
          if (!isExpiredLive) {
            const hours = Math.floor(liveRemainingSecs / 3600);
            const mins = Math.floor((liveRemainingSecs % 3600) / 60);
            const secs = liveRemainingSecs % 60;

            if (hours > 0) {
              liveTimeLabel = `${hours}h ${mins}m left`;
            } else if (mins > 0) {
              liveTimeLabel = `${mins}m ${secs < 10 ? "0" : ""}${secs}s left`;
            } else {
              liveTimeLabel = `${secs}s left`;
            }
          }

          return (
            <div
              key={item.id}
              className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              {/* Left Details */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold mb-1">
                  <span className="rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 px-1.5 py-0.5">
                    🌐 {item.lang}
                  </span>
                  <span className="rounded bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 px-1.5 py-0.5">
                    🗣️ {item.voice}
                  </span>
                  <span className="rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 px-1.5 py-0.5">
                    📝 {item.chars} chars
                  </span>

                  {/* Live countdown badge */}
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold inline-flex items-center gap-1 ${
                      isExpiredLive
                        ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                        : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    <span>⏱️</span>
                    <span>{liveTimeLabel}</span>
                  </span>
                </div>

                <p className="text-xs font-medium text-slate-800 dark:text-zinc-200 line-clamp-1">
                  &ldquo;{item.excerpt}&rdquo;
                </p>
              </div>

              {/* Right: Audio Play & Download */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {item.audioUrl && !isExpiredLive ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handlePlayAudio(item.id, item.audioUrl)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer ${
                        playingId === item.id
                          ? "bg-orange-500 text-white animate-pulse"
                          : "border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 hover:border-orange-500/40 hover:text-orange-500"
                      }`}
                    >
                      {playingId === item.id ? (
                        <>
                          <svg className="size-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="6" y="5" width="4" height="14" rx="1" />
                            <rect x="14" y="5" width="4" height="14" rx="1" />
                          </svg>
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <svg className="size-3.5 text-[#ff5500]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5.14v13.72a1 1 0 001.5.86l11-6.86a1 1 0 000-1.72l-11-6.86a1 1 0 00-1.5.86z" />
                          </svg>
                          <span>Replay</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`/api/download?url=${encodeURIComponent(item.audioUrl)}`}
                      download
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:text-orange-500 transition shadow-xs"
                      title="Download MP3"
                    >
                      <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>MP3</span>
                    </a>
                  </>
                ) : (
                  <span className="text-[11px] font-semibold text-rose-500 dark:text-rose-400 italic">
                    Audio expired &amp; purged
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
