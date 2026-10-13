import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { FUNDING, INVESTORS } from "@/lib/content";
import { FundingScene } from "@/components/gl/lazy";
import { Portrait } from "@/components/site/portrait";
import { Kicker, Section, buttonClass } from "@/components/site/ui";

export const metadata: Metadata = {
  title: `Noma raises ${FUNDING.amount} ${FUNDING.round}`,
  description: `Our ${FUNDING.round} was led by ${FUNDING.lead}, bringing total funding to ${FUNDING.total}.`,
  alternates: { canonical: "/blog/series-b" },
  openGraph: { type: "article", url: "/blog/series-b" },
};

export default function SeriesBPage() {
  return (
    <>
      <Section border={false} inner="pb-16 pt-10">
        <div className="flex items-center justify-between gap-6 border-b border-line pb-4">
          <Link href="/company" className="group inline-flex items-center gap-2 text-[14px] text-ink-3 hover:text-ink">
            <ArrowLeftIcon size={12} weight="bold" className="transition-transform group-hover:-translate-x-1" />
            Company
          </Link>
          <span className="text-[14px] text-ink-3">{FUNDING.date} · 4 min read</span>
        </div>
        <div className="mt-10 flex flex-col gap-6">
          <Kicker>Announcement</Kicker>
          <h1 className="max-w-[1000px] text-balance text-[44px] font-medium leading-[0.98] tracking-[-0.055em] text-ink md:text-[76px]">We raised {FUNDING.amount} to give every database a voice.</h1>
          <div className="grid gap-8 border-t border-line pt-6 lg:grid-cols-12">
            <p className="text-[19px] leading-relaxed text-ink-2 lg:col-span-7">
              Our {FUNDING.round} was led by {FUNDING.lead}, bringing total funding to {FUNDING.total}. Every dollar goes toward one goal: making Noma the default way teams talk to their data.
            </p>
            <div className="flex items-center gap-3 lg:col-span-4 lg:col-start-9 lg:justify-end">
              <Portrait name="James Carter" cell={1} className="size-12 shrink-0" />
              <span className="text-[14px]">
                <span className="block font-medium text-ink">James Carter</span>
                <span className="block text-ink-3">Co-founder, CEO</span>
              </span>
            </div>
          </div>
        </div>
      </Section>

      <Section inner="py-16">
        <div className="relative border-y border-line py-6">
          <div className="relative mx-auto aspect-[16/10] w-full max-w-[760px]">
            <FundingScene rounds={FUNDING.rounds} className="absolute inset-0" />
          </div>
          <p className="mt-2 text-center font-mono text-[11.5px] text-ink-3">
            <span className="text-ink">Fig. 1</span> {FUNDING.total} raised across four rounds
          </p>
        </div>
      </Section>

      <Section inner="grid gap-12 py-20 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <div className="lg:sticky lg:top-24">
            <Kicker>In this post</Kicker>
            <ol className="mt-5 grid gap-2.5 text-[14px] text-ink-2">
              <li>01 · Why approval matters</li>
              <li>02 · What&apos;s next</li>
              <li>03 · Thank you</li>
            </ol>
          </div>
        </aside>
        <article className="grid gap-6 text-[17.5px] leading-[1.75] text-ink-2 lg:col-span-8 lg:col-start-5 [&_h2]:mt-8 [&_h2]:text-[28px] [&_h2]:font-semibold [&_h2]:tracking-[-0.035em] [&_h2]:text-ink">
          <p>
            Three years ago, getting an answer out of a database meant filing a ticket and waiting. Today 2,400 teams ask Noma instead. That&apos;s 4.2 million questions a month, every one turned into
            SQL a person can read before it runs.
          </p>
          <h2>Why approval matters</h2>
          <p>
            We never wanted an AI that quietly changes your data. Noma drafts, people decide. Reads run instantly, and anything that writes waits at a review gate. That one principle is why security
            teams say yes to Noma.
          </p>
          <blockquote className="my-6 border-l-2 border-accent pl-6 text-[26px] font-medium leading-snug tracking-[-0.03em] text-ink">
            “Noma is the rare AI product that gets more careful as it gets more capable.”
            <footer className="mt-4 text-[14px] font-normal text-ink-3">Partner, {FUNDING.lead}</footer>
          </blockquote>
          <h2>What&apos;s next</h2>
          <p>
            We&apos;re doubling the team, shipping MySQL and Snowflake support, and opening a self-hosted edition for regulated industries. We&apos;re hiring across engineering, design and
            go-to-market.
          </p>
          <h2>Thank you</h2>
          <p>To our customers, our team and our investors:</p>
          <ul className="grid border-l border-t border-line sm:grid-cols-2">
            {INVESTORS.map((investor) => (
              <li key={investor.name} className="border-b border-r border-line bg-surface px-5 py-4 text-[14px]">
                <span className="block font-medium text-ink">{investor.name}</span>
                <span className="block text-[13px] text-ink-3">{investor.role}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/company#careers" className={buttonClass("accent", "lg")}>
              Join the team
            </Link>
            <Link href="/contact" className={buttonClass("secondary", "lg")}>
              Book a demo
            </Link>
          </div>
        </article>
      </Section>
    </>
  );
}
