"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { CASE_STUDIES, INDUSTRIES, TESTIMONIALS } from "@/lib/content";
import { Portrait } from "@/components/site/portrait";
import { Section, SectionHeading } from "@/components/site/ui";

const FEATURED_STATS = [
  ["78%", "smaller analytics backlog"],
  ["40", "people answering their own questions"],
  ["3 min", "median time to an answer"],
  ["0", "unreviewed writes to production"],
];

export function FeaturedStory() {
  const quote = TESTIMONIALS[0];
  return (
    <Section inner="py-20">
      <article className="grid border border-line bg-surface md:grid-cols-[minmax(0,320px)_1fr] lg:grid-cols-[minmax(0,380px)_1fr_minmax(0,260px)]">
        <Portrait name={quote.name} className="aspect-square md:aspect-auto md:min-h-[320px]" />
        <div className="flex flex-col justify-between gap-10 border-line p-7 max-md:border-t md:border-l md:p-10">
          <span className="text-[13px] text-ink-3">Featured story · {quote.company}, fintech</span>
          <blockquote className="text-balance text-[24px] font-medium leading-[1.25] tracking-[-0.03em] text-ink md:text-[30px]">&ldquo;{quote.quote}&rdquo;</blockquote>
          <p className="text-[14px]">
            <span className="font-medium text-ink">{quote.name}</span>
            <span className="text-ink-2">
              {" "}
              · {quote.role}, {quote.company}
            </span>
          </p>
        </div>
        <dl className="grid grid-cols-2 border-t border-line md:col-span-2 md:grid-cols-4 lg:col-span-1 lg:grid-cols-1 lg:border-l lg:border-t-0">
          {FEATURED_STATS.map(([value, label], i) => (
            <div key={label} className={cn("flex flex-col justify-end gap-1 border-line p-5", i > 0 && "max-lg:border-l lg:border-t", i === 2 && "max-md:border-l-0 max-md:border-t")}>
              <dd className="text-[30px] font-medium leading-none tracking-[-0.045em] text-ink">{value}</dd>
              <dt className="text-[13px] leading-snug text-ink-2">{label}</dt>
            </div>
          ))}
        </dl>
      </article>
    </Section>
  );
}

export function CaseGrid() {
  const [industry, setIndustry] = useState<(typeof INDUSTRIES)[number]>("All");
  const cases = CASE_STUDIES.filter((study) => industry === "All" || study.industry === industry);

  return (
    <Section inner="py-24">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading title={<>Results, in their own numbers.</>} />
        <div role="tablist" aria-label="Industry" className="flex flex-wrap gap-1 border border-line bg-surface p-1">
          {INDUSTRIES.map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={industry === option}
              onClick={() => setIndustry(option)}
              className={cn("relative isolate h-8  px-4 text-[13px] transition-colors", industry === option ? "text-inverse-fg" : "text-ink-2 hover:text-ink")}
            >
              {industry === option && <motion.span layoutId="industry" className="absolute inset-0 -z-10 bg-inverse" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
              {option}
            </button>
          ))}
        </div>
      </div>

      <motion.ul layout className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {cases.map((study) => (
            <motion.li
              key={study.company}
              layout
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              className="flex flex-col justify-between gap-10 border border-line bg-surface p-6"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.03em] text-ink">
                  <span className="size-3" style={{ background: study.color }} />
                  {study.company}
                </span>
                <span className="border border-line px-2 py-0.5 font-mono text-[10px] text-ink-3">{study.industry}</span>
              </div>
              <div>
                <span className="block text-[48px] font-semibold leading-none tracking-[-0.05em] text-ink">{study.metric}</span>
                <span className="mt-1 block text-[13px] text-ink-2">{study.metricLabel}</span>
                <p className="mt-5 text-[14px] leading-relaxed text-ink-2">{study.summary}</p>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </Section>
  );
}
