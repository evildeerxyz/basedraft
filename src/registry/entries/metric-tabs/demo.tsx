"use client";

import type { ComponentType } from "react";
import { AreaChart } from "../../ui/area-chart";
import { MetricTabs, type Metric } from "../../ui/metric-tabs";

const METRICS: Metric[] = [
  { id: "visitors", label: "Visitors", value: 182_400, format: "compact", delta: 0.142, note: "Last 30 days" },
  { id: "signups", label: "Sign-ups", value: 3_912, delta: 0.081, note: "2.1% of visitors" },
  { id: "bounce", label: "Bounce rate", value: 0.384, format: "percent", delta: -0.046, good: "down", note: "Lower is better" },
];

const wave = (base: number, swing: number, seed: number) => Array.from({ length: 30 }, (_, i) => Math.round(base + swing * Math.sin(i / 3 + seed) + (base * i) / 120 - (i % 7 > 4 ? base * 0.18 : 0)));
const SERIES: Record<string, number[]> = { visitors: wave(6000, 900, 0), signups: wave(130, 22, 1), bounce: wave(40, 3, 2) };
const DAYS = Array.from({ length: 30 }, (_, i) => ({ day: `Oct ${i + 1}`, visitors: SERIES.visitors[i], signups: SERIES.signups[i], bounce: SERIES.bounce[i] / 100 }));

export function Demo() {
  return (
    <div className="w-full max-w-[640px]">
      <MetricTabs metrics={METRICS}>{(m) => <AreaChart data={DAYS} x="day" series={[{ key: m.id, label: m.label, color: "var(--bd-fg)" }]} format={m.format === "percent" ? "percent" : "compact"} height={180} pattern="gradient" yAxis={false} legend={false} title={`${m.label}, last 30 days`} />}</MetricTabs>
    </div>
  );
}

function Plain() {
  return (
    <div className="w-full max-w-[560px]">
      <MetricTabs metrics={METRICS} />
    </div>
  );
}

export const examples: Record<string, ComponentType> = { plain: Plain };
