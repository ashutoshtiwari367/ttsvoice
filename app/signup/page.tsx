"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signUp } from "@/app/auth/actions";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signUp, {
    error: null,
    success: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordsMatch = !confirmPassword || password === confirmPassword;

  if (state.success) {
    return (
      <main className="relative flex min-h-[calc(100vh-4.5rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md text-center">
          <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl transition-colors">
            <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-400" />
            <div className="px-6 py-12 sm:p-12">
              <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/10">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="size-8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                Check your inbox
              </h1>
              <p className="mt-3 text-xs sm:text-sm leading-6 text-slate-600 dark:text-slate-400">
                We have sent an instant verification email to your address. Click the link inside to activate your free TTS account.
              </p>

              <div className="mt-8 flex flex-col gap-3">
                <Link
                  href="/login"
                  className="rounded-xl bg-orange-600 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-700 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Proceed to Sign In
                </Link>
                <Link
                  href="/text-to-speech"
                  className="text-xs font-semibold text-slate-500 hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400"
                >
                  Back to Workspace
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 w-full">
      {/* Background ambient lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden"
      >
        <div className="size-[500px] rounded-full bg-gradient-to-tr from-orange-500/10 to-amber-500/10 blur-[100px] dark:from-orange-500/15 dark:to-amber-500/10" />
      </div>

      <div className="w-full max-w-md mx-auto">
        {/* Navigation Tabs between Login & Signup */}
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-1.5 shadow-sm backdrop-blur">
          <Link
            href="/login"
            className="flex items-center justify-center rounded-xl py-2.5 text-center text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 py-2.5 text-center text-xs sm:text-sm font-bold text-white shadow-sm transition"
          >
            Create Account
          </Link>
        </div>

        {/* Auth Card */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl dark:shadow-2xl dark:shadow-black/60 transition-colors">
          <div className="h-1.5 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400" />

          <div className="p-6 sm:p-10">
            {/* Header */}
            <div className="text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/25">
                <svg viewBox="0 0 24 24" fill="none" className="size-6">
                  <path
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                Create Free Account
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-normal">
                Generate high-definition AI voiceovers in 20+ languages
              </p>
            </div>

            {/* Error banner */}
            {state.error && (
              <div
                role="alert"
                className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 p-3.5 text-xs sm:text-sm text-red-700 dark:text-red-300 animate-fadeIn"
              >
                <svg className="size-4.5 shrink-0 text-red-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="leading-relaxed">{state.error}</span>
              </div>
            )}

            <form action={action} className="mt-6 space-y-4 sm:space-y-4.5">
              {/* Email */}
              <div>
                <label
                  htmlFor="signup-email"
                  className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  Email address
                </label>
                <div className="relative flex items-center">
                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 pl-4 pr-11 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-orange-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400">
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="signup-password"
                  className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>
                <div className="relative flex items-center">
                  <input
                    id="signup-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 pl-4 pr-11 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-orange-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="signup-confirm-password"
                  className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  Confirm password
                </label>
                <div className="relative flex items-center">
                  <input
                    id="signup-confirm-password"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className={`w-full rounded-xl border bg-slate-50/60 dark:bg-slate-950/60 pl-4 pr-11 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:bg-white dark:focus:bg-slate-950 focus:outline-none transition ${
                      !passwordsMatch
                        ? "border-red-400 focus:ring-2 focus:ring-red-400/20"
                        : "border-slate-200 dark:border-slate-800 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showConfirm ? (
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {!passwordsMatch && (
                  <p className="mt-1 text-xs text-red-500">
                    Passwords do not match.
                  </p>
                )}
              </div>

              {/* Terms notice */}
              <p className="text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                By creating an account, you agree to our{" "}
                <Link href="/terms" className="underline hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy-policy" className="underline hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  Privacy Policy
                </Link>
                .
              </p>

              {/* Submit Button */}
              <div className="pt-1">
                <button
                  id="signup-submit"
                  type="submit"
                  disabled={pending || !passwordsMatch}
                  className="relative flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-4 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/35 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {pending ? (
                    <>
                      <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <span>Creating account…</span>
                    </>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
              </div>
            </form>

            <p className="mt-6 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:underline transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
