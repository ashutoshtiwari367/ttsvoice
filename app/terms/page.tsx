import type { Metadata } from "next";
import PolicyNoticePage from "@/components/pages/PolicyNoticePage";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <PolicyNoticePage
      title="Terms"
      intro="This page is reserved for the terms that apply to IndianTTS."
      topics="access, acceptable service conditions, intellectual property, availability, and disputes"
    />
  );
}