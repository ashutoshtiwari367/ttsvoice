"use client";

import { useState } from "react";

interface ShareButtonsProps {
  title: string;
}

export default function ShareButtons({ title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getShareUrl = (platform: "twitter" | "linkedin" | "whatsapp") => {
    if (typeof window === "undefined") return "#";
    const currentUrl = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(title);

    switch (platform) {
      case "twitter":
        return `https://twitter.com/intent/tweet?text=${text}&url=${currentUrl}`;
      case "linkedin":
        return `https://www.linkedin.com/sharing/share-offsite/?url=${currentUrl}`;
      case "whatsapp":
        return `https://api.whatsapp.com/send?text=${text}%20${currentUrl}`;
      default:
        return "#";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500 mr-1">
        Share:
      </span>

      {/* Copy link button */}
      <button
        type="button"
        onClick={handleCopy}
        title="Copy article link"
        className="relative inline-flex h-8 items-center gap-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.04] px-3 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:border-orange-500/40 hover:text-[#ff5500] dark:hover:text-orange-400 backdrop-blur-md transition-all"
      >
        <span>{copied ? "✓" : "🔗"}</span>
        <span>{copied ? "Copied!" : "Copy"}</span>
      </button>

      {/* WhatsApp */}
      <a
        href={getShareUrl("whatsapp")}
        target="_blank"
        rel="noopener noreferrer"
        title="Share on WhatsApp"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.04] text-slate-700 dark:text-zinc-300 hover:border-green-500/40 hover:text-green-500 backdrop-blur-md transition-all text-xs"
      >
        💬
      </a>

      {/* Twitter / X */}
      <a
        href={getShareUrl("twitter")}
        target="_blank"
        rel="noopener noreferrer"
        title="Share on X (Twitter)"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.04] text-slate-700 dark:text-zinc-300 hover:border-sky-500/40 hover:text-sky-500 backdrop-blur-md transition-all text-xs font-bold"
      >
        𝕏
      </a>

      {/* LinkedIn */}
      <a
        href={getShareUrl("linkedin")}
        target="_blank"
        rel="noopener noreferrer"
        title="Share on LinkedIn"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.04] text-slate-700 dark:text-zinc-300 hover:border-blue-500/40 hover:text-blue-500 backdrop-blur-md transition-all text-xs font-bold"
      >
        in
      </a>
    </div>
  );
}
