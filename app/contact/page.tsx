import type { Metadata } from "next";
import ContentPage from "@/components/pages/ContentPage";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Contact Us | ${siteConfig.name}`,
  description: `Contact support and get assistance with ${siteConfig.name}.`,
};

export default function ContactPage() {
  return (
    <ContentPage
      eyebrow="Support"
      title={`Contact ${siteConfig.name}`}
      intro={`Need help with voice synthesis, credit recharges, or custom enterprise requirements? Our team is here to help.`}
    >
      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] p-5 backdrop-blur-md">
          <span className="text-xl">✉️</span>
          <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">Customer Support</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            For account queries, speech synthesis, and support tickets:
          </p>
          <a
            href={`mailto:${siteConfig.supportEmail}`}
            className="mt-3 inline-block font-semibold text-xs text-[#ff5500] dark:text-orange-400 hover:underline"
          >
            {siteConfig.supportEmail}
          </a>
        </div>

        <div className="rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] p-5 backdrop-blur-md">
          <span className="text-xl">💳</span>
          <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">Billing &amp; Payments</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Questions regarding pack top-ups, invoices, or payment gateways:
          </p>
          <a
            href={`mailto:${siteConfig.billing.billingEmail || siteConfig.supportEmail}`}
            className="mt-3 inline-block font-semibold text-xs text-[#ff5500] dark:text-orange-400 hover:underline"
          >
            {siteConfig.billing.billingEmail || siteConfig.supportEmail}
          </a>
        </div>

        {siteConfig.supportPhone && (
          <div className="rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] p-5 backdrop-blur-md">
            <span className="text-xl">📞</span>
            <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">Phone / WhatsApp</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Helpline for quick assistance:
            </p>
            <p className="mt-3 font-semibold text-xs text-slate-800 dark:text-zinc-200">
              {siteConfig.supportPhone}
            </p>
          </div>
        )}

        {siteConfig.address && (
          <div className="rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] p-5 backdrop-blur-md">
            <span className="text-xl">🏢</span>
            <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">Office Address</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              {siteConfig.legalEntity}
            </p>
            <p className="mt-3 font-semibold text-xs text-slate-800 dark:text-zinc-200">
              {siteConfig.address}
            </p>
          </div>
        )}
      </div>
    </ContentPage>
  );
}