import type { ReactNode } from "react";
import AdSlot from "@/components/ads/AdSlot";

interface ContentLayoutProps {
  children: ReactNode;
  sidebar?: boolean;   // show the sticky sidebar ad (desktop)
}

/**
 * Wrapper for content/SEO pages with optimized, policy-safe ad placement.
 * Usage: wrap your article; drop <AdSlot format="in-article" /> between sections
 * inside `children` for the mid-content ads.
 */
export default function ContentLayout({ children, sidebar = true }: ContentLayoutProps) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
      <div className={sidebar ? "lg:grid lg:grid-cols-[1fr_300px] lg:gap-10" : ""}>
        <article className="prose prose-slate max-w-none">
          {/* Top-of-content ad (after the intro — place the intro first in children) */}
          {children}

          {/* End-of-article ad */}
          <AdSlot format="in-article" label="Advertisement" />
        </article>

        {sidebar && (
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <AdSlot format="sidebar" label="Advertisement" />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}