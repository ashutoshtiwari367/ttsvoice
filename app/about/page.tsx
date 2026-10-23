import type { Metadata } from "next";
import ContentPage from "@/components/pages/ContentPage";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `About ${siteConfig.name}`,
  description: `Learn about ${siteConfig.name} - ${siteConfig.tagline}`,
};

export default function AboutPage() {
  return (
    <ContentPage
      eyebrow="About Us"
      title={`About ${siteConfig.name}`}
      intro={`${siteConfig.name} is a high-performance text-to-speech platform designed to create natural, lifelike Indian and global AI voiceovers with studio audio quality.`}
    >
      <section>
        <h2 className="font-bold text-slate-950 dark:text-white text-lg">The Product</h2>
        <p className="mt-2 text-slate-600 dark:text-zinc-400 leading-relaxed">
          {siteConfig.description} Use the Text to Speech studio to explore languages, select voices, adjust speech speed, and synthesize natural audio instantly.
        </p>
      </section>

      <section className="mt-6 pt-6 border-t border-black/[0.06] dark:border-white/[0.08]">
        <h2 className="font-bold text-slate-950 dark:text-white text-lg">Contact &amp; Support</h2>
        <p className="mt-2 text-slate-600 dark:text-zinc-400 leading-relaxed">
          Have questions, feature requests, or partnership inquiries? Reach our team at{" "}
          <a href={`mailto:${siteConfig.supportEmail}`} className="text-[#ff5500] dark:text-orange-400 font-semibold hover:underline">
            {siteConfig.supportEmail}
          </a>.
        </p>
      </section>
    </ContentPage>
  );
}