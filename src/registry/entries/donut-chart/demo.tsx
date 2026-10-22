"use client";

import type { ComponentType } from "react";
import { DonutChart } from "../../pro-ui/donut-chart";

/* October's sales by product: the plans bring in most of it, the templates the rest. */
const SALES = [
  { label: "Pro", value: 8940 },
  { label: "Team", value: 6380 },
  { label: "Zuno", value: 2840 },
  { label: "Noma", value: 1910 },
  { label: "Auren", value: 1170 },
];

export function Demo() {
  return (
    <div className="w-full max-w-[560px] rounded-[20px] bg-[var(--bd-surface)] p-4 shadow-[0_0_0_1px_var(--bd-line),0_1px_2px_rgb(var(--bd-ink)/0.04)] sm:p-5">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] text-[var(--bd-muted)]">Sales by product</p>
          <p className="mt-0.5 text-[15px] font-medium text-[var(--bd-fg)]">October 2026</p>
        </div>
        <span className="mb-0.5 shrink-0 rounded-full bg-[var(--bd-ui-track)] px-2 py-0.5 text-xs font-medium tabular-nums text-[var(--bd-fg)]">+11%</span>
      </div>
      <DonutChart data={SALES} format="currency" size={200} centerLabel="Revenue" title="Sales by product, October 2026" dataTable />
    </div>
  );
}

const USERS = [
  { label: "Free", value: 18420 },
  { label: "Pro", value: 2310 },
  { label: "Team", value: 860 },
];

function Basic() {
  return <DonutChart data={USERS} format="compact" centerLabel="Users" title="Users by plan" className="max-w-[520px]" />;
}

function LegendBottom() {
  return <DonutChart data={USERS} format="compact" size={180} legend="bottom" centerLabel="Users" title="Users by plan" className="max-w-[320px]" />;
}

/* A Team license: who holds the seats, and how many are still open. */
const SEATS = [
  { label: "Designers", value: 4 },
  { label: "Engineers", value: 3 },
  { label: "Open", value: 3, color: "var(--bd-ui-track)" },
];

function CustomCenter() {
  return <DonutChart data={SEATS} centerValue={7} centerLabel="of 10 seats" size={180} thickness={18} gap={4} title="Seats on your Team license" className="max-w-[480px]" />;
}

function Loading() {
  return <DonutChart data={[]} loading title="Sales by product" className="max-w-[520px]" />;
}

export const examples: Record<string, ComponentType> = { basic: Basic, "legend-bottom": LegendBottom, "custom-center": CustomCenter, loading: Loading };
