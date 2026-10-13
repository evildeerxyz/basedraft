import type { Metadata } from "next";
import { HarvestCalculator, HarvestChart, HarvestSteps } from "@/components/pages/tax";
import { FAQ as FAQSection } from "@/components/sections/FAQ";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Block } from "@/components/site/Block";
import { ButtonLink } from "@/components/site/ButtonLink";
import { DataTable } from "@/components/site/DataTable";
import { PageHero } from "@/components/site/PageHero";

export const metadata: Metadata = {
  title: "Tax-loss harvesting",
  description: "Zuno checks every lot daily, sells losers to offset your gains and swaps into similar funds so you stay invested.",
};

const FAQ = [
  { q: "What is a wash sale?", a: "If you buy back the same or a substantially identical security within 30 days of selling it at a loss, the IRS disallows the loss. Zuno swaps into a similar but different fund and tracks the 61-day window across all your Zuno accounts." },
  { q: "Does harvesting eliminate taxes?", a: "Often it defers them. The replacement fund has a lower cost basis, so you may owe more when you eventually sell. The value comes from investing the tax you saved today, and from paying a lower rate later if you're in a lower bracket in retirement." },
  { q: "Which accounts does it run in?", a: "Taxable accounts only. Losses in IRAs can't be deducted, so harvesting is switched off there automatically." },
  { q: "Can I turn it off?", a: "Yes, per account, in Settings. You can also exclude specific holdings." },
];

export default function TaxPage() {
  return (
    <main id="main">
      <PageHero
        lead="Losses happen."
        tail="Zuno makes them useful."
        intro="When a holding falls below what you paid, Zuno sells it, books the loss to offset your gains, and buys a similar fund the same day so you never sit out of the market."
        actions={
          <>
            <ButtonLink href="/signup">Start harvesting</ButtonLink>
            <ButtonLink href="#calculator" kind="text">
              Estimate your savings
            </ButtonLink>
          </>
        }
        aside={<HarvestChart />}
      />

      <Block lead="One dip," tail="followed lot by lot." intro="Here's what happens to a typical VTI position when the market slips 8% in a week.">
        <HarvestSteps />
      </Block>

      <Block id="calculator" lead="What could it save" tail="you this year?" intro="A hypothetical estimate based on your portfolio size and tax bracket.">
        <HarvestCalculator />
      </Block>

      <Block lead="Similar enough to stay invested." tail="Different enough for the IRS.">
        <DataTable
          caption="Fund swap pairs"
          columns={["If you hold", "Zuno swaps into", "Both track", "Expense ratios"]}
          rows={[
            ["VTI", "ITOT", "Total US market", "0.03% and 0.03%"],
            ["VXUS", "IXUS", "Total international", "0.05% and 0.07%"],
            ["QQQ", "QQQM", "Nasdaq-100", "0.20% and 0.15%"],
            ["VOO", "IVV", "S&P 500", "0.03% and 0.03%"],
            ["BND", "AGG", "US investment-grade bonds", "0.03% and 0.03%"],
          ]}
        />
      </Block>

      <FAQSection
        items={FAQ}
        lead="Taxes,"
        tail="answered."
        note="Zuno does not provide tax advice. Tax-loss harvesting results vary and are not guaranteed. Consult a tax professional about your situation."
      />

      <FinalCTA />
    </main>
  );
}
