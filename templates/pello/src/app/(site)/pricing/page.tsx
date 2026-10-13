import type { Metadata } from "next";
import { Cta } from "@/components/home/cta";
import { Faq } from "@/components/home/faq";
import { Pricing } from "@/components/home/pricing";
import { Compare } from "@/components/pages/compare";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Priced per person, from $6 a month. Every plan has the Slack and Teams apps, unlimited questions and a 30 day free trial.",
};

export default function PricingPage() {
  return (
    <>
      <div className="pt-4">
        <Pricing heading="h1" />
      </div>
      <Compare />
      <Faq />
      <Cta />
    </>
  );
}
