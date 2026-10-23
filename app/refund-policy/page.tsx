import type { Metadata } from "next";
import PolicyNoticePage from "@/components/pages/PolicyNoticePage";

export const metadata: Metadata = { title: "Refund Policy" };

export default function RefundPolicyPage() {
  return (
    <PolicyNoticePage
      title="Refund Policy"
      intro="This page is reserved for IndianTTS’s refund information."
      topics="refund eligibility, request steps, timing, and payment-specific conditions"
    />
  );
}