"use client";

import { useState } from "react";
import Link from "next/link";

export default function EmailPreviewPage() {
  const [copied, setCopied] = useState(false);

  const copyTemplate = async () => {
    try {
      const res = await fetch("/supabase-email-template.html");
      const html = await res.text();
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert("Please open /supabase-email-template.html in your root folder to copy.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#090a0f] text-slate-900 dark:text-zinc-100 p-4 sm:p-8 font-sans">
      {/* Top Controls Bar */}
      <div className="mx-auto max-w-4xl mb-6 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#12141c] border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">✉️</span>
            <h1 className="text-base sm:text-lg font-bold">
              Email Verification Template Preview
            </h1>
            <span className="rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 px-2.5 py-0.5 text-xs font-bold">
              Brand Orange Theme
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            100% responsive HTML email template for Supabase Auth Confirm Signup.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={copyTemplate}
            className="rounded-xl bg-gradient-to-r from-[#ff6a1f] to-[#ff4400] text-white px-4 py-2 text-xs font-bold shadow-md shadow-orange-500/25 hover:scale-[1.02] transition cursor-pointer"
          >
            {copied ? "✓ Copied HTML!" : "📋 Copy Supabase HTML"}
          </button>

          <Link
            href="/text-to-speech"
            className="rounded-xl border border-slate-200 dark:border-zinc-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          >
            Back to Studio
          </Link>
        </div>
      </div>

      {/* Live Email Frame Container */}
      <div className="mx-auto max-w-[700px] bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200/80">
        <iframe
          src="/supabase-email-template.html"
          title="Email Verification Template Preview"
          className="w-full h-[760px] border-none"
        />
      </div>

      {/* Setup Guide Instructions */}
      <div className="mx-auto max-w-4xl mt-8 rounded-2xl bg-white dark:bg-[#12141c] border border-slate-200 dark:border-zinc-800 p-6 text-xs text-slate-600 dark:text-zinc-400 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>🚀</span>
          <span>How to apply this in your Supabase Project:</span>
        </h3>
        <ol className="list-decimal pl-5 space-y-1.5 leading-relaxed">
          <li>
            Apne <strong>Supabase Dashboard</strong> par jaayein: <code className="bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-orange-500">Authentication &rarr; Email Templates</code>.
          </li>
          <li>
            Left side me <strong>&quot;Confirm signup&quot;</strong> template select karein.
          </li>
          <li>
            Subject line me daalein: <code className="bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-bold">Verify your FreeTTSVoice account</code>
          </li>
          <li>
            Editor me purana code replace karke upar diye gaye <strong>&quot;Copy Supabase HTML&quot;</strong> button se copy kiya gaya HTML paste karke <strong>Save</strong> kar dein!
          </li>
        </ol>
      </div>
    </div>
  );
}

