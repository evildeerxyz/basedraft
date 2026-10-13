import type { Metadata } from "next";
import { IraPicker, RetirementHero, RolloverTracker } from "@/components/pages/retirement";
import { FAQ as FAQSection } from "@/components/sections/FAQ";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Simulator } from "@/components/sections/Simulator";
import { Block } from "@/components/site/Block";
import { ButtonLink } from "@/components/site/ButtonLink";
import { PageHero } from "@/components/site/PageHero";

export const metadata: Metadata = {
  title: "Retirement",
  description: "Traditional, Roth and SEP IRAs on Autopilot, with free rollovers from old 401(k)s.",
};

const FAQ = [
  { q: "Which IRA should I pick?", a: "If you expect a higher tax rate in retirement than today, a Roth usually wins. If you want the deduction now, choose Traditional. Copilot can model both with your numbers in about a minute." },
  { q: "What are the 2026 contribution limits?", a: "$7,500 across all your IRAs, or $8,600 if you're 50 or older. SEP IRAs allow up to 25% of self-employment compensation, capped at $72,000." },
  { q: "How long does a rollover take?", a: "Usually one to two weeks, depending on your old provider. You'll see each step in the app, and we'll chase them so you don't have to." },
  { q: "Does tax-loss harvesting run in IRAs?", a: "No. Gains and losses inside an IRA aren't taxed, so there's nothing to harvest. Autopilot still rebalances." },
];

export default function RetirementPage() {
  return (
    <main id="main">
      <PageHero
        lead="Retirement accounts,"
        tail="on Autopilot."
        intro="Open a Traditional, Roth or SEP IRA in minutes, roll over old 401(k)s for free, and let Autopilot keep everything on track until the day you need it."
        actions={
          <>
            <ButtonLink href="/signup">Open an IRA</ButtonLink>
            <ButtonLink href="#rollover" kind="text">
              Roll over a 401(k)
            </ButtonLink>
          </>
        }
        aside={<RetirementHero />}
      />

      <Block lead="Pick the account," tail="we'll handle the rest." intro="Two questions get most people to the right IRA. The table shows the trade-offs either way.">
        <IraPicker />
      </Block>

      <Simulator />

      <Block id="rollover" lead="Bring your old 401(k)." tail="We cover the fees." intro="A rollover usually means forms, hold music and a check in the mail. Here's what it looks like with Zuno.">
        <RolloverTracker />
      </Block>

      <FAQSection items={FAQ} lead="Retirement," tail="answered." />

      <FinalCTA />
    </main>
  );
}
