import type { Metadata } from "next";
import { CashHero, CashMoments, InterestCalculator, SweepVisual } from "@/components/pages/cash";
import { FAQ as FAQSection } from "@/components/sections/FAQ";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Block } from "@/components/site/Block";
import { ButtonLink } from "@/components/site/ButtonLink";
import { PageHero } from "@/components/site/PageHero";

export const metadata: Metadata = {
  title: "Cash",
  description: "Earn 4.10% APY on cash with no fees or minimums, FDIC-insured up to $2.5M through program banks.",
};

const FAQ = [
  { q: "How is my cash protected?", a: "Your cash is swept to a network of program banks, where it's eligible for FDIC insurance up to $2.5M, $250,000 per bank. FDIC insurance covers the failure of a program bank, not losses on investments." },
  { q: "Are there fees or minimums?", a: "No monthly fees, no minimum balance and no limit on transfers. The APY is the same whether you have $10 or $500,000." },
  { q: "How fast can I withdraw?", a: "Withdrawals requested before 2 PM ET on a business day usually arrive at your bank the same day. Later requests arrive the next business day." },
  { q: "Why does the rate change?", a: "Like any savings rate it follows the Federal Reserve. When the Fed moves, we update the APY within one business day and tell you in the app." },
];

export default function CashPage() {
  return (
    <main id="main">
      <PageHero
        lead="Cash that earns."
        tail="4.10% APY, no catches."
        intro="Park money between investments, save for something big, or keep an emergency fund. It earns interest from day one and moves when you need it."
        actions={
          <>
            <ButtonLink href="/signup">Open a cash account</ButtonLink>
            <ButtonLink href="#compare" kind="text">
              Compare your bank
            </ButtonLink>
          </>
        }
        aside={<CashHero />}
      />

      <Block id="compare" lead="Same money." tail="Very different results.">
        <InterestCalculator />
      </Block>

      <Block
        lead="Insured up to $2.5M,"
        tail="spread across ten banks."
        intro="FDIC insurance covers $250,000 per bank. Each night Zuno spreads your balance across program banks so no single bank holds more than the limit. Drag to see it."
      >
        <SweepVisual />
      </Block>

      <Block lead="A savings account" tail="that talks to your investments.">
        <CashMoments />
      </Block>

      <FAQSection items={FAQ} lead="Cash," tail="answered." />

      <FinalCTA />
    </main>
  );
}
