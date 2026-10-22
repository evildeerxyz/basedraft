"use client";

import { CheckerboardIcon, DotsNineIcon, GradientIcon, LineSegmentsIcon, ProhibitIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { AreaChart, type ChartPattern } from "../../pro-ui/area-chart";
import { RollingNumber } from "../../ui/number";
import { Segmented } from "../../ui/segmented";
import { Select } from "../../ui/select";

/* The same numbers every time: a small seeded generator, so the server and each visit agree. */
function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Days back from Oct 21, 2026, at noon UTC so they read as the same day anywhere. */
const day = (back: number) => new Date(Date.UTC(2026, 9, 21 - back, 12));

/*
 * Visits to a basedraft site over 90 days: a slow climb, softer weekends, and the Zuno launch,
 * smoothed over three days the way an analytics page shows them, so the line reads as a trend.
 */
const VISITS = (() => {
  const rand = seeded(7);
  const raw = Array.from({ length: 92 }, (_, i) => {
    const weekend = Math.sin(((i + 2) / 7) * Math.PI * 2) * 0.06;
    const launch = i >= 34 ? 0.3 * Math.exp(-(i - 34) * 0.08) : 0;
    return (1240 + i * 10.5) * (1 + weekend + launch) * (0.97 + rand() * 0.06);
  });
  return Array.from({ length: 90 }, (_, i) => ({ date: day(89 - i), visitors: Math.round((raw[i] + raw[i + 1] + raw[i + 2]) / 3) }));
})();

const RANGES = [
  { value: "7", label: "7D" },
  { value: "30", label: "30D" },
  { value: "90", label: "90D" },
];
/* The fills a visitor can try on the stage. */
const FILLS = [
  { value: "dither", label: "Dither", icon: <CheckerboardIcon weight="duotone" /> },
  { value: "dots", label: "Dots", icon: <DotsNineIcon weight="duotone" /> },
  { value: "lines", label: "Lines", icon: <LineSegmentsIcon weight="duotone" /> },
  { value: "gradient", label: "Gradient", icon: <GradientIcon weight="duotone" /> },
  { value: "none", label: "None", icon: <ProhibitIcon weight="duotone" /> },
];
const when = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** Daily visitors, with the figure above following the pointer along the line. */
export function Demo() {
  const [range, setRange] = useState("30");
  const [at, setAt] = useState<number | null>(null);
  const [fill, setFill] = useState<ChartPattern>("dither");
  const data = VISITS.slice(-Number(range));
  const point = data[at ?? data.length - 1];
  const change = point.visitors / data[0].visitors - 1;
  return (
    <div className="w-full max-w-[720px]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] text-[var(--bd-muted)]">
            Visitors, <span className="tabular-nums">{at === null ? "today" : when.format(point.date)}</span>
          </p>
          <div className="mt-1 flex items-baseline gap-2.5">
            <RollingNumber value={point.visitors} rollIn={false} className="text-[30px] font-semibold leading-none tracking-[-0.03em] text-[var(--bd-fg)]" />
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${change >= 0 ? "bg-[color-mix(in_oklab,var(--bd-ui-ok)_14%,var(--bd-surface))] text-[color-mix(in_oklab,var(--bd-ui-ok)_80%,var(--bd-fg))]" : "bg-[color-mix(in_oklab,var(--bd-ui-stop)_12%,var(--bd-surface))] text-[color-mix(in_oklab,var(--bd-ui-stop)_80%,var(--bd-fg))]"}`}>
              {change >= 0 ? "+" : ""}
              {(change * 100).toFixed(1)}%
            </span>
          </div>
        </div>
        {/* The range and the fill side by side; the fill only on the component's own stage. */}
        <div className="flex items-center gap-2">
          <Segmented size="sm" label="Range" options={RANGES} value={range} onValueChange={(v) => (setRange(v), setAt(null))} />
          <div className="hidden [[data-bd-stage]_&]:block">
            <Select size="sm" label="Fill" options={FILLS} value={fill} onValueChange={(v) => setFill(v as typeof fill)} className="w-[150px]!" />
          </div>
        </div>
      </div>
      <AreaChart
        data={data}
        x="date"
        series={[{ key: "visitors", label: "Visitors" }]}
        formatX={(v) => when.format(v as Date)}
        format="compact"
        height={220}
        yAxis={false}
        pattern={fill}
        live
        onActiveChange={setAt}
        title={`Visitors, last ${range} days`}
        dataTable
      />
    </div>
  );
}

const MONTHS = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];

const REVENUE = [8200, 9100, 8700, 10400, 11900, 11300, 12800, 14100, 13600, 15900, 17400, 18900].map((revenue, i) => ({ month: MONTHS[i], revenue }));

function Single() {
  return <AreaChart pattern="dither" data={REVENUE} x="month" series={[{ key: "revenue", label: "Revenue" }]} format="currency" title="Revenue, last 12 months" className="max-w-[640px]" />;
}

const BY_PLAN = [
  [3100, 2600, 2500],
  [3400, 2900, 2800],
  [3300, 2900, 2500],
  [3900, 3500, 3000],
  [4300, 4100, 3500],
  [4200, 3900, 3200],
  [4600, 4500, 3700],
  [5000, 5100, 4000],
  [4900, 4900, 3800],
  [5600, 5800, 4500],
  [6100, 6400, 4900],
  [6500, 7100, 5300],
].map(([pro, team, templates], i) => ({ month: MONTHS[i], pro, team, templates }));

function Stacked() {
  return (
    <AreaChart
      pattern="dither"
      data={BY_PLAN}
      x="month"
      series={[
        { key: "pro", label: "Pro" },
        { key: "team", label: "Team" },
        { key: "templates", label: "Templates" },
      ]}
      stacked
      format="currency"
      title="Revenue by plan"
      className="max-w-[640px]"
    />
  );
}

/* Page views every day of a year: 365 points, and the crosshair still keeps up. */
const YEAR = (() => {
  const rand = seeded(42);
  return Array.from({ length: 365 }, (_, i) => {
    const date = day(364 - i);
    const season = 1 + 0.18 * Math.sin((i / 365) * Math.PI * 2 - 1.2);
    return { date, views: Math.round((5200 + i * 22) * season * (0.85 + rand() * 0.3)) };
  });
})();

function Year() {
  return <AreaChart pattern="dither" data={YEAR} x="date" series={[{ key: "views", label: "Page views" }]} format="compact" height={240} title="Page views this year" className="max-w-[720px]" />;
}

function Loading() {
  return <AreaChart pattern="dither" data={[]} x="date" series={[{ key: "visitors", label: "Visitors" }]} loading title="Visitors" className="max-w-[640px]" />;
}

function Empty() {
  return <AreaChart pattern="dither" data={[]} x="date" series={[{ key: "visitors", label: "Visitors" }]} empty="No visits yet. Share your draft and they'll show up here." title="Visitors" className="max-w-[640px]" />;
}

export const examples: Record<string, ComponentType> = { single: Single, stacked: Stacked, year: Year, loading: Loading, empty: Empty };
