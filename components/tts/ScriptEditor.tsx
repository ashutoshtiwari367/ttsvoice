"use client";

import Link from "next/link";

interface ScriptEditorProps {
  text: string;
  onChange: (value: string) => void;
  maxCharacters?: number;
  onClear: () => void;
  tier?: "anon" | "free" | "paid";
  balance?: number;
}

const sampleTemplates = [
  {
    label: "🇮🇳 Hindi Welcome",
    text: "नमस्ते! इंडियन टीटीएस में आपका स्वागत है। यह एक आधुनिक एआई वॉयस जनरेटर है जो आपकी आवाज़ को जीवंत बनाता है।",
  },
  {
    label: "🎙️ YouTube Intro",
    text: "Welcome back to the channel everyone! In today's video, we are going to explore how AI voice generation is transforming digital content creation.",
  },
  {
    label: "📖 Story Narration",
    text: "एक बार की बात है, पहाड़ों की हसीन वादियों में एक शांत नदी बहती थी। जहाँ हवाओं में एक अनोखा सुकून और खुशबू थी।",
  },
];

export default function ScriptEditor({
  text,
  onChange,
  maxCharacters = 500,
  onClear,
  tier = "anon",
  balance = 0,
}: ScriptEditorProps) {
  const charPercent = Math.min(100, (text.length / maxCharacters) * 100);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4 sm:p-5 transition-all focus-within:border-orange-500 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:shadow-md focus-within:shadow-orange-500/5">
      {/* Header bar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <svg className="size-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Your Script
        </span>

        {/* Quick sample chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mr-1 hidden sm:inline">
            Try sample:
          </span>
          {sampleTemplates.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onChange(item.text)}
              className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 transition hover:border-orange-300 dark:hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400"
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onClear}
            disabled={!text}
            className="ml-2 text-xs font-medium text-slate-400 hover:text-red-500 disabled:opacity-30 transition"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value.slice(0, maxCharacters))}
        placeholder="Paste or type your script here in Hindi, English, Tamil, Marathi, or any Indian/global language..."
        rows={6}
        className="min-h-[170px] w-full resize-y border-0 bg-transparent text-base sm:text-lg leading-7 sm:leading-8 text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-0"
      />

      {/* Footer bar */}
      <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border-t border-slate-200/80 dark:border-slate-800/80 pt-3">
        <div className="flex items-center gap-1.5 text-xs">
          {tier === "anon" && (
            <span className="text-slate-500 dark:text-slate-400">
              Guest limit: <strong className="text-slate-800 dark:text-slate-200">{maxCharacters.toLocaleString()} chars</strong>.{" "}
              <Link href="/signup" className="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 underline decoration-orange-400/50">
                Sign up free for 1,000 chars →
              </Link>
            </span>
          )}
          {tier === "free" && (
            <span className="text-slate-500 dark:text-slate-400">
              Free plan: <strong className="text-slate-800 dark:text-slate-200">{maxCharacters.toLocaleString()} chars/req</strong>.{" "}
              <Link href="/pricing" className="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 underline decoration-orange-400/50">
                Recharge for up to 5,000 chars →
              </Link>
            </span>
          )}
          {tier === "paid" && (
            <span className="text-slate-500 dark:text-slate-400">
              Balance: <strong className="text-emerald-600 dark:text-emerald-400">{balance.toLocaleString()} credits</strong> ({maxCharacters.toLocaleString()} max/gen).{" "}
              <Link href="/pricing" className="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 underline decoration-orange-400/50">
                Add more →
              </Link>
            </span>
          )}
        </div>

        {/* Counter */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all ${
                charPercent >= 100 ? "bg-red-500" : charPercent > 80 ? "bg-amber-500" : "bg-orange-500"
              }`}
              style={{ width: `${charPercent}%` }}
            />
          </div>
          <span className={`text-xs font-semibold tabular-nums ${
            charPercent >= 100 ? "text-red-500 dark:text-red-400 font-bold" : "text-slate-500 dark:text-slate-400"
          }`}>
            {text.length.toLocaleString()} / {maxCharacters.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}