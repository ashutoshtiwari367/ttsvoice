import Link from "next/link";
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { resolveSiteBaseUrl } from "@/lib/seo";
import { getPosts, getWordPressBaseUrl, stripHtml } from "@/lib/wordpress";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await resolveSiteBaseUrl();
  return {
    title: `Blog — ${siteConfig.name} Guides, Product Updates & Stories`,
    description:
      "Explore the latest tutorials, creator workflows, and insights on Indian & global AI voice synthesis.",
    alternates: {
      canonical: `${baseUrl}/blog`,
    },
    openGraph: {
      title: `Blog — ${siteConfig.name}`,
      description:
        "Explore the latest tutorials, creator workflows, and insights on Indian & global AI voice synthesis.",
      url: `${baseUrl}/blog`,
      type: "website",
    },
  };
}

export default async function BlogPage() {
  const posts = await getPosts(36);

  return (
    <main className="relative min-h-screen py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto overflow-hidden">
      {/* Background ambient lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 -top-24 -z-10 h-72 w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#ff5500]/20 via-amber-500/10 to-transparent blur-3xl"
      />

      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-4 py-1.5 text-xs font-bold text-[#ff5500] dark:text-orange-400 backdrop-blur-md">
          <span className="dot-live" />
          <span>Editorial &amp; Resources</span>
        </div>

        <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 dark:text-white leading-[1.12]">
          Stories, Updates &amp; <span className="text-gradient">Audio Guides.</span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-600 dark:text-zinc-400">
          Discover how creators, agencies, and developers use authentic Indian voices and neural AI to scale voiceovers.
        </p>
      </div>

      {/* Grid of Posts */}
      {posts.length === 0 ? (
        <div className="mx-auto max-w-md rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.025] p-10 text-center backdrop-blur-xl shadow-lg">
          <div className="text-4xl mb-3">✍️</div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No published posts found yet
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
            Go to your WordPress Admin dashboard and publish your first article!
          </p>
          <a
            href={`${getWordPressBaseUrl()}/wp-admin`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-6 inline-flex px-5 py-2.5 text-xs font-bold"
          >
            Open WordPress Admin →
          </a>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const cleanExcerpt = stripHtml(post.excerpt?.rendered || "");

            return (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group card-glow flex flex-col overflow-hidden rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white/75 dark:bg-white/[0.03] backdrop-blur-xl transition-all duration-300 hover:border-orange-500/40 hover:shadow-2xl hover:shadow-orange-500/10"
              >
                {/* Thumbnail Image */}
                {post.featuredImage ? (
                  <div className="aspect-[16/10] w-full overflow-hidden bg-zinc-900 border-b border-black/[0.06] dark:border-white/[0.06]">
                    <img
                      src={post.featuredImage}
                      alt={stripHtml(post.title.rendered)}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/10] w-full bg-gradient-to-br from-[#ff6a1f]/15 via-orange-500/10 to-amber-500/5 flex items-center justify-center text-4xl border-b border-black/[0.06] dark:border-white/[0.06]">
                    🎙️
                  </div>
                )}

                {/* Card Body */}
                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <div className="flex items-center justify-between text-xs text-slate-400 dark:text-zinc-500 mb-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-bold text-[#ff5500] dark:text-orange-400">
                      {post.category || "Article"}
                    </span>
                    <span>{post.readingTime}</span>
                  </div>

                  <h2
                    className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-[#ff5500] dark:group-hover:text-orange-400 transition-colors line-clamp-2 leading-snug"
                    dangerouslySetInnerHTML={{ __html: post.title.rendered }}
                  />

                  {cleanExcerpt && (
                    <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-zinc-400 line-clamp-3 flex-1">
                      {cleanExcerpt}
                    </p>
                  )}

                  <div className="mt-6 pt-4 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-slate-400 dark:text-zinc-500 font-medium">
                      {post.date}
                    </span>
                    <span className="font-bold text-[#ff5500] dark:text-orange-400 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Read Article <span>→</span>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
