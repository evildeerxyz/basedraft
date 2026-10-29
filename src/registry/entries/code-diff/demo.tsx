"use client";

import type { ComponentType } from "react";
import { CodeDiff } from "../../pro-ui/code-diff";

const PRICE_BEFORE = `import { formatMoney } from "./money";

export type Plan = { name: string; monthly: number };

/** The price a plan shows, by the month. */
export function priceOf(plan: Plan) {
  return formatMoney(plan.monthly);
}

export function yearlyOf(plan: Plan) {
  return plan.monthly * 12;
}

export function savingOf(plan: Plan) {
  const full = plan.monthly * 12;
  return full - yearlyOf(plan);
}

export const PLANS: Plan[] = [
  { name: "Free", monthly: 0 },
  { name: "Pro", monthly: 12 },
  { name: "Team", monthly: 30 },
];
`;

const PRICE_AFTER = `import { formatMoney } from "./money";

export type Plan = { name: string; monthly: number; seats?: number };

/** The price a plan shows, by the month or by the year. */
export function priceOf(plan: Plan, cycle: "month" | "year" = "month") {
  return formatMoney(cycle === "year" ? yearlyOf(plan) / 12 : plan.monthly);
}

/** A year paid at once: two months free. */
export function yearlyOf(plan: Plan) {
  return plan.monthly * 10;
}

export function savingOf(plan: Plan) {
  const full = plan.monthly * 12;
  return full - yearlyOf(plan);
}

export const PLANS: Plan[] = [
  { name: "Free", monthly: 0 },
  { name: "Pro", monthly: 12 },
  { name: "Team", monthly: 30, seats: 5 },
];
`;

export function Demo() {
  return <CodeDiff filename="src/lib/pricing.ts" before={PRICE_BEFORE} after={PRICE_AFTER} className="w-full max-w-[720px]" />;
}

const CSS_BEFORE = `.button {
  height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  background: #111;
  color: white;
}

.button:hover {
  background: #222;
}
`;

const CSS_AFTER = `.button {
  height: 40px;
  padding: 0 18px;
  border-radius: 999px;
  background: linear-gradient(#2a2a2e, #111);
  color: white;
}

.button:hover {
  filter: brightness(1.15);
}

.button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
`;

function Split() {
  return <CodeDiff filename="styles/button.css" before={CSS_BEFORE} after={CSS_AFTER} defaultView="split" className="w-full max-w-[860px]" />;
}

const NAV_BEFORE = `export function Nav() {
  return (
    <nav className="flex gap-4">
      <a href="/">Home</a>
      <a href="/pricing">Pricing</a>
    </nav>
  );
}
`;

const NAV_AFTER = `export function SiteNav({ current }: { current: string }) {
  return (
    <nav aria-label="Main" className="flex gap-4">
      <a href="/" aria-current={current === "/" ? "page" : undefined}>Home</a>
      <a href="/pricing" aria-current={current === "/pricing" ? "page" : undefined}>Pricing</a>
    </nav>
  );
}
`;

function Renamed() {
  return <CodeDiff oldFilename="components/nav.tsx" filename="components/site-nav.tsx" before={NAV_BEFORE} after={NAV_AFTER} collapsible dither={false} className="w-full max-w-[720px]" />;
}

export const examples: Record<string, ComponentType> = { split: Split, renamed: Renamed };
