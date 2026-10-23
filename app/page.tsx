import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import Languages from "@/components/sections/Languages";
import HowItWorks from "@/components/sections/HowItWorks";
import FAQ from "@/components/sections/FAQ";

export default function Home() {
  return (
    <main>
      <Hero />
      <Features />
      <Languages />
      <HowItWorks />
      <FAQ />
    </main>
  );
}