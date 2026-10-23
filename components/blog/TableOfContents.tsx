"use client";

import { useEffect, useState } from "react";
import type { TOCItem } from "@/lib/wordpress";

interface TableOfContentsProps {
  headings: TOCItem[];
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);

  useEffect(() => {
    if (!headings || headings.length === 0) return;

    // Set first heading as active initially if none active
    if (!activeId && headings[0]) {
      setActiveId(headings[0].id);
    }

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const offset = 140; // Offset for navbar and sticky header

      let currentId = headings[0]?.id || "";

      for (const item of headings) {
        const el = document.getElementById(item.id);
        if (el) {
          const top = el.getBoundingClientRect().top + scrollY - offset;
          if (scrollY >= top) {
            currentId = item.id;
          }
        }
      }

      if (currentId) {
        setActiveId(currentId);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [headings, activeId]);

  if (!headings || headings.length === 0) {
    return null;
  }

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveId(id);
      setIsOpenMobile(false);
    }
  };

  const activeHeadingText =
    headings.find((h) => h.id === activeId)?.text || "Table of Contents";

  return (
    <>
      {/* Mobile Sticky Floating Bar (Shows on screens < lg) */}
      <div className="lg:hidden mb-8">
        <div className="rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#0d0d14]/80 backdrop-blur-xl p-3 shadow-md">
          <button
            type="button"
            onClick={() => setIsOpenMobile(!isOpenMobile)}
            className="w-full flex items-center justify-between text-left text-xs font-semibold text-slate-800 dark:text-zinc-200"
          >
            <div className="flex items-center gap-2 truncate pr-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-orange-500/10 text-[#ff5500] dark:text-orange-400 text-xs">
                📑
              </span>
              <span className="text-slate-400 dark:text-zinc-500 font-normal">
                Contents:
              </span>
              <span className="truncate text-slate-900 dark:text-white font-medium">
                {activeHeadingText}
              </span>
            </div>
            <span
              className={`transform transition-transform text-slate-400 text-xs ${
                isOpenMobile ? "rotate-180" : ""
              }`}
            >
              ▼
            </span>
          </button>

          {isOpenMobile && (
            <div className="mt-3 pt-3 border-t border-black/[0.06] dark:border-white/[0.06] max-h-64 overflow-y-auto space-y-1.5">
              {headings.map((item) => {
                const isActive = activeId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToHeading(item.id)}
                    className={`w-full text-left rounded-lg px-2.5 py-1.5 text-xs transition-colors block ${
                      item.level === 3 ? "pl-5" : ""
                    } ${
                      isActive
                        ? "bg-orange-500/15 text-[#ff5500] dark:text-orange-400 font-bold"
                        : "text-slate-600 dark:text-zinc-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    {item.text}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Sticky Sidebar (lg and above) */}
      <nav
        aria-label="Table of Contents"
        className="hidden lg:block w-full"
      >
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white/60 dark:bg-[#0d0d14]/60 backdrop-blur-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-black/[0.06] dark:border-white/[0.06]">
            <span className="h-2 w-2 rounded-full bg-[#ff5500] animate-pulse" />
            <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-900 dark:text-zinc-200">
              Contents
            </h4>
            <span className="ml-auto text-[10px] font-semibold text-slate-400 dark:text-zinc-500 rounded-full px-2 py-0.5 bg-black/[0.04] dark:bg-white/[0.06]">
              {headings.length}
            </span>
          </div>

          <div className="space-y-1">
            {headings.map((item) => {
              const isActive = activeId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToHeading(item.id)}
                  className={`group flex w-full text-left rounded-lg py-1.5 px-2.5 text-xs transition-all duration-200 ${
                    item.level === 3 ? "pl-6 text-[11px]" : "font-medium"
                  } ${
                    isActive
                      ? "border-l-2 border-[#ff5500] bg-orange-500/[0.08] text-[#ff5500] dark:text-orange-400 font-bold"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                  }`}
                >
                  <span className="line-clamp-2 leading-relaxed">
                    {item.text}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick jump to top */}
          <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-[11px] text-slate-400 dark:text-zinc-500 hover:text-[#ff5500] dark:hover:text-orange-400 transition-colors flex items-center gap-1 font-medium"
            >
              <span>↑</span>
              <span>Back to top</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
