import type { Metadata } from "next";
import { BrandAssets } from "@/components/pages/company";
import { Block } from "@/components/site/Block";
import { PageHero } from "@/components/site/PageHero";

export const metadata: Metadata = {
  title: "Press",
  description: "Zuno news, fast facts and brand assets. Press contact: press@zuno.com.",
};

const NEWS = [
  { date: "October 2, 2026", title: "Copilot 2.0 can now act on rules members approve", text: "Members can let Copilot rebalance, harvest losses and pause buys within limits they set, with every action logged and reversible." },
  { date: "June 18, 2026", title: "Zuno passes 350,000 members and $2 billion on Autopilot", text: "Growth driven by rollovers from old 401(k)s, which tripled year over year." },
  { date: "March 4, 2026", title: "Zuno Cash raises its APY to 4.10% for Plus members", text: "Cash is swept across ten program banks for up to $2.5M in FDIC coverage." },
  { date: "November 12, 2025", title: "How Autopilot handled the 2025 selloff", text: "Losses harvested for 71% of taxable accounts and $96 million of deposits invested on schedule." },
];

const FACTS = [
  { k: "Founded", v: "2021", d: "New York" },
  { k: "Members", v: "380,000", d: "Across all 50 states" },
  { k: "On Autopilot", v: "$2.4B", d: "As of October 2026" },
  { k: "Employees", v: "140", d: "New York, London and remote" },
];

export default function PressPage() {
  const [lead, ...rest] = NEWS;
  return (
    <main id="main">
      <PageHero
        lead="News, facts"
        tail="and brand assets."
        intro={
          <>
            For interviews and inquiries, email{" "}
            <a href="mailto:press@zuno.com" className="text-accent underline underline-offset-4">
              press@zuno.com
            </a>
            . We reply the same business day.
          </>
        }
      />

      <section className="mx-auto max-w-[1280px] px-5 lg:px-8">
        <article className="rounded-[32px] bg-lime p-8 text-on-lime sm:p-12">
          <time className="text-[17px] font-medium opacity-70">{lead.date}</time>
          <h2 className="mt-4 max-w-[900px] text-[clamp(2.2rem,4.6vw,4rem)] font-semibold leading-[1.02] tracking-[-0.045em] text-balance">{lead.title}</h2>
          <p className="mt-6 max-w-[640px] text-[19px] leading-relaxed opacity-80">{lead.text}</p>
        </article>
        <ul className="mt-4 grid gap-4 md:grid-cols-3">
          {rest.map((n) => (
            <li key={n.title} className="flex flex-col rounded-[28px] bg-ink-2 p-8">
              <time className="text-[16px] text-white/60">{n.date}</time>
              <h3 className="mt-3 text-[clamp(1.4rem,2vw,1.75rem)] font-semibold leading-[1.15] tracking-[-0.03em]">{n.title}</h3>
              <p className="mt-3 text-[17px] leading-relaxed text-white/65">{n.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <Block lead="Fast facts," tail="for your story.">
        <dl className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {FACTS.map((f) => (
            <div key={f.k}>
              <dt className="text-[17px] text-white/60">{f.k}</dt>
              <dd className="mt-2 text-[clamp(2.8rem,5vw,4.25rem)] font-semibold leading-none tracking-[-0.05em]">{f.v}</dd>
              <dd className="mt-3 text-[17px] text-white/65">{f.d}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-16 max-w-[760px] text-[18px] leading-relaxed text-white/70">
          Founded by Daniel Reyes and Sarah Lindqvist. Zuno Advisers LLC is an SEC-registered investment adviser, and Zuno Securities LLC is a broker-dealer and member of FINRA and SIPC.
        </p>
      </Block>

      <Block lead="Logos, colors" tail="and type." intro="Download the mark as SVG, or click a color to copy its hex value. Please don't stretch, recolor or animate the logo.">
        <BrandAssets />
      </Block>
    </main>
  );
}
