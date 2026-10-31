"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/studio")) {
    return null;
  }

  return (
    <footer className="mt-auto border-t border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.015] backdrop-blur-xl transition-colors">
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {/* Brand info */}
          <div className="lg:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 dark:text-white"
            >
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#ff5500] text-white">
                <svg viewBox="0 0 24 24" fill="none" className="size-4" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              </span>
              <span>
                {siteConfig.namePrefix}
                <span className="text-[#ff5500]">{siteConfig.nameAccent}</span>
              </span>
            </Link>
            <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {siteConfig.shortDescription}
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Product
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <Link href="/text-to-speech" className="text-slate-500 dark:text-slate-400 hover:text-[#ff5500] transition">
                  Text to Speech
                </Link>
              </li>
              <li>
                <Link href="/tools" className="text-slate-500 dark:text-slate-400 hover:text-[#ff5500] transition">
                  More Tools
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-slate-500 dark:text-slate-400 hover:text-[#ff5500] transition">
                  Blog &amp; Updates
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-slate-500 dark:text-slate-400 hover:text-[#ff5500] transition">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Account
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <Link href="/login" className="text-slate-500 dark:text-slate-400 hover:text-[#ff5500] transition">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-slate-500 dark:text-slate-400 hover:text-[#ff5500] transition">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Company
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <Link href="/about" className="text-slate-500 dark:text-slate-400 hover:text-[#ff5500] transition">
                  About {siteConfig.name}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-500 dark:text-slate-400 hover:text-[#ff5500] transition">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Legal &amp; Policies
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <Link href="/privacy-policy" className="text-slate-500 dark:text-slate-400 hover:text-[#ff5500] transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-slate-500 dark:text-slate-400 hover:text-[#ff5500] transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="text-slate-500 dark:text-slate-400 hover:text-[#ff5500] transition">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="text-slate-500 dark:text-slate-400 hover:text-[#ff5500] transition">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/acceptable-use" className="text-slate-500 dark:text-slate-400 hover:text-[#ff5500] transition">
                  Acceptable Use
                </Link>
              </li>
              <li>
                <Link href="/grievance" className="text-slate-500 dark:text-slate-400 hover:text-[#ff5500] transition">
                  Grievance Officer
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-6 text-xs text-slate-400 dark:text-slate-500">
          <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <span>Crafted with</span>
            <span className="text-red-500">❤️</span>
            <span>for Indian Creators</span>
          </p>
        </div>
      </div>
    </footer>
  );
}