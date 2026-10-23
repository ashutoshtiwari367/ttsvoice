import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getPostBySlug,
  getPosts,
  parseHeadingsAndInjectIds,
} from "@/lib/wordpress";
import ReadingProgressBar from "@/components/blog/ReadingProgressBar";
import TableOfContents from "@/components/blog/TableOfContents";
import ArticleAudioPlayer from "@/components/blog/ArticleAudioPlayer";
import ShareButtons from "@/components/blog/ShareButtons";
import SidebarCta from "@/components/blog/SidebarCta";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  const cleanTitle = stripHtml(post.title?.rendered || "Blog Post");
  const cleanExcerpt = stripHtml(post.excerpt?.rendered || "");

  return {
    title: `${cleanTitle} — IndianTTS Blog`,
    description: cleanExcerpt.slice(0, 160),
    openGraph: {
      title: cleanTitle,
      description: cleanExcerpt.slice(0, 160),
      images: post.featuredImage ? [post.featuredImage] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Parse Headings to generate Table of Contents & inject anchor IDs (guaranteed fallback if no <h> tags)
  const { html: processedContent, toc } = parseHeadingsAndInjectIds(
    post.content.rendered
  );

  // Fetch related posts excluding current
  const allPosts = await getPosts(6);
  const relatedPosts = allPosts.filter((p) => p.slug !== slug).slice(0, 3);

  const cleanTitle = stripHtml(post.title.rendered);
  const cleanContent = stripHtml(post.content.rendered);

  return (
    <>
      {/* Top viewport reading progress bar */}
      <ReadingProgressBar />

      <main className="relative min-h-screen py-10 sm:py-14 px-4 sm:px-6 lg:px-8 xl:px-12 w-full max-w-[1560px] mx-auto">
        {/* Background ambient lighting matching design system */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 -top-24 -z-10 h-80 w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#ff5500]/15 via-amber-500/10 to-transparent blur-3xl overflow-hidden"
        />

        {/* Back navigation */}
        <div className="mb-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 dark:text-zinc-400 hover:text-[#ff5500] dark:hover:text-orange-400 transition-colors"
          >
            <span>←</span>
            <span>Back to all stories</span>
          </Link>
        </div>

        {/* Full-width 3-Column Grid: Left (TOC) | Center (Article) | Right (Audio + CTA + Share) */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] xl:grid-cols-[280px_1fr_320px] gap-8 lg:gap-10 xl:gap-12 items-start relative">
          
          {/* ========================================================================= */}
          {/* LEFT SIDEBAR: Table of Contents (Sticky) */}
          {/* ========================================================================= */}
          <aside className="w-full lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:scrollbar-none z-10">
            <TableOfContents headings={toc} />
          </aside>

          {/* ========================================================================= */}
          {/* CENTER COLUMN: Article Header, Featured Image, Content & Author Bio */}
          {/* ========================================================================= */}
          <article className="min-w-0 w-full max-w-4xl mx-auto">
            {/* Category Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#ff5500] dark:text-orange-400 mb-4 backdrop-blur-md">
              <span className="dot-live" />
              <span>{post.category || "Case Study & Guide"}</span>
            </div>

            {/* Main Post Title */}
            <h1
              className="text-3xl sm:text-5xl lg:text-5xl font-black text-slate-950 dark:text-white leading-[1.14] tracking-tight mb-6"
              dangerouslySetInnerHTML={{ __html: post.title.rendered }}
            />

            {/* Meta Bar: Author, Date, Reading Time & Social Shares */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-4 mb-6 border-y border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-3">
                {post.authorAvatar ? (
                  <img
                    src={post.authorAvatar}
                    alt={post.authorName}
                    className="h-10 w-10 rounded-full object-cover border border-orange-500/25 shadow-sm"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6a1f] to-[#ff5500] text-white text-xs font-black shadow-sm">
                    {post.authorName.charAt(0).toUpperCase()}
                  </div>
                )}

                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">
                    {post.authorName}
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-zinc-400">
                    {post.date} • {post.readingTime}
                  </span>
                </div>
              </div>

              {/* Share buttons */}
              <ShareButtons title={cleanTitle} />
            </div>

            {/* Mobile/Tablet Audio Narration Bar (Shown only when right sidebar is hidden on < xl) */}
            <div className="xl:hidden mb-6">
              <ArticleAudioPlayer
                title={cleanTitle}
                textContent={cleanContent}
                readingTime={post.readingTime}
                compact={false}
              />
            </div>

            {/* Featured Image */}
            {post.featuredImage && (
              <div className="mb-10 aspect-[16/9] w-full rounded-3xl overflow-hidden border border-black/[0.08] dark:border-white/[0.08] shadow-2xl relative">
                <img
                  src={post.featuredImage}
                  alt={cleanTitle}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Main Article Body (Prose with full styling) */}
            <div
              className="prose dark:prose-invert max-w-none text-slate-800 dark:text-zinc-200 leading-relaxed text-base sm:text-lg
                [&>h2]:text-2xl [&>h2]:sm:text-3xl [&>h2]:font-black [&>h2]:tracking-tight [&>h2]:mt-12 [&>h2]:mb-4 [&>h2]:text-slate-950 [&>h2]:dark:text-white [&>h2]:border-b [&>h2]:border-black/[0.06] [&>h2]:dark:border-white/[0.06] [&>h2]:pb-2
                [&>h3]:text-xl [&>h3]:sm:text-2xl [&>h3]:font-bold [&>h3]:mt-8 [&>h3]:mb-3 [&>h3]:text-slate-900 [&>h3]:dark:text-zinc-100
                [&>p]:text-slate-700 [&>p]:dark:text-zinc-300 [&>p]:leading-relaxed [&>p]:mb-6
                [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-2.5 [&>ul]:mb-6
                [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:space-y-2.5 [&>ol]:mb-6
                [&>blockquote]:border-l-4 [&>blockquote]:border-[#ff5500] [&>blockquote]:bg-orange-500/[0.05] [&>blockquote]:rounded-r-2xl [&>blockquote]:py-4 [&>blockquote]:px-5 [&>blockquote]:italic [&>blockquote]:text-slate-800 [&>blockquote]:dark:text-zinc-200 [&>blockquote]:my-8
                [&>img]:rounded-2xl [&>img]:my-8 [&>img]:max-w-full [&>img]:shadow-lg [&>img]:border [&>img]:border-black/[0.06] [&>img]:dark:border-white/[0.06]
                [&>a]:text-[#ff5500] [&>a]:dark:text-orange-400 [&>a]:font-semibold [&>a]:underline [&>a]:underline-offset-4 hover:[&>a]:text-[#ff7a33]
                [&>code]:bg-black/[0.06] [&>code]:dark:bg-white/[0.08] [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded-md [&>code]:text-sm
                [&>pre]:bg-[#0d0d14] [&>pre]:border [&>pre]:border-white/[0.08] [&>pre]:rounded-2xl [&>pre]:p-5 [&>pre]:my-6 [&>pre]:overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: processedContent }}
            />

            {/* Author Bio Card */}
            <div className="mt-12 rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white/75 dark:bg-white/[0.03] p-6 sm:p-8 backdrop-blur-xl shadow-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                {post.authorAvatar ? (
                  <img
                    src={post.authorAvatar}
                    alt={post.authorName}
                    className="h-16 w-16 rounded-2xl object-cover border border-orange-500/30 shadow-md"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff6a1f] to-[#ff5500] text-white text-xl font-black shadow-md shadow-orange-500/20">
                    {post.authorName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#ff5500] dark:text-orange-400">
                    Author
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {post.authorName}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                    {post.authorBio ||
                      "Writer & audio synthesis specialist covering speech AI, developer tutorials, and creative workflows."}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom High-Converting Banner */}
            <div className="mt-10 rounded-3xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent p-8 sm:p-10 backdrop-blur-xl shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#ff5500] dark:text-orange-400">
                    Ready to create speech?
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white mt-1">
                    Turn your scripts into natural human speech
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                    50+ regional languages, crystal-clear 320kbps MP3s, and instant free tier.
                  </p>
                </div>

                <Link
                  href="/text-to-speech"
                  className="btn-primary shrink-0 px-6 py-3.5 text-sm font-bold shadow-lg shadow-orange-500/25"
                >
                  <span>Try Studio Free</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </article>

          {/* ========================================================================= */}
          {/* RIGHT SIDEBAR: "Listen to Article" + Held Sticky CTA + Share */}
          {/* ========================================================================= */}
          <aside className="hidden xl:flex xl:flex-col w-[320px] shrink-0 sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto scrollbar-none space-y-6 z-10 pb-4">
            {/* 1. Listen to Article (Audio Narration) placed in side */}
            <ArticleAudioPlayer
              title={cleanTitle}
              textContent={cleanContent}
              readingTime={post.readingTime}
              compact={true}
            />

            {/* 2. Sticky Conversion CTA held in place */}
            <SidebarCta />

            {/* 3. Quick Share Card */}
            <div className="rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-4 shadow-sm flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                Found this helpful?
              </span>
              <ShareButtons title={cleanTitle} />
            </div>
          </aside>
        </div>

        {/* Related Articles Section */}
        {relatedPosts.length > 0 && (
          <section className="mt-20 pt-12 border-t border-black/[0.06] dark:border-white/[0.06] w-full">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#ff5500] dark:text-orange-400">
                  Keep Exploring
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white mt-1">
                  Related Articles
                </h2>
              </div>
              <Link
                href="/blog"
                className="text-xs sm:text-sm font-bold text-[#ff5500] dark:text-orange-400 hover:underline flex items-center gap-1"
              >
                <span>View all stories</span>
                <span>→</span>
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((related) => (
                <Link
                  key={related.id}
                  href={`/blog/${related.slug}`}
                  className="group card-glow flex flex-col overflow-hidden rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.025] backdrop-blur-xl transition-all hover:border-orange-500/40"
                >
                  {related.featuredImage ? (
                    <div className="aspect-[16/10] w-full overflow-hidden bg-zinc-900 border-b border-black/[0.06] dark:border-white/[0.06]">
                      <img
                        src={related.featuredImage}
                        alt={stripHtml(related.title.rendered)}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/10] w-full bg-gradient-to-br from-[#ff6a1f]/15 via-orange-500/10 to-amber-500/5 flex items-center justify-center text-3xl border-b border-black/[0.06] dark:border-white/[0.06]">
                      🎙️
                    </div>
                  )}
                  <div className="p-6 flex-1 flex flex-col">
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 mb-2">
                      {related.readingTime} • {related.date}
                    </span>
                    <h3
                      className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#ff5500] dark:group-hover:text-orange-400 transition-colors line-clamp-2 leading-snug"
                      dangerouslySetInnerHTML={{ __html: related.title.rendered }}
                    />
                    <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-xs">
                      <span className="text-slate-400 dark:text-zinc-500">
                        {related.authorName}
                      </span>
                      <span className="font-bold text-[#ff5500] dark:text-orange-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Read →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
