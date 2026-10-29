"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PricingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/text-to-speech");
  }, [router]);

  return (
    <main className="flex-1 flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="size-10 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mb-4" />
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">Redirecting to Voice Studio...</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
        Paid functions are currently unavailable. Enjoy 100% free speech generation!
      </p>
      <Link
        href="/text-to-speech"
        className="mt-5 btn-primary px-5 py-2.5 text-xs sm:text-sm font-bold inline-flex items-center gap-1.5"
      >
        <span>🎙️ Open Voice Studio &rarr;</span>
      </Link>
    </main>
  );
}