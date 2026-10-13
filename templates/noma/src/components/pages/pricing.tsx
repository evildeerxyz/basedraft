"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircleIcon, CheckIcon, MinusIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import { PlansScene } from "@/components/gl/lazy";
import { APP_URL, COMPARISON, FAQS, PLANS } from "@/lib/content";
import { buttonClass, Container, Index, Section, SectionHeading } from "@/components/site/ui";

function Price({ value }: { value: number | null }) {
  if (value === null) return <span className="text-[44px] font-semibold leading-none tracking-[-0.05em] text-ink">Custom</span>;
  return (
    <span className="flex items-start text-ink">
      <span className="mt-2 text-[20px] font-medium">$</span>
      <span className="relative inline-grid overflow-hidden text-[52px] font-semibold leading-none tracking-[-0.05em]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={value} initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "-100%", opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 28 }}>
            {value}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}

function PlanCard({ plan, yearly, onHover }: { plan: (typeof PLANS)[number]; yearly: boolean; onHover: (on: boolean) => void }) {
  const price = yearly ? plan.yearly : plan.monthly;
  const href = plan.name === "Enterprise" ? "/contact" : APP_URL;
  return (
    <article
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      className={cn("relative flex flex-col overflow-hidden border p-7", plan.featured ? "border-ink bg-surface" : "border-line bg-surface")}
    >
      {plan.featured && <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-accent" />}
      <div className="flex items-center justify-between">
        <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-ink">{plan.name}</h3>
        {plan.featured && <span className="bg-accent px-2 py-0.5 text-[12px] font-semibold text-[#1d1a15]">Most popular</span>}
      </div>
      <p className="mt-1 text-[13.5px] text-ink-2">{plan.blurb}</p>
      <div className="mt-8 flex h-[56px] items-end gap-2">
        <Price value={price} />
        <span className="mb-2 text-[13px] text-ink-3">{plan.unit}</span>
      </div>
      <div className="mt-6 w-full">
        {href.startsWith("/") ? (
          <Link href={href} className={cn(buttonClass(plan.featured ? "primary" : "secondary"), "w-full")}>
            {plan.cta}
          </Link>
        ) : (
          <a href={href} className={cn(buttonClass(plan.featured ? "primary" : "secondary"), "w-full")}>
            {plan.cta}
          </a>
        )}
      </div>
      <ul className="mt-6 grid gap-2.5 border-t border-line pt-6">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2.5 text-[14px] text-ink">
            <CheckCircleIcon size={18} weight="duotone" className="shrink-0 text-ok" />
            {feature}
          </li>
        ))}
      </ul>
    </article>
  );
}

