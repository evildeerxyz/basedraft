"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { PLANS } from "@/lib/content/pricing";
import { cn } from "@/lib/site";
import { SectionLabel, buttonClass } from "../ui/primitives";
import { DitherReveal, FadeIn, RevealText } from "../ui/reveal";
import { SmartLink } from "../ui/smart-link";

type Billing = "monthly" | "yearly";

export function Pricing() {
  return (
    <section id="pricing" className="bg-paper py-24 text-ink md:py-32">
      <div className="container-x">
        <SectionLabel index="04">Pricing</SectionLabel>
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <h2 className="type-display text-[clamp(2.5rem,6vw,5.5rem)] lg:col-span-8">
            <RevealText lines={["Pay for agents,", "not for typing."]} />
          </h2>
          <FadeIn delay={0.2} className="self-end lg:col-span-4">
            <p className="max-w-[40ch] text-[17px] leading-[1.55] text-ink/60">
              Tab runs on your machine, so it’s free and unlimited on every plan. You only pay when agents do work for
              you.
            </p>
          </FadeIn>
        </div>
        <PricingPlans className="mt-14" />
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 font-mono text-[12px] text-ink/45">
          <p>Students and open-source maintainers get Pro free.</p>
          <SmartLink href="/pricing" className="text-ink underline decoration-ink/25 underline-offset-4 transition-colors hover:decoration-ink">
            Compare every feature
          </SmartLink>
        </div>
      </div>
    </section>
  );
}

/** Billing toggle and the three plan columns. */
export function PricingPlans({ className }: { className?: string }) {
  const [billing, setBilling] = useState<Billing>("yearly");

  return (
    <div className={className}>
      <FadeIn className="flex items-center gap-4">
        <div role="radiogroup" aria-label="Billing period" className="relative flex rounded-[7px] bg-ink/[0.06] p-1">
          {(["monthly", "yearly"] as const).map((b) => (
            <button
              key={b}
              type="button"
              role="radio"
              aria-checked={billing === b}
              onClick={() => setBilling(b)}
              className={cn(
                "relative z-10 h-8 px-4 text-[13.5px] capitalize transition-colors",
                billing === b ? "text-paper" : "text-ink/55 hover:text-ink",
              )}
            >
              {billing === b && (
                <motion.span
                  layoutId="billing"
                  className="absolute inset-0 -z-10 rounded-[5px] bg-ink"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.45 }}
                />
              )}
              {b}
            </button>
          ))}
        </div>
        <span className="font-mono text-[12px] text-ink/50">Yearly saves 20%</span>
      </FadeIn>

      <div className="mt-8 grid grid-cols-1 border border-ink/12 lg:grid-cols-3">
        {PLANS.map((plan, i) => {
          const price = plan.price[billing];
          const card = (
            <div
              className={cn(
                "relative flex h-full flex-col p-7 md:p-8",
                plan.featured ? "bg-ink text-paper" : "bg-paper",
                i > 0 && !plan.featured && "border-t border-ink/12 lg:border-l lg:border-t-0",
              )}
            >
              {plan.featured && <span className="absolute inset-x-0 top-0 h-[3px] bg-accent" />}
              <div className="flex items-baseline justify-between">
                <h3 className="type-title text-[26px]">{plan.name}</h3>
                {plan.featured && <span className="type-label text-accent">Recommended</span>}
              </div>
              <p className={cn("mt-2 text-[14.5px]", plan.featured ? "text-fog" : "text-ink/55")}>{plan.blurb}</p>

              <div className="mt-10 flex items-end gap-2">
                <span className="font-dot text-[64px] font-[800] leading-[0.8]">$</span>
                <span className="relative inline-flex h-[56px] overflow-hidden">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={price}
                      initial={{ y: "100%" }}
                      animate={{ y: "0%" }}
                      exit={{ y: "-100%" }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      className="font-dot text-[64px] font-[800] leading-[0.88]"
                    >
                      {price}
                    </motion.span>
                  </AnimatePresence>
                </span>
                <span className={cn("pb-1 font-mono text-[12px]", plan.featured ? "text-mute" : "text-ink/45")}>
                  {price === 0 ? "forever" : `/ month${plan.unit ? `, ${plan.unit}` : ""}`}
                </span>
              </div>
              <p className={cn("mt-2 h-4 font-mono text-[11.5px]", plan.featured ? "text-mute" : "text-ink/45")}>
                {price > 0 && (billing === "yearly" ? `$${price * 12} billed yearly` : "billed monthly")}
              </p>

              <ul className={cn("mt-8 space-y-3 border-t pt-6 text-[14.5px]", plan.featured ? "border-paper/10" : "border-ink/10")}>
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <CheckIcon
                      size={15}
                      weight="bold"
                      className={cn("mt-0.5 shrink-0", plan.featured ? "text-accent" : "text-ink/45")}
                    />
                    <span className={plan.featured ? "text-paper/85" : "text-ink/80"}>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-10">
                <SmartLink href={plan.href} className={cn(buttonClass(plan.featured ? "accent" : "dark", "lg"), "w-full")}>
                  {plan.cta}
                </SmartLink>
              </div>
            </div>
          );
          return plan.featured ? (
            <DitherReveal key={plan.name} scale={4} duration={1000}>
              {card}
            </DitherReveal>
          ) : (
            <div key={plan.name}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}
