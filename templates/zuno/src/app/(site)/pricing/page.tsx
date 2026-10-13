import type { Metadata } from "next";
import { CheckIcon, MinusIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { FAQ as FAQSection } from "@/components/sections/FAQ";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { PricingPlans } from "@/components/sections/Pricing";
import { Block } from "@/components/site/Block";
import { DataTable } from "@/components/site/DataTable";
import { PageHero } from "@/components/site/PageHero";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Basic is free. Plus is $6 a month billed yearly. Private is $24. No commissions, no minimums, no percentage of your assets.",
};

const Y = () => <CheckIcon size={16} weight="bold" className="ml-auto text-accent" aria-label="Included" />;
const N = () => <MinusIcon size={16} className="ml-auto text-white/40" aria-label="Not included" />;

const FAQ = [
  { q: "Why a flat fee instead of a percentage?", a: "A 0.25% fee on $200,000 is $500 a year and grows as you do. Plus costs $72 a year whether you have $2,000 or $2,000,000. We think you should keep the upside." },
  { q: "Is there a free trial?", a: "Plus comes with 30 days free. You won't be charged until the trial ends, and we'll remind you three days before." },
  { q: "Can I switch plans?", a: "Any time, from Account in the app. Upgrades apply immediately; downgrades apply at the end of your billing period and the difference is prorated." },
  { q: "Are there any other fees?", a: "Fund expense ratios (average 0.06%) are charged by the funds themselves, and crypto trades carry a 0.5% spread. Everything else is on our fees page." },
];

export default function PricingPage() {
  return (
    <main id="main">
      <PageHero
        lead="Simple pricing."
        tail="No surprises."
        intro="No commissions, no account minimums, no payment for order flow, and never a percentage of your money. Pick a plan, change it whenever you like."
      />

      <section className="mx-auto max-w-[1280px] px-5 lg:px-8">
        <PricingPlans />
      </section>

      <Block lead="Everything," tail="side by side.">
        <DataTable
          caption="Plan comparison"
          highlight={2}
          columns={["", "Basic", "Plus", "Private"]}
          rows={[
            ["Fractional shares from $1", <Y key="a" />, <Y key="b" />, <Y key="c" />],
            ["Recurring deposits and round-ups", <Y key="a" />, <Y key="b" />, <Y key="c" />],
            ["Cash APY", "3.60%", "4.10%", "4.10%"],
            ["Copilot", "Weekly insights", "Unlimited", "Unlimited"],
            ["Autopilot rebalancing", <N key="a" />, <Y key="b" />, <Y key="c" />],
            ["Daily tax-loss harvesting", <N key="a" />, <Y key="b" />, <Y key="c" />],
            ["Risk radar and stress tests", <N key="a" />, <Y key="b" />, <Y key="c" />],
            ["IRAs and free rollovers", <Y key="a" />, <Y key="b" />, <Y key="c" />],
            ["Direct indexing", <N key="a" />, <N key="b" />, <Y key="c" />],
            ["Dedicated CFP® professional", <N key="a" />, <N key="b" />, <Y key="c" />],
            ["Support", "In-app chat", "24/7 chat", "Priority, phone"],
          ]}
        />
        <p className="mt-7 text-[17px] text-white/65">
          Every other cost is listed on the{" "}
          <Link href="/fees" className="text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">
            fees page
          </Link>
          .
        </p>
      </Block>

      <FAQSection items={FAQ} lead="Pricing," tail="answered." />

      <FinalCTA />
    </main>
  );
}
