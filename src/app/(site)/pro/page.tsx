import { ArrowsClockwiseIcon, CreditCardIcon, DownloadSimpleIcon, ShieldCheckIcon, SignInIcon } from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";
import type { Metadata } from "next";
import { CompareTable, FaqSheet, PricingSheet } from "@/site/blocks";
import { DeliveryCards } from "@/site/exits";
import { SECTIONS, TEMPLATES } from "@/site/live";
import { ProCalculators } from "@/site/pro-calc";
import { ProPreviewToggle } from "@/site/pro-toggle";
import { ProWorth } from "@/site/pro-worth";
import { wrap } from "@/site/sheet";
import { SectionHeading } from "@/site/showcase";
import { cn } from "@/lib/utils";
import { withCard } from "@/site/og";

export const metadata: Metadata = withCard("pro", { title: "basedraft Pro", description: "Every template and all their sections, copy to Figma and Paper, the code in Next.js or Astro downloaded or sent to GitHub, and every future update, for one payment." });

/*
 * Pricing, top to bottom: the plans, what Pro pays for, a way to work out your own price (one
 * template or all of them, one person or a team), every plan side by side, how a purchase
 * arrives, and the questions people ask. Every figure is worked out from the catalog, never typed.
 */

const COLUMN = "mx-auto w-full max-w-[1120px]";

/* The three promises under the title, each with its icon. */
const PROMISES: Array<[Icon, string]> = [
  [CreditCardIcon, "One payment"],
  [ArrowsClockwiseIcon, "Every update after it"],
  [ShieldCheckIcon, "Full refund within 14 days"],
];

/* How a purchase arrives, in three steps. */
const STEPS: Array<[Icon, string, string]> = [
  [SignInIcon, "Sign in with the email you buy with", "That's how your purchases find you. Bought before signing up? They're waiting when you do."],
  [DownloadSimpleIcon, "Take it whichever way suits you", "Download it again, or send it to a new repository, as often as you like."],
  [ArrowsClockwiseIcon, "Updates land on your Purchases page", "When a template improves, the new version is there to download or send to GitHub."],
];

export default function ProPage() {
  return (
    <main id="main" className={cn(wrap, "pb-24")}>
      <header className="bd-reveal mx-auto flex max-w-[760px] flex-col items-center pb-14 pt-20 text-center sm:pt-24">
        <h1 className="text-balance text-display">Everything in basedraft, paid for once</h1>
        <p className="mt-5 max-w-[560px] text-pretty text-lead text-muted">
          Studio is free, with every template to try. Pro adds all {TEMPLATES.length} templates and their {SECTIONS.length} sections, the code and the Figma copy, for good.
        </p>
        <ul className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-ui text-muted">
          {PROMISES.map(([I, t], i) => (
            <li key={t} className={cn("flex items-center gap-2", i > 1 && "max-sm:hidden")}>
              <I weight="duotone" size={16} className="text-brand-ink" />
              {t}
            </li>
          ))}
        </ul>
      </header>

      <PricingSheet id="buy" />
      <div className={cn(COLUMN, "mt-3 empty:hidden")}>
        <ProPreviewToggle />
      </div>

      <section className={cn(COLUMN, "mt-28 scroll-mt-28 md:mt-36")} id="worth" aria-labelledby="worth-title">
        <SectionHeading id="worth-title" title="What you're paying for" lead="Everything in Pro, and only what's really in it. One payment covers all of it, and everything that's added after." />
        <ProWorth />
      </section>

      <section className={cn(COLUMN, "mt-28 scroll-mt-28 md:mt-36")} id="team" aria-labelledby="calc-title">
        <SectionHeading id="calc-title" title="Work out what you'd pay" lead="One template or all of them, just you or your whole team. Every figure here comes from today's prices." />
        <ProCalculators />
      </section>

      <section className={cn(COLUMN, "mt-28 md:mt-36")} aria-labelledby="compare-title">
        <SectionHeading small id="compare-title" title="Compare plans" lead="What each plan lets you use, and where. Every paid plan has the same library." />
        <CompareTable id="license" />
      </section>

      <section className={cn(COLUMN, "mt-28 scroll-mt-28 md:mt-36")} id="delivery" aria-labelledby="delivery-title">
        <SectionHeading small id="delivery-title" title="How you get your template" lead="Pay on Whop with a card, Apple Pay or Google Pay. The moment it goes through, we email you from hello@basedraft.site with two ways to take it, and both stay on your Purchases page." />
        <DeliveryCards />
        <ol className="bd-reveal mt-6 grid gap-4 md:grid-cols-3">
          {STEPS.map(([I, t, b]) => (
            <li key={t} className="rounded-[24px] border border-line bg-surface p-6">
              <span className="grid size-10 place-items-center rounded-[12px] bg-brand-soft text-brand-ink">
                <I weight="duotone" size={20} />
              </span>
              <h3 className="mt-5 text-[16px] font-medium leading-[1.3]">{t}</h3>
              <p className="mt-2 text-ui leading-[1.6] text-muted">{b}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className={COLUMN}>
        <FaqSheet
          id="faq"
          title="Questions"
          aside={
            <p className="text-ui text-muted">
              Something else?{" "}
              <a href="mailto:hello@basedraft.site" className="text-fg underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-fg">
                Write to us
              </a>
              .
            </p>
          }
        />
      </div>
    </main>
  );
}
