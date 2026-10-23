import type { Metadata } from "next";
import PolicyNoticePage from "@/components/pages/PolicyNoticePage";

export const metadata: Metadata = { title: "Acceptable Use" };

export default function AcceptableUsePage() {
  return (
    <PolicyNoticePage
      title="Acceptable Use"
      intro="This page is reserved for IndianTTS’s acceptable-use rules."
      topics="permitted and prohibited uses of the service"
    />
  );
}