"use client";

import { StarIcon } from "@phosphor-icons/react";
import { DitherAvatar } from "../dither/DitherAvatar";
import { Counter } from "../ui/Counter";
import { SectionTitle } from "../ui/Section";
import { VelocityMarquee } from "../ui/VelocityMarquee";

const STATS = [
  { to: 2.4, decimals: 1, prefix: "$", suffix: "B+", label: "invested on autopilot" },
  { to: 380, decimals: 0, prefix: "", suffix: "K", label: "people investing with Zuno" },
  { to: 4.9, decimals: 1, prefix: "", suffix: "", label: "App Store rating", stars: true },
  { to: 31, decimals: 0, prefix: "", suffix: "M", label: "hours of worry saved*" },
];

const QUOTES = [
  { q: "I used to check my brokerage app twenty times a day. Now I check Zuno on Sundays and it tells me exactly what happened and why.", n: "Priya Raman", r: "Product designer", s: "+18.4% since 2024", seed: 21 },
  { q: "The tax-loss harvesting paid for the subscription about forty times over last year. I didn't lift a finger.", n: "Marcus Bell", r: "ER physician", s: "$3,120 harvested", seed: 33 },
  { q: "Copilot talked me out of panic-selling in April. That one conversation is probably worth more than every fee I'll ever pay.", n: "Sofia Alvarez", r: "Teacher", s: "Stayed invested", seed: 47 },
  { q: "Finally an investing app that explains itself like a smart friend instead of a sales desk.", n: "Daniel Kim", r: "Startup founder", s: "+22.1% since 2023", seed: 52 },
  { q: "I set up round-ups as a joke. Eighteen months later it's a real emergency fund.", n: "Hannah Brooks", r: "Nurse", s: "$4,860 from spare change", seed: 64 },
  { q: "Moved my old 401(k) in an afternoon. The rebalancing alone is better than what my last adviser did.", n: "Tom Fischer", r: "Civil engineer", s: "Fees cut by 74%", seed: 71 },
  { q: "It's the first money app my partner and I both actually open. The weekly recap is genuinely delightful.", n: "Leah Goldberg", r: "Journalist", s: "Joint goal on track", seed: 88 },
  { q: "Clean, fast, zero dark patterns. You can tell the team respects their users.", n: "Kenji Watanabe", r: "Software engineer", s: "+15.7% since 2024", seed: 93 },
];

function QuoteCard({ q, n, r, s, seed, i }: (typeof QUOTES)[number] & { i: number }) {
  return (
    <figure className="mx-2 flex w-[340px] shrink-0 flex-col whitespace-normal rounded-[16px] border border-white/[0.08] bg-ink-2 p-6 sm:w-[400px]">
      <blockquote className="flex-1 text-[17px] leading-relaxed tracking-[-0.01em] text-white/85">“{q}”</blockquote>
      <figcaption className="mt-8 flex items-center gap-3">
        <DitherAvatar seed={seed} name={n} size={38} tone={i % 3 === 0 ? "lime" : i % 3 === 1 ? "paper" : "ink"} />
        <div className="flex-1 leading-tight">
          <div className="text-[16px] font-medium">{n}</div>
          <div className="text-[15px] text-white/60">{r}</div>
        </div>
        <span className="text-[15px] tabular-nums text-accent">{s}</span>
      </figcaption>
    </figure>
  );
}

export function Testimonials() {
  return (
    <section id="stories" className="relative overflow-hidden py-32">
      <div className="mx-auto max-w-[1280px] px-5 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="flex items-center gap-2 text-[clamp(2.6rem,4.5vw,3.8rem)] font-semibold leading-none tracking-[-0.05em]">
                <Counter to={s.to} decimals={s.decimals} prefix={s.prefix} suffix={s.suffix} />
                {s.stars && <StarIcon size={26} weight="fill" className="text-accent" />}
              </div>
              <div className="mt-3 text-[16px] text-white/60">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-24">
          <SectionTitle className="max-w-[900px]" lead="Loved by people who’d rather" tail="not think about money." />
        </div>
      </div>

      <div className="relative mt-14 space-y-4">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-ink to-transparent sm:w-40" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-ink to-transparent sm:w-40" />
        <VelocityMarquee baseVelocity={-1.2} skew={false}>
          {QUOTES.slice(0, 4).concat(QUOTES.slice(0, 4)).map((t, i) => (
            <QuoteCard key={i} {...t} i={i} />
          ))}
        </VelocityMarquee>
        <VelocityMarquee baseVelocity={1.2} skew={false}>
          {QUOTES.slice(4).concat(QUOTES.slice(4)).map((t, i) => (
            <QuoteCard key={i} {...t} i={i + 2} />
          ))}
        </VelocityMarquee>
      </div>
      <p className="mx-auto mt-8 max-w-[1280px] px-5 text-[15px] text-white/60 lg:px-8">
        Testimonials from Zuno members, who may not be representative of all members. Not a guarantee of future performance or success.
      </p>
    </section>
  );
}
