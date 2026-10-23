import type { Metadata } from "next";
import PolicyNoticePage from "@/components/pages/PolicyNoticePage";

export const metadata: Metadata = { title: "Cookie Policy" };

export default function CookiePolicyPage() {
  return (
    <PolicyNoticePage
      title="Cookie Policy"
      intro="This page is reserved for information about cookies and similar technologies used by IndianTTS."
      topics="which cookies or similar technologies are used, why they are used, and how users can manage them"
    />
  );
}