function Billing({ yearly, setYearly, className }: { yearly: boolean; setYearly: (value: boolean) => void; className?: string }) {
  return (
    <div role="tablist" aria-label="Billing period" className={cn("flex w-fit border border-ink p-1", className)}>
      {[
        { label: "Monthly", value: false },
        { label: "Yearly", value: true },
      ].map((option) => (
        <button
          key={option.label}
          type="button"
          role="tab"
          aria-selected={yearly === option.value}
          onClick={() => setYearly(option.value)}
          className={cn("relative isolate flex h-10 items-center gap-2 px-5 text-[14px] transition-colors", yearly === option.value ? "text-inverse-fg" : "text-ink-2 hover:text-ink")}
        >
          {yearly === option.value && <motion.span layoutId="billing" className="absolute inset-0 -z-10 bg-inverse" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
          {option.label}
          {option.value && <span className={cn("px-1.5 font-mono text-[10px]", yearly ? "bg-accent text-[#1d1a15]" : "bg-pill text-ink-2")}>2 months free</span>}
        </button>
      ))}
    </div>
  );
}

export function PricingPlans() {
  const [yearly, setYearly] = useState(true);
  const [active, setActive] = useState<number | null>(null);
  return (
    <section>
      <Container className="pb-24 pt-14 md:pt-20">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.05fr] lg:gap-10">
          <div className="max-w-[600px]">
            <Index>Pricing</Index>
            <h1 className="mt-5 text-balance text-[42px] font-medium leading-[1.02] tracking-[-0.05em] text-ink md:text-[60px]">Pay for seats, not for questions.</h1>
            <p className="mt-5 max-w-[520px] text-[18px] leading-relaxed text-ink-2">Start free. Pay per seat when your team grows. People who only read shared answers never pay.</p>
            <Billing yearly={yearly} setYearly={setYearly} className="mt-8" />
          </div>
          <div className="relative mx-auto aspect-[5/4] w-full max-w-[580px]">
            <PlansScene plans={PLANS} active={active} className="absolute inset-0" />
          </div>
        </div>
        <div className="mt-10 grid gap-3 lg:grid-cols-3">
          {PLANS.map((plan, index) => (
            <PlanCard key={plan.name} plan={plan} yearly={yearly} onHover={(on) => setActive(on ? index : null)} />
          ))}
        </div>
        <p className="mt-6 text-center text-[13px] text-ink-3">Viewers who only open shared answers are always free · Prices in USD</p>
      </Container>
    </section>
  );
}

function Cell({ value }: { value: boolean | string }) {
  if (typeof value === "string") return <span className="text-[13.5px] text-ink">{value}</span>;
  return value ? (
    <motion.span
      initial={{ scale: 0 }}
      whileInView={{ scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 500, damping: 18 }}
      className="inline-grid size-6 place-items-center bg-[#BFE3B4] text-[#1E5A26]"
    >
      <CheckIcon size={12} weight="bold" />
    </motion.span>
  ) : (
    <MinusIcon size={14} className="inline text-ink-4" />
  );
}

export function Comparison() {
  return (
    <Section inner="py-24">
      <SectionHeading title={<>Every plan, side by side.</>} />
      <div className="mt-10 overflow-hidden border border-line bg-surface">
        <div className="grid grid-cols-[1.6fr_repeat(3,1fr)] border-b border-line bg-surface-2 px-6 py-4 text-[13px] font-medium text-ink">
          <span className="text-ink-3">Features</span>
          {PLANS.map((plan) => (
            <span key={plan.name} className="text-center">
              {plan.name}
            </span>
          ))}
        </div>
        {COMPARISON.map((group) => (
          <div key={group.group}>
            <div className="border-b border-line-soft px-6 pb-2 pt-6 text-[13px] font-medium text-ink">{group.group}</div>
            {group.rows.map((row) => (
              <div key={row.label} className="grid grid-cols-[1.6fr_repeat(3,1fr)] items-center border-b border-line-soft px-6 py-3.5 transition-colors last:border-b-0 hover:bg-hover">
                <span className="text-[14px] text-ink-2">{row.label}</span>
                {row.values.map((value, index) => (
                  <span key={index} className="text-center">
                    <Cell value={value} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </Section>
  );
}

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Section inner="grid gap-10 py-24 lg:grid-cols-[1fr_1.4fr]">
      <SectionHeading title={<>Questions, answered.</>} description="Something else on your mind? Our team replies within a business day." />
      <ul className="divide-y divide-line-soft overflow-hidden border border-line bg-surface">
        {FAQS.map((faq, index) => {
          const expanded = open === index;
          return (
            <li key={faq.q}>
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : index)}
                className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left text-[15.5px] font-medium text-ink"
              >
                {faq.q}
                <motion.span
                  animate={{ rotate: expanded ? 45 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  className={cn("grid size-7 shrink-0 place-items-center  border", expanded ? "border-inverse bg-inverse text-inverse-fg" : "border-line text-ink-2")}
                >
                  <PlusIcon size={13} weight="bold" />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 32 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-6 text-[14.5px] leading-relaxed text-ink-2">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
