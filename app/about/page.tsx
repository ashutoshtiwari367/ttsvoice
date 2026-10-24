import type { Metadata } from "next";
import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import Languages from "@/components/sections/Languages";
import HowItWorks from "@/components/sections/HowItWorks";
import FAQ from "@/components/sections/FAQ";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `About ${siteConfig.name} — AI Voice Generator Platform`,
  description: `Learn about ${siteConfig.name}, our lifelike neural voice technology, features, supported Indian and global languages, and how it works.`,
};

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <Languages />
      <HowItWorks />
      <FAQ />
    </main>
  );
}