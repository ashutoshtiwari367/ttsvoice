"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PAID_FEATURES_CONTROL } from "@/config/control";
import { siteConfig } from "@/config/site";
import AdminPanelLayout from "@/components/layout/AdminPanelLayout";
import {
  AlertCircleIcon,
  BookOpenIcon,
  CheckIcon,
  HelpCircleIcon,
  MailIcon,
  MessageSquareIcon,
  SearchIcon,
  StarIcon,
} from "@/components/ui/LucideIcons";

type SupportTab = "contact" | "problem" | "feedback";

const USER_GUIDES = [
  {
    title: "1. Quickstart: Generating Studio Speech",
    summary:
      "Paste your script in Hindi, Indian English, or 20+ regional/global languages, pick a voice avatar, and click Convert to Speech to preview & download 320kbps MP3.",
    actionLabel: "Open Studio",
    actionHref: "/text-to-speech",
  },
  {
    title: "2. Mastering Speaking Styles, Speed & Pitch",
    summary:
      "Choose Storytelling, Podcast, News, Reels/Shorts, Motivational, or Other custom sliders to shape pacing and vocal tone for your audience.",
    actionLabel: "Configure Defaults",
    actionHref: "/settings",
  },
  {
    title: "3. Saving Favorite Voices & Presets",
    summary:
      "Star frequently used voices or create named Voice Presets storing Language, Voice, Style, Speed, and Pitch for one-click reuse.",
    actionLabel: "Saved Voices",
    actionHref: "/saved-voices",
  },
  {
    title: "4. Audio History & Retention Rules",
    summary:
      "Guest audio is kept for 30 minutes and Logged-in Free audio is kept for 24 hours before automatic cleanup. Download MP3s anytime before expiry.",
    actionLabel: "View History",
    actionHref: "/history",
  },
];

const FAQ_ITEMS = [
  {
    category: "Studio",
    q: "How do I preview a voice before converting my full script?",
    a: "Click the Play button on the right side of any Voice Person in the Studio or Saved Voices page to hear a free sample greeting without using your character allowance.",
  },
  {
    category: "Account",
    q: "How long is my generated audio stored in History?",
    a: "Guest conversions are retained for 30 minutes, while logged-in Free account conversions are retained for 24 hours. Expired items are automatically removed.",
  },
  {
    category: "Studio",
    q: "Can I set a default language, voice, and speaking style?",
    a: "Yes! Visit Settings from your Profile Dropdown to configure your Default Language, Voice, Speaking Style, Speed, Pitch, and Light/Dark theme.",
  },
  {
    category: "Account",
    q: "How does character counting work?",
    a: "Each character in your converted script counts as 1 character. Guest sessions include 500 characters and logged-in Free accounts unlock 1,000 characters.",
  },
  {
    category: "Studio",
    q: "Can I use generated voiceovers commercially on YouTube and Reels?",
    a: "Yes, audio generated in our Studio can be used across YouTube videos, Instagram Reels, podcasts, e-learning courses, and presentations.",
  },
  {
    category: "Account",
    q: "How do I update my name or change my password?",
    a: "Open My Profile or Settings from the top-right Profile Dropdown to edit your personal details, change your password, or sign out of all devices.",
  },
];

