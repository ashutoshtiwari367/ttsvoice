"use client";

import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PAID_FEATURES_CONTROL } from "@/config/control";
import { pricingConfig, type PricingCurrency } from "@/config/pricingPlans";
import { siteConfig } from "@/config/site";
import AccountNavBar from "@/components/layout/AccountNavBar";
import {
  CheckIcon,
  CreditCardIcon,
  CrownIcon,
  DownloadIcon,
  FileTextIcon,
  RefreshCwIcon,
  SparklesIcon,
} from "@/components/ui/LucideIcons";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

interface PurchaseItem {
  id: number;
  packId: string;
  packName: string;
  amount: string;
  currency: string;
  charAmount: number;
  status: string;
  date: string;
  expiryDate: string | null;
  validityLabel: string;
  isExpired: boolean;
}

interface SubscriptionPayload {
  isAuthenticated: boolean;
  userId: string | null;
  customerNo?: number | null;
  email: string | null;
  username: string;
  displayName: string;
  activePlan: string;
  activePlanName: string;
  purchaseDate: string | null;
  expiryDate: string | null;
  validityStatus: string;
  tier: string;
  balance: number;
  reqCap: number;
  totalPurchasedChars: number;
  purchases: PurchaseItem[];
}

export default function BillingSubscriptionPage() {
  const router = useRouter();
  const [data, setData] = useState<SubscriptionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Plan Upgrade / Checkout state
  const [currency, setCurrency] = useState<PricingCurrency>(
    siteConfig.billing.defaultCurrency
  );
  const [checkoutPackId, setCheckoutPackId] = useState<string | null>(null);
  const [checkoutNotice, setCheckoutNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Manage Subscription / Invoice Billing Profile
  const [billingName, setBillingName] = useState("");
  const [billingCompany, setBillingCompany] = useState("");
  const [billingTaxId, setBillingTaxId] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [savingBillingInfo, setSavingBillingInfo] = useState(false);
  const [billingInfoSaved, setBillingInfoSaved] = useState(false);

  // Active Invoice / Receipt Modal
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseItem | null>(
    null
  );

  const fetchSubscription = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/user/subscription", { cache: "no-store" });
      if (!res.ok) {
        router.replace("/login?next=/billing");
        return;
      }
      const json: SubscriptionPayload = await res.json();
      if (!json.isAuthenticated) {
        router.replace("/login?next=/billing");
        return;
      }
      setData(json);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Keep paid functions hidden while disabled in config/control.ts
    if (!PAID_FEATURES_CONTROL.enabled) {
      router.replace("/profile");
      return;
    }

    fetchSubscription();

    // Load saved billing details from Supabase user_metadata
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: auth }) => {
      const meta = auth.user?.user_metadata?.billing_profile;
      if (meta) {
        setBillingName(meta.billingName || "");
        setBillingCompany(meta.billingCompany || "");
        setBillingTaxId(meta.billingTaxId || "");
        setBillingAddress(meta.billingAddress || "");
      } else if (auth.user?.user_metadata?.full_name) {
        setBillingName(auth.user.user_metadata.full_name);
      }
    });
  }, []);

  const handleSaveBillingProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBillingInfo(true);
    setBillingInfoSaved(false);
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({
        data: {
          billing_profile: {
            billingName: billingName.trim(),
            billingCompany: billingCompany.trim(),
            billingTaxId: billingTaxId.trim(),
            billingAddress: billingAddress.trim(),
          },
        },
      });
      setBillingInfoSaved(true);
      setTimeout(() => setBillingInfoSaved(false), 3000);
    } catch {
      // ignore
    } finally {
      setSavingBillingInfo(false);
    }
  };

  const handleSelectPlan = async (packId: string) => {
    if (packId === "free") return;
    setCheckoutNotice(null);
    setCheckoutPackId(packId);

    try {
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });

      const orderData = await res.json();
      if (!res.ok) {
        setCheckoutNotice({
          type: "error",
          text:
            orderData?.error ||
            "Online checkout is temporarily unavailable. Please contact billing support for instant Pro activation.",
        });
        setCheckoutPackId(null);
        return;
      }

      if (typeof window === "undefined" || !window.Razorpay) {
        setCheckoutNotice({
          type: "error",
          text: "Payment gateway script is still loading. Please try again in a moment.",
        });
        setCheckoutPackId(null);
        return;
      }

      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: siteConfig.name,
        description: `${orderData.packName} (${Number(
          orderData.charAmount
        ).toLocaleString()} Characters)`,
        order_id: orderData.orderId,
        prefill: {
          email: orderData.userEmail || data?.email || "",
          name: billingName || data?.displayName || "",
        },
        theme: { color: "#ff5500" },
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          if (verifyRes.ok) {
            window.dispatchEvent(new Event("credits-updated"));
            setCheckoutNotice({
              type: "success",
              text: "Pro subscription pack activated! Your balance and plan have been updated.",
            });
            fetchSubscription(true);
          } else {
            setCheckoutNotice({
              type: "error",
              text: "Payment verification pending. Please refresh in a few seconds.",
            });
          }
          setCheckoutPackId(null);
        },
        modal: {
          ondismiss: () => setCheckoutPackId(null),
        },
      });

      rzp.open();
    } catch {
      setCheckoutNotice({
        type: "error",
        text: "Unable to initiate payment right now. Please try again or contact support.",
      });
      setCheckoutPackId(null);
    }
  };

  const handleDownloadInvoiceHtml = (item: PurchaseItem) => {
    if (!data) return;
    const invoiceNum = `INV-${new Date(item.date).getFullYear()}-${String(
      item.id
    ).padStart(5, "0")}`;
    const issuedDate = new Date(item.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Receipt ${invoiceNum} - ${siteConfig.name}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; max-width: 720px; margin: 40px auto; padding: 24px; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
    .brand { font-size: 22px; font-weight: 800; color: #ff5500; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; background: #dcfce7; color: #15803d; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-top: 28px; }
    th, td { padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 14px; }
    th { background: #f8fafc; font-size: 12px; text-transform: uppercase; color: #64748b; }
    .total { font-size: 18px; font-weight: 800; text-align: right; margin-top: 20px; }
    .footer { margin-top: 40px; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">${siteConfig.name}</div>
      <div style="font-size:13px;color:#64748b;">${siteConfig.legalEntity} • ${siteConfig.address}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:18px;font-weight:800;">INVOICE / RECEIPT</div>
      <div style="font-size:13px;color:#64748b;">${invoiceNum}</div>
      <div style="font-size:12px;color:#64748b;">Date: ${issuedDate}</div>
    </div>
  </div>
  <div style="margin-top:24px;font-size:14px;">
    <strong>Billed To:</strong><br/>
    ${billingName || data.displayName}<br/>
    ${billingCompany ? `${billingCompany}<br/>` : ""}
    ${data.email || ""}<br/>
    ${billingTaxId ? `GST / Tax ID: ${billingTaxId}<br/>` : ""}
    ${billingAddress ? `${billingAddress}` : ""}
  </div>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Characters Added</th>
        <th>Validity</th>
        <th>Status</th>
        <th style="text-align:right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>${item.packName}</strong><br/><span style="font-size:12px;color:#64748b;">Pack ID: ${item.packId}</span></td>
        <td>+${item.charAmount.toLocaleString()} chars</td>
        <td>${item.validityLabel}</td>
        <td><span class="badge">${item.status}</span></td>
        <td style="text-align:right;font-weight:700;">${item.currency === "USD" ? "$" : "₹"}${item.amount}</td>
      </tr>
    </tbody>
  </table>
  <div class="total">Total Paid: ${item.currency === "USD" ? "$" : "₹"}${item.amount} (${item.currency})</div>
  <div class="footer">
    Thank you for choosing ${siteConfig.name}. For billing assistance, contact ${siteConfig.billing.billingEmail}.
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoiceNum.toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!PAID_FEATURES_CONTROL.enabled) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="size-10 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mb-4" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Redirecting to My Profile...
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Paid functions are currently disabled. Enjoy free AI voice generation!
        </p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-full border-3 border-orange-500/20 border-t-[#ff5500] animate-spin" />
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
            Loading billing &amp; subscription details...
          </p>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const isPro = data.tier === "paid" || data.balance > 0;

  return (
    <main className="relative min-h-screen text-slate-900 dark:text-zinc-100 pb-24">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-8">
        <AccountNavBar />

        {/* Page Title & Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-orange-500/10 text-[#ff5500]">
                <CreditCardIcon size={20} />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                Billing &amp; Subscription
              </h1>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
              Manage your active subscription plan, renewal/expiry dates, transaction history, and downloadable receipts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchSubscription(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:border-orange-500/40 hover:text-[#ff5500] transition cursor-pointer self-start sm:self-auto"
          >
            <RefreshCwIcon size={14} className={refreshing ? "animate-spin" : ""} />
            <span>{refreshing ? "Refreshing..." : "Sync Plan Status"}</span>
          </button>
        </div>

        {/* 1. CURRENT SUBSCRIPTION PLAN & RENEWAL / EXPIRY OVERVIEW */}
        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-3xl border-2 border-orange-500/30 bg-gradient-to-br from-white via-orange-500/[0.03] to-white dark:from-[#0e1017] dark:via-orange-950/20 dark:to-[#0c0d12] p-6 sm:p-8 shadow-lg shadow-orange-500/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold border ${
                  isPro
                    ? "border-amber-500/35 bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    : "border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                }`}
              >
                {isPro ? <CrownIcon size={13} /> : <SparklesIcon size={13} />}
                <span>Current Plan: {isPro ? "Pro" : "Free"}</span>
              </span>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
                  isPro
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-orange-500/25 bg-orange-500/10 text-[#ff5500] dark:text-orange-400"
                }`}
              >
                <span className="size-1.5 rounded-full bg-current" />
                <span>{data.validityStatus}</span>
              </span>
            </div>

            <h2 className="mt-4 text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">
              {data.activePlanName}
            </h2>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 pt-5 border-t border-black/[0.06] dark:border-white/[0.08]">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Available Credits
                </span>
                <p className="mt-1 text-xl font-black text-slate-950 dark:text-white">
                  {isPro ? data.balance.toLocaleString() : "1,000 / wk"}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Activation Date
                </span>
                <p className="mt-1 text-sm font-extrabold text-slate-900 dark:text-white">
                  {data.purchaseDate
                    ? new Date(data.purchaseDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Default Free Tier"}
                </p>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Renewal / Expiry Date
                </span>
                <p className="mt-1 text-sm font-extrabold text-slate-900 dark:text-white">
                  {data.expiryDate
                    ? new Date(data.expiryDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : isPro
                    ? "Never Expires (Lifetime)"
                    : "Renews Automatically Weekly"}
                </p>
              </div>
            </div>
          </div>

          {/* Manage Invoice / Billing Details Card */}
          <form
            onSubmit={handleSaveBillingProfile}
            className="rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.03] p-6 backdrop-blur-xl space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">
                Invoice &amp; Billing Details
              </h3>
              {billingInfoSaved && (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  Saved ✓
                </span>
              )}
            </div>

            <input
              type="text"
              value={billingName}
              onChange={(e) => setBillingName(e.target.value)}
              placeholder="Billing Contact Name"
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
            />
            <input
              type="text"
              value={billingCompany}
              onChange={(e) => setBillingCompany(e.target.value)}
              placeholder="Company / Business Name (Optional)"
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
            />
            <input
              type="text"
              value={billingTaxId}
              onChange={(e) => setBillingTaxId(e.target.value)}
              placeholder="GSTIN / Tax ID (Optional)"
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
            />
            <input
              type="text"
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              placeholder="Billing City / Address"
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
            />

            <button
              type="submit"
              disabled={savingBillingInfo}
              className="w-full rounded-xl border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 py-2 text-xs font-extrabold text-[#ff5500] dark:text-orange-400 transition cursor-pointer"
            >
              {savingBillingInfo ? "Saving..." : "Save Billing Details"}
            </button>
          </form>
        </section>

        {/* 2. UPGRADE TO PRO / MANAGE SUBSCRIPTION PLANS */}
        <section id="upgrade" className="mt-10 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white flex items-center gap-2">
                <CrownIcon size={20} className="text-[#ff5500]" />
                <span>Subscription &amp; Pro Character Plans</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Upgrade anytime to unlock extended character limits, ad-free studio, and cloud archive retention.
              </p>
            </div>

            <div className="inline-flex rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-zinc-900 p-1 self-start sm:self-auto">
              {(["INR", "USD"] as const).map((curr) => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => setCurrency(curr)}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition cursor-pointer ${
                    currency === curr
                      ? "bg-[#ff5500] text-white"
                      : "text-slate-600 dark:text-zinc-400"
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>

          {checkoutNotice && (
            <div
              role="status"
              className={`mb-5 rounded-2xl border p-4 text-xs sm:text-sm font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                checkoutNotice.type === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-200"
              }`}
            >
              <span>{checkoutNotice.text}</span>
              {checkoutNotice.type === "error" && (
                <Link
                  href="/help"
                  className="shrink-0 rounded-xl bg-[#ff5500] px-3.5 py-1.5 text-xs font-extrabold text-white"
                >
                  Contact Billing Support →
                </Link>
              )}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-3">
            {pricingConfig.plans.map((plan) => {
              const isCurrentFree = plan.id === "free" && !isPro;
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col justify-between rounded-3xl border p-6 backdrop-blur-xl transition ${
                    plan.popular
                      ? "border-2 border-[#ff5500] bg-gradient-to-b from-orange-500/[0.07] to-white dark:from-orange-500/[0.12] dark:to-[#0e1017] shadow-xl shadow-orange-500/10"
                      : "border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.03]"
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 right-5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#ff6a1f] to-[#ff4400] px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                      <CrownIcon size={11} />
                      <span>Most Popular Pro</span>
                    </span>
                  )}

                  <div>
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-lg font-black text-slate-950 dark:text-white">
                        {plan.name}
                      </h3>
                      <span className="text-xs font-extrabold text-[#ff5500] dark:text-orange-400">
                        {plan.characters} chars
                      </span>
                    </div>

                    <div className="mt-3 flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-slate-950 dark:text-white">
                        {plan.price[currency]}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-zinc-400">
                        {plan.type === "free" ? "/ weekly reset" : "one-time pack"}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                      {plan.description}
                    </p>

                    <ul className="mt-5 space-y-2 text-xs text-slate-700 dark:text-zinc-300">
                      {plan.tileFeatures.map((feat) => (
                        <li key={feat} className="flex items-center gap-2">
                          <CheckIcon size={14} className="text-emerald-500 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-black/[0.06] dark:border-white/[0.07]">
                    {plan.id === "free" ? (
                      <div className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 py-2.5 text-center text-xs font-bold text-slate-500 dark:text-zinc-400">
                        {isCurrentFree ? "Current Active Plan" : "Included Base Tier"}
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={checkoutPackId === plan.id}
                        onClick={() => handleSelectPlan(plan.id)}
                        className={`w-full inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-extrabold transition cursor-pointer disabled:opacity-50 ${
                          plan.popular
                            ? "bg-gradient-to-r from-[#ff6a1f] to-[#ff4400] text-white shadow-md shadow-orange-500/25 hover:brightness-110"
                            : "border border-orange-500/35 bg-orange-500/10 text-[#ff5500] dark:text-orange-400 hover:bg-orange-500 hover:text-white"
                        }`}
                      >
                        <CrownIcon size={14} />
                        <span>
                          {checkoutPackId === plan.id
                            ? "Initializing Checkout..."
                            : `Upgrade to ${plan.name}`}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. PAYMENT & TRANSACTION HISTORY + INVOICES & RECEIPTS */}
        <section className="mt-12 rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white/85 dark:bg-white/[0.03] p-6 sm:p-8 backdrop-blur-xl shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white flex items-center gap-2">
                <FileTextIcon size={19} className="text-[#ff5500]" />
                <span>Payment History, Invoices &amp; Receipts</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                View all transactions and download official payment receipts.
              </p>
            </div>
          </div>

          {data.purchases.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-black/[0.1] dark:border-white/[0.1] p-10 text-center">
              <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                No payment transactions yet
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
                You are currently on the Free Plan. When you purchase a Pro pack or character booster, your invoices and downloadable receipts will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-black/[0.06] dark:border-white/[0.08] text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    <th className="py-3 px-3">Invoice / Pack</th>
                    <th className="py-3 px-3">Characters</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Validity / Expiry</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
                  {data.purchases.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition"
                    >
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {item.packName}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400">
                          #INV-{String(item.id).padStart(5, "0")}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                        +{item.charAmount.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-3 font-black text-slate-900 dark:text-white">
                        {item.currency === "USD" ? "$" : "₹"}
                        {item.amount}
                      </td>

                      <td className="py-3.5 px-3 text-slate-600 dark:text-zinc-400">
                        {new Date(item.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="py-3.5 px-3 text-slate-700 dark:text-zinc-300">
                        {item.expiryDate
                          ? new Date(item.expiryDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : item.validityLabel}
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            item.status === "paid"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(item)}
                            className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-zinc-200 hover:border-orange-500/40 hover:text-[#ff5500] cursor-pointer"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadInvoiceHtml(item)}
                            title="Download Receipt"
                            className="inline-flex items-center gap-1 rounded-lg bg-orange-500/10 border border-orange-500/25 px-2.5 py-1 text-[11px] font-bold text-[#ff5500] dark:text-orange-400 hover:bg-orange-500/20 cursor-pointer"
                          >
                            <DownloadIcon size={12} />
                            <span>Receipt</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Receipt Preview Modal */}
      {selectedInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setSelectedInvoice(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0e1017] p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-[#ff5500]">
                  Official Receipt
                </p>
                <h3 className="text-lg font-black text-slate-950 dark:text-white">
                  #INV-{String(selectedInvoice.id).padStart(5, "0")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Account Email</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {data.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Plan / Pack</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedInvoice.packName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Characters Added</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  +{selectedInvoice.charAmount.toLocaleString()} chars
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Date</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {new Date(selectedInvoice.date).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Validity</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedInvoice.validityLabel}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-100 dark:border-zinc-800 pt-2.5 text-sm">
                <span className="font-extrabold text-slate-900 dark:text-white">
                  Total Amount
                </span>
                <span className="font-black text-[#ff5500]">
                  {selectedInvoice.currency === "USD" ? "$" : "₹"}
                  {selectedInvoice.amount} ({selectedInvoice.status.toUpperCase()})
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="rounded-xl border border-slate-200 dark:border-zinc-800 px-4 py-2 text-xs font-bold text-slate-600 dark:text-zinc-300 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleDownloadInvoiceHtml(selectedInvoice)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ff6a1f] to-[#ff4400] px-4 py-2 text-xs font-extrabold text-white shadow-md cursor-pointer"
              >
                <DownloadIcon size={14} />
                <span>Download Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

