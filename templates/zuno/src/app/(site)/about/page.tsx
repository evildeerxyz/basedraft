import type { Metadata } from "next";
import { DitherAvatar } from "@/components/dither/DitherAvatar";
import { Timeline } from "@/components/pages/about";
import { Block } from "@/components/site/Block";
import { Statements } from "@/components/site/Statements";
import { ButtonLink } from "@/components/site/ButtonLink";
import { PageHero } from "@/components/site/PageHero";

export const metadata: Metadata = {
  title: "About",
  description: "Zuno was founded in 2021 to give everyone the kind of financial help that used to cost 1% of everything you own.",
};

const TEAM = [
  { name: "Daniel Reyes", role: "Co-founder, CEO", seed: 3, tone: "lime" as const },
  { name: "Sarah Lindqvist", role: "Co-founder, Head of Investing", seed: 12, tone: "paper" as const },
  { name: "Tomás Ortega", role: "Head of Engineering", seed: 21, tone: "ink" as const },
  { name: "Kenji Mori", role: "Head of AI", seed: 44, tone: "paper" as const },
  { name: "Emily Chen", role: "Design Lead", seed: 58, tone: "lime" as const },
  { name: "Rachel Adler", role: "General Counsel", seed: 63, tone: "ink" as const },
  { name: "Lucas Weber", role: "Portfolio Strategy", seed: 31, tone: "lime" as const },
  { name: "Grace Whitfield", role: "Head of Member Support", seed: 77, tone: "paper" as const },
];

export default function AboutPage() {
  return (
    <main id="main">
      <PageHero
        lead="We built the adviser"
        tail="we couldn't afford."
        intro="In 2021 a good financial adviser cost about 1% of everything you owned, every year. We thought software could do most of that job better, for everyone, for the price of a streaming subscription."
      >
        <dl className="mt-20 grid grid-cols-2 gap-x-8 gap-y-12 lg:mt-28 lg:grid-cols-4">
          {[
            { k: "Members", v: "380K" },
            { k: "On Autopilot", v: "$2.4B" },
            { k: "People at Zuno", v: "140" },
            { k: "Average check-ins", v: "2 a month" },
          ].map((x) => (
            <div key={x.k}>
              <dt className="text-[17px] text-white/60">{x.k}</dt>
              <dd className="mt-2 text-[clamp(2.6rem,5vw,4.25rem)] font-semibold leading-none tracking-[-0.05em]">{x.v}</dd>
            </div>
          ))}
        </dl>
      </PageHero>

      <Block>
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          <p className="text-[clamp(2rem,3.6vw,3.25rem)] font-semibold leading-[1.06] tracking-[-0.04em] text-balance lg:col-span-6">
            Most of what wealthy families pay for is <span className="text-accent">discipline.</span>
          </p>
          <div className="zn-prose max-w-[600px] text-[19px] lg:col-span-5 lg:col-start-8">
            <p>
              Daniel was a software engineer who kept his savings in cash because investing felt like a full-time job. Sarah spent a decade building portfolios for wealthy families and
              knew what they really paid for: rebalancing, harvesting losses, and someone to talk them out of panic.
            </p>
            <p>
              None of that needs a person in an office. It needs patience, good rules and software that never gets tired. So they built a portfolio that rebalanced itself, then a way to
              explain every move in plain English, then a cash account that pays a fair rate.
            </p>
            <p>The average member checks the app twice a month. We take that as a compliment.</p>
          </div>
        </div>
      </Block>

      <Block lead="Four beliefs" tail="we won't trade away.">
        <Statements
          items={[
            { title: "Fees compound too.", body: "A flat price, never a percentage of your money. When your balance grows, our cut doesn't." },
            { title: "Boring is a feature.", body: "No confetti, no streaks, no reasons to trade. Calm investors end up with more." },
            { title: "Show the working.", body: "Every trade, every answer and every fee comes with a plain-English reason you can check." },
            { title: "Your money, your name.", body: "Assets sit at an independent custodian. We never lend them, and we never sell your data." },
          ]}
        />
      </Block>

      <Block lead="Five years," tail="one idea.">
        <Timeline />
      </Block>

      <Block lead="The people" tail="behind Zuno.">
        <ul className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((p) => (
            <li key={p.name}>
              <DitherAvatar seed={p.seed} name={p.name} tone={p.tone} size={96} />
              <div className="mt-5 text-[21px] font-semibold tracking-[-0.02em]">{p.name}</div>
              <div className="mt-1 text-[17px] text-white/60">{p.role}</div>
            </li>
          ))}
        </ul>
      </Block>

      <Block lead="Two offices." tail="One team.">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { city: "New York", tag: "Headquarters", lines: ["225 Varick Street, 6th floor", "New York, NY 10014"] },
            { city: "London", tag: "Engineering and design", lines: ["12 Hatton Garden", "London EC1N 8AN"] },
          ].map((o) => (
            <div key={o.city} className="rounded-[28px] bg-ink-2 p-8 sm:p-10">
              <div className="text-[17px] font-medium text-accent">{o.tag}</div>
              <div className="mt-3 text-[clamp(2.2rem,4vw,3.25rem)] font-semibold leading-none tracking-[-0.045em]">{o.city}</div>
              <address className="mt-5 not-italic text-[18px] leading-relaxed text-white/70">
                {o.lines.map((l) => (
                  <div key={l}>{l}</div>
                ))}
              </address>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-wrap items-center gap-7">
          <ButtonLink href="/careers">See open roles</ButtonLink>
          <ButtonLink href="/press" kind="text">
            Press and brand assets
          </ButtonLink>
        </div>
      </Block>
    </main>
  );
}
