"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { PAID_FEATURES_CONTROL } from "@/config/control";
import AccountNavBar from "@/components/layout/AccountNavBar";
import { extractUsername, formatDisplayName } from "@/lib/user";
import { getEmailAvatarLetter, clearAccountClientCaches } from "@/lib/userPreferences";
import {
  CheckIcon,
  CrownIcon,
  LockIcon,
  LogOutIcon,
  MailIcon,
  ShieldIcon,
  UserIcon,
} from "@/components/ui/LucideIcons";

interface SubSummary {
  tier: string;
  balance: number;
  totalAllowance: number;
  usedChars: number;
  remainingChars: number;
  activePlan: string;
  activePlanName: string;
  customerNo: number | null;
}

export default function MyProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sub, setSub] = useState<SubSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Personal Info Form State
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [bio, setBio] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Password / Security Form State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [copiedEmail, setCopiedEmail] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!authUser) {
        router.replace("/login?next=/profile");
        return;
      }

      setUser(authUser);

      const fallbackUsername = extractUsername(authUser.email);
      const fallbackDisplay = formatDisplayName(fallbackUsername);
      const meta = authUser.user_metadata || {};

      setFullName(meta.full_name || fallbackDisplay);
      setDisplayName(meta.display_name || fallbackUsername);
      setRoleTitle(meta.role || "");
      setOrganization(meta.organization || "");
      setBio(meta.bio || "");

      try {
        const res = await fetch("/api/user/subscription", { cache: "no-store" });
        if (res.ok && active) {
          const json = await res.json();
          setSub({
            tier: json.tier || "free",
            balance: Number(json.balance ?? 0),
            totalAllowance: Number(json.totalAllowance ?? 1000),
            usedChars: Number(json.usedChars ?? 0),
            remainingChars: Number(json.remainingChars ?? json.balance ?? 1000),
            activePlan: json.activePlan || "Free Tier",
            activePlanName: json.activePlanName || "Free",
            customerNo: json.customerNo ?? null,
          });
        }
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, [router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileNotice(null);

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setProfileNotice({
        type: "error",
        text: "Please enter your name.",
      });
      return;
    }

    setSavingProfile(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: trimmedName,
          display_name: displayName.trim() || extractUsername(user?.email),
          role: roleTitle.trim(),
          organization: organization.trim(),
          bio: bio.trim(),
        },
      });

      if (error) {
        setProfileNotice({ type: "error", text: error.message });
      } else {
        if (data.user) setUser(data.user);
        window.dispatchEvent(new Event("auth-changed"));
        setProfileNotice({
          type: "success",
          text: "Profile details updated successfully.",
        });
      }
    } catch {
      setProfileNotice({
        type: "error",
        text: "Unable to save profile right now. Please try again.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordNotice(null);

    if (newPassword.length < 8) {
      setPasswordNotice({
        type: "error",
        text: "New password must be at least 8 characters long.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordNotice({
        type: "error",
        text: "Passwords do not match.",
      });
      return;
    }

    setSavingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordNotice({ type: "error", text: error.message });
      } else {
        setNewPassword("");
        setConfirmPassword("");
        setPasswordNotice({
          type: "success",
          text: "Your password has been updated securely.",
        });
      }
    } catch {
      setPasswordNotice({
        type: "error",
        text: "Failed to update password. Please try again.",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleCopyEmail = async () => {
    if (!user?.email) return;
    try {
      await navigator.clipboard.writeText(user.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleGlobalSignOut = async () => {
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
            Loading your profile...
          </p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  const isPro =
    PAID_FEATURES_CONTROL.enabled &&
    (sub?.tier === "paid" || (sub?.balance ?? 0) > 0);
  const avatarLetter = getEmailAvatarLetter(user.email);

  return (
    <main className="relative min-h-screen text-slate-900 dark:text-zinc-100 pb-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-8">
        <AccountNavBar />

        {/* Profile Identity Card */}
        <section className="rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.03] p-6 sm:p-8 backdrop-blur-xl shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative shrink-0">
                <div className="flex size-16 sm:size-20 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6a1f] to-[#ff4400] text-2xl sm:text-3xl font-black uppercase text-white shadow-lg shadow-orange-500/25 ring-4 ring-orange-500/15">
                  {avatarLetter}
                </div>
                {isPro && (
                  <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white ring-2 ring-white dark:ring-[#0c0d12]">
                    <CrownIcon size={12} />
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                    {fullName || "My Profile"}
                  </h1>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold border ${
                      isPro
                        ? "border-amber-500/35 bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        : "border-slate-300/80 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                    }`}
                  >
                    {isPro && <CrownIcon size={12} />}
                    <span>{isPro ? "Pro Plan" : "Free Plan"}</span>
                  </span>

                  {sub?.customerNo && (
                    <span className="rounded-full border border-blue-500/25 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                      #{sub.customerNo}
                    </span>
                  )}
                </div>

                {/* Registered Email Inside Profile Page */}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-zinc-300">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <MailIcon size={15} className="text-[#ff5500]" />
                    <span>{user.email}</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="rounded-lg border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.03] dark:bg-white/[0.05] px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:text-zinc-300 hover:border-orange-500/40 hover:text-[#ff5500] transition cursor-pointer"
                  >
                    {copiedEmail ? "Copied ✓" : "Copy Email"}
                  </button>

                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckIcon size={11} />
                    <span>Verified Email</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
              {PAID_FEATURES_CONTROL.enabled && (
                <Link
                  href="/billing"
                  className="rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:border-orange-500/40 hover:text-[#ff5500] transition"
                >
                  {isPro ? "Manage Plan" : "Upgrade to Pro"}
                </Link>
              )}
              <Link
                href="/text-to-speech"
                className="rounded-xl border border-orange-500/25 bg-orange-500/10 px-3.5 py-2 text-xs font-bold text-[#ff5500] dark:text-orange-400 hover:bg-orange-500/15 transition"
              >
                Open Studio →
              </Link>
            </div>
          </div>

          {/* Live Account Character Balance Inside Profile */}
          {(() => {
            const totalChars = sub?.totalAllowance ?? 1000;
            const remainingChars = sub?.remainingChars ?? totalChars;
            const usedChars = sub?.usedChars ?? Math.max(0, totalChars - remainingChars);
            const remainingPct = Math.max(
              0,
              Math.min(100, (remainingChars / Math.max(1, totalChars)) * 100)
            );

            return (
              <div className="mt-6 pt-5 border-t border-black/[0.06] dark:border-white/[0.07]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                      Account Character Balance
                    </p>
                    <p className="mt-0.5 text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
                      {remainingChars.toLocaleString()}{" "}
                      <span className="text-sm font-bold text-slate-400 dark:text-zinc-500">
                        / {totalChars.toLocaleString()} characters remaining
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/70 px-3 py-1.5 text-slate-700 dark:text-zinc-300">
                      Used: <strong className="text-[#ff5500] dark:text-orange-400">{usedChars.toLocaleString()}</strong> chars
                    </span>
                    <span className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-emerald-700 dark:text-emerald-400">
                      Left: <strong>{remainingChars.toLocaleString()}</strong> chars
                    </span>
                  </div>
                </div>

                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      remainingChars === 0
                        ? "bg-red-500"
                        : remainingPct < 20
                        ? "bg-amber-500"
                        : "bg-gradient-to-r from-[#ff6a1f] to-[#ff4400]"
                    }`}
                    style={{ width: `${remainingPct}%` }}
                  />
                </div>
              </div>
            );
          })()}
        </section>

        {/* Main Grid: Edit Personal Info + Account Security */}
        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          {/* 1. Edit Personal Information (3 cols) */}
          <form
            onSubmit={handleSaveProfile}
            className="lg:col-span-3 rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.03] p-6 sm:p-7 backdrop-blur-xl shadow-sm space-y-5"
          >
            <div className="flex items-center gap-2.5 border-b border-black/[0.06] dark:border-white/[0.07] pb-4">
              <span className="flex size-9 items-center justify-center rounded-xl bg-orange-500/10 text-[#ff5500]">
                <UserIcon size={18} />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-950 dark:text-white">
                  Personal Information
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Update your name and creator profile details.
                </p>
              </div>
            </div>

            {profileNotice && (
              <div
                role="status"
                className={`rounded-xl border px-4 py-3 text-xs font-bold ${
                  profileNotice.type === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                }`}
              >
                {profileNotice.text}
              </div>
            )}

            {/* Registered Email (Read-only display) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                Registered Email Address
              </label>
              <input
                type="email"
                value={user.email || ""}
                readOnly
                disabled
                className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100/80 dark:bg-zinc-900/70 px-3.5 py-2.5 text-sm font-medium text-slate-500 dark:text-zinc-400 cursor-not-allowed"
              />
              <p className="mt-1 text-[11px] text-slate-400 dark:text-zinc-500">
                Your primary login email and avatar initial (<strong>{avatarLetter}</strong>) are linked to this address.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="profile-full-name"
                  className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5"
                >
                  Full Name
                </label>
                <input
                  id="profile-full-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ashutosh Tiwari"
                  maxLength={80}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-display-name"
                  className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5"
                >
                  Username / Handle
                </label>
                <input
                  id="profile-display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. ashutosh"
                  maxLength={40}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="profile-role"
                  className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5"
                >
                  Role / Profession
                </label>
                <input
                  id="profile-role"
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g. Content Creator, Educator, Podcaster"
                  maxLength={60}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-org"
                  className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5"
                >
                  Channel / Organization
                </label>
                <input
                  id="profile-org"
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. Studio / YouTube Channel"
                  maxLength={80}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="profile-bio"
                className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5"
              >
                Voiceover Notes / Bio
              </label>
              <textarea
                id="profile-bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us what kind of voiceovers you produce (YouTube videos, audiobooks, reels, e-learning...)"
                maxLength={280}
                className="w-full resize-none rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6a1f] to-[#ff4400] px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-orange-500/25 hover:brightness-110 disabled:opacity-50 transition cursor-pointer"
              >
                <CheckIcon size={16} />
                <span>{savingProfile ? "Saving Changes..." : "Save Profile"}</span>
              </button>
            </div>
          </form>

          {/* 2. Password & Account Security (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <form
              onSubmit={handleUpdatePassword}
              className="rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.03] p-6 sm:p-7 backdrop-blur-xl shadow-sm space-y-4"
            >
              <div className="flex items-center gap-2.5 border-b border-black/[0.06] dark:border-white/[0.07] pb-4">
                <span className="flex size-9 items-center justify-center rounded-xl bg-orange-500/10 text-[#ff5500]">
                  <LockIcon size={18} />
                </span>
                <div>
                  <h2 className="text-base font-extrabold text-slate-950 dark:text-white">
                    Change Password
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Keep your account secure with a strong password.
                  </p>
                </div>
              </div>

              {passwordNotice && (
                <div
                  role="status"
                  className={`rounded-xl border px-3.5 py-2.5 text-xs font-bold ${
                    passwordNotice.type === "success"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                  }`}
                >
                  {passwordNotice.text}
                </div>
              )}

              <div>
                <label
                  htmlFor="new-password"
                  className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5"
                >
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="w-full rounded-xl border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 px-4 py-2.5 text-xs font-extrabold text-[#ff5500] dark:text-orange-400 transition disabled:opacity-50 cursor-pointer"
              >
                {savingPassword ? "Updating Password..." : "Update Password"}
              </button>
            </form>

            {/* Security Metadata & Session Control */}
            <div className="rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.03] p-6 backdrop-blur-xl shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <ShieldIcon size={18} className="text-emerald-500" />
                <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">
                  Account Security
                </h3>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-black/[0.05] dark:border-white/[0.05]">
                  <span className="text-slate-500 dark:text-zinc-400">Member Since</span>
                  <span className="font-bold text-slate-800 dark:text-zinc-200">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-black/[0.05] dark:border-white/[0.05]">
                  <span className="text-slate-500 dark:text-zinc-400">Last Sign-In</span>
                  <span className="font-bold text-slate-800 dark:text-zinc-200">
                    {user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Active Session"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500 dark:text-zinc-400">Account ID</span>
                  <span className="font-mono text-[11px] text-slate-600 dark:text-zinc-400">
                    {user.id.slice(0, 12)}...
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={signingOutAll}
                onClick={handleGlobalSignOut}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/[0.06] hover:bg-rose-500/15 px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 transition cursor-pointer disabled:opacity-50"
              >
                <LogOutIcon size={15} />
                <span>
                  {signingOutAll
                    ? "Signing out everywhere..."
                    : "Sign Out of All Devices"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

