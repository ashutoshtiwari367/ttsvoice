import type { Metadata } from "next";
import PolicyNoticePage from "@/components/pages/PolicyNoticePage";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPolicyPage() {
  return (
    <PolicyNoticePage
      title="Privacy Policy"
      intro={`This page is reserved for ${siteConfig.name}'s privacy information.`}
      topics="how information is collected, used, stored, shared, and deleted"
    />
  );
}