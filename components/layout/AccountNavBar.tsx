"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PAID_FEATURES_CONTROL } from "@/config/control";
import {
  BookmarkMicIcon,
  CreditCardIcon,
  HelpCircleIcon,
  HistoryIcon,
  SettingsIcon,
  SparklesIcon,
  UserIcon,
} from "@/components/ui/LucideIcons";

const ACCOUNT_TABS = [
  { href: "/account", label: "Overview", icon: SparklesIcon, paidOnly: false },
  { href: "/profile", label: "My Profile", icon: UserIcon, paidOnly: false },
  { href: "/history", label: "History", icon: HistoryIcon, paidOnly: false },
  { href: "/saved-voices", label: "Saved Voices", icon: BookmarkMicIcon, paidOnly: false },
  {
    href: "/billing",
    label: "Billing & Subscription",
    icon: CreditCardIcon,
    paidOnly: true,
  },
  { href: "/settings", label: "Settings", icon: SettingsIcon, paidOnly: false },
  { href: "/help", label: "Help & Support", icon: HelpCircleIcon, paidOnly: false },
];

export default function AccountNavBar() {
  const pathname = usePathname();
  const visibleTabs = ACCOUNT_TABS.filter(
    (t) =>
      !t.paidOnly ||
      (PAID_FEATURES_CONTROL.enabled && PAID_FEATURES_CONTROL.showBillingInMenu)
  );

  return (
    <div className="mb-6 flex items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-none">
      <nav
        aria-label="Account sections"
        className="inline-flex items-center gap-1 rounded-2xl border border-black/[0.07] dark:border-white/[0.08] bg-white dark:bg-[#18191e] p-1.5 shadow-xs"
      >
        {visibleTabs.map((tab) => {
          const IconComponent = tab.icon;
          const active =
            pathname === tab.href || pathname?.startsWith(`${tab.href}/`);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                active
                  ? "bg-gradient-to-r from-[#ff6a1f] to-[#ff4400] text-white shadow-sm shadow-orange-500/25"
                  : "text-slate-600 dark:text-zinc-400 hover:bg-orange-500/10 hover:text-[#ff5500] dark:hover:text-orange-400"
              }`}
            >
              <IconComponent size={14} className={active ? "text-white" : ""} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      <Link
        href="/text-to-speech"
        className="hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-orange-500/25 bg-orange-500/10 px-3.5 py-2 text-xs font-bold text-[#ff5500] dark:text-orange-400 hover:bg-orange-500/20 transition shadow-xs"
      >
        <span>Open Voice Studio</span>
        <span aria-hidden="true">&rarr;</span>
      </Link>
    </div>
  );
}

