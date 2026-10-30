"use client";

import { CheckerboardIcon, DotsNineIcon, GradientIcon, LineSegmentsIcon, SquareIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { BarChart, type ChartPattern } from "../../pro-ui/bar-chart";
import { Select } from "../../ui/select";

/* Templates sold each month over a year: a slow climb, a dip in the summer, and the Zuno launch in October. */
const YEAR = [
  ["Nov", 38], ["Dec", 44], ["Jan", 41], ["Feb", 52], ["Mar", 58], ["Apr", 55],
  ["May", 63], ["Jun", 59], ["Jul", 51], ["Aug", 66], ["Sep", 74], ["Oct", 96],
].map(([month, sold]) => ({ month: month as string, sold: sold as number }));
const SOLD = YEAR.reduce((t, m) => t + m.sold, 0);

/* Template sales by month, by template, for the grouped and stacked examples. */
const SALES = [
  { month: "May", zuno: 42, noma: 28, auren: 19 },
  { month: "Jun", zuno: 48, noma: 31, auren: 24 },
  { month: "Jul", zuno: 45, noma: 34, auren: 22 },
  { month: "Aug", zuno: 57, noma: 38, auren: 27 },
  { month: "Sep", zuno: 61, noma: 52, auren: 30 },
  { month: "Oct", zuno: 68, noma: 59, auren: 35 },
];

/* The fills a visitor can try on the stage. */
const FILLS = [
  { value: "dither", label: "Dither", icon: <CheckerboardIcon weight="duotone" /> },
  { value: "dots", label: "Dots", icon: <DotsNineIcon weight="duotone" /> },
  { value: "lines", label: "Lines", icon: <LineSegmentsIcon weight="duotone" /> },
  { value: "gradient", label: "Gradient", icon: <GradientIcon weight="duotone" /> },
  { value: "solid", label: "Solid", icon: <SquareIcon weight="duotone" /> },
];

/** A year of sales as bars on faint tracks, dithered, with a switch for the other fills. */
export function Demo() {
  const [fill, setFill] = useState<Exclude<ChartPattern, "none">>("dither");
  return (
    <div className="w-full max-w-[720px]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] text-[var(--bd-muted)]">Templates sold, last 12 months</p>
          <div className="mt-1 flex items-baseline gap-2.5">
            <span className="text-[30px] font-semibold leading-none tabular-nums tracking-[-0.03em] text-[var(--bd-fg)]">{SOLD}</span>
          <span className="inline-flex items-center rounded-full bg-[color-mix(in_oklab,var(--bd-ui-ok)_14%,var(--bd-surface))] px-2 py-0.5 text-xs font-medium tabular-nums text-[color-mix(in_oklab,var(--bd-ui-ok)_80%,var(--bd-fg))]">+31%</span>
          </div>
        </div>
        {/* The fill switch shows on the component's own stage; a gallery tile shows the chart alone. */}
        <div className="hidden [[data-bd-stage]_&]:block">
          <Select size="sm" label="Fill" options={FILLS} value={fill} onValueChange={(v) => setFill(v as typeof fill)} className="w-[150px]!" />
        </div>
      </div>
      <BarChart data={YEAR} x="month" series={[{ key: "sold", label: "Sold" }]} height={210} track pattern={fill} radius={4} grid={false} yAxis={false} title="Templates sold, last 12 months" dataTable />
    </div>
  );
}

const SIGNUPS = [
  { country: "United States", signups: 1284 },
  { country: "United Kingdom", signups: 612 },
  { country: "Germany", signups: 488 },
  { country: "Australia", signups: 431 },
  { country: "India", signups: 397 },
  { country: "Brazil", signups: 256 },
  { country: "Japan", signups: 173 },
];

function Horizontal() {
  return <BarChart pattern="dither" data={SIGNUPS} x="country" series={[{ key: "signups", label: "Signups" }]} layout="horizontal" valueLabels title="Signups by country" className="max-w-[560px]" />;
}

const BY_PLAN = [
  { month: "May", pro: 4600, team: 4500, templates: 3700 },
  { month: "Jun", pro: 5000, team: 5100, templates: 4000 },
  { month: "Jul", pro: 4900, team: 4900, templates: 3800 },
  { month: "Aug", pro: 5600, team: 5800, templates: 4500 },
  { month: "Sep", pro: 6100, team: 6400, templates: 4900 },
  { month: "Oct", pro: 6500, team: 7100, templates: 5300 },
];

function Grouped() {
  return (
    <BarChart
      pattern="dither"
      data={SALES}
      x="month"
      series={[
        { key: "zuno", label: "Zuno" },
        { key: "noma", label: "Noma" },
        { key: "auren", label: "Auren" },
      ]}
      height={220}
      title="Sales by template, last 6 months"
      className="max-w-[640px]"
    />
  );
}

function Stacked() {
  return (
    <BarChart
      pattern="dither"
      data={BY_PLAN}
      x="month"
      series={[
        { key: "pro", label: "Pro" },
        { key: "team", label: "Team" },
        { key: "templates", label: "Templates" },
      ]}
      stacked
      valueLabels
      format="currency"
      title="Revenue by plan"
      className="max-w-[640px]"
    />
  );
}

/* Seats on Team licenses each week: added above the line, removed below it. */
const SEATS = [
  { week: "Sep 1", added: 18, removed: -4 },
  { week: "Sep 8", added: 22, removed: -7 },
  { week: "Sep 15", added: 31, removed: -5 },
  { week: "Sep 22", added: 17, removed: -11 },
  { week: "Sep 29", added: 24, removed: -6 },
  { week: "Oct 6", added: 27, removed: -9 },
  { week: "Oct 13", added: 35, removed: -8 },
];

function Negative() {
  return (
    <BarChart
      pattern="dither"
      data={SEATS}
      x="week"
      series={[
        { key: "added", label: "Added" },
        { key: "removed", label: "Removed", color: "oklch(70% 0.012 265)" },
      ]}
      stacked
      title="Team seats added and removed"
      className="max-w-[640px]"
    />
  );
}

function Loading() {
  return <BarChart pattern="dither" data={[]} x="month" series={[{ key: "sales", label: "Sales" }]} loading title="Sales" className="max-w-[640px]" />;
}

export const examples: Record<string, ComponentType> = { grouped: Grouped, horizontal: Horizontal, stacked: Stacked, negative: Negative, loading: Loading };
