"use client";

import { ArrowUpRightIcon, CheckIcon } from "@phosphor-icons/react";
import { LayoutGroup, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { cn, EASE_OUT } from "@/lib/utils";
import { RollingNumber } from "../ui/RollingNumber";
import { SectionTitle } from "../ui/Section";

export const PLANS = [
  {
    name: "Basic",
    tagline: "Build the habit.",
    monthly: 0,
    yearly: 0,
    cta: "Start for free",
    href: "/signup",
    features: ["Fractional shares from $1", "Round-ups and recurring deposits", "Weekly Copilot insights", "3.60% APY on cash"],
  },
  {
    name: "Plus",
    tagline: "The full autopilot.",
    monthly: 8,
    yearly: 6,
    cta: "Try 30 days free",
    href: "/signup",
    badge: "Most popular",
    features: [
      "Everything in Basic",
      "Autopilot rebalancing",
      "Daily tax-loss harvesting",
      "Unlimited Copilot chat",
      "4.10% APY on cash",
      "Risk radar and stress tests",
    ],
  },
  {
    name: "Private",
    tagline: "For portfolios over $100K.",
    monthly: 29,
    yearly: 24,
    cta: "Talk to an adviser",
    href: "/contact",
    features: ["Everything in Plus", "Direct indexing on 500+ stocks", "A dedicated CFP® professional", "Estate and tax planning", "Priority 24/7 support"],
  },
];

/** Billing toggle + the three plan cards. Used on the home page and on /pricing. */
export function PricingPlans() {
  const [yearly, setYearly] = useState(true);
  return (
    <div>
      <div className="flex justify-start lg:justify-end">
          <LayoutGroup id="billing">
            <div className="inline-flex items-center gap-1 rounded-[12px] border border-white/10 bg-white/[0.03] p-1">
              {[
                { k: false, l: "Monthly" },
                { k: true, l: "Yearly" },
              ].map((o) => (
                <button
                  key={o.l}
                  onClick={() => setYearly(o.k)}
                  aria-pressed={yearly === o.k}
                  className={cn("relative flex h-9 items-center gap-2 rounded-[9px] px-4 text-[16px] font-medium transition-colors", yearly === o.k ? "text-ink" : "text-white/60 hover:text-white")}
                >
                  {yearly === o.k && <motion.span layoutId="billing-pill" className="absolute inset-0 rounded-[9px] bg-paper" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                  <span className="relative">{o.l}</span>
                  {o.k && <span className={cn("relative text-[15px] tabular-nums", yearly ? "text-ink/60" : "text-accent")}>−25%</span>}
                </button>
              ))}
            </div>
          </LayoutGroup>
      </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {PLANS.map((p, i) => {
            const hot = Boolean(p.badge);
            const price = yearly ? p.yearly : p.monthly;
            return (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: EASE_OUT }}
                whileHover={{ y: -8 }}
                className={cn(
                  "relative isolate flex flex-col overflow-hidden rounded-[20px] p-8",
                  hot ? "bg-lime text-ink" : "border border-white/[0.08] bg-ink-2",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[18px] font-semibold">{p.name}</span>
                  {p.badge && <span className="text-[17px] font-medium text-ink/60">{p.badge}</span>}
                </div>
                <div className={cn("mt-1 text-[16px]", hot ? "text-ink/60" : "text-white/60")}>{p.tagline}</div>
                <div className="mt-8 flex items-end gap-1.5">
                  <span className="text-[64px] font-semibold leading-none tracking-[-0.05em]">
                    <RollingNumber value={`$${price}`} />
                  </span>
                  <span className={cn("mb-2 text-[16px]", hot ? "text-ink/60" : "text-white/60")}>/mo</span>
                </div>
                <div className={cn("mt-2 h-5 text-[15px]", hot ? "text-ink/60" : "text-white/60")}>
                  {price === 0 ? "Free forever" : yearly ? `Billed $${price * 12} yearly` : "Billed monthly"}
                </div>
                <Link
                  href={p.href}
                  className={cn(
                    "group mt-8 flex h-12 items-center justify-center gap-2 rounded-[12px] text-[17px] font-medium transition-all",
                    hot ? "bg-ink text-paper hover:bg-ink/90" : "bg-white/[0.06] text-white hover:bg-white/[0.1]",
                  )}
                >
                  {p.cta}
                  <ArrowUpRightIcon size={15} weight="bold" className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
                <ul className="mt-9 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-[16px]">
                      <CheckIcon size={15} weight="bold" className={cn("mt-0.5 shrink-0", hot ? "text-ink" : "text-accent")} />
                      <span className={hot ? "text-ink/85" : "text-white/75"}>{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
    </div>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className="relative mx-auto max-w-[1280px] scroll-mt-20 px-5 py-32 lg:px-8">
      <div>
        <SectionTitle lead="Simple pricing." tail="No surprises." />
        <p className="mt-7 max-w-[520px] text-[19px] leading-relaxed text-white/70 sm:text-[20px]">No commissions, no account minimums, no payment for order flow. Upgrade or cancel anytime.</p>
      </div>
      <div className="mt-10">
        <PricingPlans />
      </div>
      <p className="mt-6 text-[16px] text-white/60">
        Compare every feature on the{" "}
        <Link href="/pricing" className="text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">
          pricing page
        </Link>
        .
      </p>
    </section>
  );
}
