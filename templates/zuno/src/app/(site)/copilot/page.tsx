import type { Metadata } from "next";
import { AnswerAnatomy, ApprovalFeed, CopilotHero } from "@/components/pages/copilot";
import { Copilot } from "@/components/sections/Copilot";
import { FAQ as FAQSection } from "@/components/sections/FAQ";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Block } from "@/components/site/Block";
import { ButtonLink } from "@/components/site/ButtonLink";
import { PageHero } from "@/components/site/PageHero";

export const metadata: Metadata = {
  title: "Copilot",
  description: "Copilot is a financial assistant that reads your real accounts, shows its working and never moves money without your approval.",
};

const FAQ = [
  { q: "Is Copilot just a chatbot?", a: "No. Every answer is built from your actual holdings, transactions and goals, then checked against your plan. If it can't ground an answer in your data it says so instead of guessing." },
  { q: "Can Copilot trade for me?", a: "Only inside rules you've approved, like rebalancing or harvesting losses. Anything new, such as buying a stock you don't own or changing strategy, is proposed and waits for your tap." },
  { q: "Who sees my conversations?", a: "Nobody outside a small, audited support team, and only when you ask for help. Conversations are encrypted, never sold and never used to train models outside Zuno." },
  { q: "Is it financial advice?", a: "Yes. Copilot's recommendations come from Zuno Advisers LLC, an SEC-registered investment adviser, and are held to a fiduciary standard." },
];

export default function CopilotPage() {
  return (
    <main id="main">
      <PageHero
        lead="Ask anything."
        tail="Get a straight answer."
        intro="Copilot reads your real accounts, explains what Autopilot did and why, and helps you plan the big stuff. It shows its working and never moves money without you."
        actions={
          <>
            <ButtonLink href="/signup">Try Copilot</ButtonLink>
            <ButtonLink href="#demo" kind="text">
              Ask it a question
            </ButtonLink>
          </>
        }
        aside={<CopilotHero />}
      />

      <div id="demo" className="scroll-mt-16">
        <Copilot />
      </div>

      <Block lead="Every answer" tail="shows its working." intro="Copilot doesn't just reply. Each answer is built from four things you can check, and it tells you which is which.">
        <AnswerAnatomy />
      </Block>

      <Block lead="Smart enough to help." tail="Designed to ask first.">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <ApprovalFeed />
          </div>
          <div className="space-y-12 lg:col-span-5 lg:pt-6">
            {[
              { t: "It never trades on its own.", b: "Rebalancing and harvesting run on rules you switched on. Anything new waits for your tap. Try approving the Roth deposit." },
              { t: "Humans check the hard ones.", b: "Answers about taxes and large withdrawals are reviewed by licensed advisers before you see them." },
              { t: "Everything is reversible.", b: "Each action is logged with the rule behind it. Undo a proposal within a day and Copilot unwinds it." },
            ].map((x) => (
              <div key={x.t}>
                <h3 className="text-[clamp(1.6rem,2.4vw,2.1rem)] font-semibold leading-[1.1] tracking-[-0.035em]">{x.t}</h3>
                <p className="mt-3 text-[18px] leading-relaxed text-white/70">{x.b}</p>
              </div>
            ))}
          </div>
        </div>
      </Block>

      <FAQSection items={FAQ} lead="Copilot," tail="answered." />

      <FinalCTA />
    </main>
  );
}
