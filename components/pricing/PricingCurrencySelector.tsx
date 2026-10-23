"use client";

type Currency = "INR" | "USD";

interface PricingCurrencySelectorProps {
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
}

export default function PricingCurrencySelector({
  currency,
  onCurrencyChange,
}: PricingCurrencySelectorProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="inline-flex rounded-full border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.04] p-1 backdrop-blur-xl shadow-inner">
        <button
          type="button"
          onClick={() => onCurrencyChange("INR")}
          className={`rounded-full px-5 py-2 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
            currency === "INR"
              ? "bg-gradient-to-r from-[#ff6a1f] to-[#ff4400] text-white shadow-md shadow-orange-500/25"
              : "text-slate-600 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white"
          }`}
        >
          ₹ INR (Domestic)
        </button>

        <button
          type="button"
          onClick={() => onCurrencyChange("USD")}
          className={`rounded-full px-5 py-2 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
            currency === "USD"
              ? "bg-gradient-to-r from-[#ff6a1f] to-[#ff4400] text-white shadow-md shadow-orange-500/25"
              : "text-slate-600 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white"
          }`}
        >
          $ USD (Global)
        </button>
      </div>

      <p className="mt-2.5 text-xs text-slate-500 dark:text-zinc-500">
        {currency === "INR"
          ? "UPI, Google Pay, PhonePe, Cards & Netbanking supported"
          : "International cards and PayPal supported"}
      </p>
    </div>
  );
}