export default function HelpSupportPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // FAQ Search & Filter
  const [faqSearch, setFaqSearch] = useState("");
  const [faqCategory, setFaqCategory] = useState("All");

  // Support / Problem / Feedback Form State
  const [activeTab, setActiveTab] = useState<SupportTab>("contact");
  const [emailInput, setEmailInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("voice-studio");
  const [subjectInput, setSubjectInput] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [ticketResult, setTicketResult] = useState<{
    ticketId?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setIsLoggedIn(true);
        setUserEmail(data.user.email || "");
        setEmailInput(data.user.email || "");
      }
    });
  }, []);

  const filteredFaqs = useMemo(() => {
    const q = faqSearch.trim().toLowerCase();
    return FAQ_ITEMS.filter((item) => {
      if (faqCategory !== "All" && item.category !== faqCategory) return false;
      if (!q) return true;
      return (
        item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
      );
    });
  }, [faqSearch, faqCategory]);

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketResult(null);

    if (messageInput.trim().length < 5) {
      setTicketResult({
        error: "Please provide a few more details before submitting.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeTab,
          email: emailInput || userEmail,
          category: categoryInput,
          subject: subjectInput,
          message: messageInput,
          rating: activeTab === "feedback" ? rating : null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setTicketResult({
          error: json.error || "Unable to submit right now.",
        });
      } else {
        setTicketResult({ ticketId: json.ticketId });
        setSubjectInput("");
        setMessageInput("");
      }
    } catch {
      setTicketResult({
        error: "Network error. Please use our direct support email below.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPanelLayout activeTab="help">
      <div className="space-y-6">
        {/* Header */}
        <div className="pb-6 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-orange-500/10 text-[#ff5500]">
              <HelpCircleIcon size={20} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              Help &amp; Support Center
            </h1>
          </div>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
            Explore user guides, search frequently asked questions, contact support, report a problem, or share feedback.
          </p>
        </div>

        {/* 1. USER GUIDES */}
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <BookOpenIcon size={18} className="text-[#ff5500]" />
            <h2 className="text-base sm:text-lg font-extrabold text-slate-950 dark:text-white">
              User Guides &amp; Documentation
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {USER_GUIDES.map((guide) => (
              <div
                key={guide.title}
                className="flex flex-col justify-between rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/85 dark:bg-white/[0.03] p-5 backdrop-blur-xl shadow-xs hover:border-orange-500/35 transition"
              >
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    {guide.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-zinc-400">
                    {guide.summary}
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    href={guide.actionHref}
                    className="inline-flex items-center gap-1 text-xs font-extrabold text-[#ff5500] dark:text-orange-400 hover:underline"
                  >
                    <span>{guide.actionLabel}</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. CONTACT SUPPORT / REPORT A PROBLEM / SUBMIT FEEDBACK */}
        <section className="mt-12 grid gap-6 lg:grid-cols-5">
          {/* Interactive Tabbed Form (3 cols) */}
          <div className="lg:col-span-3 rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white/85 dark:bg-white/[0.03] p-6 sm:p-7 backdrop-blur-xl shadow-xs">
            {/* Sub-tabs */}
            <div className="flex flex-wrap gap-2 pb-5 border-b border-black/[0.06] dark:border-white/[0.08]">
              {[
                {
                  id: "contact" as const,
                  label: "Contact Support",
                  icon: MailIcon,
                },
                {
                  id: "problem" as const,
                  label: "Report a Problem",
                  icon: AlertCircleIcon,
                },
                {
                  id: "feedback" as const,
                  label: "Submit Feedback",
                  icon: MessageSquareIcon,
                },
              ].map((t) => {
                const IconComp = t.icon;
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(t.id);
                      setTicketResult(null);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                      active
                        ? "bg-gradient-to-r from-[#ff6a1f] to-[#ff4400] text-white shadow-sm"
                        : "border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:border-orange-400"
                    }`}
                  >
                    <IconComp size={14} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {ticketResult?.ticketId && (
              <div
                role="status"
                className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5"
              >
                <CheckIcon size={16} className="shrink-0" />
                <span>
                  Submitted! Reference ID:{" "}
                  <strong className="font-mono">{ticketResult.ticketId}</strong>. Our team will review your{" "}
                  {activeTab === "problem"
                    ? "issue report"
                    : activeTab === "feedback"
                    ? "feedback"
                    : "message"}{" "}
                  shortly.
                </span>
              </div>
            )}

            {ticketResult?.error && (
              <div
                role="alert"
                className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-bold text-rose-600 dark:text-rose-300"
              >
                {ticketResult.error}
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="mt-5 space-y-4">
              {activeTab === "feedback" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-2">
                    Rate Your Experience
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        aria-label={`Rate ${star} stars`}
                        className="p-1 text-amber-500 hover:scale-110 transition cursor-pointer"
                      >
                        <StarIcon size={22} filled={star <= rating} />
                      </button>
                    ))}
                    <span className="ml-2 text-xs font-bold text-slate-500 dark:text-zinc-400">
                      {rating} / 5 Stars
                    </span>
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Your Email
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Topic / Area
                  </label>
                  <select
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
                  >
                    <option value="voice-studio">Voice Generation &amp; Studio</option>
                    <option value="audio-download">Audio History &amp; Downloads</option>
                    {PAID_FEATURES_CONTROL.enabled && (
                      <option value="billing">Billing, Plans &amp; Receipts</option>
                    )}
                    <option value="account">Account &amp; Security</option>
                    <option value="voice-request">New Voice / Language Request</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  placeholder={
                    activeTab === "problem"
                      ? "Briefly describe the issue..."
                      : activeTab === "feedback"
                      ? "Feature idea or voice suggestion..."
                      : "How can we help?"
                  }
                  maxLength={120}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  {activeTab === "problem"
                    ? "Steps to Reproduce / Problem Details"
                    : activeTab === "feedback"
                    ? "Your Feedback"
                    : "Message"}
                </label>
                <textarea
                  rows={4}
                  required
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Share details so we can help you quickly..."
                  className="w-full resize-none rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6a1f] to-[#ff4400] px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-orange-500/25 hover:brightness-110 transition cursor-pointer disabled:opacity-50"
              >
                <span>
                  {submitting
                    ? "Submitting..."
                    : activeTab === "problem"
                    ? "Submit Problem Report"
                    : activeTab === "feedback"
                    ? "Send Feedback"
                    : "Send Support Request"}
                </span>
              </button>
            </form>
          </div>

          {/* Direct Support Contact Info (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white/85 dark:bg-white/[0.03] p-6 backdrop-blur-xl">
              <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">
                Direct Support Channels
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                Prefer email? Reach our dedicated teams directly:
              </p>

              <div className="mt-4 space-y-3 text-xs">
                <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.07] p-3.5">
                  <div className="font-bold text-slate-900 dark:text-white">
                    Technical &amp; Account Support
                  </div>
                  <a
                    href={`mailto:${siteConfig.supportEmail}`}
                    className="mt-1 inline-block font-bold text-[#ff5500] dark:text-orange-400 hover:underline"
                  >
                    {siteConfig.supportEmail}
                  </a>
                </div>

                {PAID_FEATURES_CONTROL.enabled && (
                  <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.07] p-3.5">
                    <div className="font-bold text-slate-900 dark:text-white">
                      Billing &amp; Subscription Help
                    </div>
                    <a
                      href={`mailto:${siteConfig.billing.billingEmail}`}
                      className="mt-1 inline-block font-bold text-[#ff5500] dark:text-orange-400 hover:underline"
                    >
                      {siteConfig.billing.billingEmail}
                    </a>
                  </div>
                )}

                {siteConfig.supportPhone && (
                  <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.07] p-3.5">
                    <div className="font-bold text-slate-900 dark:text-white">
                      Helpline
                    </div>
                    <p className="mt-1 font-semibold text-slate-700 dark:text-zinc-300">
                      {siteConfig.supportPhone}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 3. FREQUENTLY ASKED QUESTIONS (FAQs) */}
        <section className="mt-12 rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white/85 dark:bg-white/[0.03] p-6 sm:p-8 backdrop-blur-xl shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white">
                  Frequently Asked Questions
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Instant answers to common Studio, History, and Account questions.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <SearchIcon
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    placeholder="Search FAQs..."
                    className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
                  />
                </div>

                {(PAID_FEATURES_CONTROL.enabled
                  ? (["All", "Studio", "Account", "Billing"] as const)
                  : (["All", "Studio", "Account"] as const)
                ).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFaqCategory(cat)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    faqCategory === cat
                      ? "bg-[#ff5500] text-white"
                      : "border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {filteredFaqs.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-4 transition hover:border-orange-400/60"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  <span>{item.q}</span>
                  <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-extrabold text-[#ff5500] shrink-0">
                    {item.category}
                  </span>
                </summary>
                <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </AdminPanelLayout>
  );
}

