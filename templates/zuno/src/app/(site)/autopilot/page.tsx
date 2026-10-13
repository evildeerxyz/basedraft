import type { Metadata } from "next";
import { AutopilotDay, AutopilotRing, DriftSimulator, RulesPanel } from "@/components/pages/autopilot";
import { FAQ as FAQSection } from "@/components/sections/FAQ";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Block } from "@/components/site/Block";
import { ButtonLink } from "@/components/site/ButtonLink";
import { PageHero } from "@/components/site/PageHero";

export const metadata: Metadata = {
  title: "Autopilot",
  description: "Autopilot keeps your portfolio on target every day, using deposits first and the smallest trades possible.",
};

const FAQ = [
  {
    q: "How often does Autopilot check my portfolio?",
    a: "Every hour the market is open, plus whenever money moves in or out. It only trades when an asset class drifts past your threshold, so most days it does nothing at all.",
  },
  {
    q: "Will rebalancing create a tax bill?",
    a: "Autopilot tries hard not to. It uses deposits and dividends first, sells lots with losses before lots with gains, and by default never realizes a short-term gain. In taxable accounts most rebalances end up tax-free.",
  },
  {
    q: "Can I pause it?",
    a: "Yes. One switch in the Invest tab pauses all automatic trading. Deposits then wait in cash until you turn it back on.",
  },
  {
    q: "What does it trade?",
    a: "Low-cost index ETFs for each asset class, fractional shares down to $1, and Bitcoin or Ethereum if your plan includes crypto. You can exclude industries you don't want to own.",
  },
];

export default function AutopilotPage() {
  return (
    <main id="main">
      <PageHero
        lead="Your portfolio,"
        tail="kept on target every day."
        intro="Markets push your mix around. Autopilot notices within the hour and places the smallest trades that bring it back, without handing you a tax bill you didn't need."
        actions={
          <>
            <ButtonLink href="/signup">Start investing</ButtonLink>
            <ButtonLink href="#simulator" kind="text">
              Try the drift simulator
            </ButtonLink>
          </>
        }
        aside={<AutopilotRing />}
      />

      <Block lead="A day on Autopilot." tail="Mostly, nothing happens." intro="Rebalancing is simple in theory and tedious in practice. This is what it looks like when software does it for you.">
        <AutopilotDay />
      </Block>

      <Block id="simulator" lead="Move the market." tail="See what Autopilot would do." intro="Drag the sliders to shock a $48,000 Growth portfolio. The trade list updates with what Autopilot would actually place.">
        <DriftSimulator />
      </Block>

      <Block lead="It works for you," tail="on your terms." intro="Every rule below is a real setting in the app. Change one and the summary rewrites itself.">
        <RulesPanel />
      </Block>

      <FAQSection items={FAQ} lead="Autopilot," tail="answered." />

      <FinalCTA />
    </main>
  );
}
