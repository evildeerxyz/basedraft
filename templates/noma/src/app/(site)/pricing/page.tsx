import type { Metadata } from "next";
import { FinalCta } from "@/components/home/sections";
import { Comparison, Faq, PricingPlans } from "@/components/pages/pricing";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Start free. Pay per seat when your team grows. People who only read shared answers never pay.",
  alternates: { canonical: "/pricing" },
  openGraph: { url: "/pricing" },
};

export default function PricingPage() {
  return (
    <>
      <PricingPlans />
      <Comparison />
      <Faq />
      <FinalCta />
    </>
  );
}
