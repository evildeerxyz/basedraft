import type { Metadata } from "next";
import { LayerStack } from "@/components/pages/security";
import { FAQ as FAQSection } from "@/components/sections/FAQ";
import { Security } from "@/components/sections/Security";
import { Block } from "@/components/site/Block";
import { ButtonLink } from "@/components/site/ButtonLink";
import { PageHero } from "@/components/site/PageHero";

export const metadata: Metadata = {
  title: "Security",
  description: "How Zuno protects your money and data: independent custody, SIPC and FDIC coverage, encryption, passkeys and a public bug bounty.",
};

const FAQ = [
  { q: "What happens if Zuno goes out of business?", a: "Your investments are held at an independent custodian in your name. They'd be transferred to another broker, and SIPC protects securities up to $500,000 if anything is missing." },
  { q: "Do you sell my data?", a: "No. We don't sell personal data, we don't take payment for order flow, and we don't share your information with advertisers." },
  { q: "What if someone gets into my account?", a: "New devices must pass Face ID or a passkey plus a code. Withdrawals to new bank accounts are held for 72 hours, and our Security Guarantee covers unauthorized losses when you follow our account security steps." },
  { q: "How do I report a vulnerability?", a: "Email security@zuno.com with details. We respond within one business day and pay rewards under our bug bounty program." },
];

const BOUNTY = [
  { level: "Critical", example: "Move money out of another member's account", reward: "$25,000" },
  { level: "High", example: "Read another member's balances or trades", reward: "$10,000" },
  { level: "Medium", example: "Bypass a security control on your own account", reward: "$2,500" },
  { level: "Low", example: "Minor information disclosure", reward: "$500" },
];

export default function SecurityPage() {
  return (
    <main id="main">
      <PageHero
        lead="Your money,"
        tail="locked down."
        intro="Security at Zuno isn't a feature page. It's how the company is organized: independent custody, layered protection and a team whose only job is to assume we've been breached."
        actions={
          <ButtonLink href="#bounty" kind="text">
            Report a vulnerability
          </ButtonLink>
        }
      />

      <Security />

      <Block lead="Four layers," tail="each assumes the last one failed." intro="Getting to your money means getting through all four. Each one is built as if the others were already gone.">
        <LayerStack />
      </Block>

      <Block
        id="bounty"
        lead="Find a hole,"
        tail="get paid for it."
        side
        intro={
          <>
            Report vulnerabilities to{" "}
            <a className="text-accent underline underline-offset-4" href="mailto:security@zuno.com">
              security@zuno.com
            </a>
            . We reply within one business day and never pursue good-faith researchers.
          </>
        }
      >
        <ul className="space-y-3">
          {BOUNTY.map((b) => (
            <li key={b.level} className="grid items-center gap-3 rounded-[24px] bg-ink-2 px-6 py-6 sm:grid-cols-[150px_1fr_auto] sm:gap-8 sm:px-8 sm:py-7">
              <span className="text-[17px] font-medium text-white/60">{b.level}</span>
              <span className="text-[19px] leading-snug sm:text-[21px]">{b.example}</span>
              <span className="text-[clamp(2rem,3.4vw,2.9rem)] font-semibold leading-none tracking-[-0.045em] sm:text-right">
                <span className="mr-2 align-middle text-[16px] font-normal tracking-normal text-white/55">up to</span>
                {b.reward}
              </span>
            </li>
          ))}
        </ul>
      </Block>

      <FAQSection items={FAQ} lead="Security," tail="answered." />
    </main>
  );
}
