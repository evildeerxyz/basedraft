import type { Metadata } from "next";
import { Logos } from "@/components/home/hero";
import { FinalCta, Testimonials } from "@/components/home/sections";
import { CityScene } from "@/components/gl/lazy";
import { CaseGrid, FeaturedStory } from "@/components/pages/customers";
import { PageHero } from "@/components/site/ui";

export const metadata: Metadata = {
  title: "Customers",
  description: "How 2,400+ data teams turn questions into reviewed SQL, and reviewed SQL into decisions.",
  alternates: { canonical: "/customers" },
  openGraph: { url: "/customers" },
};

const FACTS = [
  ["2,400+", "teams on Noma"],
  ["4.2M", "questions answered a month"],
  ["0", "writes run without a human"],
];

export default function CustomersPage() {
  return (
    <>
      <PageHero
        eyebrow="Customers"
        title="Teams that ship answers, not queries."
        description="From ten-person startups to regulated enterprises, these teams turn questions into reviewed SQL, and reviewed SQL into decisions."
        aside={
          <div className="relative mx-auto aspect-square w-full max-w-[520px]">
            <CityScene className="absolute inset-0" />
          </div>
        }
      >
        <dl className="grid max-w-[520px] grid-cols-3 border-t border-line">
          {FACTS.map(([value, label], i) => (
            <div key={label} className={i > 0 ? "border-l border-line pl-4 pt-4" : "pt-4"}>
              <dd className="text-[28px] font-medium leading-none tracking-[-0.045em] text-ink">{value}</dd>
              <dt className="mt-2 text-[13px] leading-snug text-ink-2">{label}</dt>
            </div>
          ))}
        </dl>
      </PageHero>
      <FeaturedStory />
      <Logos />
      <CaseGrid />
      <Testimonials featured={false} />
      <FinalCta />
    </>
  );
}
