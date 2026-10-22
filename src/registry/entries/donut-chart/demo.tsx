"use client";

import { CheckerboardIcon, DotsNineIcon, LineSegmentsIcon, SquareIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { DonutChart, type DonutPattern } from "../../pro-ui/donut-chart";
import { Select } from "../../ui/select";

/* October's sales by product: the plans bring in most of it, the templates the rest. */
const SALES = [
  { label: "Pro", value: 8940 },
  { label: "Team", value: 6380 },
  { label: "Zuno", value: 2840 },
  { label: "Noma", value: 1910 },
  { label: "Auren", value: 1170 },
];

/* The fills a visitor can try on the stage. */
const FILLS = [
  { value: "dither", label: "Dither", icon: <CheckerboardIcon weight="duotone" /> },
  { value: "dots", label: "Dots", icon: <DotsNineIcon weight="duotone" /> },
  { value: "lines", label: "Lines", icon: <LineSegmentsIcon weight="duotone" /> },
  { value: "solid", label: "Solid", icon: <SquareIcon weight="duotone" /> },
];

export function Demo() {
  const [fill, setFill] = useState<DonutPattern>("dither");
  return (
    <div className="w-full max-w-[560px]">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] text-[var(--bd-muted)]">Sales by product</p>
          <p className="mt-0.5 text-[15px] font-medium text-[var(--bd-fg)]">October 2026</p>
        </div>
        <span className="mb-0.5 shrink-0 rounded-full bg-[var(--bd-ui-track)] px-2 py-0.5 text-xs font-medium tabular-nums text-[var(--bd-fg)]">+11%</span>
        {/* The fill switch shows on the component's own stage; a gallery tile shows the chart alone. */}
        <div className="hidden w-full justify-end [[data-bd-stage]_&]:flex">
          <Select size="sm" label="Fill" options={FILLS} value={fill} onValueChange={(v) => setFill(v as typeof fill)} className="w-[150px]!" />
        </div>
      </div>
      <DonutChart data={SALES} format="currency" size={200} centerLabel="Revenue" pattern={fill} title="Sales by product, October 2026" dataTable />
    </div>
  );
}

const USERS = [
  { label: "Free", value: 18420 },
  { label: "Pro", value: 2310 },
  { label: "Team", value: 860 },
];

function Basic() {
  return <DonutChart pattern="dither" data={USERS} format="compact" centerLabel="Users" title="Users by plan" className="max-w-[520px]" />;
}

function LegendBottom() {
  return <DonutChart pattern="dither" data={USERS} format="compact" size={180} legend="bottom" centerLabel="Users" title="Users by plan" className="max-w-[320px]" />;
}

/* A Team license: who holds the seats, and how many are still open. */
const SEATS = [
  { label: "Designers", value: 4 },
  { label: "Engineers", value: 3 },
  { label: "Open", value: 3, color: "var(--bd-ui-track)" },
];

function CustomCenter() {
  return <DonutChart pattern="dither" data={SEATS} centerValue={7} centerLabel="of 10 seats" size={180} thickness={18} gap={4} title="Seats on your Team license" className="max-w-[480px]" />;
}

function Loading() {
  return <DonutChart pattern="dither" data={[]} loading title="Sales by product" className="max-w-[520px]" />;
}

export const examples: Record<string, ComponentType> = { basic: Basic, "legend-bottom": LegendBottom, "custom-center": CustomCenter, loading: Loading };
