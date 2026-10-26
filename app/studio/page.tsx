import type { Metadata } from "next";
import PremiumStudioWorkspace from "@/components/tts/PremiumStudioWorkspace";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `${siteConfig.name} Studio — AI Text to Speech Studio (Pro)`,
  description:
    "Convert your text into natural, high-quality speech using advanced AI voices in IndianTTS Studio.",
};

export default function StudioPage() {
  return <PremiumStudioWorkspace />;
}
