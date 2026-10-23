import type { Metadata } from "next";
import PolicyNoticePage from "@/components/pages/PolicyNoticePage";

export const metadata: Metadata = { title: "Grievance" };

export default function GrievancePage() {
  return (
    <PolicyNoticePage
      title="Grievance"
      intro="This page is reserved for IndianTTS’s grievance process."
      topics="how to submit a grievance, where to send it, and how it will be handled"
    />
  );
}