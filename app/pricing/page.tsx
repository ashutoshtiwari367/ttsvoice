"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";

import PricingCurrencySelector from "../../components/pricing/PricingCurrencySelector";
import {
  pricingConfig,
  type PricingCurrency,
  type PricingPlan,
} from "../../config/pricingPlans";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

interface PurchaseItem {
  id: number;
  packId: string;
  amount: string;
  currency: string;
  charAmount: number;
  status: string;
  date: string;
}

interface SubscriptionState {
  isAuthenticated: boolean;
  email: string | null;
  activePlan: string;
  tier: string;
  balance: number;
  reqCap: number;
  totalPurchasedChars: number;
  purchases: PurchaseItem[];
}

function ComparisonValue({
  value,
}: {
  value: string | boolean | undefined;
}) {
  if (value === true) {
    return (
      <span
        aria-label="Included"
        className="inline-flex size-6 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-400 border border-emerald-500/25"
      >
        ✓
      </span>
    );
  }

  if (value === false) {
    return (
      <span
        aria-label="Not included"
        className="text-slate-300 dark:text-zinc-600 font-bold"
      >
        —
      </span>
    );
  }

  return (
    <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-zinc-200">
      {value ?? "—"}
    </span>
  );
}

export default function PricingPage() {
  const [currency, setCurrency] = useState<PricingCurrency>("INR");
  const [subscription, setSubscription] = useState<SubscriptionState | null>(null);
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    packName: string;
    creditsAdded: number;
    newBalance: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const plans = pricingConfig.plans;
  const addOns = pricingConfig.addOns ?? [];
  const comparisonSections = pricingConfig.comparisonSections;

  const fetchSubscription = async () => {
    try {
      const res = await fetch("/api/user/subscription");
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchSubscription();
    window.addEventListener("focus", fetchSubscription);
    window.addEventListener("credits-updated", fetchSubscription);
    return () => {
      window.removeEventListener("focus", fetchSubscription);
      window.removeEventListener("credits-updated", fetchSubscription);
    };
  }, []);

  async function handleBuy(packId: string) {
    setErrorMessage(null);

    // 1. If not authenticated, prompt sign in
    if (!subscription?.isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    // 2. Free pack redirects directly to Studio
    if (packId === "free") {
      window.location.href = "/text-to-speech";
      return;
    }

    setLoadingPack(packId);

    try {
      // 3. Create Razorpay order on backend
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });

      const orderData = await res.json();

      if (!res.ok) {
        setErrorMessage(orderData.error || "Unable to initiate payment.");
        setLoadingPack(null);
        return;
      }

      // Check if Razorpay script loaded
      if (typeof window === "undefined" || !window.Razorpay) {
        setErrorMessage("Payment gateway SDK is loading. Please try again in a moment.");
        setLoadingPack(null);
        return;
      }

      // 4. Open Razorpay Checkout modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "IndianTTS Voice Studio",
        description: `${orderData.packName} (${orderData.charAmount.toLocaleString()} Characters)`,
        order_id: orderData.orderId,
        prefill: {
          email: orderData.userEmail || "",
          contact: orderData.userPhone || "",
        },
        theme: {
          color: "#ff5500",
        },
        handler: async function (response: any) {
          try {
            // 5. Verify payment & add credits atomically
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                packId,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              setSuccessInfo({
                packName: verifyData.packName,
                creditsAdded: verifyData.creditsAdded,
                newBalance: verifyData.newBalance,
              });

              // Dispatch event to update Header & Workspace credits
              window.dispatchEvent(new Event("credits-updated"));
              fetchSubscription();
            } else {
              setErrorMessage(
                verifyData.error || "Payment verification failed. Please contact support."
              );
            }
          } catch {
            setErrorMessage("Network error while verifying payment.");
          } finally {
            setLoadingPack(null);
          }
        },
        modal: {
          ondismiss: function () {
            setLoadingPack(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (resp: any) {
        setErrorMessage(
          resp.error?.description || "Payment failed. Please try a different payment method."
        );
        setLoadingPack(null);
      });
      rzp.open();
    } catch {
      setErrorMessage("Something went wrong while connecting to payment gateway.");
      setLoadingPack(null);
    }
  }

  return (
    <main className="relative min-h-screen text-slate-900 dark:text-zinc-100 transition-colors pb-24 overflow-hidden">
      {/* Razorpay Checkout Script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      {/* Top back bar & History button */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-zinc-400 transition hover:text-[#ff5500] dark:hover:text-orange-400"
        >
          <span>←</span>
          <span>Back to Home Studio</span>
        </Link>

        {subscription?.isAuthenticated && (
          <button
            type="button"
            onClick={() => setShowHistory(true)}
            className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:border-orange-500/40 hover:text-[#ff5500] dark:hover:text-orange-400 transition backdrop-blur-md cursor-pointer"
          >
            <span>📜</span>
            <span>Billing History ({subscription.purchases.length})</span>
          </button>
        )}
      </div>

      {/* HERO SECTION */}
      <section className="px-4 sm:px-6 pb-12 pt-8 text-center">
        <div className="mx-auto max-w-5xl">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-4 py-1.5 text-xs font-bold text-[#ff5500] dark:text-orange-400 backdrop-blur-md">
            <span className="dot-live" />
            <span>100% Prepaid • No Forced Subscriptions</span>
          </div>

          <h1 className="mx-auto mt-6 max-w-4xl text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 dark:text-white leading-[1.12]">
            Pay only for the voices you use.{" "}
            <br className="hidden sm:inline" />
            <span className="text-gradient">No lock-ins. No hidden fees.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-600 dark:text-zinc-400">
            Top up character credits when you need them. Standard character balances never expire, and all generated voices include full commercial rights.
          </p>

          {/* ACTIVE ACCOUNT & LIVE BALANCE CARD */}
          {subscription?.isAuthenticated && (
            <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-3xl border border-orange-500/30 bg-white/80 dark:bg-white/[0.03] p-6 sm:p-8 shadow-xl dark:shadow-[0_20px_60px_-15px_rgba(255,85,0,0.15)] backdrop-blur-2xl text-left relative">
              <div className="pointer-events-none absolute -right-20 -top-20 size-60 rounded-full bg-orange-500/10 blur-3xl" />

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 border-b border-black/[0.06] dark:border-white/[0.08] pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-0.5 text-[11px] font-bold text-emerald-500 dark:text-emerald-400">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active Account
                    </span>
                    <span className="text-xs text-slate-400 dark:text-zinc-500 truncate max-w-[200px]">
                      {subscription.email}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2">
                    Tier: <span className="text-gradient">{subscription.activePlan}</span>
                  </h3>
                </div>

                <div className="sm:text-right">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-zinc-500">
                    Available Character Balance
                  </span>
                  <div className="mt-1 flex items-baseline sm:justify-end gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
                      {subscription.balance.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-orange-500 uppercase">credits</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-zinc-400 font-medium">
                  <span>⚡ Request Cap: <strong>{subscription.reqCap.toLocaleString()}</strong> chars</span>
                  <span>✨ Lifetime Purchased: <strong>{subscription.totalPurchasedChars.toLocaleString()}</strong> chars</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowHistory(true)}
                  className="font-bold text-[#ff5500] hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  View Invoices & Receipts →
                </button>
              </div>
            </div>
          )}

          {/* Currency Switcher */}
          <div className="mt-8 flex justify-center">
            <PricingCurrencySelector
              currency={currency}
              onCurrencyChange={setCurrency}
            />
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium flex items-center justify-between gap-2 shadow-sm backdrop-blur-md">
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="font-bold text-red-500 hover:text-red-700 px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </section>

      {/* PLAN CARDS SECTION */}
      <section className="relative px-4 sm:px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              Select Your Prepaid Pack
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
              One-time charge via Razorpay. Instantly credited to your profile.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {plans.map((plan) => {
              const isPopular = plan.popular;
              const isLoading = loadingPack === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col justify-between rounded-3xl p-7 transition-all duration-300 backdrop-blur-xl ${
                    isPopular
                      ? "border-2 border-orange-500 bg-white/90 dark:bg-white/[0.045] shadow-2xl shadow-orange-500/15 -translate-y-1"
                      : "border border-black/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.025] shadow-sm hover:-translate-y-1 hover:border-orange-500/40"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#ff6a1f] to-[#ff4400] px-4 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-md shadow-orange-500/30">
                      Most Popular Pack
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                        {plan.name}
                      </p>
                      {plan.id === "free" ? (
                        <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-zinc-400">
                          Tester
                        </span>
                      ) : (
                        <span className="rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-bold text-[#ff5500] dark:text-orange-400 border border-orange-500/20">
                          Instant Top-up
                        </span>
                      )}
                    </div>

                    <div className="mt-5 flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
                        {plan.price[currency]}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">
                        {plan.id === "free" ? "/ week" : "one-time"}
                      </span>
                    </div>

                    <p className="mt-3 text-lg font-bold text-slate-800 dark:text-zinc-200">
                      {plan.characters} characters
                    </p>

                    <p className="mt-2 min-h-[50px] text-xs sm:text-sm leading-6 text-slate-600 dark:text-zinc-400">
                      {plan.description}
                    </p>

                    <div className="my-6 border-t border-black/[0.06] dark:border-white/[0.08]" />

                    {/* Features list */}
                    <ul className="space-y-3 text-xs sm:text-sm">
                      {plan.tileFeatures.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center gap-2.5 text-slate-700 dark:text-zinc-300"
                        >
                          <span className="flex size-4.5 items-center justify-center rounded-full bg-orange-500/15 text-[#ff5500] dark:text-orange-400 text-xs font-bold">
                            ✓
                          </span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 pt-2">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleBuy(plan.id)}
                      className={`w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 ${
                        plan.id === "free"
                          ? "btn-ghost"
                          : "btn-primary shadow-lg shadow-orange-500/25"
                      }`}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          <span>Connecting Razorpay…</span>
                        </span>
                      ) : plan.id === "free" ? (
                        "Open Free Studio →"
                      ) : (
                        `Recharge ${plan.name} (${plan.price[currency]})`
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ADD-ON PACKS SECTION */}
      {addOns.length > 0 && (
        <section className="relative px-4 sm:px-6 py-12">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#ff5500] dark:text-orange-400">
                <span>Heavy Creator Boosters</span>
              </div>
              <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                High-Volume Character Add-ons
              </h2>
              <p className="mx-auto mt-2 max-w-2xl text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                Bulk character bundles for agencies, audiobook narrators, and YouTube channels.
              </p>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
              {addOns.map((addOn) => (
                <div
                  key={addOn.id}
                  className="card-glow flex flex-col justify-between rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.025] p-6 shadow-sm backdrop-blur-xl"
                >
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                      {addOn.name}
                    </span>
                    <p className="mt-3 text-3xl font-black text-slate-950 dark:text-white">
                      {addOn.price[currency]}
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#ff5500] dark:text-orange-400">
                      {addOn.value}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-zinc-400">
                      {addOn.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={loadingPack === addOn.id}
                    onClick={() => handleBuy(addOn.id)}
                    className="btn-primary mt-6 w-full py-3 text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {loadingPack === addOn.id ? "Connecting…" : `Get ${addOn.name}`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FEATURE COMPARISON TABLE */}
      <section className="relative px-4 sm:px-6 py-16 border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              Detailed Plan Specifications
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
              Complete breakdown of retention, audio bitrates, and language access.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.02] shadow-sm backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.06] dark:border-white/[0.08]">
                    <th className="w-[34%] px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                      Feature
                    </th>
                    {plans.map((plan) => (
                      <th
                        key={plan.id}
                        className={`min-w-[150px] px-5 py-5 text-center text-xs sm:text-sm font-bold ${
                          plan.popular
                            ? "bg-orange-500/10 text-[#ff5500] dark:text-orange-400"
                            : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {comparisonSections.map((sec) => (
                    <PricingComparisonSection
                      key={sec.id}
                      title={sec.title}
                      items={sec.items}
                      plans={plans}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* AUTH REQUIRED MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d0d14] p-7 shadow-2xl text-left">
            <div className="size-12 rounded-2xl bg-orange-500/20 text-[#ff5500] flex items-center justify-center text-xl font-bold mb-4 border border-orange-500/30">
              🪙
            </div>
            <h3 className="text-xl font-bold text-white">
              Sign in to recharge
            </h3>
            <p className="mt-2 text-xs sm:text-sm leading-6 text-zinc-400">
              Please sign in with your account so purchased character credits are credited directly to your profile.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-xs sm:text-sm font-semibold text-zinc-300 hover:bg-white/10 transition cursor-pointer"
              >
                Cancel
              </button>
              <Link
                href="/login?next=/pricing"
                className="btn-primary flex-1 py-3 text-xs sm:text-sm"
              >
                Sign In Now →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT SUCCESS CELEBRATION MODAL */}
      {successInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-emerald-500/30 bg-[#0d0d14] p-8 shadow-2xl text-center">
            <div className="mx-auto size-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl font-black mb-4 border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
              ✓
            </div>
            <h3 className="text-2xl font-black text-white">
              Payment Successful!
            </h3>
            <p className="mt-2 text-sm text-zinc-300">
              Your recharge of <strong>{successInfo.packName}</strong> is complete.
            </p>

            <div className="mt-5 rounded-2xl bg-emerald-500/10 p-5 border border-emerald-500/25 text-emerald-300">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Added to your balance
              </p>
              <p className="text-3xl font-black mt-1 text-white">
                +{successInfo.creditsAdded.toLocaleString()} Chars
              </p>
              <p className="text-xs mt-1.5 text-zinc-400">
                New Total Balance: <strong className="text-white">{successInfo.newBalance.toLocaleString()} credits</strong>
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              <Link
                href="/text-to-speech"
                className="btn-primary w-full py-3.5 text-sm"
              >
                Open Voice Studio Now →
              </Link>
              <button
                type="button"
                onClick={() => setSuccessInfo(null)}
                className="w-full rounded-xl border border-white/10 py-2.5 text-xs font-semibold text-zinc-400 hover:bg-white/5 transition cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PURCHASE HISTORY DRAWER / MODAL */}
      {showHistory && subscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0d0d14] p-6 sm:p-7 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📜</span>
                <span>Invoices &amp; Top-up Receipts</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="size-8 rounded-full bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {subscription.purchases.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 text-xs">
                  No previous purchases found. Recharges will appear here.
                </div>
              ) : (
                subscription.purchases.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/[0.03] text-xs"
                  >
                    <div>
                      <p className="font-bold text-white uppercase tracking-wider">
                        {item.packId}
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {new Date(item.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-extrabold text-white text-sm">
                        ₹{item.amount}
                      </p>
                      <span className="inline-block mt-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">
                        +{item.charAmount.toLocaleString()} chars
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-white/10 text-right">
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="rounded-xl bg-white/10 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function PricingComparisonSection({
  title,
  items,
  plans,
}: {
  title: string;
  items: {
    id: string;
    label: string;
    values: Record<string, string | boolean>;
  }[];
  plans: {
    id: string;
    name: string;
    popular?: boolean;
  }[];
}) {
  return (
    <>
      <tr>
        <td
          colSpan={plans.length + 1}
          className="border-b border-black/[0.06] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.03] px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-[#ff5500] dark:text-orange-400"
        >
          {title}
        </td>
      </tr>

      {items.map((item) => (
        <tr
          key={item.id}
          className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
        >
          <td className="px-6 py-4 text-left text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-300">
            {item.label}
          </td>

          {plans.map((plan) => (
            <td
              key={plan.id}
              className={`px-5 py-4 text-center ${
                plan.popular ? "bg-orange-500/[0.03] dark:bg-orange-500/[0.05]" : ""
              }`}
            >
              <ComparisonValue value={item.values[plan.id]} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}